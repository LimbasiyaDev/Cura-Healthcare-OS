"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, User, Phone, Calendar, Hash, Mail,
  Plus, Minus, Trash2, Printer, MessageCircle,
  FileText, CheckCircle2, ChevronDown, Edit3,
  Zap, AlertCircle, Eye, Send, RefreshCw,
  Clock, DollarSign, CheckCheck, Wifi
} from "lucide-react";

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const PRIMARY   = "#143D30";
const ACCENT    = "#4ECCA3";
const BOT_URL   = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

const CATALOG = {
  Consultation: [
    { name: "General Consultation",           price: 500  },
    { name: "Executive Health Screening",      price: 2500 },
    { name: "Follow-up Visit",                 price: 300  },
    { name: "Specialist Referral Consult",     price: 800  },
    { name: "Teleconsultation",                price: 400  },
    { name: "Second Opinion",                  price: 1000 },
  ],
  "Lab Tests": [
    { name: "Complete Blood Count (CBC)",      price: 350  },
    { name: "Comprehensive Metabolic Panel",   price: 1850 },
    { name: "Lipid Profile & Panel",           price: 950  },
    { name: "Thyroid Function (TSH/T3/T4)",    price: 600  },
    { name: "HbA1c (Diabetes Screening)",      price: 450  },
    { name: "Urine Routine Analysis",          price: 200  },
    { name: "Liver Function Test (LFT)",       price: 550  },
    { name: "Kidney Function Test (KFT)",      price: 500  },
  ],
  Radiology: [
    { name: "Chest X-Ray (PA View)",           price: 400  },
    { name: "Ultrasound Abdomen",              price: 900  },
    { name: "ECG / EKG",                       price: 350  },
    { name: "2D Echo (Echocardiogram)",        price: 2200 },
    { name: "MRI Scan (Brain)",                price: 7500 },
    { name: "CT Scan (Abdomen)",               price: 6000 },
  ],
  Pharmacy: [
    { name: "Lisinopril 10mg (30-day)",        price: 425  },
    { name: "Metformin 500mg (30-day)",        price: 180  },
    { name: "Atorvastatin 20mg (30-day)",      price: 350  },
    { name: "Pantoprazole 40mg (30-day)",      price: 220  },
    { name: "Multivitamin Supplement",         price: 280  },
    { name: "Paracetamol 500mg Strip",         price: 45   },
  ],
  Procedures: [
    { name: "Minor Dressing / Wound Care",     price: 300  },
    { name: "IV Infusion (per session)",       price: 800  },
    { name: "Nebulization",                    price: 250  },
    { name: "Injection (IM/IV Admin)",         price: 150  },
    { name: "Suture Removal",                  price: 200  },
    { name: "Blood Glucose Monitoring",        price: 100  },
  ],
};

const CAT_ICONS = {
  Consultation: "🩺",
  "Lab Tests":  "🧪",
  Radiology:    "📡",
  Pharmacy:     "💊",
  Procedures:   "🩹",
};

const fmt = (n) =>
  "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function generateInvNum() {
  const uid = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID().split("-")[0].toUpperCase()
    : Math.floor(Math.random() * 9000 + 1000).toString();
  return `INV-${new Date().getFullYear()}-${uid}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

// ── INVOICE STATUS CONFIG ────────────────────────────────────────────────────
const INVOICE_STATUS = {
  draft:    { label: "Draft",         color: "#94A3B8", bg: "#F1F5F9",   icon: <FileText size={12} /> },
  sent:     { label: "Sent",          color: "#3B82F6", bg: "#EFF6FF",   icon: <Send size={12} /> },
  pending:  { label: "Pending Pay",   color: "#F59E0B", bg: "#FFFBEB",   icon: <Clock size={12} /> },
  paid:     { label: "Paid",          color: "#10B981", bg: "#ECFDF5",   icon: <CheckCheck size={12} /> },
  overdue:  { label: "Overdue",       color: "#EF4444", bg: "#FEF2F2",   icon: <AlertCircle size={12} /> },
};

// ── PATIENT SEARCH DROPDOWN ──────────────────────────────────────────────────
function PatientSearchBox({ appointments, onSelect, selected }) {
  const [query,        setQuery]       = useState("");
  const [open,         setOpen]        = useState(false);
  const [highlighted,  setHighlighted] = useState(-1);
  const inputRef     = useRef(null);
  const containerRef = useRef(null);

  const patients = Object.values(
    appointments.reduce((acc, a) => {
      const key = `${a.name}-${a.phone}`;
      if (!acc[key]) {
        acc[key] = { name: a.name, phone: a.phone, dates: [a.date], lastVisit: a.date, status: a.status, id: a.id, patient_uid: a.patient_uid };
      } else {
        acc[key].dates.push(a.date);
        if (a.date > acc[key].lastVisit) acc[key].lastVisit = a.date;
      }
      return acc;
    }, {})
  );

  const filtered = query.trim().length > 0
    ? patients.filter(p =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.phone?.includes(query)
      )
    : patients;

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler, false);
    return () => document.removeEventListener("mousedown", handler, false);
  }, []);

  const handleSelect = (p) => {
    onSelect(p);
    setQuery(p.name);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKey = (e) => {
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && highlighted >= 0) handleSelect(filtered[highlighted]);
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label style={styles.fieldLabel}>Search patient from appointments</label>
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Type patient name or phone number…"
          style={{ ...styles.inputF, paddingLeft: 38, paddingRight: selected ? 36 : 14 }}
          autoComplete="off"
        />
        {selected && (
          <button
            onClick={() => { onSelect(null); setQuery(""); setOpen(false); }}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", padding: 4 }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
              borderRadius: 16, zIndex: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid rgba(20,61,48,0.10)",
              overflow: "hidden", maxHeight: 320, overflowY: "auto",
            }}
          >
            <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid rgba(20,61,48,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {filtered.length} patient{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            {filtered.map((p, i) => (
              <motion.div
                key={`${p.name}-${p.phone}`}
                onClick={() => handleSelect(p)}
                whileHover={{ x: 4 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", cursor: "pointer",
                  background: highlighted === i ? "rgba(20,61,48,0.05)" : "transparent",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(20,61,48,0.04)" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={() => setHighlighted(i)}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 13, fontWeight: 900, fontFamily: "'Syne', sans-serif",
                  boxShadow: "0 4px 10px rgba(20,61,48,0.25)",
                }}>
                  {p.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 14, color: "#0F172A", lineHeight: 1.2 }}>
                    {p.name}
                  </p>
                  <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      {p.phone?.includes("@") ? <Mail size={9} /> : <Phone size={9} />} {p.phone?.replace(/^web_/, "")}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      <Calendar size={9} /> Last: {p.lastVisit}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
                      {p.dates.length} visit{p.dates.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  background: "rgba(20,61,48,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: PRIMARY, flexShrink: 0,
                }}>
                  <ChevronDown size={12} style={{ transform: "rotate(-90deg)" }} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        {open && query.trim().length > 0 && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
              borderRadius: 16, zIndex: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              border: "1px solid rgba(20,61,48,0.08)",
              padding: "20px 16px", textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600 }}>No patients found for &quot;{query}&quot;</p>
            <p style={{ fontSize: 11, color: "#CBD5E1", marginTop: 4 }}>You can still fill in the details manually below</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SERVICE CHIP ─────────────────────────────────────────────────────────────
function ServiceChip({ service, category, index, isAdded, onAdd }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onAdd}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px",
        border: isAdded ? `1.5px solid ${PRIMARY}` : "1px solid rgba(20,61,48,0.10)",
        borderRadius: 14, cursor: "pointer",
        background: isAdded ? "rgba(20,61,48,0.06)" : "rgba(255,255,255,0.7)",
        transition: "all 0.18s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{service.name}</p>
        <p style={{ fontSize: 11, color: PRIMARY, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginTop: 2 }}>
          {fmt(service.price)}
        </p>
      </div>
      <div style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginLeft: 8,
        background: isAdded ? PRIMARY : "rgba(20,61,48,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s",
      }}>
        {isAdded ? <CheckCircle2 size={13} color="white" /> : <Plus size={13} color={PRIMARY} />}
      </div>
    </motion.div>
  );
}

// ── INVOICE STATUS BADGE ─────────────────────────────────────────────────────
function InvoiceStatusBadge({ status, large = false }) {
  const cfg = INVOICE_STATUS[status] || INVOICE_STATUS.draft;
  return (
    <motion.div
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: large ? "8px 16px" : "5px 10px",
        borderRadius: 999,
        background: cfg.bg,
        border: `1.5px solid ${cfg.color}30`,
        color: cfg.color,
        fontSize: large ? 13 : 10,
        fontWeight: 900,
        fontFamily: "'Syne', sans-serif",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {cfg.icon}
      {cfg.label}
    </motion.div>
  );
}

// ── MAIN INVOICE TAB ─────────────────────────────────────────────────────────
export default function InvoiceTab({ doctor, appointments = [] }) {
  const invNumRef = useRef(generateInvNum());

  // Patient
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patName,   setPatName]   = useState("");
  const [patPhone,  setPatPhone]  = useState("");
  const [patId,     setPatId]     = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [dueDate,   setDueDate]   = useState("");
  const [docName,   setDocName]   = useState("");
  const [facility,  setFacility]  = useState("Cura Premier Health");

  // Catalog
  const [activeCategory, setActiveCategory] = useState("Consultation");

  // Line items
  const [items, setItems] = useState([]);

  // Custom item
  const [showCustom,   setShowCustom]   = useState(false);
  const [custDesc,     setCustDesc]     = useState("");
  const [custPrice,    setCustPrice]    = useState("");
  const [custCategory, setCustCategory] = useState("Consultation");

  // Payment
  const [taxOn,       setTaxOn]       = useState(false);
  const [insAdj,      setInsAdj]      = useState("");
  const [discount,    setDiscount]    = useState("");
  const [payStatus,   setPayStatus]   = useState("Pending");
  const [insProvider, setInsProvider] = useState("");
  const [billNotes,   setBillNotes]   = useState("");

  // ── Invoice status tracking ──────────────────────────────────────────────
  // invoiceStatus: "draft" | "sent" | "pending" | "paid" | "overdue"
  const [invoiceStatus, setInvoiceStatus] = useState("draft");
  const [sentAt,        setSentAt]        = useState(null);
  const [paidAt,        setPaidAt]        = useState(null);
  const [polling,       setPolling]       = useState(false);
  const pollRef = useRef(null);

  // UI
  const [toast,     setToast]     = useState(null);
  const [sending,   setSending]   = useState(false);
  const [printing,  setPrinting]  = useState(false);

  const initialisedRef    = useRef(false);
  const docNameEditedRef  = useRef(false);

  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    const today = new Date();
    const due   = new Date(); due.setDate(due.getDate() + 14);
    const iso   = (d) => d.toISOString().split("T")[0];
    setVisitDate(iso(today));
    setDueDate(iso(due));
    setDocName(doctor?.name || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!docNameEditedRef.current && doctor?.name) setDocName(doctor.name);
  }, [doctor?.name]);

  // ── Poll invoice status from bot ─────────────────────────────────────────
  const startPolling = useCallback((invNum) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${BOT_URL}/invoice-status/${invNum}`);
        const data = await res.json();
        if (data.status) {
          setInvoiceStatus(data.status);
          if (data.status === "paid") {
            setPaidAt(data.paid_at ? new Date(data.paid_at).toLocaleTimeString() : new Date().toLocaleTimeString());
            setPayStatus("Paid");
            clearInterval(pollRef.current);
            setPolling(false);
            showToast("💰 Payment received! Invoice marked as paid.", "success");
          }
        }
      } catch (_) { /* server might be temporarily unreachable */ }
    }, 8000); // poll every 8s
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePatientSelect = (p) => {
    setSelectedPatient(p);
    if (p) {
      setPatName(p.name || "");
      setPatPhone(p.phone?.replace(/^web_/, "") || "");
      setPatId(p.patient_uid ? `#${p.patient_uid}` : `P-${p.id?.toString().slice(-6).toUpperCase() || "000000"}`);
    } else {
      setPatName(""); setPatPhone(""); setPatId("");
    }
  };

  // Totals
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const tax      = taxOn ? subtotal * 0.05 : 0;
  const ins      = parseFloat(insAdj)   || 0;
  const disc     = parseFloat(discount) || 0;
  const total    = Math.max(0, subtotal + tax - ins - disc);

  const isAdded = (cat, idx) => items.some(it => it.key === `${cat}_${idx}`);

  const addCatalogItem = (cat, idx) => {
    const svc = CATALOG[cat][idx];
    const key = `${cat}_${idx}`;
    setItems(prev => {
      const existing = prev.find(it => it.key === key);
      if (existing) return prev.map(it => it.key === key ? { ...it, qty: it.qty + 1 } : it);
      return [...prev, { key, desc: svc.name, category: cat, price: svc.price, qty: 1 }];
    });
  };

  const addCustomItem = () => {
    if (!custDesc.trim() || !custPrice) return;
    const key = `custom_${Date.now()}`;
    setItems(prev => [...prev, { key, desc: custDesc.trim(), category: custCategory, price: parseFloat(custPrice), qty: 1 }]);
    setCustDesc(""); setCustPrice(""); setShowCustom(false);
    showToast("Custom item added");
  };

  const changeQty    = (key, delta) => setItems(prev => prev.map(it => it.key === key ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  const removeItem   = (key) => setItems(prev => prev.filter(it => it.key !== key));
  const clearInvoice = () => {
    invNumRef.current = generateInvNum(); // generate a fresh invoice number
    setItems([]); setInsAdj(""); setDiscount(""); setPayStatus("Pending");
    setInsProvider(""); setBillNotes(""); setTaxOn(false);
    setInvoiceStatus("draft"); setSentAt(null); setPaidAt(null);
    if (pollRef.current) { clearInterval(pollRef.current); setPolling(false); }
    showToast("Invoice cleared", "info");
  };

  // ── Send via Bot (PDF + Pay Now CTA) ───────────────────────────
  const sendViaBot = async () => {
    if (!patPhone) { showToast("Select a patient with a phone number first", "error"); return; }
    if (items.length === 0) { showToast("Add at least one service", "error"); return; }

    setSending(true);
    try {
      const dbPayload = {
        invoice_num:        invNumRef.current,
        doctor_id:          doctor?.id || null,
        patient_name:       patName,
        patient_phone:      patPhone,
        patient_id:         patId || null,
        visit_date:         visitDate || null,
        due_date:           dueDate || null,
        facility:           facility || null,
        items:              items.map(it => ({ desc: it.desc, category: it.category, price: Number(it.price), qty: Number(it.qty) })),
        subtotal:           Number(subtotal),
        tax:                Number(tax),
        insurance_adj:      Number(ins),
        discount:           Number(disc),
        total:              Number(total),
        payment_status:     payStatus || 'Pending',
        insurance_provider: insProvider || null,
        notes:              billNotes || null,
      };

      // 1. Save to Supabase first using secure server-side API to bypass RLS
      const token = localStorage.getItem('cura_access_token') || '';
      const saveRes = await fetch("/api/save-invoice", {
        method:  "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body:    JSON.stringify(dbPayload),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        throw new Error(err.error || `Database error ${saveRes.status}`);
      }

      const payload = {
        phone:       patPhone,
        patientName: patName,
        patientId:   patId,
        doctorName:  docName || doctor?.name,
        facility,
        invoiceNum:  invNumRef.current,
        visitDate,
        dueDate,
        items:       items.map(it => ({ desc: it.desc, category: it.category, price: it.price, qty: it.qty })),
        subtotal,
        tax,
        insurance:   ins,
        discount:    disc,
        total,
        payStatus,
        insProvider,
        notes:       billNotes,
        hospitalId:  doctor?.hospital_id,
        doctorId:    doctor?.id,
        // The bot will build the pay page URL from this
        taxEnabled:  taxOn,
      };

      const res = await fetch(`${BOT_URL}/send-invoice`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      setInvoiceStatus("sent");
      setSentAt(new Date().toLocaleTimeString());
      startPolling(invNumRef.current);
      showToast(`✅ Invoice sent to ${patName} via Bot with Pay Now link!`, "success");
    } catch (err) {
      showToast(`Failed to send: ${err.message}`, "error");
    } finally {
      setSending(false);
    }
  };

  // ── Print / PDF ───────────────────────────────────────────────────────────
  const printInvoice = () => {
    if (items.length === 0) { showToast("Add at least one service", "error"); return; }
    setPrinting(true);

    const rows = items.map(it => `
      <tr>
        <td><strong>${it.desc}</strong></td>
        <td style="color:#64748B">${it.category}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${fmt(it.price)}</td>
        <td style="text-align:right;font-weight:700;color:#143D30">${fmt(it.price * it.qty)}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${invNumRef.current}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;padding:48px;color:#0F172A;max-width:760px;margin:0 auto;background:#fff}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #143D30}
        .brand{font-family:'Syne',sans-serif;font-size:32px;font-weight:900;color:#143D30;letter-spacing:-0.03em}
        .brand span{font-size:11px;font-weight:700;color:#94A3B8;display:block;letter-spacing:0.15em;text-transform:uppercase;margin-top:3px}
        .inv-meta{text-align:right}
        .inv-meta h1{font-family:'Syne',sans-serif;font-size:24px;font-weight:900;color:#0F172A}
        .inv-meta p{font-size:12px;color:#64748B;margin-top:4px}
        .badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;margin-top:8px;background:#FAEEDA;color:#854F0B}
        .badge.paid{background:#ECFDF5;color:#065F46}
        .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;background:#F8FAFB;border-radius:16px;margin-bottom:28px;overflow:hidden;border:1px solid #E2E8F0}
        .info-cell{padding:16px 20px;border-right:1px solid #E2E8F0}
        .info-cell:last-child{border-right:none}
        .info-cell label{font-size:9px;font-weight:800;color:#94A3B8;letter-spacing:0.18em;text-transform:uppercase;display:block;margin-bottom:5px}
        .info-cell p{font-size:13px;color:#1E293B;font-weight:600}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        th{text-align:left;padding:10px 12px;font-size:9px;font-weight:800;color:#64748B;letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid #E2E8F0;background:#F8FAFB}
        td{padding:12px 12px;font-size:13px;border-bottom:1px solid #F1F5F9}
        .sum-box{background:#F8FAFB;border-radius:14px;padding:20px 24px;margin-bottom:24px;border:1px solid #E2E8F0;max-width:340px;margin-left:auto}
        .sum-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#64748B}
        .sum-row span:last-child{color:#1E293B;font-weight:600}
        .sum-row.tot{border-top:2px solid #143D30;margin-top:10px;padding-top:12px;font-size:17px;color:#143D30;font-weight:900;font-family:'Syne',sans-serif}
        .pay-btn{display:block;text-align:center;padding:16px;background:#143D30;color:white;border-radius:14px;font-family:'Syne',sans-serif;font-weight:900;font-size:14px;text-decoration:none;letter-spacing:0.08em;margin:0 auto 24px;max-width:340px}
        .notes-box{background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:12px;color:#92400E}
        .footer{text-align:center;font-size:11px;color:#94A3B8;margin-top:36px;padding-top:16px;border-top:1px solid #E2E8F0}
        @media print{body{padding:20px}.pay-btn{display:none!important}@page{margin:1.5cm}}
      </style></head><body>
      <div class="header">
        <div><div class="brand">Cura<span>Clinical Management</span></div></div>
        <div class="inv-meta">
          <h1>Patient Invoice</h1>
          <p>${invNumRef.current}</p>
          <div class="badge ${payStatus === "Paid" ? "paid" : ""}">${payStatus}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-cell"><label>Patient</label><p>${patName || "—"}</p><p style="font-size:11px;color:#94A3B8;margin-top:2px">${patId || ""}</p></div>
        <div class="info-cell"><label>Doctor</label><p>Dr. ${docName || doctor?.name || "—"}</p><p style="font-size:11px;color:#94A3B8;margin-top:2px">${facility}</p></div>
        <div class="info-cell"><label>Contact</label><p>${patPhone || "—"}</p></div>
        <div class="info-cell"><label>Visit date</label><p>${visitDate || "—"}</p></div>
        <div class="info-cell"><label>Due date</label><p>${dueDate || "—"}</p></div>
        <div class="info-cell"><label>Insurance</label><p>${insProvider || "—"}</p></div>
      </div>
      <table>
        <thead><tr>
          <th>Description</th><th>Category</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="sum-box">
        <div class="sum-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${tax  > 0 ? `<div class="sum-row"><span>GST / Tax (5%)</span><span>${fmt(tax)}</span></div>`        : ""}
        ${ins  > 0 ? `<div class="sum-row"><span>Insurance Adjustment</span><span>-${fmt(ins)}</span></div>` : ""}
        ${disc > 0 ? `<div class="sum-row"><span>Discount</span><span>-${fmt(disc)}</span></div>`            : ""}
        <div class="sum-row tot"><span>Total Due</span><span>${fmt(total)}</span></div>
      </div>
      <a class="pay-btn" href="${BOT_URL}/pay/${invNumRef.current}" target="_blank">💳 Pay Now — ${fmt(total)}</a>
      ${billNotes ? `<div class="notes-box"><strong>Billing Notes:</strong> ${billNotes}</div>` : ""}
      <div class="footer">
        Cura Clinical Management · ${facility} · Dr. ${docName} · ${invNumRef.current}<br>
        Generated on ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })} · This is a computer-generated invoice
      </div>
      </body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); setPrinting(false); }, 600);
    showToast("Print dialog opened");
  };

  // ── Manual mark as paid ───────────────────────────────────────────────────
  const markPaidManually = async () => {
    try {
      await fetch(`${BOT_URL}/invoice-paid`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          invoiceNum:  invNumRef.current,
          patientName: patName,
          phone:       patPhone,
          total,
          doctorId:    doctor?.id,
          hospitalId:  doctor?.hospital_id,
        }),
      });
    } catch (_) { /* best-effort */ }
    setInvoiceStatus("paid");
    setPayStatus("Paid");
    setPaidAt(new Date().toLocaleTimeString());
    if (pollRef.current) { clearInterval(pollRef.current); setPolling(false); }
    showToast("Invoice marked as paid ✓", "success");
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              position: "fixed", bottom: 28, right: 28, zIndex: 9999,
              background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)",
              borderRadius: 16, padding: "14px 20px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
              borderLeft: `3px solid ${toast.type === "error" ? "#EF4444" : toast.type === "info" ? "#3B82F6" : "#10B981"}`,
              display: "flex", alignItems: "center", gap: 12, maxWidth: 360,
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: toast.type === "error" ? "#FEF2F2" : toast.type === "info" ? "#EFF6FF" : "#ECFDF5",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: toast.type === "error" ? "#EF4444" : toast.type === "info" ? "#3B82F6" : "#10B981",
            }}>
              {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", lineHeight: 1.4 }}>{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INVOICE STATUS BANNER (shows after sending) ──────────────────── */}
      <AnimatePresence>
        {invoiceStatus !== "draft" && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginBottom: 18,
              background: invoiceStatus === "paid"
                ? "linear-gradient(135deg, #ECFDF5, #D1FAE5)"
                : "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
              border: `1.5px solid ${invoiceStatus === "paid" ? "#6EE7B7" : "#BFDBFE"}`,
              borderRadius: 20, padding: "16px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              flexWrap: "wrap",
              boxShadow: invoiceStatus === "paid"
                ? "0 4px 20px rgba(16,185,129,0.12)"
                : "0 4px 20px rgba(59,130,246,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                background: invoiceStatus === "paid" ? "#ECFDF5" : "#EFF6FF",
                border: `1.5px solid ${invoiceStatus === "paid" ? "#6EE7B7" : "#BFDBFE"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>
                {invoiceStatus === "paid" ? "💰" : invoiceStatus === "sent" ? "📤" : "⏳"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <InvoiceStatusBadge status={invoiceStatus} />
                  {polling && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw size={11} color="#3B82F6" />
                      </motion.div>
                      <span style={{ fontSize: 10, color: "#3B82F6", fontWeight: 700 }}>Watching for payment…</span>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>
                  {invoiceStatus === "paid"
                    ? `Payment received at ${paidAt} — invoice closed ✓`
                    : `Sent to ${patName} at ${sentAt} · Invoice ${invNumRef.current}`}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {invoiceStatus !== "paid" && (
                <motion.button
                  onClick={markPaidManually}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", background: "#10B981", color: "white",
                    border: "none", borderRadius: 10, cursor: "pointer",
                    fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 10,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    boxShadow: "0 4px 12px rgba(16,185,129,0.30)",
                  }}
                >
                  <CheckCheck size={12} /> Mark Paid
                </motion.button>
              )}
              <motion.button
                onClick={clearInvoice}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: "8px 14px", background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10, cursor: "pointer",
                  fontSize: 10, fontWeight: 800, color: "#64748B",
                  fontFamily: "'Syne', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em",
                }}
              >
                New Invoice
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 1: Patient Details ───────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ ...styles.card, marginBottom: 18 }}>
        <div style={styles.cardHead}>
          <div>
            <h3 style={styles.cardTitle}>Patient Details</h3>
            <p style={styles.cardSub}>Search from your appointments or fill in manually</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <InvoiceStatusBadge status={invoiceStatus} />
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 999,
              background: "rgba(20,61,48,0.06)", border: "1px solid rgba(20,61,48,0.12)",
            }}>
              <Hash size={10} color={PRIMARY} />
              <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "'Syne', sans-serif", color: PRIMARY, letterSpacing: "0.1em" }}>
                {invNumRef.current}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.cardBody}>
          <div style={{ marginBottom: 16, position: "relative", zIndex: 100 }}>
            <PatientSearchBox appointments={appointments} onSelect={handlePatientSelect} selected={selectedPatient} />
          </div>

          <AnimatePresence>
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 14, marginBottom: 16,
                  background: "rgba(20,61,48,0.06)", border: "1.5px solid rgba(20,61,48,0.15)",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: 16, fontWeight: 900, fontFamily: "'Syne', sans-serif",
                  boxShadow: "0 4px 12px rgba(20,61,48,0.28)", flexShrink: 0,
                }}>
                  {selectedPatient.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 15, color: "#0F172A" }}>
                    {selectedPatient.name}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      {selectedPatient.phone?.includes("@") ? <Mail size={9} /> : <Phone size={9} />} {selectedPatient.phone?.replace(/^web_/, "")}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                      {selectedPatient.dates?.length} visit{selectedPatient.dates?.length !== 1 ? "s" : ""} recorded
                    </span>
                  </div>
                </div>
                <div style={{
                  background: "#ECFDF5", color: "#059669",
                  borderRadius: 8, padding: "4px 10px",
                  fontSize: 10, fontWeight: 900, fontFamily: "'Syne', sans-serif",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  ✓ Auto-filled
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={styles.fieldLabel}>Patient name</label>
              <input style={styles.inputF} value={patName} onChange={e => setPatName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label style={styles.fieldLabel}>Phone</label>
              <input style={styles.inputF} value={patPhone} onChange={e => setPatPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label style={styles.fieldLabel}>Patient ID</label>
              <input style={styles.inputF} value={patId} onChange={e => setPatId(e.target.value)} placeholder="P-0000" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={styles.fieldLabel}>Visit date</label>
              <input style={styles.inputF} type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
            </div>
            <div>
              <label style={styles.fieldLabel}>Due date</label>
              <input style={styles.inputF} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label style={styles.fieldLabel}>Doctor</label>
              <input
                style={styles.inputF}
                value={docName}
                onChange={e => { docNameEditedRef.current = true; setDocName(e.target.value); }}
                placeholder="Dr. Name"
              />
            </div>
            <div>
              <label style={styles.fieldLabel}>Facility</label>
              <input style={styles.inputF} value={facility} onChange={e => setFacility(e.target.value)} placeholder="Clinic / Hospital" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION 2: Catalog + Line Items (left) / Summary + Actions (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Service Catalog */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={styles.card}>
            <div style={styles.cardHead}>
              <div>
                <h3 style={styles.cardTitle}>Service Catalog</h3>
                <p style={styles.cardSub}>Click any service to add it to the invoice</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 900, fontFamily: "'Syne', sans-serif",
                color: "#10B981", letterSpacing: "0.08em", textTransform: "uppercase",
                background: "#ECFDF5", padding: "4px 10px", borderRadius: 20, border: "1px solid #A7F3D0",
              }}>
                {items.length} selected
              </span>
            </div>
            <div style={styles.cardBody}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {Object.keys(CATALOG).map(cat => (
                  <motion.button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 14px", borderRadius: 999,
                      border: activeCategory === cat ? "none" : "1px solid rgba(20,61,48,0.12)",
                      background: activeCategory === cat ? PRIMARY : "rgba(255,255,255,0.7)",
                      color: activeCategory === cat ? "white" : "#64748B",
                      fontSize: 11, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                      textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
                      boxShadow: activeCategory === cat ? "0 4px 14px rgba(20,61,48,0.28)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <span>{CAT_ICONS[cat]}</span> {cat}
                  </motion.button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                {CATALOG[activeCategory].map((svc, i) => (
                  <ServiceChip
                    key={i} service={svc} category={activeCategory} index={i}
                    isAdded={isAdded(activeCategory, i)}
                    onAdd={() => addCatalogItem(activeCategory, i)}
                  />
                ))}
              </div>

              <div style={{ marginTop: 14, borderTop: "1px solid rgba(20,61,48,0.06)", paddingTop: 14 }}>
                <motion.button
                  onClick={() => setShowCustom(v => !v)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 16px", borderRadius: 12,
                    border: "1px dashed rgba(20,61,48,0.25)", background: "rgba(20,61,48,0.03)",
                    color: PRIMARY, fontSize: 11, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                    textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >
                  <Plus size={13} />
                  {showCustom ? "Cancel custom item" : "Add custom item / charge"}
                </motion.button>

                <AnimatePresence>
                  {showCustom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ marginTop: 12, padding: 16, background: "rgba(20,61,48,0.04)", borderRadius: 14, border: "1px dashed rgba(20,61,48,0.15)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={styles.fieldLabel}>Description</label>
                            <input style={styles.inputF} value={custDesc} onChange={e => setCustDesc(e.target.value)} placeholder="Service / item description" />
                          </div>
                          <div>
                            <label style={styles.fieldLabel}>Category</label>
                            <select style={{ ...styles.inputF, appearance: "none" }} value={custCategory} onChange={e => setCustCategory(e.target.value)}>
                              {Object.keys(CATALOG).map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label style={styles.fieldLabel}>Price ($)</label>
                            <input style={styles.inputF} type="number" value={custPrice} onChange={e => setCustPrice(e.target.value)} placeholder="0" min="0" />
                          </div>
                        </div>
                        <motion.button
                          onClick={addCustomItem} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "9px 18px", background: PRIMARY, color: "white",
                            borderRadius: 10, border: "none", cursor: "pointer",
                            fontSize: 10, fontWeight: 900, fontFamily: "'Syne', sans-serif",
                            textTransform: "uppercase", letterSpacing: "0.1em",
                            boxShadow: "0 4px 14px rgba(20,61,48,0.28)",
                          }}
                        >
                          <Plus size={12} /> Add to Invoice
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Line Items */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={styles.card}>
            <div style={styles.cardHead}>
              <div>
                <h3 style={styles.cardTitle}>Invoice Line Items</h3>
                <p style={styles.cardSub}>{items.length} service{items.length !== 1 ? "s" : ""} added</p>
              </div>
              {items.length > 0 && (
                <motion.button
                  onClick={clearInvoice} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 8, border: "1px solid #FECACA",
                    background: "#FFF5F5", color: "#EF4444", fontSize: 10, fontWeight: 800,
                    fontFamily: "'Syne', sans-serif", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
                  }}
                >
                  <Trash2 size={11} /> Clear
                </motion.button>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <FileText size={36} color="#E2E8F0" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", fontFamily: "'Syne', sans-serif", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  No services added yet
                </p>
                <p style={{ fontSize: 12, color: "#CBD5E1", marginTop: 6 }}>Select from the catalog above</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(20,61,48,0.08)", background: "rgba(20,61,48,0.02)" }}>
                      {["Description", "Category", "Qty", "Unit Price", "Total", ""].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px",
                          textAlign: h === "Qty" || h === "Unit Price" || h === "Total" ? "center" : "left",
                          fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.15em", textTransform: "uppercase",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <motion.tbody variants={stagger} initial="hidden" animate="show">
                    {items.map(it => (
                      <motion.tr
                        key={it.key} variants={fadeUp}
                        style={{ borderBottom: "1px solid rgba(20,61,48,0.05)", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(20,61,48,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <p style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>{it.desc}</p>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: PRIMARY, background: "rgba(20,61,48,0.08)", padding: "3px 8px", borderRadius: 6 }}>
                            {it.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => changeQty(it.key, -1)}
                              style={{ width: 24, height: 24, borderRadius: 7, border: "1px solid rgba(20,61,48,0.15)", background: "rgba(20,61,48,0.05)", color: PRIMARY, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Minus size={11} />
                            </motion.button>
                            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 14, color: "#0F172A", minWidth: 20, textAlign: "center" }}>
                              {it.qty}
                            </span>
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => changeQty(it.key, 1)}
                              style={{ width: 24, height: 24, borderRadius: 7, border: "1px solid rgba(20,61,48,0.15)", background: "rgba(20,61,48,0.05)", color: PRIMARY, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Plus size={11} />
                            </motion.button>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#64748B", fontWeight: 600 }}>{fmt(it.price)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "center", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 14, color: PRIMARY }}>{fmt(it.price * it.qty)}</td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeItem(it.key)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#CBD5E1", display: "flex", padding: 4, borderRadius: 6 }}>
                            <Trash2 size={14} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            )}

            <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(20,61,48,0.06)" }}>
              <label style={styles.fieldLabel}>Billing notes (optional)</label>
              <textarea
                value={billNotes} onChange={e => setBillNotes(e.target.value)}
                placeholder="e.g. Insurance claim #CLM-90128 in process. Please contact billing for payment plans…"
                rows={2}
                style={{ ...styles.inputF, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Summary + Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

          {/* Payment Summary */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={styles.card}>
            <div style={styles.cardHead}>
              <h3 style={styles.cardTitle}>Payment Summary</h3>
              {invoiceStatus !== "draft" && <InvoiceStatusBadge status={invoiceStatus} />}
            </div>
            <div style={styles.cardBody}>
              <div style={styles.sumRow}>
                <span style={styles.sumLabel}>Subtotal</span>
                <span style={styles.sumVal}>{fmt(subtotal)}</span>
              </div>

              <div style={{ ...styles.sumRow, alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setTaxOn(v => !v)}
                    style={{ width: 36, height: 20, borderRadius: 10, background: taxOn ? PRIMARY : "#E2E8F0", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                    aria-label="Toggle tax"
                  >
                    <span style={{ position: "absolute", top: 2, left: taxOn ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </button>
                  <span style={styles.sumLabel}>GST / Tax (5%)</span>
                </div>
                <span style={{ ...styles.sumVal, color: taxOn ? "#0F172A" : "#CBD5E1" }}>{fmt(tax)}</span>
              </div>

              <div style={{ ...styles.sumRow, alignItems: "center" }}>
                <span style={styles.sumLabel}>Insurance adj. ($)</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>-$</span>
                  <input type="number" value={insAdj} onChange={e => setInsAdj(e.target.value)} placeholder="0" min="0"
                    style={{ width: 80, padding: "5px 8px", border: "1px solid rgba(20,61,48,0.15)", borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "right", fontFamily: "inherit", color: "#0F172A", background: "rgba(255,255,255,0.8)" }} />
                </div>
              </div>

              <div style={{ ...styles.sumRow, alignItems: "center" }}>
                <span style={styles.sumLabel}>Discount ($)</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>-$</span>
                  <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" min="0"
                    style={{ width: 80, padding: "5px 8px", border: "1px solid rgba(20,61,48,0.15)", borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "right", fontFamily: "inherit", color: "#0F172A", background: "rgba(255,255,255,0.8)" }} />
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(20,61,48,0.08)", margin: "10px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Total Due</span>
                <motion.span
                  key={total} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 26, fontFamily: "'Syne', sans-serif", fontWeight: 900, color: PRIMARY, letterSpacing: "-0.03em" }}
                >
                  {fmt(total)}
                </motion.span>
              </div>

              <div style={{ height: 1, background: "rgba(20,61,48,0.06)", margin: "14px 0" }} />

              <div style={{ marginBottom: 12 }}>
                <label style={styles.fieldLabel}>Payment status</label>
                <select value={payStatus} onChange={e => setPayStatus(e.target.value)} style={{ ...styles.inputF, appearance: "none", cursor: "pointer" }}>
                  <option value="Pending">⏳ Pending</option>
                  <option value="Paid">✅ Paid</option>
                  <option value="Partial">💳 Partial Payment</option>
                  <option value="Insurance">🏥 Insurance Processing</option>
                  <option value="Overdue">🔴 Overdue</option>
                </select>
              </div>

              <div>
                <label style={styles.fieldLabel}>Insurance provider</label>
                <input style={styles.inputF} value={insProvider} onChange={e => setInsProvider(e.target.value)} placeholder="e.g. BlueCross Platinum" />
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" style={styles.card}>
            <div style={styles.cardHead}>
              <h3 style={styles.cardTitle}>Send Invoice</h3>
            </div>
            <div style={{ ...styles.cardBody, display: "flex", flexDirection: "column", gap: 10 }}>

              {/* PRIMARY: Send via Bot with PDF + Pay Now */}
              <motion.button
                onClick={sendViaBot}
                disabled={sending || invoiceStatus === "paid"}
                whileHover={!sending && invoiceStatus !== "paid" ? { scale: 1.02, y: -2 } : {}}
                whileTap={!sending && invoiceStatus !== "paid" ? { scale: 0.97 } : {}}
                style={{
                  width: "100%", padding: "15px",
                  background: invoiceStatus === "paid"
                    ? "#ECFDF5"
                    : "linear-gradient(135deg, #25D366, #1DA851)",
                  color: invoiceStatus === "paid" ? "#059669" : "white",
                  border: invoiceStatus === "paid" ? "1.5px solid #6EE7B7" : "none",
                  borderRadius: 14, cursor: invoiceStatus === "paid" ? "default" : "pointer",
                  fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 12,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: invoiceStatus !== "paid" ? "0 8px 24px rgba(37,211,102,0.35)" : "none",
                  opacity: sending ? 0.7 : 1,
                  transition: "all 0.3s",
                }}
              >
                {sending ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCw size={15} />
                    </motion.div>
                    Sending…
                  </>
                ) : invoiceStatus === "paid" ? (
                  <><CheckCheck size={15} /> Invoice Paid ✓</>
                ) : (
                  <><MessageCircle size={15} /> Send to Patient</>
                )}
              </motion.button>

              {/* SECONDARY: Print */}
              <motion.button
                onClick={printInvoice}
                disabled={printing}
                whileHover={!printing ? { scale: 1.02, y: -1 } : {}}
                whileTap={!printing ? { scale: 0.97 } : {}}
                style={{
                  width: "100%", padding: "13px",
                  background: PRIMARY, color: "white", border: "none", borderRadius: 14,
                  cursor: printing ? "default" : "pointer",
                  fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 12,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: "0 6px 20px rgba(20,61,48,0.30)", opacity: printing ? 0.7 : 1,
                }}
              >
                <Printer size={15} />
                {printing ? "Opening…" : "Print / Save PDF"}
              </motion.button>

              {/* Info panel */}
              {items.length > 0 && (
                <div style={{
                  background: "rgba(20,61,48,0.04)", borderRadius: 12, padding: "12px 14px",
                  border: "1px solid rgba(20,61,48,0.08)",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
                    Invoice summary
                  </p>
                  {[
                    { label: "Services", val: items.length },
                    { label: "Patient",  val: patName || "—" },
                    { label: "Total",    val: fmt(total) },
                    { label: "Status",   val: payStatus },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#64748B", fontWeight: 500 }}>{row.label}</span>
                      <span style={{ color: "#0F172A", fontWeight: 700 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Polling indicator */}
              {polling && (
                <div style={{
                  display: "flex", gap: 8, alignItems: "center",
                  padding: "10px 12px", borderRadius: 10,
                  background: "#EFF6FF", border: "1px solid #BFDBFE",
                }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Wifi size={13} color="#3B82F6" />
                  </motion.div>
                  <p style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600, lineHeight: 1.5 }}>
                    Watching for payment from {patName}…
                  </p>
                </div>
              )}

              {/* Warning if no phone */}
              {!patPhone && (
                <div style={{
                  display: "flex", gap: 8, alignItems: "flex-start",
                  padding: "10px 12px", borderRadius: 10,
                  background: "#FFFBEB", border: "1px solid #FDE68A",
                }}>
                  <AlertCircle size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: "#D97706", fontWeight: 600, lineHeight: 1.5 }}>
                    Select a patient above to enable Bot sending
                  </p>
                </div>
              )}

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

// ── SHARED STYLES ────────────────────────────────────────────────────────────
const styles = {
  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(20,61,48,0.08)",
    borderRadius: 24, overflow: "hidden",
    boxShadow: "0 4px 24px rgba(20,61,48,0.06)",
  },
  cardHead: {
    padding: "16px 22px", borderBottom: "1px solid rgba(20,61,48,0.06)",
    background: "rgba(248,250,249,0.8)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 15,
    color: "#0F172A", letterSpacing: "-0.02em",
  },
  cardSub:    { fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 2 },
  cardBody:   { padding: "18px 22px" },
  fieldLabel: {
    fontSize: 10, fontWeight: 700, color: "#94A3B8",
    letterSpacing: "0.15em", textTransform: "uppercase",
    marginBottom: 6, display: "block",
  },
  inputF: {
    width: "100%", padding: "9px 12px",
    border: "1px solid rgba(20,61,48,0.12)", borderRadius: 10,
    fontSize: 13, color: "#0F172A", background: "rgba(255,255,255,0.8)",
    fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  sumRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" },
  sumLabel: { fontSize: 12, color: "#64748B", fontWeight: 600 },
  sumVal:   { fontSize: 13, fontWeight: 700, color: "#0F172A" },
};