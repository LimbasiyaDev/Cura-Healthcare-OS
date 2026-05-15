"use client";
import { useState } from "react";
import {
  BedDouble, Calendar, TrendingUp, UserPlus, CalendarPlus,
  FileText, Pill, MoreHorizontal, ChevronRight, ArrowUpRight
} from "lucide-react";

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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 30, color: "#0F172A", letterSpacing: "-0.04em", marginBottom: 4 }}>Clinical Overview</h1>
        <p style={{ fontSize: 13.5, color: "#64748B" }}>Real-time performance metrics for {activeHospital?.name || "your hospital"}.</p>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────────────── */}
      {/* ── STAT CARDS ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1.2fr", gap: 16, marginBottom: 20 }}>

        {/* Bed Occupancy */}
        <div style={{ background: "white", borderRadius: 20, padding: "22px 22px 18px", border: "1px solid rgba(20,61,48,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: "#EAF2EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BedDouble size={19} color="#143D30" />
            </div>
          </div>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94A3B8", fontFamily: "'Syne',sans-serif", margin: "14px 0 6px" }}>BED OCCUPANCY</p>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 32, color: "#0F172A", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 14 }}>
            {bedOccupied}<span style={{ fontSize: 18, fontWeight: 600, color: "#94A3B8" }}>/{bedTotal}</span>
          </p>
          <div style={{ height: 5, background: "#E8EFEB", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${bedPct}%`, background: bedPct >= 80 ? "#EF4444" : "#143D30", borderRadius: 999 }} />
          </div>
        </div>

        {/* Weekly Revenue */}
        <div style={{ background: "white", borderRadius: 20, padding: "22px 22px 14px", border: "1px solid rgba(20,61,48,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94A3B8", fontFamily: "'Syne',sans-serif" }}>REVENUE</p>
          </div>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 28, color: "#0F172A", letterSpacing: "-0.04em", marginBottom: 6 }}>{fmt(revenueTotal)}</p>
          <MiniChart data={chartData} color="#143D30" height={70} labels={revenueRange === "Weekly" ? WEEK_LABELS : []} />
        </div>

        {/* Total Appointments */}
        <div style={{ background: "white", borderRadius: 20, padding: "22px 22px 18px", border: "1px solid rgba(20,61,48,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "#EAF2EE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Calendar size={19} color="#143D30" />
          </div>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94A3B8", fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>TOTAL APPOINTMENTS</p>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 32, color: "#0F172A", letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 10 }}>{hospAppts.length.toLocaleString()}</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EAF2EE", color: "#143D30", padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
            {todayAppts} New Today
          </div>
        </div>

        {/* On-Call Team Card */}
        <div style={{ background: "#143D30", borderRadius: 20, padding: "20px 18px", boxShadow: "0 8px 32px rgba(20,61,48,0.22)", color: "white" }}>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, color: "white", marginBottom: 12, letterSpacing: "0.05em" }}>ON-CALL TEAM</p>
          {onCall.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>No doctors online</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {onCall.slice(0, 2).map((doc) => (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Av name={doc.name} size={30} bg="rgba(255,255,255,0.15)" />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 11, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Dr. {doc.name}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{doc.department}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Recent Activity - Now Full Width */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(20,61,48,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px", borderBottom: "1px solid #F1F7F3" }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "#0F172A" }}>Recent Activity</span>
            <button onClick={() => onNavigate?.("historical")} style={{ fontSize: 12, fontWeight: 700, color: "#143D30", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: "'Syne',sans-serif" }}>
              View All <ChevronRight size={13} />
            </button>
          </div>
          {/* table head */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr", gap: 8, padding: "9px 22px", background: "#FAFCFB", borderBottom: "1px solid #F1F7F3" }}>
            {["PATIENT", "TYPE", "DATE", "STATUS", "ACTION"].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "#94A3B8", fontFamily: "'Syne',sans-serif" }}>{h}</span>
            ))}
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 13, fontWeight: 600 }}>No appointments yet</div>
          ) : recent.map((appt, i) => {
            const doc = doctors.find(d => d.id === appt.doctor_id);
            const typeMap = { booked: "Check-up", pending: "Consultation", rejected: "Cancelled" };
            const type = typeMap[appt.status] || doc?.department || "Appointment";
            const dateStr = appt.date ? new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
            return (
              <div key={appt.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.5fr", gap: 8, padding: "13px 22px", alignItems: "center", borderBottom: i < recent.length - 1 ? "1px solid #F8FBFA" : "none", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F6FAF8"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <Av name={appt.name} size={36} bg={BG_COLORS[i % BG_COLORS.length]} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A", lineHeight: 1.2 }}>{appt.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 1 }}>{doc?.department || "Patient"}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{type}</span>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{dateStr}</span>
                <StatusBadge status={appt.status} />
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#B0BEC5", display: "flex", alignItems: "center" }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>


    </>
  );
}
