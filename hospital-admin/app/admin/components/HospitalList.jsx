"use client";
import { useState } from "react";
import { Pencil, Search } from "lucide-react";

function HospTag({ children, color = "#143D30", bg = "#EAF2EE" }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:999, fontSize:10, fontWeight:800, background:bg, color, fontFamily:"'Syne',sans-serif", letterSpacing:"0.08em" }}>
      {children}
    </span>
  );
}

export default function HospitalList({ hospitals, activeHospital, onSwitch, onEdit, onAddHospital, doctors, externalSearch = "" }) {
  const [localSearch, setLocalSearch] = useState("");

  const search = externalSearch || localSearch;

  const filtered = hospitals.filter(h =>
    !search ||
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.03em" }}>
          All Hospitals ({filtered.length})
        </h2>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ position:"relative" }}>
            <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}/>
            <input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search hospitals…"
              style={{ padding:"9px 14px 9px 34px", borderRadius:12, border:"1.5px solid rgba(20,61,48,0.10)", background:"white", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", fontWeight:500, color:"#334155", width:220 }}
              onFocus={e => e.target.style.borderColor = "#143D30"}
              onBlur={e => e.target.style.borderColor = "rgba(20,61,48,0.10)"}
            />
          </div>
          <button onClick={onAddHospital}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"#143D30", color:"white", borderRadius:12, border:"none", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", boxShadow:"0 4px 16px rgba(20,61,48,0.28)", flexShrink:0 }}>
            + ADD HOSPITAL
          </button>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#94A3B8", fontSize:14, fontWeight:600 }}>
            {search ? `No hospitals matching "${search}"` : "No hospitals yet. Add your first hospital."}
          </div>
        )}
        {filtered.map(h => {
          const isActive  = h.id === activeHospital?.id;
          const docCount  = doctors.filter(d => d.hospital_id === h.id).length;
          const hasWA     = !!(h.phone_number_id && h.whatsapp_token);
          return (
            <div key={h.id} style={{ background:"white", border:`1.5px solid ${isActive ? "#143D30" : "rgba(20,61,48,0.09)"}`, borderRadius:18, padding:"18px 22px", display:"flex", alignItems:"center", gap:16, boxShadow: isActive ? "0 4px 24px rgba(20,61,48,0.12)" : "0 2px 8px rgba(0,0,0,0.04)", transition:"all 0.2s" }}>

              <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#143D30,#1C5240)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🏥</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16, color:"#0F172A" }}>{h.name}</span>
                  {isActive && <HospTag>ACTIVE</HospTag>}
                </div>
                {h.address && (
                  <p style={{ fontSize:12, color:"#64748B", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📍 {h.address}</p>
                )}
                <p style={{ fontSize:11, fontWeight:700, color: hasWA ? "#059669" : "#F59E0B" }}>
                  {hasWA ? "✅ WhatsApp configured" : "⚠️ WhatsApp not configured"}
                </p>
              </div>

              <div style={{ textAlign:"right", flexShrink:0 }}>
                <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>DOCTORS</p>
                <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", lineHeight:1 }}>{docCount}</p>
              </div>

              <button onClick={() => onEdit(h)}
                style={{ width:34, height:34, borderRadius:10, border:"1.5px solid rgba(20,61,48,0.12)", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", flexShrink:0 }}>
                <Pencil size={13}/>
              </button>

              {isActive
                ? <div style={{ padding:"10px 18px", borderRadius:12, border:"2px solid #143D30", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:12, color:"#143D30", letterSpacing:"0.08em", flexShrink:0 }}>SELECTED</div>
                : <button onClick={() => onSwitch(h)}
                    style={{ padding:"10px 18px", borderRadius:12, border:"none", background:"none", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:12, color:"#94A3B8", letterSpacing:"0.08em", cursor:"pointer", flexShrink:0, transition:"color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#143D30"}
                    onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}>
                    SWITCH TO
                  </button>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}