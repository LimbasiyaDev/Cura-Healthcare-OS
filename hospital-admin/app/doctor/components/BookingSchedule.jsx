"use client";
import { useState, useEffect, useRef, useMemo } from "react";

/* ─── tiny helpers ─────────────────────────────────────────────────── */

function TypeTag({ type }) {
  const cfg = {
    "Consultation": { bg:"#EFF6FF", color:"#2563EB" },
    "Follow-up":    { bg:"#F5F3FF", color:"#7C3AED" },
    "Surgery":      { bg:"#FEF2F2", color:"#DC2626" },
    "Surgery Check":{ bg:"#FEF2F2", color:"#DC2626" },
    "Check-up":     { bg:"#ECFDF5", color:"#059669" },
  };
  const c = cfg[type] || { bg:"#F1F5F9", color:"#64748B" };
  return (
    <span style={{
      display:"inline-flex", padding:"3px 9px", borderRadius:999,
      background:c.bg, color:c.color,
      fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"0.04em",
    }}>{type}</span>
  );
}

function ConsultTag({ type }) {
  const isCall = type === "call";
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"3px 9px", borderRadius:999,
      background: isCall ? "#F0F4FF" : "#F0FAF5",
      color:       isCall ? "#3B5BDB" : "#087F5B",
      fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif", letterSpacing:"0.04em",
      border: `1px solid ${isCall ? "#BAC8FF" : "#96F2D7"}`,
    }}>
      {isCall ? "📹 Video Call" : "🏥 In Person"}
    </span>
  );
}

function Avatar({ name, size = 36 }) {
  const COLORS = ["#143D30","#7C3AED","#D97706","#059669","#0891B2","#DC2626","#1E40AF"];
  const idx = name ? name.charCodeAt(0) % COLORS.length : 0;
  const ini = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", background:COLORS[idx], flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:size * 0.34,
    }}>{ini}</div>
  );
}

/* ── Live indicator pill shown when realtime is active ── */
function LiveBadge({ isLive }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:999,
      background: isLive ? "#ECFDF5" : "#F1F5F9",
      border: `1px solid ${isLive ? "#6EE7B7" : "#E2E8F0"}`,
      fontSize:10, fontWeight:800, fontFamily:"'Syne',sans-serif",
      color: isLive ? "#065F46" : "#94A3B8",
      transition:"all .4s",
    }}>
      <span style={{
        width:6, height:6, borderRadius:"50%",
        background: isLive ? "#10B981" : "#CBD5E1",
        boxShadow: isLive ? "0 0 0 3px rgba(16,185,129,0.25)" : "none",
        display:"inline-block",
        animation: isLive ? "pulse-dot 2s infinite" : "none",
      }}/>
      {isLive ? "Live" : "Offline"}
      <style>{`
        @keyframes pulse-dot {
          0%,100% { box-shadow: 0 0 0 0px rgba(16,185,129,0.4); }
          50%      { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes slide-in {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Toast for new appointment notification ── */
function NewApptToast({ appt, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:2000,
      background:"white", borderRadius:16, padding:"14px 18px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.18)",
      border:"1.5px solid #6EE7B7",
      display:"flex", alignItems:"center", gap:12,
      animation:"slide-in .3s ease",
      maxWidth:320,
    }}>
      <div style={{ width:38, height:38, borderRadius:12, background:"#ECFDF5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🔔</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:13, color:"#0F172A" }}>New Appointment</div>
        <div style={{ fontSize:11, color:"#64748B", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {appt.name} · {appt.slot} · {appt.date}
        </div>
      </div>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:16, flexShrink:0 }}>✕</button>
    </div>
  );
}

function slotToMinutes(slot) {
  if (!slot) return -1;
  const s = slot.trim();
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return -1;
}

function minutesToLabel(mins) {
  const h24  = Math.floor(mins / 60);
  const m    = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12  = h24 % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function ampmTo24(str) {
  if (!str) return null;
  const s = str.trim();
  if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, "0");
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

function normaliseDoctor(row) {
  let startTime = "09:00";
  let endTime   = "18:00";
  if (row.working_hours) {
    const parts = row.working_hours.split(/\s*-\s*/);
    if (parts.length === 2) {
      startTime = ampmTo24(parts[0]) || startTime;
      endTime   = ampmTo24(parts[1]) || endTime;
    }
  }
  return {
    ...row,
    startTime,
    endTime,
    slotDuration: row.slot_duration ?? 20,
    room_number:  row.room_number || row.room || null,
  };
}

function buildSlotRows(doctor) {
  const {
    startTime    = "09:00",
    endTime      = "18:00",
    slotDuration = 60,
    lunchStart,
    lunchEnd,
  } = doctor || {};

  const parse24 = t => {
    if (!t) return -1;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const start  = parse24(startTime);
  const end    = parse24(endTime);
  const lStart = parse24(lunchStart);
  const lEnd   = parse24(lunchEnd);

  const rows = [];
  for (let t = start; t < end; t += slotDuration) {
    const isLunch = lStart >= 0 && t >= lStart && t < lEnd;
    rows.push({ label: minutesToLabel(t), start: t, end: t + slotDuration, isLunch });
  }
  return rows;
}

function buildProdBlocks(slotRows) {
  if (!slotRows.length) return [];
  const size = Math.ceil(slotRows.length / 5);
  return Array.from({ length: 5 }, (_, i) => {
    const from = i * size;
    const to   = Math.min(from + size, slotRows.length);
    const lbl  = slotRows[from]?.label.replace(" AM","").replace(" PM","") || "";
    return { label: lbl, rowIdxs: Array.from({ length: to - from }, (_, j) => from + j) };
  }).filter(b => b.rowIdxs.length);
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day;
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(diff + i);
    return nd.toISOString().split("T")[0];
  });
}

function getMonthGrid(baseDate) {
  const d = new Date(baseDate + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(`${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`);
  }
  return cells;
}

const PRIMARY = "#143D30";

function SkeletonRow() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
      borderBottom:"1px solid rgba(20,61,48,0.05)" }}>
      <div style={{ width:36, height:36, borderRadius:"50%", background:"#E2E8F0", flexShrink:0 }}/>
      <div style={{ flex:1 }}>
        <div style={{ height:11, background:"#E2E8F0", borderRadius:6, width:"55%", marginBottom:7 }}/>
        <div style={{ height:9,  background:"#F1F5F9", borderRadius:6, width:"35%" }}/>
      </div>
      <div style={{ width:60, height:11, background:"#E2E8F0", borderRadius:6 }}/>
    </div>
  );
}

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

async function sendBotReschedule(toPhone, patientName, newSlot, date, doctorName, hospitalId) {
  if (!toPhone) return { ok: false, error: "No phone number on record for this patient." };
  try {
    const res  = await fetch(`${BOT_URL}/reschedule-notify`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone: toPhone, patientName, newSlot, date, doctorName, hospitalId }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `Bot server error ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Cannot reach bot server — is it running?" };
  }
}

/* ── Reschedule Modal ─────────────────────────────────────────────── */
function RescheduleModal({ appt, slotRows, bookedSlots, onClose, onConfirm, isReschedulingToday, currentMinutes }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const availableSlots = slotRows.filter(row => {
    if (row.isLunch) return false;
    if (row.label === appt.slot) return false;
    if (isReschedulingToday && row.end <= currentMinutes) return false;
    return !bookedSlots.some(bs => bs >= row.start && bs < row.end);
  });

  function handleConfirm() {
    if (!selectedSlot) return;
    onConfirm(appt, selectedSlot);
    onClose();
  }

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={onClose}>
      <div style={{
        background:"white", borderRadius:20, padding:28, width:"100%", maxWidth:420,
        boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:"#0F172A" }}>
              Reschedule Appointment
            </div>
            <div style={{ fontSize:12, color:"#94A3B8", marginTop:3, fontWeight:600 }}>
              {appt.name} · current slot: {appt.slot}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:9, border:"1.5px solid rgba(20,61,48,0.10)", background:"#F6FAF8", cursor:"pointer", fontSize:16, color:"#64748B", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, fontFamily:"'Syne',sans-serif" }}>
          Pick a new slot
        </div>

        {availableSlots.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:"#94A3B8", fontSize:13, fontWeight:600 }}>
            {isReschedulingToday
              ? "No available future slots for today. Try rescheduling to another date."
              : "No available slots for this date."}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20, maxHeight:240, overflowY:"auto" }}>
            {availableSlots.map(row => {
              const isSelected = selectedSlot?.label === row.label;
              return (
                <button key={row.label} onClick={() => setSelectedSlot(row)}
                  style={{
                    padding:"10px 8px", borderRadius:10, border:"1.5px solid",
                    borderColor: isSelected ? PRIMARY : "rgba(20,61,48,0.12)",
                    background:  isSelected ? PRIMARY : "#F8FAFC",
                    color:       isSelected ? "white" : "#0F172A",
                    fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif",
                    cursor:"pointer", transition:"all .15s",
                  }}>
                  {row.label}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:"11px", borderRadius:10, border:"1.5px solid rgba(20,61,48,0.12)", background:"white", color:"#64748B", fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selectedSlot}
            style={{
              flex:2, padding:"11px", borderRadius:10, border:"none",
              background: selectedSlot ? PRIMARY : "#E2E8F0",
              color: selectedSlot ? "white" : "#94A3B8",
              fontSize:12, fontWeight:800, fontFamily:"'Syne',sans-serif",
              cursor: selectedSlot ? "pointer" : "not-allowed",
              transition:"all .2s",
            }}>
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN ═══════════════════════════════════ */
export default function BookingSchedule({
  supabase,
  fetchAppointments,
  fetchDoctors,
  appointments: externalAppts,
  doctors: externalDoctors,
  selectedDoctorId,
  todayStr,
  onApprove,
  onDecline,
  onReschedule,
  showToast,
  /* NEW: optional polling interval in ms for fetchAppointments mode (default 15s) */
  pollInterval = 15000,
}) {
  const today = todayStr || new Date().toISOString().split("T")[0];

  const [appointments, setAppointments] = useState(externalAppts || []);
  const [doctors,      setDoctors]      = useState(externalDoctors || []);
  const [loading,      setLoading]      = useState(!externalAppts);
  const [isLive,       setIsLive]       = useState(false);   // realtime status
  const [newApptToast, setNewApptToast] = useState(null);    // {appt} | null

  const [calView,        setCalView]        = useState("Day");
  const [dayOffset,      setDayOffset]      = useState(0);
  const [search,         setSearch]         = useState("");
  const [activeAppt,     setActiveAppt]     = useState(null);
  const [activeDoctorId, setActiveDoctorId] = useState(selectedDoctorId ?? null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [currentMinutes, setCurrentMinutes] = useState(nowMinutes());
  const [showAllDay,     setShowAllDay]      = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Keep a ref of current appt IDs so we can detect genuinely new ones
  const knownIdsRef = useRef(new Set());

  useEffect(() => {
    const timer = setInterval(() => setCurrentMinutes(nowMinutes()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ─────────────────────────────────────────────────────────────────
   * REAL-TIME STRATEGY
   *
   * Priority 1 — Supabase client prop
   *   → subscribe to postgres_changes on the appointments table.
   *   → On INSERT: add the new row immediately to state.
   *   → On UPDATE: update the matching row.
   *   → On DELETE: remove the row.
   *   → No polling needed; the channel keeps the list live.
   *
   * Priority 2 — fetchAppointments / fetchDoctors props (no supabase client)
   *   → Poll every `pollInterval` ms (default 15 s).
   *   → Detect new rows by comparing IDs vs knownIdsRef.
   *
   * Priority 3 — externalAppts prop (fully controlled from parent)
   *   → Parent is responsible for pushing updates; we just sync.
   * ──────────────────────────────────────────────────────────────── */

  /* ── Initial load ── */
  useEffect(() => {
  if (externalAppts && externalDoctors) {
    const normDocs = externalDoctors.map(normaliseDoctor);
    setAppointments(externalAppts);
    setDoctors(normDocs);
    knownIdsRef.current = new Set(externalAppts.map(a => a.id));
    return;
  }
  async function load() {
    setLoading(true);
    try {
      let appts = [], docs = [];
      if (fetchAppointments && fetchDoctors) {
        [appts, docs] = await Promise.all([fetchAppointments(), fetchDoctors()]);
      } else if (supabase) {
        const [{ data:a, error:ae }, { data:d, error:de }] = await Promise.all([
          supabase.from("appointments").select("*").order("date",{ascending:true}).order("slot",{ascending:true}),
          supabase.from("doctors").select("*").eq("is_available", true),
        ]);
        if (ae) throw ae;
        if (de) throw de;
        appts = a || []; docs = d || [];
      } else {
        throw new Error("Pass a `supabase` client prop to load real data.");
      }
      const normDocs = docs.map(normaliseDoctor);
      setDoctors(normDocs);
      setAppointments(appts);
      knownIdsRef.current = new Set(appts.map(a => a.id));
      if (!activeDoctorId && normDocs.length) setActiveDoctorId(normDocs[0].id);
    } catch (err) {
      console.error("BookingSchedule:", err);
    } finally {
      setLoading(false);
    }
  }
  load();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, externalAppts, externalDoctors]);

  /* ── Supabase Realtime subscription (Priority 1) ── */
  useEffect(() => {
    if (!supabase || externalAppts) return; // skip if controlled externally

    const channel = supabase
      .channel("booking-schedule-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === "INSERT") {
            // Only show toast + add if we haven't seen this ID yet
            if (!knownIdsRef.current.has(newRow.id)) {
              knownIdsRef.current.add(newRow.id);
              setAppointments(prev => {
                // Insert sorted by date then slot
                const updated = [...prev, newRow];
                updated.sort((a, b) => {
                  const dc = (a.date||"").localeCompare(b.date||"");
                  return dc !== 0 ? dc : slotToMinutes(a.slot) - slotToMinutes(b.slot);
                });
                return updated;
              });
              // Show in-app notification
              setNewApptToast(newRow);
              showToast?.(`New booking: ${newRow.name} at ${newRow.slot}`, "success");
            }
          }

          if (eventType === "UPDATE") {
            setAppointments(prev =>
              prev.map(a => a.id === newRow.id ? { ...a, ...newRow } : a)
            );
          }

          if (eventType === "DELETE") {
            knownIdsRef.current.delete(oldRow.id);
            setAppointments(prev => prev.filter(a => a.id !== oldRow.id));
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  /* ── Polling fallback (Priority 2) — only when no supabase client ── */
  useEffect(() => {
    if (supabase || externalAppts || !fetchAppointments) return;

    const intervalId = setInterval(async () => {
      try {
        const appts = await fetchAppointments();
        const newOnes = appts.filter(a => !knownIdsRef.current.has(a.id));

        if (newOnes.length > 0) {
          newOnes.forEach(a => knownIdsRef.current.add(a.id));
          setAppointments(appts);
          // Toast for the most recent new appointment
          setNewApptToast(newOnes[newOnes.length - 1]);
          showToast?.(`${newOnes.length} new booking${newOnes.length > 1 ? "s" : ""} arrived`, "success");
        } else {
          // Silently sync updates (status changes etc.) without toast
          setAppointments(prev => {
            const hasChange = appts.some(a => {
              const old = prev.find(p => p.id === a.id);
              return old && old.status !== a.status;
            });
            return hasChange ? appts : prev;
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, pollInterval);

    // Show the polling indicator in the badge
    setIsLive(true);

    return () => {
      clearInterval(intervalId);
      setIsLive(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAppointments, pollInterval]);

  /* ── Sync externally-controlled appointments ── */
  useEffect(() => {
    if (!externalAppts) return;
    const newOnes = externalAppts.filter(a => !knownIdsRef.current.has(a.id));
    if (newOnes.length > 0) {
      newOnes.forEach(a => knownIdsRef.current.add(a.id));
      setNewApptToast(newOnes[newOnes.length - 1]);
    }
    setAppointments(externalAppts);
  }, [externalAppts]);

  async function refresh() {
    if (externalAppts) return;
    try {
      let appts = [], docs = [];
      if (fetchAppointments && fetchDoctors) {
        [appts, docs] = await Promise.all([fetchAppointments(), fetchDoctors()]);
      } else if (supabase) {
        const [{ data:a }, { data:d }] = await Promise.all([
          supabase.from("appointments").select("*").order("date",{ascending:true}).order("slot",{ascending:true}),
          supabase.from("doctors").select("*").eq("is_available", true),
        ]);
        appts = a || []; docs = d || [];
      }
      setAppointments(appts);
      setDoctors(docs.map(normaliseDoctor));
      knownIdsRef.current = new Set(appts.map(a => a.id));
    } catch (_) {}
  }

  const activeDoctor = useMemo(
    () => doctors.find(d => d.id === activeDoctorId) || doctors[0] || null,
    [doctors, activeDoctorId]
  );

  const SLOT_ROWS   = useMemo(() => buildSlotRows(activeDoctor),   [activeDoctor]);
  const PROD_BLOCKS = useMemo(() => buildProdBlocks(SLOT_ROWS),    [SLOT_ROWS]);

  const visibleSlotRows = useMemo(() => {
    if (calView !== "Day") return SLOT_ROWS;
    if (showAllDay) return SLOT_ROWS;
    const shownD = (() => { const d = new Date(today); d.setDate(d.getDate() + dayOffset); return d.toISOString().split("T")[0]; })();
    if (shownD !== today) return SLOT_ROWS;
    return SLOT_ROWS.filter(row => row.end > currentMinutes);
  }, [SLOT_ROWS, calView, dayOffset, today, currentMinutes, showAllDay]);

  const shownDate = useMemo(() => {
    const d = new Date(today); d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split("T")[0];
  }, [today, dayOffset]);

  const shownLabel = useMemo(() => {
    if (calView === "Month") {
      const d = new Date(shownDate + "T00:00:00");
      return d.toLocaleDateString("en-US", { month:"long", year:"numeric" });
    }
    if (calView === "Week") {
      const week = getWeekDates(shownDate);
      const first = new Date(week[0] + "T00:00:00");
      const last  = new Date(week[6] + "T00:00:00");
      return `${first.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${last.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;
    }
    return new Date(shownDate + "T00:00:00").toLocaleDateString("en-US", { month:"long", year:"numeric" });
  }, [shownDate, calView]);

  /* ── stats ── */
  const todayAppts  = appointments.filter(a => a.date === today);
  const statToday   = todayAppts.length;
  const statPending = appointments.filter(a => a.status === "pending").length;
  const statSlots   = String(Math.max(0, SLOT_ROWS.filter(r => !r.isLunch).length - todayAppts.length)).padStart(2, "0");

  const dayAppts = useMemo(() => appointments.filter(a => a.date === shownDate), [appointments, shownDate]);

  const rowAppts = useMemo(() => {
    const map = SLOT_ROWS.map(() => []);
    dayAppts.forEach(appt => {
      const mins = slotToMinutes(appt.slot);
      if (mins < 0) return;
      const idx = SLOT_ROWS.findIndex(r => mins >= r.start && mins < r.end);
      if (idx >= 0) map[idx].push(appt);
    });
    return map;
  }, [SLOT_ROWS, dayAppts]);

  const todayRowAppts = useMemo(() => {
    const map = SLOT_ROWS.map(() => []);
    todayAppts.forEach(appt => {
      const mins = slotToMinutes(appt.slot);
      if (mins < 0) return;
      const idx = SLOT_ROWS.findIndex(r => mins >= r.start && mins < r.end);
      if (idx >= 0) map[idx].push(appt);
    });
    return map;
  }, [SLOT_ROWS, todayAppts]);

  const todayProdCounts = PROD_BLOCKS.map(b =>
    b.rowIdxs.reduce((sum, ri) => sum + (todayRowAppts[ri]?.length || 0), 0)
  );
  const maxProd = Math.max(...todayProdCounts, 1);

  const upcomingAppts = useMemo(() => {
    let filtered = appointments
      .filter(a => {
        if ((a.date || "") < today) return false;
        // If not viewing all, skip today's past appointments
        if (!showAllUpcoming && a.date === today && slotToMinutes(a.slot) < currentMinutes) return false;

        return !search ||
          a.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.phone?.includes(search);
      });

    filtered.sort((a, b) => {
      const dc = (a.date||"").localeCompare(b.date||"");
      return dc !== 0 ? dc : slotToMinutes(a.slot) - slotToMinutes(b.slot);
    });

    return showAllUpcoming ? filtered : filtered.slice(0, 6);
  }, [appointments, search, today, showAllUpcoming, currentMinutes]);

  const bookedSlotMins = useMemo(() =>
    (appointments.filter(a => a.date === today && a.id !== rescheduleAppt?.id))
      .map(a => slotToMinutes(a.slot))
      .filter(m => m >= 0),
    [appointments, today, rescheduleAppt]
  );

  function blockColor(appt) {
    const r = appt.reason?.toLowerCase() || "";
    if (r.includes("urgent") || r.includes("emergency")) return { bg:"#FEF2F2", border:"#DC2626" };
    if (appt.status === "booked")   return { bg:"#E8F5EE", border:PRIMARY };
    if (appt.status === "rejected") return { bg:"#FEF2F2", border:"#DC2626" };
    return { bg:"#EFF6FF", border:"#2563EB" };
  }

  function apptType(appt) {
    const r = appt.reason?.toLowerCase() || "";
    if (r.includes("surg"))   return "Surgery Check";
    if (r.includes("follow")) return "Follow-up";
    return "Consultation";
  }

  async function handleApprove(appt) {
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status:"booked" } : a));
    if (supabase) {
      const { error } = await supabase.from("appointments").update({ status:"booked" }).eq("id", appt.id);
      if (error) console.error("Approve failed:", error);
    }
    onApprove?.(appt);
    showToast?.(`${appt.name}'s appointment confirmed`, "success");
  }

  async function handleDecline(appt) {
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status:"rejected" } : a));
    if (supabase) {
      const { error } = await supabase.from("appointments").update({ status:"rejected" }).eq("id", appt.id);
      if (error) console.error("Decline failed:", error);
    }
    onDecline?.(appt);
    showToast?.(`${appt.name}'s appointment declined`, "warning");
  }

  async function handleRescheduleConfirm(appt, newSlot) {
    setAppointments(prev =>
      prev.map(a => a.id === appt.id ? { ...a, slot: newSlot.label } : a)
    );
    if (supabase) {
      const { error } = await supabase
        .from("appointments")
        .update({ slot: newSlot.label })
        .eq("id", appt.id);
      if (error) console.error("Reschedule DB update failed:", error);
    }
    const doc = doctors.find(d => d.id === appt.doctor_id);
    const { ok, error } = await sendBotReschedule(
      appt.phone    || "",
      appt.name     || "Patient",
      newSlot.label,
      appt.date     || "",
      doc?.name     || "",
      appt.hospital_id || "",
    );
    if (ok) {
      showToast?.(`${appt.name} rescheduled to ${newSlot.label} — Patient notified ✓`, "success");
    } else {
      showToast?.(`Rescheduled to ${newSlot.label} (Notification failed: ${error})`, "warning");
    }
    onReschedule?.(appt, newSlot);
  }

  function generateJitsiLink() {
    const roomName = `cura-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return `https://meet.jit.si/${roomName}`;
  }

  function isBadMeetLink(link) {
    if (!link) return true;
    return link.includes("meet.google.com");
  }

  async function handleStartSession(appt) {
    if (appt.consultation_type === "call") {
      let link = appt.meet_link || "";
      if (isBadMeetLink(link)) {
        const newLink = generateJitsiLink();
        if (supabase) {
          const { error } = await supabase
            .from("appointments")
            .update({ meet_link: newLink })
            .eq("id", appt.id);
          if (error) console.error("Failed to update meet_link:", error);
        }
        setAppointments(prev =>
          prev.map(a => a.id === appt.id ? { ...a, meet_link: newLink } : a)
        );
        link = newLink;
        showToast?.("Old link fixed — new Jitsi room ready ✓", "success");
      }
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      showToast?.(`Starting in-person session with ${appt.name}`, "success");
    }
  }

  const dur       = activeDoctor?.slot_duration || 60;
  const rowH      = Math.max(48, Math.min(112, dur * 1.1 + 34));
  const tinySlot  = dur <= 15;
  const smallSlot = dur <= 30;

  const weekDates = useMemo(() => getWeekDates(shownDate), [shownDate]);
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const monthGrid = useMemo(() => getMonthGrid(shownDate), [shownDate]);

  /* ═══════════════════ RENDER ═══════════════════════════════════════ */
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, fontFamily:"'Plus Jakarta Sans',sans-serif", flex:1, height:"100%" }}>

      {/* STAT CARDS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Total bookings today", val:loading?"—":statToday,   icon:"📅", iconBg:"#EAF2EE" },
          { label:"Pending requests",     val:loading?"—":statPending,  icon:"⏳", iconBg:"#EFF6FF" },
          { label:"Available slots",      val:loading?"—":statSlots,    icon:"🗓️", iconBg:"#ECFDF5" },
        ].map(({ label, val, icon, iconBg }) => (
          <div key={label} style={{ background:"white", borderRadius:16, border:"1px solid rgba(20,61,48,0.07)", padding:"18px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 10px rgba(0,0,0,0.04)" }}>
            <div style={{ width:46, height:46, borderRadius:12, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
            <div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:5 }}>{label}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:28, color:"#0F172A", letterSpacing:"-0.04em", lineHeight:1 }}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor selector */}
      {doctors.length > 0 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
          {doctors.map(doc => {
            const active = activeDoctorId === doc.id;
            return (
              <button key={doc.id} onClick={() => setActiveDoctorId(doc.id)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:999, border:"1.5px solid", borderColor:active?PRIMARY:"rgba(20,61,48,0.12)", background:active?PRIMARY:"white", color:active?"white":"#64748B", fontSize:12, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer", whiteSpace:"nowrap", transition:"all .15s" }}>
                <Avatar name={doc.name} size={22}/>
                Dr. {doc.name}
                {doc.slot_duration && (
                  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:999, background:active?"rgba(255,255,255,0.18)":"rgba(20,61,48,0.08)", color:active?"white":"#64748B" }}>
                    {doc.slot_duration}min
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Doctor meta bar */}
      {activeDoctor && (
        <div style={{ display:"flex", alignItems:"center", gap:18, padding:"10px 16px", background:"white", borderRadius:12, border:"1px solid rgba(20,61,48,0.07)", fontSize:12, color:"#64748B", fontWeight:600, flexWrap:"wrap" }}>
          <span>🕐 {activeDoctor.startTime||"09:00"} – {activeDoctor.endTime||"18:00"}</span>
          <span style={{ color: PRIMARY, fontWeight:800 }}>⏱ {activeDoctor.slot_duration||20} min slots</span>
          {activeDoctor.lunchStart && <span>🍽 Lunch {activeDoctor.lunchStart}–{activeDoctor.lunchEnd}</span>}
          {activeDoctor.room_number && <span>🚪 Room {activeDoctor.room_number}</span>}
          {activeDoctor.department && <span>🏥 {activeDoctor.department}</span>}
          {/* ── Live indicator ── */}
          <span style={{ marginLeft:"auto" }}><LiveBadge isLive={isLive}/></span>
          <button 
            onClick={() => setShowAllDay(!showAllDay)}
            style={{ 
              background: showAllDay ? PRIMARY : "white",
              color: showAllDay ? "white" : PRIMARY,
              border: `1px solid ${PRIMARY}`,
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Syne', sans-serif",
              transition: "all 0.2s"
            }}
          >
            {showAllDay ? "Show Upcoming Only" : "View All Day"}
          </button>
          <span style={{ fontSize:11, color:"#CBD5E1" }}>{SLOT_ROWS.length} slots total</span>
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"stretch", flex:1, minHeight:0 }}>

        {/* CALENDAR */}
        <div style={{ display:"flex", flexDirection:"column", background:"white", borderRadius:20, border:"1px solid rgba(20,61,48,0.07)", overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.04)" }}>

          {/* header */}
          <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid rgba(20,61,48,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.03em" }}>{shownLabel}</div>
              {loading && <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", background:"#F1F5F9", padding:"3px 10px", borderRadius:999 }}>Loading…</div>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {[["←",-1],["→",1]].map(([arrow,dir]) => (
                <button key={arrow} onClick={() => setDayOffset(d => d+dir)}
                  style={{ width:32, height:32, borderRadius:9, border:"1.5px solid rgba(20,61,48,0.10)", background:"#F6FAF8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B", fontSize:14, fontWeight:700 }}>
                  {arrow}
                </button>
              ))}
              <div style={{ display:"flex", background:"#F6FAF8", borderRadius:999, padding:3, gap:2 }}>
                {["Day","Week","Month"].map(v => (
                  <button key={v} onClick={() => setCalView(v)}
                    style={{ padding:"5px 16px", borderRadius:999, border:"none", background:calView===v?"white":"none", color:calView===v?PRIMARY:"#94A3B8", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif", boxShadow:calView===v?"0 1px 6px rgba(0,0,0,0.10)":"none", transition:"all .15s" }}>
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={refresh} title="Refresh"
                style={{ width:32, height:32, borderRadius:9, border:"1.5px solid rgba(20,61,48,0.10)", background:"#F6FAF8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B", fontSize:15 }}>
                ↺
              </button>
            </div>
          </div>

          {/* WEEK VIEW */}
          {calView === "Week" && (
            <div style={{ overflowX:"auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"90px repeat(7,1fr)", borderBottom:"1px solid rgba(20,61,48,0.07)" }}>
                <div/>
                {weekDates.map((date, i) => {
                  const isToday = date === today;
                  const d = new Date(date + "T00:00:00");
                  return (
                    <div key={date} style={{ padding:"10px 6px", textAlign:"center", borderLeft:"1px solid rgba(20,61,48,0.05)" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>{DAY_NAMES[d.getDay()]}</div>
                      <div style={{ marginTop:4, width:28, height:28, borderRadius:"50%", background:isToday?PRIMARY:"none", color:isToday?"white":"#0F172A", fontSize:13, fontWeight:900, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", margin:"4px auto 0" }}>
                        {d.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ overflowY:"auto", maxHeight:520 }}>
                {SLOT_ROWS.map((row, ri) => (
                  <div key={row.label} style={{ display:"grid", gridTemplateColumns:"90px repeat(7,1fr)", borderBottom:"1px solid rgba(20,61,48,0.05)", minHeight:44 }}>
                    <div style={{ padding:"10px 12px 0", fontSize:11, fontWeight:700, color:"#94A3B8", fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{row.label}</div>
                    {weekDates.map(date => {
                      const dayA = appointments.filter(a => {
                        if (a.date !== date) return false;
                        const m = slotToMinutes(a.slot);
                        return m >= row.start && m < row.end;
                      });
                      return (
                        <div key={date} style={{ borderLeft:"1px solid rgba(20,61,48,0.05)", padding:"4px 5px", display:"flex", flexDirection:"column", gap:2, background:date===today?"#FAFFFE":"white" }}>
                          {dayA.length === 0 ? (
                            <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <div style={{ width:"100%", borderRadius:6, padding:"4px 6px", background:"#FAFCFB", border:"1px dashed rgba(20,61,48,0.08)", color:"#CBD5E1", fontSize:9, fontWeight:600, textAlign:"center" }}>—</div>
                            </div>
                          ) : dayA.map(appt => {
                            const c = blockColor(appt);
                            const isCall = appt.consultation_type === "call";
                            return (
                              <div key={appt.id} style={{ borderRadius:6, padding:"4px 6px", background:c.bg, borderLeft:`2px solid ${c.border}`, fontSize:10, fontWeight:700, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {isCall ? "📹 " : "🏥 "}{appt.name}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MONTH VIEW */}
          {calView === "Month" && (
            <div style={{ padding:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:8 }}>
                {DAY_NAMES.map(d => (
                  <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:800, color:"#94A3B8", fontFamily:"'Syne',sans-serif", padding:"4px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                {monthGrid.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`}/>;
                  const isToday = date === today;
                  const dayCount = appointments.filter(a => a.date === date).length;
                  const d = new Date(date + "T00:00:00");
                  return (
                    <div key={date} onClick={() => { setDayOffset(Math.round((new Date(date)-new Date(today))/86400000)); setCalView("Day"); }}
                      style={{ borderRadius:10, border:`1.5px solid`, borderColor:isToday?PRIMARY:"rgba(20,61,48,0.08)", background:isToday?"#F0FAF5":"white", padding:"8px 6px", cursor:"pointer", minHeight:60, display:"flex", flexDirection:"column", gap:4, transition:"all .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background=isToday?"#E8F5EE":"#F8FAFC"}
                      onMouseLeave={e => e.currentTarget.style.background=isToday?"#F0FAF5":"white"}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:13, color:isToday?PRIMARY:"#0F172A" }}>{d.getDate()}</div>
                      {dayCount > 0 && (
                        <div style={{ fontSize:9, fontWeight:800, color:"white", background:PRIMARY, borderRadius:999, padding:"2px 6px", width:"fit-content" }}>
                          {dayCount} appt{dayCount > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {calView === "Day" && (
            <div style={{ overflowY:"auto", flex:1, minHeight: 400 }}>
              {loading ? (
                Array.from({ length:10 }).map((_, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", borderBottom:"1px solid rgba(20,61,48,0.05)", minHeight:60 }}>
                    <div style={{ width:90, padding:"16px 16px 0", flexShrink:0, fontSize:11, fontWeight:700, color:"#E2E8F0", fontFamily:"'Syne',sans-serif" }}>──:──</div>
                    <div style={{ flex:1, padding:"8px 14px 8px 0" }}><SkeletonRow/></div>
                  </div>
                ))
              ) : visibleSlotRows.length === 0 ? (
                <div style={{ padding:40, textAlign:"center", color:"#94A3B8", fontSize:13, fontWeight:600 }}>
                  {shownDate === today ? "No more slots for today." : "No schedule configured for this doctor."}
                </div>
              ) : (
                visibleSlotRows.map((row) => {
                  const ri = SLOT_ROWS.findIndex(r => r.label === row.label);
                  const appts = (ri >= 0 ? rowAppts[ri] : null) || [];
                  return (
                    <div key={row.label}
                      style={{
                        display:"flex", alignItems:"flex-start",
                        borderBottom:"1px solid rgba(20,61,48,0.05)",
                        minHeight: rowH,
                        background: row.isLunch ? "#FAFCFB" : "white",
                      }}>

                      <div style={{ width:90, padding: tinySlot ? "10px 14px 0" : "14px 16px 0", flexShrink:0, fontFamily:"'Syne',sans-serif" }}>
                        <div style={{ fontSize: tinySlot ? 10 : 12, fontWeight:700, color: row.isLunch ? "#CBD5E1" : "#94A3B8" }}>
                          {row.label}
                        </div>
                        {smallSlot && !row.isLunch && (
                          <div style={{ fontSize:9, color:"#D1D5DB", marginTop:1, fontWeight:600 }}>{dur}min</div>
                        )}
                      </div>

                      <div style={{ flex:1, padding: tinySlot ? "6px 12px 6px 0" : "8px 14px 8px 0", display:"flex", flexDirection:"column", gap:4 }}>

                        {row.isLunch && appts.length === 0 ? (
                          <div style={{ borderRadius:10, padding:"9px 13px", background:"#F8FAFC", border:"1px solid rgba(20,61,48,0.06)", color:"#94A3B8", fontSize:12, fontStyle:"italic", fontWeight:500 }}>
                            🍽 Lunch Break
                          </div>
                        ) : appts.length === 0 ? (
                          <div style={{ borderRadius:9, padding: tinySlot ? "6px 11px" : "8px 12px", background:"#FAFCFB", border:"1.5px dashed rgba(20,61,48,0.09)", color:"#CBD5E1", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12, color:"#D1FAE5" }}>—</span>
                            Available
                          </div>
                        ) : appts.map(appt => {
                          const doc    = doctors.find(d => d.id === appt.doctor_id);
                          const color  = blockColor(appt);
                          const isAct  = activeAppt?.id === appt.id;
                          const urgent = appt.reason?.toLowerCase().includes("urgent");
                          const emerg  = appt.reason?.toLowerCase().includes("emergency");
                          const isCall = appt.consultation_type === "call";

                          return (
                            <div key={appt.id}
                              onClick={() => setActiveAppt(isAct ? null : appt)}
                              style={{ borderRadius:11, padding: tinySlot ? "7px 11px" : "11px 14px", background:color.bg, borderLeft:`3px solid ${color.border}`, cursor:"pointer", transition:"opacity .15s" }}
                              onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                              onMouseLeave={e => e.currentTarget.style.opacity="1"}>

                              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                <Avatar name={appt.name} size={tinySlot ? 24 : 32}/>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontWeight:700, fontSize: tinySlot ? 11 : 13, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                    {appt.name}
                                  </div>
                                  {!tinySlot && (
                                    <div style={{ fontSize:11, color:"#64748B", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                      {appt.reason || "—"}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display:"flex", gap:4, flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                                  <span style={{
                                    fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif",
                                    background: isCall ? "#EEF2FF" : "#ECFDF5",
                                    color:       isCall ? "#3730A3" : "#065F46",
                                    padding:"2px 7px", borderRadius:999,
                                    border:`1px solid ${isCall ? "#C7D2FE" : "#6EE7B7"}`,
                                    whiteSpace:"nowrap",
                                  }}>
                                    {isCall ? "📹 Video" : "🏥 In Person"}
                                  </span>
                                  {appt.status === "pending" && (
                                    <span style={{ fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif", background:"#EFF6FF", color:"#2563EB", padding:"2px 7px", borderRadius:999, border:"1px solid #BFDBFE" }}>PENDING</span>
                                  )}
                                  {(urgent||emerg) && (
                                    <span style={{ fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif", background:"#FEF2F2", color:"#DC2626", padding:"2px 7px", borderRadius:999, border:"1px solid #FECACA" }}>
                                      {emerg?"EMERGENCY":"URGENT"}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!tinySlot && (
                                <div style={{ fontSize:11, color:"#64748B", marginTop:6, paddingLeft:41, display:"flex", flexWrap:"wrap", gap:"3px 10px" }}>
                                  <span>⏰ {appt.slot}</span>
                                  {doc && <span>👨‍⚕️ Dr. {doc.name}</span>}
                                  {(appt.room_number||doc?.room_number) && <span>🚪 Room {appt.room_number||doc?.room_number}</span>}
                                  {appt.phone && (
                                    appt.phone.includes("@") ? (
                                      <span>✉️ {appt.phone.replace(/^web_/, "")}</span>
                                    ) : (
                                      <span>📞 {appt.phone.replace(/^web_/, "")}</span>
                                    )
                                  )}
                                  {appt.age && <span>🎂 Age {appt.age}</span>}
                                  {isCall && appt.meet_link && (
                                    <span style={{ color:"#3730A3", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>
                                      🔗 {appt.meet_link}
                                    </span>
                                  )}
                                </div>
                              )}

                              {isAct && (
                                <div style={{ display:"flex", gap:6, marginTop:9, paddingLeft: tinySlot?0:41, flexWrap:"wrap" }}>
                                  {appt.status === "pending" && (
                                    <>
                                      <button onClick={e => { e.stopPropagation(); handleApprove(appt); setActiveAppt(null); }}
                                        style={{ padding:"5px 13px", borderRadius:8, background:PRIMARY, color:"white", border:"none", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>
                                        ✓ Approve
                                      </button>
                                      <button onClick={e => { e.stopPropagation(); handleDecline(appt); setActiveAppt(null); }}
                                        style={{ padding:"5px 13px", borderRadius:8, background:"white", color:"#DC2626", border:"1px solid #FECACA", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>
                                        ✕ Decline
                                      </button>
                                    </>
                                  )}
                                  {appt.status === "booked" && (
                                    <button onClick={e => { e.stopPropagation(); handleDecline(appt); setActiveAppt(null); }}
                                      style={{ padding:"5px 13px", borderRadius:8, background:"#FFF0F0", color:"#DC2626", border:"1px solid #FECACA", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>
                                      Cancel
                                    </button>
                                  )}
                                  <button onClick={e => { e.stopPropagation(); setRescheduleAppt(appt); setActiveAppt(null); }}
                                    style={{ padding:"5px 11px", borderRadius:8, background:"white", color:"#64748B", border:"1px solid rgba(20,61,48,0.12)", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>
                                    Reschedule
                                  </button>
                                  {isCall && appt.meet_link && (
                                    <button onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(appt.meet_link); showToast?.("Meet link copied!", "success"); }}
                                      style={{ padding:"5px 11px", borderRadius:8, background:"#EEF2FF", color:"#3730A3", border:"1px solid #C7D2FE", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>
                                      📋 Copy Link
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* search */}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94A3B8" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient or phone…"
              style={{ width:"100%", padding:"9px 12px 9px 32px", borderRadius:12, border:"1.5px solid rgba(20,61,48,0.10)", background:"white", fontSize:12, fontWeight:600, color:"#0F172A", outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
          </div>

          {/* UPCOMING */}
          <div style={{ display:"flex", flexDirection:"column", background:"white", borderRadius:20, border:"1px solid rgba(20,61,48,0.07)", overflow:"hidden", boxShadow:"0 4px 16px rgba(0,0,0,0.04)", flex:1, minHeight:0 }}>
            <div style={{ padding:"16px 18px 12px", borderBottom:"1px solid rgba(20,61,48,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:17, color:"#0F172A" }}>Upcoming</span>
              <button onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                style={{ fontSize:12, fontWeight:700, color:PRIMARY, background:"none", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                {showAllUpcoming ? "Show Less" : "View All"}
              </button>
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              {loading ? [0,1,2].map(i => <SkeletonRow key={i}/>) :
               upcomingAppts.length === 0 ? (
                <div style={{ padding:"40px 0", textAlign:"center", color:"#94A3B8", fontSize:13, fontWeight:600 }}>No upcoming appointments</div>
               ) : upcomingAppts.map((appt, i) => {
                const isPending  = appt.status === "pending";
                const isCall     = appt.consultation_type === "call";
                const d = new Date(today); d.setDate(d.getDate()+1);
                const isTomorrow = appt.date === d.toISOString().split("T")[0];
                const whenLabel  = appt.date === today ? "Today" : isTomorrow ? "Tomorrow" : appt.date || "—";
                const type       = apptType(appt);
                return (
                  <div key={appt.id} style={{ padding:"14px 16px", borderBottom:i<upcomingAppts.length-1?"1px solid rgba(20,61,48,0.05)":"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <Avatar name={appt.name} size={36}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, overflow:"hidden" }}>
                          <div style={{ fontWeight:700, fontSize:13, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {appt.name}
                          </div>
                          {isPending && (
                            <span style={{ fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif", background:"#FFFBEB", color:"#D97706", padding:"2px 7px", borderRadius:999, border:"1px solid #FDE68A", flexShrink:0 }}>PENDING</span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {appt.reason || "Consultation"}
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:13, color:"#0F172A" }}>{appt.slot||"—"}</div>
                        <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{whenLabel}</div>
                      </div>
                    </div>

                    <div style={{ display:"flex", gap:6, marginBottom:9, flexWrap:"wrap" }}>
                      <TypeTag type={type}/>
                      <ConsultTag type={appt.consultation_type || "personal"}/>
                    </div>

                    {isCall && (
                      <div style={{
                        display:"flex", alignItems:"center", gap:6, marginBottom:9,
                        padding:"5px 10px", borderRadius:8,
                        background: isBadMeetLink(appt.meet_link) ? "#FFF7ED" : "#EEF2FF",
                        border: `1px solid ${isBadMeetLink(appt.meet_link) ? "#FED7AA" : "#C7D2FE"}`,
                        fontSize:10,
                        color: isBadMeetLink(appt.meet_link) ? "#C2410C" : "#3730A3",
                        fontWeight:600, overflow:"hidden",
                      }}>
                        <span style={{ flexShrink:0 }}>{isBadMeetLink(appt.meet_link) ? "⚠️" : "📹"}</span>
                        {isBadMeetLink(appt.meet_link) ? (
                          <span style={{ flex:1, fontSize:10, fontWeight:700 }}>Invalid link — will auto-fix on Join</span>
                        ) : (
                          <>
                            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{appt.meet_link}</span>
                            <button
                              onClick={() => { navigator.clipboard?.writeText(appt.meet_link); showToast?.("Meet link copied!", "success"); }}
                              style={{ flexShrink:0, background:"none", border:"none", cursor:"pointer", fontSize:10, color:"#3730A3", fontWeight:800, padding:"0 2px" }}>
                              Copy
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div style={{ display:"flex", gap:6 }}>
                      {isPending ? (
                        <>
                          <button onClick={() => handleApprove(appt)} style={{ padding:"6px 14px", borderRadius:8, background:PRIMARY, color:"white", border:"none", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>Approve</button>
                          <button onClick={() => handleDecline(appt)} style={{ padding:"6px 14px", borderRadius:8, background:"white", color:"#DC2626", border:"1px solid #FECACA", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>Decline</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartSession(appt)}
                            style={{
                              padding:"6px 14px", borderRadius:8, border:"none",
                              background: isCall ? "#3730A3" : PRIMARY,
                              color:"white", fontSize:11, fontWeight:700,
                              fontFamily:"'Syne',sans-serif", cursor:"pointer",
                              display:"flex", alignItems:"center", gap:5,
                            }}>
                            {isCall ? "📹 Join Call" : "▶ Start"}
                          </button>
                          <button onClick={() => setRescheduleAppt(appt)} style={{ padding:"6px 12px", borderRadius:8, background:"white", color:"#64748B", border:"1px solid rgba(20,61,48,0.12)", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", cursor:"pointer" }}>Reschedule</button>
                          <button onClick={() => handleDecline(appt)} style={{ padding:"6px 9px", borderRadius:8, background:"white", color:"#DC2626", border:"1px solid #FECACA", fontSize:13, fontWeight:700, cursor:"pointer" }}>✕</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DAILY PRODUCTIVITY */}
          <div style={{ background:"white", borderRadius:20, border:"1px solid rgba(20,61,48,0.07)", padding:"16px 18px", boxShadow:"0 4px 16px rgba(0,0,0,0.04)", flexShrink:0 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:"#0F172A", marginBottom:14 }}>Daily Productivity</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:64 }}>
              {PROD_BLOCKS.map((b, i) => {
                const pct   = todayProdCounts[i] / maxProd;
                const isMax = todayProdCounts[i] === maxProd && maxProd > 0;
                return (
                  <div key={b.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5, height:"100%" }}>
                    <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
                      <div style={{ width:"100%", height:`${Math.max(pct*100,8)}%`, borderRadius:"5px 5px 0 0", background:isMax?PRIMARY:"#9FE1CB", transition:"height .35s ease" }}/>
                    </div>
                    <span style={{ fontSize:9, color:"#94A3B8", fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RESCHEDULE MODAL */}
      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          slotRows={SLOT_ROWS}
          bookedSlots={bookedSlotMins}
          onClose={() => setRescheduleAppt(null)}
          onConfirm={handleRescheduleConfirm}
          showToast={showToast}
          isReschedulingToday={rescheduleAppt.date === today}
          currentMinutes={currentMinutes}
        />
      )}

      {/* NEW APPOINTMENT TOAST */}
      {newApptToast && (
        <NewApptToast
          appt={newApptToast}
          onClose={() => setNewApptToast(null)}
        />
      )}
    </div>
  );
}