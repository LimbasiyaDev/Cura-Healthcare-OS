"use client";
import { useState } from "react";
import { Calendar, Plus, X } from "lucide-react";

export default function HolidayConfig({ doctor, holidays, todayStr, onToggleHoliday, onToggleField }) {
  const isClinicClosed = holidays.includes(todayStr);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState("");
  const [pickerError, setPickerError] = useState("");

  const upcomingHolidays = holidays
    .filter(h => h >= todayStr)
    .sort()
    .slice(0, 3)
    .map(h => {
      const d = new Date(h + "T00:00:00");
      return {
        date: h,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        name: "Doctor Holiday",
      };
    });

  const handleAddHoliday = () => {
    setPickerError("");
    if (!pickerDate) { setPickerError("Please select a date."); return; }
    if (holidays.includes(pickerDate)) { setPickerError("This date is already a holiday."); return; }
    onToggleHoliday(pickerDate);
    setPickerDate("");
    setShowPicker(false);
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#0F172A" }}>
          Holiday Config
        </h3>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F0F7F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calendar size={15} color="#143D30" />
        </div>
      </div>

      {/* Clinic Closure Toggle */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderRadius: 14, background: "#F8FAF9",
        border: "1px solid rgba(20,61,48,0.07)", marginBottom: 18,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Clinic Closure</div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 1 }}>Emergency mode only</div>
        </div>
        <button
          onClick={() => onToggleHoliday(todayStr)}
          className={`toggle-track${isClinicClosed ? " on" : ""}`}
        >
          <div className="toggle-thumb" />
        </button>
      </div>

      {/* Upcoming Holidays */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#94A3B8", fontFamily: "'Syne',sans-serif" }}>
          Upcoming Public Holidays
        </div>
        <button
          onClick={() => { setShowPicker(p => !p); setPickerDate(""); setPickerError(""); }}
          style={{
            width: 32, height: 32, borderRadius: "50%", background: "#143D30",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(20,61,48,0.35)", color: "white",
          }}>
          {showPicker ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Inline date picker */}
      {showPicker && (
        <div style={{
          background: "#F0F7F3", border: "1.5px solid rgba(20,61,48,0.12)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#143D30", marginBottom: 8, fontFamily: "'Syne',sans-serif", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Select Holiday Date
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={pickerDate}
              min={todayStr}
              onChange={e => { setPickerDate(e.target.value); setPickerError(""); }}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10,
                border: "1.5px solid rgba(20,61,48,0.15)", background: "white",
                fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif",
                outline: "none", color: "#0F172A",
              }}
            />
            <button
              onClick={handleAddHoliday}
              style={{
                padding: "9px 16px", background: "#143D30", color: "white",
                border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Syne',sans-serif", whiteSpace: "nowrap",
              }}>
              Add
            </button>
          </div>
          {pickerError && (
            <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, marginTop: 6 }}>{pickerError}</div>
          )}
        </div>
      )}

      {upcomingHolidays.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#CBD5E1", fontSize: 12, fontWeight: 600 }}>
          No upcoming holidays scheduled
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcomingHolidays.map((h) => (
            <div key={h.date} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 12,
              background: "#F8FAF9", border: "1px solid rgba(20,61,48,0.06)",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{h.name}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginTop: 1 }}>{h.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                  fontFamily: "'Syne',sans-serif",
                  background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA",
                }}>Closed</span>
                <button
                  onClick={() => onToggleHoliday(h.date)}
                  title="Remove holiday"
                  style={{
                    width: 24, height: 24, borderRadius: "50%", background: "#FEF2F2",
                    border: "1px solid #FECACA", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "#EF4444",
                  }}>
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}