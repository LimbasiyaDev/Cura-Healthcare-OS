"use client";
import { useState } from "react";
import { Trash2, Search } from "lucide-react";

export default function DoctorList({ doctors, appointments, hospitals, activeHospital, onManage, onDelete, externalSearch = "" }) {
  const [localSearch, setLocalSearch] = useState("");

  // Merge topbar search with local search — use whichever is non-empty
  const search = externalSearch || localSearch;

  const filtered = doctors
    .filter(d => d.hospital_id === activeHospital?.id)
    .filter(d =>
      !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.department?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, gap:12 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.03em", flexShrink:0 }}>
          Specialists ({filtered.length})
        </h2>
        <div style={{ position:"relative", flex:1, maxWidth:300 }}>
          <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}/>
          <input
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="Search by name or department…"
            style={{ width:"100%", padding:"9px 14px 9px 34px", borderRadius:12, border:"1.5px solid rgba(20,61,48,0.10)", background:"white", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", fontWeight:500, color:"#334155" }}
            onFocus={e => e.target.style.borderColor = "#143D30"}
            onBlur={e => e.target.style.borderColor = "rgba(20,61,48,0.10)"}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0", color:"#94A3B8", fontSize:14, fontWeight:600 }}>
          {search ? `No doctors matching "${search}"` : `No specialists for ${activeHospital?.name || "this hospital"}.`}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(doc => {
            const docAppts = appointments.filter(a => a.doctor_id === doc.id);
            const pending  = docAppts.filter(a => a.status === "pending").length;
            const initials = doc.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "DR";
            const hosp     = hospitals?.find(h => h.id === doc.hospital_id);
            return (
              <div key={doc.id} style={{ background:"white", border:"1.5px solid rgba(20,61,48,0.09)", borderRadius:18, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 8px rgba(0,0,0,0.04)", transition:"box-shadow 0.2s" }}>

                <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#143D30,#1C5240)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:15, flexShrink:0 }}>
                  {initials}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:15, color:"#0F172A" }}>Dr. {doc.name}</span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:999, fontSize:9, fontWeight:800, background: doc.is_available?"#ECFDF5":"#F1F5F9", color: doc.is_available?"#059669":"#94A3B8", fontFamily:"'Syne',sans-serif" }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background: doc.is_available?"#059669":"#94A3B8", display:"inline-block" }}/>
                      {doc.is_available ? "Online" : "Offline"}
                    </span>
                    {pending > 0 && (
                      <span style={{ display:"inline-flex", padding:"2px 8px", borderRadius:999, fontSize:9, fontWeight:800, background:"#FFFBEB", color:"#D97706", fontFamily:"'Syne',sans-serif" }}>
                        {pending} pending
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:12, color:"#64748B", marginBottom:1 }}>
                    {doc.department}{doc.room_number ? ` · Room ${doc.room_number}` : ""}
                  </p>
                  <p style={{ fontSize:11, color:"#94A3B8" }}>{doc.email}</p>
                </div>

                <div style={{ textAlign:"center", flexShrink:0, minWidth:54 }}>
                  <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>APPTS</p>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", lineHeight:1 }}>{docAppts.length}</p>
                </div>

                <div style={{ textAlign:"right", flexShrink:0, minWidth:90 }}>
                  <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:2 }}>SHIFT</p>
                  <p style={{ fontSize:11, fontWeight:700, color:"#334155" }}>{doc.working_hours?.split(" - ")[0] || "Not set"}</p>
                </div>

                <button onClick={() => onManage({ ...doc, hospital_name: hosp?.name })}
                  style={{ padding:"9px 18px", borderRadius:10, background:"#F0F7F3", border:"1.5px solid rgba(20,61,48,0.12)", color:"#143D30", fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Syne',sans-serif", flexShrink:0, letterSpacing:"0.06em" }}>
                  MANAGE
                </button>

                <button onClick={() => onDelete(doc)}
                  style={{ width:34, height:34, borderRadius:10, border:"1.5px solid #FECACA", background:"#FFF5F5", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#EF4444", flexShrink:0 }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}