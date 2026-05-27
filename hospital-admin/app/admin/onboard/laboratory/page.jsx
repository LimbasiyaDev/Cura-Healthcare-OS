"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, ShieldCheck, Zap, Building2, FileText, FlaskConical, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardLaboratory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    accreditation_number: "",
    diagnostic_scope: "",
    email: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "laboratory",
          email: form.email,
          data: form
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to onboard");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 3000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", position: "relative", overflow: "hidden" }}>
      
      {/* Background Graphic */}
      <div style={{ position: "absolute", top: -100, left: -100, opacity: 0.05, pointerEvents: "none" }}>
        <div style={{ width: 400, height: 400, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#143D30", borderRadius: 40 }} />
          <div style={{ background: "#143D30", borderRadius: "50%" }} />
          <div style={{ background: "#143D30", borderRadius: "50%" }} />
        </div>
      </div>
      
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px", position: "relative", zIndex: 1 }}>
        
        <div style={{ display: "flex", gap: 64, maxWidth: 1100, width: "100%", alignItems: "center" }}>
          
          {/* LEFT CONTENT */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ flex: 1 }}>
            
            <button onClick={() => router.push("/admin")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 48 }}>
              <ArrowLeft size={14} /> BACK TO ADMIN
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#143D30", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <FlaskConical size={20} />
              </div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: "0.15em", color: "#143D30", textTransform: "uppercase" }}>CURA HEALTH OS</span>
            </div>

            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 42, color: "#0F172A", marginBottom: 24, letterSpacing: "-0.02em" }}>Onboard Laboratory</h1>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.6, fontWeight: 500, marginBottom: 48, maxWidth: 400 }}>
              Establish your facility&apos;s clinical profile within the command ecosystem. Connect your diagnostic capabilities to our global synchronicity network.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "white", padding: 24, borderRadius: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <ShieldCheck size={24} color="#10B981" />
                <div>
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Verified Credentials</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#64748B" }}>Instant validation via national medical registries.</p>
                </div>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 20, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <Zap size={24} color="#10B981" />
                <div>
                  <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Rapid Integration</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#64748B" }}>HL7 and FHIR standard compliant data pipelines.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT FORM CARD */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ flex: 1.1, background: "white", borderRadius: 32, padding: "48px 56px", boxShadow: "0 24px 64px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.02)", position: "relative" }}>
            
            <AnimatePresence>
              {success ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <ShieldCheck size={40} />
                  </div>
                  <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#0F172A", marginBottom: 12 }}>Laboratory Registered</h2>
                  <p style={{ color: "#64748B", fontSize: 13, marginBottom: 32 }}>Secure credentials sent to provided email.</p>
                  <div className="spinner" style={{ width: 24, height: 24, borderColor: "#10B981", borderRightColor: "transparent", margin: "0 auto" }} />
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div style={{ background: "#FEF2F2", color: "#EF4444", padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 24, textAlign: "center" }}>
                      {error}
                    </div>
                  )}

                  <div style={{ position: "absolute", top: 24, right: 32, display: "flex", alignItems: "center", gap: 6, background: "#F1FDF7", border: "1px solid #D1FAE5", padding: "6px 12px", borderRadius: 999 }}>
                    <div style={{ width: 6, height: 6, background: "#10B981", borderRadius: "50%" }} />
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#065F46", fontFamily: "'Syne',sans-serif" }}>SECURE SESSION</span>
                  </div>

                  <div style={{ display: "flex", gap: 24, marginBottom: 32, marginTop: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#334155", marginBottom: 10, fontFamily: "'Syne',sans-serif" }}>LAB FACILITY NAME</label>
                      <div style={{ position: "relative" }}>
                        <Building2 size={16} color="#94A3B8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                        <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="e.g. NeoGenomics Central"
                          style={{ width: "100%", padding: "16px 20px 16px 44px", background: "#F4F4F5", border: "1px solid transparent", borderRadius: 12, fontSize: 14, color: "#0F172A", outline: "none", transition: "all 0.2s" }}
                          onFocus={e => e.target.style.background = "#E4E4E7"} onBlur={e => e.target.style.background = "#F4F4F5"} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#334155", marginBottom: 10, fontFamily: "'Syne',sans-serif" }}>ACCREDITATION NUMBER</label>
                      <div style={{ position: "relative" }}>
                        <FileText size={16} color="#94A3B8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                        <input required value={form.accreditation_number} onChange={e=>setForm({...form, accreditation_number: e.target.value})} placeholder="e.g. CLIA-992384-B"
                          style={{ width: "100%", padding: "16px 20px 16px 44px", background: "#F4F4F5", border: "1px solid transparent", borderRadius: 12, fontSize: 14, color: "#0F172A", outline: "none", transition: "all 0.2s" }}
                          onFocus={e => e.target.style.background = "#E4E4E7"} onBlur={e => e.target.style.background = "#F4F4F5"} />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#334155", marginBottom: 10, fontFamily: "'Syne',sans-serif" }}>DIAGNOSTIC SCOPE</label>
                    <div style={{ position: "relative" }}>
                      <FlaskConical size={16} color="#94A3B8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                      <select required value={form.diagnostic_scope} onChange={e=>setForm({...form, diagnostic_scope: e.target.value})}
                        style={{ width: "100%", padding: "16px 20px 16px 44px", background: "#F4F4F5", border: "1px solid transparent", borderRadius: 12, fontSize: 14, color: "#0F172A", outline: "none", transition: "all 0.2s", appearance: "none" }}>
                        <option value="" disabled>Select Laboratory Focus</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Hematology">Hematology</option>
                        <option value="Genetics">Genetics</option>
                        <option value="Microbiology">Microbiology</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#334155", marginBottom: 10, fontFamily: "'Syne',sans-serif" }}>EMAIL OR PHONE NUMBER</label>
                    <div style={{ position: "relative" }}>
                      <Mail size={16} color="#94A3B8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                      <input required type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="clinical.director@facility.com or +1 (555) 000-0000"
                        style={{ width: "100%", padding: "16px 20px 16px 44px", background: "#F4F4F5", border: "1px solid transparent", borderRadius: 12, fontSize: 14, color: "#0F172A", outline: "none", transition: "all 0.2s" }}
                        onFocus={e => e.target.style.background = "#E4E4E7"} onBlur={e => e.target.style.background = "#F4F4F5"} />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 10, color: "#64748B", maxWidth: 220, lineHeight: 1.5 }}>
                      By submitting, you agree to the <span style={{ color: "#064E3B", fontWeight: 700 }}>Clinical Protocol</span> and privacy standards.
                    </p>
                    
                    <motion.button whileHover={!loading ? { scale: 1.02, x: 4 } : {}} whileTap={!loading ? { scale: 0.98 } : {}} disabled={loading}
                      style={{ background: "#022C22", color: "white", border: "none", padding: "16px 32px", borderRadius: 999, display: "flex", alignItems: "center", gap: 12, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.15em", boxShadow: "0 12px 24px rgba(2,44,34,0.3)" }}>
                      {loading ? "PROCESSING..." : "COMPLETE REGISTRATION"} 
                      {!loading && <ArrowRight size={16} />}
                    </motion.button>
                  </div>
                  
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 32, paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex" }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: "#E2E8F0", border: "2px solid white", marginLeft: i>1?-12:0, zIndex: 4-i, backgroundImage: "url('https://randomuser.me/api/portraits/med/men/"+i+".jpg')", backgroundSize: "cover" }} />
                      ))}
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#A7F3D0", border: "2px solid white", marginLeft: -12, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#064E3B" }}>
                        +12
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10B981" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94A3B8" }}>CURA-OS VERIFIED FACILITY</span>
                      <ShieldCheck size={14} />
                    </div>
                  </div>

                </form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
