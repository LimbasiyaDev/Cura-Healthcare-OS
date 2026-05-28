export default function Step3({ data, onChange, hospitals }) {
  const toggleWard = (ward) => {
    const w = data.wards || [];
    if (w.includes(ward)) {
      onChange({ ...data, wards: w.filter(x => x !== ward) });
    } else {
      onChange({ ...data, wards: [...w, ward] });
    }
  };

  const departments = ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Oncology", "General Medicine", "Dermatology"];
  const wardsList = ["ICU", "General Ward A", "General Ward B", "Emergency", "Maternity"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0F172A", fontFamily: "'Syne', sans-serif" }}>Department Assignment</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>Assign the specialist to a hospital, department, and specific wards.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Hospital Branch</label>
          <select 
            value={data.hospital_id || ""} 
            onChange={(e) => onChange({ ...data, hospital_id: e.target.value })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white", appearance: "none" }}
          >
            <option value="" disabled>Select a hospital...</option>
            {hospitals?.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Department / Specialty</label>
          <select 
            value={data.department} 
            onChange={(e) => onChange({ ...data, department: e.target.value })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box", background: "white", appearance: "none" }}
          >
            <option value="" disabled>Select primary department...</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Ward Access</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {wardsList.map(w => {
              const selected = (data.wards || []).includes(w);
              return (
                <div 
                  key={w} 
                  onClick={() => toggleWard(w)}
                  style={{ padding: "8px 16px", borderRadius: 20, background: selected ? "#143D30" : "white", color: selected ? "white" : "#64748B", border: `1px solid ${selected ? "#143D30" : "#CBD5E1"}`, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                >
                  {w}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
