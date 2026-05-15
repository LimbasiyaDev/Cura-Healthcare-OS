require('dotenv').config({ path: './hospital-admin/.env.local' });
const express  = require("express");
const axios    = require("axios");
const cors     = require("cors");
const fetch    = require("node-fetch");
const FormData = require("form-data");
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
    await handleFlow(
      normalizePhone(msg.from),
      {
        type: msg.type,
        ...(msg.type === "ptt" || msg.type === "audio"
          ? { audio: { id: msg.id._serialized }, _raw: msg }
          : { text: { body: msg.body?.trim() || "" } }),
        _raw: msg,
      },
      hospital
    ).catch((err) => console.error("Flow error:", err.message));
  });
  waClient.initialize();
}

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */
const CONFIG = {
  TOKEN:           process.env.WHATSAPP_TOKEN,
  PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
  VERIFY_TOKEN:    process.env.VERIFY_TOKEN || "mytoken123",
  PORT:            process.env.PORT || 4000,
  TYPING_DELAY_MS: 900,
  MAX_RETRY:       3,
  SESSION_TTL_MS:  30 * 60 * 1000,
  DEDUP_WINDOW_MS: 4000,
};

/* ─── SUPABASE ───────────────────────────────────────────────────────────── */
const supabase      = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/* ─── AI CLIENTS ─────────────────────────────────────────────────────────── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const aiHistories = new Map();

/* ─── SHARED TRIAGE SYSTEM PROMPT ───────────────────────────────────────── */
const buildSystemPrompt = (hospital) =>
  `You are a medical triage assistant for ${hospital?.name || "a clinic"}.
Analyze the patient's symptoms and respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

JSON format (all fields required):
{
  "isEmergency": true or false,
  "emergencyReason": "brief reason if emergency, else null",
  "severity": "low" or "medium" or "high",
  "specialty": "exact department name matching one of: General Medicine, Dental, Cardiology, Orthopedics, Dermatology, Gynecology, Neurology, Pediatrics, ENT, Ophthalmology, Psychiatry, Urology, Gastroenterology",
  "fallbackSpecialties": ["second best department", "General Medicine"],
  "patientSummary": "2-3 sentence clinical summary for the doctor. Include symptoms, duration if mentioned, and severity.",
  "replyToPatient": "Friendly WhatsApp reply to the patient. MUST be in the SAME language the patient used (Hindi, Gujarati, or English). If emergency, clearly say GO TO CLINIC NOW. Max 80 words.",
  "detectedLanguage": "english or hindi or gujarati"
}

Emergency criteria (set isEmergency=true): chest pain or pressure, difficulty breathing, stroke symptoms, severe uncontrolled bleeding, unconsciousness or fainting, high fever with stiff neck, severe allergic reaction, suspected poisoning or overdose, severe abdominal pain, signs of heart attack.

Specialty mapping:
- Tooth pain / gum problem / cavity → Dental
- Chest pain / palpitations / high BP → Cardiology
- Bone fracture / joint pain / back pain → Orthopedics
- Skin rash / acne / fungal infection → Dermatology
- Pregnancy / period issues / PCOS → Gynecology
- Headache / seizure / numbness → Neurology
- Child fever / vaccination / growth → Pediatrics
- Ear pain / sore throat / nasal block → ENT
- Eye pain / blurred vision / redness → Ophthalmology
- Anxiety / depression / sleep issues → Psychiatry
- Urinary issues / kidney stones → Urology
- Stomach pain / acidity / IBS → Gastroenterology
- Anything else → General Medicine

IMPORTANT: Return ONLY the JSON object. No other text.`;

/* ─── JSON PARSER ────────────────────────────────────────────────────────── */
function parseTriageJSON(raw) {
  const clean = raw.replace(/```json|```/gi, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in response");
  return JSON.parse(clean.slice(start, end + 1));
}

/* ─── LANGUAGE DETECTION ─────────────────────────────────────────────────── */
const LANG_MAP = {
  hindi:     "hindi",
  gujarati:  "gujarati",
  english:   "english",
  "hi":      "hindi",
  "gu":      "gujarati",
  "en":      "english",
  "हिंदी":  "hindi",
  "ગુજરાતી": "gujarati",
};

function detectLang(text) {
  if (!text) return "english";
  const t = text.trim().toLowerCase();
  if (/[\u0900-\u097F]/.test(text)) return "hindi";
  if (/[\u0A80-\u0AFF]/.test(text)) return "gujarati";
  if (/^(namaste|namaskar|haan|nahi|theek|kya|mujhe|mera|meri|hai|hain|karo|karein|dard|bukhar|pet|dawa|bimari|takleef|hello\s*bhai|jai\s*hind)/.test(t))
    return "hindi";
  if (/^(kem|cho|shu|tamne|mane|avu|javu|tamaru|maru|mari|jai\s*shree|jai\s*jinendra)/.test(t))
    return "gujarati";
  return "english";
}

/* ─── TRANSLATION ────────────────────────────────────────────────────────── */
async function tr(text, lang) {
  if (!lang || lang === "english") return text;
  if (!process.env.GROQ_API_KEY)   return text;
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model:       "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens:  800,
        messages: [
          {
            role:    "system",
            content: `You are a WhatsApp message translator. Translate the following text to ${lang}.
Rules:
- Keep ALL emojis exactly as they are
- Keep ALL *bold* markdown exactly as they are
- Keep button IDs (rel_Self, confirm_yes, member_new, etc.) EXACTLY as-is — never translate them
- Keep names, doctor names, hospital names, dates, and times exactly as they are
- Keep medical department names in English (Cardiology, ENT, Orthopedics, etc.)
- If the input contains the delimiter <<<SEP>>>, keep it exactly on its own line between segments
- Return ONLY the translated text, nothing else`,
          },
          { role: "user", content: text },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 10000 }
    );
    return res.data.choices?.[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

async function trBatch(strings, lang) {
  if (!lang || lang === "english") return strings;
  const DELIM = "\n<<<SEP>>>\n";
  try {
    const joined     = strings.join(DELIM);
    const translated = await tr(joined, lang);
    const parts      = translated.split("<<<SEP>>>");
    return strings.map((orig, i) => (parts[i] ?? orig).trim());
  } catch {
    return strings;
  }
}

async function sendT(phone, text, hospital) {
  const session    = getSession(phone);
  const lang       = session.lang || "english";
  const translated = await tr(text, lang);
  return sendMessage(phone, translated, hospital);
}

async function sendTButtons(phone, text, buttons, hospital) {
  const session = getSession(phone);
  const lang    = session.lang || "english";
  if (lang !== "english") {
    const all        = [text, ...buttons.map((b) => b.title)];
    const translated = await trBatch(all, lang);
    text    = translated[0];
    buttons = buttons.map((b, i) => ({
      ...b,
      title: (translated[i + 1] || b.title).substring(0, 20),
    }));
  }
  return sendButtons(phone, text, buttons, hospital);
}

async function sendTList(phone, text, sections, buttonLabel, hospital) {
  const session = getSession(phone);
  const lang    = session.lang || "english";
  if (lang !== "english") {
    const rowTitles  = sections.flatMap((s) => s.rows.map((r) => r.title));
    const all        = [text, buttonLabel, ...rowTitles];
    const translated = await trBatch(all, lang);
    text        = translated[0];
    buttonLabel = translated[1];
    let idx     = 2;
    sections    = sections.map((sec) => ({
      ...sec,
      rows: sec.rows.map((row) => ({
        ...row,
        title: (translated[idx++] || row.title).substring(0, 24),
      })),
    }));
  }
  return sendList(phone, text, sections, buttonLabel, hospital);
}

/* ─── HOSPITAL CACHE ─────────────────────────────────────────────────────── */
let _hospitalByPhoneId = {};
let _defaultHospital   = null;

async function loadHospitalConfigs() {
  const { data, error } = await supabase.from("hospitals").select("*");
  if (error) { console.error("Hospital load error:", error.message); return; }
  _hospitalByPhoneId = {};
  data.forEach((h) => {
    if (h.whatsapp_phone_number_id) _hospitalByPhoneId[h.whatsapp_phone_number_id] = h;
  });
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

/* ─── SESSION STORE ──────────────────────────────────────────────────────── */
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
  const fresh = { step: "IDLE", data: {}, lastActive: Date.now(), msgCount: 0, lang: null };
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
  if (n.length === 10) n = "91" + n;
  else if (n.length < 10) console.warn(`⚠️ Possibly invalid phone number: ${n}`);
  return n;
}

function getNowIST() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

function buildDateOptions() {
  return [0, 1, 2].map((i) => {
    const d = getNowIST();
    d.setDate(d.getDate() + i);
    const iso   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = i === 0 ? "📅 Today" : i === 1 ? "📅 Tomorrow" : `📅 ${iso}`;
    return { id: `date_${iso}`, title: label };
  });
}

function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ─── APPLY LANGUAGE FROM TRIAGE RESULT ─────────────────────────────────── */
function applyTriageLang(phone, detectedLanguage) {
  const session  = getSession(phone);
  const aiLang   = LANG_MAP[(detectedLanguage || "").toLowerCase()] || "english";
  if (!session.lang || session.lang === "english") {
    session.lang = aiLang;
    console.log(`[Lang] Updated from triage: ${aiLang} for ${phone}`);
  }
}

/* ─── GOOGLE MEET LINK GENERATOR ─────────────────────────────────────────── */
function generateMeetLink() {
  const timestamp = Date.now();
  const random    = Math.random().toString(36).slice(2, 8);
  const roomName  = `cura-${timestamp}-${random}`;
  return `https://meet.jit.si/${roomName}`;
}

/* ─── AI: VOICE TRANSCRIPTION ────────────────────────────────────────────── */
async function transcribeVoiceMessage(mediaId, hospital) {
  const token = hospital?.whatsapp_token || CONFIG.TOKEN;
  const metaRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const mediaUrl = metaRes.data?.url;
  if (!mediaUrl) throw new Error("No media URL returned from Meta");
  const audioRes = await axios.get(mediaUrl, {
    headers:      { Authorization: `Bearer ${token}` },
    responseType: "arraybuffer",
  });
  const audioBuffer = Buffer.from(audioRes.data);
  if (process.env.GROQ_API_KEY) {
    try {
      const form = new FormData();
      form.append("file", audioBuffer, { filename: "audio.ogg", contentType: "audio/ogg" });
      form.append("model", "whisper-large-v3");
      form.append("response_format", "json");
      form.append("language", "");
      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        form,
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, ...form.getHeaders() }, timeout: 30000 }
      );
      console.log("[Transcribe] ✅ Used: Groq Whisper large-v3");
      const transcribedText = groqRes.data?.text || "";
      const detectedLang = detectLang(transcribedText);
      console.log(`[Transcribe] Detected language from voice: ${detectedLang}`);
      return { text: transcribedText, lang: detectedLang };
    } catch (err) {
      console.warn("[Transcribe] ⚠️ Groq Whisper failed:", err.response?.data?.error?.message || err.message);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const form = new FormData();
      form.append("file", audioBuffer, { filename: "audio.ogg", contentType: "audio/ogg" });
      form.append("model", "whisper-1");
      const oaiRes = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        form,
        { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, ...form.getHeaders() }, timeout: 30000 }
      );
      console.log("[Transcribe] ✅ Used: OpenAI Whisper-1 (fallback)");
      const transcribedText = oaiRes.data?.text || "";
      const detectedLang    = detectLang(transcribedText);
      return { text: transcribedText, lang: detectedLang };
    } catch (err) {
      console.warn("[Transcribe] ⚠️ OpenAI Whisper failed:", err.response?.data?.error?.message || err.message);
    }
  }
  throw new Error("All transcription services failed. No valid API keys available.");
}

/* ─── AI: MEDICAL TRIAGE ─────────────────────────────────────────────────── */
async function triageWithAI(symptomText, phone, hospital) {
  if (!aiHistories.has(phone)) aiHistories.set(phone, []);
  const history       = aiHistories.get(phone);
  const SYSTEM_PROMPT = buildSystemPrompt(hospital);
  if (process.env.GROQ_API_KEY) {
    try {
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.content })),
        { role: "user", content: symptomText },
      ];
      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        { model: "llama-3.3-70b-versatile", messages, temperature: 0.1, max_tokens: 600 },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 15000 }
      );
      const raw    = groqRes.data.choices?.[0]?.message?.content || "";
      const result = parseTriageJSON(raw);
      history.push({ role: "user",      content: symptomText });
      history.push({ role: "assistant", content: raw });
      if (history.length > 10) history.splice(0, 2);
      console.log("[Triage] ✅ Used: Groq llama-3.3-70b");
      return result;
    } catch (err) {
      console.warn("[Triage] ⚠️ Groq failed:", err.response?.data?.error?.message || err.message);
    }
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({
        model:             "gemini-1.5-flash-002",
        systemInstruction: SYSTEM_PROMPT,
      });
      const chat = model.startChat({
        history: history.map((h) => ({
          role:  h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
      });
      const result = await chat.sendMessage(symptomText);
      const raw    = result.response.text();
      const parsed = parseTriageJSON(raw);
      history.push({ role: "user",      content: symptomText });
      history.push({ role: "assistant", content: raw });
      if (history.length > 10) history.splice(0, 2);
      console.log("[Triage] ✅ Used: Gemini 1.5 Flash (fallback)");
      return parsed;
    } catch (err) {
      console.warn("[Triage] ⚠️ Gemini failed:", err.message);
    }
  }
  console.warn("[Triage] ⚠️ All AI providers failed — using rule-based fallback");
  return ruleBasedTriage(symptomText, hospital);
}

/* ─── RULE-BASED TRIAGE FALLBACK ────────────────────────────────────────── */
function ruleBasedTriage(text, hospital) {
  const lower = text.toLowerCase();
  let isEmergency     = false;
  let emergencyReason = null;
  if (/chest pain|can'?t breathe|difficulty breath|unconscious|stroke|face droop|arm weak|speech slur|severe bleeding|heart attack|poisoning|overdose|severe abdom/.test(lower)) {
    isEmergency     = true;
    emergencyReason = "Possible emergency symptoms reported by patient";
  }
  let specialty = "General Medicine";
  if (/tooth|teeth|gum|dental|cavity|mouth/.test(lower))                          specialty = "Dental";
  else if (/chest|heart|palpitat|bp|blood pressure|cardiac/.test(lower))          specialty = "Cardiology";
  else if (/bone|fracture|joint|knee|back pain|ortho|spine/.test(lower))          specialty = "Orthopedics";
  else if (/skin|rash|acne|itching|fungal|dermat/.test(lower))                    specialty = "Dermatology";
  else if (/pregnant|pregnancy|period|menstrual|pcos|gynae|gynaec/.test(lower))   specialty = "Gynecology";
  else if (/headache|migraine|seizure|epilepsy|numbness|neuro/.test(lower))       specialty = "Neurology";
  else if (/child|baby|infant|pediatric|vaccination|kid/.test(lower))             specialty = "Pediatrics";
  else if (/ear|throat|nose|nasal|sinus|ent|tonsil/.test(lower))                  specialty = "ENT";
  else if (/eye|vision|blur|ophth|retina/.test(lower))                            specialty = "Ophthalmology";
  else if (/anxiety|depression|stress|mental|sleep|psychiatr/.test(lower))        specialty = "Psychiatry";
  else if (/urine|urinary|kidney|bladder|urology/.test(lower))                    specialty = "Urology";
  else if (/stomach|gastro|acidity|ibs|bowel|digestive|vomit|nausea/.test(lower)) specialty = "Gastroenterology";
  const severity = isEmergency ? "high" : /severe|very|extreme|bad/.test(lower) ? "medium" : "low";
  return {
    isEmergency,
    emergencyReason,
    severity,
    specialty,
    fallbackSpecialties:  ["General Medicine"],
    patientSummary:       `Patient reports: "${text.substring(0, 120)}". Triaged by rule-based system.`,
    replyToPatient:       isEmergency
      ? `🚨 Your symptoms sound serious. Please come to ${hospital?.name || "the clinic"} IMMEDIATELY.`
      : `Thank you for reaching out. We're connecting you with a ${specialty} specialist.`,
    detectedLanguage:     "english",
    source:               "rule-based",
  };
}

/* ─── AI: FIND BEST DOCTOR (with cross-hospital fallback) ───────────────── */
async function findBestDoctor(triageResult, hospital) {
  const specialtiesToTry = [
    triageResult.specialty,
    ...(triageResult.fallbackSpecialties || []),
    "General Medicine",
  ];
  const seen  = new Set();
  const order = specialtiesToTry.filter((s) => { if (!s || seen.has(s)) return false; seen.add(s); return true; });

  for (const dept of order) {
    const { data: doctors, error } = await supabase
      .from("doctors").select("id, name, department, hospital_id")
      .eq("hospital_id", hospital.id).eq("is_available", true)
      .ilike("department", `%${dept}%`).limit(3);
    if (error) { console.error("Doctor fetch error:", error.message); continue; }
    if (doctors?.length) {
      return {
        doctors,
        department:      doctors[0].department,
        wasFallback:     dept !== triageResult.specialty,
        triedSpecialty:  triageResult.specialty,
        crossHospital:   false,
        hospitalForAppt: hospital,
      };
    }
  }

  console.log(`[FindDoctor] No doctor in hospital "${hospital.name}" for ${triageResult.specialty} — searching other hospitals`);

  for (const dept of order) {
    const { data: doctors, error } = await supabase
      .from("doctors")
      .select("id, name, department, hospital_id, hospitals(id, name)")
      .neq("hospital_id", hospital.id)
      .eq("is_available", true)
      .ilike("department", `%${dept}%`)
      .limit(3);
    if (error) { console.error("Cross-hospital doctor fetch error:", error.message); continue; }
    if (doctors?.length) {
      const doctorHospital = doctors[0].hospitals || await getHospitalById(doctors[0].hospital_id);
      return {
        doctors,
        department:      doctors[0].department,
        wasFallback:     dept !== triageResult.specialty,
        triedSpecialty:  triageResult.specialty,
        crossHospital:   true,
        crossHospitalName: doctorHospital?.name || "another clinic",
        hospitalForAppt: doctorHospital,
      };
    }
  }

  return {
    doctors:         [],
    department:      null,
    wasFallback:     false,
    triedSpecialty:  triageResult.specialty,
    crossHospital:   false,
    hospitalForAppt: hospital,
  };
}

/* ─── AI: EMERGENCY NOTIFY ───────────────────────────────────────────────── */
async function notifyEmergencyDoctors(phone, patientName, triageResult, hospital) {
  const { data: doctors, error } = await supabase
    .from("doctors").select("phone, name").eq("hospital_id", hospital.id).eq("is_available", true);
  if (error || !doctors?.length) { console.warn("No doctors to notify:", error?.message); return; }
  const emergencyMsg =
    `🚨 *EMERGENCY ALERT — ${hospital.name}*\n\n` +
    `👤 *Patient:* ${patientName || "Unknown"}\n` +
    `📞 *WhatsApp:* +${phone}\n` +
    `⚠️ *Reason:* ${triageResult.emergencyReason || "Emergency reported"}\n` +
    `🔴 *Severity:* ${(triageResult.severity || "high").toUpperCase()}\n\n` +
    `📋 *Summary:* ${triageResult.patientSummary}\n\n` +
    `⚡ Please respond IMMEDIATELY.`;
  for (const doc of doctors) {
    if (!doc.phone) continue;
    try { await sendMessage(normalizePhone(doc.phone), emergencyMsg, hospital); await pause(200); }
    catch (e) { console.error(`Failed to notify Dr. ${doc.name}:`, e.message); }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPOINTMENT REMINDER SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */

// Track which reminders have been sent to avoid duplicates
const sentReminders = new Set();

async function checkUpcomingAppointments() {
  try {
    const nowIST = getNowIST();
    const todayIST = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, "0")}-${String(nowIST.getDate()).padStart(2, "0")}`;

    // Fetch all pending/booked appointments for today
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*, doctors(name, phone)")
      .eq("date", todayIST)
      .in("status", ["booked", "pending"]);

    if (error) { console.error("[Reminder] DB error:", error.message); return; }
    if (!appointments?.length) return;

    for (const appt of appointments) {
      const reminderKey = `${appt.id}_30min`;
      if (sentReminders.has(reminderKey)) continue;

      // Parse appointment slot time
      const slotTime = new Date(`1970/01/01 ${appt.slot}`);
      if (isNaN(slotTime.getTime())) continue;

      const apptMins = slotTime.getHours() * 60 + slotTime.getMinutes();
      const nowMins  = nowIST.getHours() * 60 + nowIST.getMinutes();
      const diffMins = apptMins - nowMins;

      // Send reminder if appointment is 25–35 minutes away (window to avoid missed checks)
      if (diffMins >= 25 && diffMins <= 35) {
        sentReminders.add(reminderKey);
        try {
          const hospital = await getHospitalById(appt.hospital_id);
          const pPhone   = normalizePhone(appt.phone);
          const docName  = appt.doctors?.name || "your doctor";

          if (appt.consultation_type === "call" && appt.meet_link) {
            // Video call reminder
            await sendMessage(pPhone,
              `⏰ *Appointment Reminder — ${hospital?.name || "Cura"}*\n\n` +
              `Hi *${appt.name}*! Your video consultation with *Dr. ${docName}* is in *30 minutes* at *${appt.slot}*.\n\n` +
              `📹 *Join your Google Meet call here:*\n${appt.meet_link}\n\n` +
              `Please be ready 5 minutes early. See you soon! 🩺`,
              hospital
            );
          } else {
            // In-person reminder
            await sendMessage(pPhone,
              `⏰ *Appointment Reminder — ${hospital?.name || "Cura"}*\n\n` +
              `Hi *${appt.name}*! Your appointment with *Dr. ${docName}* is in *30 minutes* at *${appt.slot}*.\n\n` +
              `🏥 Please arrive at *${hospital?.name || "the clinic"}* a few minutes early.\n\n` +
              `See you soon! 🩺`,
              hospital
            );
          }

          // Also notify the doctor
          if (appt.doctors?.phone) {
            const dPhone = normalizePhone(appt.doctors.phone);
            if (appt.consultation_type === "call" && appt.meet_link) {
              await pause(300);
              await sendMessage(dPhone,
                `⏰ *Upcoming Video Call — ${hospital?.name || "Cura"}*\n\n` +
                `Dr. ${docName}, you have a video consultation with *${appt.name}* in *30 minutes* at *${appt.slot}*.\n\n` +
                `📹 *Google Meet link:*\n${appt.meet_link}`,
                hospital
              );
            } else {
              await pause(300);
              await sendMessage(dPhone,
                `⏰ *Upcoming Appointment — ${hospital?.name || "Cura"}*\n\n` +
                `Dr. ${docName}, you have an in-person appointment with *${appt.name}* in *30 minutes* at *${appt.slot}*.`,
                hospital
              );
            }
          }

          console.log(`[Reminder] ✅ Sent 30-min reminder for appt ${appt.id} to ${pPhone}`);
        } catch (e) {
          console.error(`[Reminder] Failed for appt ${appt.id}:`, e.message);
          sentReminders.delete(reminderKey); // Allow retry
        }
      }
    }

    // Clean up old reminder keys (older than today)
    if (sentReminders.size > 500) {
      // Keep only today's entries by clearing at midnight (handled by daily reset)
    }
  } catch (err) {
    console.error("[Reminder] Unexpected error:", err.message);
  }
}

// Run reminder check every 5 minutes
setInterval(checkUpcomingAppointments, 5 * 60 * 1000);

// Reset sent reminders daily at midnight IST
function scheduleDailyReminderReset() {
  const now = getNowIST();
  const msUntilMidnight = (24 * 60 * 60 * 1000) - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000;
  setTimeout(() => {
    sentReminders.clear();
    console.log("[Reminder] 🔄 Daily reset of sent reminders");
    setInterval(() => { sentReminders.clear(); console.log("[Reminder] 🔄 Daily reset"); }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}
scheduleDailyReminderReset();

/* ─── HTTP APP ───────────────────────────────────────────────────────────── */
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
  const p        = normalizePhone(phone);
  const hospital = await getHospitalById(hospitalId);
  try {
    if (status === "booked") {
      await sendT(p,
        `✅ *Confirmed!*\n\n*Dr. ${doctorName}* has approved your appointment at *${slot}* on *${date}*.\nSee you at *${hospital?.name || "our clinic"}*! 🏥`,
        hospital);
    } else if (status === "rejected") {
      const { data: appt } = await supabase.from("appointments")
        .select("name, age, reason, patient_id, ai_notes")
        .eq("doctor_id", doctorId).eq("date", date).eq("slot", slot)
        .neq("status", "booked").order("created_at", { ascending: false }).limit(1).maybeSingle();
      const session = getSession(p);
      session.step  = "AWAIT_SLOT";
      session.data  = {
        ...session.data, date, doctor_id: doctorId, doctor_name: doctorName,
        name:           session.data.name    || appt?.name,
        age:            session.data.age     || appt?.age,
        reason:         session.data.reason  || appt?.reason,
        savedPatientId: session.data.savedPatientId || appt?.patient_id,
        ai_notes:       session.data.ai_notes       || appt?.ai_notes,
      };
      await sendT(p, `❌ *Update from ${hospital?.name || "the clinic"}*\n\nDr. ${doctorName} is no longer available at *${slot}* on *${date}*.`, hospital);
      await pause(CONFIG.TYPING_DELAY_MS);
      await sendT(p, "Please select a different time slot:", hospital);
      await showDynamicSlots(p, doctorId, date, hospital);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Notify error:", err.message);
    res.status(500).send("Failed");
  }
});

app.post("/reschedule-notify", async (req, res) => {
  const { phone, patientName, newSlot, date, doctorName, hospitalId } = req.body;
 
  if (!phone) return res.status(400).json({ ok: false, error: "phone is required" });
 
  try {
    const p        = normalizePhone(phone);
    const hospital = await getHospitalById(hospitalId);
 
    const session = getSession(p);
    const lang    = session.lang || "english";
 
    const msg =
      `📅 *Appointment Rescheduled — ${hospital?.name || "Cura"}*\n\n` +
      `Hi *${patientName || "Patient"}*!\n\n` +
      `Your appointment${doctorName ? ` with *Dr. ${doctorName}*` : ""} has been rescheduled.\n\n` +
      `🕐 *New Time:* ${newSlot}\n` +
      (date ? `📅 *Date:* ${date}\n` : "") +
      `\nIf you have any questions, please contact us. See you soon! 🏥`;
 
    const translated = lang !== "english" ? await tr(msg, lang) : msg;
    await sendMessage(p, translated, hospital);
 
    console.log(`[Reschedule] ✅ Notified ${p} → new slot: ${newSlot}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[Reschedule] ❌ notify failed:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/fix-meet-links", async (req, res) => {
  try {
    // Fetch all video call appointments that have a Google Meet link (bad/fake)
    const { data: badAppts, error } = await supabase
      .from("appointments")
      .select("id, name, meet_link, phone, hospital_id, doctors(name)")
      .eq("consultation_type", "call")
      .like("meet_link", "%meet.google.com%"); // only the fake ones
 
    if (error) throw error;
    if (!badAppts?.length) {
      return res.json({ ok: true, fixed: 0, message: "No bad links found — all good!" });
    }
 
    console.log(`[FixLinks] Found ${badAppts.length} appointments with bad Google Meet links`);
 
    let fixed = 0;
    const results = [];
 
    for (const appt of badAppts) {
      const newLink = generateMeetLink(); // uses the Jitsi function
 
      // Update in DB
      const { error: updateErr } = await supabase
        .from("appointments")
        .update({ meet_link: newLink })
        .eq("id", appt.id);
 
      if (updateErr) {
        console.error(`[FixLinks] Failed to fix appt ${appt.id}:`, updateErr.message);
        results.push({ id: appt.id, name: appt.name, status: "failed", error: updateErr.message });
        continue;
      }
 
      // Notify patient via WhatsApp with new link (only for booked/pending appointments)
      try {
        const hospital = await getHospitalById(appt.hospital_id);
        const pPhone   = normalizePhone(appt.phone);
        const docName  = appt.doctors?.name || "your doctor";
 
        await sendMessage(pPhone,
          `📹 *Updated Video Call Link — ${hospital?.name || "Cura"}*\n\n` +
          `Hi *${appt.name}*! Your previous video call link was invalid.\n\n` +
          `Here is your new working link:\n${newLink}\n\n` +
          `Please save this link. See you at your appointment! 🩺`,
          hospital
        );
        await pause(300); // avoid rate limiting
      } catch (notifyErr) {
        console.warn(`[FixLinks] Could not notify ${appt.name}:`, notifyErr.message);
      }
 
      fixed++;
      results.push({ id: appt.id, name: appt.name, status: "fixed", newLink });
      console.log(`[FixLinks] ✅ Fixed appt ${appt.id} (${appt.name}) → ${newLink}`);
    }
 
    res.json({
      ok: true,
      fixed,
      total: badAppts.length,
      results,
      message: `Fixed ${fixed}/${badAppts.length} appointments. Patients notified via WhatsApp.`,
    });
  } catch (err) {
    console.error("[FixLinks] Error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
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
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
    });
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
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post("/update-hospital", async (req, res) => {
  const { id, name, address, whatsapp_phone_number_id, whatsapp_token } = req.body;
  if (!id) return res.status(400).json({ error: "Hospital ID required" });
  const updates = {};
  if (name                     !== undefined) updates.name                     = name.trim();
  if (address                  !== undefined) updates.address                  = address?.trim() || null;
  if (whatsapp_phone_number_id !== undefined) updates.whatsapp_phone_number_id = whatsapp_phone_number_id?.trim() || null;
  if (whatsapp_token           !== undefined) updates.whatsapp_token           = whatsapp_token?.trim() || null;
  try {
    const { data, error } = await supabase.from("hospitals").update(updates).eq("id", id).select().single();
    if (error) throw error;
    await loadHospitalConfigs();
    return res.json({ hospital: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post("/doctor-action", async (req, res) => {
  const { appointmentId, action, doctorPhone, hospitalId } = req.body;
  const dPhone   = normalizePhone(doctorPhone);
  const hospital = await getHospitalById(hospitalId);
  try {
    const { data: appt } = await supabase.from("appointments")
      .select("*, doctors(name, phone)").eq("id", appointmentId).single();
    if (!appt) return res.status(404).json({ error: "Appointment not found" });

    const apptHospital = await getHospitalById(appt.hospital_id);
    const newStatus  = action === "approve" ? "booked" : "rejected";
    await supabase.from("appointments").update({ status: newStatus }).eq("id", appointmentId);
    const clinicName = apptHospital?.name || "the clinic";
    if (action === "approve") {
      let confirmMsg = `✅ *Confirmed!*\n\n*Dr. ${appt.doctors.name}* approved your appointment at *${appt.slot}* on *${appt.date}*.\nSee you at *${clinicName}*! 🏥`;
      if (appt.consultation_type === "call" && appt.meet_link) {
        confirmMsg += `\n\n📹 *Your Google Meet link:*\n${appt.meet_link}`;
      }
      await sendT(normalizePhone(appt.phone), confirmMsg, apptHospital);
      await sendMessage(dPhone,
        `✅ Approved — *${appt.name}*'s appointment at *${appt.slot}* on *${appt.date}* is confirmed.`,
        hospital);
    } else {
      const pPhone   = normalizePhone(appt.phone);
      const pSession = getSession(pPhone);
      pSession.step       = "AWAIT_SLOT";
      pSession.hospital   = apptHospital;
      pSession.hospitalId = appt.hospital_id;
      pSession.data = {
        name: appt.name, age: appt.age, reason: appt.reason,
        savedPatientId: appt.patient_id, date: appt.date,
        doctor_id: appt.doctor_id, doctor_name: appt.doctors.name,
        ai_notes: appt.ai_notes || null,
        consultation_type: appt.consultation_type || "personal",
      };
      await sendT(pPhone,
        `❌ *Update from ${clinicName}*\n\nDr. ${appt.doctors.name} is no longer available at *${appt.slot}* on *${appt.date}*.`,
        apptHospital);
      await pause(CONFIG.TYPING_DELAY_MS);
      await sendT(pPhone, "Please choose a different time slot:", apptHospital);
      await showDynamicSlots(pPhone, appt.doctor_id, appt.date, apptHospital);
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
  const appUrl   = process.env.APP_URL;
  if (!appUrl) console.warn("⚠️  APP_URL is not set in .env");
  try {
    await sendMessage(normalizePhone(phone),
      `👨‍⚕️ *Welcome to ${hospital?.name || "Cura"}, Dr. ${name}!*\n\nYour specialist account is ready.\n\n📧 *Email:* ${email}\n🔑 *Temp Password:* ${tempPassword}\n🏥 *Hospital:* ${hospital?.name || "N/A"}\n🔗 *Login:* ${appUrl || "[APP_URL not configured]"}/login\n\n⚠️ Please login and reset your password immediately.`,
      hospital);
    res.sendStatus(200);
  } catch (err) {
    console.error("Doctor notify:", err.message);
    res.status(500).send("Failed");
  }
});

const invoiceStore = new Map();
function buildPayPageHTML(inv) {

  const fmt = (n) =>
    "₹" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const rows = inv.items.map((it) => `
    <tr>
      <td>${it.desc}</td>
      <td style="text-align:center">${it.category || "-"}</td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">${fmt(it.price)}</td>
      <td style="text-align:right">${fmt(it.price * it.qty)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${inv.invoiceNum} — Pay Now</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Syne:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Plus Jakarta Sans',sans-serif;background:#F8FAFB;min-height:100vh;padding:24px 16px}
    .wrap{max-width:620px;margin:0 auto}
    .card{background:white;border-radius:24px;padding:28px;box-shadow:0 4px 24px rgba(20,61,48,0.08);margin-bottom:16px;border:1px solid rgba(20,61,48,0.07)}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #143D30}
    .brand{font-family:'Syne',sans-serif;font-size:28px;font-weight:900;color:#143D30;letter-spacing:-0.03em}
    .brand span{font-size:10px;display:block;color:#94A3B8;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;margin-top:2px}
    .inv-num{font-size:12px;color:#64748B;text-align:right;margin-top:4px}
    .info-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
    .info-box{background:#F8FAFB;border-radius:12px;padding:12px 14px;border:1px solid #E2E8F0}
    .info-box label{font-size:9px;font-weight:800;color:#94A3B8;letter-spacing:0.2em;text-transform:uppercase;display:block;margin-bottom:4px}
    .info-box p{font-size:13px;color:#1E293B;font-weight:700}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
    th{text-align:left;padding:8px 10px;font-size:9px;font-weight:800;color:#64748B;letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid #E2E8F0;background:#F8FAFB}
    td{padding:10px 10px;border-bottom:1px solid #F1F5F9}
    .sum{background:#F8FAFB;border-radius:14px;padding:16px 18px;border:1px solid #E2E8F0;margin-bottom:20px}
    .sum-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#64748B}
    .sum-row span:last-child{color:#1E293B;font-weight:600}
    .sum-row.tot{border-top:2px solid #143D30;margin-top:8px;padding-top:10px;font-size:18px;color:#143D30;font-weight:900;font-family:'Syne',sans-serif}
    .pay-btn{display:block;width:100%;padding:18px;background:linear-gradient(135deg,#25D366,#1DA851);color:white;border:none;border-radius:16px;font-family:'Syne',sans-serif;font-weight:900;font-size:15px;letter-spacing:0.06em;cursor:pointer;text-align:center;margin-bottom:12px;box-shadow:0 8px 24px rgba(37,211,102,0.30)}
    .paid-badge{display:flex;align-items:center;justify-content:center;gap:10px;padding:18px;background:#ECFDF5;border:2px solid #6EE7B7;border-radius:16px;color:#059669;font-family:'Syne',sans-serif;font-weight:900;font-size:15px;margin-bottom:12px}
    .note{font-size:11px;color:#94A3B8;text-align:center;line-height:1.6}
    #status-msg{display:none;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:12px 16px;font-size:12px;color:#1D4ED8;margin-bottom:12px;text-align:center}
  </style>
</head><body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">Cura<span>Clinical Management</span></div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:900;color:#0F172A">Invoice</div>
        <div class="inv-num">${inv.invoiceNum}</div>
      </div>
    </div>
 
    <div class="info-row">
      <div class="info-box"><label>Patient</label><p>${inv.patientName || "—"}</p></div>
      <div class="info-box"><label>Doctor</label><p>Dr. ${inv.doctorName || "—"}</p></div>
      <div class="info-box"><label>Visit Date</label><p>${inv.visitDate || "—"}</p></div>
      <div class="info-box"><label>Due Date</label><p>${inv.dueDate || "—"}</p></div>
    </div>
 
    <table>
      <thead><tr>
        <th>Description</th><th style="text-align:center">Cat.</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit</th>
        <th style="text-align:right">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
 
    <div class="sum">
      <div class="sum-row"><span>Subtotal</span><span>${fmt(inv.subtotal)}</span></div>
      ${inv.tax       > 0 ? `<div class="sum-row"><span>GST (5%)</span><span>${fmt(inv.tax)}</span></div>`              : ""}
      ${inv.insurance > 0 ? `<div class="sum-row"><span>Insurance Adj.</span><span>-${fmt(inv.insurance)}</span></div>` : ""}
      ${inv.discount  > 0 ? `<div class="sum-row"><span>Discount</span><span>-${fmt(inv.discount)}</span></div>`        : ""}
      <div class="sum-row tot"><span>Total Due</span><span>${fmt(inv.total)}</span></div>
    </div>
 
    ${inv.notes ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400E"><strong>Note:</strong> ${inv.notes}</div>` : ""}
 
    <div id="status-msg"></div>
 
    <div id="pay-area">
      <button class="pay-btn" onclick="handlePay()">💳 Pay Now — ${fmt(inv.total)}</button>
      <p class="note">
        Tap "Pay Now" to complete your payment securely.<br>
        Your doctor and clinic will be notified instantly once payment is received.
      </p>
    </div>
 
    <div id="paid-area" style="display:none">
      <div class="paid-badge">✅ Payment Received — Thank you, ${inv.patientName || "Patient"}!</div>
      <p class="note">Your receipt has been sent to your WhatsApp. Get well soon! 🙏</p>
    </div>
  </div>
</div>
 
<script>
  const INV = "${inv.invoiceNum}";
  const BOT = window.location.origin;
 
  async function checkStatus() {
    try {
      const r = await fetch(BOT + "/invoice-status/" + INV);
      const d = await r.json();
      if (d.status === "paid") showPaid();
    } catch (_) {}
  }
  checkStatus();
  const pollId = setInterval(checkStatus, 6000);
 
  function showPaid() {
    clearInterval(pollId);
    document.getElementById("pay-area").style.display  = "none";
    document.getElementById("paid-area").style.display = "block";
  }
 
  async function handlePay() {
    document.getElementById("status-msg").style.display = "block";
    document.getElementById("status-msg").textContent   = "Processing payment…";
    document.querySelector(".pay-btn").disabled         = true;
 
    try {
      const res = await fetch(BOT + "/invoice-paid", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          invoiceNum:  INV,
          patientName: "${inv.patientName || ""}",
          phone:       "${inv.phone || ""}",
          total:       ${inv.total},
          doctorId:    "${inv.doctorId || ""}",
          hospitalId:  "${inv.hospitalId || ""}",
        }),
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById("status-msg").style.display = "none";
        showPaid();
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (err) {
      document.getElementById("status-msg").textContent    = "⚠️ " + err.message + " — please try again.";
      document.querySelector(".pay-btn").disabled           = false;
    }
  }
</script>
</body></html>
  `;
}

/* ─── SEND INVOICE VIA WHATSAPP ──────────────────────────────────────────── */
app.post("/send-invoice", async (req, res) => {
  const {
    phone, patientName, patientId, doctorName, facility,
    invoiceNum, visitDate, dueDate, items,
    subtotal, tax, insurance, discount, total,
    payStatus, insProvider, notes, hospitalId, doctorId,
    taxEnabled,
  } = req.body;
 
  if (!phone || !items?.length)
    return res.status(400).json({ error: "phone and items are required" });
 
  const hospital = await getHospitalById(hospitalId);
  const rawPhone = phone.replace(/\D/g, "");
  const p        = rawPhone.length === 10 ? "91" + rawPhone : rawPhone;
 
  const fmt = (n) =>
    "₹" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
 
  invoiceStore.set(invoiceNum, {
    invoiceNum, patientName, patientId, doctorName, facility,
    visitDate, dueDate, items,
    subtotal, tax, insurance, discount, total,
    payStatus: "pending", insProvider, notes,
    hospitalId, doctorId, phone: p,
    status: "sent",
    createdAt: new Date().toISOString(),
    paid_at: null,
  });
 
  const payUrl = `http://localhost:${CONFIG.PORT}/pay/${invoiceNum}`;
 
  const lineList = items
    .map((it) => `  • ${it.desc} × ${it.qty} = ${fmt(it.price * it.qty)}`)
    .join("\n");
 
  const taxLine  = tax      > 0 ? `\n  📋 GST (5%): ${fmt(tax)}`             : "";
  const insLine  = insurance > 0 ? `\n  🏥 Insurance: -${fmt(insurance)}`    : "";
  const discLine = discount  > 0 ? `\n  🎁 Discount: -${fmt(discount)}`      : "";
  const noteLine = notes       ? `\n\n📝 *Note:* ${notes}`                   : "";
  const insProv  = insProvider ? `\n🏥 *Insurance:* ${insProvider}`          : "";
 
  const summaryMsg = [
    `🏥 *${facility || "Cura"} — Invoice ${invoiceNum}*`,
    ``,
    `Dear *${patientName || "Patient"}*,`,
    `Your bill from *Dr. ${doctorName}* is ready.`,
    ``,
    `*Services:*`,
    lineList,
    ``,
    `*Summary:*`,
    `  Subtotal: ${fmt(subtotal)}${taxLine}${insLine}${discLine}`,
    `  ━━━━━━━━━━━━━━━`,
    `  *Total Due: ${fmt(total)}*`,
    ``,
    `📅 Visit: ${visitDate}${insProv}`,
    noteLine,
    ``,
    `Tap the button below or click the link to view & pay your invoice. 👇`,
  ].filter(Boolean).join("\n");
 
  try {
    await sendMessage(p, summaryMsg, hospital);
    await pause(600);
    await sendCTAButton(
      p,
      `💳 *Total Due: ${fmt(total)}*\nTap the button or use this link:\n${payUrl}`,
      "View & Pay Invoice",
      payUrl,
      hospital
    );
    console.log(`[Invoice] ✅ Sent to ${p} — ${invoiceNum} — Pay: ${payUrl}`);
    res.json({ success: true, payUrl });
  } catch (err) {
    console.error("[Invoice] ❌ send-invoice error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
 
app.get("/pay/:invoiceNum", (req, res) => {
  const inv = invoiceStore.get(req.params.invoiceNum);
  if (!inv) {
    return res.status(404).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2 style="color:#EF4444">Invoice not found</h2>
        <p style="color:#64748B">This link may have expired or already been paid.</p>
      </body></html>`);
  }
  if (inv.status === "paid") {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2 style="color:#10B981">✅ Already Paid</h2>
        <p style="color:#64748B">Invoice ${inv.invoiceNum} was paid on ${new Date(inv.paid_at).toLocaleString()}.</p>
      </body></html>`);
  }
  res.send(buildPayPageHTML(inv));
});
 
app.get("/invoice-status/:invoiceNum", (req, res) => {
  const inv = invoiceStore.get(req.params.invoiceNum);
  if (!inv) return res.status(404).json({ error: "not found" });
  res.json({ status: inv.status, paid_at: inv.paid_at });
});
 
app.post("/invoice-paid", async (req, res) => {
  const { invoiceNum, patientName, phone, total, doctorId, hospitalId } = req.body;
 
  const inv = invoiceStore.get(invoiceNum);
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  if (inv.status === "paid") return res.json({ success: true, already: true });
 
  inv.status  = "paid";
  inv.paid_at = new Date().toISOString();
  invoiceStore.set(invoiceNum, inv);
 
  const fmt     = (n) => "₹" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const hospital = await getHospitalById(hospitalId || inv.hospitalId);
 
  try {
    const rawPhone = (phone || inv.phone || "").replace(/\D/g, "");
    const p = rawPhone.length === 10 ? "91" + rawPhone : rawPhone;
    if (p.length >= 10) {
      await sendMessage(p,
        `✅ *Payment Confirmed!*\n\nThank you, *${patientName || inv.patientName || "Patient"}*!\n\n` +
        `Invoice *${invoiceNum}* for *${fmt(total ?? inv.total)}* has been received.\n\n` +
        `We appreciate you choosing *${hospital?.name || "Cura"}*. Get well soon! 🙏`,
        hospital);
    }
 
    const dId = doctorId || inv.doctorId;
    if (dId) {
      const { data: doc } = await supabase.from("doctors").select("phone, name").eq("id", dId).single();
      if (doc?.phone) {
        await pause(400);
        await sendMessage(normalizePhone(doc.phone),
          `💰 *Payment Received — ${hospital?.name || "Cura"}*\n\n` +
          `Patient *${patientName || inv.patientName}* has paid invoice *${invoiceNum}*.\n` +
          `Amount: *${fmt(total ?? inv.total)}*\n` +
          `Time: ${new Date().toLocaleTimeString("en-IN")}`,
          hospital);
      }
    }
  } catch (err) {
    console.error("[Invoice Paid] Notification error:", err.message);
  }
 
  console.log(`[Invoice] 💰 Paid: ${invoiceNum} — ${patientName}`);
  res.json({ success: true });
});
 
async function sendCTAButton(to, bodyText, buttonLabel, url, hospital) {
  if (USE_WHATSAPP_WEB && waClient) {
    const chatId = to.includes("@") ? to : `${to}@c.us`;
    return waClient.sendMessage(chatId, `${bodyText}\n\n🔗 ${buttonLabel}:\n${url}`);
  }
  const token   = hospital?.whatsapp_token || CONFIG.TOKEN;
  const phoneId = hospital?.whatsapp_phone_number_id || CONFIG.PHONE_NUMBER_ID;
  return apiPost(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body:   { text: bodyText },
      action: {
        name:       "cta_url",
        parameters: { display_text: buttonLabel, url },
      },
    },
  }, token);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN FLOW
   ═══════════════════════════════════════════════════════════════════════════ */
async function handleFlow(phone, msg, hospital) {
  const session    = getSession(phone);
  session.msgCount = (session.msgCount || 0) + 1;

  if (!session.hospitalId) { session.hospitalId = hospital.id; session.hospital = hospital; }
  const H = session.hospital || hospital;

  let text         = "";
  let displayTitle = "";
  let rawButtonId  = "";

  /* ── Voice / audio messages ─────────────────────────────────────────── */
  const msgType = msg.type;
  if (msgType === "audio" || msgType === "voice" || msgType === "ptt") {
    const mediaId = msg.audio?.id || msg.voice?.id;
    if (!mediaId) {
      return sendT(phone, "⚠️ Could not process voice message. Please type your symptoms instead.", H);
    }
    await sendT(phone, "🎙️ Processing your voice message, please wait...", H);
    try {
      const result = await transcribeVoiceMessage(mediaId, H);
      const transcribed = result.text;
      const voiceLang   = result.lang;
      if (!transcribed || transcribed.trim().length < 2) {
        return sendT(phone, "⚠️ Could not understand the audio. Please try again or type your symptoms.", H);
      }
      if (!session.lang || session.lang === "english") {
        session.lang = voiceLang;
        console.log(`[Lang] Set from voice transcription: ${voiceLang} for ${phone}`);
      }
      console.log(`🎙️ Transcribed [${phone}] (${voiceLang}): "${transcribed}"`);
      if (!session.data.name) {
        session.step            = "AWAIT_NAME_FOR_AI";
        session.data._pendingVoiceSymptoms = transcribed;
        return sendT(phone,
          `🎙️ Got it! Before we continue, please tell me the *patient's full name*:`,
          H);
      }
      session.step = "AI_TRIAGE";
      return await processAITriage(phone, transcribed, session, H);
    } catch (e) {
      console.error("Voice transcription error:", e.message);
      return sendT(phone, "⚠️ Voice processing failed. Please type your symptoms.", H);
    }
  }

  /* ── Parse interactive / text messages ──────────────────────────────── */
  if (msgType === "interactive") {
    rawButtonId  = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || "";
    text         = rawButtonId;
    displayTitle = msg.interactive?.list_reply?.title || "";
  } else {
    text = (msg.text?.body || "").trim();
  }

  if (session._buttonMap?.[text]) {
    displayTitle = text;
    text         = session._buttonMap[text];
    delete session._buttonMap;
  }

  if (!session.lang) {
    const rawText = msgType === "interactive" ? "" : (msg.text?.body || "").trim();
    if (rawText) {
      session.lang = detectLang(rawText);
      if (session.lang !== "english") {
        console.log(`[Lang] Locked from first message: ${session.lang} for ${phone}`);
      }
    }
  }

  /* ── Doctor approve / reject via WhatsApp ────────────────────────────── */
  const actionId = rawButtonId || text;
  if (actionId.startsWith("appr_") || actionId.startsWith("rejt_")) {
    return handleDoctorAction(actionId, phone, null);
  }

  const lower         = text.toLowerCase().replace(/\s/g, "");
  const RESETS        = ["cancel", "reset", "stop", "restart", "menu", "main", "रुको", "बंद", "रद्द"];
  const GREETS        = [
    "hi", "hello", "start", "book", "hey",
    "namaste", "namaskar", "jai",
    "kem", "kemcho",
  ];
  const hospitalAlias = H?.name?.toLowerCase().replace(/\s/g, "");

  if (RESETS.some((r) => lower.startsWith(r))) {
    const lang = session.lang;
    sessions.delete(phone);
    aiHistories.delete(phone);
    const fresh = getSession(phone);
    fresh.lang  = lang;
    return sendT(phone, "🔄 Session reset. Send *Hi* to start a new booking.", H);
  }

  if (GREETS.includes(lower) || (hospitalAlias && lower === hospitalAlias)) {
    return showMainMenu(phone, H);
  }

  if (["help", "?", "info"].includes(lower)) {
    return sendT(phone,
      `ℹ️ *Cura Help*\n\n• Type *Hi* to start or restart a booking\n• Type *Symptoms* or send a voice note to use AI triage\n• Type *Cancel* to reset your session\n• Type *Menu* to go back to the main menu\n\nNeed support? Contact ${H?.name || "our clinic"}.`,
      H);
  }

  /* ── Step machine ─────────────────────────────────────────────────────── */
  switch (session.step) {

    /* ── FEATURE 1: Main menu shows only registered patients + book new ── */
    case "AWAIT_MEMBER_SELECT": {
      const patients = session.data.familyList || [];
      if (text === "member_new") {
        session.step = "AWAIT_NAME_FOR_AI";
        await pause(CONFIG.TYPING_DELAY_MS);
        return sendT(phone, "Please enter the *full name* of the patient:", H);
      }
      const idx = parseInt(text.replace("member_", ""), 10);
      if (!isNaN(idx) && patients[idx]) {
        const p = patients[idx];
        Object.assign(session.data, {
          name:           p.patient_name,
          age:            p.age,
          gender:         p.gender,
          savedPatientId: p.id,
          relation:       p.relation,
        });
        await pause(CONFIG.TYPING_DELAY_MS);
        await sendT(phone, `👋 Booking for *${p.patient_name}* (${p.relation || "Patient"})\n\nPlease describe the *symptoms* — you can type or send a voice note in Hindi, Gujarati, or English. 🤖`, H);
        session.step = "AI_TRIAGE";
        return;
      }
      return sendT(phone, "Please tap a valid option from the list.", H);
    }

    case "AWAIT_NAME_FOR_AI":
      if (!text || text.length < 2)
        return sendT(phone, "Please enter a valid full name (at least 2 characters):", H);
      session.data.name     = toTitleCase(text);
      session.data.relation = "Self";
      if (session.data._pendingVoiceSymptoms) {
        const symptoms = session.data._pendingVoiceSymptoms;
        delete session.data._pendingVoiceSymptoms;
        session.step = "AI_TRIAGE";
        await pause(CONFIG.TYPING_DELAY_MS);
        await sendT(phone, `🩺 Thanks *${session.data.name}*! Analyzing your voice symptoms now...`, H);
        return processAITriage(phone, symptoms, session, H);
      }
      session.step = "AI_TRIAGE";
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendT(phone,
        `🩺 Thanks *${session.data.name}*! Please describe your symptoms — you can *type* or send a *voice message* in any language (Hindi, Gujarati, English, etc.).\n\nI'll find the right doctor for you! 🤖`,
        H);

    case "AI_TRIAGE": {
      if (["book", "hi", "hello", "menu", "namaste", "kem", "kemcho"].includes(lower)) {
        session.step = "IDLE";
        return showMainMenu(phone, H);
      }
      return processAITriage(phone, text, session, H);
    }

    case "AWAIT_EMG_CONFIRM": {
      if (text === "emg_book_yes") {
        const triage = session.data._triage;
        if (!triage) return showMainMenu(phone, H);
        const { doctors, department, wasFallback, hospitalForAppt } = await findBestDoctor(triage, H);
        if (!doctors.length) {
          return sendT(phone, "⚠️ No doctors available right now. Please come in directly or call the clinic.", H);
        }
        if (wasFallback) {
          await sendT(phone, `ℹ️ No *${triage.specialty}* specialist available. Showing *${department}* doctors.`, H);
        }
        if (hospitalForAppt && hospitalForAppt.id !== H.id) {
          session.hospital   = hospitalForAppt;
          session.hospitalId = hospitalForAppt.id;
        }
        session.data.department  = department;
        session.data._doctorList = doctors.slice(0, 3);
        session.data._doctorMap  = {};
        doctors.forEach((d, i) => {
          session.data._doctorMap["doc_" + i]      = d.id;
          session.data._doctorMap[d.name.trim()]   = d.id;
          session.data._doctorMap[d.id.toString()] = d.id;
        });
        session.step = "AWAIT_DOCTOR";
        return sendTButtons(phone, "⚡ Select a doctor:",
          doctors.slice(0, 3).map((d, i) => ({ id: "doc_" + i, title: d.name.substring(0, 20) })), H);
      }
      sessions.delete(phone);
      aiHistories.delete(phone);
      return sendT(phone,
        "✅ Doctors have been notified. Please proceed to the clinic immediately. Get well soon! 🙏", H);
    }

    /* ── FEATURE 3: Department not available → offer General or cross-hospital ── */
    case "AWAIT_DEPT": {
      session.data.department = text.replace("dept_", "").replace(/_/g, " ");
      session.step            = "AWAIT_DOCTOR";
      const { data: doctors } = await supabase.from("doctors").select("id, name, hospital_id")
        .eq("department", session.data.department).eq("is_available", true).eq("hospital_id", H.id);
      if (!doctors?.length) {
        // Try cross-hospital or General Medicine
        return handleDepartmentNotFound(phone, session.data.department, H);
      }
      session.data._doctorMap  = {};
      session.data._doctorList = doctors.slice(0, 3);
      doctors.forEach((d, i) => {
        const key = "doc_" + i;
        session.data._doctorMap[key]                            = d.id;
        session.data._doctorMap[d.name.trim()]                  = d.id;
        session.data._doctorMap[d.name.substring(0, 20).trim()] = d.id;
        session.data._doctorMap[d.id.toString()]                = d.id;
      });
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendTButtons(phone,
        `👨‍⚕️ Choose a Specialist in *${session.data.department}*:`,
        session.data._doctorList.map((d, i) => ({ id: "doc_" + i, title: d.name.substring(0, 20) })),
        H);
    }

    case "AWAIT_DEPT_FALLBACK": {
      if (text === "dept_general") {
        // Use General Medicine at same hospital
        const { data: doctors } = await supabase.from("doctors").select("id, name, hospital_id")
          .eq("department", "General Medicine").eq("is_available", true).eq("hospital_id", H.id).limit(3);
        if (!doctors?.length) {
          return sendT(phone, "⚠️ No General Medicine doctors available either. Please call the clinic directly.", H);
        }
        session.data.department  = "General Medicine";
        session.data._doctorList = doctors;
        session.data._doctorMap  = {};
        doctors.forEach((d, i) => {
          session.data._doctorMap["doc_" + i]      = d.id;
          session.data._doctorMap[d.name.trim()]   = d.id;
          session.data._doctorMap[d.id.toString()] = d.id;
        });
        session.step = "AWAIT_DOCTOR";
        await pause(CONFIG.TYPING_DELAY_MS);
        return sendTButtons(phone,
          `👨‍⚕️ Available *General Medicine* doctors:`,
          doctors.map((d, i) => ({ id: "doc_" + i, title: d.name.substring(0, 20) })),
          H);
      }
      if (text === "dept_cross") {
        const requestedDept = session.data._fallbackDept || session.data.department;
        const { data: crossDoctors } = await supabase.from("doctors")
          .select("id, name, department, hospital_id, hospitals(id, name)")
          .neq("hospital_id", H.id)
          .eq("is_available", true)
          .ilike("department", `%${requestedDept}%`)
          .limit(3);
        if (!crossDoctors?.length) {
          return sendT(phone, `⚠️ No *${requestedDept}* specialists found at other hospitals either. Showing General Medicine options.`, H);
        }
        const crossHosp = crossDoctors[0].hospitals || await getHospitalById(crossDoctors[0].hospital_id);
        session.hospital   = crossHosp;
        session.hospitalId = crossHosp?.id;
        session.data.department  = crossDoctors[0].department;
        session.data._doctorList = crossDoctors;
        session.data._doctorMap  = {};
        crossDoctors.forEach((d, i) => {
          session.data._doctorMap["doc_" + i]      = d.id;
          session.data._doctorMap[d.name.trim()]   = d.id;
          session.data._doctorMap[d.id.toString()] = d.id;
        });
        session.step = "AWAIT_DOCTOR";
        await pause(CONFIG.TYPING_DELAY_MS);
        await sendT(phone, `ℹ️ Showing *${requestedDept}* specialists at *${crossHosp?.name || "another clinic"}*:`, H);
        return sendTButtons(phone,
          `👨‍⚕️ Select a doctor:`,
          crossDoctors.map((d, i) => ({ id: "doc_" + i, title: d.name.substring(0, 20) })),
          crossHosp || H);
      }
      return sendT(phone, "Please tap one of the available options.", H);
    }

    case "AWAIT_DOCTOR": {
      const dMap       = session.data._doctorMap || {};
      const resolvedId = dMap[text] || dMap[text.trim()] || text;
      const { data: doc } = await supabase.from("doctors").select("*").eq("id", resolvedId).single();
      if (!doc) {
        console.error(`AWAIT_DOCTOR: could not resolve "${text}" via map keys: ${Object.keys(dMap).join(", ")}`);
        return sendT(phone, "Sorry, couldn't find that doctor. Please tap a valid option.", H);
      }
      // Ensure doctor belongs to the correct hospital
      if (doc.hospital_id && doc.hospital_id !== (session.hospitalId || H.id)) {
        const docHospital = await getHospitalById(doc.hospital_id);
        if (docHospital) {
          session.hospital   = docHospital;
          session.hospitalId = docHospital.id;
          console.log(`[Hospital] Switched to doctor's hospital: ${docHospital.name} for ${phone}`);
        }
      }
      Object.assign(session.data, {
        doctor_id:       resolvedId,
        doctor_name:     doc.name,
        requires_age:    doc.requires_age,
        requires_reason: doc.requires_reason,
      });
      session.step = "AWAIT_DATE";
      const dates  = buildDateOptions();
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendTButtons(phone, `📅 Select a date for *${doc.name}*:`, dates, H);
    }

    case "AWAIT_DATE":
      session.data.date = text.replace("date_", "");
      // FEATURE 4: After date, ask consultation type
      session.step = "AWAIT_CONSULTATION_TYPE";
      await pause(CONFIG.TYPING_DELAY_MS);
      return sendTButtons(phone,
        `How would you like to consult *Dr. ${session.data.doctor_name}*?`,
        [
          { id: "consult_personal", title: "🏥 Visit in Person" },
          { id: "consult_call",     title: "📹 Video Call"      },
        ],
        H);

    /* ── FEATURE 4 & 5: Consultation type selection ── */
    case "AWAIT_CONSULTATION_TYPE": {
      if (text === "consult_personal") {
        session.data.consultation_type = "personal";
      } else if (text === "consult_call") {
        session.data.consultation_type = "call";
      } else {
        return sendTButtons(phone,
          `Please choose how you'd like to consult *Dr. ${session.data.doctor_name}*:`,
          [
            { id: "consult_personal", title: "🏥 Visit in Person" },
            { id: "consult_call",     title: "📹 Video Call"      },
          ],
          H);
      }
      session.step = "AWAIT_SLOT";
      await pause(CONFIG.TYPING_DELAY_MS);
      return showDynamicSlots(phone, session.data.doctor_id, session.data.date, H);
    }

    case "AWAIT_SLOT":
      if (text.startsWith("full_"))
        return sendT(phone, "⚠️ That slot is already taken. Please choose an available one (marked ✅).", H);
      if (text.startsWith("past_"))
        return sendT(phone, "⚠️ That time has already passed. Please choose an upcoming slot.", H);
      session.data.slot = displayTitle.replace("✅ ", "").trim() || text.replace("slot_", "");
      await pause(CONFIG.TYPING_DELAY_MS);
      return handleRequirementsFlow(phone, H);

    case "AWAIT_AGE": {
      const age = Number(text.trim());
      if (!text.trim() || isNaN(age) || age <= 0 || age > 120)
        return sendT(phone, "🔢 Please enter a valid age (e.g. *35*):", H);
      session.data.age = String(age);
      await pause(CONFIG.TYPING_DELAY_MS);
      return handleRequirementsFlow(phone, H);
    }

    case "AWAIT_REASON":
      if (!text || text.length < 3)
        return sendT(phone, "Please describe the reason in a few words:", H);
      session.data.reason = text;
      await pause(CONFIG.TYPING_DELAY_MS);
      return handleRequirementsFlow(phone, H);

    case "AWAIT_CONFIRM":
      if (text === "confirm_yes") return finalizeBooking(phone, session, H);
      sessions.delete(phone);
      aiHistories.delete(phone);
      return sendT(phone, "❌ Booking cancelled. Send *Hi* anytime to start a new one.", H);

    default:
      if (session.data.doctor_id && session.data.date && text.match(/\d{1,2}[:.]?\d{0,2}\s*(am|pm)?/i)) {
        session.step = "AWAIT_SLOT";
        return handleFlow(phone, msg, H);
      }
      return showMainMenu(phone, H);
  }
}

/* ─── HANDLE DEPARTMENT NOT FOUND ────────────────────────────────────────── */
async function handleDepartmentNotFound(phone, department, hospital) {
  const session = getSession(phone);
  session.data._fallbackDept = department;

  // Check if cross-hospital has the department
  const { data: crossDoctors } = await supabase.from("doctors")
    .select("id, name, hospital_id, hospitals(name)")
    .neq("hospital_id", hospital.id)
    .eq("is_available", true)
    .ilike("department", `%${department}%`)
    .limit(1);

  const hasCrossHospital = crossDoctors?.length > 0;
  const crossHospName    = crossDoctors?.[0]?.hospitals?.name || "another clinic";

  session.step = "AWAIT_DEPT_FALLBACK";

  if (hasCrossHospital) {
    await sendT(phone,
      `⚠️ No *${department}* specialists are currently available at *${hospital.name}*.\n\nWe found a *${department}* specialist at *${crossHospName}*.\n\nHow would you like to proceed?`,
      hospital);
    return sendTButtons(phone,
      "Please choose an option:",
      [
        { id: "dept_general", title: "General Medicine" },
        { id: "dept_cross",   title: `Specialist (${crossHospName.substring(0, 15)})` },
      ],
      hospital);
  } else {
    await sendT(phone,
      `⚠️ No *${department}* specialists are currently available at *${hospital.name}* or nearby clinics.\n\nWould you like to see a *General Medicine* doctor instead?`,
      hospital);
    return sendTButtons(phone,
      "Choose an option:",
      [
        { id: "dept_general", title: "General Medicine ✅" },
        { id: "cancel",       title: "Cancel ❌" },
      ],
      hospital);
  }
}

/* ─── AI TRIAGE PROCESSOR ────────────────────────────────────────────────── */
async function processAITriage(phone, symptomText, session, hospital) {
  await sendT(phone, "🤔 Analyzing your symptoms...", hospital);

  const triage = await triageWithAI(symptomText, phone, hospital);

  if (!triage) {
    return sendT(phone, "⚠️ AI assistant is temporarily unavailable. Type *Hi* to book manually.", hospital);
  }

  console.log(`🩺 Triage [${phone}]:`, JSON.stringify({
    specialty: triage.specialty, isEmergency: triage.isEmergency, severity: triage.severity,
    detectedLanguage: triage.detectedLanguage,
  }));

  applyTriageLang(phone, triage.detectedLanguage);
  await sendMessage(phone, triage.replyToPatient, hospital);
  await pause(600);

  session.data._triage = triage;

  if (triage.isEmergency) {
    await notifyEmergencyDoctors(phone, session.data.name, triage, hospital);
    await pause(500);
    await sendT(phone,
      `🚨 *Emergency protocol activated!*\n\nAll available doctors at *${hospital.name}* have been notified with your details.\n\nPlease come to the clinic immediately or call emergency services if needed. 🏥`,
      hospital);
    await pause(800);
    await sendTButtons(phone,
      "Would you also like to book an urgent appointment while on your way?",
      [{ id: "emg_book_yes", title: "Yes, book now ⚡" }, { id: "emg_book_no", title: "No, going in now" }],
      hospital);
    session.step = "AWAIT_EMG_CONFIRM";
    return;
  }

  const { doctors, department, wasFallback, triedSpecialty, crossHospital, crossHospitalName, hospitalForAppt } =
    await findBestDoctor(triage, hospital);

  if (!doctors.length) {
    // FEATURE 3: No doctors found even via AI — offer General or cross-hospital
    session.data._fallbackDept = triage.specialty;
    return handleDepartmentNotFound(phone, triage.specialty, hospital);
  }

  if (crossHospital) {
    await sendT(phone,
      `ℹ️ No *${triedSpecialty}* specialist is available at *${hospital.name}* right now.\n\n` +
      `We found a *${department}* specialist at *${crossHospitalName}* nearby. ` +
      `Your appointment will be booked there.`,
      hospital);
    await pause(500);
    session.hospital   = hospitalForAppt;
    session.hospitalId = hospitalForAppt.id;
  } else if (wasFallback) {
    await sendT(phone,
      `ℹ️ No *${triedSpecialty}* specialist is available right now. Showing *${department}* doctors who can assist you.`,
      hospital);
    await pause(500);
  }

  session.data.department  = department;
  session.data._doctorList = doctors.slice(0, 3);
  session.data._doctorMap  = {};
  doctors.forEach((d, i) => {
    session.data._doctorMap["doc_" + i]      = d.id;
    session.data._doctorMap[d.name.trim()]   = d.id;
    session.data._doctorMap[d.id.toString()] = d.id;
  });
  session.step = "AWAIT_DOCTOR";

  const effectiveHospital = session.hospital || hospital;
  await pause(CONFIG.TYPING_DELAY_MS);
  return sendTButtons(phone,
    `👨‍⚕️ Recommended doctors for *${department}*:`,
    doctors.slice(0, 3).map((d, i) => ({ id: "doc_" + i, title: d.name.substring(0, 20) })),
    effectiveHospital);
}

/* ─── Doctor approve / reject via WhatsApp ───────────────────────────────── */
async function handleDoctorAction(actionId, phone, _unusedHospital) {
  const isApprove     = actionId.startsWith("appr_");
  const appointmentId = actionId.slice(5);
  try {
    const { data: appt } = await supabase.from("appointments")
      .select("*, doctors(name, phone)").eq("id", appointmentId).single();
    if (!appt)
      return sendMessage(phone, "⚠️ Appointment not found. It may have been deleted.", await getDefaultHospital());
    if (appt.status !== "pending")
      return sendMessage(phone, `ℹ️ This appointment is already *${appt.status}*.`, await getDefaultHospital());

    const apptHospital = await getHospitalById(appt.hospital_id);
    const status       = isApprove ? "booked" : "rejected";
    const clinicName   = apptHospital?.name || "the clinic";
    await supabase.from("appointments").update({ status }).eq("id", appointmentId);

    if (isApprove) {
      let confirmMsg =
        `✅ *Confirmed!*\n\n*Dr. ${appt.doctors?.name}* approved your appointment at *${appt.slot}* on *${appt.date}*.\nSee you at *${clinicName}*! 🏥`;
      if (appt.consultation_type === "call" && appt.meet_link) {
        confirmMsg += `\n\n📹 *Your Google Meet link:*\n${appt.meet_link}`;
      }
      await sendT(normalizePhone(appt.phone), confirmMsg, apptHospital);
      return sendMessage(phone,
        `✅ Approved — *${appt.name}'s* appointment at *${appt.slot}* on *${appt.date}* is confirmed.`,
        apptHospital);
    } else {
      const pPhone   = normalizePhone(appt.phone);
      const pSession = getSession(pPhone);
      pSession.step       = "AWAIT_SLOT";
      pSession.hospital   = apptHospital;
      pSession.hospitalId = appt.hospital_id;
      pSession.data = {
        name:              appt.name,
        age:               appt.age,
        reason:            appt.reason,
        savedPatientId:    appt.patient_id,
        date:              appt.date,
        doctor_id:         appt.doctor_id,
        doctor_name:       appt.doctors?.name,
        ai_notes:          appt.ai_notes || null,
        hospitalId:        appt.hospital_id,
        consultation_type: appt.consultation_type || "personal",
      };
      await sendT(pPhone,
        `❌ *Update from ${clinicName}*\n\nDr. ${appt.doctors?.name} is no longer available at *${appt.slot}* on *${appt.date}*.`,
        apptHospital);
      await pause(CONFIG.TYPING_DELAY_MS);
      await sendT(pPhone, "Please choose a different time slot:", apptHospital);
      await showDynamicSlots(pPhone, appt.doctor_id, appt.date, apptHospital);
      return sendMessage(phone, `❌ Rejected — *${appt.name}* has been notified to rebook.`, apptHospital);
    }
  } catch (err) {
    console.error("Doctor action error:", err.message);
    return sendMessage(phone, "⚠️ Something went wrong. Use the dashboard to manage this request.", await getDefaultHospital());
  }
}

/* ─── BOOKING HELPERS ────────────────────────────────────────────────────── */
async function handleRequirementsFlow(phone, hospital) {
  const session = getSession(phone);
  const { data } = session;

  if (data.requires_age && !data.age) {
    session.step = "AWAIT_AGE";
    return sendT(phone, "🔢 What is the patient's *age*?", hospital);
  }
  if (data.requires_reason && !data.reason) {
    session.step = "AWAIT_REASON";
    return sendT(phone, "📝 Briefly describe the *reason* for the visit:", hospital);
  }

  const effectiveHospital = session.hospital || hospital;
  session.step = "AWAIT_CONFIRM";

  const consultLabel = data.consultation_type === "call" ? "📹 Video Call" : "🏥 In Person";

  let summary  =
    `🏥 *${(effectiveHospital?.name || "CLINIC").toUpperCase()} — BOOKING SUMMARY*\n\n` +
    `👤 *Patient:* ${data.name}\n` +
    `👨‍⚕️ *Doctor:* ${data.doctor_name}\n` +
    `📅 *Date:* ${data.date}\n` +
    `⏰ *Time:* ${data.slot}\n` +
    `🩺 *Consultation:* ${consultLabel}`;
  if (data.relation) summary += `\n🔗 *Relation:* ${data.relation}`;
  if (data.age)      summary += `\n🎂 *Age:* ${data.age}`;
  if (data.reason)   summary += `\n📝 *Reason:* ${data.reason}`;
  if (data._triage?.patientSummary) summary += `\n🤖 *AI Notes:* ${data._triage.patientSummary}`;

  return sendTButtons(phone, `${summary}\n\nConfirm this booking?`,
    [{ id: "confirm_yes", title: "Confirm ✅" }, { id: "confirm_no", title: "Cancel ❌" }], effectiveHospital);
}

async function finalizeBooking(phone, session, hospital) {
  const { data: d } = session;
  const aiNotes     = d._triage?.patientSummary || d.ai_notes || null;
  const consultType = d.consultation_type || "personal";

  if (!d.name || d.name.trim().length < 1) {
    console.error("finalizeBooking: name is missing, aborting insert");
    return sendT(phone, "⚠️ Booking failed — patient name is missing. Please send *Hi* to restart.", hospital);
  }

  const effectiveHospital = session.hospital || hospital;

  // Generate Google Meet link for video call consultations
  let meetLink = null;
  if (consultType === "call") {
    meetLink = generateMeetLink();
  }

  const { error: insertErr, data: insertedRows } = await supabase.from("appointments").insert([{
    phone,
    doctor_id:         d.doctor_id,
    name:              d.name,
    date:              d.date,
    slot:              d.slot,
    age:               d.age              || null,
    reason:            d.reason           || null,
    status:            "pending",
    patient_id:        d.savedPatientId   || null,
    hospital_id:       effectiveHospital?.id || null,
    ai_notes:          aiNotes,
    consultation_type: consultType,
    meet_link:         meetLink,
  }]).select();

  if (insertErr) {
    console.error("Appointment insert failed:", insertErr.message);
    return sendT(phone, "⚠️ Booking failed due to a server error. Please try again or send *Hi* to restart.", hospital);
  }

  // ── FEATURE 5: Send appropriate thank-you message based on consultation type ──
  if (consultType === "call" && meetLink) {
    await sendT(phone,
      `⏳ *Appointment Request Sent!*\n\nYour video consultation request for *${d.name}* has been submitted to *${effectiveHospital?.name || "the clinic"}*.\n\nWe'll notify you once *Dr. ${d.doctor_name}* confirms.\n\n📹 *Your Google Meet link (save this):*\n${meetLink}\n\n_You'll receive a reminder 30 minutes before your call._ ✅`,
      effectiveHospital);
  } else {
    await sendT(phone,
      `⏳ *Appointment Request Sent!*\n\nYour request for *${d.name}* has been submitted to *${effectiveHospital?.name || "the clinic"}*.\n\n🏥 Please arrive at *${effectiveHospital?.name || "our clinic"}* on *${d.date}* at *${d.slot}*.\n\nWe'll notify you once *Dr. ${d.doctor_name}* confirms. ✅`,
      effectiveHospital);
  }

  try {
    const { data: apptRow } = await supabase.from("appointments").select("id")
      .eq("doctor_id", d.doctor_id).eq("date", d.date)
      .eq("slot", d.slot).eq("phone", phone)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    const { data: doc } = await supabase.from("doctors").select("phone, name").eq("id", d.doctor_id).single();

    if (doc?.phone && apptRow?.id) {
      let doctorMsg =
        `🔔 *New ${consultType === "call" ? "Video Call" : "In-Person"} Appointment — ${effectiveHospital?.name || "Clinic"}*\n\n` +
        `👤 *Patient:* ${d.name}\n` +
        `📅 *Date:* ${d.date}\n` +
        `⏰ *Time:* ${d.slot}\n` +
        `🩺 *Type:* ${consultType === "call" ? "📹 Video Call" : "🏥 In Person"}`;
      if (d.age)    doctorMsg += `\n🎂 *Age:* ${d.age}`;
      if (d.reason) doctorMsg += `\n📝 *Reason:* ${d.reason}`;
      if (aiNotes)  doctorMsg += `\n🤖 *AI Summary:* ${aiNotes}`;
      if (consultType === "call" && meetLink) {
        doctorMsg += `\n\n📹 *Google Meet link:*\n${meetLink}`;
      }
      doctorMsg += `\n\nApprove or reject:`;

      await sendButtons(normalizePhone(doc.phone), doctorMsg,
        [{ id: `appr_${apptRow.id}`, title: "✅ Approve" }, { id: `rejt_${apptRow.id}`, title: "❌ Reject" }],
        effectiveHospital);
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
      supabase.from("appointments").select("slot").eq("doctor_id", doctorId).eq("date", date).neq("status", "rejected"),
      supabase.from("blocked_slots").select("slot").eq("doctor_id", doctorId).eq("date", date),
    ]);

    if (holiday)
      return sendT(phone,
        `⚠️ Dr. ${doc?.name || "The doctor"} is on leave on *${date}*.\n\nSend *Menu* to choose another date.`,
        hospital);

    const bookedSet = new Set([
      ...(booked?.map((b) => normalize(b.slot))  || []),
      ...(blocked?.map((b) => normalize(b.slot)) || []),
    ]);

    const { data: override } = await supabase.from("date_overrides")
      .select("working_hours").eq("doctor_id", doctorId).eq("date", date).maybeSingle();

    const workingHours = override?.working_hours || doc?.working_hours || "09:00 AM - 07:00 PM";
    const duration     = parseInt(doc?.slot_duration) || 20;
    const [startStr, endStr] = workingHours.split(" - ");
    let current = new Date(`1970/01/01 ${startStr}`);
    const end   = new Date(`1970/01/01 ${endStr}`);

    const nowIST   = getNowIST();
    const todayIST = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, "0")}-${String(nowIST.getDate()).padStart(2, "0")}`;
    const isToday  = date === todayIST;
    const nowMins  = nowIST.getHours() * 60 + nowIST.getMinutes();

    const slots = [];
    while (current < end) {
      const timeStr  = current.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      const slotMins = current.getHours() * 60 + current.getMinutes();
      if (isToday && slotMins <= nowMins) { current.setMinutes(current.getMinutes() + duration); continue; }
      const isFull = bookedSet.has(normalize(timeStr));
      slots.push({
        id:    isFull ? `full_${timeStr}` : `slot_${timeStr}`,
        title: (isFull ? `🔴 ${timeStr} (Full)` : `✅ ${timeStr}`).substring(0, 24),
      });
      current.setMinutes(current.getMinutes() + duration);
    }

    if (!slots.length)
      return sendT(phone,
        "⚠️ No more slots available for this date.\nSend *Menu* to choose another date.", hospital);

    const available = slots.filter((s) => !s.id.startsWith("full_")).length;
    const session   = getSession(phone);
    const consultLabel = session.data?.consultation_type === "call" ? "📹 Video Call" : "🏥 In Person";

    return sendTList(phone,
      `⏰ *${doc?.name || "Doctor"}'s slots for ${date}* (${consultLabel})\n${available} available slot${available !== 1 ? "s" : ""} (every ${duration} min):`,
      [{ title: "Available Times", rows: slots.slice(0, 10) }],
      "Select Time", hospital);
  } catch (e) {
    console.error("Slot error:", e.message);
    return sendT(phone, "⚠️ Error loading slots. Please try again or send *Menu* to restart.", hospital);
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
    // New patient — ask name then go straight to symptoms
    session.step = "AWAIT_NAME_FOR_AI";
    return sendT(phone,
      `🏥 Welcome to *${hospital.name}*!\n\nPlease enter your *full name* to get started:`, hospital);
  }

  // FEATURE 1: Only show registered patients + "Book for someone new"
  // No "Describe symptoms (AI)" as a separate option — symptoms are always asked after patient selection
  session.step            = "AWAIT_MEMBER_SELECT";
  session.data.familyList = patients;

  const rows = patients.map((p, i) => ({
    id:    `member_${i}`,
    title: `${p.patient_name} (${p.relation || "Patient"})`.substring(0, 24),
  }));
  rows.push({ id: "member_new", title: "➕ Book for someone new" });

  return sendTList(phone,
    `🏥 Welcome back to *${hospital.name}*!\n\nWho is this appointment for?`,
    [{ title: `${patients.length} Registered Patient${patients.length > 1 ? "s" : ""}`, rows: rows.slice(0, 10) }],
    "Select Patient", hospital);
}

/* ─── WHATSAPP SEND WRAPPERS ─────────────────────────────────────────────── */
async function apiPost(url, payload, token, retries = CONFIG.MAX_RETRY) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 });
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.error?.message || JSON.stringify(err.response?.data) || err.message;
      if (status === 401) {
        const phoneId      = url.match(/\/(\d+)\/messages/)?.[1] || "unknown";
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
    { messaging_product: "whatsapp", to, text: { body } }, token);
}

async function sendButtons(to, text, buttons, hospital) {
  if (USE_WHATSAPP_WEB && waClient) {
    const chatId  = to.includes("@") ? to : `${to}@c.us`;
    const session = getSession(to);
    session._buttonMap = {};
    const opts = buttons.map((b, i) => {
      session._buttonMap[String(i + 1)] = b.id;
      return `${i + 1}. ${b.title}`;
    }).join("\n");
    return waClient.sendMessage(chatId, `${text}\n\n${opts}\n\n_Reply with a number_`);
  }
  const token   = hospital?.whatsapp_token || CONFIG.TOKEN;
  const phoneId = hospital?.whatsapp_phone_number_id || CONFIG.PHONE_NUMBER_ID;
  return apiPost(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })),
      },
    },
  }, token);
}

async function sendList(to, text, sections, buttonLabel, hospital) {
  if (USE_WHATSAPP_WEB && waClient) {
    const chatId  = to.includes("@") ? to : `${to}@c.us`;
    const session = getSession(to);
    session._buttonMap = {};
    let counter = 1;
    let msgText = `${text}\n\n`;
    sections.forEach((sec) => {
      sec.rows.forEach((row) => {
        msgText += `${counter}. ${row.title}\n`;
        session._buttonMap[String(counter++)] = row.id;
      });
    });
    return waClient.sendMessage(chatId, msgText + "\n_Reply with a number_");
  }
  const token   = hospital?.whatsapp_token || CONFIG.TOKEN;
  const phoneId = hospital?.whatsapp_phone_number_id || CONFIG.PHONE_NUMBER_ID;
  return apiPost(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text },
      action: {
        button: buttonLabel,
        sections: sections.map((s) => ({
          title: s.title,
          rows:  s.rows.map((r) => ({ id: r.id, title: r.title })),
        })),
      },
    },
  }, token);
}

/* ─── START SERVER ───────────────────────────────────────────────────────── */
app.listen(CONFIG.PORT, () =>
  console.log(
    `🚀 Cura Bot v4 (AI) on port ${CONFIG.PORT} | ` +
    `Mode: ${USE_WHATSAPP_WEB ? "WhatsApp Web (FREE)" : "Meta Cloud API"} | ` +
    `AI: Groq LLaMA-3 (primary) + Gemini 1.5 Flash (fallback) + Rule-based (safety net) | ` +
    `Lang: auto-detect (Hindi / Gujarati / English) | ` +
    `Features: Symptom triage, Consultation type, Meet links, 30-min reminders`
  )
);