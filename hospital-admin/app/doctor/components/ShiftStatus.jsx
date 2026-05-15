"use client";
import { Clock, ChevronRight, BedDouble, Shield } from "lucide-react";

function getUpcomingShifts(doctor, holidays, todayStr, count = 2) {
  const hours = doctor?.active_hours || doctor?.working_hours;
  if (!hours) return [];

  const results = [];
  const current = new Date(todayStr + "T00:00:00");

  while (results.length < count) {
    current.setDate(current.getDate() + 1);
    const dateStr = current.toISOString().split("T")[0];
    const dayName = current.toLocaleDateString("en-US", { weekday: "long" });
    const dateLabel = current.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (holidays.includes(dateStr)) continue;

    const [startTime] = hours.split(" - ");
    results.push({
      label: `${doctor?.department || "General"} Ward`,
      time: `${dayName}, ${dateLabel} · ${startTime}`,
      dateStr,
    });
  }
  return results;
}

export default function ShiftStatus({ doctor, holidays, todayStr }) {
  const isHoliday = holidays.includes(todayStr);
  const hours = doctor?.active_hours || doctor?.working_hours || "09:00 AM - 07:00 PM";
  const [startTime, endTime] = hours.split(" - ");

  const upcomingShifts = getUpcomingShifts(doctor, holidays, todayStr, 2);

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#0F172A" }}>
          Shift Status
        </h3>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F0F7F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Clock size={15} color="#143D30" />
        </div>
      </div>

      {/* Current Active Shift */}
      <div style={{
        background: "linear-gradient(135deg, #EAF2EE, #D8E8DF)", borderRadius: 16,
        padding: "18px 18px 14px", marginBottom: 18, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg, #143D30, #4ECCA3)",
        }} />
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#143D30", fontFamily: "'Syne',sans-serif", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulseDot 2s infinite" }} />
          CURRENT ACTIVE SHIFT
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#143D30", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BedDouble size={16} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#0F172A", lineHeight: 1.1 }}>
              {doctor?.department || "General"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 2 }}>Ward</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, marginBottom: 8 }}>
          {startTime} — {endTime}
        </div>
        <span style={{
          display: "inline-flex", padding: "3px 10px", borderRadius: 999,
          background: isHoliday ? "#FEF2F2" : "#ECFDF5",
          color: isHoliday ? "#DC2626" : "#059669",
          fontSize: 10, fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: "0.08em",
        }}>
          {isHoliday ? "Holiday" : "Active"}
        </span>
      </div>

      {/* Upcoming Rotations */}
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#94A3B8", fontFamily: "'Syne',sans-serif", marginBottom: 10 }}>
        Upcoming Shifts
      </div>

      {upcomingShifts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#CBD5E1", fontSize: 12, fontWeight: 600 }}>
          No upcoming shifts scheduled
        </div>
      ) : (
        upcomingShifts.map((item, i) => (
          <div key={item.dateStr} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: i < upcomingShifts.length - 1 ? "1px solid rgba(20,61,48,0.06)" : "none",
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F0F7F3", display: "flex", alignItems: "center", justifyContent: "center", color: "#143D30" }}>
              {i === 0 ? <Shield size={14} /> : <BedDouble size={14} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>{item.time}</div>
            </div>
            <ChevronRight size={14} color="#CBD5E1" />
          </div>
        ))
      )}
    </div>
  );
}