require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const cron = require("node-cron");

// ─────────────────────────────────────────────
//  LOGGER CONFIG
// ─────────────────────────────────────────────
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" }),
    ],
});

// ─────────────────────────────────────────────
//  CONFIG & CONSTANTS
// ─────────────────────────────────────────────
const CONFIG = {
    TOKEN: process.env.WHATSAPP_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    VERIFY_TOKEN: process.env.VERIFY_TOKEN || "mytoken123",
    PORT: process.env.PORT || 3000,
    MAX_BOOKINGS_PER_DAY: 3,
    SESSION_TTL: 30 * 60 * 1000,
    BUSINESS_NAME: "HealthCare Clinic",
    SUPPORT_PHONE: "+91-9999999999"
};

const DEPARTMENTS = {
    General:   { doctors: ["Dr. Mehta", "Dr. Shah"], emoji: "🩺" },
    Dentist:   { doctors: ["Dr. Patel", "Dr. Joshi"], emoji: "🦷" },
    Surgeon:   { doctors: ["Dr. Rao", "Dr. Nair"], emoji: "🔪" },
    Pediatric: { doctors: ["Dr. Gupta", "Dr. Verma"], emoji: "👶" },
    Cardiology:{ doctors: ["Dr. Desai", "Dr. Reddy"], emoji: "❤️" },
};

const ALL_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

// ─────────────────────────────────────────────
//  DATABASE & STATE
// ─────────────────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const userSessions = new Map();
const processedMsgs = new Set();

const getSession = (phone) => {
    if (!userSessions.has(phone)) userSessions.set(phone, { step: "IDLE", data: {}, lastActivity: Date.now() });
    return userSessions.get(phone);
};

// ─────────────────────────────────────────────
//  APP SETUP
// ─────────────────────────────────────────────
const app = express();
app.use(express.json());

// Webhook Verification
app.get("/webhook", (req, res) => {
    if (req.query["hub.verify_token"] === CONFIG.VERIFY_TOKEN) return res.send(req.query["hub.challenge"]);
    res.sendStatus(403);
});

// Main Webhook
app.post("/webhook", async (req, res) => {
    // 1. STOP RETRY STORM: Respond 200 OK immediately
    res.status(200).send("EVENT_RECEIVED");

    try {
        const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
        if (!entry || !entry.messages) return;

        const msg = entry.messages[0];

        // 2. DEDUPLICATION: Avoid processing retries that got through
        if (processedMsgs.has(msg.id)) return;
        processedMsgs.add(msg.id);
        setTimeout(() => processedMsgs.delete(msg.id), 60000); 

        const phone = msg.from;
        const session = getSession(phone);
        session.lastActivity = Date.now();

        const text = msg.type === "interactive" 
            ? (msg.interactive.button_reply?.id || msg.interactive.list_reply?.id) 
            : (msg.text?.body || "").trim();

        await handleFlow(phone, text);
    } catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
    }
});

// ─────────────────────────────────────────────
//  CORE FLOW ROUTER
// ─────────────────────────────────────────────
async function handleFlow(phone, text) {
    const session = getSession(phone);
    const cmd = text.toLowerCase();

    // GLOBAL COMMANDS
    if (["hi", "menu", "start", "book_again"].includes(cmd)) return showMainMenu(phone);
    
    if (cmd === "book_new") {
        session.step = "AWAIT_NAME";
        session.data = {}; 
        return sendMessage(phone, "👤 Please enter your *Full Name* to start:");
    }

    // DELETE APPOINTMENT FEATURE
    if (text.startsWith("cancel_")) {
        const ref = text.replace("cancel_", "");
        const { error } = await supabase.from("appointments").delete().eq("ref", ref);
        if (error) return sendMessage(phone, "⚠️ Could not find that booking.");
        await sendMessage(phone, `✅ Appointment *${ref}* has been successfully deleted.`);
        return showMainMenu(phone);
    }

    // STEP LOGIC
    switch (session.step) {
        case "AWAIT_NAME": 
            session.data.name = text;
            session.step = "AWAIT_DEPT";
            const rows = Object.keys(DEPARTMENTS).map(k => ({ id: k, title: `${DEPARTMENTS[k].emoji} ${k}` }));
            return sendList(phone, `Nice to meet you, ${text}. Select a department:`, [{ title: "Departments", rows }]);

        case "AWAIT_DEPT":
            if (!DEPARTMENTS[text]) return sendMessage(phone, "❌ Please use the menu.");
            session.data.department = text;
            session.step = "AWAIT_DOCTOR";
            const docBtns = DEPARTMENTS[text].doctors.map(d => ({ id: d, title: d }));
            return sendButtons(phone, `Choose a doctor:`, docBtns);

        case "AWAIT_DOCTOR":
            session.data.doctor = text;
            session.step = "AWAIT_DATE";
            const dates = [0, 1, 2].map(i => {
                const d = new Date(); d.setDate(d.getDate() + i);
                const str = d.toISOString().split("T")[0];
                return { id: `date_${str}`, title: i === 0 ? "Today" : str };
            });
            return sendButtons(phone, `Pick a date for ${text}:`, dates);

        case "AWAIT_DATE":
            session.data.date = text.replace("date_", "");
            session.step = "AWAIT_SLOT";
            return showAvailableSlots(phone, session.data.doctor, session.data.date);

        case "AWAIT_SLOT":
            if (text.startsWith("full_")) return sendMessage(phone, "❌ Slot taken. Pick another.");
            session.data.slot = text;
            session.step = "AWAIT_CONFIRM";
            const summary = `📋 *Summary*\n\n👤 ${session.data.name}\n👨‍⚕️ ${session.data.doctor}\n📅 ${session.data.date}\n⏰ ${session.data.slot}`;
            return sendButtons(phone, `${summary}\n\nConfirm booking?`, [{ id: "yes", title: "✅ Confirm" }, { id: "no", title: "❌ Cancel" }]);

        case "AWAIT_CONFIRM":
            if (text === "no") return showMainMenu(phone);
            return finalizeBooking(phone, session);

        default:
            // Silence for unknown inputs to avoid loops
            break;
    }
}

// ─────────────────────────────────────────────
//  BOOKING FINALIZATION (STOPS BOT)
// ─────────────────────────────────────────────
async function finalizeBooking(phone, session) {
    // 1. Race condition check
    const { data: existing } = await supabase.from("appointments").select("id")
        .eq("doctor", session.data.doctor).eq("date", session.data.date).eq("slot", session.data.slot).limit(1);

    if (existing && existing.length > 0) return sendMessage(phone, "⚠️ Sorry, that slot was just booked! Reply *hi* to start over.");

    const ref = "APT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 2. Insert into DB
    const { error } = await supabase.from("appointments").insert([{
        ref, phone, ...session.data, status: "booked"
    }]);

    if (error) {
        logger.error(`DB Error: ${error.message}`);
        return sendMessage(phone, "❌ Error saving your booking. Please try later.");
    }

    // 3. Confirm and Stop
    const msg = `✅ *Confirmed!*\nRef ID: *${ref}*\n\nSee you on ${session.data.date}.`;
    await sendButtons(phone, msg, [
        { id: "book_again", title: "📅 Book New" },
        { id: `cancel_${ref}`, title: "❌ Cancel This" }
    ]);

    // HARD STOP: Kill the session so the bot doesn't keep responding
    userSessions.delete(phone);
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
async function showMainMenu(phone) {
    userSessions.set(phone, { step: "IDLE", data: {}, lastActivity: Date.now() });
    await sendList(phone, "🏥 *Main Menu*", [{
        title: "Services",
        rows: [{ id: "book_new", title: "Book Appointment", description: "Schedule a visit" }]
    }]);
}

async function showAvailableSlots(phone, doctor, date) {
    const { data: booked } = await supabase.from("appointments").select("slot").eq("doctor", doctor).eq("date", date);
    const bookedSet = new Set(booked?.map(b => b.slot) || []);

    const rows = ALL_SLOTS.map(s => ({
        id: bookedSet.has(s) ? `full_${s}` : s,
        title: `${bookedSet.has(s) ? "❌" : "✅"} ${s}`,
        description: bookedSet.has(s) ? "Not Available" : "Available"
    }));

    await sendList(phone, `Slots for ${date}:`, [{ title: "Time Slots", rows }]);
}

// ─────────────────────────────────────────────
//  WHATSAPP API HELPERS
// ─────────────────────────────────────────────
async function sendMessage(to, body) {
    await axios.post(`https://graph.facebook.com/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`, 
        { messaging_product: "whatsapp", to, text: { body } },
        { headers: { Authorization: `Bearer ${CONFIG.TOKEN}` } }
    ).catch(e => logger.error(`Msg Error: ${e.response?.data?.error?.message}`));
}

async function sendButtons(to, text, buttons) {
    await axios.post(`https://graph.facebook.com/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: { type: "button", body: { text }, action: { buttons: buttons.slice(0, 3).map(b => ({ type: "reply", reply: b })) } }
    }, { headers: { Authorization: `Bearer ${CONFIG.TOKEN}` } }).catch(e => logger.error("Btn Error"));
}

async function sendList(to, text, sections) {
    await axios.post(`https://graph.facebook.com/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`, {
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: { type: "list", body: { text }, action: { button: "Select", sections } }
    }, { headers: { Authorization: `Bearer ${CONFIG.TOKEN}` } }).catch(e => logger.error("List Error"));
}

// ─────────────────────────────────────────────
//  REMINDERS & CLEANUP
// ─────────────────────────────────────────────
cron.schedule("0 * * * *", async () => {
    // Basic reminder logic can be added here
    logger.info("Cron running for hourly reminders...");
});

app.listen(CONFIG.PORT, () => logger.info(`Server active on ${CONFIG.PORT}`));