"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  Shield, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, KeyRound, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);



const T = {
  primary: "#0D3327",
  accent:  "#1A5C44",
  muted:   "#94A3B8",
};

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      animation: "spin 0.8s linear infinite", flexShrink: 0,
    }} />
  );
}

/* ─── OTP Input ───────────────────────────────────────────────────────────── */
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);

  function handleChange(e, idx) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = (value + "      ").slice(0, 6).split("");
    arr[idx] = val || " ";
    const joined = arr.join("").trimEnd();
    onChange(joined.replace(/ /g, ""));
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKey(e, idx) {
    if (e.key === "Backspace") {
      const arr = (value + "      ").slice(0, 6).split("");
      if (!arr[idx] || arr[idx] === " ") {
        if (idx > 0) {
          arr[idx - 1] = " ";
          onChange(arr.join("").trimEnd().replace(/ /g, ""));
          inputs.current[idx - 1]?.focus();
        }
      } else {
        arr[idx] = " ";
        onChange(arr.join("").trimEnd().replace(/ /g, ""));
      }
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  }

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[0,1,2,3,4,5].map((i) => {
        const filled = i < value.length;
        return (
          <motion.input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text" inputMode="numeric" maxLength={1}
            value={filled ? value[i] : ""}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKey(e, i)}
            onPaste={handlePaste}
            whileFocus={{ scale: 1.06 }}
            style={{
              width: 50, height: 58, textAlign: "center",
              fontSize: 22, fontWeight: 900, color: "#0F172A",
              background: filled ? "rgba(13,51,39,0.05)" : "#F8FAFC",
              border: `2px solid ${filled ? "rgba(13,51,39,0.22)" : "#E2E8F0"}`,
              borderRadius: 14, outline: "none",
              fontFamily: "'Syne', sans-serif",
              transition: "all 0.15s",
              opacity: disabled ? 0.5 : 1,
            }}
            onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = "0 0 0 4px rgba(13,51,39,0.08)"; }}
            onBlur={(e) => { e.target.style.borderColor = filled ? "rgba(13,51,39,0.22)" : "#E2E8F0"; e.target.style.boxShadow = "none"; }}
          />
        );
      })}
    </div>
  );
}

/* ─── Password Strength ───────────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special char", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i < score ? colors[score - 1] : "#E2E8F0",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: c.pass ? "#16A34A" : "#CBD5E1" }}>
              {c.pass ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", color: colors[score - 1] }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN LOGIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminLoginPage() {
  const router = useRouter();

  // Steps: "login" | "otp" | "success" | "forgot" | "forgot_otp" | "reset_password" | "reset_success"
  const [step,        setStep]        = useState("login");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [otp,         setOtp]         = useState("");
  const [error,       setError]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [countdown,   setCountdown]   = useState(0);
  const [mounted,     setMounted]     = useState(false);

  // Forgot password states
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotOtp,     setForgotOtp]     = useState("");
  const [newPassword,   setNewPassword]   = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [showNewPass,   setShowNewPass]   = useState(false);
  const [showConfPass,  setShowConfPass]  = useState(false);
  const [resetToken,    setResetToken]    = useState(null); // store verified OTP record id

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (sessionStorage.getItem("admin_authenticated")) router.replace("/admin");
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Guard refs to prevent double-fire from React StrictMode / re-renders
  const verifyingRef     = useRef(false);
  const verifyingForgotRef = useRef(false);

  // Auto-verify login OTP — guard against race condition
  useEffect(() => {
    if (otp.length === 6 && step === "otp" && !loading && !verifyingRef.current) {
      verifyingRef.current = true;
      handleVerifyOTP().finally(() => { verifyingRef.current = false; });
    }
  }, [otp, step]);

  // Auto-verify forgot OTP — guard against race condition
  useEffect(() => {
    if (forgotOtp.length === 6 && step === "forgot_otp" && !loading && !verifyingForgotRef.current) {
      verifyingForgotRef.current = true;
      handleVerifyForgotOTP().finally(() => { verifyingForgotRef.current = false; });
    }
  }, [forgotOtp, step]);

  // Cryptographically secure 6-digit OTP using Web Crypto API
  function genOTP() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
  }

  /* ── Step 1: Login ── */
  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) { setError("Please enter both email and password."); return; }
    setLoading(true);
    try {
      const { data: isValid, error: rpcErr } = await supabase.rpc("verify_admin_login", {
        p_email:    email.trim().toLowerCase(),
        p_password: password,
      });
      if (rpcErr) throw new Error("Server error. Please try again.");
      if (!isValid) throw new Error("Invalid email or password.");

      const newOTP = genOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: insertErr } = await supabase.from("otp_verifications").insert({
        email: email.trim().toLowerCase(), otp: newOTP, expires_at: expiresAt, used: false,
      });
      if (insertErr) throw new Error("Could not create OTP. Try again.");

      const otpRecipient = email.trim().toLowerCase();
      const res = await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: newOTP, email: otpRecipient })
      });
      if (!res.ok) throw new Error("Could not send OTP email.");

      setCountdown(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  /* ── Step 2: Verify Login OTP ── */
  async function handleVerifyOTP() {
    if (otp.length !== 6) { setError("Enter all 6 digits."); return; }
    setError(null);
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .eq("otp", otp)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) throw new Error("Verification error. Try again.");
      if (!data) throw new Error("Invalid or expired OTP.");

      await supabase.from("otp_verifications").update({ used: true }).eq("id", data.id);
      sessionStorage.setItem("admin_authenticated", "true");
      sessionStorage.setItem("admin_email", email.trim().toLowerCase());
      setStep("success");
      setTimeout(() => router.replace("/admin"), 1000);
    } catch (err) {
      setError(err.message);
      setOtp("");
    }
    setLoading(false);
  }

  /* ── Resend Login OTP ── */
  async function handleResend() {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      // Invalidate all previous unused OTPs for this email to prevent stale codes
      await supabase.from("otp_verifications")
        .update({ used: true })
        .eq("email", email.trim().toLowerCase())
        .eq("used", false);

      const newOTP = genOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: insertErr } = await supabase.from("otp_verifications").insert({
        email: email.trim().toLowerCase(), otp: newOTP, expires_at: expiresAt, used: false,
      });
      if (insertErr) throw new Error("Could not create OTP. Try again.");

      const res = await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: newOTP, email: email.trim().toLowerCase() })
      });
      if (!res.ok) throw new Error("Could not send OTP email.");
      setCountdown(60);
      setOtp("");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
    setLoading(false);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     FORGOT PASSWORD FLOW
  ───────────────────────────────────────────────────────────────────────── */

  /* ── FP Step 1: Send OTP to email ── */
  async function handleForgotSendOTP(e) {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      // Verify admin email exists
      const { data: adminExists, error: checkErr } = await supabase.rpc("check_admin_email_exists", {
        p_email: forgotEmail.trim().toLowerCase(),
      });
      if (checkErr) throw new Error("Server error. Please try again.");
      if (!adminExists) throw new Error("No admin account found with this email.");

      const newOTP = genOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: insertErr } = await supabase.from("otp_verifications").insert({
        email: forgotEmail.trim().toLowerCase(),
        otp: newOTP,
        expires_at: expiresAt,
        used: false,
      });
      if (insertErr) throw new Error("Could not create OTP. Try again.");

      const otpRecipient = forgotEmail.trim().toLowerCase();
      const res = await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: newOTP, email: otpRecipient })
      });
      if (!res.ok) throw new Error("Could not send OTP email.");

      setCountdown(60);
      setStep("forgot_otp");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  /* ── FP Step 2: Verify OTP ── */
  async function handleVerifyForgotOTP() {
    if (forgotOtp.length !== 6) { setError("Enter all 6 digits."); return; }
    setError(null);
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from("otp_verifications")
        .select("*")
        .eq("email", forgotEmail.trim().toLowerCase())
        .eq("otp", forgotOtp)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) throw new Error("Verification error. Try again.");
      if (!data) throw new Error("Invalid or expired OTP.");

      // Mark as used
      await supabase.from("otp_verifications").update({ used: true }).eq("id", data.id);

      // Store token for reset step
      setResetToken(data.id);
      setStep("reset_password");
    } catch (err) {
      setError(err.message);
      setForgotOtp("");
    }
    setLoading(false);
  }

  /* ── FP Step 3: Set New Password ── */
  async function handleResetPassword(e) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPass) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.rpc("update_admin_password", {
        p_email:    forgotEmail.trim().toLowerCase(),
        p_password: newPassword,
      });
      if (updateErr) throw new Error("Could not update password. Please try again.");

      setStep("reset_success");
      setTimeout(() => {
        setStep("login");
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
        setConfirmPass("");
        setResetToken(null);
      }, 2500);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  /* ── Resend Forgot OTP ── */
  async function handleResendForgotOTP() {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      // Invalidate all previous unused OTPs for this email to prevent stale codes
      await supabase.from("otp_verifications")
        .update({ used: true })
        .eq("email", forgotEmail.trim().toLowerCase())
        .eq("used", false);

      const newOTP = genOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error: insertErr } = await supabase.from("otp_verifications").insert({
        email: forgotEmail.trim().toLowerCase(), otp: newOTP, expires_at: expiresAt, used: false,
      });
      if (insertErr) throw new Error("Could not create OTP. Try again.");

      const res = await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: newOTP, email: forgotEmail.trim().toLowerCase() })
      });
      if (!res.ok) throw new Error("Could not send OTP email.");
      setCountdown(60);
      setForgotOtp("");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
    setLoading(false);
  }

  /* ── Header meta per step ── */
  const stepMeta = {
    login:          { icon: <Shield size={20} color="white" />, title: "Admin Access",        sub: "Secure credentials required",              iconBg: `linear-gradient(135deg,${T.primary},#226650)` },
    otp:            { icon: <Mail size={20} color="white" />,   title: "Verify OTP",           sub: "Code sent to your registered email",        iconBg: `linear-gradient(135deg,${T.primary},#226650)` },
    success:        { icon: <CheckCircle2 size={20} color="white" />, title: "Access Granted!", sub: "Redirecting to admin portal...",           iconBg: "linear-gradient(135deg,#16A34A,#22C55E)" },
    forgot:         { icon: <KeyRound size={20} color="white" />, title: "Forgot Password",    sub: "We'll send a reset code to your email",     iconBg: `linear-gradient(135deg,#7C3AED,#9F67FA)` },
    forgot_otp:     { icon: <Mail size={20} color="white" />,   title: "Verify Identity",      sub: "Enter the code sent to your email",         iconBg: `linear-gradient(135deg,#7C3AED,#9F67FA)` },
    reset_password: { icon: <Lock size={20} color="white" />,   title: "New Password",         sub: "Choose a strong new password",              iconBg: `linear-gradient(135deg,#7C3AED,#9F67FA)` },
    reset_success:  { icon: <CheckCircle2 size={20} color="white" />, title: "Password Reset!", sub: "Your password has been updated",           iconBg: "linear-gradient(135deg,#16A34A,#22C55E)" },
  };

  const meta = stepMeta[step] || stepMeta.login;
  const isForgotFlow = ["forgot", "forgot_otp", "reset_password", "reset_success"].includes(step);

  function handleBackFromForgot() {
    setStep("login");
    setForgotEmail("");
    setForgotOtp("");
    setError(null);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(160deg, #F4F8F5 0%, #FAFDF9 40%, #F2F7F3 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      {mounted && <>
        <motion.div animate={{ x: [0,30,0], y: [0,20,0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "fixed", width: 700, height: 700, borderRadius: "50%", background: isForgotFlow ? "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(20,61,48,0.09) 0%, transparent 70%)", top: -200, left: -200, pointerEvents: "none", transition: "background 0.6s" }} />
        <motion.div animate={{ x: [0,-20,0], y: [0,25,0] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", background: isForgotFlow ? "radial-gradient(circle, rgba(159,103,250,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)", bottom: -100, right: -100, pointerEvents: "none", transition: "background 0.6s" }} />
      </>}

      {/* Back to home */}
      <motion.button
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        onClick={() => router.push("/")}
        style={{
          position: "fixed", top: 24, left: 24,
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.15em", color: "#94A3B8",
          background: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.95)",
          borderRadius: 999, padding: "8px 16px", cursor: "pointer",
          backdropFilter: "blur(20px)",
        }}
        whileHover={{ color: T.primary, background: "#ffffff", scale: 1.02 }}
      >
        <ArrowLeft size={12} /> Home
      </motion.button>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        style={{
          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(40px)",
          borderRadius: 28, padding: "2.5rem", width: "100%", maxWidth: 440,
          boxShadow: "0 32px 80px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.04)",
          border: "1px solid rgba(255,255,255,0.95)",
          position: "relative", zIndex: 1, margin: "0 1.5rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          {(step === "otp" || isForgotFlow) && !["success","reset_success"].includes(step) && (
            <motion.button whileHover={{ x: -2 }} disabled={loading}
              onClick={() => {
                if (step === "otp") { setStep("login"); setOtp(""); setError(null); }
                else if (step === "forgot") handleBackFromForgot();
                else if (step === "forgot_otp") { setStep("forgot"); setForgotOtp(""); setError(null); }
                else if (step === "reset_password") { setStep("forgot_otp"); setForgotOtp(""); setError(null); }
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", padding: 4 }}>
              <ArrowLeft size={16} />
            </motion.button>
          )}
          <motion.div
            animate={{ background: meta.iconBg }}
            transition={{ duration: 0.5 }}
            style={{ width: 48, height: 48, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(13,51,39,0.25)", flexShrink: 0 }}
          >
            {meta.icon}
          </motion.div>
          <div>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#0F172A", lineHeight: 1, letterSpacing: "-0.02em" }}>
              {meta.title}
            </p>
            <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 4 }}>
              {meta.sub}
            </p>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 12, fontWeight: 700, padding: "10px 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps */}
        <AnimatePresence mode="wait">

          {/* ── LOGIN ── */}
          {step === "login" && (
            <motion.form key="login"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={iconStyle} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="admin@cura.com" disabled={loading} autoComplete="email"
                    style={inputStyle}
                    onFocus={e => applyFocus(e)} onBlur={e => removeFocus(e)}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={iconStyle} />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" disabled={loading} autoComplete="current-password"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => applyFocus(e)} onBlur={e => removeFocus(e)}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={eyeButtonStyle}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign: "right", marginTop: -8 }}>
                <motion.button type="button"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => { setStep("forgot"); setForgotEmail(email); setError(null); }}
                  style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: "#7C3AED", cursor: "pointer", fontFamily: "'Syne',sans-serif", letterSpacing: "0.05em" }}
                >
                  Forgot password?
                </motion.button>
              </div>

              <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", fontSize: 11, color: "#475569", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={11} style={{ color: "#16A34A", flexShrink: 0 }} />
                An OTP will be sent to your registered email address.
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
                style={primaryBtnStyle(loading)}
              >
                {loading ? <><Spinner /> Verifying...</> : <><Shield size={13} /> Continue to OTP</>}
              </motion.button>
            </motion.form>
          )}

          {/* ── LOGIN OTP ── */}
          {step === "otp" && (
            <motion.div key="otp"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <OTPInfoBox email={email} />
              <OTPInput value={otp} onChange={setOtp} disabled={loading} />
              <OTPVerifySection loading={loading} otp={otp} onVerify={handleVerifyOTP} countdown={countdown} onResend={handleResend} />
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <SuccessPanel key="success" title="Identity Confirmed" sub="Redirecting to Admin Portal..." />
          )}

          {/* ── FORGOT: Enter Email ── */}
          {step === "forgot" && (
            <motion.form key="forgot"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              onSubmit={handleForgotSendOTP}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)", fontSize: 12, color: "#475569", fontWeight: 500, lineHeight: 1.6 }}>
                Enter the email address linked to your admin account. We&apos;ll send a one-time code to verify your identity.
              </div>

              <div>
                <label style={labelStyle}>Admin Email</label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={iconStyle} />
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="admin@cura.com" disabled={loading} autoComplete="email"
                    style={inputStyle}
                    onFocus={e => applyFocus(e)} onBlur={e => removeFocus(e)}
                  />
                </div>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
                style={purpleBtnStyle(loading)}
              >
                {loading ? <><Spinner /> Sending...</> : <><Mail size={13} /> Send Reset Code</>}
              </motion.button>

              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Remember it? </span>
                <motion.button type="button" whileHover={{ scale: 1.03 }}
                  onClick={handleBackFromForgot}
                  style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: T.accent, cursor: "pointer", fontFamily: "'Syne',sans-serif" }}
                >
                  Back to Login
                </motion.button>
              </div>
            </motion.form>
          )}

          {/* ── FORGOT OTP VERIFY ── */}
          {step === "forgot_otp" && (
            <motion.div key="forgot_otp"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#475569", fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
                  A 6-digit reset code was sent to<br />
                  <strong style={{ color: "#7C3AED", fontFamily: "'Syne',sans-serif" }}>{forgotEmail}</strong>
                </p>
                <p style={{ fontSize: 11, color: T.muted, margin: "8px 0 0", fontWeight: 500 }}>Valid for 10 minutes</p>
              </div>

              <OTPInput value={forgotOtp} onChange={setForgotOtp} disabled={loading} />

              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#7C3AED", fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.15)", borderTopColor: "#7C3AED", animation: "spin 0.8s linear infinite" }} />
                  Verifying code...
                </div>
              )}

              {!loading && forgotOtp.length === 6 && (
                <motion.button onClick={handleVerifyForgotOTP}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={purpleBtnStyle(false)}
                >
                  <CheckCircle2 size={13} /> Verify &amp; Continue
                </motion.button>
              )}

              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Didn&apos;t receive it? </span>
                <motion.button onClick={handleResendForgotOTP} disabled={countdown > 0 || loading}
                  whileHover={countdown === 0 ? { scale: 1.03 } : {}}
                  style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: countdown > 0 ? T.muted : "#7C3AED", cursor: countdown > 0 ? "default" : "pointer", fontFamily: "'Syne',sans-serif" }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── RESET PASSWORD ── */}
          {step === "reset_password" && (
            <motion.form key="reset_password"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              onSubmit={handleResetPassword}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ padding: "11px 14px", borderRadius: 12, background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)", fontSize: 11, color: "#475569", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={11} style={{ color: "#7C3AED", flexShrink: 0 }} />
                Identity verified for <strong style={{ color: "#7C3AED" }}>{forgotEmail}</strong>
              </div>

              {/* New Password */}
              <div>
                <label style={labelStyle}>New Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={iconStyle} />
                  <input type={showNewPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••••" disabled={loading} autoComplete="new-password"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={e => applyFocusPurple(e)} onBlur={e => removeFocus(e)}
                  />
                  <button type="button" onClick={() => setShowNewPass(s => !s)} style={eyeButtonStyle}>
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              {/* Confirm Password */}
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={iconStyle} />
                  <input type={showConfPass ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    placeholder="••••••••••" disabled={loading} autoComplete="new-password"
                    style={{
                      ...inputStyle, paddingRight: 44,
                      ...(confirmPass && newPassword !== confirmPass ? { borderColor: "#FECACA", background: "#FFF5F5" } : {}),
                      ...(confirmPass && newPassword === confirmPass ? { borderColor: "rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.02)" } : {}),
                    }}
                    onFocus={e => applyFocusPurple(e)} onBlur={e => removeFocus(e)}
                  />
                  <button type="button" onClick={() => setShowConfPass(s => !s)} style={eyeButtonStyle}>
                    {showConfPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {confirmPass && (
                    <div style={{ position: "absolute", right: 42, top: "50%", transform: "translateY(-50%)" }}>
                      {newPassword === confirmPass
                        ? <CheckCircle2 size={14} color="#16A34A" />
                        : <span style={{ fontSize: 14 }}>✗</span>}
                    </div>
                  )}
                </div>
              </div>

              <motion.button type="submit" disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.97 } : {}}
                style={purpleBtnStyle(loading)}
              >
                {loading ? <><Spinner /> Updating...</> : <><RefreshCw size={13} /> Reset Password</>}
              </motion.button>
            </motion.form>
          )}

          {/* ── RESET SUCCESS ── */}
          {step === "reset_success" && (
            <SuccessPanel key="reset_success" title="Password Updated!" sub="Redirecting to login..." color="#7C3AED" />
          )}

        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ─── Shared sub-components ──────────────────────────────────────────────── */

function OTPInfoBox({ email }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(13,51,39,0.03)", border: "1px solid rgba(13,51,39,0.08)", textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "#475569", fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
        Enter the 6-digit code sent to your<br />
        <strong style={{ color: "#0D3327", fontFamily: "'Syne',sans-serif" }}>registered email address</strong>
      </p>
      <p style={{ fontSize: 11, color: "#94A3B8", margin: "8px 0 0", fontWeight: 500 }}>Valid for 10 minutes</p>
    </div>
  );
}

function OTPVerifySection({ loading, otp, onVerify, countdown, onResend }) {
  return (
    <>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#1A5C44", fontSize: 13, fontWeight: 600 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(13,51,39,0.15)", borderTopColor: "#1A5C44", animation: "spin 0.8s linear infinite" }} />
          Verifying code...
        </div>
      )}
      {!loading && otp.length === 6 && (
        <motion.button onClick={onVerify}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={primaryBtnStyle(false)}
        >
          <CheckCircle2 size={13} /> Verify &amp; Enter
        </motion.button>
      )}
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Didn&apos;t receive it? </span>
        <motion.button onClick={onResend} disabled={countdown > 0 || loading}
          whileHover={countdown === 0 ? { scale: 1.03 } : {}}
          style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: countdown > 0 ? "#94A3B8" : "#1A5C44", cursor: countdown > 0 ? "default" : "pointer", fontFamily: "'Syne',sans-serif" }}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
        </motion.button>
      </div>
    </>
  );
}

function SuccessPanel({ title, sub, color = "#16A34A" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", padding: "16px 0" }}
    >
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.5 }}
        style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${color},${color}CC)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: `0 8px 24px ${color}55` }}
      >
        <CheckCircle2 size={28} color="white" />
      </motion.div>
      <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 20, color: "#0F172A", margin: "0 0 8px" }}>{title}</p>
      <p style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}>{sub}</p>
    </motion.div>
  );
}

/* ─── Shared style helpers ───────────────────────────────────────────────── */
const labelStyle = {
  display: "block", fontSize: 10, fontWeight: 900,
  fontFamily: "'Syne',sans-serif", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "#94A3B8", marginBottom: 8,
};

const iconStyle = {
  position: "absolute", left: 14, top: "50%",
  transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none",
};

const inputStyle = {
  width: "100%", paddingLeft: 42, paddingRight: 16,
  paddingTop: 13, paddingBottom: 13,
  background: "#F8FAFC", border: "1.5px solid #E2E8F0",
  borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#0F172A",
  outline: "none", transition: "all 0.2s", boxSizing: "border-box",
};

const eyeButtonStyle = {
  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", color: "#94A3B8",
  display: "flex", padding: 4,
};

function primaryBtnStyle(loading) {
  return {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg,#0D3327,#226650)",
    color: "white", border: "none", borderRadius: 14,
    fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
    textTransform: "uppercase", fontFamily: "'Syne',sans-serif",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 6px 20px rgba(13,51,39,0.30)", marginTop: 4,
  };
}

function purpleBtnStyle(loading) {
  return {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg,#7C3AED,#9F67FA)",
    color: "white", border: "none", borderRadius: 14,
    fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
    textTransform: "uppercase", fontFamily: "'Syne',sans-serif",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.75 : 1,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 6px 20px rgba(124,58,237,0.30)", marginTop: 4,
  };
}

function applyFocus(e) {
  e.target.style.borderColor = "#0D3327";
  e.target.style.boxShadow = "0 0 0 4px rgba(13,51,39,0.08)";
  e.target.style.background = "white";
}

function applyFocusPurple(e) {
  e.target.style.borderColor = "#7C3AED";
  e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.08)";
  e.target.style.background = "white";
}

function removeFocus(e) {
  e.target.style.borderColor = "#E2E8F0";
  e.target.style.boxShadow = "none";
  e.target.style.background = "#F8FAFC";
}