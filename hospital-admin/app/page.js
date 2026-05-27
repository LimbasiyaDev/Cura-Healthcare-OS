"use client";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight, Shield, Stethoscope, Clock, CheckCircle2,
  Zap, Activity, Wifi, Bell, X, Lock, Mail, Eye, EyeOff, ArrowLeft, Building2, FlaskConical, Pill, Network, Plus,
  Search, ChevronRight, BookOpen, Terminal, Key, Database, Webhook, LayoutDashboard, LifeBuoy
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

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const T = {
  primary:   "#0F172A",
  accent:    "#16A34A",
  highlight: "#22C55E",
  light:     "#F8FAFC",
  muted:     "#64748B",
  border:    "rgba(0,0,0,0.06)",
  glass:     "rgba(255,255,255,0.85)",
  text:      "#0F172A",
  sub:       "#475569",
};

/* ─── FEATURE PILLS ─────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "💬", label: "Website Bot" },
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
    color: "#143D30",
    accentColor: "rgba(20,61,48,0.08)",
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
    color: "#143D30",
    accentColor: "rgba(20,61,48,0.08)",
  },
  {
    id: 3, num: "03",
    title: "Available Hospitals",
    desc: "Browse every registered facility, review capacity, departments, and locate the right hospital for any patient need.",
    icon: Building2,
    route: "/hospitals",
    badge: "Public",
    requiresAuth: false,
    bullets: ["Facility directory", "Department list", "Live capacity"],
    color: "#143D30",
    accentColor: "rgba(20,61,48,0.08)",
  },
  {
    id: 4, num: "04",
    title: "Laboratory",
    desc: "Manage diagnostic tests, review sample pipelines, and update patient reports securely.",
    icon: FlaskConical,
    route: "/laboratory",
    badge: "Lab",
    requiresAuth: false,
    bullets: ["Test management", "Sample tracking", "Report generation"],
    color: "#143D30",
    accentColor: "rgba(20,61,48,0.08)",
  },
  {
    id: 5, num: "05",
    title: "Pharmacy",
    desc: "Monitor inventory, process prescriptions, and handle medication dispensaries effectively.",
    icon: Pill,
    route: "/pharmacy",
    badge: "Pharmacy",
    requiresAuth: false,
    bullets: ["Inventory control", "Prescriptions", "Stock alerts"],
    color: "#143D30",
    accentColor: "rgba(20,61,48,0.08)",
  },
];

/* ─── TRUST ITEMS ────────────────────────────────────────────────────────────── */
const TRUST = [
  { icon: Activity, label: "Bot Intelligence",  sub: "Context-aware flow" },
  { icon: Bell,     label: "Instant Alerts",    sub: "Doctor + patient" },
  { icon: Wifi,     label: "Always-on Sync",    sub: "Multi-hospital ready" },
  { icon: Zap,      label: "Sub-2s Replies",    sub: "Optimised pipeline" },
];

/* ─── DOCS DATA ──────────────────────────────────────────────────────────────── */
const DOC_SECTIONS = [
  { icon: BookOpen,      label: "Getting Started",     sub: "Setup, env vars, Supabase config",      href: "#", tag: "Guide" },
  { icon: Key,           label: "Auth & OTP Flow",      sub: "Admin login, OTP verification steps",    href: "#", tag: "Security" },
  { icon: Activity,      label: "Bot Configuration",    sub: "Custom question flows per doctor",       href: "#", tag: "Bot" },
  { icon: Building2,     label: "Multi-Hospital Setup", sub: "Register & manage facilities",           href: "#", tag: "Infra" },
  { icon: Pill,          label: "Pharmacy Module",      sub: "Inventory, prescriptions, stock alerts", href: "#", tag: "Module" },
  { icon: FlaskConical,  label: "Lab Integration",      sub: "Sample tracking & report upload",        href: "#", tag: "Module" },
  { icon: Webhook,       label: "Real-time Sync",       sub: "Supabase subscriptions & webhooks",      href: "#", tag: "Infra" },
  { icon: Database,      label: "API Reference",        sub: "RPC functions & REST endpoints",         href: "#", tag: "Dev" },
];

/* ─── COMMAND ITEMS ─────────────────────────────────────────────────────────── */
const CMD_ITEMS = [
  { icon: Shield,       label: "Open Admin Portal",     sub: "Requires authentication",   route: null,          badge: "Auth",    requiresAuth: true },
  { icon: Stethoscope,  label: "Open Doctor Portal",    sub: "Manage schedule & bot",     route: "/doctor",     badge: "Portal",  requiresAuth: false },
  { icon: Building2,    label: "Browse Hospitals",      sub: "View all registered facilities", route: "/hospitals",  badge: "Public",  requiresAuth: false },
  { icon: FlaskConical, label: "Laboratory Dashboard",  sub: "Tests & sample tracking",   route: "/laboratory", badge: "Lab",     requiresAuth: false },
  { icon: Pill,         label: "Pharmacy Dashboard",    sub: "Inventory & prescriptions", route: "/pharmacy",   badge: "Pharmacy",requiresAuth: false },
  { icon: LayoutDashboard, label: "System Overview",   sub: "Stats, uptime, health",      route: "#",           badge: "Info",    requiresAuth: false },
  { icon: Terminal,     label: "API Reference",         sub: "Endpoints & RPC docs",       route: "#",           badge: "Dev",     requiresAuth: false },
  { icon: LifeBuoy,     label: "Support",               sub: "Contact the Cura team",      route: "#",           badge: "Help",    requiresAuth: false },
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
  const ref  = useRef(null);
  const mx   = useMotionValue(0);
  const my   = useMotionValue(0);
  const sx   = useSpring(mx, { stiffness: 200, damping: 32 });
  const sy   = useSpring(my, { stiffness: 200, damping: 32 });
  const rx   = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const ry   = useTransform(sx, [-0.5, 0.5], [-6, 6]);

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
    if (target === "∞") return;
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
  const [step,     setStep]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp,      setOtp]      = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [countdown,setCountdown]= useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (otp.length === 6 && step === "otp" && !loading) {
      handleVerifyOTP();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  function genOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
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
        email:      email.trim().toLowerCase(),
        otp:        newOTP,
        expires_at: expiresAt,
        used:       false,
      });
      if (insertErr) throw new Error("Could not create OTP. Try again.");

      const otpRecipient = email.trim().toLowerCase();
      if (!otpRecipient) throw new Error("Please enter a valid email.");

      const res = await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: newOTP, email: otpRecipient })
      });
      if (!res.ok) throw new Error("Could not send OTP email. Please try again.");

      setCountdown(60);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

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
      setStep("success");
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setError(err.message);
      setOtp("");
    }
    setLoading(false);
  }

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
      const otpRecipient = email.trim().toLowerCase();
      await fetch("/api/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: newOTP, email: otpRecipient })
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

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
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

              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: T.accent, fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(13,51,39,0.15)", borderTopColor: T.accent, animation: "spin 0.8s linear infinite" }} />
                  Verifying code...
                </div>
              )}

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

/* ─── DOCS DROPDOWN ─────────────────────────────────────────────────────────── */
function DocsDropdown({ open, onClose }) {
  const BADGE_COLORS = {
    Guide:    { bg: "rgba(59,130,246,0.08)",  color: "#2563EB" },
    Security: { bg: "rgba(239,68,68,0.08)",   color: "#DC2626" },
    Bot:      { bg: "rgba(168,85,247,0.08)",  color: "#7C3AED" },
    Infra:    { bg: "rgba(234,179,8,0.08)",   color: "#CA8A04" },
    Module:   { bg: "rgba(34,197,94,0.08)",   color: "#16A34A" },
    Dev:      { bg: "rgba(20,61,48,0.08)",    color: "#0F172A" },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 110 }}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -10,  scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              position: "absolute", top: "calc(100% + 16px)", right: 0,
              width: 460, background: "white", borderRadius: 22,
              boxShadow: "0 24px 64px rgba(0,0,0,0.11), 0 1px 2px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)", zIndex: 120, overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(135deg, rgba(20,61,48,0.02), rgba(34,197,94,0.03))",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, #226650)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={14} color="white" />
                </div>
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>Documentation</p>
                  <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0", fontWeight: 600 }}>Cura Healthcare OS — v2.4.0</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: T.accent, fontFamily: "'Syne',sans-serif", background: "rgba(34,197,94,0.08)", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(34,197,94,0.12)" }}>
                  Live Docs
                </span>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                  style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
                  <X size={12} />
                </motion.button>
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {DOC_SECTIONS.map((s, i) => {
                const Icon = s.icon;
                const badge = BADGE_COLORS[s.tag] || BADGE_COLORS.Dev;
                const isRight = i % 2 !== 0;
                const isLastRow = i >= DOC_SECTIONS.length - 2;
                return (
                  <motion.a
                    key={s.label} href={s.href}
                    whileHover={{ background: "rgba(20,61,48,0.025)" }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "14px 18px", textDecoration: "none",
                      borderRight: !isRight ? "1px solid rgba(0,0,0,0.04)" : "none",
                      borderBottom: !isLastRow ? "1px solid rgba(0,0,0,0.04)" : "none",
                      transition: "background 0.15s", cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: badge.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Icon size={13} color={badge.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, color: T.text, margin: 0, letterSpacing: "-0.01em" }}>{s.label}</p>
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: badge.color, background: badge.bg, padding: "2px 6px", borderRadius: 999, flexShrink: 0 }}>{s.tag}</span>
                      </div>
                      <p style={{ fontSize: 10, color: T.muted, margin: "3px 0 0", fontWeight: 500, lineHeight: 1.4 }}>{s.sub}</p>
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.05)",
              background: "rgba(248,250,252,0.9)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LifeBuoy size={12} color={T.muted} />
                <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>Need help? Open a support ticket.</span>
              </div>
              <motion.a href="#" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  background: T.primary, color: "white", border: "none", borderRadius: 999,
                  padding: "7px 16px", fontSize: 10, fontWeight: 800,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  fontFamily: "'Syne',sans-serif", cursor: "pointer",
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
                }}>
                Contact <ArrowUpRight size={10} />
              </motion.a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── COMMAND CENTER MODAL ───────────────────────────────────────────────────── */
function CommandCenterModal({ onClose, onAdminClick }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus search on open
    setTimeout(() => inputRef.current?.focus(), 80);
    // Close on Escape
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = CMD_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.sub.toLowerCase().includes(query.toLowerCase())
  );

  const BADGE_COLORS = {
    Auth:    { bg: "rgba(239,68,68,0.08)",   color: "#DC2626" },
    Portal:  { bg: "rgba(59,130,246,0.08)",  color: "#2563EB" },
    Public:  { bg: "rgba(34,197,94,0.08)",   color: "#16A34A" },
    Lab:     { bg: "rgba(168,85,247,0.08)",  color: "#7C3AED" },
    Pharmacy:{ bg: "rgba(234,179,8,0.08)",   color: "#CA8A04" },
    Info:    { bg: "rgba(20,61,48,0.06)",    color: "#0F172A" },
    Dev:     { bg: "rgba(20,61,48,0.08)",    color: "#0F172A" },
    Help:    { bg: "rgba(34,197,94,0.08)",   color: "#16A34A" },
  };

  function handleItemClick(item) {
    if (item.requiresAuth) {
      onClose();
      onAdminClick();
    } else if (item.route && item.route !== "#") {
      router.push(item.route);
      onClose();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,34,24,0.6)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 200, padding: "10vh 1.5rem 1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,   scale: 1 }}
        exit={{   opacity: 0, y: -16,  scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: "rgba(255,255,255,0.99)",
          borderRadius: 24,
          boxShadow: "0 40px 100px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${T.primary}, #226650)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Terminal size={15} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13, color: T.text, margin: 0, letterSpacing: "-0.01em" }}>Command Center</p>
            <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0", fontWeight: 500 }}>Navigate anywhere in the Cura ecosystem</p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, flexShrink: 0 }}
          >
            <X size={13} />
          </motion.button>
        </div>

        {/* Search input */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#CBD5E1", pointerEvents: "none" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search portals, modules, docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", paddingLeft: 42, paddingRight: 16,
                paddingTop: 11, paddingBottom: 11,
                background: "#F8FAFC", border: "1.5px solid #E2E8F0",
                borderRadius: 12, fontSize: 13, fontWeight: 500, color: T.text,
                outline: "none", transition: "all 0.2s", boxSizing: "border-box",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.background = "white"; e.target.style.boxShadow = "0 0 0 4px rgba(13,51,39,0.07)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.background = "#F8FAFC"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 10px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.muted }}>
              <Search size={24} style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }} />
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No results for "{query}"</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((item, i) => {
                const Icon = item.icon;
                const badge = BADGE_COLORS[item.badge] || BADGE_COLORS.Dev;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleItemClick(item)}
                    whileHover={{ background: "rgba(20,61,48,0.03)" }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 12px", borderRadius: 14,
                      cursor: "pointer", transition: "background 0.15s",
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: badge.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={badge.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: T.text, margin: 0 }}>{item.label}</p>
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: badge.color, background: badge.bg, padding: "2px 7px", borderRadius: 999, flexShrink: 0 }}>{item.badge}</span>
                      </div>
                      <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", fontWeight: 500 }}>{item.sub}</p>
                    </div>
                    <ChevronRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "10px 20px", borderTop: "1px solid rgba(0,0,0,0.05)",
          background: "rgba(248,250,252,0.9)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[["↵", "Select"], ["↑↓", "Navigate"], ["Esc", "Close"]].map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  fontFamily: "'Syne',sans-serif", fontSize: 9, fontWeight: 800,
                  background: "white", border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 6, padding: "2px 7px", color: T.sub,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}>{key}</span>
                <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{filtered.length} results</span>
        </div>
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
  const [showDocs,      setShowDocs]      = useState(false);
  const [showCommand,   setShowCommand]   = useState(false);
  const docsRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
    tick();
    const id = setInterval(tick, 1000);

    // Close docs dropdown on outside click
    const handleClick = (e) => {
      if (docsRef.current && !docsRef.current.contains(e.target)) {
        setShowDocs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);

    // Global keyboard shortcut: Cmd/Ctrl+K opens Command Center
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommand(true);
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      clearInterval(id);
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  function handleCardClick(card) {
    if (card.requiresAuth) {
      setShowAdminAuth(true);
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
      background: "#FAFAFA",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: "hidden",
      position: "relative",
    }}>
      <NoiseBg />

      {/* Modals */}
      <AnimatePresence>
        {showAdminAuth && (
          <AdminAuthModal
            onClose={() => setShowAdminAuth(false)}
            onSuccess={handleAdminAuthSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCommand && (
          <CommandCenterModal
            onClose={() => setShowCommand(false)}
            onAdminClick={() => setShowAdminAuth(true)}
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
          padding: "0 3rem", height: 76,
          background: "rgba(250,250,250,0.85)",
          backdropFilter: "blur(24px) saturate(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset" }}
          >
            <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </motion.div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: T.text, lineHeight: 1, letterSpacing: "-0.02em", fontFamily: "'Syne', sans-serif" }}>Cura</p>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", color: T.muted, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>Healthcare OS</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)" }}
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", flexShrink: 0,
                boxShadow: "0 0 0 2px rgba(34,197,94,0.15)" }}
            />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#16A34A", textTransform: "uppercase" }}>System Live</span>
          </motion.div>

          {mounted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: 6, color: T.muted }}
            >
              <Clock size={12} />
              <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.01em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{time}</span>
            </motion.div>
          )}

          <div style={{ width: 1, height: 16, background: "rgba(0,0,0,0.08)", margin: "0 4px" }} />

          {/* Documentation — with dropdown */}
          <div ref={docsRef} style={{ position: "relative" }}>
            <motion.button
              onClick={() => setShowDocs(s => !s)}
              whileHover={{ color: T.accent }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                color: showDocs ? T.accent : T.sub,
                display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: "4px 2px",
                transition: "color 0.2s",
              }}
            >
              <BookOpen size={13} />
              Documentation
              <motion.span
                animate={{ rotate: showDocs ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex" }}
              >
                <ChevronRight size={11} style={{ transform: "rotate(90deg)" }} />
              </motion.span>
            </motion.button>
            <DocsDropdown open={showDocs} onClose={() => setShowDocs(false)} />
          </div>

          {/* Command Center button */}
          <motion.button
            onClick={() => setShowCommand(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: T.primary, color: "white", border: "none", borderRadius: 999,
              padding: "10px 20px", fontSize: 12, fontWeight: 700, letterSpacing: "0.02em",
              cursor: "pointer", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
              display: "flex", alignItems: "center", gap: 7,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Terminal size={12} />
            Command Center
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
              background: "rgba(255,255,255,0.15)", borderRadius: 5,
              padding: "2px 6px", fontFamily: "'Syne',sans-serif",
            }}>⌘K</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ position: "relative", zIndex: 1, padding: "80px 3rem 60px", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ flex: 1, maxWidth: 600 }}>
          <motion.div variants={slide} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 32, height: 1.5, background: "linear-gradient(90deg, transparent, rgba(20,61,48,0.3))", borderRadius: 1 }}/>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.25em", color: T.accent, fontFamily: "'Syne', sans-serif" }}>
              The Three-Part Command Center
            </span>
          </motion.div>

          <motion.h1
            variants={slide}
            style={{
              fontWeight: 800, fontSize: "clamp(48px, 6vw, 76px)",
              color: T.text, lineHeight: 1.1, letterSpacing: "-0.04em",
              marginBottom: 24,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            The clinic that{" "}
            <br />
            <span style={{
              backgroundImage: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", fontStyle: "italic", fontWeight: 600
            }}>
              answers itself.
            </span>
          </motion.h1>

          <motion.p
            variants={slide}
            style={{ color: T.sub, fontSize: 17, lineHeight: 1.6, maxWidth: 480, fontWeight: 500, marginBottom: 40 }}
          >
            A unified healthcare ecosystem connecting admin consoles and specialist dashboards via automated real-time interactions.
          </motion.p>

          <motion.div variants={stagger} style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {FEATURES.map((f) => (
              <motion.div
                key={f.label}
                variants={slide}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span style={{ fontSize: 13, filter: "grayscale(1) opacity(0.5)" }}>{f.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: T.muted, fontFamily: "'Syne', sans-serif" }}>
                  {f.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating Diagram */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }} style={{ position: "relative", flexShrink: 0, width: 440, height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
            <motion.path
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              d="M 120 320 L 220 220 L 320 120"
              stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeDasharray="4 4" fill="none"
            />
          </svg>

          <motion.div
            animate={{ y: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            style={{ position: "absolute", bottom: 60, left: 60, width: 100, height: 100, background: "white", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)", zIndex: 1 }}
          >
            <Shield size={28} color={T.primary} />
          </motion.div>

          <motion.div
            animate={{ y: [6, -6, 6] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            style={{ position: "absolute", width: 130, height: 130, background: "white", borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 48px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.05)", zIndex: 2 }}
          >
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Network size={36} color={T.primary} />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
            style={{ position: "absolute", top: 60, right: 60, width: 80, height: 80, background: "white", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)", zIndex: 1 }}
          >
            <Stethoscope size={24} color={T.accent} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── STATS ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 3rem 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ display: "flex", alignItems: "stretch", background: "white", borderRadius: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}
        >
          {STATS.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: "40px 48px", borderRight: i < STATS.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Activity size={14} color={T.accent} />
                <p style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'Syne', sans-serif" }}>
                  {s.label}
                </p>
              </div>
              <p style={{ fontWeight: 800, fontSize: 48, color: T.primary, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: "'Syne', sans-serif" }}>
                {mounted ? <Counter target={s.value} suffix={s.suffix} decimals={s.decimals}/> : `${s.value}${s.suffix}`}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── PORTAL CARDS ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 3rem 112px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}
        >
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: T.accent, fontFamily: "'Syne', sans-serif", display: "block", marginBottom: 8 }}>
              Integrated Ecosystem
            </span>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em", margin: 0 }}>
              Select Your Portal
            </h2>
          </div>
          <p style={{ fontSize: 14, color: T.sub, fontWeight: 500, maxWidth: 300, textAlign: "right", margin: 0, lineHeight: 1.5 }}>
            Seamlessly toggle between specialized environments within the Cura infrastructure.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            const isHov = hovered === card.id;
            return (
              <motion.div key={card.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.12, type: "spring", stiffness: 280, damping: 26 }} style={{ height: "100%" }}>
                <MagneticCard
                  onClick={() => handleCardClick(card)} onMouseEnter={() => setHovered(card.id)} onMouseLeave={() => setHovered(null)}
                  style={{
                    cursor: "pointer", height: "100%", background: "white", borderRadius: 24, padding: "2.25rem", position: "relative", overflow: "hidden",
                    border: isHov ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(0,0,0,0.04)",
                    boxShadow: isHov ? "0 24px 48px rgba(0,0,0,0.04)" : "0 4px 16px rgba(0,0,0,0.02)",
                    transition: "all 0.3s ease", display: "flex", flexDirection: "column", minHeight: 320,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.3s ease", transform: isHov ? "scale(1.1)" : "scale(1)" }}>
                      <Icon size={20} color={T.primary} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: T.muted, fontFamily: "'Syne', sans-serif" }}>
                      {card.num} — {card.badge}
                    </span>
                  </div>

                  <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>
                    {card.title}
                  </h2>

                  <p style={{ color: T.sub, fontSize: 13, lineHeight: 1.6, fontWeight: 500, marginBottom: 28, flex: 1 }}>
                    {card.desc}
                  </p>

                  <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {card.bullets.map((b) => (
                      <li key={b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(34,197,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle2 size={10} style={{ color: "#16A34A" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </MagneticCard>
              </motion.div>
            );
          })}

          {/* Integrate New Portal Card */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + 5 * 0.12, type: "spring", stiffness: 280, damping: 26 }} style={{ height: "100%" }}>
            <div style={{ background: "rgba(255,255,255,0.4)", border: "2px dashed rgba(34,197,94,0.25)", borderRadius: 24, padding: "2.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 320, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 20 }}>
                <Plus size={24} color={T.accent} />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Integrate New Portal</h2>
              <p style={{ color: T.sub, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Expand your network with partner laboratory or specialist clinics.</p>
              <button style={{ background: "white", color: T.primary, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999, padding: "10px 24px", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>Request Access</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
        style={{ position: "relative", zIndex: 1, margin: "0 auto 80px", maxWidth: 1200, borderRadius: 24, padding: "20px 32px", background: "white", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {TRUST.map(({ icon: Ic, label, sub }, idx) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic size={20} color={T.primary} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: T.primary, lineHeight: 1.2, fontFamily: "'Syne', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 2, fontWeight: 500 }}>{sub}</p>
            </div>
            {idx < TRUST.length - 1 && <div style={{ width: 1, height: 24, background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />}
          </div>
        ))}
      </motion.div>

      {/* ── FOOTER ── */}
      <motion.footer
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(0,0,0,0.06)", padding: "32px 3rem 40px", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "'Syne', sans-serif" }}>Cura</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#" style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.15em", textDecoration: "none" }}>Security</a>
          <a href="#" style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.15em", textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ fontSize: 10, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: "0.15em", textDecoration: "none" }}>Terms</a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>© 2026 Cura Healthcare Systems. Premium Clinic Operating OS.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#16A34A", fontFamily: "'Syne', sans-serif", letterSpacing: "0.06em" }}>v2.4.0</span>
          </div>
        </div>
      </motion.footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}