"use client";
import { useState, useEffect } from "react";
import { X, Calendar, Clock, Phone, Mail, Shield } from "lucide-react";

function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid #F1F7F3" }}>
      <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color:"#0F172A", maxWidth:200, textAlign:"right", wordBreak:"break-all" }}>{value || "—"}</span>
    </div>
  );
}

export default function DoctorDrawer({ doctor, appointments, onClose, onToggleAvailability, onUpdateField, showToast }) {
  const [savingField, setSavingField] = useState(null);
  const [editHours, setEditHours]     = useState(false);
  const [hours, setHours]             = useState(doctor.working_hours || "09:00 AM - 06:00 PM");
  const [editRoom, setEditRoom]       = useState(false);
  const [room, setRoom]               = useState(doctor.room_number || "");

  const [prevDoctor, setPrevDoctor]   = useState(doctor);
  if (doctor.id !== prevDoctor.id || doctor.working_hours !== prevDoctor.working_hours || doctor.room_number !== prevDoctor.room_number) {
    setPrevDoctor(doctor);
    setHours(doctor.working_hours || "09:00 AM - 06:00 PM");
    setRoom(doctor.room_number || "");
  }

  const docAppts   = appointments.filter(a => a.doctor_id === doctor.id);
  const pending    = docAppts.filter(a => a.status === "pending");
  const confirmed  = docAppts.filter(a => a.status === "booked");
  const rejected   = docAppts.filter(a => a.status === "rejected");
  const today      = new Date().toISOString().split("T")[0];
  const todayAppts = docAppts.filter(a => a.date === today);

  const initials = doctor.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() || "DR";

  async function saveHours() {
    const hoursRx = /^\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)$/i;
    if (!hoursRx.test(hours.trim())) {
      showToast("Format must be: 09:00 AM - 06:00 PM", "error");
      return;
    }
    setSavingField("hours");
    await onUpdateField(doctor.id, { working_hours: hours.trim() });
    setSavingField(null);
    setEditHours(false);
    showToast("Working hours updated");
  }

  async function saveRoom() {
    setSavingField("room");
    await onUpdateField(doctor.id, { room_number: room });
    setSavingField(null);
    setEditRoom(false);
    showToast("Room number updated");
  }

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(8,28,20,0.45)", backdropFilter:"blur(8px)", zIndex:900 }}/>
      <div style={{ position:"fixed", right:0, top:0, bottom:0, width:420, background:"white", zIndex:901, overflowY:"auto", boxShadow:"-16px 0 64px rgba(20,61,48,0.18)", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"28px 24px 20px", borderBottom:"1px solid #F1F7F3", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,#143D30,#1C5240)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18 }}>{initials}</div>
            <div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, color:"#0F172A", letterSpacing:"-0.03em", marginBottom:2 }}>Dr. {doctor.name}</h3>
              <p style={{ fontSize:12, color:"#64748B" }}>{doctor.department}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><X size={15}/></button>
        </div>

        <div style={{ padding:"20px 24px", flex:1 }}>

          {/* Availability toggle */}
          <div style={{ background: doctor.is_available ? "linear-gradient(135deg,#ECFDF5,#D1FAE5)" : "#F1F5F9", border:`1.5px solid ${doctor.is_available?"#A7F3D0":"#E2E8F0"}`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background: doctor.is_available?"#10B981":"#94A3B8", display:"inline-block" }}/>
              <div>
                <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:14, color:"#0F172A" }}>{doctor.is_available ? "Online — Accepting Patients" : "Offline"}</p>
                <p style={{ fontSize:11, color:"#64748B" }}>Website bot routes to this doctor</p>
              </div>
            </div>
            <button onClick={() => onToggleAvailability(doctor)} style={{ padding:"8px 16px", borderRadius:10, border:"none", background: doctor.is_available ? "#EF4444" : "#143D30", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, cursor:"pointer", letterSpacing:"0.08em" }}>
              {doctor.is_available ? "GO OFFLINE" : "GO ONLINE"}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:22 }}>
            {[
              { label:"TODAY",     val:todayAppts.length, color:"#143D30" },
              { label:"PENDING",   val:pending.length,    color:"#F59E0B" },
              { label:"CONFIRMED", val:confirmed.length,  color:"#10B981" },
              { label:"REJECTED",  val:rejected.length,   color:"#EF4444" },
            ].map(s => (
              <div key={s.label} style={{ background:"#F8FAF9", borderRadius:12, padding:"12px 10px", textAlign:"center", border:"1px solid rgba(20,61,48,0.06)" }}>
                <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:s.color, lineHeight:1, marginBottom:4 }}>{s.val}</p>
                <p style={{ fontSize:8, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Info rows */}
          <div style={{ background:"#F8FAF9", borderRadius:16, padding:"4px 16px", marginBottom:20 }}>
            <Row label="Email"       value={doctor.email}/>
            <Row label="Phone"       value={doctor.phone}/>
            <Row label="Slot"        value={`${doctor.slot_duration || 20} min`}/>
            <Row label="Hospital"    value={doctor.hospital_name || `ID: ${doctor.hospital_id}`}/>
          </div>

          {/* Working hours */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>WORKING HOURS</label>
              <button onClick={() => setEditHours(v=>!v)} style={{ fontSize:11, fontWeight:800, color:"#143D30", background:"none", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                {editHours ? "CANCEL" : "EDIT"}
              </button>
            </div>
            {editHours ? (
              <div style={{ display:"flex", gap:8 }}>
                <input value={hours} onChange={e=>setHours(e.target.value)} className="input-base" placeholder="09:00 AM - 06:00 PM" style={{ flex:1 }}/>
                <button onClick={saveHours} disabled={savingField==="hours"} style={{ padding:"10px 16px", background:"#143D30", color:"white", borderRadius:12, border:"none", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, cursor:"pointer" }}>
                  {savingField==="hours" ? "…" : "SAVE"}
                </button>
              </div>
            ) : (
              <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", background:"#F8FAF9", padding:"11px 15px", borderRadius:12, border:"1.5px solid rgba(20,61,48,0.09)" }}>{doctor.working_hours || "Not set"}</p>
            )}
          </div>

          {/* Room number */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>ROOM NUMBER</label>
              <button onClick={() => setEditRoom(v=>!v)} style={{ fontSize:11, fontWeight:800, color:"#143D30", background:"none", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                {editRoom ? "CANCEL" : "EDIT"}
              </button>
            </div>
            {editRoom ? (
              <div style={{ display:"flex", gap:8 }}>
                <input value={room} onChange={e=>setRoom(e.target.value)} className="input-base" placeholder="e.g. 204" style={{ flex:1 }}/>
                <button onClick={saveRoom} disabled={savingField==="room"} style={{ padding:"10px 16px", background:"#143D30", color:"white", borderRadius:12, border:"none", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, cursor:"pointer" }}>
                  {savingField==="room" ? "…" : "SAVE"}
                </button>
              </div>
            ) : (
              <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", background:"#F8FAF9", padding:"11px 15px", borderRadius:12, border:"1.5px solid rgba(20,61,48,0.09)" }}>{doctor.room_number || "Not assigned"}</p>
            )}
          </div>

          {/* Recent appointments */}
          {docAppts.length > 0 && (
            <div>
              <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:12 }}>RECENT APPOINTMENTS</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {docAppts.slice(0,5).map(a => (
                  <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#F8FAF9", borderRadius:12, border:"1px solid rgba(20,61,48,0.06)" }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>{a.name || a.id?.toString().slice(0,8)}</span>
                    <span style={{ fontSize:11, color:"#64748B" }}>{a.date}</span>
                    <span style={{ display:"inline-flex", padding:"2px 9px", borderRadius:999, fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif",
                      background: a.status==="booked"?"#ECFDF5":a.status==="rejected"?"#FEF2F2":"#FFFBEB",
                      color:      a.status==="booked"?"#059669":a.status==="rejected"?"#DC2626":"#D97706" }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
