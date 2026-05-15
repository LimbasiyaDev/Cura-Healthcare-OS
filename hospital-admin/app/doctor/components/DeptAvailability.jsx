"use client";

export default function DepartmentalAvailability({ appointments, blockedSlots, doctor, todayStr }) {
  // Calculate real availability from appointment data
  const slots = generateTimeSlots(doctor);
  const totalSlots = slots.length;

  // Group appointments by time period
  const morningAppts = appointments.filter(a => {
    if (a.date !== todayStr) return false;
    const hour = parseInt(a.slot?.split(":")[0]) || 0;
    const isPM = a.slot?.includes("PM");
    const h24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    return h24 >= 6 && h24 < 12;
  }).length;

  const afternoonAppts = appointments.filter(a => {
    if (a.date !== todayStr) return false;
    const hour = parseInt(a.slot?.split(":")[0]) || 0;
    const isPM = a.slot?.includes("PM");
    const h24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    return h24 >= 12 && h24 < 16;
  }).length;

  const eveningAppts = appointments.filter(a => {
    if (a.date !== todayStr) return false;
    const hour = parseInt(a.slot?.split(":")[0]) || 0;
    const isPM = a.slot?.includes("PM");
    const h24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    return h24 >= 16 && h24 < 20;
  }).length;

  const nightAppts = appointments.filter(a => {
    if (a.date !== todayStr) return false;
    const hour = parseInt(a.slot?.split(":")[0]) || 0;
    const isPM = a.slot?.includes("PM");
    const h24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    return h24 >= 20 || h24 < 6;
  }).length;

  const dept = doctor?.department || "General";

  const getColor = (count) => {
    if (count >= 8) return { bg: "#143D30", color: "white" };
    if (count >= 4) return { bg: "#4ECCA3", color: "white" };
    if (count >= 1) return { bg: "#A8D5BE", color: "#143D30" };
    return { bg: "#E2EAE6", color: "#64748B" };
  };

  const rows = [
    { ward: dept, morning: morningAppts, afternoon: afternoonAppts, evening: eveningAppts, night: nightAppts },
  ];
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#0F172A" }}>
          Departmental Availability
        </h3>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {[
            { bg: "#E2EAE6", label: "Low" },
            { bg: "#4ECCA3", label: "Med" },
            { bg: "#143D30", label: "High" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.bg }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {["WARD", "MORNING", "AFTERNOON", "EVENING", "NIGHT"].map(h => (
          <div key={h} style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", color: "#94A3B8",
            fontFamily: "'Syne',sans-serif", textTransform: "uppercase",
            textAlign: h === "WARD" ? "left" : "center",
          }}>{h}</div>
        ))}
      </div>

      {/* Table Rows */}
      {rows.map((row, i) => (
        <div key={row.ward} style={{
          display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 8,
          padding: "12px 0",
          borderBottom: i < rows.length - 1 ? "1px solid rgba(20,61,48,0.06)" : "none",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{row.ward}</div>
          {[row.morning, row.afternoon, row.evening, row.night].map((count, j) => {
            const c = getColor(count);
            return (
              <div key={j} style={{ display: "flex", justifyContent: "center" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: c.bg, color: c.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, fontFamily: "'Syne',sans-serif",
                }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function generateTimeSlots(doctor) {
  const hours = doctor?.active_hours || doctor?.working_hours;
  if (!hours) return [];
  const [startStr, endStr] = hours.split(" - ");
  try {
    let current = new Date(`1970/01/01 ${startStr}`);
    const end = new Date(`1970/01/01 ${endStr}`);
    const dur = doctor?.slot_duration || 20;
    const slots = [];
    while (current < end) {
      slots.push(current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
      current.setMinutes(current.getMinutes() + dur);
    }
    return slots;
  } catch { return []; }
}
