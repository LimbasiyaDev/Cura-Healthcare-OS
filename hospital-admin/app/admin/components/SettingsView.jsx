"use client";
import { useState, useEffect } from "react";
import { User, Shield, Eye, EyeOff, ChevronRight, LogOut, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: on ? "#143D30" : "#CBD5E1",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.25s", flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 22 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transition: "left 0.22s",
      }} />
    </button>
  );
}

/* ─── Text Input ─────────────────────────────────────────────────────────── */
function InputField({ label, value, onChange, readOnly = false, type = "text", placeholder = "" }) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isPass && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            width: "100%", padding: isPass ? "10px 38px 10px 14px" : "10px 14px",
            borderRadius: 10, border: "1.5px solid #E2E8F0",
            background: readOnly ? "#F8FAFC" : "white",
            fontSize: 14, color: readOnly ? "#64748B" : "#0F172A",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 500, outline: "none",
            boxSizing: "border-box", transition: "border-color 0.15s",
          }}
          onFocus={e => !readOnly && (e.target.style.borderColor = "#143D30")}
          onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Role Select ────────────────────────────────────────────────────────── */
function RoleSelect({ value, onChange }) {
  const roles = ["Super Admin", "Admin", "Moderator", "Viewer"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        Role
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px",
          borderRadius: 10, border: "1.5px solid #E2E8F0",
          background: "white", fontSize: 14, color: "#0F172A",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 500, outline: "none",
          boxSizing: "border-box", cursor: "pointer",
          transition: "border-color 0.15s", appearance: "none",
        }}
        onFocus={e => (e.target.style.borderColor = "#143D30")}
        onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
      >
        {roles.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}

/* ─── Change Password Modal ──────────────────────────────────────────────── */
function ChangePasswordModal({ onClose, supabase, showToast }) {
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleSave() {
    if (!current)          { showToast("Enter your current password.", "error"); return; }
    if (!next || !confirm) { showToast("Please fill all fields.", "error"); return; }
    if (next !== confirm)  { showToast("Passwords do not match.", "error"); return; }
    if (next.length < 6)   { showToast("Password must be ≥ 6 characters.", "error"); return; }

    setSaving(true);
    try {
      const adminEmail = sessionStorage.getItem("admin_email") || "";
      if (!adminEmail) throw new Error("Session expired. Please sign in again.");

      // Verify current password via RPC
      const { data: isValid, error: verifyErr } = await supabase.rpc("verify_admin_login", {
        p_email: adminEmail,
        p_password: current
      });

      if (verifyErr) throw new Error("Server error verifying password.");
      if (!isValid) throw new Error("Current password is incorrect.");

      // Update password via RPC
      const { error: updateErr } = await supabase.rpc("update_admin_password", {
        p_email: adminEmail,
        p_password: next
      });

      if (updateErr) throw new Error("Failed to save: " + updateErr.message);

      setDone(true);
      showToast("Password updated successfully!", "success");
      setTimeout(() => { setDone(false); onClose(); }, 1800);
    } catch (e) {
      showToast(e.message, "error");
    }
    setSaving(false);
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(10,34,24,0.45)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1.5rem" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 24, padding: "2rem", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.18)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#143D30", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 17, color: "#0F172A", margin: 0 }}>Change Password</p>
              <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, margin: 0 }}>Update your admin credentials</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(20,61,48,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 18 }}>✕</button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircle2 size={52} color="#059669" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#0F172A", marginBottom: 6 }}>Password Updated!</p>
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Your admin password has been changed.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField label="Current Password"     value={current} onChange={setCurrent} type="password" placeholder="Enter current password" />
            <InputField label="New Password"         value={next}    onChange={setNext}    type="password" placeholder="Min. 6 characters" />
            <InputField label="Confirm New Password" value={confirm} onChange={setConfirm} type="password" placeholder="Repeat new password" />
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%", padding: "13px", borderRadius: 12,
                background: "#143D30", color: "white", border: "none",
                fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12,
                letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1, marginTop: 4,
              }}
            >
              {saving ? "Updating…" : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function SettingsView({ supabase, showToast, adminSession }) {
  const router = useRouter();

  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [role,          setRole]          = useState("Super Admin");
  const [twoFA,         setTwoFA]         = useState(false);
  const [twoFASaving,   setTwoFASaving]   = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile,  setSavedProfile]  = useState(false);
  const [signingOut,    setSigningOut]    = useState(false);
  const [loading,       setLoading]       = useState(true);

  /* ─ load admin data ──────────────────────────────────────────────────── */
  useEffect(() => {
    const resolvedEmail =
      sessionStorage.getItem("admin_email") ||
      adminSession?.user?.email ||
      "";

    setEmail(resolvedEmail);
    if (!resolvedEmail) { setLoading(false); return; }

    async function loadAdminData() {
      const { data, error } = await supabase
        .from("admin_users")
        .select("name, role, two_fa_enabled")
        .eq("email", resolvedEmail)
        .single();

      if (error) {
        showToast("Failed to load profile: " + error.message, "error");
      } else if (data) {
        setName(data.name || "");
        setRole(data.role || "Super Admin");
        setTwoFA(data.two_fa_enabled || false);
      }
      setLoading(false);
    }
    loadAdminData();
  }, [adminSession, supabase]);

  /* ─ update profile (name + role) ────────────────────────────────────── */
  async function handleUpdateProfile() {
    if (!name.trim()) { showToast("Name cannot be empty.", "error"); return; }

    const resolvedEmail = sessionStorage.getItem("admin_email") || email;
    if (!resolvedEmail) { showToast("Session expired. Please sign in again.", "error"); return; }

    setSavingProfile(true);
    try {
      const { error: dbErr } = await supabase
        .from("admin_users")
        .update({ name: name.trim(), role: role })
        .eq("email", resolvedEmail);

      if (dbErr) throw new Error(dbErr.message);

      setSavedProfile(true);
      showToast("Profile updated!", "success");
      setTimeout(() => setSavedProfile(false), 3000);
    } catch (e) {
      showToast("Failed: " + e.message, "error");
    }
    setSavingProfile(false);
  }

  /* ─ toggle 2FA ───────────────────────────────────────────────────────── */
  async function handleToggle2FA(newVal) {
    const resolvedEmail = sessionStorage.getItem("admin_email") || email;
    if (!resolvedEmail) { showToast("Session expired.", "error"); return; }

    setTwoFASaving(true);
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ two_fa_enabled: newVal })
        .eq("email", resolvedEmail);

      if (error) throw new Error(error.message);

      setTwoFA(newVal);
      showToast(newVal ? "2FA enabled successfully." : "2FA disabled.", newVal ? "success" : "info");
    } catch (e) {
      showToast("Failed to update 2FA: " + e.message, "error");
    }
    setTwoFASaving(false);
  }

  /* ─ sign out ─────────────────────────────────────────────────────────── */
  async function handleSignOut() {
    setSigningOut(true);
    try {
      sessionStorage.removeItem("admin_authenticated");
      sessionStorage.removeItem("admin_email");
      await supabase.auth.signOut().catch(() => {});
      showToast("Signed out.", "success");
      router.push("/admin-login");
    } catch (e) {
      showToast("Sign out failed: " + e.message, "error");
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(20,61,48,0.15)", borderTopColor: "#143D30", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 26, color: "#0F172A", letterSpacing: "-0.04em", marginBottom: 4 }}>
          Account Settings
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
          Manage your personal profile, security preferences, and account access.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

        {/* ── Profile Information ── */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(20,61,48,0.08)", padding: "28px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <User size={16} color="#143D30" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#0F172A", letterSpacing: "-0.01em" }}>
              Profile Information
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <InputField label="Full Name"     value={name}  onChange={setName}  placeholder="Admin Name" />
            <InputField label="Email Address" value={email} readOnly />
          </div>

          <div style={{ marginBottom: 24, maxWidth: "50%" }}>
            <RoleSelect value={role} onChange={setRole} />
          </div>

          <button
            onClick={handleUpdateProfile}
            disabled={savingProfile}
            style={{
              padding: "11px 24px", borderRadius: 10,
              background: savedProfile ? "#059669" : "#143D30",
              color: "white", border: "none",
              fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13,
              cursor: savingProfile ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(20,61,48,0.25)",
              letterSpacing: "0.02em", transition: "background 0.3s",
              opacity: savingProfile ? 0.75 : 1,
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            {savedProfile ? <><CheckCircle2 size={14} /> Updated!</> : savingProfile ? "Saving…" : "Update Profile"}
          </button>
        </div>

        {/* ── Security ── */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(20,61,48,0.08)", padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <Shield size={16} color="#143D30" />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#0F172A", letterSpacing: "-0.01em" }}>
              Security
            </span>
          </div>

          {/* Change Password */}
          <button
            onClick={() => setShowPassModal(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "14px 16px",
              borderRadius: 12, border: "1.5px solid #E2E8F0",
              background: "#F8FAFC", cursor: "pointer",
              marginBottom: 16, transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#143D30"; e.currentTarget.style.background = "#F0FAF5"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EAF2EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#143D30" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Change Password
              </span>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </button>

          {/* 2FA Toggle */}
          <div style={{ padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${twoFA ? "rgba(20,61,48,0.2)" : "#E2E8F0"}`, background: twoFA ? "rgba(20,61,48,0.03)" : "#F8FAFC", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>2FA</span>
                {twoFA && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", background: "rgba(5,150,105,0.1)", padding: "2px 8px", borderRadius: 999, fontFamily: "'Syne',sans-serif", letterSpacing: "0.05em" }}>
                    ENABLED
                  </span>
                )}
              </div>
              <Toggle on={twoFA} onChange={handleToggle2FA} disabled={twoFASaving} />
            </div>
            <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, lineHeight: 1.55, margin: 0 }}>
              {twoFA
                ? "Two-factor authentication is active. Your account is more secure."
                : "Two-factor authentication adds an extra layer of security to your account."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Account Access ── */}
      <div style={{
        background: "white", borderRadius: 20,
        border: "1px solid rgba(220,38,38,0.12)",
        padding: "22px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#DC2626", margin: "0 0 4px" }}>
            Account Access
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500, margin: 0 }}>
            Securely end your current active session on this device.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "12px 22px", borderRadius: 12,
            background: "#FFF5F5", border: "1.5px solid #FECACA",
            color: "#DC2626", fontFamily: "'Syne',sans-serif",
            fontWeight: 800, fontSize: 13, cursor: signingOut ? "not-allowed" : "pointer",
            letterSpacing: "0.04em", transition: "background 0.2s",
            opacity: signingOut ? 0.6 : 1,
          }}
          onMouseEnter={e => !signingOut && (e.currentTarget.style.background = "#FEE2E2")}
          onMouseLeave={e => (e.currentTarget.style.background = "#FFF5F5")}
        >
          <LogOut size={15} />
          {signingOut ? "Signing out…" : "Sign Out of Account"}
        </button>
      </div>

      {showPassModal && (
        <ChangePasswordModal
          onClose={() => setShowPassModal(false)}
          supabase={supabase}
          showToast={showToast}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}