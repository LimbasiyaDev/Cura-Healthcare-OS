"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, CheckCircle2, XCircle, LayoutDashboard, Building2, Users, Calendar, Settings, HelpCircle, BedDouble, Activity, Bell, Search, X } from "lucide-react";
import HospitalModal     from "./components/HospitalModal";
import EditHospitalModal from "./components/EditHospitalModal";
import SpecialistModal   from "./components/SpecialistModal";
import HospitalList      from "./components/HospitalList";
import DoctorList        from "./components/DoctorList";
import DoctorDrawer      from "./components/DoctorDrawer";
import DashboardView     from "./components/DashboardView";
import SettingsView      from "./components/SettingsView";

/* ─── Support Modal ──────────────────────────────────────────────────────── */
function SupportModal({ onClose, showToast, supabase }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [issue,   setIssue]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !issue.trim()) { showToast("Please fill in name and issue.", "error"); return; }
    setLoading(true);
    const { error } = await supabase.from("support_tickets").insert([{ name: name.trim(), email: email.trim() || null, issue: issue.trim() }]);
    setLoading(false);
    if (error) { showToast("Failed to submit: " + error.message, "error"); return; }
    setDone(true);
    setTimeout(() => onClose(), 2200);
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(10,34,24,0.45)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"1.5rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:24, padding:"2rem", width:"100%", maxWidth:440, boxShadow:"0 32px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"#143D30", display:"flex", alignItems:"center", justifyContent:"center" }}><HelpCircle size={20} color="white"/></div>
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18, color:"#0F172A", margin:0 }}>Support</p>
              <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, margin:0 }}>We'll get back to you shortly</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:999, background:"rgba(20,61,48,0.06)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:18 }}>✕</button>
        </div>
        {done ? (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"#0F172A", marginBottom:6 }}>Ticket Submitted!</p>
            <p style={{ color:"#94A3B8", fontSize:13 }}>We've received your request and will respond soon.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { label:"Your Name", val:name, set:setName, ph:"Dr. John Smith", type:"text" },
              { label:"Email (optional)", val:email, set:setEmail, ph:"you@hospital.com", type:"email" },
            ].map(({ label, val, set, ph, type }) => (
              <div key={label}>
                <label style={{ display:"block", fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.22em", textTransform:"uppercase", color:"#94A3B8", marginBottom:7 }}>{label}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                  style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"#F8FAFC", fontSize:14, fontWeight:600, color:"#0F172A", outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                  onFocus={e => { e.target.style.borderColor="#143D30"; e.target.style.background="white"; }}
                  onBlur={e => { e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC"; }}
                />
              </div>
            ))}
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:"0.22em", textTransform:"uppercase", color:"#94A3B8", marginBottom:7 }}>Describe Your Issue</label>
              <textarea value={issue} onChange={e => setIssue(e.target.value)} placeholder="Describe the problem you're facing…" rows={4}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid #E2E8F0", background:"#F8FAFC", fontSize:14, fontWeight:500, color:"#0F172A", outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.6 }}
                onFocus={e => { e.target.style.borderColor="#143D30"; e.target.style.background="white"; }}
                onBlur={e => { e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFC"; }}
              />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              style={{ width:"100%", padding:"14px", borderRadius:12, background:"#143D30", color:"white", border:"none", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {loading ? "Submitting…" : "Submit Ticket"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg, type }) {
  const c = { success:"#10B981", error:"#EF4444", info:"#3B82F6", warning:"#F59E0B" };
  return (
    <div style={{ position:"fixed", bottom:28, right:28, background:"white", borderRadius:14, padding:"13px 20px", boxShadow:"0 16px 48px rgba(0,0,0,0.14)", borderLeft:`3px solid ${c[type]||c.success}`, zIndex:9999, fontSize:13, fontWeight:700, color:"#0F172A", display:"flex", alignItems:"center", gap:10, maxWidth:340, animation:"slideUp 0.3s ease" }}>
      {msg}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, border }) {
  return (
    <div style={{ background:"white", borderRadius:18, border:`1px solid ${border||"rgba(20,61,48,0.07)"}`, padding:"20px 22px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", flex:1 }}>
      <p style={{ fontSize:9, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginBottom:10 }}>{label}</p>
      <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:36, color:accent||"#0F172A", letterSpacing:"-0.05em", lineHeight:1, marginBottom:4 }}>{value}</p>
      <p style={{ fontSize:12, color:"#94A3B8", fontWeight:500 }}>{sub}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function MasterAdmin() {
  const router = useRouter();

  /* ─ data ─────────────────────────────────────────────────────────────── */
  const [hospitals,    setHospitals]    = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeHosp,   setActiveHosp]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [adminSession, setAdminSession] = useState(null);

  /* ─ UI ───────────────────────────────────────────────────────────────── */
  const [tab,          setTab]          = useState("dashboard");
  const [toast,        setToast]        = useState(null);
  const [showAddHosp,  setShowAddHosp]  = useState(false);
  const [showSupport,  setShowSupport]  = useState(false);
  const [editHosp,     setEditHosp]     = useState(null);
  const [showSpec,     setShowSpec]     = useState(false);
  const [manageDoc,    setManageDoc]    = useState(null);
  const [apptFilter,   setApptFilter]   = useState("all");

  /* ─ GLOBAL SEARCH ────────────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when switching tabs
  function switchTab(newTab) {
    setTab(newTab);
    setSearchQuery("");
  }

  /* ─ toast ─────────────────────────────────────────────────────────────── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ─ load ──────────────────────────────────────────────────────────────── */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const adminAuth = sessionStorage.getItem("admin_authenticated");
      if (!session && !adminAuth) { router.push("/admin-login"); return; }
      if (session) setAdminSession(session);

      const [{ data: hosp }, { data: docs }, { data: appts }] = await Promise.all([
        supabase.from("hospitals").select("*").order("name"),
        supabase.from("doctors").select("*").order("name"),
        supabase.from("appointments").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      setHospitals(hosp || []);
      setDoctors(docs || []);
      setAppointments(appts || []);
      setActiveHosp(prev => {
        if (prev) return (hosp||[]).find(h => h.id === prev.id) || (hosp||[])[0] || null;
        return (hosp||[])[0] || null;
      });
      if (manageDoc) {
        const fresh = (docs||[]).find(d => d.id === manageDoc.id);
        if (fresh) setManageDoc(fresh);
      }
    } catch(e) { console.error(e); showToast("Failed to load data", "error"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [router, manageDoc]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  /* ─ hospital handlers ─────────────────────────────────────────────────── */
  async function handleAddHospital(form) {
    const { data, error } = await supabase.from("hospitals").insert([{
      name: form.name, address: form.address || null,
      phone_number_id: form.phone_number_id || null,
      whatsapp_token:  form.whatsapp_token  || null,
    }]).select().single();
    if (error) { showToast("Failed to add hospital: " + error.message, "error"); return; }
    showToast(`${form.name} added!`);
    setShowAddHosp(false);
    await load(true);
    setActiveHosp(data);
  }

  async function handleSaveHospital(updated) {
    const { error } = await supabase.from("hospitals").update({
      name:            updated.name,
      address:         updated.address || null,
      phone_number_id: updated.phone_number_id || null,
      whatsapp_token:  updated.whatsapp_token  || null,
    }).eq("id", updated.id);
    if (error) { showToast("Failed to save: " + error.message, "error"); return; }
    showToast("Hospital updated");
    setEditHosp(null);
    await load(true);
  }

  async function handleDeleteHospital(h) {
    const { error } = await supabase.from("hospitals").delete().eq("id", h.id);
    if (error) { showToast("Failed to delete", "error"); return; }
    showToast(`${h.name} deleted`, "info");
    setEditHosp(null);
    await load(true);
    setActiveHosp(null);
  }

  /* ─ doctor handlers ───────────────────────────────────────────────────── */
  async function handleAddDoctor(form) {
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    try {
      const authRes = await fetch(`${BOT_URL}/create-doctor-auth`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, tempPassword }),
      });
      if (!authRes.ok) { const err = await authRes.json(); throw new Error(err.error || "Failed to create auth account"); }
      const authData = await authRes.json();

      const { error } = await supabase.from("doctors").insert([{
        user_id:       authData.userId,
        name:          form.name,
        department:    form.department,
        email:         form.email,
        phone:         form.phone,
        room_number:   form.room_number   || null,
        hospital_id:   form.hospital_id,
        working_hours: form.working_hours || "09:00 AM - 06:00 PM",
        slot_duration: form.slot_duration || 20,
        is_available:  true,
        first_login:   true,
      }]);
      if (error) {
        if (error.code === "23505") throw new Error("A doctor with this email or phone number already exists.");
        throw error;
      }

      const botRes = await fetch(`${BOT_URL}/notify-doctor-onboarded`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, name: form.name, email: form.email, tempPassword, hospitalId: form.hospital_id }),
      });
      if (!botRes.ok) throw new Error("Doctor added to database, but WhatsApp message failed to send.");

      showToast(`Dr. ${form.name} onboarded! Credentials sent via WhatsApp.`);
      setShowSpec(false);
      await load(true);
    } catch(err) {
      showToast("Failed to onboard: " + err.message, "error");
    }
  }

  async function handleDeleteDoctor(doc) {
    if (!confirm(`Delete Dr. ${doc.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("doctors").delete().eq("id", doc.id);
    if (error) { showToast("Failed to delete", "error"); return; }
    showToast(`Dr. ${doc.name} removed`, "info");
    setManageDoc(null);
    await load(true);
  }

  async function handleToggleAvailability(doc) {
    const { error } = await supabase.from("doctors").update({ is_available: !doc.is_available }).eq("id", doc.id);
    if (error) { showToast("Update failed", "error"); return; }
    showToast(`Dr. ${doc.name} is now ${!doc.is_available ? "Online" : "Offline"}`);
    await load(true);
  }

  async function handleUpdateDoctorField(docId, fields) {
    const { error } = await supabase.from("doctors").update(fields).eq("id", docId);
    if (error) { showToast("Update failed", "error"); return; }
    await load(true);
  }

  /* ─ appointment handlers ──────────────────────────────────────────────── */
  async function handleApptStatus(appt, status) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", appt.id);
    if (error) { showToast("Failed to update", "error"); return; }
    showToast(status === "booked" ? "Appointment confirmed" : "Appointment rejected", status === "booked" ? "success" : "warning");
    await load(true);
  }

  /* ─ derived stats ─────────────────────────────────────────────────────── */
  const today     = new Date().toISOString().split("T")[0];
  const liveCount = doctors.filter(d => d.hospital_id === activeHosp?.id && d.is_available).length;
  const todayLoad = appointments.filter(a => {
    const doc = doctors.find(d => d.id === a.doctor_id);
    return a.date === today && doc?.hospital_id === activeHosp?.id;
  }).length;
  const pendingAll = appointments.filter(a => a.status === "pending").length;

  /* ─ patients tab filtered ─────────────────────────────────────────────── */
  const histFiltered = appointments.filter(a => {
    const doc = doctors.find(d => d.id === a.doctor_id);
    const matchHosp   = doc?.hospital_id === activeHosp?.id;
    const matchStatus = apptFilter === "all" || a.status === apptFilter;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !q ||
      a.name?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.reason?.toLowerCase().includes(q) ||
      doc?.name?.toLowerCase().includes(q);
    return matchHosp && matchStatus && matchSearch;
  });

  /* ─ search placeholder per tab ────────────────────────────────────────── */
  const searchPlaceholder = {
    
    hospitals:  "Search hospitals…",
    doctors:    "Search doctors or departments…",
    historical: "Search patients, phone, doctor…",
    settings:   "",
  }[tab] || "Search…";

  /* ─ tab renderer ──────────────────────────────────────────────────────── */
  function TabContent() {
    if (tab === "dashboard") return (
      <DashboardView
        hospitals={hospitals} doctors={doctors} appointments={appointments}
        activeHospital={activeHosp}
        onNavigate={switchTab}
        showToast={showToast}
        searchQuery={searchQuery}
      />
    );

    if (tab === "hospitals") return (
      <HospitalList
        hospitals={hospitals} activeHospital={activeHosp} doctors={doctors}
        onSwitch={setActiveHosp}
        onEdit={setEditHosp}
        onAddHospital={() => setShowAddHosp(true)}
        externalSearch={searchQuery}
      />
    );

    if (tab === "settings") return (
      <SettingsView
        hospitals={hospitals} doctors={doctors} activeHospital={activeHosp}
        supabase={supabase} showToast={showToast} adminSession={adminSession}
      />
    );

    if (tab === "doctors") return (
      <DoctorList
        doctors={doctors} appointments={appointments} hospitals={hospitals}
        activeHospital={activeHosp}
        onManage={setManageDoc}
        onDelete={handleDeleteDoctor}
        externalSearch={searchQuery}
      />
    );

    if (tab === "historical") return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:12 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:22, color:"#0F172A", letterSpacing:"-0.03em" }}>
            Appointments ({histFiltered.length})
          </h2>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["all","pending","booked","rejected"].map(f => (
              <button key={f} onClick={() => setApptFilter(f)}
                style={{ padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", background:apptFilter===f?"#143D30":"rgba(20,61,48,0.06)", color:apptFilter===f?"white":"#94A3B8", transition:"all 0.15s" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:"white", borderRadius:18, border:"1px solid rgba(20,61,48,0.07)", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr 1.2fr 160px", gap:8, padding:"10px 22px", background:"#FAFCFB", borderBottom:"1px solid #F1F7F3" }}>
            {["PATIENT","PHONE","DATE","SLOT","DOCTOR","ACTION"].map(h => (
              <span key={h} style={{ fontSize:9, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif" }}>{h}</span>
            ))}
          </div>

          {histFiltered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#94A3B8", fontSize:14, fontWeight:600 }}>
              {searchQuery ? `No appointments matching "${searchQuery}"` : "No appointments found"}
            </div>
          ) : histFiltered.slice(0, 60).map((a, i) => {
            const doc = doctors.find(d => d.id === a.doctor_id);
            return (
              <div key={a.id} style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 1fr 1fr 1.2fr 160px", gap:8, padding:"13px 22px", alignItems:"center", borderBottom:i < histFiltered.length - 1 ? "1px solid #F8FBFA" : "none", transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F6FAF8"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{a.name || "—"}</p>
                  <p style={{ fontSize:11, color:"#94A3B8" }}>{a.reason || ""}</p>
                </div>
                <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{a.phone || "—"}</span>
                <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{a.date || "—"}</span>
                <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>{a.slot || "—"}</span>
                <span style={{ fontSize:12, color:"#64748B", fontWeight:600 }}>Dr. {doc?.name || "—"}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {a.status === "pending" ? (
                    <>
                      <button onClick={() => handleApptStatus(a, "booked")} style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 10px", borderRadius:8, background:"#ECFDF5", color:"#059669", border:"1.5px solid #A7F3D0", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:10, cursor:"pointer", letterSpacing:"0.06em" }}>
                        <CheckCircle2 size={11}/> CONFIRM
                      </button>
                      <button onClick={() => handleApptStatus(a, "rejected")} style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 10px", borderRadius:8, background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FECACA", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:10, cursor:"pointer", letterSpacing:"0.06em" }}>
                        <XCircle size={11}/> REJECT
                      </button>
                    </>
                  ) : (
                    <span style={{ display:"inline-flex", padding:"4px 10px", borderRadius:999, fontSize:9, fontWeight:800, fontFamily:"'Syne',sans-serif",
                      background: a.status==="booked"?"#ECFDF5":a.status==="rejected"?"#FEF2F2":"#FFFBEB",
                      color:      a.status==="booked"?"#059669":a.status==="rejected"?"#DC2626":"#D97706" }}>
                      {a.status?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ─ loading ───────────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#143D30,#0A2218)" }}>
      <div style={{ textAlign:"center", color:"white" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:24, marginBottom:8 }}>Cura</p>
        <p style={{ fontSize:11, opacity:.45, letterSpacing:"0.3em", textTransform:"uppercase" }}>Loading admin panel…</p>
      </div>
    </div>
  );

  const NAV_ITEMS = [
    { key:"dashboard",  label:"Dashboard", Icon:LayoutDashboard },
    { key:"hospitals",  label:"Hospitals", Icon:Building2 },
    { key:"doctors",    label:"Doctors",   Icon:Users },
    { key:"historical", label:"Patients",  Icon:Calendar },
    { key:"settings",   label:"Settings",  Icon:Settings },
  ];

  /* ─ render ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#EEF3F0", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{ width:200, minHeight:"100vh", background:"white", borderRight:"1px solid rgba(20,61,48,0.07)", display:"flex", flexDirection:"column", position:"fixed", left:0, top:0, zIndex:40, padding:"0 0 24px", boxShadow:"2px 0 24px rgba(20,61,48,0.04)" }}>
        <div style={{ padding:"22px 18px 18px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(20,61,48,0.06)" }}>
          <div style={{ width:36, height:36, borderRadius:11, background:"#143D30", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>🛡️</div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16, color:"#0F172A", lineHeight:1.1 }}>Cura</div>
            <div style={{ fontSize:9.5, color:"#94A3B8", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" }}>Admin Portal</div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"14px 10px", display:"flex", flexDirection:"column", gap:2 }}>
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => switchTab(key)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:11, fontSize:13.5, fontWeight:tab===key?700:600, color:tab===key?"#143D30":"#64748B", cursor:"pointer", border:"none", background:tab===key?"#EAF2EE":"none", width:"100%", textAlign:"left", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s", position:"relative" }}>
              {tab === key && <span style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:3, borderRadius:"0 3px 3px 0", background:"#143D30" }}/>}
              <span style={{ width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={17}/></span>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ margin:"0 10px 10px", padding:"13px 14px", borderRadius:13, background:"#F8FAF9", border:"1px solid rgba(20,61,48,0.07)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#334155", display:"flex", alignItems:"center", gap:6, marginBottom:7, fontFamily:"'Syne',sans-serif" }}>
            <Activity size={12} color="#059669"/>System Health
          </div>
          <div style={{ height:5, background:"#E2EAE6", borderRadius:999, overflow:"hidden", marginBottom:4 }}>
            <div style={{ height:"100%", width:"100%", background:"linear-gradient(90deg,#143D30,#4ECCA3)", borderRadius:999 }}/>
          </div>
          <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>100% Operational</div>
        </div>

        <div style={{ padding:"0 10px", display:"flex", flexDirection:"column", gap:2 }}>
          <button onClick={() => setShowSupport(true)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:11, fontSize:13, fontWeight:600, color:"#94A3B8", cursor:"pointer", border:"none", background:"none", width:"100%", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <HelpCircle size={16}/> Support
          </button>
          <button onClick={async () => { sessionStorage.removeItem("admin_authenticated"); await supabase.auth.signOut(); router.push("/admin-login"); }}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:11, fontSize:13, fontWeight:600, color:"#EF4444", cursor:"pointer", border:"none", background:"none", width:"100%", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            <LogOut size={16}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div style={{ marginLeft:200, flex:1, display:"flex", flexDirection:"column" }}>

        {/* TOPBAR */}
        <div style={{ height:64, background:"rgba(255,255,255,0.95)", backdropFilter:"blur(48px)", borderBottom:"1px solid rgba(20,61,48,0.07)", display:"flex", alignItems:"center", padding:"0 28px", gap:14, position:"sticky", top:0, zIndex:30, boxShadow:"0 4px 16px rgba(20,61,48,0.04)" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"#0F172A", letterSpacing:"-0.03em" }}>
              {{ dashboard:"Dashboard", hospitals:"Hospitals", doctors:"Doctors", historical:"Patients", settings:"Settings" }[tab]}
            </span>
          </div>

          {/* Search — hidden on settings tab */}
          {tab !== "settings" && (
            <div style={{ flex:1, maxWidth:400, position:"relative", marginLeft:16 }}>
              <Search size={13} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"#94A3B8", pointerEvents:"none" }}/>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{ width:"100%", padding:"9px 36px 9px 36px", borderRadius:999, border:"1.5px solid rgba(20,61,48,0.09)", background:"#F6FAF8", fontSize:13, color:"#334155", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#143D30"}
                onBlur={e => e.target.style.borderColor = "rgba(20,61,48,0.09)"}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex", padding:2 }}>
                  <X size={13}/>
                </button>
              )}
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            <button onClick={() => load(true)}
              style={{ width:36, height:36, borderRadius:10, border:"1.5px solid rgba(20,61,48,0.09)", background:"#F6FAF8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B" }}>
              <RefreshCw size={14} style={{ animation:refreshing?"spin 0.8s linear infinite":undefined }}/>
            </button>
            <button style={{ width:36, height:36, borderRadius:10, border:"1.5px solid rgba(20,61,48,0.09)", background:"#F6FAF8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748B", position:"relative" }}>
              <Bell size={15}/>
              {pendingAll > 0 && <span style={{ position:"absolute", top:-2, right:-2, width:9, height:9, background:"#EF4444", borderRadius:"50%", border:"2px solid white" }}/>}
            </button>
            <div style={{ width:1, height:28, background:"rgba(20,61,48,0.08)" }}/>
            <button onClick={() => router.push("/doctor")}
              style={{ padding:"8px 16px", borderRadius:10, border:"1.5px solid rgba(20,61,48,0.12)", background:"white", color:"#143D30", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, cursor:"pointer", letterSpacing:"0.06em" }}>
              DOCTOR PORTAL →
            </button>
            <button onClick={() => setShowSpec(true)}
              style={{ padding:"9px 18px", borderRadius:10, background:"#143D30", color:"white", border:"none", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:11, cursor:"pointer", boxShadow:"0 4px 14px rgba(20,61,48,0.28)", letterSpacing:"0.08em" }}>
              + ONBOARD SPECIALIST
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding:"28px 28px 48px", flex:1 }}>

          {/* Hospital switcher — hidden on dashboard and settings */}
          {tab !== "dashboard" && tab !== "settings" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#94A3B8", fontFamily:"'Syne',sans-serif", marginRight:4 }}>ACTIVE HOSPITAL:</span>
              {hospitals.map(h => (
                <button key={h.id} onClick={() => setActiveHosp(h)}
                  style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:999, border:h.id===activeHosp?.id?"none":"1.5px solid rgba(20,61,48,0.12)", background:h.id===activeHosp?.id?"#143D30":"white", color:h.id===activeHosp?.id?"white":"#64748B", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", boxShadow:h.id===activeHosp?.id?"0 3px 12px rgba(20,61,48,0.28)":"none", transition:"all 0.15s" }}>
                  {h.id === activeHosp?.id && <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ECCA3", display:"inline-block" }}/>}
                  {h.name.length > 18 ? h.name.slice(0,18) + "…" : h.name}
                </button>
              ))}
              <button onClick={() => setShowAddHosp(true)}
                style={{ padding:"7px 16px", borderRadius:999, border:"1.5px dashed rgba(20,61,48,0.25)", background:"transparent", color:"#94A3B8", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:10, cursor:"pointer" }}>
                + ADD HOSPITAL
              </button>
            </div>
          )}

          {/* Stat cards — hidden on dashboard and settings */}
          {tab !== "dashboard" && tab !== "settings" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
              <StatCard label="TOTAL HOSPITALS"   value={hospitals.length} sub="Under your management"/>
              <StatCard label="PENDING APPROVALS" value={pendingAll} sub="Awaiting review"/>
              <StatCard label="LIVE SPECIALISTS"  value={liveCount} sub={`At ${activeHosp?.name||"hospital"}`} accent={liveCount>0?"#059669":undefined} border={liveCount>0?"rgba(16,185,129,0.2)":undefined}/>
              <StatCard label="TODAY'S LOAD" value={todayLoad} sub="Appointments today" accent={todayLoad>5?"#D97706":undefined} border={todayLoad>5?"rgba(245,158,11,0.2)":undefined}/>
            </div>
          )}

          <TabContent/>
        </div>
      </div>

      {/* MODALS */}
      {showAddHosp && <HospitalModal    onClose={() => setShowAddHosp(false)} onAdd={handleAddHospital}/>}
      {editHosp    && <EditHospitalModal hospital={editHosp} onClose={() => setEditHosp(null)} onSave={handleSaveHospital} onDelete={handleDeleteHospital}/>}
      {showSpec    && <SpecialistModal   hospitals={hospitals} activeHospital={activeHosp} onClose={() => setShowSpec(false)} onAdd={handleAddDoctor}/>}
      {manageDoc   && <DoctorDrawer doctor={manageDoc} appointments={appointments} onClose={() => setManageDoc(null)} onToggleAvailability={handleToggleAvailability} onUpdateField={handleUpdateDoctorField} showToast={showToast}/>}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} showToast={showToast} supabase={supabase}/>}
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}