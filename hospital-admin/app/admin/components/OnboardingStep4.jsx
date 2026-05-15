"use client";
import { CheckCircle2, User, Building2, Clock, Phone, Mail, BedDouble } from "lucide-react";

function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #F1F7F3" }}>
      <span style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"'Syne',sans-serif" }}>{label}</span>
      <span style={{ fontSize:13.5, fontWeight:700, color:"#0F172A", maxWidth:260, textAlign:"right" }}>{value || <span style={{ color:"#CBD5E1" }}>Not provided</span>}</span>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div style={{ background:"white", borderRadius:18, border:"1.5px solid rgba(20,61,48,0.09)", padding:"22px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.04)", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:"#EAF2EE", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={16} color="#143D30"/>
        </div>
        <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"#0F172A" }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function Step4({ data, hospitals }) {
  const hosp = hospitals?.find(h=>h.id===data.hospital_id);
  const initials = data.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() || "DR";

  return (
    <div>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#143D30", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>MEDICAL CREDENTIALING · STEP 04</p>
      <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:32, color:"#0F172A", letterSpacing:"-0.04em", marginBottom:6 }}>Review & Confirm</h1>
      <p style={{ fontSize:14, color:"#64748B", marginBottom:28 }}>Please review all details before confirming the onboarding. This will create the doctor's account.</p>

      {/* Doctor preview hero */}
      <div style={{ background:"linear-gradient(135deg,#143D30,#1C5240)", borderRadius:20, padding:"28px 28px", display:"flex", alignItems:"center", gap:20, marginBottom:24, boxShadow:"0 8px 40px rgba(20,61,48,0.25)" }}>
        <div style={{ width:68, height:68, borderRadius:20, background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, flexShrink:0 }}>{initials}</div>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"white", marginBottom:4 }}>{data.name || "—"}</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {data.department && <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)", background:"rgba(255,255,255,0.15)", padding:"3px 10px", borderRadius:999, fontFamily:"'Syne',sans-serif" }}>{data.department}</span>}
            {hosp && <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)", background:"rgba(255,255,255,0.15)", padding:"3px 10px", borderRadius:999, fontFamily:"'Syne',sans-serif" }}>🏥 {hosp.name}</span>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 16px" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:"#4ECCA3", display:"inline-block", animation:"pulseDot 2s infinite" }}/>
          <span style={{ fontSize:12, fontWeight:700, color:"white", fontFamily:"'Syne',sans-serif" }}>READY TO ONBOARD</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <Card icon={User} title="Personal Details">
            <Row label="Full Name"    value={data.name}/>
            <Row label="Email"        value={data.email}/>
            <Row label="Phone"        value={data.phone}/>
            <Row label="Room / Cabin" value={data.room_number}/>
          </Card>
          <Card icon={Clock} title="Schedule">
            <Row label="Working Hours"  value={data.working_hours}/>
            <Row label="Slot Duration"  value={data.slot_duration ? `${data.slot_duration} min` : null}/>
          </Card>
        </div>
        <div>
          <Card icon={Building2} title="Clinical Assignment">
            <Row label="Department"  value={data.department}/>
            <Row label="Hospital"    value={hosp?.name}/>
            {hosp?.address && <Row label="Address" value={hosp.address}/>}
          </Card>
          {(data.wards||[]).length > 0 && (
            <Card icon={BedDouble} title="Assigned Wards">
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {(data.wards||[]).map(w=>(
                  <div key={w} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #F1F7F3" }}>
                    <CheckCircle2 size={14} color="#059669"/>
                    <span style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{w}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm banner */}
      <div style={{ background:"#ECFDF5", border:"1.5px solid #A7F3D0", borderRadius:14, padding:"16px 20px", display:"flex", gap:12, alignItems:"flex-start", marginTop:4 }}>
        <CheckCircle2 size={20} color="#059669" style={{ flexShrink:0, marginTop:1 }}/>
        <div>
          <p style={{ fontWeight:800, fontSize:13.5, color:"#065F46", marginBottom:2, fontFamily:"'Syne',sans-serif" }}>Ready to Confirm</p>
          <p style={{ fontSize:12, color:"#047857", lineHeight:1.6 }}>Clicking <strong>Confirm &amp; Onboard</strong> will create the doctor's Supabase auth account and send login credentials via WhatsApp.</p>
        </div>
      </div>
    
    </div>
  );
}
