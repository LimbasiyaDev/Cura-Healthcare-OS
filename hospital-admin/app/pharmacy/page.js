"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, Pill, FileText, Settings, LogOut, Bell, Search, 
  RefreshCw, Activity, LayoutGrid, CheckCircle2, ChevronRight,
  TrendingUp, Download, Filter, Package, ShieldCheck, AlertTriangle, ChevronLeft, Clock
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Constants
const DARK_GREEN = "#063A29"; // Updated to match image 2 sidebar
const LIGHT_GREEN = "#B4F1D5";
const RED_ALERT = "#FEF2F2";
const RED_TEXT = "#991B1B";
const BG_COLOR = "#FAFAFA";

const MOCK_INVENTORY = [
  { id: "SKU-9921", name: "Amoxicillin 500mg", desc: "Oral Capsule • 30ct Bottle", category: "Antibiotics", stock: 1250, cap: 92, status: "IN STOCK" },
  { id: "SKU-1082", name: "Lisinopril 10mg", desc: "Oral Tablet • 90ct Bottle", category: "Cardiovascular", stock: 45, cap: 12, status: "LOW STOCK" },
  { id: "SKU-4401", name: "Metformin 1000mg", desc: "Extended Release • 60ct", category: "Antidiabetic", stock: 0, cap: 0, status: "OUT OF STOCK" },
  { id: "SKU-2273", name: "Atorvastatin 20mg", desc: "Statin • 30ct Bottle", category: "Cardiovascular", stock: 840, cap: 85, status: "IN STOCK" },
  { id: "SKU-3151", name: "Omeprazole 40mg", desc: "Capsule • 28ct Box", category: "Gastrointestinal", stock: 120, cap: 32, status: "IN STOCK" },
];

const MOCK_QUEUE = [
  { patient: "Sarah Jenkins", id: "#PX-9921", med: "Metformin 500mg", prescriber: "Dr. Aris Thorne", status: "Preparing", time: "09:42 AM", color: "#10B981" },
  { patient: "Marcus Vane", id: "#PX-9844", med: "Atorvastatin 20mg", prescriber: "Dr. Elena Kostic", status: "Awaiting Pickup", time: "09:30 AM", color: "#94A3B8" },
  { patient: "Linda Zhao", id: "#PX-9821", med: "Lisinopril 10mg", prescriber: "Dr. Aris Thorne", status: "Pending Approval", time: "09:15 AM", color: "#EF4444" },
];

export default function PharmacyDashboard() {
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState(MOCK_INVENTORY);
  const [inventoryId, setInventoryId] = useState(null);
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  
  const [liveQueue, setLiveQueue] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    let isRedirecting = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { isRedirecting = true; router.push("/login"); return; }
      
      const { data: pharm, error: pErr } = await supabase.from("pharmacies").select("*").eq("user_id", user.id).single();
      if (!pharm || pErr) { isRedirecting = true; router.push("/login"); return; }
      
      setPharmacy(pharm);

      const { data: rxList, error: rxErr } = await supabase
        .from("prescriptions")
        .select("*, doctors(name)")
        .ilike("notes", `%[PHARMACY: ${pharm.id}]%`)
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
        setLiveQueue(rxList.map(rx => ({ ...rx, patient_uid: uidMap[rx.patient_phone] || null })));
      }

      const { data: invData, error: invErr } = await supabase
        .from("prescriptions")
        .select("id, medicines")
        .ilike("notes", `%[INVENTORY: ${pharm.id}]%`)
        .limit(1);

      if (!invErr && invData && invData.length > 0) {
        setInventory(invData[0].medicines || []);
        setInventoryId(invData[0].id);
      } else {
        const payload = {
          patient_name: "INVENTORY",
          diagnosis: "INVENTORY",
          status: "inventory",
          notes: `[INVENTORY: ${pharm.id}]`,
          medicines: MOCK_INVENTORY
        };
        const { data: newInv } = await supabase.from("prescriptions").insert(payload).select("id, medicines").single();
        if (newInv) {
          setInventory(newInv.medicines || []);
          setInventoryId(newInv.id);
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

  const saveInventory = async (newInventory) => {
    setInventory(newInventory);
    setShowMedModal(false);
    if (inventoryId) {
      await supabase.from("prescriptions").update({ medicines: newInventory }).eq("id", inventoryId);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("pharmacies").update({
        location: pharmacy.location,
        lead_pharmacist: pharmacy.lead_pharmacist
      }).eq("id", pharmacy.id);
      
      if (error) throw error;
      alert("Settings saved successfully!");
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, background: DARK_GREEN }}>
        <motion.div animate={{ scale: [1,1.07,1] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ width: 80, height: 80, borderRadius: 24, background: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 48px rgba(0,0,0,0.3)" }}>
          <Store size={36} color={DARK_GREEN} />
        </motion.div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Syncing Pharmacy Node</p>
      </div>
    );
  }

  if (!pharmacy) return null;

  const NAV_ITEMS = [
    { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
    { id: "prescriptions", icon: FileText, label: "E-Prescriptions" },
    { id: "inventory", icon: Pill, label: "Inventory" }
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: BG_COLOR, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* SIDEBAR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ width: 280, background: DARK_GREEN, color: "white", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        
        <div style={{ padding: "40px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Store size={20} color={LIGHT_GREEN} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 17, margin: 0, color: "white", letterSpacing: "-0.02em" }}>Cura Health</h2>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", margin: "2px 0 0" }}>Pharmacy Node</p>
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, padding: "0 16px" }}>
          {NAV_ITEMS.map(nav => {
            const active = activeNav === nav.id;
            return (
              <button key={nav.id} onClick={() => setActiveNav(nav.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 12,
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  color: active ? LIGHT_GREEN : "rgba(255,255,255,0.65)",
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                  fontWeight: 600, fontSize: 14, width: "100%", textAlign: "left"
                }}>
                <nav.icon size={18} color={active ? LIGHT_GREEN : "rgba(255,255,255,0.5)"} />
                {nav.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "24px" }}>
          <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 16, padding: "16px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: LIGHT_GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: DARK_GREEN, fontSize: 14 }}>
                {pharmacy.name?.[0] || "P"}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pharmacy.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pharmacy.license_id}</p>
              </div>
            </div>
            <button onClick={handleSignOut} style={{ width: "100%", marginTop: 16, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
          
          <button onClick={() => setActiveNav("settings")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "transparent", color: "rgba(255,255,255,0.6)", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <Settings size={18} /> Settings
          </button>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {pharmacy?.verification_status === 'pending' && (
          <div style={{ background: "#FEF3C7", borderBottom: "1px solid #FDE68A", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={18} color="#D97706" />
            <p style={{ margin: 0, fontSize: 13, color: "#92400E", fontWeight: 700 }}>Your account is under 24-hour review. Some features may be limited.</p>
          </div>
        )}
        
        {/* TOP BAR */}
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", borderBottom: activeNav === "inventory" ? "1px solid #E2E8F0" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#64748B", textTransform: "uppercase" }}>Live Network Sync</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, maxWidth: 600, margin: "0 40px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={activeNav === "inventory" ? "Search medication catalog..." : "Search prescriptions, patients, or inventory..."}
                style={{ width: "100%", padding: "14px 20px 14px 44px", borderRadius: 999, border: "1px solid #E2E8F0", background: "white", fontSize: 14, color: "#0F172A", outline: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => fetchData(true)} style={{ width: 40, height: 40, borderRadius: "50%", background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", cursor: "pointer" }}>
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw size={18} />
              </motion.div>
            </button>
            <div style={{ position: "relative", cursor: "pointer", color: "#64748B", marginRight: 16 }}>
              <Bell size={18} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, background: "#EF4444", borderRadius: "50%", border: "2px solid #FAFAFA" }} />
            </div>
            
            {activeNav === "inventory" ? (
              <button onClick={() => { setEditingMed(null); setShowMedModal(true); }} style={{ padding: "12px 24px", borderRadius: 999, background: DARK_GREEN, color: "white", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>+</div>
                Add Medication
              </button>
            ) : (
              <button style={{ padding: "12px 24px", borderRadius: 999, background: DARK_GREEN, color: "white", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>+</div>
                New Entry
              </button>
            )}
          </div>
        </div>

        {/* SCROLLABLE PAGE CONTENT */}
        <div style={{ flex: 1, padding: "20px 40px 60px", overflowY: "auto" }}>
          
          {/* ──────────────────────────────────────────────────────────── */}
          {/* DASHBOARD TAB (Matches Image 2) */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeNav === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontWeight: 700, fontSize: 32, color: "#0F172A", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Dashboard</h1>
                <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>Manage your facility&apos;s digital prescription workflow and clinical inventory.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, marginBottom: 24 }}>
                
                {/* Fulfillment Analytics */}
                <div style={{ background: "white", padding: 32, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#0F172A" }}>Fulfillment Analytics</h3>
                        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>7-day prescription volume</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 999, padding: 4 }}>
                      <button style={{ padding: "6px 16px", borderRadius: 999, border: "none", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", fontSize: 11, fontWeight: 700, color: "#0F172A" }}>WEEKLY</button>
                      <button style={{ padding: "6px 16px", borderRadius: 999, border: "none", background: "transparent", fontSize: 11, fontWeight: 700, color: "#64748B" }}>MONTHLY</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "0 20px" }}>
                    {[35, 75, 55, 95, 60, 45, 30].map((h, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <div style={{ width: "100%", height: "100%", background: "#F1F5F9", borderRadius: 12, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 1, delay: i * 0.1 }} 
                            style={{ width: "100%", background: i === 3 ? DARK_GREEN : LIGHT_GREEN, borderRadius: 12 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: i === 3 ? "#0F172A" : "#94A3B8" }}>{["MON","TUE","WED","THU","FRI","SAT","SUN"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Alerts */}
                <div style={{ background: "white", padding: 32, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: RED_ALERT, display: "flex", alignItems: "center", justifyContent: "center", color: RED_TEXT }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#0F172A" }}>Critical Alerts</h3>
                      <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>Action required immediately</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    <div style={{ padding: 20, borderRadius: 16, background: RED_ALERT, border: "1px solid #FECACA" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: RED_TEXT }}>Metformin 1000mg</span>
                      </div>
                      <p style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: RED_TEXT, lineHeight: 1.5 }}>Currently <strong>OUT OF STOCK</strong> across the facility node.</p>
                    </div>
                    <div style={{ padding: 20, borderRadius: 16, background: "#FEF2F2", opacity: 0.9 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>Lisinopril 10mg</span>
                      </div>
                      <p style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#64748B", lineHeight: 1.5 }}><strong>LOW ON STOCK</strong> (45 remaining).<br/>Estimated depletion: 18 hours.</p>
                    </div>
                    <div style={{ padding: 20, borderRadius: 16, background: "#F1F5F9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#94A3B8" }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>Amoxicillin Syrup</span>
                      </div>
                      <p style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>Stock replenishment scheduled for 09:00 AM tomorrow.</p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>View All Inventory Alerts</span>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: DARK_GREEN, color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Cards & Network row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
                <div style={{ background: "white", padding: 32, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#64748B", textTransform: "uppercase" }}>Total Prescriptions</p>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 36, color: "#0F172A" }}>{liveQueue.length}</h2>
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#10B981", fontWeight: 600 }}>Real-time sync</p>
                  </div>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                    <FileText size={28} />
                  </div>
                </div>

                <div style={{ background: "white", padding: 32, borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#64748B", textTransform: "uppercase" }}>Queue Efficiency</p>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 36, color: "#0F172A" }}>4.2m</h2>
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#10B981", fontWeight: 600 }}>Average prep time</p>
                  </div>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                    <Clock size={28} />
                  </div>
                </div>

                <div style={{ background: DARK_GREEN, padding: 32, borderRadius: 24, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -20, right: -20, opacity: 0.1 }}>
                    <Activity size={160} color="white" />
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "white" }}>Hospital Network</p>
                  <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, maxWidth: 200 }}>Connected to 4 regional medical centers via secure sync.</p>
                  <button style={{ padding: "8px 20px", borderRadius: 8, background: LIGHT_GREEN, color: DARK_GREEN, border: "none", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer" }}>Manage Sync</button>
                </div>
              </div>

              {/* Live Prescription Queue */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#0F172A" }}>Live Prescription Queue</h2>
                <button style={{ background: "none", border: "none", fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  View full queue <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ background: "white", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr 1fr", padding: "16px 32px", background: "#F8FAFC", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B" }}>
                  <span>Patient Name</span>
                  <span>Medication</span>
                  <span>Prescriber</span>
                  <span>Status</span>
                  <span style={{ textAlign: "right" }}>Time In</span>
                </div>
                
                {liveQueue.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
                    No pending prescriptions in the queue.
                  </div>
                ) : (
                  liveQueue.slice(0, 5).map((rx, i) => (
                    <div key={rx.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr 1fr", padding: "20px 32px", borderBottom: i === liveQueue.length - 1 ? "none" : "1px solid #F1F5F9", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#0F172A" }}>
                          {rx.patient_name || "Unknown Patient"} {rx.patient_uid && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 800 }}>#{rx.patient_uid}</span>}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>ID: {rx.id?.split("-")[0].toUpperCase()}</p>
                      </div>
                      <div>
                        <span style={{ background: "#F1F5F9", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "#334155" }}>
                          {rx.medicines?.[0]?.name || "Multiple"} {rx.medicines?.[0]?.dosage || ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        Dr. {rx.doctors?.name || "Unknown"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: rx.status === "active" ? "#10B981" : "#94A3B8" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: rx.status === "active" ? "#10B981" : "#94A3B8", textTransform: "capitalize" }}>{rx.status}</span>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                        {new Date(rx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* PRESCRIPTIONS TAB */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeNav === "prescriptions" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontWeight: 700, fontSize: 32, color: "#0F172A", margin: "0 0 8px", letterSpacing: "-0.03em" }}>E-Prescriptions</h1>
                <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>View and process all incoming digital prescriptions assigned to your pharmacy.</p>
              </div>

              <div style={{ background: "white", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr 1fr", padding: "16px 32px", background: "#F8FAFC", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B" }}>
                  <span>Patient Name</span>
                  <span>Medication</span>
                  <span>Prescriber</span>
                  <span>Status</span>
                  <span style={{ textAlign: "right" }}>Time In</span>
                </div>
                
                {liveQueue.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: 14 }}>
                    No pending prescriptions in the queue.
                  </div>
                ) : (
                  liveQueue.map((rx, i) => (
                    <div key={rx.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1.5fr 1fr 1fr", padding: "20px 32px", borderBottom: i === liveQueue.length - 1 ? "none" : "1px solid #F1F5F9", alignItems: "center" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#0F172A" }}>
                          {rx.patient_name || "Unknown Patient"} {rx.patient_uid && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 800 }}>#{rx.patient_uid}</span>}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748B" }}>ID: {rx.id?.split("-")[0].toUpperCase()}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94A3B8" }}>Age: {rx.patient_age || "—"} | {rx.patient_phone || "—"}</p>
                      </div>
                      <div>
                        {rx.medicines?.map((m, idx) => (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            <span style={{ background: "#F1F5F9", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#334155" }}>
                              {m.name} {m.dosage} ({m.quantity})
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        Dr. {rx.doctors?.name || "Unknown"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: rx.status === "active" ? "#10B981" : "#94A3B8" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: rx.status === "active" ? "#10B981" : "#94A3B8", textTransform: "capitalize" }}>{rx.status}</span>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                        {new Date(rx.created_at).toLocaleDateString()} <br />
                        <span style={{ fontSize: 11, color: "#64748B" }}>{new Date(rx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* INVENTORY TAB (Matches Image 1) */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeNav === "inventory" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontWeight: 700, fontSize: 18, color: "#0F172A", margin: "0 0 6px" }}>Pharmacy Inventory</h1>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Advanced real-time digital prescription workflow and facility medication command center.</p>
              </div>

              {/* Stat Cards (Image 1 style) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 40 }}>
                {[
                  { label: "Total Stock Value", val: "$1.2M", extra: "+2.4%", color: DARK_GREEN, icon: Package },
                  { label: "Low Stock Alerts", val: inventory.filter(i => i.status === "LOW STOCK" || i.status === "OUT OF STOCK").length + " SKU", extra: "CRITICAL", color: "#EF4444", icon: AlertTriangle, extraBg: "#FEF2F2", extraColor: "#EF4444" },
                  { label: "Incoming Shipments", val: "04 Today", extra: "", color: "#451A03", icon: Store },
                  { label: "Active Prescriptions", val: liveQueue.length.toString(), extra: "Live Sync", color: DARK_GREEN, icon: FileText }
                ].map((s, i) => (
                  <div key={i} style={{ background: "white", padding: "24px", borderRadius: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", borderLeft: `4px solid ${s.color}`, display: "flex", flexDirection: "column", justifyContent: "space-between", height: 140 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                        <s.icon size={18} />
                      </div>
                      {s.extra && (
                         <span style={{ fontSize: 10, fontWeight: 700, color: s.extraColor || "#10B981", background: s.extraBg || "transparent", padding: s.extraBg ? "4px 8px" : 0, borderRadius: 4 }}>{s.extra}</span>
                      )}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#64748B", textTransform: "uppercase" }}>{s.label}</p>
                      <h2 style={{ margin: 0, fontWeight: 600, fontSize: 18, color: "#0F172A" }}>{s.val}</h2>
                    </div>
                  </div>
                ))}
              </div>

              {/* Master Inventory List */}
              <div style={{ background: "white", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Master Inventory List</h2>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>2,481 entries</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid #E2E8F0", color: "#0F172A", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><Filter size={14}/> Filter</button>
                    <button style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid #E2E8F0", color: "#0F172A", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><Download size={14}/> Export</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 2fr 1fr", padding: "16px 32px", background: "#F8FAFC", fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748B" }}>
                  <span>SKU Code</span>
                  <span>Medication Entity</span>
                  <span>Therapeutic Class</span>
                  <span>Volume Dynamics</span>
                  <span>System Status</span>
                </div>
                
                {inventory.map((item, i) => (
                  <div key={item.id} onClick={() => { setEditingMed(item); setShowMedModal(true); }} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 2fr 1fr", padding: "20px 32px", borderBottom: "1px solid #F1F5F9", alignItems: "center", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>{item.id}</div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: item.status === "OUT OF STOCK" ? "#FEF2F2" : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: item.status === "OUT OF STOCK" ? "#EF4444" : "#10B981" }}>
                        <Pill size={16} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{item.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94A3B8" }}>{item.desc}</p>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 13, color: "#475569" }}>{item.category}</div>
                    
                    <div style={{ paddingRight: 40 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: item.stock === 0 ? "#EF4444" : "#0F172A" }}>{item.stock} units</span>
                        <span style={{ fontSize: 10, color: "#94A3B8" }}>Capacity: {item.cap}%</span>
                      </div>
                      <div style={{ height: 4, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.cap}%`, background: item.status === "OUT OF STOCK" ? "#EF4444" : item.status === "LOW STOCK" ? "#451A03" : "#10B981", borderRadius: 2 }} />
                      </div>
                    </div>
                    
                    <div>
                      {item.status === "IN STOCK" && <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, background: "#ECFDF5", color: "#10B981", textTransform: "uppercase" }}>IN<br/>STOCK</span>}
                      {item.status === "LOW STOCK" && <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, background: "#FEF2F2", color: "#991B1B", textTransform: "uppercase" }}>LOW<br/>STOCK</span>}
                      {item.status === "OUT OF STOCK" && <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, background: "#FEF2F2", color: "#EF4444", textTransform: "uppercase" }}>OUT<br/>OF<br/>STOCK</span>}
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", background: "#F8FAFC" }}>
                  <span style={{ fontSize: 12, color: "#64748B" }}>Showing <strong>1 - 5</strong> of 2,481 entries</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}><ChevronLeft size={16}/></button>
                    <button style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: DARK_GREEN, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>1</button>
                    <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer" }}>2</button>
                    <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer" }}>3</button>
                    <button style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B" }}><ChevronRight size={16}/></button>
                  </div>
                </div>
              </div>

              {/* Bottom Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40 }}>
                <div style={{ background: "white", padding: 40, borderRadius: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
                  <h3 style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Connect Supplier Node</h3>
                  <p style={{ margin: "0 0 32px", fontSize: 13, color: "#475569", lineHeight: 1.6, maxWidth: 300 }}>Integrate global pharma supply lines directly into your Clinical Command for instant automated restocking.</p>
                  <button style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>Link external provider <ChevronRight size={16} /></button>
                  <div style={{ position: "absolute", bottom: -20, right: -20, opacity: 0.1 }}>
                    <Activity size={180} />
                  </div>
                </div>
                
                <div style={{ background: DARK_GREEN, padding: 40, borderRadius: 32, position: "relative", overflow: "hidden", color: "white" }}>
                  <span style={{ display: "inline-block", padding: "6px 12px", background: LIGHT_GREEN, color: DARK_GREEN, fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 999, marginBottom: 24 }}>SECURITY BETA</span>
                  <h3 style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 16 }}>Blockchain Batch Registry</h3>
                  <p style={{ margin: "0 0 32px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 350 }}>Verifiable ledger tracking for controlled substances and high-value narcotics at the molecular level.</p>
                  <button style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>View Audit Log <ChevronRight size={16} /></button>
                </div>
              </div>

            </motion.div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* SETTINGS TAB (Preserved from earlier) */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeNav === "settings" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600 }}>
              <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 12px 32px rgba(0,0,0,0.03)", padding: 32 }}>
                <h2 style={{ margin: "0 0 24px", fontWeight: 700, fontSize: 20, color: "#0F172A" }}>Pharmacy Profile</h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>Pharmacy Name (Read Only)</label>
                    <input disabled value={pharmacy.name} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 14, color: "#94A3B8", outline: "none", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>License ID (Read Only)</label>
                    <input disabled value={pharmacy.license_id} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#F1F5F9", fontSize: 14, color: "#94A3B8", outline: "none", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>Primary Location</label>
                    <input value={pharmacy.location || ""} onChange={(e) => setPharmacy({...pharmacy, location: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", fontSize: 14, color: "#0F172A", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = DARK_GREEN} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: 8 }}>Lead Pharmacist</label>
                    <input value={pharmacy.lead_pharmacist || ""} onChange={(e) => setPharmacy({...pharmacy, lead_pharmacist: e.target.value})} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "white", fontSize: 14, color: "#0F172A", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = DARK_GREEN} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
                  </div>

                  <button onClick={handleSaveSettings} disabled={isSaving} style={{ marginTop: 12, width: "100%", padding: "16px", borderRadius: 12, background: DARK_GREEN, color: "white", border: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: isSaving ? "not-allowed" : "pointer" }}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* MEDICATION MODAL */}
          <AnimatePresence>
            {showMedModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: "white", borderRadius: 24, padding: 32, width: "100%", maxWidth: 500, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: "#0F172A" }}>{editingMed ? "Edit Medication" : "Add Medication"}</h2>
                    <button onClick={() => setShowMedModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#94A3B8" }}>×</button>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Medication Name</label>
                      <input id="med-name" defaultValue={editingMed?.name || ""} placeholder="e.g. Amoxicillin 500mg" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Description</label>
                      <input id="med-desc" defaultValue={editingMed?.desc || ""} placeholder="e.g. Oral Capsule • 30ct Bottle" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Category</label>
                        <input id="med-cat" defaultValue={editingMed?.category || ""} placeholder="e.g. Antibiotics" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Stock Units</label>
                        <input id="med-stock" type="number" defaultValue={editingMed?.stock || 0} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 14, outline: "none" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
                    {editingMed && (
                      <button onClick={() => {
                        if(confirm("Are you sure you want to delete this medication?")) {
                          saveInventory(inventory.filter(m => m.id !== editingMed.id));
                        }
                      }} style={{ padding: "12px 24px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", fontWeight: 600, fontSize: 14, cursor: "pointer", marginRight: "auto" }}>Delete</button>
                    )}
                    <button onClick={() => setShowMedModal(false)} style={{ padding: "12px 24px", borderRadius: 12, background: "transparent", border: "1px solid #E2E8F0", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => {
                      const name = document.getElementById("med-name").value;
                      const desc = document.getElementById("med-desc").value;
                      const category = document.getElementById("med-cat").value;
                      const stock = parseInt(document.getElementById("med-stock").value) || 0;
                      
                      const cap = Math.min(100, Math.round((stock / 1500) * 100));
                      const status = stock === 0 ? "OUT OF STOCK" : stock < 100 ? "LOW STOCK" : "IN STOCK";
                      
                      const newMed = {
                        id: editingMed ? editingMed.id : "SKU-" + Math.floor(Math.random()*9000+1000),
                        name, desc, category, stock, cap, status
                      };
                      
                      let newInventory = [...inventory];
                      if (editingMed) {
                        newInventory = newInventory.map(m => m.id === editingMed.id ? newMed : m);
                      } else {
                        newInventory.push(newMed);
                      }
                      
                      saveInventory(newInventory);
                    }} style={{ padding: "12px 24px", borderRadius: 12, background: DARK_GREEN, border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Save Medication</button>
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
