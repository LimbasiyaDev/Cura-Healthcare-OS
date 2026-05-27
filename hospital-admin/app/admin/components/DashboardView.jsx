"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble, Calendar, TrendingUp, UserPlus, CalendarPlus,
  FileText, Pill, MoreHorizontal, ChevronRight, ArrowUpRight, Globe, Plus
} from "lucide-react";
import { motion } from "framer-motion";

/* ─── mini line chart ──────────────────────────────────────────────────────── */
function MiniChart({ data = [], color = "#143D30", height = 80, labels = [] }) {
  if (!data.length || data.length < 2) return <div style={{ height }} />;
  const max = Math.max(...data, 1), min = Math.min(...data);
  const range = max - min || 1;
  const w = 300, h = height - 22;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((v - min) / range) * (h - 10) }));
  const area = `M${pts[0].x},${pts[0].y} ${pts.slice(1).map(p => `L${p.x},${p.y}`).join(" ")} L${w},${h} L0,${h} Z`;
  const line = `M${pts[0].x},${pts[0].y} ${pts.slice(1).map(p => `L${p.x},${p.y}`).join(" ")}`;
  const id = `g${color.replace(/[^a-z0-9]/gi, "").slice(0, 6)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 22}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />)}
      {labels.map((lbl, i) => (
        <text key={i} x={(i / (labels.length - 1)) * w} y={h + 17}
          textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="'Syne',sans-serif" fontWeight="700">{lbl}</text>
      ))}
    </svg>
  );
}

/* ─── status badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    booked:    { bg: "#ECFDF5", color: "#059669", label: "Completed" },
    completed: { bg: "#ECFDF5", color: "#059669", label: "Completed" },
    pending:   { bg: "#EFF6FF", color: "#2563EB", label: "In Progress" },
    urgent:    { bg: "#FEF2F2", color: "#DC2626", label: "Urgent" },
    rejected:  { bg: "#FEF2F2", color: "#DC2626", label: "Cancelled" },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, fontFamily: "'Syne',sans-serif" }}>
      {c.label}
    </span>
  );
}

/* ─── avatar ───────────────────────────────────────────────────────────────── */
function Av({ name, size = 36, bg = "#143D30" }) {
  const ini = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{ width: size, height: size, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: size * 0.35, flexShrink: 0 }}>
      {ini}
    </div>
  );
}

const AVG_REVENUE_PER_APPT = 850;
const WEEK_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const BG_COLORS = ["#143D30", "#1E40AF", "#7C3AED", "#D97706", "#059669", "#DC2626", "#0891B2"];

/* ══════════════════════════════════════════════════════════════════════════════
   DASHBOARD VIEW
══════════════════════════════════════════════════════════════════════════════ */
export default function DashboardView({ hospitals, doctors, appointments, activeHospital, onNavigate, showToast }) {
  const router = useRouter();
  const [revenueRange, setRevenueRange] = useState("Weekly");

  const today = new Date().toISOString().split("T")[0];
  const now   = new Date();

  /* filter to active hospital */
  const hospDoctors = doctors.filter(d => d.hospital_id === activeHospital?.id);
  const hospAppts   = appointments.filter(a => {
    const doc = doctors.find(d => d.id === a.doctor_id);
    return doc?.hospital_id === activeHospital?.id;
  });

  /* bed occupancy */
  const availDocs   = hospDoctors.filter(d => d.is_available).length;
  const pendingAppt = hospAppts.filter(a => a.status === "pending").length;
  const bedOccupied = Math.min(availDocs * 7 + pendingAppt * 2, 130);
  const bedTotal    = 160;
  const bedPct      = Math.round((bedOccupied / bedTotal) * 100);

  /* today appointments */
  const todayAppts = hospAppts.filter(a => a.date === today).length;

  /* revenue chart — current week only (Mon–Sun) */
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeekAppts = hospAppts.filter(a => {
    const dd = new Date(a.created_at);
    return !isNaN(dd) && dd >= startOfWeek;
  });
  const weeklyData = WEEK_LABELS.map((_, i) => {
    // i=0 is Monday; JS getDay(): 0=Sun,1=Mon,...6=Sat
    const dayOfWeek = (i + 1) % 7;
    const count = thisWeekAppts.filter(a => {
      const dd = new Date(a.created_at);
      return !isNaN(dd) && dd.getDay() === dayOfWeek;
    }).length;
    return count * AVG_REVENUE_PER_APPT;
  });
  const monthlyData = Array.from({ length: 30 }, (_, i) => {
    const dd = new Date(now); dd.setDate(dd.getDate() - 29 + i);
    const key = dd.toISOString().split("T")[0];
    return hospAppts.filter(a => a.created_at?.startsWith(key)).length * AVG_REVENUE_PER_APPT;
  });

  const chartData    = revenueRange === "Weekly" ? weeklyData : monthlyData;
  const revenueTotal = chartData.reduce((s, v) => s + v, 0);

  function fmt(n) {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  }

  /* recent activity (last 6) */
  const recent = hospAppts.slice(0, 6);

  /* on-call team */
  const onCall = hospDoctors.filter(d => d.is_available).slice(0, 3);

  /* quick actions */
  const quickActions = [
    { label: "New Patient", Icon: UserPlus,    onClick: () => onNavigate?.("historical") },
    { label: "Schedule",    Icon: CalendarPlus, onClick: () => onNavigate?.("historical") },
    { label: "Reports",     Icon: FileText,     onClick: () => window.print() },
    { label: "Pharmacy",    Icon: Pill,         onClick: () => showToast("Pharmacy Inventory: Sync Active", "success") },
  ];

  return (
    <>
      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 32, color: "#114734", letterSpacing: "-0.04em", marginBottom: 6 }}>Clinical Overview</h1>
          <p style={{ fontSize: 13.5, color: "#64748B", fontWeight: 500 }}>Real-time performance metrics for {activeHospital?.name || "your hospital"}.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "ONBOARD PHARMACY", path: "/admin/onboard/pharmacy" },
            { label: "ONBOARD LABORATORY", path: "/admin/onboard/laboratory" },
            { label: "ONBOARD SPECIALIST", path: "/admin/onboard/specialist" }
          ].map((btn, idx) => (
            <motion.button key={idx} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push(btn.path)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderRadius: 12,
                background: "#143D30", color: "white", border: "none", cursor: "pointer",
                fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.06em",
                boxShadow: "0 8px 24px rgba(20,61,48,0.25)"
              }}>
              <Plus size={14} style={{ opacity: 0.8 }} />
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Bed Occupancy */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "white", borderRadius: 24, padding: "26px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#F1F7F4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "auto" }}>
            <Globe size={20} color="#143D30" />
          </div>
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94A3B8", fontFamily: "'Syne',sans-serif", margin: "0 0 10px" }}>BED OCCUPANCY</p>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 40, color: "#143D30", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 16 }}>
              {bedOccupied}<span style={{ fontSize: 20, fontWeight: 700, color: "#94A3B8" }}>/{bedTotal}</span>
            </p>
            <div style={{ height: 6, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${bedPct}%`, background: bedPct >= 80 ? "#EF4444" : "#143D30", borderRadius: 999 }} />
            </div>
          </div>
        </motion.div>

        {/* Weekly Revenue */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "white", borderRadius: 24, padding: "26px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94A3B8", fontFamily: "'Syne',sans-serif" }}>REVENUE</p>
          </div>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 32, color: "#143D30", letterSpacing: "-0.04em", marginBottom: "auto" }}>{fmt(revenueTotal)}</p>
          <div style={{ marginTop: 16 }}>
            <MiniChart data={chartData} color="#143D30" height={60} labels={revenueRange === "Weekly" ? WEEK_LABELS : []} />
          </div>
        </motion.div>

        {/* Total Appointments */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: "white", borderRadius: 24, padding: "26px", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#F1F7F4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "auto" }}>
            <Calendar size={20} color="#143D30" />
          </div>
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94A3B8", fontFamily: "'Syne',sans-serif", marginBottom: 10 }}>TOTAL APPOINTMENTS</p>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 40, color: "#143D30", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 16 }}>{hospAppts.length.toLocaleString()}</p>
            <div style={{ display: "inline-flex", alignItems: "center", background: "#ECFDF5", color: "#059669", padding: "6px 12px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: "0.02em" }}>
              {todayAppts} New Today
            </div>
          </div>
        </motion.div>

        {/* On-Call Team Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: "#143D30", borderRadius: 24, padding: "26px", boxShadow: "0 12px 32px rgba(20,61,48,0.25)", color: "white", display: "flex", flexDirection: "column" }}>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 10.5, letterSpacing: "0.15em", color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>ON-CALL TEAM</p>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {onCall.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>No doctors online</p>
            ) : (
              <div style={{ width: "100%", background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Av name={onCall[0].name} size={38} bg="rgba(255,255,255,0.2)" />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 13, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Syne',sans-serif" }}>Dr. {onCall[0].name}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginTop: 2 }}>{onCall[0].department}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM ROW ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 17, color: "#114734" }}>Recent Activity</span>
          <button onClick={() => onNavigate?.("historical")} style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            View All <ChevronRight size={14} />
          </button>
        </div>

        {/* table head */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr", gap: 8, padding: "12px 28px", background: "#FAFAFA", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
          {["PATIENT", "TYPE", "DATE", "STATUS", "ACTION"].map(h => (
            <span key={h} style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94A3B8", fontFamily: "'Syne',sans-serif" }}>{h}</span>
          ))}
        </div>

        {/* table body */}
        {recent.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center", color: "#94A3B8", fontSize: 14, fontWeight: 600 }}>No appointments yet</div>
        ) : recent.map((appt, i) => {
          const doc = doctors.find(d => d.id === appt.doctor_id);
          const typeMap = { booked: "Check-up", pending: "Consultation", rejected: "Cancelled" };
          const type = typeMap[appt.status] || doc?.department || "Appointment";
          const dateStr = appt.date ? new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
          return (
            <div key={appt.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr", gap: 8, padding: "18px 28px", alignItems: "center", borderBottom: i < recent.length - 1 ? "1px solid rgba(0,0,0,0.03)" : "none", cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Av name={appt.name} size={38} bg={BG_COLORS[i % BG_COLORS.length]} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0F172A", lineHeight: 1.2 }}>{appt.name || "—"} {appt.patient_uid && <span style={{ fontSize: 10, color: "#10B981" }}>#{appt.patient_uid}</span>}</div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginTop: 2 }}>{doc?.department || "Pathology"}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>{type}</span>
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>{dateStr}</span>
              <div>
                <StatusBadge status={appt.status} />
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#CBD5E1", display: "flex", alignItems: "center" }}>
                <MoreHorizontal size={18} />
              </button>
            </div>
          );
        })}
      </motion.div>
    </>
  );
}
