"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, RefreshCw, Bell, CheckCircle2, XCircle,
  Clock, Calendar, Settings, Zap, Users, BarChart3,
  ChevronLeft, ChevronRight, Search, Filter, Trash2,
  Edit3, AlertTriangle, LogOut, Home, X, Activity,
  TrendingUp, Shield, Star, Sparkles
} from "lucide-react";

// ── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL     || "https://qsmgiegmsgnrspxfbjou.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbWdpZWdtc2ducnNweGZiam91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjA0NzksImV4cCI6MjA5MTY5NjQ3OX0.QQDo5ho7TxVdlwTYS9huRrgsIbXBMN4Wu7kgG8XmzFg"
);

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";
const PRIMARY     = "#143D30";
const ACCENT      = "#4ECCA3";

// ── ANIMATION VARIANTS ───────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  show:    { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } }
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 380, damping: 24 } }
};

// ── TAB CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "Schedule",  label: "Schedule",  icon: <Calendar  size={12} /> },
  { key: "Bookings",  label: "Bookings",  icon: <Users     size={12} /> },
  { key: "Holidays",  label: "Holidays",  icon: <Clock     size={12} /> },
  { key: "Config",    label: "Config",    icon: <Zap       size={12} /> },
  { key: "Settings",  label: "Settings",  icon: <Settings  size={12} /> },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ── TOAST HOOK ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);
  const show = useCallback((msg, type = "success") => {
    const id = `toast_${++counter.current}_${Date.now()}`;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return { toasts, show };
}

// ── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    pending:  { cls: "badge-warning", label: "Pending",   dot: "#F59E0B" },
    booked:   { cls: "badge-success", label: "Confirmed", dot: "#10B981" },
    rejected: { cls: "badge-danger",  label: "Rejected",  dot: "#EF4444" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`badge ${c.cls} gap-1.5`} style={{ flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ── APPOINTMENT ROW ───────────────────────────────────────────────────────────
function AppointmentRow({ app, onApprove, onReject, onCancelBooked, onDelete }) {
  const statusColors = { pending: "#F59E0B", booked: "#10B981", rejected: "#EF4444" };
  const borderColor  = statusColors[app.status] || "#94A3B8";

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 4, y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="appt-row"
      style={{ borderLeftColor: borderColor, borderLeftWidth: 3 }}
    >
      {/* Avatar */}
      <div
        className="avatar"
        style={{
          width: 44, height: 44, fontSize: 15, borderRadius: 14,
          background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)`,
          boxShadow: "0 4px 12px rgba(20,61,48,0.28)",
          flexShrink: 0,
        }}
      >
        {app.name?.[0]?.toUpperCase() || "?"}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, color: "#0F172A", lineHeight: 1.2 }}>
            {app.name}
          </p>
          <StatusBadge status={app.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>📱 {app.phone}</span>
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={10} /> {app.date}
          </span>
          <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
            {app.slot}
          </span>
          {app.reason && (
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📝 {app.reason}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {app.status === "pending" && (
          <>
            <motion.button
              onClick={onApprove}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", background: "#10B981", color: "white",
                borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 10,
                letterSpacing: "0.08em", textTransform: "uppercase",
                boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
              }}
            >
              <CheckCircle2 size={12} /> Accept
            </motion.button>
            <motion.button
              onClick={onReject}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 14px", background: "#FFF0F0", color: "#EF4444",
                borderRadius: 10, border: "1.5px solid #FEE2E2", cursor: "pointer",
                fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 10,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}
            >
              <XCircle size={12} /> Reject
            </motion.button>
          </>
        )}
        {app.status === "booked" && (
          <motion.button
            onClick={onCancelBooked}
            whileHover={{ scale: 1.06, background: "#EF4444", color: "white", borderColor: "#EF4444" }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "8px 14px", background: "#FFF0F0", color: "#EF4444",
              borderRadius: 10, border: "1.5px solid #FEE2E2", cursor: "pointer",
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 10,
              letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s",
            }}
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          onClick={onDelete}
          whileHover={{ scale: 1.06, background: "#EF4444", color: "white" }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 34, height: 34, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#FFF5F5", color: "#FDA4AF", border: "none", cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Trash2 size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
      background: `linear-gradient(160deg, ${PRIMARY} 0%, #0A2218 100%)`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(78,204,163,0.08), transparent 70%)",
        top: -200, right: -200, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.04), transparent 70%)",
        bottom: -100, left: -100, pointerEvents: "none",
      }} />

      {/* Logo mark */}
      <motion.div
        animate={{ scale: [1, 1.07, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 80, height: 80, borderRadius: 26,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 20px 48px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </motion.div>

      <div style={{ textAlign: "center" }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 900,
            fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4,
          }}
        >
          Cura
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", fontWeight: 700 }}
        >
          Syncing your dashboard
        </motion.p>
      </div>

      {/* Animated dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT }}
          />
        ))}
      </div>
    </div>
  );
}

// ── TOAST RENDERER ───────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  const icons    = { success: "✓", error: "✕", warning: "!", info: "i" };
  const colors   = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(24px)",
              borderRadius: 16,
              padding: "14px 20px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
              borderLeft: `3px solid ${colors[t.type] || PRIMARY}`,
              borderTop: "1px solid rgba(255,255,255,0.9)",
              display: "flex", alignItems: "center", gap: 12,
              maxWidth: 320, pointerEvents: "auto",
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: `${colors[t.type] || PRIMARY}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: colors[t.type] || PRIMARY,
              fontWeight: 900, fontSize: 12, fontFamily: "'Syne',sans-serif",
            }}>
              {icons[t.type] || "✓"}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", lineHeight: 1.4 }}>{t.msg}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-overlay" onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="modal-box" onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 6, -6, 0], y: [0, -4, 0] }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                width: 64, height: 64, borderRadius: 20,
                background: danger ? "#FEF2F2" : "#FFFBEB",
                border: `1.5px solid ${danger ? "#FECACA" : "#FDE68A"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, margin: "0 auto 22px",
                boxShadow: danger ? "0 8px 24px rgba(239,68,68,0.12)" : "0 8px 24px rgba(245,158,11,0.12)",
              }}
            >
              {danger ? "🗑️" : "⚠️"}
            </motion.div>

            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 21, textAlign: "center", marginBottom: 8, color: "#0F172A", letterSpacing: "-0.02em" }}>
              {title}
            </h2>
            <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 28, lineHeight: 1.65, fontWeight: 500 }}>
              {message}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <motion.button
                onClick={onCancel} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: "14px", background: "#F1F5F9", border: "none",
                  borderRadius: 14, fontWeight: 900, fontSize: 10, textTransform: "uppercase",
                  letterSpacing: "0.12em", cursor: "pointer", color: "#475569",
                  fontFamily: "'Syne',sans-serif", transition: "background 0.2s",
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: "14px",
                  background: danger ? "#EF4444" : PRIMARY,
                  border: "none", borderRadius: 14, fontWeight: 900, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  cursor: "pointer", color: "white", fontFamily: "'Syne',sans-serif",
                  boxShadow: danger ? "0 6px 20px rgba(239,68,68,0.32)" : "0 6px 20px rgba(20,61,48,0.32)",
                }}
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── PREMIUM STAT CARD ─────────────────────────────────────────────────────────
function StatCard({ label, val, icon, accent, bg, index }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8, rotateX: 2, rotateY: -1, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="pstat-card"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Glass sheen overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)",
        borderRadius: "inherit", pointerEvents: "none",
      }} />
      {/* Bottom accent */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accent}80, ${accent})`,
        borderRadius: "0 0 1.625rem 1.625rem",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          boxShadow: `0 4px 12px ${accent}20`,
        }}>
          {icon}
        </div>
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.12 + index * 0.07, type: "spring", stiffness: 420, damping: 20 }}
          style={{ fontSize: 28, fontFamily: "'Syne',sans-serif", fontWeight: 900, color: accent, lineHeight: 1 }}
        >
          {val}
        </motion.span>
      </div>
      <p className="section-label" style={{ fontSize: 9, letterSpacing: "0.3em" }}>{label}</p>
    </motion.div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const router = useRouter();
  const { toasts, show: toast } = useToast();
  const prefersReduced = useReducedMotion();

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [doctor,           setDoctor]           = useState(null);
  const [appointments,     setAppointments]     = useState([]);
  const [blockedSlots,     setBlockedSlots]     = useState([]);
  const [holidays,         setHolidays]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [activeTab,        setActiveTab]        = useState("Schedule");
  const [isMounted,        setIsMounted]        = useState(false);
  const [showProfileMenu,  setShowProfileMenu]  = useState(false);
  const profileRef = useRef(null);

  // Time modal
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [modalMode,       setModalMode]       = useState("global");
  const [overrideDate,    setOverrideDate]     = useState("");
  const [timeSettings,    setTimeSettings]     = useState({ start: "09:00", end: "19:00" });
  const [timeSaving,      setTimeSaving]       = useState(false);

  // Bookings
  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({ open: false });

  // Calendar
  const [calendarYear,  setCalendarYear]  = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const todayStr   = new Date().toISOString().split("T")[0];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  // ── LIFECYCLE ────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    fetchDoctorData();
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const id = setInterval(() => fetchDoctorData(true), 90_000);
    return () => clearInterval(id);
  }, []);

  // ── DATA FETCH ────────────────────────────────────────────────────────────
  const fetchDoctorData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: doc, error: docErr } = await supabase
        .from("doctors").select("*").eq("user_id", user.id).single();
      if (!doc || docErr) { router.push("/login"); return; }

      const { data: override } = await supabase
        .from("date_overrides").select("working_hours")
        .eq("doctor_id", doc.id).eq("date", todayStr).single();

      const [appRes, blockedRes, holidayRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("doctor_id", doc.id).order("date", { ascending: false }),
        supabase.from("blocked_slots").select("slot").eq("doctor_id", doc.id).eq("date", todayStr),
        supabase.from("doctor_holidays").select("date").eq("doctor_id", doc.id),
      ]);

      setAppointments(appRes.data || []);
      setBlockedSlots(blockedRes.data?.map((b) => b.slot) || []);
      setHolidays(holidayRes.data?.map((h) => h.date) || []);
      setDoctor({ ...doc, active_hours: override ? override.working_hours : doc.working_hours });
    } catch (err) {
      console.error("Sync Error:", err.message);
      if (!silent) toast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStr, router]);

  // ── SLOT GENERATOR ────────────────────────────────────────────────────────
  const generateSlots = (forDate = todayStr) => {
    const hours = doctor?.active_hours || doctor?.working_hours;
    if (!hours) return [];
    const [startStr, endStr] = hours.split(" - ");
    let current = new Date(`1970/01/01 ${startStr}`);
    const end   = new Date(`1970/01/01 ${endStr}`);
    const dur   = doctor?.slot_duration || 20;
    const slots = [];
    const isToday = forDate === todayStr;
    while (current < end) {
      const slotMinutes = current.getHours() * 60 + current.getMinutes();
      if (!isToday || slotMinutes > nowMinutes) {
        slots.push(current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
      }
      current.setMinutes(current.getMinutes() + dur);
    }
    return slots;
  };

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  async function toggleHoliday(dateStr) {
    if (!doctor) return;
    const isHoliday = holidays.includes(dateStr);
    try {
      if (isHoliday) {
        await supabase.from("doctor_holidays").delete().eq("doctor_id", doctor.id).eq("date", dateStr);
        setHolidays(holidays.filter((h) => h !== dateStr));
        toast(`Holiday removed for ${dateStr}`, "info");
      } else {
        await supabase.from("doctor_holidays").insert([{ doctor_id: doctor.id, date: dateStr }]);
        setHolidays([...holidays, dateStr]);
        toast(`${dateStr} marked as holiday`, "success");
      }
    } catch {
      toast("Failed to update holiday", "error");
    }
  }

  async function manageRequest(app, status) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", app.id);
    if (!error) {
      const label = status === "booked" ? "Appointment confirmed" : "Appointment rejected";
      toast(`${label} — ${app.name}`, status === "booked" ? "success" : "warning");
      try {
        await axios.post(`${BOT_API_URL}/notify-status-change`, {
          phone: app.phone, doctorName: doctor.name, doctorId: doctor.id,
          status, slot: app.slot, date: app.date,
        });
      } catch (_) {}
      fetchDoctorData(true);
    } else {
      toast("Failed to update appointment", "error");
    }
  }

  async function rejectAccepted(app) {
    setConfirmModal({
      open: true,
      title: "Cancel Appointment?",
      message: `This will notify ${app.name} to rebook a new slot.`,
      danger: true,
      onConfirm: () => {
        setConfirmModal({ open: false });
        manageRequest(app, "rejected");
      },
      onCancel: () => setConfirmModal({ open: false }),
    });
  }

  async function toggleSlotBlock(slotTime, isBlocked, bookedPatient) {
    if (!isBlocked && bookedPatient) {
      setConfirmModal({
        open: true,
        title: "Block Occupied Slot?",
        message: `${bookedPatient.name} is booked at this time. They will be notified to rebook.`,
        danger: true,
        onConfirm: async () => {
          setConfirmModal({ open: false });
          await manageRequest(bookedPatient, "rejected");
          await supabase.from("blocked_slots").insert([{ doctor_id: doctor.id, date: todayStr, slot: slotTime }]);
          fetchDoctorData(true);
          toast(`Slot ${slotTime} blocked`, "warning");
        },
        onCancel: () => setConfirmModal({ open: false }),
      });
      return;
    }
    try {
      if (isBlocked) {
        await supabase.from("blocked_slots").delete().eq("doctor_id", doctor.id).eq("date", todayStr).eq("slot", slotTime);
        toast(`Slot ${slotTime} unblocked`, "success");
      } else {
        await supabase.from("blocked_slots").insert([{ doctor_id: doctor.id, date: todayStr, slot: slotTime }]);
        toast(`Slot ${slotTime} blocked`, "warning");
      }
      fetchDoctorData(true);
    } catch {
      toast("Failed to update slot", "error");
    }
  }

  async function handleToggleField(field, value) {
    const { error } = await supabase.from("doctors").update({ [field]: !value }).eq("id", doctor.id);
    if (!error) {
      setDoctor({ ...doctor, [field]: !value });
      toast(`${field.replace(/_/g, " ")} ${!value ? "enabled" : "disabled"}`, !value ? "success" : "info");
    }
  }

  async function deleteBooking(id) {
    await supabase.from("appointments").delete().eq("id", id);
    setConfirmModal({ open: false });
    toast("Booking record deleted", "info");
    fetchDoctorData(true);
  }

  async function handleSlotDurationChange(e) {
    const val = parseInt(e.target.value);
    const { error } = await supabase.from("doctors").update({ slot_duration: val }).eq("id", doctor.id);
    if (!error) {
      setDoctor({ ...doctor, slot_duration: val });
      toast(`Slot duration set to ${val} min`, "success");
    }
  }

  const saveTimeSettings = async () => {
    const fmt = (t) => {
      const [h, m] = t.split(":");
      const hh = parseInt(h);
      return `${hh % 12 || 12}:${m} ${hh >= 12 ? "PM" : "AM"}`;
    };
    const newHours = `${fmt(timeSettings.start)} - ${fmt(timeSettings.end)}`;
    setTimeSaving(true);
    try {
      if (modalMode === "global") {
        await supabase.from("doctors").update({ working_hours: newHours }).eq("id", doctor.id);
        toast("Global shift hours updated", "success");
      } else {
        await supabase.from("date_overrides").upsert([{ doctor_id: doctor.id, date: overrideDate, working_hours: newHours }]);
        toast(`Override set for ${overrideDate}`, "success");
      }
      setIsTimeModalOpen(false);
      fetchDoctorData(true);
    } catch {
      toast("Failed to save hours", "error");
    } finally {
      setTimeSaving(false);
    }
  };

  // ── DERIVED STATE ─────────────────────────────────────────────────────────
  const stats = {
    today:     appointments.filter((a) => a.date === todayStr).length,
    pending:   appointments.filter((a) => a.status === "pending").length,
    total:     appointments.length,
    confirmed: appointments.filter((a) => a.status === "booked").length,
    rejected:  appointments.filter((a) => a.status === "rejected").length,
  };

  const filteredBookings = appointments.filter((a) => {
    const matchStatus = bookingFilter === "all" || a.status === bookingFilter;
    const matchSearch =
      !bookingSearch ||
      a.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      a.phone?.includes(bookingSearch);
    return matchStatus && matchSearch;
  });

  const getDaysInMonth    = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  const avatarInitials = doctor?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "Dr";

  const STAT_CARDS = [
    { label: "Today",     val: stats.today,     icon: "📄", accent: PRIMARY,     bg: "#f0f7f4" },
    { label: "Pending",   val: stats.pending,   icon: "⏳", accent: "#F59E0B",   bg: "#fffbeb" },
    { label: "Total",     val: stats.total,     icon: "📅", accent: "#3B82F6",   bg: "#eff6ff" },
    { label: "Confirmed", val: stats.confirmed, icon: "✅", accent: "#10B981",   bg: "#ecfdf5" },
    { label: "Rejected",  val: stats.rejected,  icon: "❌", accent: "#EF4444",   bg: "#fef2f2" },
  ];

  return (
    <div className="page-bg min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* Animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-4" />

      {/* ── PREMIUM NAV BAR ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass-nav-bar sticky top-0 z-50"
        style={{ padding: "0 28px", height: 64, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {/* Left: logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.08, rotate: -4 }}
            whileTap={{ scale: 0.93 }}
            className="nav-icon-btn"
            title="Back to Home"
          >
            <ArrowLeft size={15} />
          </motion.button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              style={{
                width: 36, height: 36, borderRadius: 11,
                boxShadow: "0 4px 14px rgba(20,61,48,0.32), 0 1px 0 rgba(255,255,255,0.2) inset",
                overflow: "hidden",
              }}
            >
              <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </motion.div>
            <div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 16, color: "#0F172A", lineHeight: 1, letterSpacing: "-0.02em" }}>
                Cura
              </p>
              <p style={{ fontSize: 8, letterSpacing: "0.35em", color: "#94A3B8", fontWeight: 900, textTransform: "uppercase", fontFamily: "'Syne',sans-serif" }}>
                Doctor Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Online status indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 12px", borderRadius: 999,
            background: doctor?.is_available ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${doctor?.is_available ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)"}`,
          }}>
            <span className={`status-dot ${doctor?.is_available ? "online" : "offline"}`} />
            <span style={{
              fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif",
              color: doctor?.is_available ? "#059669" : "#DC2626",
              textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              {doctor?.is_available ? "Online" : "Offline"}
            </span>
          </div>

          {/* Pending bell */}
          {stats.pending > 0 && (
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                position: "relative",
                width: 38, height: 38, borderRadius: 12,
                background: "#FFFBEB", border: "1px solid #FDE68A",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Bell size={15} color="#D97706" />
              <div className="notif-dot" style={{ background: "#F59E0B", width: 14, height: 14, fontSize: 8, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, borderRadius: "50%", border: "2px solid white" }}>
                {stats.pending}
              </div>
            </motion.div>
          )}

          {/* Refresh */}
          <motion.button
            onClick={() => fetchDoctorData(true)}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            className="nav-icon-btn"
          >
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw size={14} />
            </motion.div>
          </motion.button>

          {/* Profile avatar */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <motion.button
              onClick={() => setShowProfileMenu((v) => !v)}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)`,
                color: "white", fontFamily: "'Syne',sans-serif",
                fontWeight: 900, fontSize: 13, border: "none", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(20,61,48,0.28), 0 1px 0 rgba(255,255,255,0.18) inset",
              }}
            >
              {avatarInitials}
            </motion.button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    background: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                    borderRadius: 16, padding: "8px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8)",
                    minWidth: 200, zIndex: 100,
                  }}
                >
                  <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 4 }}>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: "#0F172A" }}>
                      Dr. {doctor?.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 2 }}>
                      {doctor?.department}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); setActiveTab("Settings"); }}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: 13, fontWeight: 600, color: "#475569",
                      transition: "background 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Settings size={14} /> Settings
                  </button>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: 13, fontWeight: 600, color: "#EF4444",
                      transition: "background 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 28px" }}>

        {/* ── STAT CARDS ─────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden" animate="show"
          variants={staggerContainer}
          style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 28 }}
        >
          {STAT_CARDS.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </motion.div>

        {/* ── TAB NAV ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 24, overflowX: "auto" }}
        >
          <div className="tab-nav" style={{ width: "fit-content" }}>
            {TABS.map((t) => (
              <motion.button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`tab-item${activeTab === t.key ? " active" : ""}`}
                whileHover={activeTab !== t.key ? { scale: 1.04 } : {}}
                whileTap={{ scale: 0.96 }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {t.icon}
                {t.label}
                {t.key === "Bookings" && stats.pending > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{
                      background: "#F59E0B", color: "white",
                      borderRadius: 999, padding: "1px 6px",
                      fontSize: 8, fontWeight: 900, lineHeight: 1.5,
                    }}
                  >
                    {stats.pending}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* ════ SCHEDULE TAB ══════════════════════════════════════════ */}
            {activeTab === "Schedule" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Holiday banner */}
                <AnimatePresence>
                  {holidays.includes(todayStr) && (
                    <motion.div
                      initial={{ opacity: 0, y: -12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      style={{
                        background: "linear-gradient(135deg, #FFFBEB, #FEF9EC)",
                        border: "1px solid #FDE68A",
                        borderRadius: 20, padding: "16px 22px",
                        display: "flex", alignItems: "center", gap: 14,
                        boxShadow: "0 4px 20px rgba(245,158,11,0.10)",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>🏖️</span>
                      <div>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, color: "#B45309", fontSize: 14 }}>
                          Today is your holiday
                        </p>
                        <p style={{ fontSize: 12, color: "#D97706", marginTop: 2, fontWeight: 500 }}>
                          No new appointments will be accepted by the bot today.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22, color: "#0F172A", letterSpacing: "-0.025em" }}>
                      Today's Appointments
                    </h2>
                    <p className="section-label" style={{ marginTop: 4 }}>
                      {appointments.filter((a) => a.date === todayStr).length} patient{appointments.filter((a) => a.date === todayStr).length !== 1 ? "s" : ""} scheduled
                    </p>
                  </div>
                  {stats.pending > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        padding: "8px 16px", borderRadius: 999,
                      }}
                    >
                      <span className="status-dot pending" />
                      <span style={{ fontSize: 10, fontWeight: 900, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Syne',sans-serif" }}>
                        {stats.pending} awaiting approval
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Appointment list */}
                {appointments.filter((a) => a.date === todayStr).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card empty-state"
                  >
                    <div className="empty-state-icon">🗓️</div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 13 }}>
                      No appointments today
                    </p>
                    <p style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 500, maxWidth: 280, textAlign: "center" }}>
                      Patients will appear here once the bot routes them to you
                    </p>
                  </motion.div>
                ) : (
                  <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {appointments
                      .filter((a) => a.date === todayStr)
                      .sort((a, b) => a.slot > b.slot ? 1 : -1)
                      .map((app) => (
                        <AppointmentRow
                          key={app.id} app={app}
                          onApprove={() => manageRequest(app, "booked")}
                          onReject={() => manageRequest(app, "rejected")}
                          onCancelBooked={() => rejectAccepted(app)}
                          onDelete={() =>
                            setConfirmModal({
                              open: true, title: "Delete Record?",
                              message: `${app.name} · ${app.date} · ${app.slot} — This cannot be undone.`,
                              danger: true,
                              onConfirm: () => deleteBooking(app.id),
                              onCancel: () => setConfirmModal({ open: false }),
                            })
                          }
                        />
                      ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* ════ BOOKINGS TAB ══════════════════════════════════════════ */}
            {activeTab === "Bookings" && (
              <div className="glass-card" style={{ overflow: "hidden", padding: 0 }}>
                {/* Filter bar */}
                <div style={{
                  padding: "18px 22px",
                  borderBottom: "1px solid rgba(20,61,48,0.06)",
                  display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
                  background: "rgba(248,250,249,0.8)",
                }}>
                  <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
                    <input
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      placeholder="Search name or phone…"
                      className="input-premium"
                      style={{ paddingLeft: 40, paddingRight: bookingSearch ? 36 : 16 }}
                    />
                    {bookingSearch && (
                      <button
                        onClick={() => setBookingSearch("")}
                        style={{
                          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          background: "none", border: "none", cursor: "pointer", color: "#94A3B8",
                          display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#475569"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#94A3B8"}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["all", "pending", "booked", "rejected"].map((f) => (
                      <motion.button
                        key={f}
                        onClick={() => setBookingFilter(f)}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        style={{
                          padding: "8px 16px", borderRadius: 10,
                          fontSize: 10, fontWeight: 900,
                          fontFamily: "'Syne',sans-serif",
                          textTransform: "uppercase", letterSpacing: "0.1em",
                          border: "none", cursor: "pointer",
                          transition: "all 0.2s",
                          background: bookingFilter === f ? PRIMARY : "rgba(20,61,48,0.06)",
                          color: bookingFilter === f ? "white" : "#94A3B8",
                          boxShadow: bookingFilter === f ? "0 4px 14px rgba(20,61,48,0.28)" : "none",
                        }}
                      >
                        {f}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div>
                  {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 13 }}>
                        No bookings found
                      </p>
                    </div>
                  ) : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="show">
                      {filteredBookings.map((app) => (
                        <motion.div
                          key={app.id}
                          variants={fadeUp}
                          style={{
                            padding: "16px 22px",
                            display: "flex", alignItems: "center", gap: 14,
                            borderBottom: "1px solid rgba(20,61,48,0.04)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(20,61,48,0.02)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <div style={{
                            width: 42, height: 42, borderRadius: 13,
                            background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontSize: 14, fontWeight: 900, flexShrink: 0,
                            boxShadow: "0 4px 12px rgba(20,61,48,0.25)",
                          }}>
                            {app.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div style={{ minWidth: 140 }}>
                            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, color: "#0F172A" }}>{app.name}</p>
                            <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 2 }}>📱 {app.phone}</p>
                          </div>
                          <div className="hidden-sm">
                            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: "#1E293B" }}>{app.date}</p>
                            <p className="section-label" style={{ marginTop: 2 }}>{app.slot}</p>
                          </div>
                          {app.reason && (
                            <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              📝 {app.reason}
                            </p>
                          )}
                          <StatusBadge status={app.status} />
                          <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
                            {app.status === "pending" && (
                              <>
                                <motion.button
                                  onClick={() => manageRequest(app, "booked")}
                                  whileHover={{ scale: 1.06, background: "#059669" }}
                                  whileTap={{ scale: 0.95 }}
                                  style={{ padding: "7px 13px", background: "#10B981", color: "white", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.2s", boxShadow: "0 3px 10px rgba(16,185,129,0.28)" }}
                                >
                                  Accept
                                </motion.button>
                                <motion.button
                                  onClick={() => manageRequest(app, "rejected")}
                                  whileHover={{ scale: 1.06, background: "#EF4444", color: "white", borderColor: "#EF4444" }}
                                  whileTap={{ scale: 0.95 }}
                                  style={{ padding: "7px 13px", background: "#FFF0F0", color: "#EF4444", borderRadius: 9, border: "1.5px solid #FEE2E2", cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.2s" }}
                                >
                                  Reject
                                </motion.button>
                              </>
                            )}
                            {app.status === "booked" && (
                              <motion.button
                                onClick={() => rejectAccepted(app)}
                                whileHover={{ scale: 1.06, background: "#EF4444", color: "white", borderColor: "#EF4444" }}
                                whileTap={{ scale: 0.95 }}
                                style={{ padding: "7px 13px", background: "#FFF0F0", color: "#EF4444", borderRadius: 9, border: "1.5px solid #FEE2E2", cursor: "pointer", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", transition: "all 0.2s" }}
                              >
                                Cancel
                              </motion.button>
                            )}
                            <motion.button
                              onClick={() => setConfirmModal({ open: true, title: "Delete Record?", message: `${app.name} · ${app.date} · ${app.slot}`, danger: true, onConfirm: () => deleteBooking(app.id), onCancel: () => setConfirmModal({ open: false }) })}
                              whileHover={{ scale: 1.08, background: "#EF4444", color: "white" }}
                              whileTap={{ scale: 0.93 }}
                              style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF5F5", color: "#FDA4AF", border: "none", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                            >
                              <Trash2 size={13} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Footer summary */}
                <div style={{
                  padding: "14px 22px",
                  borderTop: "1px solid rgba(20,61,48,0.06)",
                  display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center",
                  background: "rgba(248,250,249,0.6)",
                }}>
                  {[
                    { label: "Showing",   val: filteredBookings.length },
                    { label: "Confirmed", val: filteredBookings.filter((a) => a.status === "booked").length, color: "#10B981" },
                    { label: "Pending",   val: filteredBookings.filter((a) => a.status === "pending").length, color: "#F59E0B" },
                    { label: "Rejected",  val: filteredBookings.filter((a) => a.status === "rejected").length, color: "#EF4444" },
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="section-label">{s.label}:</span>
                      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, color: s.color || "#0F172A" }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ HOLIDAYS TAB ══════════════════════════════════════════ */}
            {activeTab === "Holidays" && (
              <div style={{ maxWidth: 520, margin: "0 auto" }}>
                <div className="glass-card" style={{ padding: "2.25rem" }}>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22, color: "#0F172A", letterSpacing: "-0.025em", marginBottom: 4 }}>
                    Holiday Calendar
                  </h2>
                  <p className="section-label" style={{ marginBottom: 28 }}>Tap any future date to mark / unmark as holiday</p>

                  {/* Month nav */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <motion.button
                      whileHover={{ scale: 1.08, background: "rgba(20,61,48,0.08)" }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }}
                      style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(20,61,48,0.08)", background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B", transition: "all 0.2s" }}
                    >
                      <ChevronLeft size={18} />
                    </motion.button>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 20, color: PRIMARY, letterSpacing: "-0.02em" }}>
                        {MONTH_NAMES[calendarMonth]}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginTop: 1 }}>{calendarYear}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.08, background: "rgba(20,61,48,0.08)" }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }}
                      style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(20,61,48,0.08)", background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B", transition: "all 0.2s" }}
                    >
                      <ChevronRight size={18} />
                    </motion.button>
                  </div>

                  {/* Day labels */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                      <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 900, fontFamily: "'Syne',sans-serif", color: "#94A3B8", letterSpacing: "0.12em", padding: "6px 0", textTransform: "uppercase" }}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {Array.from({ length: getFirstDayOfMonth(calendarYear, calendarMonth) }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: getDaysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                      const day     = i + 1;
                      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isHol   = holidays.includes(dateStr);
                      const isToday = dateStr === todayStr;
                      const isPast  = dateStr < todayStr;
                      return (
                        <motion.button
                          key={day}
                          onClick={() => !isPast && toggleHoliday(dateStr)}
                          whileHover={!isPast ? { scale: 1.12 } : {}}
                          whileTap={!isPast ? { scale: 0.92 } : {}}
                          className={`calendar-day ${isHol ? "is-holiday" : ""} ${isToday ? "is-today" : ""} ${isPast ? "is-past" : ""}`}
                          style={{
                            border: isToday && !isHol ? `2px solid ${PRIMARY}` : "none",
                            ...(isHol ? { background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)` } : {}),
                          }}
                        >
                          {day}
                          {isHol && <span style={{ fontSize: 8 }}>🌴</span>}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", gap: 20, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(20,61,48,0.06)" }}>
                    {[
                      { color: PRIMARY, label: "Holiday" },
                      { color: "transparent", border: `2px solid ${PRIMARY}`, label: "Today" },
                      { color: "#E2E8F0", label: "Available" },
                    ].map(({ color, border, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 4, background: color, border: border || `1px solid rgba(20,61,48,0.1)` }} />
                        <span className="section-label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════ CONFIG TAB ════════════════════════════════════════════ */}
            {activeTab === "Config" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 1100, margin: "0 auto" }}>
                {/* Slot manager */}
                <div className="glass-card" style={{ padding: "1.75rem", gridColumn: "1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 16, color: "#0F172A", letterSpacing: "-0.02em" }}>
                        Slot Manager
                      </h3>
                      <p className="section-label" style={{ marginTop: 4 }}>Today — Click to block / unblock</p>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { color: "rgba(20,61,48,0.08)", label: "Free" },
                        { color: PRIMARY, label: "Booked" },
                        { color: "#FECACA", label: "Blocked" },
                      ].map(({ color, label }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                          <span className="section-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {generateSlots().length === 0 ? (
                    <div className="empty-state" style={{ padding: "3rem 1rem" }}>
                      <div className="empty-state-icon" style={{ width: 60, height: 60, fontSize: 24 }}>⏰</div>
                      <p className="section-label">No more slots today</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, maxHeight: 480, overflowY: "auto" }} className="custom-scrollbar">
                      {generateSlots().map((slot, i) => {
                        const booked    = appointments.find((a) => a.slot === slot && a.date === todayStr && a.status !== "rejected");
                        const isBlocked = blockedSlots.includes(slot);
                        return (
                          <motion.button
                            key={slot}
                            onClick={() => toggleSlotBlock(slot, isBlocked, booked)}
                            whileHover={!isBlocked ? { scale: 1.06, y: -2 } : {}}
                            whileTap={{ scale: 0.94 }}
                            className={`slot-btn ${isBlocked ? "blocked" : booked ? "booked" : "free"}`}
                            title={booked ? `Booked: ${booked.name}` : isBlocked ? "Blocked" : "Available"}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                          >
                            {slot}
                            <br />
                            <span style={{ fontSize: 8 }}>{isBlocked ? "🚫" : booked ? "👤" : "✓"}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Bot data collection */}
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15, color: "#0F172A", letterSpacing: "-0.02em" }}>
                      Bot Data Collection
                    </h3>
                    <p className="section-label" style={{ marginTop: 3, marginBottom: 16 }}>Registration Fields</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { label: "Patient Age",        sub: "Dynamic field", key: "requires_age",    val: doctor?.requires_age },
                        { label: "Visit Reason",        sub: "Dynamic field", key: "requires_reason", val: doctor?.requires_reason },
                        { label: "Insurance Provider",  sub: "Dynamic field", key: "requires_ins",    val: doctor?.requires_ins },
                        { label: "Patient Type",        sub: "Mandatory",     key: null,              val: true, fixed: true },
                      ].map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "12px 14px", background: "rgba(248,250,249,0.8)",
                            borderRadius: 14, border: "1px solid rgba(20,61,48,0.06)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => !f.fixed && (e.currentTarget.style.background = "rgba(20,61,48,0.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(248,250,249,0.8)")}
                        >
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 13, color: "#1E293B" }}>{f.label}</p>
                            <p className="section-label" style={{ marginTop: 2 }}>{f.sub}</p>
                          </div>
                          <label style={{ opacity: f.fixed ? 0.4 : 1, pointerEvents: f.fixed ? "none" : "auto", cursor: f.fixed ? "default" : "pointer" }}>
                            <input type="checkbox" checked={!!f.val} onChange={() => f.key && handleToggleField(f.key, f.val)} style={{ display: "none" }} />
                            <div className={`toggle-track ${f.val ? "on" : ""}`} onClick={() => f.key && handleToggleField(f.key, f.val)}>
                              <div className="toggle-thumb" />
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slot duration */}
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15, color: "#0F172A", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                      Slot Duration
                    </h3>
                    <p className="section-label" style={{ marginTop: 3 }}>Per appointment</p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: PRIMARY, fontFamily: "'Syne',sans-serif", margin: "10px 0 14px" }}>
                      ≈ {Math.floor(600 / (doctor?.slot_duration || 20))} slots per 10-hour day
                    </p>
                    <select
                      value={doctor?.slot_duration || 20}
                      onChange={handleSlotDurationChange}
                      className="input-base"
                      style={{ cursor: "pointer", marginBottom: 14, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                    >
                      {[10,15,20,25,30,45,60].map((v) => (
                        <option key={v} value={v}>{v} min{v === 20 ? " — Standard" : v <= 15 ? " — Quick" : v >= 45 ? " — Extended" : ""}</option>
                      ))}
                    </select>
                    {/* Preview */}
                    <p className="section-label" style={{ marginBottom: 8 }}>Preview (first 4 slots)</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                      {(() => {
                        const hours    = doctor?.active_hours || doctor?.working_hours || "09:00 AM - 07:00 PM";
                        const [startStr] = hours.split(" - ");
                        let cur = new Date(`1970/01/01 ${startStr}`);
                        const dur = doctor?.slot_duration || 20;
                        return Array.from({ length: 4 }).map((_, i) => {
                          const label = cur.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
                          cur = new Date(cur.getTime() + dur * 60000);
                          return (
                            <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 10, fontSize: 10, fontWeight: 900, color: "#64748B", background: "rgba(20,61,48,0.05)", border: "1px solid rgba(20,61,48,0.08)", fontFamily: "'Syne',sans-serif" }}>
                              {label}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Global shift */}
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15, color: "#0F172A", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                      Global Shift
                    </h3>
                    <p className="section-label" style={{ marginTop: 3 }}>Mon — Fri, every week</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: PRIMARY, fontFamily: "'Syne',sans-serif", margin: "10px 0 16px" }}>
                      {doctor?.working_hours || "09:00 AM - 07:00 PM"}
                    </p>
                    <motion.button
                      onClick={() => { setModalMode("global"); setIsTimeModalOpen(true); }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="btn-primary"
                      style={{ width: "100%", fontSize: 10, padding: "13px" }}
                    >
                      <Edit3 size={12} /> Update Shift Time
                    </motion.button>
                  </div>

                  {/* Date override */}
                  <div className="glass-card" style={{ padding: "1.5rem", borderTop: `3px solid ${PRIMARY}` }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15, color: "#0F172A", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                      Date Override
                    </h3>
                    <p className="section-label" style={{ marginTop: 3, marginBottom: 14 }}>Custom hours for one specific day</p>
                    <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} min={todayStr} className="input-base" style={{ marginBottom: 12 }} />
                    <motion.button
                      disabled={!overrideDate}
                      onClick={() => { setModalMode("override"); setIsTimeModalOpen(true); }}
                      whileHover={overrideDate ? { scale: 1.02 } : {}}
                      whileTap={overrideDate ? { scale: 0.97 } : {}}
                      className="btn-primary"
                      style={{ width: "100%", fontSize: 10, padding: "13px", opacity: overrideDate ? 1 : 0.35, cursor: overrideDate ? "pointer" : "not-allowed" }}
                    >
                      <Zap size={12} /> Set Hours for This Date
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* ════ SETTINGS TAB ══════════════════════════════════════════ */}
            {activeTab === "Settings" && (
              <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Profile card */}
                <motion.div variants={fadeUp} className="glass-card" style={{ padding: "2.25rem" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#0F172A", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 22 }}>
                    Profile
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
                    <motion.div
                      whileHover={{ scale: 1.06, rotate: 2 }}
                      style={{
                        width: 68, height: 68, borderRadius: 22,
                        background: `linear-gradient(135deg, ${PRIMARY}, #1C5240)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, fontWeight: 900, color: "white",
                        fontFamily: "'Syne',sans-serif",
                        boxShadow: "0 8px 28px rgba(20,61,48,0.30), 0 1px 0 rgba(255,255,255,0.18) inset",
                      }}
                    >
                      {avatarInitials}
                    </motion.div>
                    <div>
                      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 20, color: "#0F172A", letterSpacing: "-0.025em" }}>
                        Dr. {doctor?.name}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500, marginTop: 3 }}>{doctor?.department}</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: PRIMARY, marginTop: 3, fontFamily: "'Syne',sans-serif" }}>{doctor?.email}</p>
                      {doctor?.phone && <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginTop: 2 }}>📱 +{doctor?.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Room Number</label>
                    <input
                      placeholder="e.g. 204"
                      value={doctor?.room_number || ""}
                      onChange={(e) => setDoctor({ ...doctor, room_number: e.target.value })}
                      onBlur={async () => {
                        await supabase.from("doctors").update({ room_number: doctor.room_number }).eq("id", doctor.id);
                        toast("Room number saved", "success");
                      }}
                      className="input-premium"
                    />
                    <p style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600, marginTop: 6, marginLeft: 2 }}>Auto-saves on blur</p>
                  </div>
                </motion.div>

                {/* Availability */}
                <motion.div variants={fadeUp} className="glass-card" style={{ padding: "2.25rem" }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#0F172A", textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 18 }}>
                    Availability
                  </h3>
                  <motion.button
                    onClick={() => handleToggleField("is_available", doctor?.is_available)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", padding: "18px 24px",
                      borderRadius: 18, border: "none", cursor: "pointer",
                      fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                      transition: "all 0.3s",
                      background: doctor?.is_available
                        ? "linear-gradient(135deg, #10B981, #059669)"
                        : "rgba(20,61,48,0.06)",
                      color: doctor?.is_available ? "white" : "#94A3B8",
                      boxShadow: doctor?.is_available ? "0 8px 28px rgba(16,185,129,0.32)" : "none",
                    }}
                  >
                    <span className={`status-dot ${doctor?.is_available ? "online" : "offline"}`} />
                    {doctor?.is_available ? "Online — Click to Go Offline" : "Offline — Click to Go Online"}
                  </motion.button>
                  <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, textAlign: "center", marginTop: 14 }}>
                    {doctor?.is_available
                      ? "Bot is actively routing patients to you"
                      : "Bot will not send new patients to your queue"}
                  </p>
                </motion.div>

                {/* Danger zone */}
                <motion.div
                  variants={fadeUp}
                  style={{
                    background: "linear-gradient(135deg, #FFF5F5, #FEF2F2)",
                    border: "1px solid #FECACA",
                    borderRadius: 28, padding: "2.25rem", textAlign: "center",
                    boxShadow: "0 4px 20px rgba(239,68,68,0.06)",
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ display: "inline-flex" }}
                  >
                    <AlertTriangle size={26} color="#F87171" />
                  </motion.div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#DC2626", textTransform: "uppercase", letterSpacing: "-0.01em", margin: "10px 0 6px" }}>
                    Danger Zone
                  </p>
                  <p className="section-label" style={{ color: "#F87171", marginBottom: 24 }}>Sign out of all Cura systems</p>
                  <motion.button
                    onClick={() =>
                      setConfirmModal({
                        open: true, title: "Sign Out?",
                        message: "You will be logged out of the Cura Doctor Portal.",
                        danger: false,
                        onConfirm: async () => { await supabase.auth.signOut(); router.push("/login"); },
                        onCancel: () => setConfirmModal({ open: false }),
                      })
                    }
                    whileHover={{ scale: 1.04, background: "#EF4444", color: "white", borderColor: "#EF4444", boxShadow: "0 8px 24px rgba(239,68,68,0.28)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 10,
                      padding: "12px 28px",
                      background: "white", color: "#EF4444",
                      border: "1.5px solid #FECACA",
                      borderRadius: 14,
                      fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.12em",
                      cursor: "pointer", transition: "all 0.22s",
                    }}
                  >
                    <LogOut size={14} /> Sign Out Cura
                  </motion.button>
                </motion.div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── TIME MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isTimeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setIsTimeModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="modal-box" onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: "linear-gradient(135deg, rgba(20,61,48,0.06), rgba(78,204,163,0.10))",
                  border: "1.5px solid rgba(20,61,48,0.10)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, margin: "0 auto 22px",
                  boxShadow: "0 8px 24px rgba(20,61,48,0.10)",
                }}
              >
                ⏰
              </motion.div>

              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22, textAlign: "center", marginBottom: 6, color: "#0F172A", letterSpacing: "-0.025em" }}>
                {modalMode === "global" ? "Global Shift Hours" : `Override: ${overrideDate}`}
              </h2>
              <p className="section-label" style={{ textAlign: "center", display: "block", marginBottom: 28 }}>
                {modalMode === "global" ? "Applies Mon – Fri every week" : "Applies to this date only"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[["start","Start Time"],["end","End Time"]].map(([key, label]) => (
                  <div key={key}>
                    <label className="field-label">{label}</label>
                    <input
                      type="time"
                      value={timeSettings[key]}
                      onChange={(e) => setTimeSettings({ ...timeSettings, [key]: e.target.value })}
                      className="input-premium"
                    />
                  </div>
                ))}
              </div>

              <motion.button
                onClick={saveTimeSettings}
                disabled={timeSaving}
                whileHover={!timeSaving ? { scale: 1.02 } : {}}
                whileTap={!timeSaving ? { scale: 0.97 } : {}}
                className="btn-primary"
                style={{ width: "100%", padding: "15px", borderRadius: 14, marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {timeSaving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : "Save Clinic Hours"}
              </motion.button>

              <button
                onClick={() => setIsTimeModalOpen(false)}
                style={{
                  width: "100%", padding: "11px", background: "none", border: "none",
                  cursor: "pointer", color: "#CBD5E1", fontSize: 10, fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "0.2em",
                  fontFamily: "'Syne',sans-serif", marginTop: 8,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => e.target.style.color = "#94A3B8"}
                onMouseLeave={(e) => e.target.style.color = "#CBD5E1"}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM MODAL ─────────────────────────────────────────────────── */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />

      {/* ── TOASTS ────────────────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}