export default function Step1({ data, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0F172A", fontFamily: "'Syne', sans-serif" }}>Specialist Personal Details</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>Enter the core contact and identifying information for the new medical professional.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Full Name</label>
          <input 
            type="text" 
            placeholder="Dr. John Doe"
            value={data.name} 
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Email Address</label>
          <input 
            type="email" 
            placeholder="doctor@cura.com"
            value={data.email} 
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Phone Number</label>
          <input 
            type="text" 
            placeholder="+1 (555) 000-0000"
            value={data.phone} 
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>Room / Cabin Number</label>
          <input 
            type="text" 
            placeholder="e.g. A-102"
            value={data.room_number} 
            onChange={(e) => onChange({ ...data, room_number: e.target.value })}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>
  );
}
