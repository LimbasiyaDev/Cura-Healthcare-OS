"use client";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight, Shield, Stethoscope, Clock, CheckCircle2,
  Zap, Activity, ChevronRight, Wifi, Bell, X, Lock, Mail, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion, useMotionValue, useTransform, AnimatePresence,
  useSpring
} from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";

/* ─── SUPABASE ──────────────────────────────────────────────────────────────── */
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ─── OTP recipient — falls back to the typed login email if env var not set ── */
const OTP_RECIPIENT_ENV = process.env.NEXT_PUBLIC_OTP_RECIPIENT || "";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const T = {
  primary:   "#0D3327",
  accent:    "#1A5C44",
  highlight: "#22C55E",
  light:     "#F0FDF4",
  muted:     "#94A3B8",
  border:    "rgba(20,61,48,0.10)",
  glass:     "rgba(255,255,255,0.72)",
  text:      "#0F172A",
  sub:       "#64748B",
};

/* ─── FEATURE PILLS ─────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "💬", label: "WhatsApp Bot" },
  { icon: "🔐", label: "Supabase Auth" },
  { icon: "⚡", label: "Real-time Sync" },
  { icon: "🏨", label: "Multi-Hospital" },
];

/* ─── STATS ─────────────────────────────────────────────────────────────────── */
const STATS = [
  { value: 99.9, suffix: "%", label: "Uptime SLA",    decimals: 1 },
  { value: 2,    suffix: "s",  label: "Bot Response", decimals: 0 },
  { value: "∞",  suffix: "",   label: "Appointments", decimals: 0 },
];

/* ─── PORTAL CARDS ──────────────────────────────────────────────────────────── */
const CARDS = [
  {
    id: 1, num: "01",
    title: "Master Admin",
    desc: "Onboard specialists, audit the full historical ledger, and oversee clinic-wide operations from one command center.",
    icon: Shield,
    route: "/admin",
    badge: "Admin",
    requiresAuth: true,
    bullets: ["Doctor onboarding", "Full audit log", "Hospital config"],
    color: "#0D3327",
    accentColor: "rgba(13,51,39,0.08)",
  },
  {
    id: 2, num: "02",
    title: "Doctor Portal",
    desc: "Approve the day's pipeline, tune what the bot asks each patient, and manage your schedule effortlessly.",
    icon: Stethoscope,
    route: "/doctor",
    badge: "Doctor",
    requiresAuth: false,
    bullets: ["Daily schedule", "Slot management", "Bot config"],
    color: "#1A5C44",
    accentColor: "rgba(26,92,68,0.08)",
  },
];

/* ─── TRUST ITEMS ────────────────────────────────────────────────────────────── */
const TRUST = [
  { icon: Activity, label: "Bot Intelligence",  sub: "Context-aware flow" },
  { icon: Bell,     label: "Instant Alerts",    sub: "Doctor + patient" },
  { icon: Wifi,     label: "Always-on Sync",    sub: "Multi-hospital ready" },
  { icon: Zap,      label: "Sub-2s Replies",    sub: "Optimised pipeline" },
];

/* ─── SPINNER ────────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "white",
      animation: "spin 0.8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ─── 3D MAGNETIC CARD ──────────────────────────────────────────────────────── */
function MagneticCard({ children, style = {}, onClick, onMouseEnter, onMouseLeave }) {
  const ref = useRef(null);
  const mx  = useMotionValue(0);
  const my  = useMotionValue(0);
  const sx  = useSpring(mx, { stiffness: 200, damping: 32 });
  const sy  = useSpring(my, { stiffness: 200, damping: 32 });
  const rx  = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const ry  = useTransform(sx, [-0.5, 0.5], [-6, 6]);

  const onMove = useCallback((e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  }, [mx, my]);

  const onLeave = useCallback(() => {
    mx.set(0); my.set(0);
    if (onMouseLeave) onMouseLeave();
  }, [mx, my, onMouseLeave]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ─── ANIMATED COUNTER ──────────────────────────────────────────────────────── */
function Counter({ target, suffix, decimals = 0 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target === "∞") return; // guard before any numeric ops
    const n = parseFloat(target);
    if (isNaN(n)) return;
    const step = n / 48;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, n);
      setV(+cur.toFixed(decimals));
      if (cur >= n) clearInterval(t);
    }, 25);
    return () => clearInterval(t);
  }, [target, decimals]);
  if (target === "∞") return <span>∞</span>;
  return <span>{v.toFixed(decimals)}{suffix}</span>;
}

/* ─── SPRING VARIANTS ───────────────────────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const slide = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { type: "spring", stiffness: 320, damping: 28 } },
};

/* ─── NOISE TEXTURE SVG ─────────────────────────────────────────────────────── */
const NoiseBg = () => (
  <svg className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.025] z-0" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#noise)"/>
  </svg>
);

/* ─── OTP INPUT ─────────────────────────────────────────────────────────────── */
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = (value + "______").slice(0, 6).split("");

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
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={filled ? value[i] : ""}
            disabled={disabled}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKey(e, i)}
            onPaste={handlePaste}
            whileFocus={{ scale: 1.06 }}
            style={{
              width: 50, height: 58, textAlign: "center",
              fontSize: 22, fontWeight: 900,
              color: "#0F172A",
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

/* ─── ADMIN AUTH MODAL ──────────────────────────────────────────────────────── */
function AdminAuthModal({ onClose, onSuccess }) {
  const [step,     setStep]     = useState("login"); // "login" | "otp" | "success"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp,      setOtp]      = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [countdown,setCountdown]= useState(0);

  /* Countdown timer */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /* Auto-verify when 6 digits entered */
  useEffect(() => {
    if (otp.length === 6 && step === "otp" && !loading) {
      handleVerifyOTP();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  /* ── Generate OTP ── */
  function genOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /* ── Step 1: Verify credentials ── */
  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      /* Call the RPC function to verify against admin_users table */
      const { data: isValid, error: rpcErr } = await supabase.rpc("verify_admin_login", {
        p_email:    email.trim().toLowerCase(),
        p_password: password,
        
      });

      if (rpcErr) throw new Error("Server error. Please try again.");
      if (!isValid) throw new Error("Invalid email or password.");

      /* Generate OTP and store in DB */
      const newOTP = genOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertErr } = await supabase.from("otp_verifications").insert({
        email:      email.trim().toLowerCase(),
        otp:        newOTP,
        expires_at: expiresAt,
        used:       false,
      });
      if (insertErr) throw new Error("Could not create OTP. Try again.");

      /* Send OTP email via Edge Function */
      const otpRecipient = OTP_RECIPIENT_ENV || email.trim().toLowerCase();
      if (!otpRecipient) throw new Error("No OTP recipient configured. Set NEXT_PUBLIC_OTP_RECIPIENT.");
      const { error: fnErr } = await supabase.functions.invoke("send-otp-email", {
        body: { otp: newOTP, email: otpRecipient },
      });
      if (fnErr) throw new Error("Could not send OTP email. Check Edge Function.");

      setCountdown(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  /* ── Step 2: Verify OTP ── */
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

      /* Mark OTP as used */
      await supabase.from("otp_verifications").update({ used: true }).eq("id", data.id);

      sessionStorage.setItem("admin_authenticated", "true");
      setStep("success");
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setError(err.message);
      setOtp("");
    }
    setLoading(false);
  }

  /* ── Resend OTP ── */
  async function handleResend() {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const newOTP = genOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await supabase.from("otp_verifications").insert({
        email: email.trim().toLowerCase(),
        otp: newOTP,
        expires_at: expiresAt,
        used: false,
      });
      const otpRecipient = OTP_RECIPIENT_ENV || email.trim().toLowerCase();
      await supabase.functions.invoke("send-otp-email", {
        body: { otp: newOTP, email: otpRecipient },
      });
      setCountdown(60);
      setOtp("");
    } catch {
      setError("Failed to resend OTP.");
    }
    setLoading(false);
  }

  const isOTP     = step === "otp";
  const isSuccess = step === "success";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,34,24,0.55)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: "1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(40px)",
          borderRadius: 28,
          padding: "2.5rem",
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.04)",
          border: "1px solid rgba(255,255,255,0.95)",
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isOTP && !isSuccess && (
              <motion.button
                onClick={() => { setStep("login"); setOtp(""); setError(null); }}
                whileHover={{ x: -2 }}
                disabled={loading}
                style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", padding: 4 }}
              >
                <ArrowLeft size={16} />
              </motion.button>
            )}
            <motion.div
              animate={{
                background: isSuccess
                  ? "linear-gradient(135deg, #16A34A, #22C55E)"
                  : `linear-gradient(135deg, ${T.primary}, #226650)`,
              }}
              style={{
                width: 48, height: 48, borderRadius: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 18px rgba(13,51,39,0.30)",
              }}
            >
              {isSuccess
                ? <CheckCircle2 size={20} color="white" />
                : isOTP ? <Mail size={20} color="white" />
                : <Shield size={20} color="white" />}
            </motion.div>
            <div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "#0F172A", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {isSuccess ? "Access Granted!" : isOTP ? "Verify OTP" : "Admin Access"}
              </p>
              <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginTop: 4 }}>
                {isSuccess
                  ? "Redirecting to admin portal..."
                  : isOTP
                   ? "Code sent to your registered email"
                    : "Secure credentials required"}
              </p>
            </div>
          </div>
          {!isSuccess && (
            <motion.button
              onClick={onClose}
              disabled={loading}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 34, height: 34, borderRadius: 999,
                background: "rgba(20,61,48,0.06)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", color: "#94A3B8",
              }}
            >
              <X size={14} />
            </motion.button>
          )}
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                color: "#DC2626", fontSize: 12, fontWeight: 700,
                padding: "10px 14px", borderRadius: 12,
                display: "flex", alignItems: "center", gap: 8,
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════ LOGIN STEP ════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {step === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: "0.22em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@cura.com"
                    disabled={loading}
                    autoComplete="email"
                    style={{
                      width: "100%", paddingLeft: 42, paddingRight: 16,
                      paddingTop: 13, paddingBottom: 13,
                      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                      borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#0F172A",
                      outline: "none", transition: "all 0.2s", boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = "0 0 0 4px rgba(13,51,39,0.08)"; e.target.style.background = "white"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 900, fontFamily: "'Syne',sans-serif", letterSpacing: "0.22em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                    style={{
                      width: "100%", paddingLeft: 42, paddingRight: 44,
                      paddingTop: 13, paddingBottom: 13,
                      background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                      borderRadius: 14, fontSize: 14, fontWeight: 600, color: "#0F172A",
                      outline: "none", transition: "all 0.2s", boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = "0 0 0 4px rgba(13,51,39,0.08)"; e.target.style.background = "white"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F8FAFC"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", padding: 4 }}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* OTP notice */}
              <div style={{
                padding: "11px 14px", borderRadius: 12,
                background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)",
                fontSize: 11, color: "#475569", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Mail size={11} style={{ color: "#16A34A", flexShrink: 0 }} />
                An OTP will be sent to your registered email address.
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                style={{
                  width: "100%", padding: "14px",
                  background: `linear-gradient(135deg, ${T.primary}, #226650)`,
                  color: "white", border: "none", borderRadius: 14,
                  fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
                  textTransform: "uppercase", fontFamily: "'Syne',sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 6px 20px rgba(13,51,39,0.30)", marginTop: 4,
                }}
              >
                {loading ? <><Spinner /> Verifying...</> : <><Shield size={13} /> Continue to OTP</>}
              </motion.button>
            </motion.form>
          )}

          {/* ════ OTP STEP ══════════════════════════════════════════════════════ */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Info box */}
              <div style={{
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(13,51,39,0.03)", border: "1px solid rgba(13,51,39,0.08)",
                textAlign: "center",
              }}>
                <p style={{ fontSize: 13, color: "#475569", fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
                  Enter the 6-digit code sent to your<br />
                  <strong style={{ color: T.primary, fontFamily: "'Syne',sans-serif" }}>registered email address</strong>
                </p>
                <p style={{ fontSize: 11, color: T.muted, margin: "8px 0 0", fontWeight: 500 }}>
                  Valid for 10 minutes
                </p>
              </div>

              {/* OTP boxes */}
              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {/* Loading state */}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.accent, fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(13,51,39,0.15)", borderTopColor: T.accent, animation: "spin 0.8s linear infinite" }} />
                  Verifying code...
                </div>
              )}

              {/* Manual verify button (fallback) */}
              {!loading && otp.length === 6 && (
                <motion.button
                  onClick={handleVerifyOTP}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", padding: "14px",
                    background: `linear-gradient(135deg, ${T.primary}, #226650)`,
                    color: "white", border: "none", borderRadius: 14,
                    fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
                    textTransform: "uppercase", fontFamily: "'Syne',sans-serif",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 6px 20px rgba(13,51,39,0.30)",
                  }}
                >
                  <CheckCircle2 size={13} /> Verify & Enter
                </motion.button>
              )}

              {/* Resend */}
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>
                  Didn&apos;t receive it?{" "}
                </span>
                <motion.button
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  whileHover={countdown === 0 ? { scale: 1.03 } : {}}
                  style={{
                    background: "none", border: "none",
                    fontSize: 12, fontWeight: 700,
                    color: countdown > 0 ? T.muted : T.accent,
                    cursor: countdown > 0 ? "default" : "pointer",
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ════ SUCCESS ══════════════════════════════════════════════════════ */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "16px 0" }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5 }}
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #16A34A, #22C55E)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                }}
              >
                <CheckCircle2 size={28} color="white" />
              </motion.div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 20, color: "#0F172A", margin: "0 0 8px" }}>
                Identity Confirmed
              </p>
              <p style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>
                Redirecting to Admin Portal...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const router  = useRouter();
  const [time,          setTime]          = useState("");
  const [mounted,       setMounted]       = useState(false);
  const [hovered,       setHovered]       = useState(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function handleCardClick(card) {
    if (card.requiresAuth) {
      router.push("/admin-login");
    } else {
      router.push(card.route);
    }
  }

  function handleAdminAuthSuccess() {
    setShowAdminAuth(false);
    router.push("/admin");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #F4F8F5 0%, #FAFDF9 40%, #F2F7F3 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: "hidden",
      position: "relative",
    }}>
      <NoiseBg />

      {/* Admin Auth Modal */}
      <AnimatePresence>
        {showAdminAuth && (
          <AdminAuthModal
            onClose={() => setShowAdminAuth(false)}
            onSuccess={handleAdminAuthSuccess}
          />
        )}
      </AnimatePresence>

      {/* ── AMBIENT BLOBS ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,61,48,0.09) 0%, transparent 70%)",
            top: -200, left: -200 }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)",
            bottom: -100, right: -100 }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)",
            top: "40%", left: "35%" }}
        />
      </div>

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 3rem", height: 72,
          background: "rgba(244,248,245,0.96)",
          backdropFilter: "blur(48px) saturate(2)",
          WebkitBackdropFilter: "blur(48px) saturate(2)",
          borderBottom: "1px solid rgba(20,61,48,0.08)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.9), 0 4px 32px rgba(13,51,39,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(13,51,39,0.20), 0 1px 0 rgba(255,255,255,0.6) inset" }}
          >
            <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </motion.div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 17, color: T.text, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: "'Syne', sans-serif" }}>Cura</p>
            <p style={{ fontSize: 9, letterSpacing: "0.28em", color: T.muted, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>Healthcare OS</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 999,
              background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", flexShrink: 0,
                boxShadow: "0 0 0 2px rgba(34,197,94,0.2)" }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#16A34A", textTransform: "uppercase" }}>Live</span>
          </motion.div>

          {mounted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999,
                background: "rgba(255,255,255,0.85)", border: "1px solid rgba(20,61,48,0.08)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <Clock size={11} style={{ color: T.muted }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", letterSpacing: "0.02em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{time}</span>
            </motion.div>
          )}


        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ position: "relative", zIndex: 1, padding: "100px 3rem 80px", maxWidth: 1200, margin: "0 auto" }}
      >
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={slide} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 32, height: 1.5, background: "linear-gradient(90deg, transparent, rgba(20,61,48,0.3))", borderRadius: 1 }}/>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: T.muted, fontFamily: "'Syne', sans-serif" }}>
              A Two-Part Command Center
            </span>
          </motion.div>

          <motion.h1
            variants={slide}
            style={{
              fontWeight: 800, fontSize: "clamp(48px, 7vw, 84px)",
              color: T.text, lineHeight: 1.0, letterSpacing: "-0.04em",
              marginBottom: 28, maxWidth: 860,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            The clinic that{" "}
            <span style={{
              backgroundImage: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", fontStyle: "italic",
            }}>
              answers itself.
            </span>
          </motion.h1>

          <motion.p
            variants={slide}
            style={{ color: "#64748B", fontSize: 19, lineHeight: 1.75, maxWidth: 560, fontWeight: 400, marginBottom: 32 }}
          >
            Cura connects a master admin console and specialist dashboards into one calm ecosystem — scheduling, approvals, and clinic data stay in sync via WhatsApp automation.
          </motion.p>

          <motion.div variants={stagger} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 48 }}>
            {FEATURES.map((f) => (
              <motion.div
                key={f.label}
                variants={slide}
                whileHover={{ scale: 1.04, y: -2 }}
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "9px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(20,61,48,0.08)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  cursor: "default",
                }}
              >
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#475569", fontFamily: "'Syne', sans-serif" }}>
                  {f.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={stagger} style={{ display: "flex", gap: 56, flexWrap: "wrap", alignItems: "flex-end" }}>
            {STATS.map((s, i) => (
              <motion.div key={s.label} variants={slide} style={{ position: "relative" }}>
                {i > 0 && (
                  <div style={{
                    position: "absolute", left: -30, top: "15%", height: "70%", width: 1,
                    background: "linear-gradient(180deg, transparent, rgba(20,61,48,0.15), transparent)",
                  }}/>
                )}
                <p style={{ fontWeight: 800, fontSize: 52, color: T.primary, lineHeight: 1, letterSpacing: "-0.05em", fontFamily: "'Syne', sans-serif" }}>
                  {mounted ? <Counter target={s.value} suffix={s.suffix} decimals={s.decimals}/> : `${s.value}${s.suffix}`}
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.28em", marginTop: 8, fontFamily: "'Syne', sans-serif" }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── PORTAL CARDS ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 3rem 112px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}
        >
          <div style={{ width: 32, height: 1.5, background: "linear-gradient(90deg, transparent, rgba(20,61,48,0.3))", borderRadius: 1 }}/>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: T.muted, fontFamily: "'Syne', sans-serif" }}>
            Select Your Portal
          </span>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, alignItems: "stretch" }}>
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            const isHov = hovered === card.id;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.12, type: "spring", stiffness: 280, damping: 26 }}
                style={{ perspective: 1200 }}
              >
                <MagneticCard
                  onClick={() => handleCardClick(card)}
                  onMouseEnter={() => setHovered(card.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    cursor: "pointer",
                    height: "100%",
                    background: isHov ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.86)",
                    backdropFilter: "blur(40px) saturate(1.6)",
                    WebkitBackdropFilter: "blur(40px) saturate(1.6)",
                    border: isHov ? "1px solid rgba(34,197,94,0.22)" : "1px solid rgba(255,255,255,0.95)",
                    borderRadius: 28,
                    padding: "2.75rem",
                    position: "relative",
                    overflow: "hidden",
                    transition: "border 0.35s ease, background 0.35s ease, box-shadow 0.35s ease",
                    minHeight: 380,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: isHov
                      ? "0 32px 72px rgba(13,51,39,0.16), 0 8px 24px rgba(0,0,0,0.06)"
                      : "0 4px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "40%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
                    borderRadius: "28px 28px 0 0", pointerEvents: "none",
                  }}/>

                  <AnimatePresence>
                    {isHov && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                          position: "absolute", inset: 0, pointerEvents: "none",
                          background: "radial-gradient(ellipse at 20% 10%, rgba(34,197,94,0.06) 0%, transparent 60%)",
                        }}
                      />
                    )}
                  </AnimatePresence>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                    <div style={{
                      padding: "5px 14px", borderRadius: 999,
                      background: isHov ? "rgba(34,197,94,0.09)" : card.accentColor,
                      border: `1px solid ${isHov ? "rgba(34,197,94,0.20)" : "rgba(20,61,48,0.10)"}`,
                      transition: "all 0.3s",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {card.requiresAuth && <Lock size={9} style={{ color: isHov ? "#16A34A" : T.accent }} />}
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                        letterSpacing: "0.18em", color: isHov ? "#16A34A" : T.accent,
                        fontFamily: "'Syne', sans-serif",
                      }}>
                        {card.badge}
                      </span>
                    </div>
                    <motion.div
                      animate={isHov ? { x: 3, y: -3, opacity: 1 } : { x: 0, y: 0, opacity: 0.35 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ArrowUpRight size={18} style={{ color: isHov ? "#16A34A" : T.muted }} />
                    </motion.div>
                  </div>

                  <motion.div
                    animate={isHov ? { scale: 1.08, rotate: 4 } : { scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    style={{
                      width: 60, height: 60, borderRadius: 18, marginBottom: 24,
                      background: `linear-gradient(145deg, ${card.color}ee, ${card.color})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isHov ? `0 12px 32px ${card.color}40` : `0 6px 18px ${card.color}28`,
                      transition: "box-shadow 0.3s",
                    }}
                  >
                    <Icon size={24} color="white" />
                  </motion.div>

                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.28em", color: T.muted, marginBottom: 10, fontFamily: "'Syne', sans-serif" }}>
                    {card.num} — Portal
                  </p>

                  <h2 style={{ fontWeight: 800, fontSize: 28, color: T.text, marginBottom: 14, letterSpacing: "-0.03em", lineHeight: 1.1, fontFamily: "'Syne', sans-serif" }}>
                    {card.title}
                  </h2>

                  <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.72, fontWeight: 400, marginBottom: 28, flex: 1 }}>
                    {card.desc}
                  </p>

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,61,48,0.08), transparent)", marginBottom: 24 }}/>

                  <ul style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {card.bullets.map((b, bi) => (
                      <motion.li
                        key={b}
                        initial={false}
                        animate={isHov ? { x: 4 } : { x: 0 }}
                        transition={{ delay: bi * 0.05, type: "spring", stiffness: 350 }}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <CheckCircle2 size={14} style={{ color: "#22C55E", flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>{b}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <AnimatePresence>
                    {isHov && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ type: "spring", stiffness: 380, damping: 22 }}
                        style={{
                          marginTop: 24,
                          display: "flex", alignItems: "center", gap: 8,
                          fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                          letterSpacing: "0.18em", color: "#16A34A",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        {card.requiresAuth ? "Authenticate & Enter" : "Enter Portal"} <ArrowUpRight size={13} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MagneticCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        style={{
          position: "relative", zIndex: 1,
          margin: "0 auto 96px",
          maxWidth: 1200,
          borderRadius: 20, padding: "24px 36px",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          border: "1px solid rgba(255,255,255,0.92)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
        }}
      >
        {TRUST.map(({ icon: Ic, label, sub }, idx) => (
          <div
            key={label}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "4px 24px",
              borderRight: idx < TRUST.length - 1 ? "1px solid rgba(20,61,48,0.07)" : "none",
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: "rgba(20,61,48,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic size={16} style={{ color: T.accent }} />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, lineHeight: 1, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em" }}>{label}</p>
              <p style={{ fontSize: 11.5, color: T.muted, marginTop: 4, fontWeight: 500 }}>{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── FOOTER ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(20,61,48,0.07)",
          padding: "28px 3rem 36px",
          maxWidth: 1200, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, overflow: "hidden", boxShadow: "0 2px 8px rgba(13,51,39,0.18)" }}>
            <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>Cura</p>
            <p style={{ fontSize: 10, fontWeight: 500, color: T.muted, marginTop: 2 }}>© 2026 — All rights reserved</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Powered by Supabase + WhatsApp</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: "rgba(20,61,48,0.06)", border: "1px solid rgba(20,61,48,0.09)" }}>
            <Zap size={10} style={{ color: T.accent }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: T.accent, fontFamily: "'Syne', sans-serif", letterSpacing: "0.06em" }}>v2.0</span>
          </div>
        </div>
      </motion.footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}