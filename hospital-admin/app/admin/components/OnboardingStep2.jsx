"use client";
import { useState } from "react";
import { UploadCloud, FileText, Image, CheckCircle2, X, MoreVertical } from "lucide-react";

const CHECKLIST = [
  { key:"govt_id",     label:"Government Issued ID",   sub:"Passport, Driver's License, or National ID" },
  { key:"med_degree",  label:"Primary Medical Degree",  sub:"MBBS / MD certificate" },
  { key:"board_cert",  label:"Board Certifications",    sub:"Specialization certificates or diplomas" },
  { key:"registration",label:"Medical Council Registration", sub:"State / National medical license" },
];

export default function Step2({ data, onChange }) {
  const [dragging, setDragging] = useState(false);
  const uploads = data.uploads || [];
  const checked = data.checked || {};

  const setUploads = (u) => onChange({ ...data, uploads: u });
  const setChecked = (c) => onChange({ ...data, checked: c });

  function addFiles(files) {
    const newFiles = Array.from(files).map(f => ({
      name: f.name, size: (f.size/1024/1024).toFixed(1)+"MB",
      progress: 100, done: true, id: Math.random().toString(36).slice(2)
    }));
    setUploads([...uploads, ...newFiles]);
  }

  function removeFile(id) { setUploads(uploads.filter(u=>u.id!==id)); }

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#143D30", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>MEDICAL CREDENTIALING · STEP 02</p>
      <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:32, color:"#0F172A", letterSpacing:"-0.04em", marginBottom:6 }}>Credentials & Verifications</h1>
      <p style={{ fontSize:14, color:"#64748B", marginBottom:32 }}>Upload professional qualifications and identity documents for verification.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>

        {/* Upload area */}
        <div>
          <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}
            style={{ border:`2px dashed ${dragging?"#143D30":"rgba(20,61,48,0.2)"}`, borderRadius:18, padding:"48px 24px", textAlign:"center", background:dragging?"#EAF2EE":"white", transition:"all 0.2s", marginBottom:20 }}>
            <div style={{ width:56, height:56, borderRadius:18, background:"#EAF2EE", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <UploadCloud size={26} color="#143D30"/>
            </div>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:17, color:"#0F172A", marginBottom:6 }}>Drop files to upload</p>
            <p style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>Support for PDF, JPG, or PNG (Max. 10MB per file)</p>
            <label style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px", background:"#143D30", color:"white", borderRadius:12, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, cursor:"pointer", boxShadow:"0 4px 14px rgba(20,61,48,0.28)", letterSpacing:"0.06em" }}>
              <span>+</span> Select Files
              <input type="file" multiple accept=".pdf,.jpg,.png" style={{ display:"none" }} onChange={e=>addFiles(e.target.files)}/>
            </label>
          </div>

          {/* Uploaded files */}
          {uploads.length > 0 && (
            <div>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:12 }}>RECENT UPLOADS</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {uploads.map(f=>(
                  <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", background:"white", borderRadius:13, border:"1.5px solid rgba(20,61,48,0.09)", boxShadow:"0 2px 6px rgba(0,0,0,0.04)" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"#EAF2EE", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {f.name.endsWith(".pdf")?<FileText size={16} color="#143D30"/>:<Image size={16} color="#143D30"/>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:4 }}>{f.name}</p>
                      <div style={{ height:4, background:"#E2EAE6", borderRadius:999, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${f.progress}%`, background:"#143D30", borderRadius:999 }}/>
                      </div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:"#94A3B8", flexShrink:0 }}>{f.done?<CheckCircle2 size={17} color="#059669"/>:`${f.progress}%`}</span>
                    <button onClick={()=>removeFile(f.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:4 }}><X size={15}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Checklist sidebar */}
        <div>
          <div style={{ background:"white", borderRadius:18, border:"1.5px solid rgba(20,61,48,0.09)", padding:"20px", marginBottom:14, boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:"#0F172A" }}>Checklist</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#143D30", background:"#EAF2EE", padding:"3px 10px", borderRadius:999 }}>{doneCount}/{CHECKLIST.length} Complete</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {CHECKLIST.map(item=>{
                const done = checked[item.key];
                return (
                  <div key={item.key} onClick={()=>setChecked({...checked,[item.key]:!done})} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 12px", borderRadius:11, background:done?"#F0F7F3":"transparent", border:`1.5px solid ${done?"rgba(20,61,48,0.14)":"transparent"}`, cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${done?"#143D30":"#CBD5E1"}`, background:done?"#143D30":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      {done&&<CheckCircle2 size={11} color="white"/>}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color: done?"#143D30":"#0F172A", marginBottom:1 }}>{item.label}</p>
                      <p style={{ fontSize:11, color:"#94A3B8" }}>{done?"Verified":""+item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification note */}
          <div style={{ background:"#F8FAFF", border:"1px solid #DBEAFE", borderRadius:13, padding:"14px 16px", display:"flex", gap:10 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
            <div>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#3B82F6", fontFamily:"'Syne',sans-serif", marginBottom:4 }}>VERIFICATION NOTE</p>
              <p style={{ fontSize:12, color:"#3B82F6", lineHeight:1.6 }}>Our admin team typically verifies documents within 24–48 hours. You can continue the onboarding steps while we process credentials.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security banner */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderRadius:16, overflow:"hidden", border:"1.5px solid rgba(20,61,48,0.09)", marginTop:24, boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ background:"white", padding:"28px 28px" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:20, color:"#0F172A", marginBottom:10 }}>Your security is our priority.</h3>
          <p style={{ fontSize:13, color:"#64748B", lineHeight:1.65, marginBottom:16 }}>All documents are encrypted with AES-256 standard and stored in HIPAA-compliant medical vaults. Only authorized admin officers will review your submission.</p>
          <div style={{ display:"flex", gap:18 }}>
            <span style={{ fontSize:12, fontWeight:700, color:"#143D30", display:"flex", alignItems:"center", gap:5 }}>🔒 256-bit Encryption</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#143D30", display:"flex", alignItems:"center", gap:5 }}>🏥 HIPAA Compliant</span>
          </div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#143D30,#1C5240)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:120 }}>
          <span style={{ fontSize:48 }}>🏥</span>
        </div>
      </div>
    </div>
  );
}
