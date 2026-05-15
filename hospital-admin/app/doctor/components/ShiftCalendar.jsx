"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ShiftCalendar({ holidays, appointments, todayStr, onToggleHoliday }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  // Count appointments per date for indicators
  const apptsByDate = {};
  appointments.forEach(a => {
    if (!apptsByDate[a.date]) apptsByDate[a.date] = [];
    apptsByDate[a.date].push(a);
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#0F172A", marginBottom: 4 }}>
          Global Shift Management
        </h3>
        <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>
          Ward rotation calendar for {MONTH_NAMES[month]} {year}
        </p>
      </div>

      {/* Month Nav */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 18 }}>
        <button onClick={prevMonth} style={{
          width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(20,61,48,0.08)",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#64748B",
        }}><ChevronLeft size={16} /></button>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#0F172A", minWidth: 120, textAlign: "center" }}>
          {MONTH_NAMES[month]}
        </div>
        <button onClick={nextMonth} style={{
          width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(20,61,48,0.08)",
          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#64748B",
        }}><ChevronRight size={16} /></button>
      </div>

      {/* Day Headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {["MON","TUE","WED","THU","FRI","SAT","SUN"].map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: 9, fontWeight: 800,
            color: d === "FRI" ? "#143D30" : "#94A3B8",
            letterSpacing: "0.1em", padding: "6px 0", fontFamily: "'Syne',sans-serif",
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {/* Adjust for Monday start */}
        {Array.from({ length: (getFirstDay(year, month) + 6) % 7 }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isHoliday = holidays.includes(dateStr);
          const dayAppts = apptsByDate[dateStr] || [];
          const isPast = dateStr < todayStr;
          const bookedCount = dayAppts.filter(a => a.status === "booked").length;
          const pendingCount = dayAppts.filter(a => a.status === "pending").length;

          return (
            <button key={day} onClick={() => !isPast && onToggleHoliday?.(dateStr)} style={{
              width: "100%", aspectRatio: "1", borderRadius: 10, border: isToday ? "2px solid #143D30" : "none",
              background: isHoliday ? "#EF4444" : isPast ? "transparent" : "#EAF2EE",
              color: isHoliday ? "white" : isPast ? "#CBD5E1" : "#143D30",
              fontSize: 13, fontWeight: isToday ? 800 : 600, cursor: isPast ? "default" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              transition: "all 0.15s", position: "relative",
            }}>
              {day}
              {/* Appointment indicators */}
              {(bookedCount > 0 || pendingCount > 0) && !isHoliday && (
                <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 3 }}>
                  {bookedCount > 0 && <div style={{ width: 14, height: 3, borderRadius: 2, background: "#143D30" }} />}
                  {pendingCount > 0 && <div style={{ width: 14, height: 3, borderRadius: 2, background: "#EF4444" }} />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
