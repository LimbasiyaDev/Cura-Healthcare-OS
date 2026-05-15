"use client";
import { useState } from "react";
import { X, HelpCircle } from "lucide-react";
import Step1 from "./OnboardingStep1";
import Step2 from "./OnboardingStep2";
import Step3 from "./OnboardingStep3";
import Step4 from "./OnboardingStep4";

export default function SpecialistModal({ hospitals, activeHospital, onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: "", email: "", phone: "", room_number: "",
    slot_duration: 15, working_hours: "09:00 AM - 05:00 PM",
    hospital_id: activeHospital?.id || null,
    department: "", wards: [], uploads: [], checked: {}
  });

  const [saving, setSaving] = useState(false);

  function handleNext() {
    if (step < 4) setStep(s => s + 1);
    else handleConfirm();
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
  }

  async function handleConfirm() {
    setSaving(true);
    await onAdd(data);
    setSaving(false);
    onClose();
  }

  const isNextDisabled = () => {
    if (step === 1) return !data.name || !data.email || !data.phone;
    // Step 2 uploads/checked are optional for now, but in prod we could check doneCount.
    if (step === 3) return !data.department || !data.hospital_id;
    return false;
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20, animation:"fadeIn 0.2s" }}>
      <div style={{ width:1000, height:"90vh", maxHeight:800, background:"#F8FAF9", borderRadius:24, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.15)", position:"relative", animation:"slideUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
        
        {/* TOP HEADER */}
        <div style={{ height:64, background:"white", borderBottom:"1px solid rgba(20,61,48,0.07)", display:"flex", alignItems:"center", padding:"0 24px", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:"#0F172A" }}>Cura</span>
            <div style={{ width:1, height:16, background:"rgba(20,61,48,0.15)" }}/>
            <span style={{ fontSize:13, color:"#64748B", fontWeight:500 }}>
              {step===1 && "Step 1: Personal Details"}
              {step===2 && "Step 2: Credentials & Verifications"}
              {step===3 && "Step 3: Department Assignment"}
              {step===4 && "Step 4: Review & Confirm"}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <button style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"#143D30", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <HelpCircle size={15}/> Support
            </button>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#143D30,#1C5240)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif" }}>AD</div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", background:"#F1F5F9", color:"#64748B", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><X size={16}/></button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ height:3, background:"#E2EAE6", width:"100%" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#143D30,#4ECCA3)", width:`${(step/4)*100}%`, transition:"width 0.4s cubic-bezier(0.16,1,0.3,1)" }}/>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex:1, overflowY:"auto", padding:"48px 64px" }}>
          <div style={{ maxWidth:800, margin:"0 auto" }}>
            {step === 1 && <Step1 data={data} onChange={setData}/>}
            {step === 2 && <Step2 data={data} onChange={setData}/>}
            {step === 3 && <Step3 data={data} onChange={setData} hospitals={hospitals}/>}
            {step === 4 && <Step4 data={data} hospitals={hospitals}/>}
          </div>
        </div>

        {/* BOTTOM NAV BAR */}
        <div style={{ padding:"16px 32px", background:"white", borderTop:"1px solid rgba(20,61,48,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{ width:22, height:22, borderRadius:"50%", background:step>=i?"#143D30":"#EAF2EE", color:step>=i?"white":"#94A3B8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, fontFamily:"'Syne',sans-serif", transition:"all 0.3s" }}>
                {i}
              </div>
            ))}
            <span style={{ fontSize:12, color:"#64748B", fontWeight:500, marginLeft:8 }}>Step {step} of 4</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={step===1 ? onClose : handleBack} style={{ padding:"10px 24px", borderRadius:12, border:"1.5px solid rgba(20,61,48,0.12)", background:"white", color:"#64748B", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, cursor:"pointer" }}>
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button onClick={handleNext} disabled={isNextDisabled() || saving} style={{ padding:"10px 24px", borderRadius:12, border:"none", background:"#143D30", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, cursor:(isNextDisabled()||saving)?"not-allowed":"pointer", opacity:(isNextDisabled()||saving)?0.6:1, boxShadow:"0 4px 14px rgba(20,61,48,0.28)", transition:"all 0.2s" }}>
              {saving ? "Saving..." : (step === 4 ? "Confirm & Onboard" : "Continue to Next Step")}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
