"use client";
import { useEffect, useState } from "react";
import { User, CheckCircle2, XCircle, FileText, Check } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function VerificationList({ externalSearch }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Animation States
  const [successModal, setSuccessModal] = useState(null); // { name, role }
  const [toast, setToast] = useState(null);

  async function fetchRequests() {
    setLoading(true);
    try {
      const [docRes, pharmRes, labRes, patRes] = await Promise.all([
        supabase.from("doctors").select("*").eq("verification_status", "pending"),
        supabase.from("pharmacies").select("*").eq("verification_status", "pending"),
        supabase.from("laboratories").select("*").eq("verification_status", "pending"),
        supabase.from("web_patients").select("*").eq("verification_status", "pending")
      ]);

      const items = [];
      if (docRes.data) docRes.data.forEach(d => items.push({ ...d, role: "Doctor", _table: "doctors" }));
      if (pharmRes.data) pharmRes.data.forEach(p => items.push({ ...p, role: "Pharmacy", _table: "pharmacies" }));
      if (labRes.data) labRes.data.forEach(l => items.push({ ...l, role: "Laboratory", _table: "laboratories" }));
      if (patRes.data) patRes.data.forEach(p => items.push({ ...p, role: "Patient", _table: "web_patients" }));

      setRequests(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleDecision(item, decision) {
    const status = decision === "approve" ? "approved" : "rejected";
    const { error } = await supabase.from(item._table).update({ verification_status: status }).eq("id", item.id);
    
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== item.id));
      
      if (decision === "approve") {
        setSuccessModal({ name: item.name || item.phone, role: item.role });
        setTimeout(() => setSuccessModal(null), 2500);
      } else {
        setToast({ type: "reject", message: `${item.name || item.phone} was rejected.` });
        setTimeout(() => setToast(null), 3000);
      }
    } else {
      setToast({ type: "error", message: "Failed to update status." });
      setTimeout(() => setToast(null), 3000);
    }
  }

  const filtered = requests.filter(r => 
    !externalSearch || 
    (r.name && r.name.toLowerCase().includes(externalSearch.toLowerCase())) ||
    (r.phone && r.phone.toLowerCase().includes(externalSearch.toLowerCase()))
  );

  return (
    <div style={{ position: "relative" }}>
      
      {/* ─── TOAST NOTIFICATION ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
              background: toast.type === "error" ? "#991B1B" : "#1F2937",
              color: "white", padding: "14px 24px", borderRadius: 16, display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={16} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.01em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FULL SCREEN SUCCESS MODAL ─── */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 99999,
              background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              style={{ textAlign: "center" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2, duration: 0.6 }}
                style={{
                  width: 120, height: 120, borderRadius: "50%", background: "#10B981",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
                  boxShadow: "0 24px 48px rgba(16, 185, 129, 0.25)",
                  border: "8px solid #D1FAE5"
                }}
              >
                <Check size={56} color="white" strokeWidth={3} />
              </motion.div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 900, color: "#0F172A", marginBottom: 8, letterSpacing: "-0.03em" }}>
                Approval Successful
              </h2>
              <p style={{ color: "#64748B", fontSize: 18, fontWeight: 500 }}>
                {successModal.name} has been granted {successModal.role} access.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN UI ─── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.03em" }}>
          Pending Verifications ({filtered.length})
        </h2>
        <button onClick={fetchRequests} style={{ padding:"10px 20px", borderRadius:999, border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", background:"#F1F5F9", color:"#475569", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="#E2E8F0"} onMouseOut={e => e.currentTarget.style.background="#F1F5F9"}>
          Refresh List
        </button>
      </div>

      <div style={{ background:"white", borderRadius:24, border:"1px solid #E2E8F0", overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.02)" }}>
        
        {/* Table Header */}
        <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 2fr 1fr 1.2fr", gap:16, padding:"18px 32px", borderBottom:"1px solid #F1F5F9" }}>
          {["APPLICANT","ROLE","DETAILS","DOCUMENT","ACTION"].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#94A3B8", fontWeight: 600, fontSize: 14 }}>Loading verification requests...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "80px", textAlign: "center", color: "#94A3B8", fontWeight: 600, fontSize: 14 }}>No pending requests right now.</div>
        ) : filtered.map((req, i) => {
          const initials = (req.name || req.phone || "?").substring(0, 2).toUpperCase();
          
          return (
            <div key={`${req._table}-${req.id}`} style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 2fr 1fr 1.2fr", gap:16, padding:"20px 32px", borderBottom: i === filtered.length - 1 ? "none" : "1px solid #F8FAFC", alignItems:"center", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background="#FAFCFB"} onMouseOut={e => e.currentTarget.style.background="transparent"}>
              
              {/* Applicant Col */}
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"#143D30", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, color:"#0F172A", marginBottom: 2 }}>{req.name || req.phone}</div>
                  <div style={{ fontSize:12, color:"#64748B", fontWeight: 500 }}>{req.email || "No email"}</div>
                </div>
              </div>

              {/* Role Col */}
              <div>
                <span style={{ display:"inline-flex", padding:"4px 12px", borderRadius:999, fontSize:10, fontWeight:800, background:"#F1F5F9", color:"#334155", fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                  {req.role}
                </span>
              </div>

              {/* Details Col */}
              <div style={{ fontSize:13, color:"#475569", lineHeight:1.5, fontWeight: 500 }}>
                {req.details ? (
                  Object.entries(req.details).map(([k, v]) => (
                    <div key={k}><strong style={{color:"#0F172A", textTransform:"capitalize", fontWeight:700}}>{k}:</strong> {v}</div>
                  ))
                ) : (
                  <span style={{ color: "#94A3B8" }}>No extra details provided.</span>
                )}
              </div>

              {/* Proof Col */}
              <div>
                {req.proof_url ? (
                  <button 
                    onClick={() => {
                      const w = window.open("");
                      if (!w) return alert("Please allow popups to view the document.");
                      if (req.proof_url.startsWith("data:image")) {
                        w.document.write(`<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0F172A;"><img src="${req.proof_url}" style="max-width:100%;max-height:100vh;" /></body>`);
                      } else {
                        w.document.write(`<body style="margin:0;"><iframe src="${req.proof_url}" style="width:100vw;height:100vh;border:none;"></iframe></body>`);
                      }
                    }}
                    style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, background:"#EEF2FF", color:"#4F46E5", border:"none", cursor:"pointer", fontSize:11, fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}
                    onMouseOver={e => e.currentTarget.style.background="#E0E7FF"}
                    onMouseOut={e => e.currentTarget.style.background="#EEF2FF"}
                  >
                    <FileText size={14} /> View
                  </button>
                ) : (
                  <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>Missing</span>
                )}
              </div>

              {/* Actions Col */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => handleDecision(req, "approve")} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:999, background:"#ECFDF5", color:"#059669", border:"none", fontWeight:800, fontSize:11, cursor:"pointer", fontFamily:"'Syne',sans-serif", transition:"all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="#D1FAE5"} onMouseOut={e => e.currentTarget.style.background="#ECFDF5"}>
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button onClick={() => handleDecision(req, "reject")} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:999, background:"#FEF2F2", color:"#DC2626", border:"none", fontWeight:800, fontSize:11, cursor:"pointer", fontFamily:"'Syne',sans-serif", transition:"all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="#FEE2E2"} onMouseOut={e => e.currentTarget.style.background="#FEF2F2"}>
                  <XCircle size={14} /> Reject
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
