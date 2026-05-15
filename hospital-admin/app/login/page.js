"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PRIMARY = "#143D30";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please enter both email and password.");
    setError(null);
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (authError) throw authError;
      const userId = authData.user.id;
      const { data: doctor } = await supabase
        .from("doctors").select("first_login, name, user_id, id").eq("user_id", userId).maybeSingle();
      if (doctor) {
        if (doctor.first_login) {
          setDoctorName(doctor.name); setPendingUserId(userId);
          setShowResetModal(true); setLoading(false); return;
        }
        const redirectTo = sessionStorage.getItem("loginRedirect");
        if (redirectTo) { sessionStorage.removeItem("loginRedirect"); router.push(redirectTo); }
        else router.push("/doctor");
      } else {
        const redirectTo = sessionStorage.getItem("loginRedirect");
        if (redirectTo) { sessionStorage.removeItem("loginRedirect"); router.push(redirectTo); }
        else router.push("/admin");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetError(null);
    if (!newPassword || !confirmPassword) return setResetError("Please fill both fields.");
    if (newPassword.length < 6) return setResetError("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setResetError("Passwords do not match.");
    setResetLoading(true);
    try {
      const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
      if (passError) throw passError;
      const { error: dbError } = await supabase
        .from("doctors").update({ first_login: false }).eq("user_id", pendingUserId);
      if (dbError) throw dbError;
      router.push("/doctor"); router.refresh();
    } catch (err) {
      setResetError(err.message || "Failed to update password. Try again.");
      setResetLoading(false);
    }
  };

  const strength = newPassword.length >= 12 ? 4 : newPassword.length >= 9 ? 3 : newPassword.length >= 6 ? 2 : newPassword.length >= 3 ? 1 : 0;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength] || "";
  const strengthColors = ["#F1F5F9", "#F87171", "#FBBF24", "#60A5FA", "#10B981"];

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div style={{
          background: "linear-gradient(135deg, #EEF4F0 0%, #F5F8F5 50%, #EAF2EE 100%)",
          position: "absolute", inset: 0
        }} />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      {/* ── LEFT BRAND PANEL ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.1, 0.64, 1] }}
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden"
        style={{ background: PRIMARY, padding: "56px 56px 56px 56px" }}
      >
        {/* Inner glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(78,204,163,0.18), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Floating circles */}
        {mounted && [
          { w: 320, h: 320, top: "-90px", right: "-90px", opacity: 0.07 },
          { w: 220, h: 220, bottom: "60px", left: "-70px", opacity: 0.05 },
          { w: 160, h: 160, top: "42%", right: "8%", opacity: 0.06 },
        ].map((c, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", width: c.w, height: c.h,
              top: c.top, bottom: c.bottom, right: c.right, left: c.left,
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,${c.opacity * 8})`,
              background: `rgba(255,255,255,${c.opacity})`,
            }}
          />
        ))}

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            overflow: "hidden", marginBottom: 24,
            boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
            border: "2px solid rgba(255,255,255,0.15)",
          }}>
            <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 900,
            fontSize: 36, color: "white", letterSpacing: "-0.04em", lineHeight: 1.1,
          }}>Cura</h1>
          <p style={{
            color: "rgba(255,255,255,0.45)", fontSize: 10,
            letterSpacing: "0.38em", marginTop: 8, fontWeight: 800, textTransform: "uppercase",
          }}>Healthcare OS</p>
        </motion.div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 84, height: 84, borderRadius: 26,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 38, marginBottom: 36,
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >🏥</motion.div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 30, color: "white", letterSpacing: "-0.03em",
            lineHeight: 1.25, marginBottom: 18,
          }}>
            The clinic that<br />
            <span style={{ color: "rgba(78,204,163,0.95)", fontStyle: "italic" }}>answers itself.</span>
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.45)", fontSize: 14,
            lineHeight: 1.8, maxWidth: 300, fontWeight: 400,
          }}>
            WhatsApp-powered appointment automation for modern healthcare facilities.
          </p>
        </motion.div>

        {/* Bottom features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}
        >
          {["🤖 AI Bot", "🔐 Supabase", "🏥 Multi-Hospital"].map((f, i) => (
            <div key={i} style={{
              padding: "7px 16px", borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.04em",
              backdropFilter: "blur(8px)",
            }}>
              {f}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── RIGHT FORM PANEL ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 py-12 relative">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => router.push("/")}
          style={{
            position: "absolute", top: 28, right: 28,
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.15em", color: "#94A3B8",
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: 999, padding: "8px 16px",
            cursor: "pointer",
            backdropFilter: "blur(20px)",
            transition: "all 0.2s",
          }}
          whileHover={{ color: PRIMARY, background: "white", scale: 1.02 }}
        >
          <ArrowLeft size={12} />
          Home
        </motion.button>

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:hidden mb-10 text-center"
        >
          <div style={{
            width: 52, height: 52, borderRadius: 16, background: PRIMARY,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          }}>
            <span style={{ color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 22 }}>D</span>
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#0F172A" }}>Cura</h1>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 280, damping: 22 }}
          style={{
            width: "100%", maxWidth: 420,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 28,
            padding: "2.5rem",
            boxShadow: "0 24px 64px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#0F172A", marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}>
                Sign in to your Cura portal
              </p>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{
                    background: "#FEF2F2", border: "1px solid #FECACA",
                    color: "#EF4444", fontSize: 12, fontWeight: 700,
                    padding: "10px 16px", borderRadius: 12, textAlign: "center",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Email */}
              <motion.div variants={fadeUp}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: "0.25em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@cura.com"
                    style={{
                      width: "100%", paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                      borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#0F172A",
                      outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = "0 0 0 4px rgba(20,61,48,0.08)"; e.target.style.background = "white"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeUp}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: "0.25em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", paddingLeft: 44, paddingRight: 44, paddingTop: 14, paddingBottom: 14,
                      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                      borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#0F172A",
                      outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = "0 0 0 4px rgba(20,61,48,0.08)"; e.target.style.background = "white"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fadeUp}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: "100%", padding: "16px", borderRadius: 14, fontSize: 11, letterSpacing: "0.15em", marginTop: 4 }}
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying...</>
                  ) : (
                    <><Shield size={14} /> Enter Command Center</>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: 24, fontSize: 10, color: "#CBD5E1", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3em", fontFamily: "'Syne',sans-serif" }}
        >
          © 2026 Cura — Secure Access
        </motion.p>
      </div>

      {/* ── PASSWORD RESET MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="modal-box"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  width: 60, height: 60,
                  background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
                  border: "2px solid #FDE68A",
                  borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, margin: "0 auto 20px",
                }}
              >🔐</motion.div>

              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, textAlign: "center", marginBottom: 6 }}>
                Security Update Required
              </h2>
              <p style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>
                First Login
              </p>
              <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
                Welcome, <span style={{ fontWeight: 800, color: PRIMARY }}>Dr. {doctorName}</span>!<br />
                Please set a permanent password.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <AnimatePresence>
                  {resetError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", fontSize: 12, fontWeight: 700, padding: "10px 16px", borderRadius: 12, textAlign: "center" }}
                    >
                      {resetError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {[
                  { label: "New Password", val: newPassword, set: setNewPassword, ph: "Min. 6 characters" },
                  { label: "Confirm Password", val: confirmPassword, set: setConfirmPassword, ph: "Re-enter password" },
                ].map(({ label, val, set, ph }) => (
                  <div key={label}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: "0.25em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 7 }}>
                      {label}
                    </label>
                    <input
                      type="password" value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                      className="input-base"
                      onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = "0 0 0 4px rgba(20,61,48,0.08)"; }}
                      onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                ))}

                {newPassword && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "0 2px" }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[0, 1, 2, 3].map((l) => (
                        <motion.div
                          key={l}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: strength > l ? 1 : 0 }}
                          transition={{ type: "spring", stiffness: 400, delay: l * 0.05 }}
                          style={{ height: 3, flex: 1, borderRadius: 4, background: strength > l ? strengthColors[strength] : "#E2E8F0", transformOrigin: "left" }}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>{strengthLabel}</p>
                  </motion.div>
                )}

                <motion.button
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  className="btn-primary"
                  style={{ width: "100%", padding: "15px", borderRadius: 14, marginTop: 4 }}
                  whileHover={!resetLoading ? { scale: 1.01 } : {}}
                  whileTap={!resetLoading ? { scale: 0.98 } : {}}
                >
                  {resetLoading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : "Set Password & Enter Portal"}
                </motion.button>

                <button
                  onClick={async () => { await supabase.auth.signOut(); setShowResetModal(false); setNewPassword(""); setConfirmPassword(""); setResetError(null); }}
                  style={{ width: "100%", padding: "10px", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "'Syne',sans-serif", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.target.style.color = "#64748B"}
                  onMouseLeave={(e) => e.target.style.color = "#94A3B8"}
                >
                  Cancel & Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}