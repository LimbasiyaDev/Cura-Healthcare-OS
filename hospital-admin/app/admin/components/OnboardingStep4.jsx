export default function Step4({ data, hospitals }) {
  const hospital = hospitals?.find(h => h.id === data.hospital_id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0F172A", fontFamily: "'Syne', sans-serif" }}>Review & Confirm</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>Please review the final details before sending the onboarding invitation.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Personal Details</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Name</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{data.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Email</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{data.email}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Phone</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{data.phone}</span>
            </div>
          </div>
        </div>

        <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <h4 style={{ margin: "0 0 16px 0", fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Assignment</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Hospital</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{hospital?.name || "None"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Department</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{data.department || "None"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Room / Cabin</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{data.room_number || "None"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Wards</span>
              <span style={{ fontWeight: 700, color: "#0F172A", textAlign: "right" }}>{data.wards?.join(", ") || "None"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "#EEF9F5", padding: 20, borderRadius: 16, border: "1px solid #A7F3D0" }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 800, color: "#065F46" }}>Next Steps</h4>
        <p style={{ margin: 0, fontSize: 12, color: "#065F46", lineHeight: 1.5 }}>
          Upon confirming, a secure invitation link will be sent to <strong>{data.email}</strong>. The specialist will be prompted to set their permanent password and agree to the hospital's operational policies before they can access their dashboard.
        </p>
      </div>
    </div>
  );
}
