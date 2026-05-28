export default function PharmacyList({ pharmacies, externalSearch }) {
  const filtered = pharmacies.filter(p => {
    const q = externalSearch.toLowerCase();
    return !q || 
      p.name?.toLowerCase().includes(q) || 
      p.email?.toLowerCase().includes(q) || 
      p.location?.toLowerCase().includes(q) ||
      p.lead_pharmacist?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.03em" }}>
          Pharmacies ({filtered.length})
        </h2>
      </div>

      <div style={{ background:"white", borderRadius:18, border:"1px solid rgba(20,61,48,0.07)", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 1fr 1fr", gap:8, padding:"10px 22px", background:"#FAFCFB", borderBottom:"1px solid #F1F7F3" }}>
          {["PHARMACY NAME", "EMAIL", "LOCATION", "LEAD PHARMACIST", "LICENSE ID"].map(h => (
            <span key={h} style={{ fontSize:9, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#94A3B8", fontSize:14, fontWeight:600 }}>
            {externalSearch ? `No pharmacies matching "${externalSearch}"` : "No pharmacies found"}
          </div>
        ) : filtered.map((pharm, i) => (
          <div key={pharm.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 1fr 1fr", gap:8, padding:"13px 22px", alignItems:"center", borderBottom:i < filtered.length - 1 ? "1px solid #F8FBFA" : "none", transition:"background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#F6FAF8"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{pharm.name}</p>
            </div>
            <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{pharm.email}</span>
            <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{pharm.location || "—"}</span>
            <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{pharm.lead_pharmacist || "—"}</span>
            <span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>{pharm.license_id || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
