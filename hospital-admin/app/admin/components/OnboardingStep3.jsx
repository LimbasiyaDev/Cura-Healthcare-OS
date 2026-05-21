"use client";
import { useState } from "react";
import { MapPin, Search, CheckCircle2 } from "lucide-react";

const DEPARTMENTS = [
  { key:"Cardiology",      icon:"❤️",  desc:"Heart health, vascular surgery, and diagnostics." },
  { key:"Pediatrics",      icon:"😊",  desc:"General care, neonatology, and adolescent medicine." },
  { key:"Neurology",       icon:"🧠",  desc:"Brain health, spinal care, and nerve disorders." },
  { key:"Emergency",       icon:"🚨",  desc:"Urgent care, trauma response, and critical triage." },
  { key:"Radiology",       icon:"🩻",  desc:"Diagnostic imaging, MRI, CT, and X-Ray analysis." },
  { key:"Oncology",        icon:"🔬",  desc:"Cancer treatment, research, and patient support." },
  { key:"Orthopedics",     icon:"🦴",  desc:"Bone, joint, and musculoskeletal conditions." },
  { key:"Gynecology",      icon:"🌸",  desc:"Women's health, obstetrics, and reproductive care." },
  { key:"Dermatology",     icon:"🧴",  desc:"Skin conditions, cosmetic, and allergy care." },
  { key:"Gastroenterology",icon:"🫁",  desc:"Digestive system, liver, and GI tract." },
  { key:"Ophthalmology",   icon:"👁️", desc:"Eye care, vision disorders, and surgery." },
  { key:"Psychiatry",      icon:"🧘",  desc:"Mental health, therapy, and behavioral care." },
];

const WARDS = [
  "Ward A – General",
  "Ward B – ICU",
  "Ward C – Pediatric",
  "Ward D – Surgery",
  "Ward E – Maternity",
  "Ward F – Emergency",
];

export default function Step3({ data, onChange, hospitals }) {
  const [search, setSearch] = useState("");

  const set = (k, v) => onChange({ ...data, [k]: v });
  const toggleWard = (w) => {
    const cur = data.wards || [];
    set("wards", cur.includes(w) ? cur.filter(x=>x!==w) : [...cur, w]);
  };

  const filteredHosp = hospitals.filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.address?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#143D30", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>MEDICAL CREDENTIALING · STEP 03</p>
      <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:32, color:"#0F172A", letterSpacing:"-0.04em", marginBottom:6 }}>Department & Clinic Assignment</h1>
      <p style={{ fontSize:14, color:"#64748B", marginBottom:28 }}>Assign the specialist&apos;s clinical department and select the hospital where they&apos;ll practice.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>

        {/* Left: Department + Wards */}
        <div>
          {/* Department grid */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:"#0F172A" }}>Primary Department</p>
            <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>Select one</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
            {DEPARTMENTS.map(dept=>{
              const active = data.department === dept.key;
              return (
                <div key={dept.key} onClick={()=>set("department",dept.key)} style={{ padding:"18px 16px", borderRadius:16, border:`1.5px solid ${active?"#143D30":"rgba(20,61,48,0.10)"}`, background:active?"#EAF2EE":"white", cursor:"pointer", position:"relative", transition:"all 0.15s", boxShadow:active?"0 4px 18px rgba(20,61,48,0.12)":"0 2px 6px rgba(0,0,0,0.04)" }}>
                  {active && <CheckCircle2 size={16} color="#143D30" style={{ position:"absolute", top:12, right:12 }}/>}
                  <div style={{ width:40, height:40, borderRadius:12, background:active?"#143D30":"#EAF2EE", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:10, transition:"background 0.15s" }}>{dept.icon}</div>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:"#0F172A", marginBottom:4 }}>{dept.key}</p>
                  <p style={{ fontSize:11, color:"#64748B", lineHeight:1.5 }}>{dept.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Wards */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:"#0F172A" }}>Assigned Wards</p>
            <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>Multi-select available</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {WARDS.map(w=>{
              const sel = (data.wards||[]).includes(w);
              return (
                <div key={w} onClick={()=>toggleWard(w)} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:13, border:`1.5px solid ${sel?"rgba(20,61,48,0.25)":"rgba(20,61,48,0.09)"}`, background:sel?"#EAF2EE":"white", cursor:"pointer", transition:"all 0.15s" }}>
                  <span style={{ fontSize:16 }}>🏥</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w}</p>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${sel?"#143D30":"#CBD5E1"}`, background:sel?"#143D30":"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                    {sel && <span style={{ color:"white", fontSize:12, lineHeight:1 }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Clinic/Hospital selection */}
        <div style={{ background:"white", borderRadius:18, border:"1.5px solid rgba(20,61,48,0.09)", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"#0F172A", marginBottom:4 }}>Clinic Location</p>
          <p style={{ fontSize:12, color:"#64748B", marginBottom:14 }}>Search and select the primary practicing hospital.</p>

          <div style={{ position:"relative", marginBottom:14 }}>
            <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clinics…"
              style={{ width:"100%", padding:"9px 14px 9px 34px", borderRadius:11, border:"1.5px solid rgba(20,61,48,0.12)", background:"#F8FAF9", fontSize:13, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", boxSizing:"border-box" }}/>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
            {filteredHosp.length===0 ? (
              <p style={{ textAlign:"center", color:"#94A3B8", fontSize:12, padding:"20px 0" }}>No hospitals found</p>
            ) : filteredHosp.map(h=>{
              const active = data.hospital_id === h.id;
              return (
                <div key={h.id} onClick={()=>set("hospital_id",h.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:13, background:active?"#143D30":"#F8FAF9", cursor:"pointer", transition:"all 0.15s", border:`1.5px solid ${active?"#143D30":"rgba(20,61,48,0.07)"}` }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:active?"rgba(255,255,255,0.18)":"#EAF2EE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MapPin size={14} color={active?"white":"#143D30"}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:active?"white":"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.name}</p>
                    {h.address && <p style={{ fontSize:11, color:active?"rgba(255,255,255,0.6)":"#94A3B8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.address}</p>}
                  </div>
                  {active && <CheckCircle2 size={15} color="white" style={{ flexShrink:0 }}/>}
                </div>
              );
            })}
          </div>

          {/* Map placeholder */}
          <div style={{ background:"linear-gradient(135deg,#143D30,#1C5240)", borderRadius:13, padding:"24px 16px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", minHeight:100 }}
            onClick={()=>{}}>
            <MapPin size={22} color="rgba(255,255,255,0.7)"/>
            <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.85)", fontFamily:"'Syne',sans-serif" }}>View in Interactive Map</p>
          </div>
        </div>
      </div>
    </div>
  );
}
