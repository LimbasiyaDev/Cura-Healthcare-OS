"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  ArrowLeft, Search, Plus, Edit2, X, Check, Shield, RefreshCw,
  Building2, Stethoscope, Calendar, Users, Clock, ChevronRight,
  MessageSquare, MapPin, Phone, Mail, AlertCircle, CheckCircle,
  Activity, Zap, Globe, Lock, Eye, EyeOff,
} from "lucide-react";

/* ─── SUPABASE + CONSTANTS ───────────────────────────────────────────────────── */
// BUG FIX #7: Removed hardcoded credential fallbacks — env vars are required
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";
const PRIMARY = "#143D30";
const PRIMARY_MID = "#1C5240";

const DEPARTMENTS = [
  "Cardiology","Dentistry","General Medicine","Surgery",
  "Orthopedics","Pediatrics","Gynecology","Dermatology",
  "Ophthalmology","ENT","Neurology","Psychiatry",
  "Radiology","Pathology","Physiotherapy",
];

const TABS = ["Hospitals","Doctors","Historical"];

const EMPTY_HOSPITAL_FORM = {
  name:"", address:"", whatsapp_phone_number_id:"", whatsapp_token:"",
};
const EMPTY_DOC = {
  name:"", department:"", email:"", phone:"", room:"",
  working_hours:"09:00 AM - 07:00 PM", slot_duration:20,
  hospital_id:"", newHospitalName:"", newHospitalAddress:"", useNewHospital:false,
};

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function navigateWithRelogin(destination, router) {
  await supabase.auth.signOut();
  sessionStorage.setItem("loginRedirect", destination);
  router.push("/login");
}

/* ─── SPRING CONFIG ─────────────────────────────────────────────────────────── */
const spring = { type: "spring", stiffness: 380, damping: 32 };
const springFast = { type: "spring", stiffness: 500, damping: 40 };
const springBounce = { type: "spring", stiffness: 320, damping: 24 };

/* ─── ANIMATED COUNTER HOOK ──────────────────────────────────────────────────── */
function useCounter(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    let start = 0;
    const steps = Math.max(1, Math.floor(duration / 16));
    const inc = target / steps;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      start += inc;
      if (frame >= steps) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── 3D TILT CARD ───────────────────────────────────────────────────────────── */
function TiltCard({ children, className, style, disabled }) {
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-60, 60], [4, -4]), springFast);
  const rotateY = useSpring(useTransform(rawX, [-60, 60], [-4, 4]), springFast);
  const scale   = useSpring(1, springFast);

  const onMove = useCallback((e) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(e.clientX - rect.left - rect.width / 2);
    rawY.set(e.clientY - rect.top - rect.height / 2);
  }, [disabled]);

  const onLeave = useCallback(() => {
    rawX.set(0); rawY.set(0); scale.set(1);
  }, []);

  const onEnter = useCallback(() => {
    if (!disabled) scale.set(1.01);
  }, [disabled]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, scale, transformStyle:"preserve-3d", ...style }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────────────────────────── */
function StatCard({ label, val, sub, accent, icon: Icon, delay = 0 }) {
  const count = useCounter(val);
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springBounce, delay }}
      className="pstat-card"
      style={{ borderLeft: `3px solid ${accent}` }}
      whileHover={{ y: -6, boxShadow: "0 28px 64px rgba(20,61,48,0.16), 0 6px 16px rgba(0,0,0,0.06)" }}
    >
      <div style={{
        position:"absolute", top:-30, right:-20,
        width:90, height:90, borderRadius:"50%",
        background:`radial-gradient(circle, ${accent}30, transparent 70%)`,
        pointerEvents:"none",
      }} />
      <div style={{ position:"absolute", inset:0, borderRadius:"1.5rem", background:"linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)", pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <p className="section-label">{label}</p>
        {Icon && (
          <div style={{ width:32, height:32, borderRadius:10, background:`${accent}18`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon size={14} color={accent} />
          </div>
        )}
      </div>
      <motion.p
        key={count}
        initial={{ opacity:0, y:8 }}
        animate={{ opacity:1, y:0 }}
        transition={springFast}
        style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:44, lineHeight:1, color:"#0F172A", marginBottom:6, letterSpacing:"-0.02em" }}
      >
        {count}
      </motion.p>
      <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, letterSpacing:"0.01em" }}>{sub}</p>
    </motion.div>
  );
}

/* ─── FIELD LABEL ────────────────────────────────────────────────────────────── */
function FieldLabel({ children, optional }) {
  return (
    <label className="field-label">
      {children}
      {optional && <span style={{ textTransform:"none", letterSpacing:0, fontWeight:600, color:"#CBD5E1", marginLeft:6 }}>(optional)</span>}
    </label>
  );
}

/* ─── STATUS BANNER ──────────────────────────────────────────────────────────── */
function StatusBanner({ status }) {
  if (!status) return null;
  const cfg = {
    success: { bg:"#ECFDF5", text:"#065F46", border:"#A7F3D0", Icon:CheckCircle },
    warning: { bg:"#FFFBEB", text:"#92400E", border:"#FDE68A", Icon:AlertCircle },
    error:   { bg:"#FEF2F2", text:"#991B1B", border:"#FECACA", Icon:AlertCircle },
  }[status.type] || {};
  return (
    <motion.div
      initial={{ opacity:0, y:-8, scale:0.97 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, scale:0.96 }}
      transition={springFast}
      style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px", borderRadius:16, background:cfg.bg, border:`1px solid ${cfg.border}`, marginBottom:20 }}
    >
      {cfg.Icon && <cfg.Icon size={15} color={cfg.text} style={{ flexShrink:0, marginTop:1 }} />}
      <p style={{ fontSize:12, fontWeight:700, color:cfg.text, lineHeight:1.5 }}>{status.msg}</p>
    </motion.div>
  );
}

/* ─── PREMIUM INPUT ──────────────────────────────────────────────────────────── */
function PInput({ label, optional, hint, type="text", ...props }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      {label && <FieldLabel optional={optional}>{label}</FieldLabel>}
      <div style={{ position:"relative" }}>
        <input
          {...props}
          type={isPassword ? (show ? "text" : "password") : type}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className="input-premium"
          style={{
            borderColor: focused ? PRIMARY : "rgba(20,61,48,0.08)",
            boxShadow: focused ? `0 0 0 4px rgba(20,61,48,0.08)` : "0 1px 2px rgba(0,0,0,0.04) inset",
            paddingRight: isPassword ? "3rem" : undefined,
            transition:"all 200ms ease",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s=>!s)}
            style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:4 }}>
            {show ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize:10, color:"#94A3B8", fontWeight:600, marginTop:6, marginLeft:2 }}>{hint}</p>}
    </div>
  );
}

/* ─── PREMIUM SELECT ─────────────────────────────────────────────────────────── */
function PSelect({ label, optional, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <FieldLabel optional={optional}>{label}</FieldLabel>}
      <div style={{ position:"relative" }}>
        <select
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className="input-premium"
          style={{
            appearance:"none", WebkitAppearance:"none",
            borderColor: focused ? PRIMARY : "rgba(20,61,48,0.08)",
            boxShadow: focused ? `0 0 0 4px rgba(20,61,48,0.08)` : "0 1px 2px rgba(0,0,0,0.04) inset",
            cursor:"pointer",
            transition:"all 200ms ease",
          }}
        >
          {children}
        </select>
        <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#94A3B8" }}>
          <ChevronRight size={14} style={{ transform:"rotate(90deg)" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── PREMIUM TOGGLE ─────────────────────────────────────────────────────────── */
function PToggle({ checked, onChange }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      animate={{ backgroundColor: checked ? PRIMARY : "#E2E8F0" }}
      transition={{ duration: 0.25 }}
      style={{ width:46, height:26, borderRadius:999, position:"relative", border:"none", cursor:"pointer", padding:0, flexShrink:0 }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 0 }}
        transition={spring}
        style={{ position:"absolute", top:3, left:3, width:20, height:20, borderRadius:"50%", background:"white", boxShadow:"0 2px 6px rgba(0,0,0,0.2)" }}
      />
    </motion.button>
  );
}

/* ─── CLOSE BUTTON ───────────────────────────────────────────────────────────── */
function CloseBtn({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale:1.1, rotate:90 }}
      whileTap={{ scale:0.9 }}
      transition={springFast}
      style={{ width:36, height:36, borderRadius:999, background:"rgba(20,61,48,0.06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8" }}
    >
      <X size={15} />
    </motion.button>
  );
}

/* ─── MODAL WRAPPER ──────────────────────────────────────────────────────────── */
function ModalWrap({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.22 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position:"fixed", inset:0,
        background:"rgba(10,34,24,0.45)",
        backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:100, padding:"1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity:0, y:40, scale:0.94 }}
        animate={{ opacity:1, y:0, scale:1 }}
        exit={{ opacity:0, y:24, scale:0.96 }}
        transition={springBounce}
        className="premium-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                                       */
/* ─────────────────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();

  /* core state ──────────────────────────────────────────────────────────────── */
  const [doctors, setDoctors]           = useState([]);
  const [search, setSearch]             = useState("");
  const [activeTab, setActiveTab]       = useState("Hospitals");
  const [appointments, setAppointments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayStats, setTodayStats]     = useState({ load:0, pending:0 });

  /* hospital management ─────────────────────────────────────────────────────── */
  const [hospitals, setHospitals]           = useState([]);
  const [activeHospital, setActiveHospital] = useState(null);
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [hospitalForm, setHospitalForm]     = useState(EMPTY_HOSPITAL_FORM);
  const [hospitalStatus, setHospitalStatus] = useState(null);
  const [isSavingHospital, setIsSavingHospital] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [editForm, setEditForm]             = useState(EMPTY_HOSPITAL_FORM);
  const [isSavingEdit, setIsSavingEdit]     = useState(false);
  const [editStatus, setEditStatus]         = useState(null);

  /* doctor onboarding ───────────────────────────────────────────────────────── */
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardStatus, setOnboardStatus] = useState(null);
  const [newDoc, setNewDoc]             = useState(EMPTY_DOC);

  /* effects ─────────────────────────────────────────────────────────────────── */
  useEffect(() => { fetchHospitals(); }, []);
  useEffect(() => { if (activeHospital) { fetchDoctors(); fetchTodayStats(); } }, [activeHospital]);
  useEffect(() => { if (activeTab === "Historical" && activeHospital) fetchHistory(); }, [activeTab, activeHospital]);

  /* data fetchers ───────────────────────────────────────────────────────────── */
  async function fetchHospitals() {
    const { data } = await supabase.from("hospitals").select("*").order("name");
    setHospitals(data || []);
    if (data && data.length > 0) {
      // BUG FIX #14: Always re-sync activeHospital after fetch (was only set when null)
      setActiveHospital(prev => {
        if (!prev) return data[0];
        const updated = data.find(h => h.id === prev.id);
        return updated || data[0];
      });
    }
  }

  async function fetchDoctors() {
    if (!activeHospital) return;
    const { data } = await supabase.from("doctors").select("*").eq("hospital_id", activeHospital.id).order("name");
    setDoctors(data || []);
  }

  async function fetchHistory() {
    if (!activeHospital) return;
    setLoadingHistory(true);
    const { data } = await supabase.from("appointments").select("*, doctors(name, department)")
      .eq("hospital_id", activeHospital.id).order("created_at", { ascending:false }).limit(100);
    setAppointments(data || []);
    setLoadingHistory(false);
  }

  async function fetchTodayStats() {
    if (!activeHospital) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("appointments").select("status, date")
      .eq("hospital_id", activeHospital.id).eq("date", today);
    setTodayStats({ load: data?.length || 0, pending: data?.filter(a=>a.status==="pending").length || 0 });
  }

  async function toggleDoctor(id, current) {
    await supabase.from("doctors").update({ is_available: !current }).eq("id", id);
    fetchDoctors();
  }

  /* add hospital ────────────────────────────────────────────────────────────── */
  async function handleSaveHospital() {
    if (!hospitalForm.name.trim()) {
      setHospitalStatus({ type:"error", msg:"Hospital name is required." });
      return;
    }
    setIsSavingHospital(true);
    setHospitalStatus(null);
    try {
      const { data } = await axios.post(`${BOT_API_URL}/create-hospital`, {
        name: hospitalForm.name.trim(),
        address: hospitalForm.address.trim() || null,
        whatsapp_phone_number_id: hospitalForm.whatsapp_phone_number_id.trim() || null,
        whatsapp_token: hospitalForm.whatsapp_token.trim() || null,
      });
      setHospitalStatus({ type:"success", msg:`${hospitalForm.name} added successfully!` });
      setHospitalForm(EMPTY_HOSPITAL_FORM);
      await fetchHospitals();
      if (data?.hospital) setActiveHospital(data.hospital);
      setTimeout(() => setIsHospitalModalOpen(false), 1200);
    } catch (err) {
      setHospitalStatus({ type:"error", msg: err.response?.data?.error || err.message });
    }
    setIsSavingHospital(false);
  }

  /* edit hospital ───────────────────────────────────────────────────────────── */
  function startEditHospital(h) {
    setEditingHospital(h);
    setEditForm({ name:h.name||"", address:h.address||"", whatsapp_phone_number_id:h.whatsapp_phone_number_id||"", whatsapp_token:"" });
    setEditStatus(null);
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim()) {
      setEditStatus({ type:"error", msg:"Hospital name is required." }); return;
    }
    setIsSavingEdit(true); setEditStatus(null);
    try {
      const payload = { id:editingHospital.id, name:editForm.name.trim(), address:editForm.address.trim()||null, whatsapp_phone_number_id:editForm.whatsapp_phone_number_id.trim()||null };
      if (editForm.whatsapp_token.trim()) payload.whatsapp_token = editForm.whatsapp_token.trim();
      await axios.post(`${BOT_API_URL}/update-hospital`, payload);
      setEditStatus({ type:"success", msg:"Saved!" });
      await fetchHospitals(); // BUG FIX #14: fetchHospitals now re-syncs activeHospital
      setTimeout(() => { setEditingHospital(null); setEditStatus(null); }, 1000);
    } catch (err) {
      setEditStatus({ type:"error", msg: err.response?.data?.error || err.message });
    }
    setIsSavingEdit(false);
  }

  /* onboard doctor ──────────────────────────────────────────────────────────── */
  async function handleOnboardDoctor() {
    if (!newDoc.name || !newDoc.email || !newDoc.phone || !newDoc.department) {
      setOnboardStatus({ type:"error", msg:"Name, email, phone, and department are required." }); return;
    }
    if (!/^\d{10,15}$/.test(newDoc.phone.replace(/\D/g,""))) {
      setOnboardStatus({ type:"error", msg:"Enter a valid phone number (10-15 digits)." }); return;
    }
    let targetHospitalId = newDoc.hospital_id;
    if (newDoc.useNewHospital) {
      if (!newDoc.newHospitalName.trim()) {
        setOnboardStatus({ type:"error", msg:"Please enter the new hospital name." }); return;
      }
      try {
        const { data:newHosp } = await axios.post(`${BOT_API_URL}/create-hospital`, {
          name: newDoc.newHospitalName.trim(), address: newDoc.newHospitalAddress.trim() || null,
        });
        targetHospitalId = newHosp?.hospital?.id;
        await fetchHospitals();
        setActiveHospital(newHosp?.hospital);
      } catch (err) {
        setOnboardStatus({ type:"error", msg:"Failed to create new hospital: " + err.message }); return;
      }
    }
    if (!targetHospitalId) {
      setOnboardStatus({ type:"error", msg:"Please select or create a hospital for this doctor." }); return;
    }
    setIsOnboarding(true); setOnboardStatus(null);
    const tempPassword = generateTempPassword();
    try {
      let userId = null;
      try {
        const { data } = await axios.post(`${BOT_API_URL}/create-doctor-auth`, { email:newDoc.email, tempPassword });
        userId = data?.userId;
      } catch (authErr) {
        throw new Error(`Auth Error: ${authErr.response?.data?.error || authErr.message}`);
      }
      if (!userId) throw new Error("Auth Error: Could not retrieve user ID.");
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newDoc.name)}`;
      const { error:dbError } = await supabase.from("doctors").insert([{
        user_id:userId, name:newDoc.name, department:newDoc.department, email:newDoc.email,
        phone:newDoc.phone.replace(/\D/g,""), room:newDoc.room||null, avatar_url:avatarUrl,
        is_available:true, requires_age:false, requires_reason:false,
        working_hours:newDoc.working_hours, slot_duration:parseInt(newDoc.slot_duration),
        first_login:true, hospital_id:targetHospitalId,
      }]);
      if (dbError) throw new Error(`DB Error: ${dbError.message}`);
      try {
        await axios.post(`${BOT_API_URL}/notify-doctor-onboarded`, {
          phone:newDoc.phone.replace(/\D/g,""), name:newDoc.name, email:newDoc.email, tempPassword, hospitalId:targetHospitalId,
        });
      } catch (_) {
        setOnboardStatus({ type:"warning", msg:`Dr. ${newDoc.name} onboarded! WhatsApp failed — share credentials manually: ${tempPassword}` });
        setIsOnboarding(false); fetchDoctors(); resetDocForm(); return;
      }
      setOnboardStatus({ type:"success", msg:`Dr. ${newDoc.name} onboarded! Login credentials sent to WhatsApp.` });
      resetDocForm(); fetchDoctors();
    } catch (err) {
      setOnboardStatus({ type:"error", msg:err.message });
    }
    setIsOnboarding(false);
  }

  function resetDocForm() {
    setNewDoc({ ...EMPTY_DOC, hospital_id: activeHospital?.id || "" });
  }

  /* derived ─────────────────────────────────────────────────────────────────── */
  const filtered = doctors.filter(d =>
    (d.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (d.department||"").toLowerCase().includes(search.toLowerCase()) ||
    (d.email||"").toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label:"Total Hospitals", val:hospitals.length, sub:"Under your management", accent:"#143D30", icon:Building2 },
    { label:"Pending Approvals", val:todayStats.pending, sub:"Awaiting review", accent:"#F59E0B", icon:Clock },
    { label:"Live Specialists", val:doctors.filter(d=>d.is_available).length, sub:`At ${activeHospital?.name||"—"}`, accent:"#10B981", icon:Stethoscope },
    { label:"Today's Load", val:todayStats.load, sub:"Appointments today", accent:"#6366F1", icon:Activity },
  ];

  /* tab variants ────────────────────────────────────────────────────────────── */
  const tabVariants = {
    hidden:  { opacity:0, y:16, scale:0.98 },
    visible: { opacity:1, y:0, scale:1, transition:{ ...springBounce, staggerChildren:0.06 } },
    exit:    { opacity:0, y:-12, scale:0.97, transition:{ duration:0.18 } },
  };

  const itemVariants = {
    hidden:  { opacity:0, y:12 },
    visible: { opacity:1, y:0, transition:spring },
  };

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="page-bg min-h-screen">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y:-70, opacity:0 }}
        animate={{ y:0, opacity:1 }}
        transition={{ ...spring, delay:0.05 }}
        className="glass-nav-bar sticky top-0 z-50"
        style={{ padding:"0 2.5rem", height:68, display:"flex", alignItems:"center", justifyContent:"space-between" }}
      >
        {/* Left — logo */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale:1.08 }}
            whileTap={{ scale:0.92 }}
            style={{ width:36, height:36, borderRadius:10, background:"rgba(20,61,48,0.08)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#475569" }}
          >
            <ArrowLeft size={14}/>
          </motion.button>

          {/* Logo pill */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <motion.div
              whileHover={{ rotate:[0,-8,8,0], transition:{ duration:0.4 } }}
              style={{ width:36, height:36, borderRadius:11, boxShadow:"0 4px 12px rgba(20,61,48,0.3)", overflow:"hidden" }}
            >
              <img src="/logo.jpeg" alt="Cura" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            </motion.div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16, color:"#0F172A", lineHeight:1, letterSpacing:"-0.02em" }}>Cura</p>
              <p style={{ fontSize:8, letterSpacing:"0.28em", color:"#94A3B8", fontWeight:900, textTransform:"uppercase", fontFamily:"'Syne',sans-serif", marginTop:2 }}>Master Admin</p>
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <motion.button
            onClick={() => navigateWithRelogin("/doctor", router)}
            whileHover={{ scale:1.04 }}
            whileTap={{ scale:0.96 }}
            style={{ padding:"8px 16px", borderRadius:999, fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"0.08em", textTransform:"uppercase", color:"#475569", background:"rgba(255,255,255,0.8)", border:"1px solid rgba(20,61,48,0.1)", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}
          >
            Doctor Portal <ChevronRight size={11}/>
          </motion.button>

          <motion.button
            onClick={() => { setIsModalOpen(true); setOnboardStatus(null); setNewDoc({ ...EMPTY_DOC, hospital_id:activeHospital?.id||"" }); }}
            whileHover={{ scale:1.04 }}
            whileTap={{ scale:0.96 }}
            className="btn-primary"
            style={{ borderRadius:999, padding:"9px 18px", gap:7 }}
          >
            <Plus size={13}/> Onboard Specialist
          </motion.button>
        </div>
      </motion.nav>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1240, margin:"0 auto", padding:"48px 32px" }}>

        {/* ── HOSPITAL SWITCHER ────────────────────────────────────────────── */}
        <AnimatePresence>
          {hospitals.length > 0 && (
            <motion.div
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ ...spring, delay:0.12 }}
              style={{ marginBottom:56, background:"rgba(255,255,255,0.72)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.9)", borderRadius:20, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}
            >
              <span style={{ fontSize:9, fontWeight:900, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.3em", fontFamily:"'Syne',sans-serif", marginRight:4, whiteSpace:"nowrap" }}>Active Hospital</span>

              {hospitals.map((h) => {
                const active = activeHospital?.id === h.id;
                return (
                  <motion.button
                    key={h.id}
                    onClick={() => setActiveHospital(h)}
                    whileHover={{ scale:1.04 }}
                    whileTap={{ scale:0.96 }}
                    animate={{ backgroundColor: active ? PRIMARY : "rgba(255,255,255,0.9)", color: active ? "white" : "#64748B" }}
                    transition={{ duration:0.2 }}
                    style={{ padding:"7px 14px", borderRadius:999, fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"0.06em", textTransform:"uppercase", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, boxShadow: active ? "0 4px 16px rgba(20,61,48,0.28)" : "none" }}
                  >
                    <Building2 size={11}/> {h.name}
                  </motion.button>
                );
              })}

              <motion.button
                onClick={() => { setIsHospitalModalOpen(true); setHospitalStatus(null); setHospitalForm(EMPTY_HOSPITAL_FORM); }}
                whileHover={{ scale:1.04, borderColor:"rgba(20,61,48,0.4)" }}
                whileTap={{ scale:0.96 }}
                style={{ padding:"7px 14px", borderRadius:999, fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"0.06em", textTransform:"uppercase", background:"transparent", border:"1.5px dashed rgba(20,61,48,0.2)", color:"#94A3B8", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}
              >
                <Plus size={11}/> Add
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EMPTY HOSPITALS ─────────────────────────────────────────────── */}
        {hospitals.length === 0 && (
          <motion.div
            initial={{ opacity:0, scale:0.96 }}
            animate={{ opacity:1, scale:1 }}
            transition={springBounce}
            style={{ marginBottom:48, background:"linear-gradient(135deg, #FFFBEB, #FFF8E7)", border:"1px solid #FDE68A", borderRadius:24, padding:"48px 32px", textAlign:"center" }}
          >
            <div style={{ width:64, height:64, borderRadius:20, background:"rgba(245,158,11,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <Building2 size={28} color="#D97706"/>
            </div>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#92400E", fontSize:20, marginBottom:8 }}>No hospitals yet</p>
            <p style={{ color:"#A16207", fontSize:13, fontWeight:600, marginBottom:24, maxWidth:320, margin:"0 auto 24px" }}>
              Add your first hospital to start managing doctors and appointments.
            </p>
            <motion.button
              onClick={() => { setIsHospitalModalOpen(true); setHospitalStatus(null); }}
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              className="btn-primary" style={{ borderRadius:999, gap:8 }}
            >
              <Plus size={14}/> Add First Hospital
            </motion.button>
          </motion.div>
        )}

        {/* ── STATS ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 mt-2">
          {stats.map((item, i) => <StatCard key={i} {...item} delay={i * 0.07} />)}
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ ...spring, delay:0.3 }}
          style={{ marginBottom:40 }}
        >
          <div style={{ display:"inline-flex", padding:5, borderRadius:999, background:PRIMARY, boxShadow:"0 6px 24px rgba(20,61,48,0.32)", position:"relative" }}>
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ position:"relative", padding:"8px 22px", borderRadius:999, fontSize:11, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", border:"none", background:"transparent", cursor:"pointer", color: active ? PRIMARY : "rgba(255,255,255,0.55)", zIndex:1, transition:"color 200ms" }}
                >
                  {active && (
                    <motion.div
                      layoutId="tab-pill"
                      transition={spring}
                      style={{ position:"absolute", inset:0, borderRadius:999, background:"white", boxShadow:"0 4px 16px rgba(0,0,0,0.12)", zIndex:-1 }}
                    />
                  )}
                  {tab}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ════ HOSPITALS TAB ════════════════════════════════════════════════ */}
          {activeTab === "Hospitals" && (
            <motion.div key="hospitals" variants={tabVariants} initial="hidden" animate="visible" exit="exit">

              <motion.div variants={itemVariants} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
                <div>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.02em" }}>
                    All Hospitals
                    <span style={{ marginLeft:10, fontSize:14, fontWeight:700, color:"#94A3B8" }}>({hospitals.length})</span>
                  </h2>
                </div>
                <motion.button
                  onClick={() => { setIsHospitalModalOpen(true); setHospitalStatus(null); setHospitalForm(EMPTY_HOSPITAL_FORM); }}
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  className="btn-primary" style={{ borderRadius:999, gap:7 }}
                >
                  <Plus size={13}/> Add Hospital
                </motion.button>
              </motion.div>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {hospitals.length === 0 && (
                  <motion.div variants={itemVariants} style={{ background:"rgba(255,255,255,0.6)", borderRadius:24, padding:"64px 32px", textAlign:"center" }}>
                    <Building2 size={36} color="#CBD5E1" style={{ margin:"0 auto 16px" }} />
                    <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.2em", fontSize:12 }}>No hospitals added yet</p>
                  </motion.div>
                )}

                {hospitals.map((h, i) => (
                  <motion.div key={h.id} variants={itemVariants}>

                    {/* Normal card */}
                    {editingHospital?.id !== h.id && (
                      <TiltCard className="glass-card" style={{ padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", borderLeft: activeHospital?.id===h.id ? `3px solid ${PRIMARY}` : "1px solid rgba(255,255,255,0.95)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:16, flex:1, minWidth:0, paddingRight:16 }}>
                          <motion.div
                            whileHover={{ rotate:[-2,2,-2,0], transition:{ duration:0.3 } }}
                            style={{ width:46, height:46, borderRadius:14, background:`linear-gradient(135deg, ${PRIMARY}, #226650)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(20,61,48,0.24)", flexShrink:0 }}
                          >
                            <Building2 size={18} color="white"/>
                          </motion.div>

                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#0F172A", fontSize:15, margin:0 }}>{h.name}</p>
                              {activeHospital?.id === h.id && (
                                <motion.span
                                  initial={{ scale:0 }} animate={{ scale:1 }} transition={spring}
                                  style={{ fontSize:8, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.15em", padding:"2px 8px", borderRadius:999, background:PRIMARY, color:"white" }}
                                >
                                  Active
                                </motion.span>
                              )}
                            </div>
                            {h.address && (
                              <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                                <MapPin size={10} color="#94A3B8"/>
                                <p style={{ fontSize:12, color:"#94A3B8", fontWeight:600, margin:0 }}>{h.address}</p>
                              </div>
                            )}
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                              <span style={{ fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"0.1em" }}>
                                {h.whatsapp_phone_number_id
                                  ? <span style={{ color:"#059669", display:"flex", alignItems:"center", gap:4 }}><CheckCircle size={10}/> WhatsApp configured</span>
                                  : <span style={{ color:"#D97706", display:"flex", alignItems:"center", gap:4 }}><AlertCircle size={10}/> WhatsApp not configured</span>
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ textAlign:"right", marginRight:8 }}>
                            <p style={{ fontSize:8, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.2em", color:"#94A3B8", marginBottom:2 }}>Doctors</p>
                            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, color:"#0F172A" }}>
                              {doctors.filter(d=>d.hospital_id===h.id).length}
                            </p>
                          </div>

                          <motion.button
                            onClick={() => startEditHospital(h)}
                            whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                            style={{ width:34, height:34, borderRadius:10, background:"rgba(20,61,48,0.06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#475569" }}
                          >
                            <Edit2 size={13}/>
                          </motion.button>

                          <motion.button
                            onClick={() => setActiveHospital(h)}
                            whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                            animate={{ backgroundColor: activeHospital?.id===h.id ? PRIMARY : "rgba(20,61,48,0.06)", color: activeHospital?.id===h.id ? "white" : "#475569" }}
                            transition={{ duration:0.2 }}
                            style={{ padding:"7px 16px", borderRadius:999, fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", border:"none", cursor:"pointer" }}
                          >
                            {activeHospital?.id === h.id ? "Selected" : "Switch To"}
                          </motion.button>
                        </div>
                      </TiltCard>
                    )}

                    {/* Inline edit card */}
                    {editingHospital?.id === h.id && (
                      <motion.div
                        initial={{ opacity:0, scale:0.97 }}
                        animate={{ opacity:1, scale:1 }}
                        exit={{ opacity:0 }}
                        transition={spring}
                        style={{ background:"white", borderRadius:24, padding:"28px 28px", border:`2px solid ${PRIMARY}`, boxShadow:`0 0 0 4px rgba(20,61,48,0.08)` }}
                      >
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#0F172A", fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
                            <Edit2 size={14} color={PRIMARY}/> Edit — {h.name}
                          </p>
                          <CloseBtn onClick={() => setEditingHospital(null)}/>
                        </div>

                        <AnimatePresence><StatusBanner status={editStatus}/></AnimatePresence>

                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                          <PInput label="Hospital Name *" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} placeholder="Hospital name"/>
                          <PInput label="Address" optional value={editForm.address} onChange={e=>setEditForm({...editForm,address:e.target.value})} placeholder="Street, City, State"/>
                          <PInput label="WhatsApp Phone Number ID" value={editForm.whatsapp_phone_number_id} onChange={e=>setEditForm({...editForm,whatsapp_phone_number_id:e.target.value})} placeholder="From Meta Business API"/>
                          <PInput label="WhatsApp Token" optional type="password" value={editForm.whatsapp_token} onChange={e=>setEditForm({...editForm,whatsapp_token:e.target.value})} placeholder="New token only if rotating"/>
                        </div>

                        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                          <motion.button
                            onClick={() => setEditingHospital(null)}
                            whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                            style={{ padding:"9px 20px", borderRadius:12, fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", color:"#64748B", background:"#F1F5F9", border:"none", cursor:"pointer" }}
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            onClick={handleSaveEdit} disabled={isSavingEdit}
                            whileHover={{ scale:isSavingEdit?1:1.04 }} whileTap={{ scale:isSavingEdit?1:0.96 }}
                            className="btn-primary" style={{ borderRadius:12, padding:"9px 20px", gap:7 }}
                          >
                            {isSavingEdit ? <><span className="spinner" style={{width:12,height:12,borderWidth:2}}/> Saving</> : <><Check size={12}/> Save Changes</>}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════ DOCTORS TAB ══════════════════════════════════════════════════ */}
          {activeTab === "Doctors" && (
            <motion.div key="doctors" variants={tabVariants} initial="hidden" animate="visible" exit="exit">

              <motion.div variants={itemVariants} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:16, flexWrap:"wrap" }}>
                <div>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.02em", marginBottom:4 }}>
                    Specialists
                    <span style={{ marginLeft:10, fontSize:14, fontWeight:700, color:"#94A3B8" }}>({filtered.length})</span>
                  </h2>
                  <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>
                    Showing doctors assigned to <span style={{ color:PRIMARY, fontWeight:800 }}>{activeHospital?.name || "—"}</span>
                  </p>
                </div>

                {/* Search bar */}
                <div style={{ position:"relative" }}>
                  <Search size={13} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#94A3B8" }}/>
                  <input
                    placeholder="Search name, specialty, email..."
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    style={{ paddingLeft:38, paddingRight:20, paddingTop:10, paddingBottom:10, borderRadius:999, background:"rgba(255,255,255,0.8)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.9)", outline:"none", fontSize:13, fontWeight:600, color:"#334155", width:300, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", transition:"all 200ms ease" }}
                    onFocus={e=>{e.target.style.background="white"; e.target.style.boxShadow=`0 0 0 3px rgba(20,61,48,0.1)`;}}
                    onBlur={e=>{e.target.style.background="rgba(255,255,255,0.8)"; e.target.style.boxShadow="0 2px 8px rgba(0,0,0,0.04)";}}
                  />
                </div>
              </motion.div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.length === 0 && (
                  <motion.div variants={itemVariants} style={{ background:"rgba(255,255,255,0.6)", borderRadius:24, padding:"64px 32px", textAlign:"center" }}>
                    <Stethoscope size={36} color="#CBD5E1" style={{ margin:"0 auto 16px" }}/>
                    <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.2em", fontSize:12, marginBottom:8 }}>No specialists found</p>
                    <p style={{ fontSize:12, color:"#CBD5E1", fontWeight:600 }}>
                      Onboard a doctor and assign them to <strong>{activeHospital?.name}</strong>
                    </p>
                  </motion.div>
                )}

                {filtered.map((doc, i) => (
                  <motion.div key={doc.id} variants={itemVariants}>
                    <TiltCard
                      className="glass-card"
                      style={{ padding:"18px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                    >
                      {/* Avatar */}
                      <div style={{ display:"flex", alignItems:"center", gap:14, flex:1, minWidth:0, paddingRight:16 }}>
                        <div style={{ position:"relative", flexShrink:0 }}>
                          {doc.avatar_url ? (
                            <img src={doc.avatar_url} alt={doc.name}
                              style={{ width:46, height:46, borderRadius:14, border:`2px solid ${doc.is_available ? "#10B981" : "#E2E8F0"}`, boxShadow:"0 2px 8px rgba(0,0,0,0.08)", display:"block" }}
                            />
                          ) : (
                            <div style={{ width:46, height:46, borderRadius:14, background:`linear-gradient(135deg, ${PRIMARY}, #226650)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:14, border:`2px solid ${doc.is_available ? "#10B981" : "#E2E8F0"}` }}>
                              {doc.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                            </div>
                          )}
                          {/* Live dot */}
                          <motion.div
                            animate={{ scale: doc.is_available ? [1,1.3,1] : 1 }}
                            transition={{ repeat: doc.is_available ? Infinity : 0, duration:2 }}
                            style={{ position:"absolute", bottom:-2, right:-2, width:10, height:10, borderRadius:"50%", background: doc.is_available ? "#10B981" : "#E2E8F0", border:"2px solid white" }}
                          />
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#0F172A", fontSize:14, marginBottom:3 }}>
                            Dr. {doc.name}
                          </p>
                          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                            <span className="info-chip">{doc.department}</span>
                            {doc.room && <span className="info-chip"><MapPin size={9}/> Room {doc.room}</span>}
                            {doc.phone && <span className="info-chip"><Phone size={9}/> +{doc.phone}</span>}
                          </div>
                          {doc.email && (
                            <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                              <Mail size={9}/> {doc.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ textAlign:"right" }}>
                          <p style={{ fontSize:8, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.2em", color:"#94A3B8", marginBottom:2 }}>Slot</p>
                          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:"#334155" }}>{doc.slot_duration||20}m</p>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <p style={{ fontSize:8, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.2em", color:"#94A3B8", marginBottom:2 }}>Hours</p>
                          <p style={{ fontWeight:700, fontSize:10, color:"#475569", whiteSpace:"nowrap" }}>{(doc.working_hours||"09:00 AM - 07:00 PM").replace(" - ","–")}</p>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <PToggle checked={!!doc.is_available} onChange={() => toggleDoctor(doc.id, doc.is_available)}/>
                          <span style={{ fontSize:8, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em", color: doc.is_available ? "#059669" : "#94A3B8" }}>
                            {doc.is_available ? "Live" : "Off"}
                          </span>
                        </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ════ HISTORICAL TAB ═══════════════════════════════════════════════ */}
          {activeTab === "Historical" && (
            <motion.div key="historical" variants={tabVariants} initial="hidden" animate="visible" exit="exit">

              <motion.div variants={itemVariants} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.02em", marginBottom:4 }}>
                    Appointments
                    <span style={{ marginLeft:10, fontSize:14, fontWeight:700, color:"#94A3B8" }}>({appointments.length})</span>
                  </h2>
                  {activeHospital && (
                    <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>
                      Filtered to <span style={{ color:PRIMARY, fontWeight:800 }}>{activeHospital.name}</span>
                    </p>
                  )}
                </div>
                <motion.button
                  onClick={fetchHistory}
                  whileHover={{ scale:1.08, rotate:180 }} whileTap={{ scale:0.92 }}
                  transition={{ duration:0.4 }}
                  style={{ width:36, height:36, borderRadius:10, background:"rgba(20,61,48,0.06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#475569" }}
                >
                  <RefreshCw size={14}/>
                </motion.button>
              </motion.div>

              {loadingHistory ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[...Array(5)].map((_,i) => (
                    <div key={i} className="skeleton" style={{ height:72, borderRadius:16, animationDelay:`${i*0.08}s` }} />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  style={{ background:"rgba(255,255,255,0.72)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, border:"1px solid rgba(255,255,255,0.9)", boxShadow:"0 4px 20px rgba(0,0,0,0.04)", overflow:"hidden" }}
                >
                  {appointments.length === 0 && (
                    <div style={{ padding:"64px 32px", textAlign:"center" }}>
                      <Calendar size={36} color="#CBD5E1" style={{ margin:"0 auto 16px" }}/>
                      <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.2em", fontSize:12 }}>No appointments found</p>
                    </div>
                  )}

                  {appointments.map((app, i) => {
                    const statusCfg = {
                      booked:  { bg:"#ECFDF5", text:"#059669", border:"#A7F3D0" },
                      pending: { bg:"#FFFBEB", text:"#D97706", border:"#FDE68A" },
                      cancelled: { bg:"#FEF2F2", text:"#DC2626", border:"#FECACA" },
                    }[app.status] || { bg:"#F8FAFC", text:"#64748B", border:"#E2E8F0" };

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity:0, x:-8 }}
                        animate={{ opacity:1, x:0 }}
                        transition={{ delay: i * 0.025, ...spring }}
                        style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:20, borderBottom: i < appointments.length-1 ? "1px solid rgba(241,245,241,0.8)" : "none", transition:"background 150ms ease" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(20,61,48,0.03)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        {/* Patient */}
                        <div style={{ minWidth:130 }}>
                          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:"#0F172A", marginBottom:2 }}>{app.name}</p>
                          <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
                            <Phone size={9}/> {app.phone}
                          </p>
                        </div>

                        {/* Date/time */}
                        <div style={{ minWidth:110 }}>
                          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:"#334155", marginBottom:2 }}>{app.date}</p>
                          <p style={{ fontSize:9, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.12em", color:"#94A3B8" }}>{app.slot}</p>
                        </div>

                        {/* Doctor */}
                        <div style={{ flex:1 }}>
                          <p style={{ fontWeight:700, fontSize:12, color:"#475569", marginBottom:2 }}>{app.doctors?.name || "—"}</p>
                          <p style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>{app.doctors?.department}</p>
                        </div>

                        {/* Status badge */}
                        <span style={{ padding:"4px 12px", borderRadius:999, fontSize:9, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.12em", textTransform:"uppercase", background:statusCfg.bg, color:statusCfg.text, border:`1px solid ${statusCfg.border}`, whiteSpace:"nowrap" }}>
                          {app.status}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── ADD HOSPITAL MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isHospitalModalOpen && (
          <ModalWrap onClose={() => setIsHospitalModalOpen(false)}>
            <div className="premium-modal-header">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg, ${PRIMARY}, #226650)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(20,61,48,0.3)" }}>
                  <Building2 size={19} color="white"/>
                </div>
                <CloseBtn onClick={() => setIsHospitalModalOpen(false)}/>
              </div>
              <p className="section-label" style={{ marginBottom:6 }}>Multi-Hospital Management</p>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, color:"#0F172A", letterSpacing:"-0.03em", marginBottom:6 }}>Add a Hospital</h1>
              <p style={{ fontSize:12, color:"#94A3B8", fontWeight:600 }}>Each hospital gets its own WhatsApp number and fully isolated data.</p>
            </div>

            <div className="premium-modal-body">
              <AnimatePresence><StatusBanner status={hospitalStatus}/></AnimatePresence>

              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <PInput label="Hospital Name *" placeholder="e.g. City Care Hospital" value={hospitalForm.name} onChange={e=>setHospitalForm({...hospitalForm,name:e.target.value})}/>
                <PInput label="Address" optional placeholder="e.g. 12, Ring Road, Rajkot, Gujarat" value={hospitalForm.address} onChange={e=>setHospitalForm({...hospitalForm,address:e.target.value})}/>

                {/* WhatsApp section */}
                <div style={{ background:"rgba(20,61,48,0.04)", borderRadius:16, padding:"16px 18px", border:"1px solid rgba(20,61,48,0.08)" }}>
                  <p style={{ fontSize:9, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.25em", color:"#475569", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                    <MessageSquare size={10}/> WhatsApp Business Setup
                    <span style={{ textTransform:"none", letterSpacing:0, fontWeight:600, color:"#CBD5E1" }}>— optional</span>
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <PInput label="Phone Number ID" placeholder="From Meta Business → WhatsApp → API Setup" value={hospitalForm.whatsapp_phone_number_id} onChange={e=>setHospitalForm({...hospitalForm,whatsapp_phone_number_id:e.target.value})}/>
                    <PInput label="WhatsApp Token" type="password" placeholder="Permanent access token from Meta" value={hospitalForm.whatsapp_token} onChange={e=>setHospitalForm({...hospitalForm,whatsapp_token:e.target.value})}/>
                  </div>
                </div>

                {/* Info */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", borderRadius:14, background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.12)" }}>
                  <Lock size={13} color="#2563EB" style={{ flexShrink:0, marginTop:1 }}/>
                  <p style={{ fontSize:11, color:"#1D4ED8", fontWeight:600, lineHeight:1.5 }}>
                    Patients, doctors, and appointments are completely isolated per hospital. No data is shared between hospitals.
                  </p>
                </div>

                <motion.button
                  onClick={handleSaveHospital} disabled={isSavingHospital}
                  whileHover={{ scale:isSavingHospital?1:1.02 }}
                  whileTap={{ scale:isSavingHospital?1:0.97 }}
                  className="btn-primary"
                  style={{ borderRadius:999, padding:"14px 24px", width:"100%", fontSize:11, gap:8 }}
                >
                  {isSavingHospital ? <><span className="spinner"/> Creating...</> : <><Plus size={14}/> Add Hospital</>}
                </motion.button>
              </div>
            </div>
          </ModalWrap>
        )}
      </AnimatePresence>

      {/* ── ONBOARD DOCTOR MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalWrap onClose={() => setIsModalOpen(false)}>
            <div className="premium-modal-header">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                {/* Avatar preview */}
                <div style={{ position:"relative" }}>
                  <motion.div
                    animate={{ boxShadow: newDoc.name ? `0 0 0 3px ${PRIMARY}40` : "none" }}
                    transition={{ duration:0.3 }}
                    style={{ borderRadius:16, overflow:"hidden", width:48, height:48 }}
                  >
                    {newDoc.name ? (
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newDoc.name)}`} alt="avatar" style={{ width:48, height:48, display:"block" }}/>
                    ) : (
                      <div style={{ width:48, height:48, background:`linear-gradient(135deg, ${PRIMARY}, #226650)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Stethoscope size={20} color="white"/>
                      </div>
                    )}
                  </motion.div>
                </div>
                <CloseBtn onClick={() => setIsModalOpen(false)}/>
              </div>

              <p className="section-label" style={{ marginBottom:6 }}>Onboarding</p>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, color:"#0F172A", letterSpacing:"-0.03em", marginBottom:0 }}>Add a Specialist</h1>
            </div>

            <div className="premium-modal-body">
              <AnimatePresence><StatusBanner status={onboardStatus}/></AnimatePresence>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <PInput label="Full Name *" placeholder="Dr. Priya Mehta" value={newDoc.name} onChange={e=>setNewDoc({...newDoc,name:e.target.value})}/>

                <PSelect label="Department / Specialty *" value={newDoc.department} onChange={e=>setNewDoc({...newDoc,department:e.target.value})}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                </PSelect>

                <PInput label="Email *" type="email" placeholder="doctor@cura.com" value={newDoc.email} onChange={e=>setNewDoc({...newDoc,email:e.target.value})}/>

                <PInput label="WhatsApp Phone *" type="tel" placeholder="919909971887" value={newDoc.phone} onChange={e=>setNewDoc({...newDoc,phone:e.target.value})} hint="Include country code e.g. 91XXXXXXXXXX"/>

                <PInput label="Room Number" optional placeholder="e.g. 204" value={newDoc.room} onChange={e=>setNewDoc({...newDoc,room:e.target.value})}/>

                {/* Hospital assignment */}
                <div style={{ background:"rgba(20,61,48,0.04)", borderRadius:16, padding:"16px 18px", border:"1px solid rgba(20,61,48,0.08)" }}>
                  <p style={{ fontSize:9, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.25em", color:"#475569", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                    <Building2 size={10}/> Hospital Assignment *
                  </p>

                  <AnimatePresence mode="wait">
                    {!newDoc.useNewHospital ? (
                      <motion.div key="existing" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
                        <PSelect value={newDoc.hospital_id} onChange={e=>setNewDoc({...newDoc,hospital_id:e.target.value})}>
                          <option value="">Select a hospital</option>
                          {hospitals.map(h=>(
                            <option key={h.id} value={h.id}>{h.name}{h.address ? ` — ${h.address}` : ""}</option>
                          ))}
                        </PSelect>
                        <button
                          onClick={() => setNewDoc({...newDoc,useNewHospital:true,hospital_id:""})}
                          style={{ marginTop:10, fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em", color:PRIMARY, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}
                        >
                          <Plus size={10}/> Add a new hospital instead
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="new" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        <PInput label="New Hospital Name *" placeholder="e.g. Rajkot Health Center" value={newDoc.newHospitalName} onChange={e=>setNewDoc({...newDoc,newHospitalName:e.target.value})}/>
                        <PInput label="Address" optional placeholder="Street, City, State" value={newDoc.newHospitalAddress} onChange={e=>setNewDoc({...newDoc,newHospitalAddress:e.target.value})}/>
                        <button
                          onClick={() => setNewDoc({...newDoc,useNewHospital:false,newHospitalName:"",newHospitalAddress:""})}
                          style={{ fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}
                        >
                          <ArrowLeft size={10}/> Select existing hospital
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <PInput label="Working Hours" placeholder="09:00 AM - 07:00 PM" value={newDoc.working_hours} onChange={e=>setNewDoc({...newDoc,working_hours:e.target.value})}/>

                <PSelect label="Slot Duration" value={newDoc.slot_duration} onChange={e=>setNewDoc({...newDoc,slot_duration:parseInt(e.target.value)})}>
                  {[10,15,20,30,45,60].map(d=><option key={d} value={d}>{d} minutes</option>)}
                </PSelect>

                {/* WhatsApp info */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", borderRadius:14, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)" }}>
                  <MessageSquare size={13} color="#059669" style={{ flexShrink:0, marginTop:1 }}/>
                  <p style={{ fontSize:11, color:"#065F46", fontWeight:600, lineHeight:1.5 }}>
                    Login credentials will be automatically sent to the doctor's WhatsApp using the hospital's configured number.
                  </p>
                </div>

                <motion.button
                  onClick={handleOnboardDoctor} disabled={isOnboarding}
                  whileHover={{ scale:isOnboarding?1:1.02 }}
                  whileTap={{ scale:isOnboarding?1:0.97 }}
                  className="btn-primary"
                  style={{ borderRadius:999, padding:"14px 24px", width:"100%", fontSize:11, gap:8 }}
                >
                  {isOnboarding ? <><span className="spinner"/> Creating Account...</> : <><Zap size={14}/> Onboard Specialist</>}
                </motion.button>
              </div>
            </div>
          </ModalWrap>
        )}
      </AnimatePresence>

    </div>
  );
}