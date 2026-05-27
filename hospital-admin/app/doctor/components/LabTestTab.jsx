"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone } from "lucide-react";

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  brand:    "#143D30",
  accent:   "#4ECCA3",
  accentDk: "#0e9e78",
  bg:       "#f4f7f5",
  card:     "#ffffff",
  border:   "#e2e8ec",
  text:     "#1a2e26",
  muted:    "#6b8078",
  danger:   "#ef4444",
  warn:     "#f59e0b",
  info:     "#3b82f6",
};

// ── LAB TESTS grouped autocomplete ───────────────────────────────────────────
const LAB_TESTS = {
  "Blood Tests": [
    "CBC (Complete Blood Count)", "LFT (Liver Function Test)", "KFT (Kidney Function Test)",
    "Blood Sugar (Fasting)", "Blood Sugar (PP)", "HbA1c", "Lipid Profile",
    "Serum Electrolytes", "Serum Calcium", "Serum Uric Acid", "CRP (C-Reactive Protein)",
    "ESR", "PT-INR", "APTT", "Serum Ferritin", "Serum Iron", "TIBC",
    "Vitamin D (25-OH)", "Vitamin B12", "Folate", "TSH", "T3 / T4", "Free T4",
    "HBsAg (Hepatitis B)", "Anti-HCV", "HIV 1 & 2", "VDRL", "Dengue NS1",
    "Dengue IgM / IgG", "Widal Test", "Malaria Antigen", "Blood Culture & Sensitivity",
    "Serum Prolactin", "FSH", "LH", "Testosterone", "Serum Cortisol",
  ],
  "Urine Tests": [
    "Urine R/M (Routine & Microscopy)", "Urine Culture & Sensitivity",
    "Urine Microalbumin", "24hr Urine Protein", "Urine Pregnancy Test (UPT)",
  ],
  "Imaging": [
    "Chest X-Ray (PA view)", "X-Ray KUB", "X-Ray Spine (AP/Lateral)",
    "USG Abdomen & Pelvis", "USG Neck", "USG Thyroid",
    "CT Scan Brain (Plain)", "CT Scan Chest", "CT Scan Abdomen & Pelvis",
    "MRI Brain (Plain + Contrast)", "MRI Spine (Cervical/Lumbar)",
    "Echocardiography (2D Echo)", "ECG (Electrocardiogram)", "Stress Test (TMT)",
    "Bone Density (DEXA Scan)", "Mammography",
  ],
  "Microbiology": [
    "Sputum AFB (for TB)", "Sputum Culture & Sensitivity", "Throat Swab C/S",
    "Stool R/M", "Stool Culture", "COVID-19 RT-PCR", "COVID-19 Antigen",
    "Wound Swab C/S",
  ],
  "Speciality": [
    "Pap Smear", "Biopsy", "FNAC", "Colonoscopy", "Upper GI Endoscopy",
    "Pulmonary Function Test (PFT)", "Audiometry", "Fundus Examination",
    "24hr Holter Monitor", "Ambulatory BP Monitor",
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const uid = () => Math.random().toString(36).slice(2, 9);
const draftId = () => `#${Math.floor(1000 + Math.random() * 9000)}-X`;
const statusColor = (s) => ({ active: C.accent, completed: C.info, cancelled: C.danger }[s] ?? C.muted);

const SCHEDULE_OPTS = [
  { label: "Daily",           value: "Daily" },
  { label: "Every Other Day", value: "Alternate Days" },
  { label: "Weekly",          value: "Weekly" },
  { label: "As Needed (PRN)", value: "SOS / As needed" },
];

const FORM_OPTS = [
  "Tablet / Capsule", "Syrup", "Injection", "Drops",
  "Cream / Ointment", "Inhaler", "Powder", "Patch",
];

const DOSAGE_OPTS = [
  "62.5mg","125mg","250mg","375mg","500mg","625mg","750mg","875mg","1g","1.5g","2g",
  "5mg","10mg","20mg","25mg","40mg","50mg","75mg","100mg","150mg","200mg","400mg","600mg","800mg",
  "5ml","10ml","15ml","2.5ml",
  "0.5%","1%","2%","5%","10%",
];

const QUANTITY_OPTS = ["5","7","10","14","15","20","21","28","30","45","60","90","120"];

const DOSE_OPTS = [
  { label: "0",  value: "0"   },
  { label: "½",  value: "0.5" },
  { label: "1",  value: "1"   },
  { label: "1½", value: "1.5" },
  { label: "2",  value: "2"   },
  { label: "2½", value: "2.5" },
  { label: "3",  value: "3"   },
];

const emptyMed = () => ({
  _id: uid(),
  name: "", dosage: "", form: "Tablet / Capsule", quantity: "30",
  morning: "1", afternoon: "0", evening: "0", night: "1",
  schedule: "Daily", instructions: "", rxcui: null,
});

// Guarantees no undefined string fields — prevents controlled→uncontrolled warnings
const normalizeMed = (m) => ({
  _id:          m._id          ?? uid(),
  name:         m.name         ?? "",
  dosage:       m.dosage       ?? "",
  form:         m.form         ?? "Tablet / Capsule",
  quantity:     m.quantity     ?? "30",
  morning:      m.morning      ?? "1",
  afternoon:    m.afternoon    ?? "0",
  evening:      m.evening      ?? "0",
  night:        m.night        ?? "1",
  schedule:     m.schedule     ?? "Daily",
  instructions: m.instructions ?? "",
  rxcui:        m.rxcui        ?? null,
});

const labelSt = {
  display: "block", fontSize: 12, color: C.muted, fontWeight: 600,
  marginBottom: 5, letterSpacing: ".3px",
};

const fieldSt = {
  border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px",
  fontSize: 13, color: C.text, background: C.card, width: "100%", outline: "none",
  fontFamily: "inherit", transition: "border-color .15s", boxSizing: "border-box",
};

// ── PDF Generator — pixel-perfect match to design ────────────────────────────
const generatePremiumPDF = (rx, doctor) => {
  const patientId = rx.patient_uid ? `#${rx.patient_uid}` : (rx.patient_phone ? `#PT-${rx.patient_phone.slice(-4)}` : "#PT-0000");
  const docName  = doctor?.name || "Doctor";
  const docDept  = doctor?.department || "General Medicine";
  const initial  = docName.charAt(0).toUpperCase();

  const fmtPDF = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  // Time slot rendering — text-based, no emoji (emoji breaks html2canvas)
  const timeSlotHtml = (label, value, icon) => {
    const active = value && value !== "0";
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:20px;opacity:${active ? "1" : "0.3"};">
      <span style="font-size:12px;color:${active ? "#143D30" : "#94A3B8"};">${icon}</span>
      <span style="font-size:13px;font-weight:${active ? "700" : "500"};color:${active ? "#0F172A" : "#94A3B8"};">${label}</span>
    </span>`;
  };



  return `<div id="pdf-root" style="font-family:'Plus Jakarta Sans',sans-serif;padding:40px 44px;color:#0F172A;width:760px;box-sizing:border-box;background:white;">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap');
  #pdf-root * { box-sizing: border-box; margin: 0; padding: 0; }
</style>

<!-- HEADER -->
<table style="width:100%;border-collapse:collapse;margin-bottom:36px;">
  <tr>
    <td style="vertical-align:middle;">
      <table style="border-collapse:collapse;"><tr>
        <td style="vertical-align:middle;padding-right:14px;">
          <div style="width:48px;height:48px;background:#143D30;border-radius:12px;display:flex;align-items:center;justify-content:center;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg>
          </div>
        </td>
        <td style="vertical-align:middle;">
          <div style="font-weight:800;font-size:18px;color:#0F172A;line-height:1.2;">Cura Medical Center</div>
          <div style="font-weight:500;font-size:12px;color:#64748B;margin-top:2px;">Advanced Clinical Diagnostics</div>
        </td>
      </tr></table>
    </td>
    <td style="vertical-align:middle;text-align:right;">
      <div style="font-weight:800;font-size:15px;color:#0F172A;">Dr. ${docName}</div>
      <div style="font-weight:700;font-size:13px;color:#10B981;margin-top:2px;">${docDept}</div>
      <div style="font-weight:500;font-size:11px;color:#64748B;margin-top:3px;">License: #MD-88291-${initial}</div>
    </td>
  </tr>
</table>

<!-- PATIENT CARD -->
<div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;padding:20px 24px;margin-bottom:32px;">
  <table style="width:100%;border-collapse:collapse;"><tr>
    <td style="width:33%;vertical-align:top;">
      <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Patient Name</div>
      <div style="font-size:15px;font-weight:800;color:#0F172A;">${rx.patient_name || "—"}</div>
    </td>
    <td style="width:33%;vertical-align:top;">
      <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Patient ID</div>
      <div style="font-size:15px;font-weight:800;color:#0F172A;">${patientId}</div>
    </td>
    <td style="width:33%;vertical-align:top;">
      <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Date Issued</div>
      <div style="font-size:15px;font-weight:800;color:#0F172A;">${fmtPDF(rx.date)}</div>
    </td>
  </tr></table>
</div>

<!-- DIAGNOSIS -->
${rx.diagnosis ? `
<div style="margin-bottom:30px;">
  <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Diagnosis / Notes</div>
  <div style="font-size:15px;font-weight:600;color:#0F172A;line-height:1.5;">${rx.diagnosis}${rx.notes ? `<br/><span style="color:#64748B;font-weight:500;font-size:13px;">${rx.notes}</span>` : ""}</div>
</div>` : ""}

<!-- LAB TESTS HEADING -->
<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#143D30" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  <span style="font-size:16px;font-weight:800;color:#0F172A;">Diagnostic Requisition</span>
</div>

<!-- LAB TESTS -->
${rx.tests?.length ? `
<div style="margin-top:26px;margin-bottom:26px;">
  <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Lab Tests</div>
  <div>${rx.tests.map((t) => `<span style="display:inline-block;background:#F1F5F9;color:#334155;padding:0 16px;height:32px;line-height:32px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid #E2E8F0;margin-right:8px;margin-bottom:8px;">${t}</span>`).join("")}</div>
</div>` : ""}

<!-- FOLLOW UP -->
${rx.follow_up ? `
<div style="margin-bottom:26px;">
  <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Follow Up</div>
  <div style="font-size:15px;font-weight:700;color:#0F172A;">${fmtPDF(rx.follow_up)}</div>
</div>` : ""}

<!-- FOOTER -->
<div style="margin-top:48px;border-top:1.5px solid #E2E8F0;padding-top:28px;">
  <table style="width:100%;border-collapse:collapse;"><tr>
    <td style="vertical-align:bottom;width:55%;">
      <div style="font-family:Georgia,serif;font-size:28px;font-style:italic;color:#0F172A;margin-bottom:8px;">${docName.split(" ")[0]}</div>
      <div style="height:1.5px;background:#94A3B8;width:200px;margin-bottom:6px;"></div>
      <div style="font-size:11px;font-weight:500;color:#64748B;margin-bottom:20px;">Digital Signature of Dr. ${docName}</div>
      <div style="font-size:14px;font-weight:800;color:#0F172A;margin-bottom:4px;">Cura Medical Center</div>
      <div style="font-size:11px;color:#64748B;margin-bottom:2px;">122 Medical Plaza, Suite 400 &bull; Seattle, WA 98101</div>
      <div style="font-size:11px;color:#64748B;">Contact: (555) 902-1144 &bull; records@curamed.glass</div>
    </td>
    <td style="vertical-align:bottom;text-align:right;width:45%;">
      <div style="display:inline-block;background:#0F172A;border-radius:12px;padding:12px;">
        <table style="border-collapse:collapse;width:80px;height:80px;">
          <tr>
            <td style="width:26px;height:26px;background:white;border-radius:3px;"></td>
            <td style="width:5px;height:26px;background:#0F172A;"></td>
            <td style="width:18px;height:26px;background:white;"></td>
            <td style="width:5px;height:26px;background:#0F172A;"></td>
            <td style="width:26px;height:26px;background:white;border-radius:3px;"></td>
          </tr>
          <tr><td style="height:5px;background:#0F172A;" colspan="5"></td></tr>
          <tr>
            <td style="width:26px;height:9px;background:white;"></td>
            <td style="background:#0F172A;"></td>
            <td style="background:#0F172A;"></td>
            <td style="background:#0F172A;"></td>
            <td style="width:26px;height:9px;background:white;"></td>
          </tr>
          <tr><td style="height:5px;background:#0F172A;" colspan="5"></td></tr>
          <tr>
            <td style="width:26px;height:26px;background:white;border-radius:3px;"></td>
            <td style="background:#0F172A;"></td>
            <td style="background:white;"></td>
            <td style="background:#0F172A;"></td>
            <td style="width:26px;height:26px;background:white;border-radius:3px;"></td>
          </tr>
        </table>
      </div>
      <div style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin-top:8px;">Verify Authenticity</div>
    </td>
  </tr></table>
</div>
</div>`;
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#fef2f2" : "#f0fdf4",
          color: t.type === "error" ? C.danger : C.accentDk,
          border: `1px solid ${t.type === "error" ? "#fca5a5" : C.accent}`,
          borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,.1)",
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const c = statusColor(status);
  return (
    <span style={{
      background: c + "18", color: c, border: `1px solid ${c}44`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: ".6px",
    }}>{status}</span>
  );
}

// ── RxNorm Medicine Search ────────────────────────────────────────────────────
function MedicineSearch({ value, onChange, onSelect }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState(value ?? "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef(null);
  const ref         = useRef(null);

  useEffect(() => { setQuery(value ?? ""); }, [value]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchDrugs = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      // RxNorm spelling suggestions — fast, free, no CORS issues
      const r1 = await fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(q)}`
      );
      const d1 = await r1.json();
      const names = (d1.suggestionGroup?.suggestionList?.suggestion || []).slice(0, 5);

      if (names.length === 0) {
        // Fallback: approximate search
        const r2 = await fetch(
          `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(q)}&maxEntries=8`
        );
        const d2 = await r2.json();
        const candidates = d2.approximateGroup?.candidate || [];
        const mapped = candidates.slice(0, 8).map((c) => ({
          name: c.name, fullName: c.name, rxcui: c.rxcui,
          category: "Drug", defaultDosage: extractDosage(c.name), defaultForm: inferForm(c.name),
        }));
        setResults(mapped);
        return;
      }

      // Get drug concepts for top suggestion for detail
      const r3 = await fetch(
        `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(names[0])}`
      );
      const d3 = await r3.json();
      const concepts = (d3.drugGroup?.conceptGroup || []).flatMap((g) => g.conceptProperties || []);

      // Build results: combine name suggestions + concepts
      const fromConcepts = concepts.slice(0, 6).map((c) => ({
        name: names[0],
        fullName: c.name,
        rxcui: c.rxcui,
        category: ttyLabel(c.tty),
        defaultDosage: extractDosage(c.name),
        defaultForm: inferForm(c.name),
      }));

      const extraNames = names.slice(1).map((n) => ({
        name: n, fullName: n, rxcui: null,
        category: "Drug", defaultDosage: extractDosage(n), defaultForm: inferForm(n),
      }));

      setResults([...fromConcepts, ...extraNames].slice(0, 8));
    } catch (e) {
      console.error("RxNorm fetch error:", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const extractDosage = (name) => {
    const m = name?.match(/(\d+\.?\d*\s*(mg|mcg|g|ml|%|IU|MG|MCG|ML))/i);
    return m ? m[0].replace(/\s+/, "").toLowerCase() : "";
  };

  const inferForm = (name) => {
    if (!name) return "Tablet / Capsule";
    const n = name.toLowerCase();
    if (n.includes("syrup") || n.includes("solution") || n.includes("oral liq")) return "Syrup";
    if (n.includes("inject") || n.includes("iv ") || n.includes("im ")) return "Injection";
    if (n.includes("cream") || n.includes("ointment") || n.includes("topical")) return "Cream / Ointment";
    if (n.includes("inhaler") || n.includes("aerosol") || n.includes("inhala")) return "Inhaler";
    if (n.includes("drops") || n.includes("ophthalmic") || n.includes("otic")) return "Drops";
    if (n.includes("patch") || n.includes("transdermal")) return "Patch";
    if (n.includes("powder") || n.includes("sachet")) return "Powder";
    return "Tablet / Capsule";
  };

  const ttyLabel = (tty) => {
    const map = { IN: "Ingredient", BN: "Brand", SCD: "Clinical Drug", SBD: "Branded Drug", GPCK: "Pack", BPCK: "Brand Pack", PIN: "Precise", MIN: "Multi-Ingredient" };
    return map[tty] || tty || "Drug";
  };

  const handleInput = (val) => {
    setQuery(val);
    onChange(val);
    setOpen(true);
    setHighlighted(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDrugs(val), 320);
  };

  const handleSelect = (item) => {
    const displayName = item.name;
    setQuery(displayName);
    onChange(displayName);
    setOpen(false);
    setHighlighted(-1);
    onSelect({
      name: displayName,
      rxcui: item.rxcui,
      defaultDosage: item.defaultDosage,
      defaultForm: item.defaultForm,
      category: item.category,
    });
  };

  const highlight = (text, q) => {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#bbf7d0", color: C.brand, fontWeight: 700, borderRadius: 2 }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none", opacity: 0.4 }}>🔍</span>
        <input
          value={query ?? ""}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => (query ?? "").trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter" && highlighted >= 0) { e.preventDefault(); handleSelect(results[highlighted]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search medicine by name (powered by RxNorm)…"
          style={{ ...fieldSt, paddingLeft: 36, borderColor: open ? C.accent : C.border }}
          autoComplete="off"
        />
        {loading && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.muted }}>⏳</span>
        )}
        {query && !loading && (
          <button onClick={() => { setQuery(""); onChange(""); setResults([]); setOpen(false); }}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.muted, padding: "2px 4px" }}>✕</button>
        )}
      </div>

      <AnimatePresence>
        {open && (results.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 600,
              background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 14,
              boxShadow: "0 16px 48px rgba(0,0,0,.14)", overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 14px", background: "#f0fdf4", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11 }}>💊</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.accentDk, textTransform: "uppercase", letterSpacing: ".5px" }}>
                {loading ? "Searching RxNorm…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {results.map((item, i) => (
                <div key={`${item.rxcui || i}-${i}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlighted(i)}
                  style={{
                    padding: "10px 14px", cursor: "pointer",
                    borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : "none",
                    background: highlighted === i ? "#f0fdf4" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>
                      {highlight(item.name, query)}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.fullName !== item.name ? item.fullName : `${item.defaultDosage ? item.defaultDosage + " · " : ""}${item.defaultForm}`}
                    </div>
                  </div>
                  <span style={{
                    background: "#e0f2f1", color: "#0f6e56", border: "1px solid #5DCAA544",
                    borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                  }}>{item.category}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "6px 14px", background: "#f8fafc", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted, display: "flex", gap: 12 }}>
              <span>↑↓ navigate</span><span>↵ select</span><span>Esc close</span>
              <span style={{ marginLeft: "auto" }}>Powered by RxNorm / NLM</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Lab Test Autocomplete ─────────────────────────────────────────────────────
function LabTestInput({ onAdd }) {
  const [input, setInput]     = useState("");
  const [open, setOpen]       = useState(false);
  const [highlighted, setHl]  = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const allTests = Object.entries(LAB_TESTS).flatMap(([group, tests]) =>
    tests.map((t) => ({ label: t, group }))
  );

  const filtered = input.trim().length === 0
    ? allTests.slice(0, 12)
    : allTests.filter((t) => t.label.toLowerCase().includes(input.toLowerCase())).slice(0, 12);

  const handleAdd = (label) => {
    onAdd(label);
    setInput("");
    setOpen(false);
    setHl(-1);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={(e) => { setOpen(true); e.target.style.borderColor = C.accent; }}
          onBlur={(e) => e.target.style.borderColor = C.border}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(h + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter") {
              e.preventDefault();
              if (highlighted >= 0) handleAdd(filtered[highlighted].label);
              else if (input.trim()) handleAdd(input.trim());
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search or type test name (e.g. CBC, HbA1c, X-Ray)…"
          style={{ ...fieldSt, flex: 1 }}
        />
        <button onClick={() => { if (input.trim()) handleAdd(input.trim()); }} style={{
          background: C.brand, color: "#fff", border: "none", borderRadius: 10,
          padding: "0 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        }}>Add</button>
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute", top: "calc(100% + 5px)", left: 0, right: 60, zIndex: 500,
              background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 12,
              boxShadow: "0 12px 36px rgba(0,0,0,.12)", overflow: "hidden",
            }}
          >
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {filtered.map((item, i) => (
                <div key={item.label}
                  onClick={() => handleAdd(item.label)}
                  onMouseEnter={() => setHl(i)}
                  style={{
                    padding: "9px 14px", cursor: "pointer",
                    borderBottom: `1px solid ${C.border}`,
                    background: highlighted === i ? "#f0fdf4" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: C.muted, background: C.bg, borderRadius: 20, padding: "1px 8px", whiteSpace: "nowrap" }}>{item.group}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Patient Dropdown ──────────────────────────────────────────────────────────
function PatientDropdown({ value, onChange, doctorId }) {
  const [patients, setPatients] = useState([]);
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState("");
  const ref = useRef(null);

  useEffect(() => {
    supabase
      .from("appointments")
      .select("id,name,phone,age")
      .eq("doctor_id", doctorId)
      .order("name")
      .then(async ({ data }) => {
        const seen = new Set();
        const uniqueAppts = (data || []).filter((p) => {
          const k = `${p.name}|${p.phone}`;
          if (seen.has(k)) return false;
          seen.add(k); return true;
        });

        // Fetch UIDs
        const { data: wpData } = await supabase.from("web_patients").select("email, phone, uid");
        const uidMap = {};
        if (wpData) {
          wpData.forEach(wp => {
            if (wp.phone) uidMap[wp.phone] = wp.uid;
            if (wp.email) { uidMap[wp.email] = wp.uid; uidMap[`web_${wp.email}`] = wp.uid; }
          });
        }
        
        setPatients(uniqueAppts.map(p => ({ ...p, uid: uidMap[p.phone] || null })));
      });
  }, [doctorId]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = patients.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{
        ...fieldSt, cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderColor: open ? C.accent : C.border,
      }}>
        <span style={{ color: value ? C.text : C.muted, display: "flex", alignItems: "center", gap: 6 }}>
          {value ? (
            <>
              {value.name}  ·  
              {value.phone?.includes("@") ? <Mail size={12} style={{ opacity: 0.6 }} /> : <Phone size={12} style={{ opacity: 0.6 }} />}
              {value.phone?.replace(/^web_/, "")}
            </>
          ) : "Search by name or phone…"}
        </span>
        <span style={{ color: C.muted, fontSize: 10 }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 400,
          background: C.card, border: `1.5px solid ${C.accent}`, borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,.12)", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search…"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13, color: C.text, background: "transparent", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 && <div style={{ padding: 14, fontSize: 13, color: C.muted, textAlign: "center" }}>No patients found</div>}
            {filtered.map((p) => (
              <div key={p.id} onClick={() => { onChange(p); setOpen(false); setSearch(""); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", fontSize: 13, color: C.text,
                  borderBottom: `1px solid ${C.border}`,
                  background: value?.id === p.id ? C.accent + "18" : "transparent",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                onMouseLeave={(e) => e.currentTarget.style.background = value?.id === p.id ? C.accent + "18" : "transparent"}
              >
                <div style={{ fontWeight: 600 }}>{p.name} {p.uid && <span style={{ fontSize: 11, color: C.primary }}>#{p.uid}</span>}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
                  {p.phone?.includes("@") ? <Mail size={10} style={{ opacity: 0.6 }} /> : <Phone size={10} style={{ opacity: 0.6 }} />}
                  <span>{p.phone?.replace(/^web_/, "")}</span>
                  {p.age ? ` · Age ${p.age}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Drug Interaction Warning ──────────────────────────────────────────────────
function DrugInteractionWarning({ medicines }) {
  const [warnings, setWarnings] = useState([]);

  const rxcuis = medicines.map((m) => m.rxcui).filter(Boolean);
  const [prevLen, setPrevLen] = useState(rxcuis.length);
  if (rxcuis.length !== prevLen) {
    setPrevLen(rxcuis.length);
    if (rxcuis.length < 2 && warnings.length > 0) {
      setWarnings([]);
    }
  }

  useEffect(() => {
    if (rxcuis.length < 2) return;
    let active = true;
    fetch(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join("+")}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const pairs = d.fullInteractionTypeGroup?.[0]?.fullInteractionType || [];
        setWarnings(pairs.map((p) => p.interactionPair?.[0]?.description).filter(Boolean).slice(0, 3));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [medicines]);

  if (!warnings.length) return null;

  return (
    <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#c2410c" }}>Drug Interaction Warning</span>
      </div>
      {warnings.map((w, i) => (
        <div key={i} style={{ fontSize: 12, color: "#9a3412", marginBottom: i < warnings.length - 1 ? 4 : 0, lineHeight: 1.5 }}>• {w}</div>
      ))}
    </div>
  );
}

// ── Medicine Card ─────────────────────────────────────────────────────────────
function MedCard({ med, index, onChange, onRemove }) {
  const upd = (field, val) => onChange(med._id, field, val);

  const timeSlots = [
    { key: "morning",   icon: "☀️",  label: "Morning" },
    { key: "afternoon", icon: "🌤️", label: "Afternoon" },
    { key: "evening",   icon: "🌅",  label: "Evening" },
    { key: "night",     icon: "🌙",  label: "Night" },
  ];

  const handleMedicineSelect = (medicine) => {
    upd("name", medicine.name);
    upd("rxcui", medicine.rxcui || null);
    if (!med.dosage && medicine.defaultDosage) upd("dosage", medicine.defaultDosage);
    if (medicine.defaultForm) upd("form", medicine.defaultForm);
  };

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1.5px solid ${C.border}`, padding: 20, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: "uppercase", letterSpacing: ".6px" }}>💊 Medicine {index + 1}</span>
        {index > 0 && (
          <button onClick={() => onRemove(med._id)} style={{
            background: "#fef2f2", border: "1px solid #fca5a5", color: C.danger,
            borderRadius: 6, padding: "3px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600,
          }}>Remove</button>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelSt}>Medication Name</label>
        <MedicineSearch value={med.name ?? ""} onChange={(val) => upd("name", val)} onSelect={handleMedicineSelect} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr .8fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Dosage Strength", key: "dosage", opts: DOSAGE_OPTS, placeholder: "Select dosage…" },
          { label: "Form",            key: "form",   opts: FORM_OPTS,   placeholder: "" },
          { label: "Quantity",        key: "quantity", opts: QUANTITY_OPTS.map((q) => ({ v: q, l: `${q} tablets` })), placeholder: "Select qty…" },
        ].map(({ label, key, opts, placeholder }) => (
          <div key={key}>
            <label style={labelSt}>{label}</label>
            <div style={{ position: "relative" }}>
              <select value={med[key] ?? ""} onChange={(e) => upd(key, e.target.value)} style={{
                ...fieldSt, appearance: "none", cursor: "pointer",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236b8078' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
              }}>
                {placeholder && <option value="">{placeholder}</option>}
                {opts.map((o) => typeof o === "string"
                  ? <option key={o} value={o}>{o}</option>
                  : <option key={o.v} value={o.v}>{o.l}</option>
                )}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelSt, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14 }}>⏱</span> Dosage Schedule
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {SCHEDULE_OPTS.map((s) => {
            const active = med.schedule === s.value;
            return (
              <button key={s.value} onClick={() => upd("schedule", s.value)} style={{
                padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all .15s",
                border: `1.5px solid ${active ? C.brand : C.border}`,
                background: active ? C.brand : C.card,
                color: active ? "#fff" : C.muted,
              }}>{s.label}</button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelSt}>Doses per time of day</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 6 }}>
          {timeSlots.map(({ key, icon, label }) => {
            const hasValue = med[key] && med[key] !== "0";
            return (
              <div key={key} style={{
                border: `1.5px solid ${hasValue ? C.accent : C.border}`,
                borderRadius: 12, padding: "14px 10px", textAlign: "center",
                background: hasValue ? "#f0fdf4" : "#fafafa",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{label}</div>
                <select value={med[key] ?? ""} onChange={(e) => upd(key, e.target.value)} style={{
                  width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 8,
                  padding: "7px 4px", fontSize: 13, fontWeight: 600, color: C.text,
                  textAlign: "center", background: C.card, outline: "none", fontFamily: "inherit",
                  cursor: "pointer", appearance: "none",
                }}
                  onFocus={(e) => e.target.style.borderColor = C.accent}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                >
                  {DOSE_OPTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelSt}>Additional Instructions (Optional)</label>
        <textarea value={med.instructions} onChange={(e) => upd("instructions", e.target.value)}
          placeholder="e.g. Take with food, avoid grapefruit juice…"
          rows={2} style={{ ...fieldSt, resize: "vertical" }}
          onFocus={(e) => e.target.style.borderColor = C.accent}
          onBlur={(e) => e.target.style.borderColor = C.border}
        />
      </div>
    </div>
  );
}

// ── Live Preview Panel ────────────────────────────────────────────────────────
function PreviewPanel({ form, doctor, draftRef, laboratories, onSaveWithLaboratory }) {
  const [isSending, setIsSending]     = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");
  const [showLaboratoryModal, setShowLaboratoryModal] = useState(false);
  const hasTests = form.tests?.length > 0;

  const buildRx = () => ({
    patient_name:  form.patient?.name  || "—",
    patient_age:   form.patient?.age   || null,
    patient_phone: form.patient?.phone || null,
    date:      form.date,
    diagnosis: form.diagnosis,
    medicines: form.medicines,
    tests:     form.tests,
    notes:     form.notes,
    follow_up: form.follow_up,
  });

  const handleSendToPatient = async () => {
    if (!form.patient && !form.diagnosis) { alert("Please select a patient and add a diagnosis first."); return; }
    setIsSending(true);
    try {
      const rx          = buildRx();
      const htmlContent = generatePremiumPDF(rx, doctor);

      if (!document.getElementById("pdf-font-link")) {
        const link = Object.assign(document.createElement("link"), {
          id: "pdf-font-link", rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap",
        });
        document.head.appendChild(link);
      }

      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      Object.assign(container.style, {
        position: "fixed", top: "-9999px", left: "-9999px",
        width: "760px", background: "white", zIndex: "-1", pointerEvents: "none",
      });
      document.body.appendChild(container);
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 1200));

      const html2pdf = (await import("html2pdf.js")).default;
      const pdfBase64 = await html2pdf()
        .from(container.firstChild)
        .set({
          margin:      [12, 10, 16, 10],
          filename:    "prescription.pdf",
          html2canvas: { scale: 2, useCORS: true, logging: false, width: 760, windowWidth: 760 },
          jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .outputPdf("datauristring");

      document.body.removeChild(container);

      const res = await fetch("/api/send-patient", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, patientName: rx.patient_name, patientPhone: rx.patient_phone }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccessMsg("Sent to Patient");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to send: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    if (!form.patient && !form.diagnosis) { alert("Please select a patient and add a diagnosis first."); return; }
    const rx          = buildRx();
    const htmlContent = generatePremiumPDF(rx, doctor);
    const w           = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Rx - ${rx.patient_name}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap">
    <style>body{margin:0;padding:0;background:white;}</style>
    </head><body>${htmlContent}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 1000);
  };

  return (
    <div style={{
      width: 270, flexShrink: 0, background: C.card, borderRadius: 14,
      border: `1.5px solid ${C.border}`, overflow: "hidden",
      boxShadow: "0 2px 16px rgba(0,0,0,.08)",
      position: "sticky", top: 20, alignSelf: "flex-start",
    }}>
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📋</div>
          <div>
            <div style={{ fontSize: 11, color: C.muted }}>Digital Prescription</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Cura General Medical Center</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Preview</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.brand }}>{draftRef}</div>
        </div>
      </div>

      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e0f2f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{form.patient?.name || "—"}</div>
          <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
            {form.patient?.phone ? (
              <>
                {form.patient.phone.includes("@") ? <Mail size={10} style={{ opacity: 0.6 }} /> : <Phone size={10} style={{ opacity: 0.6 }} />}
                <span>ID: {form.patient.uid ? `#${form.patient.uid}` : form.patient.phone.replace(/^web_/, "").slice(-8)}</span>
              </>
            ) : "No patient selected"}
            {form.patient?.age ? ` · Age: ${form.patient.age}` : ""}
          </div>
        </div>
      </div>

      {hasTests ? (
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accentDk, textTransform: "uppercase", letterSpacing: ".6px" }}>Requested Lab Tests</div>
            <Badge status={form.status} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {form.tests.map((t, i) => (
              <span key={i} style={{ background: "#f0fdf4", border: `1px solid ${C.accent}44`, borderRadius: 20, padding: "4px 10px", fontSize: 11, color: C.accentDk, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${C.border}`, textAlign: "center", color: C.muted, fontSize: 12 }}>
          Select lab tests to see preview
        </div>
      )}

      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Authorized by</div>
        <div style={{ fontStyle: "italic", fontWeight: 700, fontSize: 14, color: C.brand }}>Dr. {doctor?.name || "—"}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{doctor?.department}</div>
      </div>

      {form.follow_up && (
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted }}>Follow-up</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.accentDk, marginTop: 2 }}>{fmt(form.follow_up)}</div>
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
          <button onClick={handleSendToPatient} disabled={isSending} style={{
            background: C.card, border: `1.5px solid ${C.border}`, color: C.text,
            borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 600,
            cursor: isSending ? "not-allowed" : "pointer", opacity: isSending ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>📧 {isSending ? "Sending..." : "Send to Patient"}</button>

          <button onClick={() => setShowLaboratoryModal(true)} style={{
            background: C.brand, color: "#fff", border: "none",
            borderRadius: 10, padding: "9px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}>🏥 Send to Laboratory</button>
        </div>
        <button onClick={handlePrint} style={{
          width: "100%", background: "transparent", color: C.muted, border: "none",
          borderRadius: 10, padding: "6px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
          textDecoration: "underline"
        }}>🖨 Print PDF</button>
      </div>

      <div style={{ padding: "0 16px 12px", fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
        HIPAA & GDPR compliant · Encrypted diagnostic requisition
      </div>

      <AnimatePresence>
        {showLaboratoryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.98)",
              display: "flex", flexDirection: "column", padding: 20,
              zIndex: 90, borderRadius: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: C.text }}>Select Laboratory</h3>
              <button onClick={() => setShowLaboratoryModal(false)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {laboratories?.map(l => (
                <button key={l.id} onClick={() => {
                  setShowLaboratoryModal(false);
                  onSaveWithLaboratory(l.id);
                  setSuccessMsg("Sent to Laboratory");
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }} style={{
                  padding: "12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
                  textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column"
                }} onMouseEnter={e => e.currentTarget.style.borderColor = C.brand} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l.name}</span>
                  <span style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Accreditation: {l.accreditation_number}</span>
                </button>
              ))}
              {(!laboratories || laboratories.length === 0) && (
                <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 20 }}>No laboratories registered</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, background: "rgba(255,255,255,0.95)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              zIndex: 100, borderRadius: 14,
            }}
          >
            <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }}
              style={{ width: 80, height: 80, background: "#10B981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <motion.h3 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{successMsg}</motion.h3>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Prescription Form ─────────────────────────────────────────────────────────
function RxForm({ doctorId, doctor, editRx, onSaved, onCancel, logPHIAccess }) {
  const { push, toasts } = useToast();
  const [draftIdVal] = useState(() => draftId());
  const [saving, setSaving] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);

  // Initialize form using editRx if it exists
  const getInitialForm = (rx) => {
    if (rx) {
      return {
        patient:   rx._patient || { name: rx.patient_name, phone: rx.patient_phone?.replace(/^web_/, ""), age: rx.patient_age } || null,
        date:      rx.date || new Date().toISOString().slice(0, 10),
        diagnosis: rx.diagnosis || "",
        notes:     (rx.notes || "").replace(/\n?\[LABORATORY:.*?\]/g, ""), // Strip out the internal laboratory tag for editing
        follow_up: rx.follow_up || "",
        status:    rx.status || "pending",
        medicines: rx.medicines || [],
        tests:     rx.tests || [],
        laboratory_id: rx.notes?.match(/\[LABORATORY: (.*?)\]/)?.[1] || "",
      };
    }
    return {
      patient: null,
      date: new Date().toISOString().slice(0, 10),
      diagnosis: "", notes: "", follow_up: "", status: "pending",
      medicines: [], tests: [], laboratory_id: "",
    };
  };

  const [form, setForm] = useState(() => getInitialForm(editRx));

  const [laboratories, setLaboratories] = useState([]);

  useEffect(() => {
    supabase.from("laboratories").select("id, name, accreditation_number").then(({ data }) => {
      if (data) setLaboratories(data);
    });
  }, []);

  const [prevEditRx, setPrevEditRx] = useState(editRx);
  if (editRx !== prevEditRx) {
    setPrevEditRx(editRx);
    setForm(getInitialForm(editRx));
  }

  const setField  = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const updateMed = (id, field, val) => setForm((p) => ({ ...p, medicines: p.medicines.map((m) => m._id === id ? { ...m, [field]: val } : m) }));
  const removeMed = (id) => setForm((p) => ({ ...p, medicines: p.medicines.filter((m) => m._id !== id) }));

  const save = async (overrideLabId) => {
    if (!form.patient && !editRx) { push("Please select a patient", "error"); return; }
    if (!form.diagnosis.trim())    { push("Diagnosis is required", "error"); return; }
    setSaving(true);
    let finalNotes = form.notes.trim();
    const lId = typeof overrideLabId === "string" ? overrideLabId : form.laboratory_id;
    if (lId) {
      finalNotes = finalNotes ? `${finalNotes}\n[LABORATORY: ${lId}]` : `[LABORATORY: ${lId}]`;
    }

    const payload = {
      doctor_id:     doctorId,
      patient_name:  form.patient?.name  || editRx?.patient_name  || "",
      patient_phone: form.patient?.phone || editRx?.patient_phone || null,
      patient_age:   form.patient?.age   || editRx?.patient_age   || null,
      date:      form.date,
      diagnosis: form.diagnosis.trim(),
      medicines: editRx?.medicines || [],
      tests:     form.tests,
      notes:     finalNotes || null,
      follow_up: form.follow_up || null,
      status:    form.status,
      updated_at: new Date().toISOString(),
    };
    const { error } = editRx
      ? await supabase.from("prescriptions").update(payload).eq("id", editRx.id)
      : await supabase.from("prescriptions").insert(payload);
    setSaving(false);
    if (error) { push(error.message, "error"); return; }

    // Log WRITE_PHI event
    if (logPHIAccess) {
      await logPHIAccess(
        "WRITE_PHI",
        payload.patient_name,
        payload.patient_phone,
        editRx ? `Updated prescription (ID: ${editRx.id})` : "Created new prescription"
      );
    }

    push(editRx ? "Prescription updated ✓" : "Prescription saved ✓");
    onSaved();
  };

  return (
    <>
      <Toast toasts={toasts} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{editRx ? "Edit Lab Request" : "New Lab Request"}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Create and authorize diagnostic tests for your patient.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, borderRadius: 20, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>✕ Cancel</button>
          <button onClick={save} disabled={saving} style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 20, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1 }}>
            ✓ {saving ? "Saving…" : "Order Tests"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Patient Details */}
          <div style={{ background: C.card, borderRadius: 14, border: `1.5px solid ${C.border}`, padding: 20, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>👥</span> Patient Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelSt}>Select Patient</label>
                <PatientDropdown value={form.patient} onChange={(p) => setField("patient", p)} doctorId={doctorId} />
              </div>
              <div>
                <label style={labelSt}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} style={fieldSt}
                  onFocus={(e) => e.target.style.borderColor = C.accent}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                />
              </div>
            </div>
            <div>
              <label style={labelSt}>Diagnosis / Chief Complaint</label>
              <input value={form.diagnosis} onChange={(e) => setField("diagnosis", e.target.value)}
                placeholder="Primary diagnosis…" style={fieldSt}
                onFocus={(e) => e.target.style.borderColor = C.accent}
                onBlur={(e) => e.target.style.borderColor = C.border}
              />
            </div>
          </div>



          {/* Lab Tests */}
          <div style={{ background: C.card, borderRadius: 14, border: `1.5px solid ${C.border}`, padding: 20, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>🔬 Lab Tests / Investigations</div>
            <LabTestInput onAdd={(t) => {
              if (!form.tests.includes(t)) setForm((p) => ({ ...p, tests: [...p.tests, t] }));
            }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {form.tests.map((t, i) => (
                <span key={i} style={{
                  background: "#f0fdf4", border: `1px solid ${C.accent}44`, borderRadius: 20,
                  padding: "4px 12px", fontSize: 12, color: C.accentDk, fontWeight: 500,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {t}
                  <span onClick={() => setForm((p) => ({ ...p, tests: p.tests.filter((_, idx) => idx !== i) }))}
                    style={{ cursor: "pointer", color: C.danger, fontWeight: 700, fontSize: 11 }}>✕</span>
                </span>
              ))}
            </div>
          </div>

          {/* Follow-up, Status, Notes */}
          <div style={{ background: C.card, borderRadius: 14, border: `1.5px solid ${C.border}`, padding: 20, marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelSt}>Follow-up Date (Optional)</label>
                <input type="date" value={form.follow_up} onChange={(e) => setField("follow_up", e.target.value)} style={fieldSt}
                  onFocus={(e) => e.target.style.borderColor = C.accent}
                  onBlur={(e) => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <label style={labelSt}>Status</label>
                <div style={{ position: "relative" }}>
                  <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={{
                    ...fieldSt, appearance: "none", cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236b8078' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
                  }}>
                    {["pending","active","completed","cancelled"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label style={labelSt}>Additional Notes</label>
              <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)}
                placeholder="Special instructions, dietary advice, referral notes…"
                rows={3} style={{ ...fieldSt, resize: "vertical" }}
                onFocus={(e) => e.target.style.borderColor = C.accent}
                onBlur={(e) => e.target.style.borderColor = C.border}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onCancel} style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ background: C.brand, color: "#fff", border: "none", borderRadius: 10, padding: "10px 26px", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1 }}>
              {saving ? "Saving…" : editRx ? "Update Lab Request" : "Save Lab Request"}
            </button>
          </div>
        </div>

        <PreviewPanel 
          form={form} 
          doctor={doctor} 
          draftRef={draftIdVal} 
          laboratories={laboratories} 
          onSaveWithLaboratory={async (labId) => {
            setField("laboratory_id", labId);
            save(labId);
          }} 
        />
      </div>
    </>
  );
}

// ── Expanded Row Detail ───────────────────────────────────────────────────────
function RxDetail({ rx }) {
  return (
    <div style={{ padding: "14px 20px 18px", background: "#f8fafc", borderTop: `1px solid ${C.border}` }}>

      {rx.tests?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: C.accentDk, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Lab Tests</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rx.tests.map((t, i) => (
              <span key={i} style={{ background: "#f0fdf4", border: `1px solid ${C.accent}44`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: C.accentDk }}>{t}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 32 }}>
        {rx.notes && <div><div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>Notes</div><div style={{ color: C.text, fontSize: 12 }}>{rx.notes}</div></div>}
        {rx.follow_up && <div><div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>Follow-up</div><div style={{ color: C.accentDk, fontSize: 12, fontWeight: 600 }}>{fmt(rx.follow_up)}</div></div>}
      </div>
    </div>
  );
}

// ── Prescription List ─────────────────────────────────────────────────────────
function RxList({ prescriptions, loading, onEdit, onDelete, onNew, logPHIAccess }) {
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [expanded, setExpanded] = useState(null);

  const counts = {
    all:       prescriptions.length,
    pending:   prescriptions.filter((r) => r.status === "pending").length,
    active:    prescriptions.filter((r) => r.status === "active").length,
    completed: prescriptions.filter((r) => r.status === "completed").length,
    cancelled: prescriptions.filter((r) => r.status === "cancelled").length,
  };

  const filtered = prescriptions
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => {
      const q = search.toLowerCase();
      return r.patient_name?.toLowerCase().includes(q) || r.diagnosis?.toLowerCase().includes(q) || r.patient_phone?.includes(q);
    });

  const printRx = (rx) => {
    const htmlContent = generatePremiumPDF(rx, null);
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Rx - ${rx.patient_name}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap">
    <style>body{margin:0;padding:0;background:white;}</style>
    </head><body>${htmlContent}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 1000);
  };

  return (
    <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total",     val: counts.all,       color: C.info },
            { label: "Pending",   val: counts.pending,   color: "#F59E0B" },
            { label: "In Progress",val: counts.active,   color: C.accentDk },
            { label: "Completed", val: counts.completed, color: "#7c3aed" },
            { label: "Cancelled", val: counts.cancelled, color: C.danger },
          ].map((c) => (
          <div key={c.label} style={{
            background: C.card, border: `1.5px solid ${c.color}22`,
            borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.06)",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.label} Prescriptions</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient, diagnosis, phone…"
          style={{ flex: 1, minWidth: 200, ...fieldSt }}
          onFocus={(e) => e.target.style.borderColor = C.accent}
          onBlur={(e) => e.target.style.borderColor = C.border}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["all","pending","active","completed","cancelled"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? C.brand : C.card,
              color:      filter === f ? "#fff" : C.muted,
              border:     `1.5px solid ${filter === f ? C.brand : C.border}`,
              borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", textTransform: "capitalize",
            }}>{f === "active" ? "In Progress" : f}{counts[f] > 0 ? ` (${counts[f]})` : ""}</button>
          ))}
        </div>
        <button onClick={onNew} style={{ background: C.brand, color: "#fff", fontWeight: 700, border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>+ New Rx</button>
      </div>

      <div style={{ background: C.card, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Patient","Age","Phone","Date","Diagnosis","Lab Tests","Follow-up","Status","Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1.5px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 13 }}>No prescriptions found</td></tr>}
            {filtered.map((rx) => (
              <React.Fragment key={rx.id}>
                <tr onClick={() => {
                  const isExpanding = expanded !== rx.id;
                  setExpanded(isExpanding ? rx.id : null);
                  if (isExpanding && logPHIAccess) {
                    logPHIAccess("READ_PHI", rx.patient_name, rx.patient_phone, "Expanded prescription details view.");
                  }
                }} style={{ borderTop: `1px solid ${C.border}`, cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "11px 14px", color: C.text, fontWeight: 600, fontSize: 13 }}>
                    {expanded === rx.id ? "▾ " : "▸ "}
                    {rx.patient_name}
                    {rx.patient_uid && <span style={{ fontSize: 10, color: C.primary, marginLeft: 6 }}>#{rx.patient_uid}</span>}
                  </td>
                  <td style={{ padding: "11px 14px", color: C.muted, fontSize: 13 }}>{rx.patient_age || "—"}</td>
                  <td style={{ padding: "11px 14px", color: C.muted, fontSize: 13 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {rx.patient_phone ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {rx.patient_phone.includes("@") ? <Mail size={12} style={{ opacity: 0.6 }} /> : <Phone size={12} style={{ opacity: 0.6 }} />}
                          <span>{rx.patient_phone.replace(/^web_/, "")}</span>
                        </div>
                      ) : "No phone"}
                      {rx.patient_uid && <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginTop: 4 }}>ID: #{rx.patient_uid}</div>}
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", color: C.muted, fontSize: 13 }}>{fmt(rx.date)}</td>
                  <td style={{ padding: "11px 14px", color: C.text, fontSize: 13, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rx.diagnosis}</td>
                  <td style={{ padding: "11px 14px", color: C.muted, fontSize: 13 }}>{rx.tests?.length || 0} test(s)</td>
                  <td style={{ padding: "11px 14px", color: rx.follow_up ? C.accentDk : C.muted, fontSize: 13, fontWeight: rx.follow_up ? 600 : 400 }}>{fmt(rx.follow_up)}</td>
                  <td style={{ padding: "11px 14px" }}><Badge status={rx.status} /></td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onEdit(rx)} style={{ background: "#f0fdf4", border: `1px solid ${C.accent}44`, color: C.accentDk, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✎</button>
                      <button onClick={() => {
                        if (logPHIAccess) {
                          logPHIAccess("READ_PHI", rx.patient_name, rx.patient_phone, "Printed/Exported prescription PDF.");
                        }
                        printRx(rx);
                      }} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: C.info, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>⎙</button>
                      <button onClick={() => onDelete(rx.id)} style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: C.danger, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>🗑</button>
                    </div>
                  </td>
                </tr>
                {expanded === rx.id && (
                  <tr key={`${rx.id}-det`}><td colSpan={9} style={{ padding: 0 }}><RxDetail rx={rx} /></td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function LabTestTab({ doctorId }) {
  const { push, toasts } = useToast();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [view, setView]                   = useState("list");
  const [editRx, setEditRx]               = useState(null);
  const [doctor, setDoctor]               = useState(null);

  useEffect(() => {
    if (!doctorId) return;
    supabase.from("doctors").select("id,name,department,phone,avatar_url")
      .eq("id", doctorId).single()
      .then(({ data }) => { if (data) setDoctor(data); });
  }, [doctorId]);

  const fetchPrescriptions = useCallback(async () => {
    if (!doctorId) return;
    Promise.resolve().then(() => setLoading(true));
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id,patient_name,patient_phone,patient_age,date,diagnosis,medicines,tests,notes,follow_up,status,created_at,updated_at")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    if (error) {
      setLoading(false);
      push(error.message, "error");
      return;
    }
    // Fetch Web Patients to map UIDs
    const { data: wpData } = await supabase.from("web_patients").select("email, phone, uid");
    const uidMap = {};
    if (wpData) {
      wpData.forEach(wp => {
        if (wp.phone) uidMap[wp.phone] = wp.uid;
        if (wp.email) {
          uidMap[wp.email] = wp.uid;
          uidMap[`web_${wp.email}`] = wp.uid;
        }
      });
    }

    const mergedData = (data || []).map(rx => ({
      ...rx,
      patient_uid: uidMap[rx.patient_phone] || null
    }));

    setPrescriptions(mergedData);
    setLoading(false);
  }, [doctorId, push]);

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      if (active) fetchPrescriptions();
    }, 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [fetchPrescriptions]);

  const logPHIAccess = useCallback(async (actionType, patientName, patientPhone, notes = "") => {
    if (!doctorId) return;
    try {
      await supabase.from("audit_logs").insert([{
        actor_id: doctorId,
        actor_role: "doctor",
        action_type: actionType,
        phi_category: "prescriptions",
        patient_identifier: patientPhone,
        description: `Doctor accessed prescription context. Patient: ${patientName}. ${notes}`
      }]);
    } catch (err) {
      console.error("Audit log failed:", err);
    }
  }, [doctorId]);

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: C.text, background: C.bg, minHeight: "100vh", padding: 24 }}>
      <Toast toasts={toasts} />

      {view === "list" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Lab Requests</h2>
              {doctor && <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Dr. {doctor.name} · {doctor.department}</div>}
            </div>
            <button onClick={() => { setEditRx(null); setView("form"); }} style={{
              background: C.brand, color: "#fff", fontWeight: 700, border: "none",
              borderRadius: 10, padding: "10px 20px", fontSize: 13, cursor: "pointer",
            }}>+ New Lab Request</button>
          </div>
          <RxList
            prescriptions={prescriptions} loading={loading}
            onEdit={(rx) => { setEditRx(rx); setView("form"); }}
            onDelete={async (id) => {
              if (!window.confirm("Delete this prescription?")) return;
              const { error } = await supabase.from("prescriptions").delete().eq("id", id);
              if (error) { push(error.message, "error"); return; }
              push("Prescription deleted"); fetchPrescriptions();
            }}
            onNew={() => { setEditRx(null); setView("form"); }}
            logPHIAccess={logPHIAccess}
          />
        </>
      )}

      {view === "form" && (
        <RxForm
          doctorId={doctorId} doctor={doctor} editRx={editRx}
          onSaved={() => { setView("list"); setEditRx(null); fetchPrescriptions(); }}
          onCancel={() => { setView("list"); setEditRx(null); }}
          logPHIAccess={logPHIAccess}
        />
      )}
    </div>
  );
}