import { UploadCloud, CheckCircle } from "lucide-react";

export default function Step2({ data, onChange }) {
  const toggleCheck = (key) => {
    onChange({
      ...data,
      checked: { ...data.checked, [key]: !data.checked[key] }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#0F172A", fontFamily: "'Syne', sans-serif" }}>Credentials & Verification</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748B" }}>Upload medical licenses, degrees, and verify background checks.</p>
      </div>

      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px dashed #CBD5E1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer" }}>
        <UploadCloud size={32} color="#143D30" />
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#143D30" }}>Click to upload files</span>
          <p style={{ margin: 0, fontSize: 11, color: "#64748B" }}>PDF, JPG, PNG (Max 5MB)</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Required Verifications</h3>
        {[
          { id: "license", label: "Medical License Verified" },
          { id: "degree", label: "Board Certification Verified" },
          { id: "background", label: "Background Check Completed" },
          { id: "insurance", label: "Malpractice Insurance Active" }
        ].map(item => (
          <div key={item.id} onClick={() => toggleCheck(item.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: data.checked[item.id] ? "#EEF9F5" : "#F8FAFC", border: `1px solid ${data.checked[item.id] ? "#4ECCA3" : "#E2E8F0"}`, borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}>
            <CheckCircle size={18} color={data.checked[item.id] ? "#10B981" : "#CBD5E1"} />
            <span style={{ fontSize: 13, fontWeight: 700, color: data.checked[item.id] ? "#143D30" : "#64748B" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
