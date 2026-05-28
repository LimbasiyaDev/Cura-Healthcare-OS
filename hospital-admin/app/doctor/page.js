"use client";
import InvoiceTab from "./components/InvoiceTab";
import PrescriptionTab from "./components/Presciptiontab";
import LabTestTab from "./components/LabTestTab";
import DoctorSidebar from "./components/Sidebar";
import ShiftStatus from "./components/ShiftStatus";
import BookingSchedule from "./components/BookingSchedule";
import ShiftCalendar from "./components/ShiftCalendar";
import HolidayConfig from "./components/HolidayConfig";
import DeptAvailability from "./components/DeptAvailability";
import { Receipt, Stethoscope } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Bell, CheckCircle2, XCircle, Clock, Calendar,
  Settings, Zap, Users, BarChart3, ChevronLeft, ChevronRight,
  Search, Trash2, Edit3, AlertTriangle, LogOut, X, Activity,
  TrendingUp, Shield, Star, Download, Plus, Phone, FileText, HelpCircle, Mail
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";
const PRIMARY = "#143D30";
const ACCENT = "#4ECCA3";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function useToast() {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);
  const show = useCallback((msg, type = "success") => {
    const id = `t_${++counter.current}`;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  const colors = { success:"#10B981", error:"#EF4444", warning:"#F59E0B", info:"#3B82F6" };
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, display:"flex", flexDirection:"column", gap:10 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:50 }}
            transition={{ type:"spring", stiffness:420, damping:30 }}
            style={{
              background:"rgba(255,255,255,0.96)", backdropFilter:"blur(24px)",
              borderRadius:16, padding:"14px 20px",
              boxShadow:"0 16px 48px rgba(0,0,0,0.14)",
              borderLeft:`3px solid ${colors[t.type]||PRIMARY}`,
              display:"flex", alignItems:"center", gap:12, maxWidth:320,
            }}>
            <div style={{ width:24, height:24, borderRadius:8, background:`${colors[t.type]||PRIMARY}18`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:colors[t.type]||PRIMARY, fontWeight:900, fontSize:12 }}>
              {t.type==="error"?"✕":t.type==="warning"?"!":"✓"}
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:"#1E293B", lineHeight:1.4 }}>{t.msg}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, danger=false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          style={{ position:"fixed", inset:0, background:"rgba(8,28,20,0.5)", backdropFilter:"blur(8px)",
            zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={onCancel}>
          <motion.div initial={{ opacity:0, y:40, scale:0.92 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }}
            transition={{ type:"spring", stiffness:400, damping:28 }}
            onClick={e => e.stopPropagation()}
            style={{ background:"white", borderRadius:28, padding:"2.5rem 2rem",
              boxShadow:"0 40px 80px rgba(0,0,0,0.22)", width:"100%", maxWidth:400, margin:20 }}>
            <div style={{ width:64, height:64, borderRadius:20,
              background:danger?"#FEF2F2":"#FFFBEB",
              border:`1.5px solid ${danger?"#FECACA":"#FDE68A"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:30, margin:"0 auto 22px" }}>
              {danger?"🗑️":"⚠️"}
            </div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:21,
              textAlign:"center", marginBottom:8, color:"#0F172A" }}>{title}</h2>
            <p style={{ fontSize:13, color:"#64748B", textAlign:"center", marginBottom:28, lineHeight:1.65 }}>{message}</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onCancel} style={{ flex:1, padding:14, background:"#F1F5F9", border:"none",
                borderRadius:14, fontWeight:700, fontSize:13, cursor:"pointer", color:"#475569" }}>
                Cancel
              </button>
              <button onClick={onConfirm} style={{ flex:1, padding:14,
                background:danger?"#EF4444":PRIMARY, border:"none", borderRadius:14,
                fontWeight:700, fontSize:13, cursor:"pointer", color:"white" }}>
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Support Modal ──────────────────────────────────────────────────────── */
function SupportModal({ onClose, showToast, supabase }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [issue,   setIssue]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !issue.trim()) { showToast("Please fill in name and issue.", "error"); return; }
    setLoading(true);
    const { error } = await supabase.from("support_tickets").insert([{ name: name.trim(), email: email.trim() || null, issue: issue.trim() }]);
    setLoading(false);
    if (error) { showToast("Failed to submit: " + error.message, "error"); return; }
    setDone(true);
    setTimeout(() => onClose(), 2200);
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(10,34,24,0.45)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1.5rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:24, padding:"2rem", width:"100%", maxWidth:440, boxShadow:"0 32px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"#143D30", display:"flex", alignItems:"center", justifyContent:"center" }}><HelpCircle size={20} color="white"/></div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:"#0F172A", margin:0 }}>Support</p>
              <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, margin:0 }}>We&apos;ll get back to you shortly</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:999, background:"rgba(20,61,48,0.06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:18 }}>✕</button>
        </div>
        {done ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"#0F172A", marginBottom:6 }}>Ticket Submitted!</p>
            <p style={{ color:"#94A3B8", fontSize:13 }}>We&apos;ve received your request and will respond soon.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { label:"Your Name", val:name, set:setName, ph:"Dr. John Smith", type:"text" },
              { label:"Email (optional)", val:email, set:setEmail, ph:"you@hospital.com", type:"email" },
            ].map(({ label, val, set, ph, type }) => (
              <div key={label}>
                <label style={{ display:"block", fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.22em", textTransform:"uppercase", color:"#94A3B8", marginBottom:7 }}>{label}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                  style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"#F8FAFC", fontSize:14, fontWeight:600, color:"#0F172A", outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                  onFocus={e => { e.target.style.borderColor="#143D30"; e.target.style.background="white"; }}
                  onBlur={e => { e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC"; }}
                />
              </div>
            ))}
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.22em", textTransform:"uppercase", color:"#94A3B8", marginBottom:7 }}>Describe Your Issue</label>
              <textarea value={issue} onChange={e => setIssue(e.target.value)} placeholder="Describe the problem you're facing…" rows={4}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"#F8FAFC", fontSize:14, fontWeight:500, color:"#0F172A", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.6 }}
                onFocus={e => { e.target.style.borderColor="#143D30"; e.target.style.background="white"; }}
                onBlur={e => { e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC"; }}
              />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{ width:"100%", padding:"14px", borderRadius:12, background:"#143D30", color:"white", border:"none", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {loading ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:24,
      background:`linear-gradient(160deg,${PRIMARY} 0%,#0A2218 100%)` }}>
      <motion.div animate={{ scale:[1,1.07,1] }} transition={{ duration:3.5, repeat:Infinity }}
        style={{ width:80, height:80, borderRadius:26, overflow:"hidden",
          boxShadow:"0 20px 48px rgba(0,0,0,0.3)" }}>
        <img src="/logo.jpeg" alt="Cura" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      </motion.div>
      <div style={{ textAlign:"center" }}>
        <p style={{ color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, marginBottom:4 }}>Cura</p>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, letterSpacing:"0.35em", textTransform:"uppercase" }}>
          Syncing your dashboard
        </p>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {[0,1,2].map(i => (
          <motion.div key={i} animate={{ scale:[1,1.5,1], opacity:[0.3,1,0.3] }}
            transition={{ duration:1.4, delay:i*0.2, repeat:Infinity }}
            style={{ width:7, height:7, borderRadius:"50%", background:ACCENT }} />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    pending: { cls:"badge-warning", label:"Pending", dot:"#F59E0B" },
    booked:  { cls:"badge-success", label:"Confirmed", dot:"#10B981" },
    rejected:{ cls:"badge-danger",  label:"Rejected",  dot:"#EF4444" },
  };
  const c = cfg[status]||cfg.pending;
  return (
    <span className={`badge ${c.cls}`} style={{ display:"inline-flex", alignItems:"center", gap:6,
      padding:"3px 10px", borderRadius:999, fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, display:"inline-block" }} />
      {c.label}
    </span>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { toasts, show: toast } = useToast();

  const [doctor,       setDoctor]       = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [holidays,     setHolidays]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeNav,    setActiveNav]    = useState("dashboard");
  const [activeTab,    setActiveTab]    = useState("Schedule");
  const [showSupport,  setShowSupport]  = useState(false);

  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [confirmModal,  setConfirmModal]  = useState({ open:false });
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [modalMode,    setModalMode]     = useState("global");
  const [overrideDate, setOverrideDate]  = useState("");
  const [timeSettings, setTimeSettings]  = useState({ start:"09:00", end:"19:00" });
  const [timeSaving,   setTimeSaving]    = useState(false);

  const todayStr   = new Date().toISOString().split("T")[0];
  const nowMinutes = new Date().getHours()*60 + new Date().getMinutes();
  const fetchRef   = useRef(null);

  const exportToCSV = () => {
    if (appointments.length === 0) { toast("No records to export", "info"); return; }
    const headers = ["Date", "Slot", "Patient", "Phone", "Status", "Reason"];
    const rows = appointments.map(a => [
      a.date, a.slot, a.name, a.phone, a.status, (a.reason || "").replace(/,/g, ";")
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cura_Appointments_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Records exported successfully", "success");
  };

  const fetchData = useCallback(async (silent=false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    let isRedirecting = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { isRedirecting = true; router.push("/login"); return; }
      const { data:doc, error:docErr } = await supabase.from("doctors").select("*").eq("user_id", user.id).single();
      if (!doc||docErr) { isRedirecting = true; router.push("/login"); return; }
      const { data:override } = await supabase.from("date_overrides").select("working_hours")
        .eq("doctor_id",doc.id).eq("date",todayStr).single();
      const [appRes, blkRes, holRes, wpRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("doctor_id",doc.id).order("date",{ascending:false}),
        supabase.from("blocked_slots").select("slot").eq("doctor_id",doc.id).eq("date",todayStr),
        supabase.from("doctor_holidays").select("date").eq("doctor_id",doc.id),
        supabase.from("web_patients").select("phone, email, uid"),
      ]);
      const uidMap = {};
      if (wpRes.data) {
        wpRes.data.forEach(wp => {
          if (wp.phone) uidMap[wp.phone] = wp.uid;
          if (wp.email) { uidMap[wp.email] = wp.uid; uidMap[`web_${wp.email}`] = wp.uid; }
        });
      }
      const finalAppts = (appRes.data||[]).map(a => ({ ...a, patient_uid: uidMap[a.phone] || null }));
      setAppointments(finalAppts);
      setBlockedSlots(blkRes.data?.map(b=>b.slot)||[]);
      setHolidays(holRes.data?.map(h=>h.date)||[]);
      setDoctor({...doc, active_hours: override ? override.working_hours : doc.working_hours });
    } catch(err) { if (!silent) toast("Failed to load data","error"); }
    finally { 
      if (!isRedirecting) {
        setLoading(false); 
        setRefreshing(false); 
      }
    }
  }, [todayStr, router, toast]);

  useEffect(() => { fetchData(); }, []); 

  // Handle auto logout on browser back
  useEffect(() => {
    if (loading || !doctor) return;

    // Push a dummy state so that there is a state to pop when user clicks "Back"
    window.history.pushState(null, null, window.location.href);

    const handlePopState = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Popstate signOut error:", err);
      }
      router.push("/login");
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [loading, doctor, router]);
  useEffect(() => {
  // We need the doctor id before we can scope the subscription.
  // Poll until doctor is loaded, then subscribe.
  if (!doctor?.id) return;
 
  const channel = supabase
    .channel(`appointments-realtime-${doctor.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",                   // INSERT, UPDATE, DELETE
        schema: "public",
        table: "appointments",
        filter: `doctor_id=eq.${doctor.id}`,   // only this doctor's rows
      },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
 
        if (eventType === "INSERT") {
          setAppointments((prev) => {
            // Guard against duplicates (Supabase sometimes fires twice)
            if (prev.some((a) => a.id === newRow.id)) return prev;
            toast(`New booking: ${newRow.name} at ${newRow.slot}`, "success");
            // Keep the existing sort order (date desc, as fetched)
            return [newRow, ...prev];
          });
        }
 
        if (eventType === "UPDATE") {
          setAppointments((prev) =>
            prev.map((a) => (a.id === newRow.id ? { ...a, ...newRow } : a))
          );
        }
 
        if (eventType === "DELETE") {
          setAppointments((prev) => prev.filter((a) => a.id !== oldRow.id));
        }
      }
    )
    .subscribe();
 
  return () => {
    supabase.removeChannel(channel);
  };
}, [doctor?.id]);

  useEffect(() => { fetchRef.current = fetchData; }, [fetchData]);
  useEffect(() => {
    const id = setInterval(() => fetchRef.current?.(true), 30000);
    return () => clearInterval(id);
  }, []);

  const generateSlots = (forDate=todayStr) => {
    const h = doctor?.active_hours||doctor?.working_hours;
    if (!h) return [];
    const [s,e] = h.split(" - ");
    let cur = new Date(`1970/01/01 ${s}`);
    const end = new Date(`1970/01/01 ${e}`);
    const dur = doctor?.slot_duration||20;
    const slots = [];
    const isToday = forDate===todayStr;
    while(cur < end) {
      const m = cur.getHours()*60+cur.getMinutes();
      if (!isToday||m>nowMinutes)
        slots.push(cur.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:true}));
      cur.setMinutes(cur.getMinutes()+dur);
    }
    return slots;
  };

  async function toggleHoliday(dateStr) {
    if (!doctor) return;
    const isHol = holidays.includes(dateStr);
    try {
      if (isHol) {
        await supabase.from("doctor_holidays").delete().eq("doctor_id",doctor.id).eq("date",dateStr);
        setHolidays(h => h.filter(x=>x!==dateStr));
        toast(`Holiday removed for ${dateStr}`,"info");
      } else {
        await supabase.from("doctor_holidays").insert([{doctor_id:doctor.id,date:dateStr}]);
        setHolidays(h=>[...h,dateStr]);
        toast(`${dateStr} marked as holiday`,"success");
      }
    } catch { toast("Failed to update holiday","error"); }
  }

  async function manageRequest(app, status) {
  const { error } = await supabase.from("appointments").update({status}).eq("id",app.id);
  if (!error) {
    toast(`${status==="booked"?"Confirmed":"Rejected"}: ${app.name}`, status==="booked"?"success":"warning");
    try { await axios.post(`${BOT_API_URL}/notify-status-change`,{phone:app.phone,doctorName:doctor.name,doctorId:doctor.id,status,slot:app.slot,date:app.date}); } catch{}
    // No fetchData() here — the realtime channel UPDATE event updates state instantly
  } else toast("Failed to update","error");
}
 
  async function deleteBooking(id) {
    const { error } = await supabase.from("appointments").delete().eq("id",id);
    setConfirmModal({open:false});
    if (error) { toast("Failed to delete booking","error"); return; }
    toast("Booking deleted","info");
    fetchData(true);
  }

  async function toggleSlotBlock(slot,isBlocked,bookedPt) {
    if (!isBlocked && bookedPt) {
      setConfirmModal({ open:true, title:"Block Occupied Slot?",
        message:`${bookedPt.name} is booked here. They will be notified.`, danger:true,
        onConfirm:async()=>{ setConfirmModal({open:false}); await manageRequest(bookedPt,"rejected");
          await supabase.from("blocked_slots").insert([{doctor_id:doctor.id,date:todayStr,slot}]);
          fetchData(true); toast(`Slot ${slot} blocked`,"warning"); },
        onCancel:()=>setConfirmModal({open:false}) });
      return;
    }
    try {
      if (isBlocked) {
        await supabase.from("blocked_slots").delete().eq("doctor_id",doctor.id).eq("date",todayStr).eq("slot",slot);
        toast(`Slot ${slot} unblocked`,"success");
      } else {
        await supabase.from("blocked_slots").insert([{doctor_id:doctor.id,date:todayStr,slot}]);
        toast(`Slot ${slot} blocked`,"warning");
      }
      fetchData(true);
    } catch { toast("Failed to update slot","error"); }
  }

  async function handleToggleField(field,value) {
    const { error } = await supabase.from("doctors").update({[field]:!value}).eq("id",doctor.id);
    if (!error) { setDoctor({...doctor,[field]:!value}); toast(`${field.replace(/_/g," ")} ${!value?"enabled":"disabled"}`,!value?"success":"info"); }
  }

  async function saveTimeSettings() {
    const fmt = t => { const [h,m]=t.split(":"); const hh=parseInt(h); return `${hh%12||12}:${m} ${hh>=12?"PM":"AM"}`; };
    const newHours = `${fmt(timeSettings.start)} - ${fmt(timeSettings.end)}`;
    setTimeSaving(true);
    try {
      if (modalMode==="global") {
        await supabase.from("doctors").update({working_hours:newHours}).eq("id",doctor.id);
        toast("Shift hours updated","success");
      } else {
        await supabase.from("date_overrides").upsert([{doctor_id:doctor.id,date:overrideDate,working_hours:newHours}]);
        toast(`Override set for ${overrideDate}`,"success");
      }
      setIsTimeModalOpen(false);
      fetchData(true);
    } catch { toast("Failed to save","error"); }
    finally { setTimeSaving(false); }
  }

  const stats = {
    today:     appointments.filter(a=>a.date===todayStr).length,
    pending:   appointments.filter(a=>a.status==="pending").length,
    total:     appointments.length,
    confirmed: appointments.filter(a=>a.status==="booked").length,
    rejected:  appointments.filter(a=>a.status==="rejected").length,
  };

  const avatarInitials = doctor?.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"Dr";

  if (loading) return <LoadingScreen />;
  if (!doctor) return null;

  const NAV_TITLES = {
    dashboard:     "Dashboard",
    patients:      "Bookings",
    analytics:     "Analytics",
    settings:      "Settings",
    invoice:       "Invoice",
    prescriptions: "Prescriptions",
    lab_tests:     "Lab Tests",
  };

  return (
    <div className="cura-root">
      {/* SIDEBAR */}
      <DoctorSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        doctor={doctor}
        onSupportClick={() => setShowSupport(true)}
        onSignOut={async()=>{
          try {
            await supabase.auth.signOut();
          } catch(err) {
            console.warn("SignOut error:", err);
          }
          router.push("/login");
        }}
      />

      {/* MAIN */}
      <main className="main">
        {doctor?.verification_status === 'pending' && (
          <div style={{ background: "#FEF3C7", borderBottom: "1px solid #FDE68A", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={18} color="#D97706" />
            <p style={{ margin: 0, fontSize: 13, color: "#92400E", fontWeight: 700 }}>Your account is under 24-hour review. Some features may be limited.</p>
          </div>
        )}
        {/* TOPBAR */}
        <div className="topbar">
          <div style={{display:"flex",flexDirection:"column"}}>
            <div className="topbar-page-title">
              {NAV_TITLES[activeNav] || "Dashboard"}
            </div>
            {activeNav==="dashboard" && (
              <div className="topbar-breadcrumb">Manage ward rotations, booking schedules, and clinic availability.</div>
            )}
            {activeNav==="patients" && (
              <div className="topbar-breadcrumb">View and manage all patient appointment bookings.</div>
            )}
            {activeNav==="prescriptions" && (
              <div className="topbar-breadcrumb">Issue, manage, and print patient prescriptions.</div>
            )}
            {activeNav==="lab_tests" && (
              <div className="topbar-breadcrumb">Order lab tests and track patient results.</div>
            )}
          </div>
          <div className="search-wrap" style={{marginLeft:24}}>
            <Search size={14} className="search-icon"/>
            <input 
              placeholder="Search records…"
              value={bookingSearch}
              onChange={e => setBookingSearch(e.target.value)}
            />
          </div>
          <div className="topbar-right">
            <button className="topbar-icon-btn" onClick={()=>fetchData(true)} title="Refresh">
              <motion.div animate={refreshing?{rotate:360}:{}} transition={refreshing?{duration:0.8,repeat:Infinity,ease:"linear"}:{}}>
                <RefreshCw size={15}/>
              </motion.div>
            </button>
            {stats.pending>0 && (
              <button className="topbar-icon-btn" style={{position:"relative"}}>
                <Bell size={15}/>
                <div className="notif-dot"/>
              </button>
            )}
            <div className="topbar-divider"/>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px 5px 5px",borderRadius:999,
              background:doctor?.is_available?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.06)",
              border:`1px solid ${doctor?.is_available?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.15)"}`}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:doctor?.is_available?"#10B981":"#EF4444"}}/>
              <span style={{fontSize:10,fontWeight:800,fontFamily:"'Syne',sans-serif",
                color:doctor?.is_available?"#059669":"#DC2626",textTransform:"uppercase",letterSpacing:"0.12em"}}>
                {doctor?.is_available?"Online":"Offline"}
              </span>
            </div>
            <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${PRIMARY},#1C5240)`,
              color:"white",fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:13,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
              boxShadow:"0 4px 12px rgba(20,61,48,0.28)"}}>
              {avatarInitials}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">

          {/* ── DASHBOARD ── */}
          {activeNav==="dashboard" && (
            <>
              <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:20}}>
                <div style={{display:"flex",gap:10}}>
                  <button className="btn-primary" onClick={()=>{setModalMode("global");setIsTimeModalOpen(true);}}>
                    <Plus size={14}/> New Shift
                  </button>
                </div>
              </div>

              {/* BOTTOM ROW: Shift & Holiday Management */}
              <div style={{display:"grid",gridTemplateColumns:"320px 1fr 320px",gap:16,marginBottom:16}}>
                <ShiftStatus doctor={doctor} holidays={holidays} todayStr={todayStr}/>
                <ShiftCalendar holidays={holidays} appointments={appointments} todayStr={todayStr} onToggleHoliday={toggleHoliday}/>
                <HolidayConfig doctor={doctor} holidays={holidays} todayStr={todayStr} onToggleHoliday={toggleHoliday} onToggleField={handleToggleField}/>
              </div>
              <DeptAvailability appointments={appointments} blockedSlots={blockedSlots} doctor={doctor} todayStr={todayStr}/>
            </>
          )}

          {/* ── PATIENTS / BOOKINGS ── */}
          {activeNav==="patients" && (
             <BookingSchedule
            supabase={supabase}
            appointments={appointments}
            todayStr={todayStr}
            doctors={[doctor]}
            onApprove={(appt) => manageRequest(appt, "booked")}
            onDecline={(appt) => manageRequest(appt, "rejected")}
            showToast={toast}
  />
)}

          {/* ── ANALYTICS ── */}
          {activeNav==="analytics" && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={{display:"flex",flexDirection:"column",gap:24,maxWidth:1100}}>
              <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:4}}>
                <div>
                  <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:32,color:"#0F172A",letterSpacing:"-0.04em",marginBottom:6}}>Analytics Overview</h2>
                  <p style={{fontSize:14,color:"#64748B"}}>Track your clinical performance and appointment metrics.</p>
                </div>
                <button className="btn-secondary" onClick={exportToCSV} style={{padding:"8px 16px",fontSize:12,borderRadius:12}}><Download size={14}/> Export CSV</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16}}>
                {[
                  {label:"Today's Appts", val:stats.today,     accent:PRIMARY,   bg:"#EAF2EE", icon:Calendar},
                  {label:"Pending Action",val:stats.pending,   accent:"#F59E0B", bg:"#FFFBEB", icon:Clock},
                  {label:"Total Records", val:stats.total,     accent:"#3B82F6", bg:"#EFF6FF", icon:BarChart3},
                  {label:"Confirmed",     val:stats.confirmed, accent:"#10B981", bg:"#ECFDF5", icon:CheckCircle2},
                  {label:"Rejected",      val:stats.rejected,  accent:"#EF4444", bg:"#FEF2F2", icon:XCircle},
                ].map((s,i)=>(
                  <motion.div key={s.label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    style={{background:"white",borderRadius:24,padding:"24px",border:"1.5px solid rgba(20,61,48,0.06)",boxShadow:"0 4px 24px rgba(0,0,0,0.02)",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",right:-10,top:-10,opacity:0.04,transform:"scale(2)"}}><s.icon size={64}/></div>
                    <div style={{width:44,height:44,borderRadius:14,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",color:s.accent,marginBottom:16}}>
                      <s.icon size={20} strokeWidth={2.5}/>
                    </div>
                    <span style={{display:"block",fontSize:32,fontFamily:"'Syne',sans-serif",fontWeight:900,color:"#0F172A",lineHeight:1,marginBottom:8}}>{s.val}</span>
                    <p style={{fontSize:11,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:"#64748B",fontFamily:"'Syne',sans-serif"}}>{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div style={{background:"white",borderRadius:24,border:"1.5px solid rgba(20,61,48,0.06)",boxShadow:"0 4px 24px rgba(0,0,0,0.02)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <div style={{padding:"24px 28px",borderBottom:"1px solid rgba(20,61,48,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"#0F172A"}}>Historical Records</span>
                  <div style={{position:"relative"}}>
                    <Search size={14} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#94A3B8"}}/>
                    <input
                      value={bookingSearch}
                      onChange={e => setBookingSearch(e.target.value)}
                      placeholder="Search patient..."
                      style={{padding:"8px 16px 8px 36px",borderRadius:999,border:"1.5px solid #E2EAE6",background:"#F8FAF9",fontSize:13,outline:"none",width:200,transition:"all 0.2s"}}
                      onFocus={e=>{e.target.style.borderColor=PRIMARY;e.target.style.background="white";}}
                      onBlur={e=>{e.target.style.borderColor="#E2EAE6";e.target.style.background="#F8FAF9";}}/>
                  </div>
                </div>
                {appointments.length===0 ? (
                  <div style={{padding:"60px 20px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
                    <div style={{width:64,height:64,borderRadius:20,background:"#F8FAF9",display:"flex",alignItems:"center",justifyContent:"center",color:"#CBD5E1"}}>
                      <Activity size={28}/>
                    </div>
                    <p style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:"#0F172A"}}>No historical data yet</p>
                    <p style={{fontSize:13,color:"#94A3B8"}}>Appointments will appear here once they are booked.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.5fr",padding:"14px 28px",background:"#F8FAF9",borderBottom:"1px solid rgba(20,61,48,0.06)",fontSize:10,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:"#64748B",fontFamily:"'Syne',sans-serif"}}>
                      <span>Patient</span><span>Date</span><span>Time Slot</span><span>Status</span><span>Clinical Notes</span>
                    </div>
                    {appointments
                      .filter(a =>
                        !bookingSearch ||
                        a.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                        a.phone?.includes(bookingSearch)
                      )
                      .slice(0, 20)
                      .map((a, i) => (
                      <div key={a.id} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.5fr",padding:"16px 28px",borderBottom:"1px solid rgba(20,61,48,0.03)",alignItems:"center",transition:"background 0.2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#F8FAF9"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${PRIMARY},#1C5240)`,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:14,fontFamily:"'Syne',sans-serif",boxShadow:"0 4px 12px rgba(20,61,48,0.2)"}}>
                            {a.name?.[0]?.toUpperCase()||"?"}
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:14,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div>
                            <div style={{fontSize:12,color:"#94A3B8",display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                               {a.phone?.includes("@") ? <Mail size={11}/> : <Phone size={11}/>}
                               <span>{a.phone?.replace(/^web_/, "")}</span>
                             </div>
                          </div>
                        </div>
                        <span style={{fontSize:13,fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:6}}><Calendar size={13} color="#94A3B8"/> {a.date}</span>
                        <span style={{fontSize:13,fontWeight:600,color:"#475569",display:"flex",alignItems:"center",gap:6}}><Clock size={13} color="#94A3B8"/> {a.slot}</span>
                        <div><StatusBadge status={a.status}/></div>
                        <span style={{fontSize:12,color:"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",background:"#F1F5F9",padding:"4px 10px",borderRadius:8}}>{a.reason||"No notes"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SETTINGS ── */}
          {activeNav==="settings" && (
            <div style={{ display:"flex", flexDirection:"column", gap:24, width:"100%" }}>
              <div className="page-header">
                <div className="page-title">Settings</div>
                <p style={{ fontSize:13, color:"#64748B", margin:0 }}>Manage your profile, availability, and clinic hours</p>
              </div>

              {/* Top Row: Profile (left) + Availability (right) */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                {/* Profile Card */}
                <div className="settings-card" style={{ margin:0 }}>
                  <div className="settings-section-title">Profile</div>
                  <div className="settings-section-desc">Your doctor profile information</div>
                  <div style={{ display:"flex", alignItems:"center", gap:16, margin:"20px 0" }}>
                    <div style={{ width:72, height:72, borderRadius:22, flexShrink:0,
                      background:`linear-gradient(135deg,${PRIMARY},#1C5240)`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:26, fontWeight:900, color:"white", fontFamily:"'Syne',sans-serif" }}>
                      {avatarInitials}
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, color:"#0F172A", margin:0 }}>Dr. {doctor?.name?.replace(/^Dr\.\s*/i, '')}</p>
                      <p style={{ fontSize:13, color:"#64748B", margin:"4px 0 0" }}>{doctor?.department}</p>
                      <p style={{ fontSize:12, fontWeight:700, color:PRIMARY, margin:"3px 0 0" }}>{doctor?.email}</p>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div className="settings-field" style={{ marginBottom:0 }}>
                      <label className="settings-label">Room Number</label>
                      <input value={doctor?.room_number||""} onChange={e=>setDoctor({...doctor,room_number:e.target.value})}
                        onBlur={async()=>{ await supabase.from("doctors").update({room_number:doctor.room_number}).eq("id",doctor.id); toast("Room saved","success"); }}
                        className="settings-input" style={{ marginBottom:0 }} placeholder="e.g. 204"/>
                    </div>
                    <div className="settings-field" style={{ marginBottom:0 }}>
                      <label className="settings-label">Department</label>
                      <input value={doctor?.department||""} readOnly className="settings-input" style={{ marginBottom:0, background:"#F8FAFC", cursor:"default" }} />
                    </div>
                    <div className="settings-field" style={{ marginBottom:0, gridColumn:"1/-1" }}>
                      <label className="settings-label">Slot Duration</label>
                      <select 
                        value={doctor?.slot_duration || 30} 
                        onChange={e => setDoctor({...doctor, slot_duration: parseInt(e.target.value)})}
                        onBlur={async()=>{ await supabase.from("doctors").update({slot_duration:doctor.slot_duration}).eq("id",doctor.id); toast("Slot duration saved","success"); }}
                        className="settings-input" style={{ marginBottom:0, appearance: "auto" }}>
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes</option>
                      </select>
                    </div>
                  </div>
                </div>
              <div className="settings-card" style={{ margin:0, display:"flex", flexDirection:"column" }}>
                  <div className="settings-section-title">Availability</div>
                  <div className="settings-section-desc" style={{ marginBottom:20 }}>Control whether the bot routes patients to you</div>
                  <button onClick={()=>handleToggleField("is_available",doctor?.is_available)} style={{
                    flex:1, minHeight:100, padding:"20px 24px", borderRadius:18, border:"none", cursor:"pointer",
                    fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:14, textTransform:"uppercase", letterSpacing:"0.1em",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.3s",
                    background:doctor?.is_available?"linear-gradient(135deg,#10B981,#059669)":"rgba(20,61,48,0.06)",
                    color:doctor?.is_available?"white":"#94A3B8",
                    boxShadow:doctor?.is_available?"0 8px 28px rgba(16,185,129,0.32)":"none",
                  }}>
                    <span style={{ fontSize:28 }}>{doctor?.is_available ? "🟢" : "⚫"}</span>
                    {doctor?.is_available ? "Online — Tap to Go Offline" : "Offline — Tap to Go Online"}
                  </button>
                  <div style={{ marginTop:14, padding:"12px 16px", borderRadius:12, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>Current Status</p>
                    <p style={{ fontSize:14, fontWeight:800, color:doctor?.is_available ? "#059669" : "#94A3B8", margin:"4px 0 0" }}>
                      {doctor?.is_available ? "Accepting new appointments" : "Not accepting appointments"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Working Hours Card (full width) */}
              <div className="settings-card" style={{ margin:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
                  <div>
                    <div className="settings-section-title">Working Hours</div>
                    <div className="settings-section-desc">{doctor?.working_hours||"Not set \u2014 click Edit Global Shift to configure"}</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <button className="btn-primary" onClick={()=>{setModalMode("global");setIsTimeModalOpen(true);}}>
                      <Edit3 size={13}/> Edit Global Shift
                    </button>
                    <input type="date" value={overrideDate} onChange={e=>setOverrideDate(e.target.value)} min={todayStr}
                      className="settings-input" style={{ marginBottom:0, minWidth:160 }}/>
                    <button className="btn-secondary" disabled={!overrideDate}
                      onClick={()=>{if(overrideDate){setModalMode("override");setIsTimeModalOpen(true);}}}
                      style={{ opacity:overrideDate?1:0.4 }}>
                      <Zap size={13}/> Override Date
                    </button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:20 }}>
                  {[
                    { label:"Working Hours", val:doctor?.working_hours||"\u2014", icon:"\uD83D\uDD50" },
                    { label:"Slot Duration", val:doctor?.slot_duration ? `${doctor.slot_duration} min` : "30 min", icon:"\u23F1\uFE0F" },
                    { label:"Department", val:doctor?.department||"\u2014", icon:"\uD83C\uDFE5" },
                    { label:"Room", val:doctor?.room_number||"\u2014", icon:"\uD83D\uDEAA" },
                  ].map(item => (
                    <div key={item.label} style={{ padding:"14px 16px", borderRadius:14, background:"#F8FAFC", border:"1px solid #E2E8F0" }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{item.icon}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{item.label}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:"#0F172A" }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{ background:"linear-gradient(135deg,#FFF5F5,#FEF2F2)", border:"1px solid #FECACA",
                borderRadius:24, padding:"1.5rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:48, height:48, borderRadius:16, background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <AlertTriangle size={22} color="#F87171"/>
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16, color:"#DC2626", margin:0, textTransform:"uppercase" }}>Danger Zone</p>
                    <p style={{ fontSize:12, color:"#F87171", margin:"4px 0 0" }}>Sign out of all Cura systems</p>
                  </div>
                </div>
                <button onClick={()=>setConfirmModal({open:true,title:"Sign Out?",message:"You will be logged out of Cura Doctor Portal.",danger:false,
                  onConfirm:async()=>{
                    try {
                      await supabase.auth.signOut();
                    } catch(err) {
                      console.warn("SignOut error:", err);
                    }
                    router.push("/login");
                  },
                  onCancel:()=>setConfirmModal({open:false})})}
                  style={{ padding:"12px 28px", background:"white", color:"#EF4444", border:"1.5px solid #FECACA",
                    borderRadius:14, fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:11, textTransform:"uppercase", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                  <LogOut size={14}/> Sign Out
                </button>
              </div>
            </div>
          )}

          {/* ── INVOICE ── */}
          {activeNav==="invoice" && <InvoiceTab doctor={doctor} appointments={appointments}/>}

          {/* ── PRESCRIPTIONS ── */}
          {activeNav==="prescriptions" && (
            <PrescriptionTab doctorId={doctor?.id} />
          )}

          {/* ── LAB TESTS ── */}
          {activeNav==="lab_tests" && (
            <LabTestTab doctorId={doctor?.id} />
          )}

        </div>
      </main>

      {/* Time Modal */}
      <AnimatePresence>
        {isTimeModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,background:"rgba(8,28,20,0.5)",backdropFilter:"blur(8px)",
              zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setIsTimeModalOpen(false)}>
            <motion.div initial={{opacity:0,y:40,scale:0.92}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:20,scale:0.95}} transition={{type:"spring",stiffness:400,damping:28}}
              onClick={e=>e.stopPropagation()}
              style={{background:"white",borderRadius:28,padding:"2.5rem 2rem",
                boxShadow:"0 40px 80px rgba(0,0,0,0.22)",width:"100%",maxWidth:400,margin:20}}>
              <div style={{width:64,height:64,borderRadius:20,background:"rgba(20,61,48,0.06)",
                border:"1.5px solid rgba(20,61,48,0.1)",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:30,margin:"0 auto 22px"}}>⏰</div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:22,textAlign:"center",marginBottom:6,color:"#0F172A"}}>
                {modalMode==="global"?"Global Shift Hours":`Override: ${overrideDate}`}
              </h2>
              <p style={{fontSize:12,color:"#94A3B8",textAlign:"center",marginBottom:28}}>
                {modalMode==="global"?"Applies Mon–Fri every week":"Applies to this date only"}
              </p>
              {[["start","Start Time"],["end","End Time"]].map(([k,lbl])=>(
                <div key={k} style={{marginBottom:14}}>
                  <label style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",color:"#94A3B8",fontFamily:"'Syne',sans-serif",display:"block",marginBottom:6}}>{lbl}</label>
                  <input type="time" value={timeSettings[k]} onChange={e=>setTimeSettings({...timeSettings,[k]:e.target.value})}
                    style={{width:"100%",padding:"11px 15px",borderRadius:12,border:"1.5px solid rgba(20,61,48,0.1)",
                      background:"#F8FAF9",fontSize:14,outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
                </div>
              ))}
              <button onClick={saveTimeSettings} disabled={timeSaving}
                className="btn-primary" style={{width:"100%",padding:15,borderRadius:14,marginTop:8,justifyContent:"center",display:"flex"}}>
                {timeSaving?"Saving…":"Save Clinic Hours"}
              </button>
              <button onClick={()=>setIsTimeModalOpen(false)}
                style={{width:"100%",padding:11,background:"none",border:"none",cursor:"pointer",
                  color:"#CBD5E1",fontSize:10,fontWeight:900,textTransform:"uppercase",
                  letterSpacing:"0.2em",fontFamily:"'Syne',sans-serif",marginTop:8}}>
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       <ConfirmModal
        open={confirmModal.open} title={confirmModal.title}
        message={confirmModal.message} danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm} onCancel={confirmModal.onCancel}/>
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} showToast={toast} supabase={supabase}/>}
      <ToastContainer toasts={toasts}/>
    </div>
  );
}