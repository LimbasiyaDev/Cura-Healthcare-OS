"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FlaskConical, Activity, CheckCircle2, Settings, LogOut, Bell, Search, 
  RefreshCw, Clock, FileText, Database, ShieldCheck, Download, Users
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const PRIMARY = "#143D30"; // Deep Teal
const ACCENT = "#10B981"; // Emerald

// Placeholder Data for Premium UI (Since no DB table exists yet)
const MOCK_TESTS = [
  { id: "LAB-294-A", patient: "Michael Chen", test: "Complete Blood Count (CBC)", priority: "Urgent", status: "In Progress", date: new Date().toLocaleDateString() },
  { id: "LAB-294-B", patient: "Sarah Jenkins", test: "Lipid Panel", priority: "Routine", status: "Pending", date: new Date().toLocaleDateString() },
  { id: "LAB-294-C", patient: "David O'Connor", test: "Comprehensive Metabolic", priority: "Routine", status: "Completed", date: new Date(Date.now() - 86400000).toLocaleDateString() },
  { id: "LAB-294-D", patient: "Emma Watson", test: "Thyroid Panel (TSH)", priority: "Urgent", status: "Pending", date: new Date().toLocaleDateString() },
];

export default function LaboratoryDashboard() {
  const router = useRouter();
  const [laboratory, setLaboratory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNav, setActiveNav] = useState("diagnostics");
  const [search, setSearch] = useState("");

  const [catalog, setCatalog] = useState([]);
  const [catalogId, setCatalogId] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [liveQueue, setLiveQueue] = useState([]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    if (!laboratory || !laboratory.id) return;
    setIsSaving(true);
    try {
      await supabase.from("laboratories").update({
        diagnostic_scope: laboratory.diagnostic_scope
      }).eq("id", laboratory.id);
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveCatalog = async (newCatalog) => {
    setCatalog(newCatalog);
    setShowTestModal(false);
    if (catalogId) {
      await supabase.from("prescriptions").update({ medicines: newCatalog }).eq("id", catalogId);
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    let isRedirecting = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { isRedirecting = true; router.push("/login"); return; }
      
      const { data: lab, error: lErr } = await supabase.from("laboratories").select("*").eq("user_id", user.id).single();
      if (!lab || lErr) { isRedirecting = true; router.push("/login"); return; }
      
      setLaboratory(lab);
      
      // Fetch Live Queue (Prescriptions with tests assigned to this lab)
      const { data: rxList, error: rxErr } = await supabase
        .from("prescriptions")
        .select("*, doctors(name)")
        .not("tests", "is", null)
        .ilike("notes", `%[LABORATORY: ${lab.id}]%`)
        .order("created_at", { ascending: false });

      // Fetch UIDs
      const { data: wpData } = await supabase.from("web_patients").select("phone, email, uid");
      const uidMap = {};
      if (wpData) {
        wpData.forEach(wp => {
          if (wp.phone) uidMap[wp.phone] = wp.uid;
          if (wp.email) { uidMap[wp.email] = wp.uid; uidMap[`web_${wp.email}`] = wp.uid; }
        });
      }

      if (!rxErr && rxList) {
        const queue = [];
        rxList.forEach(rx => {
          const patientUid = uidMap[rx.patient_phone] || null;
          if (Array.isArray(rx.tests) && rx.tests.length > 0) {
            rx.tests.forEach((testName, idx) => {
              queue.push({
                id: rx.id + "-" + idx,
                rx_id: rx.id,
                test_name: testName,
                patient_name: rx.patient_name || "Unknown",
                patient_uid: patientUid,
                doctor_name: rx.doctors?.name || "Doctor",
                date: new Date(rx.created_at).toLocaleDateString(),
                status: rx.status === "completed" ? "Completed" : rx.status === "active" ? "In Progress" : "Pending",
                priority: "Routine"
              });
            });
          }
        });
        setLiveQueue(queue);
      }

      // Fetch or Create Lab Catalog
      const { data: catData, error: catErr } = await supabase
        .from("prescriptions")
        .select("id, medicines")
        .ilike("notes", `%[LAB_CATALOG: ${lab.id}]%`)
        .limit(1);

      if (!catErr && catData && catData.length > 0) {
        setCatalog(catData[0].medicines || []);
        setCatalogId(catData[0].id);
      } else {
        const payload = {
          patient_name: "LAB_CATALOG",
          diagnosis: "LAB_CATALOG",
          status: "catalog",
          notes: `[LAB_CATALOG: ${lab.id}]`,
          medicines: [
            { id: "TEST-1", name: "Complete Blood Count (CBC)", category: "Hematology", price: 450, turnaround: "24h" },
            { id: "TEST-2", name: "Lipid Profile", category: "Biochemistry", price: 600, turnaround: "12h" }
          ]
        };
        const { data: newCat } = await supabase.from("prescriptions").insert(payload).select("id, medicines").single();
        if (newCat) {
          setCatalog(newCat.medicines || []);
          setCatalogId(newCat.id);
        }
      }

    } catch(err) {
      console.error(err);
    } finally { 
      if (!isRedirecting) {
        setLoading(false); 
        setRefreshing(false); 
      }
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const updateTestStatus = async (rx_id, currentStatus) => {
    let newStatus = "";
    if (currentStatus === "Pending") newStatus = "active";
    else if (currentStatus === "In Progress") newStatus = "completed";
    else return;

    // Optimistic UI update
    setLiveQueue(prev => prev.map(q => q.rx_id === rx_id ? { ...q, status: newStatus === "completed" ? "Completed" : "In Progress" } : q));

    await supabase.from("prescriptions").update({ status: newStatus }).eq("id", rx_id);
    // fetchData(true); // Optional: Re-fetch from server to be totally in sync
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, background: `linear-gradient(160deg,${PRIMARY} 0%,#0F172A 100%)` }}>
        <motion.div animate={{ scale: [1,1.07,1] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ width: 80, height: 80, borderRadius: 26, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 48px rgba(0,0,0,0.3)" }}>
          <FlaskConical size={40} color={PRIMARY} />
        </motion.div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase" }}>Syncing Diagnostics Node</p>
      </div>
    );
  }

  if (!laboratory) return null;

  const NAV_ITEMS = [
    { id: "dashboard", icon: Activity, label: "Dashboard" },
    { id: "diagnostics", icon: FlaskConical, label: "Diagnostic Queue" },
    { id: "database", icon: Database, label: "Test Catalog" },
    { id: "settings", icon: Settings, label: "Settings" }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8FAFC", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 260, background: PRIMARY, color: "white", display: "flex", flexDirection: "column", padding: "32px 24px", position: "relative" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FlaskConical size={20} color={ACCENT} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: "-0.02em" }}>Cura Health</h2>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", margin: "2px 0 0" }}>Laboratory Node</p>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {NAV_ITEMS.map(nav => {
            const active = activeNav === nav.id;
            return (
              <button key={nav.id} onClick={() => setActiveNav(nav.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14,
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.6)",
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13
                }}>
                <nav.icon size={18} color={active ? ACCENT : "currentColor"} />
                {nav.label}
              </button>
            );
          })}
        </nav>

        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
              {laboratory.name?.[0] || "L"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{laboratory.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{laboratory.accreditation_number}</p>
            </div>
          </div>
          <button onClick={handleSignOut} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* TOP BAR */}
        <div style={{ height: 80, background: "white", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: PRIMARY, textTransform: "uppercase", fontFamily: "'Syne',sans-serif" }}>Secure FHIR Network</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sample ID or patient..."
                style={{ padding: "12px 20px 12px 42px", borderRadius: 999, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 13, outline: "none", width: 280, transition: "all 0.2s" }}
                onFocus={e=>{e.target.style.borderColor=PRIMARY;e.target.style.background="white";}}
                onBlur={e=>{e.target.style.borderColor="#E2E8F0";e.target.style.background="#F1F5F9";}}/>
            </div>
            <button onClick={() => fetchData(true)} style={{ width: 44, height: 44, borderRadius: "50%", background: "#F1F5F9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", cursor: "pointer" }}>
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw size={18} />
              </motion.div>
            </button>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EEF2FF", border: "1px solid #E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, position: "relative" }}>
              <Bell size={18} />
              <div style={{ position: "absolute", top: 10, right: 12, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: "2px solid #EEF2FF" }} />
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 32, color: "#0F172A", margin: "0 0 8px", letterSpacing: "-0.04em" }}>
                {NAV_ITEMS.find(n => n.id === activeNav)?.label || "Laboratory"}
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>Manage diagnostic requests, equipment health, and resulting.</p>
            </div>
            
            {activeNav === "database" && (
              <button onClick={() => { setEditingTest(null); setShowTestModal(true); }} style={{ padding: "12px 24px", borderRadius: 999, background: PRIMARY, color: "white", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>+</div>
                Add Test
              </button>
            )}
          </div>

          {activeNav === "diagnostics" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* STATS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
                {[
                  { label: "Pending Tests", val: liveQueue.filter(q => q.status === "Pending").length.toString(), icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
                  { label: "In Progress", val: liveQueue.filter(q => q.status === "In Progress").length.toString(), icon: Activity, color: ACCENT, bg: "#EEF2FF" },
                  { label: "Completed (24h)", val: liveQueue.filter(q => q.status === "Completed").length.toString(), icon: CheckCircle2, color: "#10B981", bg: "#ECFDF5" }
                ].map(s => (
                  <div key={s.label} style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                      <s.icon size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: 28, fontFamily: "'Syne',sans-serif", fontWeight: 900, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>{s.val}</span>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TABLE */}
              <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 12px 32px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 1fr 1fr", padding: "16px 32px", background: "#F1F5F9", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", fontFamily: "'Syne',sans-serif" }}>
                  <span>Requisition ID</span>
                  <span>Patient / Doctor</span>
                  <span>Requested Panel</span>
                  <span>Priority</span>
                  <span style={{ textAlign: "right" }}>Status</span>
                </div>
                
                {liveQueue.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
                    No pending diagnostic requests in the queue.
                  </div>
                ) : liveQueue.filter(p => !search || p.patient_name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())).map((p, i) => {
                  return (
                    <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1.5fr 1fr 1fr", padding: "20px 32px", borderBottom: "1px solid rgba(0,0,0,0.02)", alignItems: "center", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      
                      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#475569", fontWeight: 600 }}>
                        {p.id.split('-').slice(0, 2).join('-')}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
                          {p.patient_name?.[0] || "?"}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
                            {p.patient_name} {p.patient_uid && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 800 }}>#{p.patient_uid}</span>}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94A3B8" }}>Dr. {p.doctor_name} &bull; {p.date}</p>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                        {p.test_name}
                      </div>

                      <div>
                        {p.priority === "Urgent" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#FEF2F2", color: "#EF4444" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }}/> Urgent
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#F1F5F9", color: "#64748B" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }}/> Routine
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {p.status === "Completed" ? (
                           <span style={{ fontSize: 12, fontWeight: 800, color: "#10B981" }}>COMPLETED</span>
                        ) : p.status === "In Progress" ? (
                           <button onClick={() => updateTestStatus(p.rx_id, p.status)} style={{ padding: "8px 16px", borderRadius: 8, background: "#EEF2FF", color: ACCENT, border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>MARK COMPLETED</button>
                        ) : (
                           <button onClick={() => updateTestStatus(p.rx_id, p.status)} style={{ padding: "8px 16px", borderRadius: 8, background: PRIMARY, color: "white", border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>ACCEPT TEST</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}

          {activeNav === "database" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 12px 32px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr", padding: "16px 32px", background: "#F1F5F9", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B", fontFamily: "'Syne',sans-serif" }}>
                  <span>Test Code</span>
                  <span>Test Name</span>
                  <span>Category</span>
                  <span>Turnaround Time</span>
                  <span style={{ textAlign: "right" }}>Price</span>
                </div>
                
                {catalog.map((item, i) => (
                  <div key={item.id} onClick={() => { setEditingTest(item); setShowTestModal(true); }} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr", padding: "20px 32px", borderBottom: "1px solid rgba(0,0,0,0.02)", alignItems: "center", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontFamily: "monospace", fontSize: 13, color: "#475569", fontWeight: 600 }}>{item.id}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>{item.category}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{item.turnaround}</div>
                    <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#10B981" }}>₹{item.price}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeNav === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              
              {/* TOP METRICS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 24 }}>
                {[
                  { label: "Total Requests (Today)", val: liveQueue.length.toString(), icon: FileText, color: PRIMARY, bg: "#F1F5F9" },
                  { label: "Pending Processing", val: liveQueue.filter(q => q.status === "Pending").length.toString(), icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
                  { label: "Catalog Size", val: catalog.length.toString() + " Tests", icon: Database, color: ACCENT, bg: "#EEF2FF" },
                  { label: "Network Health", val: "99.9%", icon: Activity, color: "#10B981", bg: "#ECFDF5" }
                ].map(s => (
                  <div key={s.label} style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                      <s.icon size={24} />
                    </div>
                    <div>
                      <span style={{ display: "block", fontSize: 24, fontFamily: "'Syne',sans-serif", fontWeight: 900, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>{s.val}</span>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TWO COLUMN LAYOUT */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
                
                {/* RECENT ACTIVITY */}
                <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 12px 32px rgba(0,0,0,0.03)", padding: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#0F172A" }}>Recent Diagnostic Requests</h2>
                    <button onClick={() => setActiveNav("diagnostics")} style={{ background: "none", border: "none", color: ACCENT, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>View All</button>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {liveQueue.slice(0, 4).map((q, i) => (
                      <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid #F1F5F9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", color: PRIMARY, fontWeight: 800 }}>
                            {q.patient_name?.[0]}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{q.test_name}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>{q.patient_name} {q.patient_uid && <span style={{ fontSize: 10, color: "#10B981", fontWeight: 800 }}>#{q.patient_uid}</span>} &bull; {q.date}</p>
                          </div>
                        </div>
                        <div>
                           <span style={{ fontSize: 11, fontWeight: 800, color: q.status === "Pending" ? "#F59E0B" : q.status === "In Progress" ? ACCENT : "#10B981", background: q.status === "Pending" ? "#FFFBEB" : q.status === "In Progress" ? "#EEF2FF" : "#ECFDF5", padding: "6px 12px", borderRadius: 999 }}>
                             {q.status.toUpperCase()}
                           </span>
                        </div>
                      </div>
                    ))}
                    {liveQueue.length === 0 && (
                      <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                        No recent requests.
                      </div>
                    )}
                  </div>
                </div>

                {/* QUICK ACTIONS / ALERTS */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ background: PRIMARY, borderRadius: 24, padding: 32, color: "white", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.1 }}>
                      <ShieldCheck size={120} />
                    </div>
                    <span style={{ display: "inline-block", padding: "6px 12px", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 999, marginBottom: 24 }}>System Secure</span>
                    <h3 style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 18 }}>Blockchain Ledger Active</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>All diagnostic results are cryptographically signed and stored in the secure FHIR network.</p>
                  </div>
                  
                  <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 12px 32px rgba(0,0,0,0.03)", padding: 24 }}>
                    <h3 style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 14, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <button onClick={() => setActiveNav("database")} style={{ width: "100%", padding: "16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=ACCENT} onMouseLeave={e=>e.currentTarget.style.borderColor="#E2E8F0"}>
                        <div style={{ color: ACCENT }}><Database size={18} /></div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Manage Catalog</span>
                      </button>
                      <button onClick={() => setActiveNav("diagnostics")} style={{ width: "100%", padding: "16px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=ACCENT} onMouseLeave={e=>e.currentTarget.style.borderColor="#E2E8F0"}>
                        <div style={{ color: PRIMARY }}><FlaskConical size={18} /></div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>View Queue</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeNav === "settings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600 }}>
              <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 12px 32px rgba(0,0,0,0.03)", padding: 32 }}>
                <h2 style={{ margin: "0 0 24px", fontWeight: 700, fontSize: 20, color: "#0F172A" }}>Laboratory Profile</h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>Facility Name (Read Only)</label>
                    <input disabled value={laboratory.name} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 14, color: "#94A3B8", outline: "none", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>Accreditation Number (Read Only)</label>
                    <input disabled value={laboratory.accreditation_number} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 14, color: "#94A3B8", outline: "none", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>Diagnostic Scope</label>
                    <select value={laboratory.diagnostic_scope || ""} onChange={(e) => setLaboratory({...laboratory, diagnostic_scope: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", fontSize: 14, color: "#0F172A", outline: "none", transition: "border-color 0.2s", appearance: "none" }} onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = "#E2E8F0"}>
                      <option value="" disabled>Select Laboratory Focus</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Hematology">Hematology</option>
                      <option value="Genetics">Genetics</option>
                      <option value="Microbiology">Microbiology</option>
                    </select>
                  </div>

                  <button onClick={handleSaveSettings} disabled={isSaving} style={{ marginTop: 12, width: "100%", padding: "16px", borderRadius: 12, background: PRIMARY, color: "white", border: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: isSaving ? "not-allowed" : "pointer" }}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TEST MODAL */}
          <AnimatePresence>
            {showTestModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: "white", borderRadius: 24, padding: 32, width: "100%", maxWidth: 500, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: "#0F172A" }}>{editingTest ? "Edit Test" : "Add Test"}</h2>
                    <button onClick={() => setShowTestModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#94A3B8" }}>×</button>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Test Name</label>
                      <input id="test-name" defaultValue={editingTest?.name || ""} placeholder="e.g. Complete Blood Count (CBC)" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Category</label>
                      <input id="test-cat" defaultValue={editingTest?.category || ""} placeholder="e.g. Hematology" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Turnaround Time</label>
                        <input id="test-tat" defaultValue={editingTest?.turnaround || ""} placeholder="e.g. 24h" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Price (₹)</label>
                        <input id="test-price" type="number" defaultValue={editingTest?.price || 0} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
                    {editingTest && (
                      <button onClick={() => {
                        if(confirm("Are you sure you want to delete this test?")) {
                          saveCatalog(catalog.filter(m => m.id !== editingTest.id));
                        }
                      }} style={{ padding: "12px 24px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", fontWeight: 600, fontSize: 14, cursor: "pointer", marginRight: "auto" }}>Delete</button>
                    )}
                    <button onClick={() => setShowTestModal(false)} style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", border: "1px solid #E2E8F0", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => {
                      const name = document.getElementById("test-name").value;
                      const category = document.getElementById("test-cat").value;
                      const turnaround = document.getElementById("test-tat").value;
                      const price = parseInt(document.getElementById("test-price").value) || 0;
                      
                      const newTest = {
                        id: editingTest ? editingTest.id : "TEST-" + Math.floor(Math.random()*9000+1000),
                        name, category, turnaround, price
                      };
                      
                      let newCatalog = [...catalog];
                      if (editingTest) {
                        newCatalog = newCatalog.map(m => m.id === editingTest.id ? newTest : m);
                      } else {
                        newCatalog.push(newTest);
                      }
                      
                      saveCatalog(newCatalog);
                    }} style={{ padding: "12px 24px", borderRadius: 12, background: PRIMARY, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Save Test</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
