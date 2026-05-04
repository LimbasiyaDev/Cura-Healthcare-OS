require('dotenv').config({ path: './hospital-admin/.env.local' });
const express = require("express");
const axios   = require("axios");
const cors    = require("cors");
const { createClient } = require("@supabase/supabase-js");

/* ─── TRANSPORT ──────────────────────────────────────────────────────────────
   USE_WHATSAPP_WEB=true  → whatsapp-web.js (scan QR, free)
   USE_WHATSAPP_WEB=false → Meta Cloud API  (requires Meta setup)               */
const USE_WHATSAPP_WEB = process.env.USE_WHATSAPP_WEB === "true";

let waClient = null;

if (USE_WHATSAPP_WEB) {
  const { Client, LocalAuth } = require("whatsapp-web.js");
  const qrcode = require("qrcode-terminal");
  waClient = new Client({ authStrategy: new LocalAuth() });
  waClient.on("qr",    (qr) => { console.log("\n📱 Scan QR:\n"); qrcode.generate(qr, { small: true }); });
  waClient.on("ready", ()   => console.log("✅ WhatsApp Web bot is live!"));
  waClient.on("message", async (msg) => {
    if (msg.isGroupMsg) return;
    const hospital = await getDefaultHospital();
    await handleFlow(normalizePhone(msg.from), { type: "text", text: { body: msg.body?.trim() || "" }, _raw: msg }, hospital)
      .catch((err) => console.error("Flow error:", err.message));
  });
  waClient.initialize();
}

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */
const CONFIG = {
  TOKEN:           process.env.WHATSAPP_TOKEN,
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  VERIFY_TOKEN:    process.env.VERIFY_TOKEN || "mytoken123",
  PORT:            process.env.PORT || 4000,
  TYPING_DELAY_MS:    900,
  MAX_RETRY:          3,
  SESSION_TTL_MS:     30 * 60 * 1000,
  DEDUP_WINDOW_MS:    4000,
};

/* ─── SUPABASE ───────────────────────────────────────────────────────────── */
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/* ─── HOSPITAL CACHE ─────────────────────────────────────────────────────── */
let _hospitalByPhoneId = {};
let _defaultHospital   = null;

async function loadHospitalConfigs() {
  const { data, error } = await supabase.from("hospitals").select("*");
  if (error) { console.error("Hospital load error:", error.message); return; }
  _hospitalByPhoneId = {};
  data.forEach((h) => { if (h.whatsapp_phone_number_id) _hospitalByPhoneId[h.whatsapp_phone_number_id] = h; });
  if (data.length > 0) _defaultHospital = data[0];
  console.log(`✅ Loaded ${data.length} hospital(s)`);
}

async function getDefaultHospital() {
  if (_defaultHospital) return _defaultHospital;
  const { data } = await supabase.from("hospitals").select("*").limit(1).single();
  return (_defaultHospital = data);
}

async function getHospitalById(id) {
  if (!id) return getDefaultHospital();
  const hit = Object.values(_hospitalByPhoneId).find((h) => h.id === id);
  if (hit) return hit;
  const { data } = await supabase.from("hospitals").select("*").eq("id", id).single();
  return data;
}

loadHospitalConfigs();
setInterval(loadHospitalConfigs, 5 * 60 * 1000);

/* ─── SESSION STORE ─────────────────────────────────────────────────────── */
const sessions = new Map();

function getSession(phone) {
  const s = sessions.get(phone);
  if (s) {
    if (Date.now() - s.lastActive > CONFIG.SESSION_TTL_MS) {
      sessions.delete(phone);
    } else {
      s.lastActive = Date.now();
      return s;
    }
  }
  const fresh = { step: "IDLE", data: {}, lastActive: Date.now(), msgCount: 0 };
  sessions.set(phone, fresh);
  return fresh;
}

/* ─── DEDUP STORE ────────────────────────────────────────────────────────── */
const recentMsgIds = new Map();
function isDuplicate(msgId) {
  if (!msgId) return false;
  const ts = recentMsgIds.get(msgId);
  if (ts && Date.now() - ts < CONFIG.DEDUP_WINDOW_MS) return true;
  recentMsgIds.set(msgId, Date.now());
  if (recentMsgIds.size > 200) {
    const cutoff = Date.now() - CONFIG.DEDUP_WINDOW_MS * 2;
    for (const [k, v] of recentMsgIds) { if (v < cutoff) recentMsgIds.delete(k); }
  }
  return false;
}

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
const normalize = (str) =>
  str ? str.toString().toLowerCase().replace(/[:\s]/g, "").replace(/^0/, "").trim() : "";

function normalizePhone(raw) {
  let n = raw.toString().replace(/\D/g, "");
  // BUG FIX #11: Handle international numbers more robustly
  if (n.length === 10) {
    // Assume Indian number if 10 digits — prefix with 91
    n = "91" + n;
  } else if (n.length < 10) {
    // Too short — return as-is, let it fail gracefully downstream
    console.warn(`⚠️ Possibly invalid phone number: ${n}`);
  }
  // For numbers 11+ digits, assume they already have a country code
  return n;
}

function getNowIST() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
}

function fuzzyMatchSlot(input, availableSlots) {
  if (!input) return null;
  const clean = input.toLowerCase().replace(/\s/g, "").replace(/\./g, ":");
  return availableSlots.find((s) => {
    const sc = s.toLowerCase().replace(/\s/g, "");
    return sc === clean || sc.startsWith(clean) || normalize(sc) === normalize(clean);
  }) || null;
}

/* ─── HTTP API ───────────────────────────────────────────────────────────── */
const app = express();
app.use(express.json());
app.use(cors());

app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === CONFIG.VERIFY_TOKEN)
    return res.send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.status(200).send("EVENT_RECEIVED");
  if (USE_WHATSAPP_WEB) return;

  const value = req.body?.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages) return;

  const msg   = value.messages[0];
  const msgId = msg.id;
  if (isDuplicate(msgId)) { console.log("⚠️  Duplicate msg ignored:", msgId); return; }

  const phone    = normalizePhone(msg.from);
  const phoneId  = value?.metadata?.phone_number_id;
  const hospital = _hospitalByPhoneId[phoneId] || (await getDefaultHospital());

  if (!hospital) { console.error("No hospital for phoneId:", phoneId); return; }

  await handleFlow(phone, msg, hospital).catch((err) => console.error("Flow error:", err.message));
});

app.post("/notify-status-change", async (req, res) => {
  const { phone, doctorName, doctorId, status, slot, date, hospitalId } = req.body;
  const p = normalizePhone(phone);
  const hospital = await getHospitalById(hospitalId);
  try {
    if (status === "booked") {
      await sendMessage(p, `✅ *Confirmed!*\n\n*Dr. ${doctorName}* has approved your appointment at *${slot}* on *${date}*.\nSee you at *${hospital?.name || "our clinic"}*! 🏥`, hospital);
    } else if (status === "rejected") {
      const { data: appt } = await supabase
        .from("appointments")
        .select("name, age, reason, patient_id")
        .eq("doctor_id", doctorId).eq("date", date).eq("slot", slot)
        .neq("status", "booked").order("created_at", { ascending: false }).limit(1).maybeSingle();

      const session = getSession(p);
      session.step = "AWAIT_SLOT";
      session.data = { ...session.data, date, doctor_id: doctorId, doctor_name: doctorName,
        name: session.data.name || appt?.name, age: session.data.age || appt?.age,
        reason: session.data.reason || appt?.reason,
        savedPatientId: session.data.savedPatientId || appt?.patient_id };

      await sendMessage(p, `❌ *Update from ${hospital?.name || "the clinic"}*\n\nDr. ${doctorName} is no longer available at *${slot}* on *${date}*.`, hospital);
      await pause(CONFIG.TYPING_DELAY_MS);
      await sendMessage(p, "Please select a different time slot:", hospital);
      await showDynamicSlots(p, doctorId, date, hospital);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Notify error:", err.message);
    res.status(500).send("Failed");
  }
});

app.post("/create-doctor-auth", async (req, res) => {
  const { email, tempPassword } = req.body;
  if (!email || !tempPassword)
    return res.status(400).json({ error: "email and tempPassword required" });
  try {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === email);
    if (existing) await supabaseAdmin.auth.admin.deleteUser(existing.id);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
    if (error) throw error;
    return res.json({ userId: created?.user?.id });
  } catch (err) {
    console.error("create-doctor-auth:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/create-hospital", async (req, res) => {
  const { name, address, whatsapp_phone_number_id, whatsapp_token } = req.body;
  if (!name) return res.status(400).json({ error: "Hospital name required" });
  try {
    const { data, error } = await supabase.from("hospitals").insert([{
      name: name.trim(), address: address?.trim() || null,
      whatsapp_phone_number_id: whatsapp_phone_number_id?.trim() || null,
      whatsapp_token: whatsapp_token?.trim() || null,
    }]).select().single();
    if (error) throw error;
    await loadHospitalConfigs();
    return res.json({ hospital: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/update-hospital", async (req, res) => {
  const { id, name, address, whatsapp_phone_number_id, whatsapp_token } = req.body;
  if (!id) return res.status(400).json({ error: "Hospital ID required" });
  const updates = {};
  if (name  !== undefined) updates.name  = name.trim();
  if (address !== undefined) updates.address = address?.trim() || null;
  if (whatsapp_phone_number_id !== undefined) updates.whatsapp_phone_number_id = whatsapp_phone_number_id?.trim() || null;
  if (whatsapp_token !== undefined) updates.whatsapp_token = whatsapp_token?.trim() || null;
  try {
    const { data, error } = await supabase.from("hospitals").update(updates).eq("id", id).select().single();
    if (error) throw error;
    await loadHospitalConfigs();
    return res.json({ hospital: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/doctor-action", async (req, res) => {
  const { appointmentId, action, doctorPhone, hospitalId } = req.body;
  const dPhone   = normalizePhone(doctorPhone);
  const hospital = await getHospitalById(hospitalId);

  try {
    const { data: appt } = await supabase.from("appointments")
      .select("*, doctors(name, phone)").eq("id", appointmentId).single();
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    const newStatus = action === "approve" ? "booked" : "rejected";
    await supabase.from("appointments").update({ status: newStatus }).eq("id", appointmentId);

    const clinicName = hospital?.name || "the clinic";
    if (action === "approve") {
      await sendMessage(normalizePhone(appt.phone),
        `✅ *Confirmed!*\n\n*Dr. ${appt.doctors.name}* approved your appointment at *${appt.slot}* on *${appt.date}*.\nSee you at *${clinicName}*! 🏥`, hospital);
      await sendMessage(dPhone,
        `✅ Approved — *${appt.name}*'s appointment at *${appt.slot}* on *${appt.date}* is confirmed.`, hospital);
    } else {
      const pPhone = normalizePhone(appt.phone);
      const pSession = getSession(pPhone);
      pSession.step = "AWAIT_SLOT";
      pSession.data = { name: appt.name, age: appt.age, reason: appt.reason,
        savedPatientId: appt.patient_id, date: appt.date,
        doctor_id: appt.doctor_id, doctor_name: appt.doctors.name };
      await sendMessage(pPhone, `❌ *Update from ${clinicName}*\n\nDr. ${appt.doctors.name} is unavailable at *${appt.slot}* on *${appt.date}*.`, hospital);
      await pause(CONFIG.TYPING_DELAY_MS);
      await sendMessage(pPhone, "Please choose a different time slot:", hospital);
      await showDynamicSlots(pPhone, appt.doctor_id, appt.date, hospital);
      await sendMessage(dPhone, `❌ Rejected — *${appt.name}* has been asked to rebook.`, hospital);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Doctor action:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/notify-doctor-onboarded", async (req, res) => {
  const { phone, name, email, tempPassword, hospitalId } = req.body;
  const hospital = await getHospitalById(hospitalId);
  // BUG FIX #10: Use APP_URL env var, warn if not set
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    console.warn("⚠️  APP_URL is not set in .env — doctor login URL will be missing in WhatsApp notification.");
  }
  try {
    await sendMessage(normalizePhone(phone),
      `👨‍⚕️ *Welcome to ${hospital?.name || "Cura"}, Dr. ${name}!*\n\nYour specialist account is ready.\n\n📧 *Email:* ${email}\n🔑 *Temp Password:* ${tempPassword}\n🏥 *Hospital:* ${hospital?.name || "N/A"}\n🔗 *Login:* ${appUrl || "[APP_URL not configured — contact admin]"}/login\n\n⚠️ Please login and reset your password immediately.`,
      hospital);
    res.sendStatus(200);
  } catch (err) {
    console.error("Doctor notify:", err.message);
    res.status(500).send("Failed");
  }
});

/* ─── MAIN FLOW ──────────────────────────────────────────────────────────── */
async function handleFlow(phone, msg, hospital) {
  const session = getSession(phone);
  session.msgCount = (session.msgCount || 0) + 1;

  if (!session.hospitalId) { session.hospitalId = hospital.id; session.hospital = hospital; }
  const H = session.hospital || hospital;

  let text         = "";
  let displayTitle = "";
  let rawButtonId  = "";

  if (msg.type === "interactive") {
    rawButtonId  = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "";
    text         = rawButtonId;
    displayTitle = msg.interactive?.list_reply?.title || "";
  } else {
    text = (msg.text?.body || "").trim();
  }

  if (session._buttonMap?.[text]) {
    displayTitle = text;
    text = session._buttonMap[text];
    delete session._buttonMap;
  }

  /* ── Doctor approve / reject via WhatsApp ──────────────────────────────── */
  const actionId = rawButtonId || text;
  if (actionId.startsWith("appr_") || actionId.startsWith("rejt_")) {
    // Always fetch the hospital from the appointment record,
    // never from the doctor's own session (which may be a different hospital).
    return handleDoctorAction(actionId, phone, null);
  }

  const lower = text.toLowerCase().replace(/\s/g, "");
  const RESETS   = ["cancel","reset","stop","restart","menu","main"];
  const GREETS   = ["hi","hello","start","book","hey","namaste"];
  const hospitalAlias = H?.name?.toLowerCase().replace(/\s/g, "");

  if (RESETS.includes(lower)) {
    sessions.delete(phone);
    return sendMessage(phone, "🔄 Session reset. Send *Hi* to start a new booking.", H);
  }
  if (GREETS.includes(lower) || (hospitalAlias && lower === hospitalAlias)) {
    return showMainMenu(phone, H);
  }

  if (["help","?","info"].includes(lower)) {
    return sendMessage(phone,
      `ℹ️ *Cura Help*\n\n• Type *Hi* to start or restart a booking\n• Type *Cancel* to reset your session\n• Type *Menu* to go back to the main menu\n• Reply with a number when given a list of options\n\nNeed support? Contact ${H?.name || "our clinic"}.`, H);
  }

  switch (session.step) {

    // BUG FIX #8 (misleading state name kept for backward compat, now clearly documented):
    // This step handles patient NAME entry (historically named AWAIT_PATIENT_TYPE — misleading but kept)
    case "AWAIT_PATIENT_TYPE":
      if (!text || text.length < 2)
        return sendMessage(phone, "Please enter a valid patient name (at least 2 characters):", H);
      session.data.name = toTitleCase(text);
      session.step = "AWAIT_RELATION";
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendButtons(phone,
        `What is *${session.data.name}'s* relation to you?`,
        [{ id:"rel_Self",title:"Self" },{ id:"rel_Family",title:"Family Member" },{ id:"rel_Other",title:"Other" }], H);

    case "AWAIT_MEMBER_SELECT": {
      const patients = session.data.familyList || [];
      if (text === "member_new") {
        session.step = "AWAIT_NAME";
        await pause(CONFIG.TYPING_DELAY_MS);
        return sendMessage(phone, "Please enter the *full name* of the patient:", H);
      }
      const idx = parseInt(text.replace("member_",""), 10);
      if (!isNaN(idx) && patients[idx]) {
        const p = patients[idx];
        Object.assign(session.data, {
          name: p.patient_name, age: p.age,
          gender: p.gender, savedPatientId: p.id, relation: p.relation,
        });
        await pause(CONFIG.TYPING_DELAY_MS);
        await sendMessage(phone, `👋 Booking for *${p.patient_name}* (${p.relation || "Patient"})`, H);
        return startBookingProcess(phone, H);
      }
      return sendMessage(phone, "Please tap a valid option from the list.", H);
    }

    case "AWAIT_NAME":
      if (!text || text.length < 2)
        return sendMessage(phone, "Please enter a valid full name:", H);
      session.data.name = toTitleCase(text);
      session.step = "AWAIT_RELATION";
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendButtons(phone,
        `What is *${session.data.name}'s* relation to you?`,
        [{ id:"rel_Self",title:"Self" },{ id:"rel_Family",title:"Family Member" },{ id:"rel_Other",title:"Other" }], H);

    case "AWAIT_RELATION": {
      session.data.relation = text.startsWith("rel_") ? text.replace("rel_","") : toTitleCase(text);
      const { data: inserted } = await supabase.from("number_patients").upsert({
        whatsapp_number: phone, patient_name: session.data.name,
        relation: session.data.relation, age: session.data.age || null,
        gender: session.data.gender || null, hospital_id: H?.id || null,
      }, { onConflict: "whatsapp_number,patient_name,hospital_id" }).select().single();
      if (inserted) session.data.savedPatientId = inserted.id;
      await pause(CONFIG.TYPING_DELAY_MS);
      return startBookingProcess(phone, H);
    }

    case "AWAIT_DEPT": {
      session.data.department = text.replace("dept_","").replace(/_/g," ");
      session.step = "AWAIT_DOCTOR";
      const { data: doctors } = await supabase.from("doctors").select("id, name")
        .eq("department", session.data.department)
        .eq("is_available", true)
        .eq("hospital_id", H.id);
      if (!doctors?.length)
        return sendMessage(phone, `⚠️ No doctors available in *${session.data.department}* right now.\n\nSend *Menu* to choose a different department.`, H);
      session.data._doctorMap = {};
      session.data._doctorList = doctors.slice(0, 3);
      doctors.forEach((d, i) => {
        const key = "doc_" + i;
        session.data._doctorMap[key]                      = d.id;
        session.data._doctorMap[d.name.trim()]            = d.id;
        session.data._doctorMap[d.name.substring(0,20).trim()] = d.id;
        session.data._doctorMap[d.id.toString()]          = d.id;
      });
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendButtons(phone,
        `👨‍⚕️ Choose a Specialist in *${session.data.department}*:`,
        session.data._doctorList.map((d, i) => ({ id: "doc_" + i, title: d.name.substring(0,20) })), H);
    }

    case "AWAIT_DOCTOR": {
      const dMap = session.data._doctorMap || {};
      const resolvedId = dMap[text] || dMap[text.trim()] || text;
      const { data: doc } = await supabase.from("doctors").select("*").eq("id", resolvedId).single();
      if (!doc) {
        console.error(`AWAIT_DOCTOR: could not resolve "${text}" via map keys: ${Object.keys(dMap).join(", ")}`);
        return sendMessage(phone, "Sorry, couldn't find that doctor. Please tap a valid option from the list.", H);
      }
      Object.assign(session.data, {
        doctor_id: resolvedId, doctor_name: doc.name,
        requires_age: doc.requires_age, requires_reason: doc.requires_reason,
      });
      session.step = "AWAIT_DATE";
      const dates = buildDateOptions();
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendButtons(phone, `📅 Select a date for *${doc.name}*:`, dates, H);
    }

    case "AWAIT_DATE":
      session.data.date = text.replace("date_","");
      session.step = "AWAIT_SLOT";
      await pause(CONFIG.TYPING_DELAY_MS);
      return showDynamicSlots(phone, session.data.doctor_id, session.data.date, H);

    case "AWAIT_SLOT":
      if (text.startsWith("full_"))
        return sendMessage(phone, "⚠️ That slot is already taken. Please choose an available one (marked ✅).", H);
      if (text.startsWith("past_"))
        return sendMessage(phone, "⚠️ That time has already passed. Please choose an upcoming slot.", H);
      session.data.slot = (displayTitle.replace("✅ ","").trim() || text.replace("slot_",""));
      await pause(CONFIG.TYPING_DELAY_MS);
      return handleRequirementsFlow(phone, H);

    case "AWAIT_AGE": {
      const age = Number(text.trim());
      if (!text.trim() || isNaN(age) || age <= 0 || age > 120)
        return sendMessage(phone, "🔢 Please enter a valid age (e.g. *35*):", H);
      session.data.age = String(age);
      await pause(CONFIG.TYPING_DELAY_MS);
      return handleRequirementsFlow(phone, H);
    }

    case "AWAIT_REASON":
      if (!text || text.length < 3)
        return sendMessage(phone, "Please describe the reason in a few words:", H);
      session.data.reason = text;
      await pause(CONFIG.TYPING_DELAY_MS);
      return handleRequirementsFlow(phone, H);

    case "AWAIT_CONFIRM":
      if (text === "confirm_yes") return finalizeBooking(phone, session, H);
      sessions.delete(phone);
      // BUG FIX #5: After cancel, prompt user to restart instead of leaving them stranded
      return sendMessage(phone, "❌ Booking cancelled. Send *Hi* anytime to start a new one.", H);

    default:
      if (session.data.doctor_id && session.data.date && text.match(/\d{1,2}[:.]?\d{0,2}\s*(am|pm)?/i)) {
        session.step = "AWAIT_SLOT";
        return handleFlow(phone, msg, H);
      }
      return showMainMenu(phone, H);
  }
}

/* ─── Doctor approve / reject via WhatsApp message ───────────────────────── */
async function handleDoctorAction(actionId, phone, _unusedHospital) {
  // Always resolve hospital from the appointment's own hospital_id.
  // The incoming `_unusedHospital` is the DOCTOR's session hospital
  // which may differ from the PATIENT's booking hospital — ignore it.
  const isApprove     = actionId.startsWith("appr_");
  const appointmentId = actionId.slice(5);
  try {
    const { data: appt } = await supabase.from("appointments")
      .select("*, doctors(name, phone)").eq("id", appointmentId).single();

    if (!appt)
      return sendMessage(phone, "⚠️ Appointment not found. It may have been deleted.", await getDefaultHospital());
    if (appt.status !== "pending")
      return sendMessage(phone, `ℹ️ This appointment is already *${appt.status}*.`, await getDefaultHospital());

    // Always fetch hospital from the appointment record itself
    const hospital = await getHospitalById(appt.hospital_id);

    const status = isApprove ? "booked" : "rejected";
    await supabase.from("appointments").update({ status }).eq("id", appointmentId);

    const clinicName = hospital?.name || "the clinic";
    if (isApprove) {
      await sendMessage(normalizePhone(appt.phone),
        `✅ *Confirmed!*\n\n*Dr. ${appt.doctors?.name}* approved your appointment at *${appt.slot}* on *${appt.date}*.\nSee you at *${clinicName}*! 🏥`, hospital);
      return sendMessage(phone,
        `✅ Approved — *${appt.name}'s* appointment at *${appt.slot}* on *${appt.date}* is confirmed.`, hospital);
    } else {
      const pPhone   = normalizePhone(appt.phone);
      const pSession = getSession(pPhone);
      pSession.step = "AWAIT_SLOT";
      pSession.data = { name: appt.name, age: appt.age, reason: appt.reason,
        savedPatientId: appt.patient_id, date: appt.date,
        doctor_id: appt.doctor_id, doctor_name: appt.doctors?.name,
        // Preserve correct hospital context for the patient's rebook session
        hospitalId: appt.hospital_id };
      pSession.hospital   = hospital;
      pSession.hospitalId = appt.hospital_id;

      await sendMessage(pPhone, `❌ *Update from ${clinicName}*\n\nDr. ${appt.doctors?.name} is no longer available at *${appt.slot}* on *${appt.date}*.`, hospital);
      await pause(CONFIG.TYPING_DELAY_MS);
      await sendMessage(pPhone, "Please choose a different time slot:", hospital);
      await showDynamicSlots(pPhone, appt.doctor_id, appt.date, hospital);
      return sendMessage(phone, `❌ Rejected — *${appt.name}* has been notified to rebook.`, hospital);
    }
  } catch (err) {
    console.error("Doctor action error:", err.message);
    return sendMessage(phone, "⚠️ Something went wrong. Use the dashboard to manage this request.", await getDefaultHospital());
  }
}

/* ─── BOOKING HELPERS ────────────────────────────────────────────────────── */
async function startBookingProcess(phone, hospital) {
  const session = getSession(phone);
  session.step  = "AWAIT_DEPT";
  const { data: depts } = await supabase.from("doctors").select("department")
    .eq("is_available", true).eq("hospital_id", hospital.id);
  const unique = [...new Set(depts?.map((d) => d.department))].filter(Boolean);
  if (!unique.length)
    return sendMessage(phone, `⚠️ No departments available at *${hospital.name}* right now. Please try again later.`, hospital);
  const rows = unique.map((d) => ({ id: `dept_${d.replace(/\s/g,"_")}`, title: d.substring(0,24) }));
  return sendList(phone, `🏥 Choose a *Department* at *${hospital.name}*:`,
    [{ title: "Our Specialities", rows }], "Select Dept", hospital);
}

async function handleRequirementsFlow(phone, hospital) {
  const session = getSession(phone);
  const { data } = session;
  if (data.requires_age && !data.age) {
    session.step = "AWAIT_AGE";
    return sendMessage(phone, "🔢 What is the patient's *age*?", hospital);
  }
  if (data.requires_reason && !data.reason) {
    session.step = "AWAIT_REASON";
    return sendMessage(phone, "📝 Briefly describe the *reason* for the visit:", hospital);
  }
  session.step = "AWAIT_CONFIRM";
  let summary = `🏥 *${(hospital?.name || "CLINIC").toUpperCase()} — BOOKING SUMMARY*\n\n` +
    `👤 *Patient:* ${data.name}\n` +
    `👨‍⚕️ *Doctor:* ${data.doctor_name}\n` +
    `📅 *Date:* ${data.date}\n` +
    `⏰ *Time:* ${data.slot}`;
  if (data.relation) summary += `\n🔗 *Relation:* ${data.relation}`;
  if (data.age)      summary += `\n🎂 *Age:* ${data.age}`;
  if (data.reason)   summary += `\n📝 *Reason:* ${data.reason}`;
  return sendButtons(phone, `${summary}\n\nConfirm this booking?`,
    [{ id:"confirm_yes", title:"Confirm ✅" },{ id:"confirm_no", title:"Cancel ❌" }], hospital);
}

async function finalizeBooking(phone, session, hospital) {
  const { data: d } = session;

  // BUG FIX #1: Handle appointment insert errors — no longer silently fails
  const { error: insertErr } = await supabase.from("appointments").insert([{
    phone, doctor_id: d.doctor_id, name: d.name,
    date: d.date, slot: d.slot, age: d.age || null,
    reason: d.reason || null, status: "pending",
    patient_id: d.savedPatientId || null,
    hospital_id: hospital?.id || null,
  }]);

  if (insertErr) {
    console.error("Appointment insert failed:", insertErr.message);
    return sendMessage(phone, "⚠️ Booking failed due to a server error. Please try again or send *Hi* to restart.", hospital);
  }

  await sendMessage(phone,
    `⏳ *Appointment Request Sent!*\n\nYour request for *${d.name}* has been submitted to *${hospital?.name || "the clinic"}*.\nWe'll notify you once the doctor confirms. ✅`,
    hospital);

  try {
    const { data: apptRow } = await supabase.from("appointments").select("id")
      .eq("doctor_id", d.doctor_id).eq("date", d.date)
      .eq("slot", d.slot).eq("phone", phone)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    const { data: doc } = await supabase.from("doctors").select("phone, name").eq("id", d.doctor_id).single();

    if (doc?.phone && apptRow?.id) {
      let msg = `🔔 *New Appointment — ${hospital?.name || "Clinic"}*\n\n` +
        `👤 *Patient:* ${d.name}\n📅 *Date:* ${d.date}\n⏰ *Time:* ${d.slot}`;
      if (d.age)    msg += `\n🎂 *Age:* ${d.age}`;
      if (d.reason) msg += `\n📝 *Reason:* ${d.reason}`;
      msg += `\n\nApprove or reject:`;
      await sendButtons(normalizePhone(doc.phone), msg,
        [{ id:`appr_${apptRow.id}`, title:"✅ Approve" },{ id:`rejt_${apptRow.id}`, title:"❌ Reject" }],
        hospital);
    }
  } catch (e) { console.error("Doctor notify:", e.message); }

  sessions.delete(phone);
}

/* ─── SHOW DYNAMIC SLOTS ─────────────────────────────────────────────────── */
async function showDynamicSlots(phone, doctorId, date, hospital) {
  try {
    const [{ data: doc }, { data: holiday }, { data: booked }, { data: blocked }] = await Promise.all([
      supabase.from("doctors").select("working_hours, slot_duration, name").eq("id", doctorId).single(),
      supabase.from("doctor_holidays").select("id").eq("doctor_id", doctorId).eq("date", date).maybeSingle(),
      supabase.from("appointments").select("slot").eq("doctor_id", doctorId).eq("date", date).neq("status","rejected"),
      supabase.from("blocked_slots").select("slot").eq("doctor_id", doctorId).eq("date", date),
    ]);

    if (holiday)
      return sendMessage(phone, `⚠️ Dr. ${doc?.name || "The doctor"} is on leave on *${date}*.\n\nSend *Menu* to choose another date.`, hospital);

    const bookedSet = new Set([
      ...(booked?.map((b) => normalize(b.slot)) || []),
      ...(blocked?.map((b) => normalize(b.slot)) || []),
    ]);

    const duration = parseInt(doc?.slot_duration) || 20;
    const [startStr, endStr] = (doc?.working_hours || "09:00 AM - 07:00 PM").split(" - ");
    let current = new Date(`1970/01/01 ${startStr}`);
    const end   = new Date(`1970/01/01 ${endStr}`);

    const nowIST = getNowIST();
    const todayIST = nowIST.toISOString().split("T")[0];
    const isToday  = date === todayIST;
    const nowMins  = nowIST.getHours() * 60 + nowIST.getMinutes();

    const slots = [];
    while (current < end) {
      const timeStr = current.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12: true });
      const slotMins = current.getHours() * 60 + current.getMinutes();
      if (isToday && slotMins <= nowMins) { current.setMinutes(current.getMinutes() + duration); continue; }
      const isFull = bookedSet.has(normalize(timeStr));
      slots.push({ id: isFull ? `full_${timeStr}` : `slot_${timeStr}`,
        title: (isFull ? `🔴 ${timeStr} (Full)` : `✅ ${timeStr}`).substring(0,24) });
      current.setMinutes(current.getMinutes() + duration);
    }

    if (!slots.length)
      return sendMessage(phone, "⚠️ No more slots available for this date.\nSend *Menu* to choose another date.", hospital);

    const available = slots.filter((s) => !s.id.startsWith("full_")).length;
    return sendList(phone,
      `⏰ *${doc?.name || "Doctor"}'s slots for ${date}*\n${available} available slot${available !== 1 ? "s" : ""} (every ${duration} min):`,
      [{ title: "Available Times", rows: slots.slice(0,10) }], "Select Time", hospital);
  } catch (e) {
    console.error("Slot error:", e.message);
    return sendMessage(phone, "⚠️ Error loading slots. Please try again or send *Menu* to restart.", hospital);
  }
}

/* ─── MAIN MENU ──────────────────────────────────────────────────────────── */
async function showMainMenu(phone, hospital) {
  const session = getSession(phone);
  session.data  = {};

  const { data: patients } = await supabase.from("number_patients").select("*")
    .eq("whatsapp_number", phone).eq("hospital_id", hospital.id)
    .order("created_at", { ascending: false });

  if (!patients?.length) {
    session.step = "AWAIT_PATIENT_TYPE";
    return sendMessage(phone,
      `🏥 Welcome to *${hospital.name}*!\n\nPlease enter the *full name* of the patient:`, hospital);
  }

  session.step = "AWAIT_MEMBER_SELECT";
  session.data.familyList = patients;

  const rows = patients.map((p, i) => ({
    id: `member_${i}`,
    title: `${p.patient_name} (${p.relation || "Patient"})`.substring(0,24),
  }));
  rows.push({ id: "member_new", title: "➕ Book for someone new" });

  return sendList(phone,
    `🏥 Welcome back to *${hospital.name}*!\n\nWho is this appointment for?`,
    [{ title: `${patients.length} Registered Patient${patients.length > 1 ? "s" : ""}`, rows: rows.slice(0,10) }],
    "Select Patient", hospital);
}

/* ─── WHATSAPP SEND WRAPPERS ─────────────────────────────────────────────── */
function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function apiPost(url, payload, token, retries = CONFIG.MAX_RETRY) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.error?.message || JSON.stringify(err.response?.data) || err.message;
      if (status === 401) {
        const phoneId = url.match(/\/(\d+)\/messages/)?.[1] || "unknown";
        const tokenSnippet = String(token || "").substring(0, 12);
        console.error(`\n❌  401 Unauthorized — Meta rejected the token.`);
        console.error(`    Phone Number ID : ${phoneId}`);
        console.error(`    Token (first 12): ${tokenSnippet}...`);
        console.error(`    Meta detail     : ${detail}`);
        throw err;
      }
      if (status && status >= 400 && status < 500) {
        console.error(`❌  ${status} client error: ${detail}`);
        throw err;
      }
      if (attempt < retries) {
        console.warn(`⚠️   API attempt ${attempt}/${retries} failed (${status || err.code}), retrying…`);
        await pause(400 * attempt);
      } else throw err;
    }
  }
}

async function sendMessage(to, body, hospital) {
  if (USE_WHATSAPP_WEB && waClient) {
    const chatId = to.includes("@") ? to : `${to}@c.us`;
    return waClient.sendMessage(chatId, body);
  }
  const token   = hospital?.whatsapp_token || CONFIG.TOKEN;
  const phoneId = hospital?.whatsapp_phone_number_id || CONFIG.PHONE_NUMBER_ID;
  return apiPost(`https://graph.facebook.com/v19.0/${phoneId}/messages`,
    { messaging_product:"whatsapp", to, text:{ body } }, token);
}

async function sendButtons(to, text, buttons, hospital) {
  if (USE_WHATSAPP_WEB && waClient) {
    const chatId  = to.includes("@") ? to : `${to}@c.us`;
    const opts    = buttons.map((b, i) => `${i+1}. ${b.title}`).join("\n");
    const session = getSession(to);
    session._buttonMap = {};
    buttons.forEach((b, i) => (session._buttonMap[String(i+1)] = b.id));
    return waClient.sendMessage(chatId, `${text}\n\n${opts}\n\n_Reply with a number_`);
  }
  const token   = hospital?.whatsapp_token || CONFIG.TOKEN;
  const phoneId = hospital?.whatsapp_phone_number_id || CONFIG.PHONE_NUMBER_ID;
  return apiPost(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    messaging_product: "whatsapp", to, type: "interactive",
    interactive: {
      type: "button", body: { text },
      action: { buttons: buttons.slice(0,3).map((b) => ({ type:"reply", reply:{ id:b.id, title:b.title } })) },
    },
  }, token);
}

async function sendList(to, text, sections, buttonLabel, hospital) {
  if (USE_WHATSAPP_WEB && waClient) {
    const chatId  = to.includes("@") ? to : `${to}@c.us`;
    const session = getSession(to);
    session._buttonMap = {};
    let msg = `${text}\n\n`;
    let counter = 1;
    sections.forEach((sec) => {
      sec.rows.forEach((row) => {
        msg += `${counter}. ${row.title}\n`;
        session._buttonMap[String(counter++)] = row.id;
      });
    });
    return waClient.sendMessage(chatId, msg + "\n_Reply with a number_");
  }
  const token   = hospital?.whatsapp_token || CONFIG.TOKEN;
  const phoneId = hospital?.whatsapp_phone_number_id || CONFIG.PHONE_NUMBER_ID;
  return apiPost(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    messaging_product: "whatsapp", to, type: "interactive",
    interactive: {
      type: "list", body: { text },
      action: { button: buttonLabel,
        sections: sections.map((s) => ({ title: s.title, rows: s.rows.map((r) => ({ id:r.id, title:r.title })) })) },
    },
  }, token);
}

/* ─── UTILITY HELPERS ────────────────────────────────────────────────────── */
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// BUG FIX #4: buildDateOptions now uses IST time consistently
function buildDateOptions() {
  return [0, 1, 2].map((i) => {
    const d = getNowIST(); // Fixed: was `new Date()` — now uses IST
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = i === 0 ? "📅 Today" : i === 1 ? "📅 Tomorrow" : `📅 ${iso}`;
    return { id: `date_${iso}`, title: label };
  });
}

/* ─── START SERVER ───────────────────────────────────────────────────────── */
app.listen(CONFIG.PORT, () =>
  console.log(`🚀 Cura Bot v2 on port ${CONFIG.PORT} | Mode: ${USE_WHATSAPP_WEB ? "WhatsApp Web (FREE)" : "Meta Cloud API"} | Sessions: in-memory`)
);