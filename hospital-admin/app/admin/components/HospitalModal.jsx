"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function HospitalModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", address: "" });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(8,28,20,0.55)", backdropFilter:"blur(10px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"white", borderRadius:28, padding:"2.5rem 2rem", width:"100%", maxWidth:480, margin:20, boxShadow:"0 40px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.25em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>MULTI-HOSPITAL MANAGEMENT</p>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:28, color:"#0F172A", letterSpacing:"-0.04em", marginBottom:4 }}>Add a Hospital</h2>
            <p style={{ fontSize:12, color:"#94A3B8" }}>Each hospital gets its own fully isolated data.</p>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><X size={15}/></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:16 }}>
            <label className="field-label">HOSPITAL NAME <span style={{ color:"#EF4444" }}>*</span></label>
            <input className="input-base" placeholder="e.g. City Care Hospital" value={form.name} onChange={e=>set("name",e.target.value)} required/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label className="field-label">ADDRESS <span style={{ fontSize:10, color:"#B0BEC5" }}>(Optional)</span></label>
            <input className="input-base" placeholder="e.g. 12, Ring Road, Rajkot, Gujarat" value={form.address} onChange={e=>set("address",e.target.value)}/>
          </div>

          <div style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE", borderRadius:13, padding:"12px 14px", marginBottom:22, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:18 }}>🔒</span>
            <p style={{ fontSize:12, color:"#1E40AF", lineHeight:1.6 }}>Each hospital&apos;s patients, doctors, and appointments are completely isolated. No data is shared between hospitals.</p>
          </div>

          <button type="submit" disabled={saving} style={{ width:"100%", padding:"15px", background:"#143D30", color:"white", borderRadius:14, border:"none", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:13, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer" }}>
            {saving ? "Adding…" : "ADD HOSPITAL"}
          </button>
        </form>
      </div>
    </div>
  );
}
