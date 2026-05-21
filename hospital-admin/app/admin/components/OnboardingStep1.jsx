"use client";

const inp = { width:"100%", padding:"11px 14px", borderRadius:11, border:"1.5px solid rgba(20,61,48,0.12)", background:"white", fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none", fontWeight:500, boxSizing:"border-box", color:"#0F172A" };
const lbl = { fontSize:10, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:6, display:"block" };
const row = { display:"flex", gap:14 };
const half = { flex:1 };

export default function Step1({ data, onChange }) {
  const set = (k,v) => onChange({ ...data, [k]:v });
  const initials = data.name ? data.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "DR";

  return (
    <div>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#143D30", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>MEDICAL CREDENTIALING · STEP 01</p>
      <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:32, color:"#0F172A", letterSpacing:"-0.04em", marginBottom:6 }}>Personal Details</h1>
      <p style={{ fontSize:14, color:"#64748B", marginBottom:36 }}>Provide the specialist&apos;s personal and professional identification information.</p>

      {/* Avatar preview */}
      <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:32, padding:"20px 24px", background:"white", borderRadius:18, border:"1.5px solid rgba(20,61,48,0.09)", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg,#143D30,#1C5240)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, flexShrink:0 }}>{initials}</div>
        <div>
          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:"#0F172A", marginBottom:4 }}>{data.name || "Dr. Full Name"}</p>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EAF2EE", borderRadius:999, padding:"4px 12px" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#143D30", display:"inline-block" }}/>
            <span style={{ fontSize:11, fontWeight:800, color:"#143D30", fontFamily:"'Syne',sans-serif", letterSpacing:"0.08em" }}>SPECIALIST · PENDING ONBOARD</span>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={row}>
          <div style={half}>
            <label style={lbl}>FULL NAME *</label>
            <input style={inp} placeholder="Dr. Priya Mehta" value={data.name} onChange={e=>set("name",e.target.value)}
              onFocus={e=>e.target.style.borderColor="#143D30"} onBlur={e=>e.target.style.borderColor="rgba(20,61,48,0.12)"}/>
          </div>
          <div style={half}>
            <label style={lbl}>EMAIL ADDRESS *</label>
            <input style={inp} type="email" placeholder="doctor@hospital.com" value={data.email} onChange={e=>set("email",e.target.value)}
              onFocus={e=>e.target.style.borderColor="#143D30"} onBlur={e=>e.target.style.borderColor="rgba(20,61,48,0.12)"}/>
          </div>
        </div>

        <div style={row}>
          <div style={half}>
            <label style={lbl}>PHONE NUMBER *</label>
            <input style={inp} placeholder="91XXXXXXXXXX (with country code)" value={data.phone} onChange={e=>set("phone",e.target.value)}
              onFocus={e=>e.target.style.borderColor="#143D30"} onBlur={e=>e.target.style.borderColor="rgba(20,61,48,0.12)"}/>
          </div>
          <div style={half}>
            <label style={lbl}>ROOM / CABIN NUMBER</label>
            <input style={inp} placeholder="e.g. 204-B" value={data.room_number} onChange={e=>set("room_number",e.target.value)}
              onFocus={e=>e.target.style.borderColor="#143D30"} onBlur={e=>e.target.style.borderColor="rgba(20,61,48,0.12)"}/>
          </div>
        </div>

        <div style={row}>
          <div style={half}>
            <label style={lbl}>SLOT DURATION (MINUTES)</label>
            <select style={{ ...inp, appearance:"none", cursor:"pointer" }} value={data.slot_duration} onChange={e=>set("slot_duration",+e.target.value)}>
              {[10,15,20,30,45,60].map(d=><option key={d} value={d}>{d} min per patient</option>)}
            </select>
          </div>
          <div style={half}>
            <label style={lbl}>WORKING HOURS</label>
            <input style={inp} placeholder="09:00 AM - 06:00 PM" value={data.working_hours} onChange={e=>set("working_hours",e.target.value)}
              onFocus={e=>e.target.style.borderColor="#143D30"} onBlur={e=>e.target.style.borderColor="rgba(20,61,48,0.12)"}/>
          </div>
        </div>

        <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:13, padding:"13px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🔑</span>
          <p style={{ fontSize:12.5, color:"#92400E", lineHeight:1.6 }}>
            A secure login invite and default password will be sent directly to the doctor after onboarding is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
