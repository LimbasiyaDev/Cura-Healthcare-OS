"use client";
import { useState } from "react";
import { X, Trash2 } from "lucide-react";

export default function EditHospitalModal({ hospital, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    name:             hospital.name || "",
    address:          hospital.address || "",
  });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm,  setConfirm]  = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({ ...hospital, ...form });
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await onDelete(hospital);
    setDeleting(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(8,28,20,0.55)", backdropFilter:"blur(10px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:28, padding:"2.5rem 2rem", width:"100%", maxWidth:480, margin:20, boxShadow:"0 40px 80px rgba(0,0,0,0.22)" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.25em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:6 }}>EDIT HOSPITAL</p>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, color:"#0F172A", letterSpacing:"-0.04em" }}>{hospital.name}</h2>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid #E2E8F0", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}><X size={15}/></button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">HOSPITAL NAME *</label>
            <input className="input-base" value={form.name} onChange={e => set("name", e.target.value)} required />
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="field-label">ADDRESS</label>
            <input className="input-base" placeholder="e.g. 12, Ring Road, Rajkot" value={form.address} onChange={e => set("address", e.target.value)} />
          </div>


          <button type="submit" disabled={saving} style={{ width:"100%", padding:14, background:"#143D30", color:"white", borderRadius:14, border:"none", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:13, letterSpacing:"0.1em", cursor:"pointer", marginBottom:10 }}>
            {saving ? "Saving…" : "SAVE CHANGES"}
          </button>
        </form>

        <button onClick={handleDelete} disabled={deleting} style={{ width:"100%", padding:13, background: confirm ? "#EF4444" : "#FFF5F5", color: confirm ? "white" : "#EF4444", border:"1.5px solid #FECACA", borderRadius:14, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, letterSpacing:"0.08em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all 0.2s" }}>
          <Trash2 size={13}/>
          {deleting ? "Deleting…" : confirm ? "CONFIRM DELETE HOSPITAL" : "DELETE HOSPITAL"}
        </button>
        {confirm && <p style={{ textAlign:"center", fontSize:11, color:"#EF4444", marginTop:6 }}>Click again to permanently delete this hospital and all its data.</p>}
      </div>
    </div>
  );
}
