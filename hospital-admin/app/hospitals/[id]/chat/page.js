"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, MessageSquare, AlertTriangle, LayoutDashboard, Calendar,
  FileText, HelpCircle, LogOut, MoreVertical, Paperclip, User, Save, Activity,
  Droplet, ShieldPlus, TrendingUp, Moon, Heart, Clock, CheckCircle, Search, Bell, Download, RefreshCw, Plus, ChevronRight, Video, MapPin, X,
  Receipt, CreditCard
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const T = {
  primary:      "#0D3327",
  primaryLight: "#1A5C44",
  teal:         "#10B981",
  tealLight:    "#A7F3D0",
  blue:         "#0D3327",
  muted:        "#94A3B8",
  text:         "#0F172A",
  sub:          "#64748B",
  bg:           "#F4F8F5",
  border:       "#E2E8F0"
};

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || "http://localhost:4000";

// --- UI COMPONENTS FOR 3-COLUMN LAYOUT ---
const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
    background: active ? '#E0E7FF' : 'transparent',
    color: active ? T.primary : '#64748B',
    fontWeight: active ? 700 : 600, cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: "'Syne', sans-serif"
  }}>
    {icon} <span style={{ fontSize: 14 }}>{label}</span>
  </div>
);

const VitalCard = ({ label, value, unit, icon, onChange, isSelect, readOnly, unitBg, unitColor }) => (
  <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96, position: 'relative', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</span>
      <span style={{ color: T.teal }}>{icon}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        {isSelect ? (
          <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 20, fontWeight: 800, color: T.primary, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
            <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
          </select>
        ) : (
          <input type="text" readOnly={readOnly} value={value} onChange={e => onChange ? onChange(e.target.value) : null} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 20, fontWeight: 800, color: T.primary, outline: 'none' }} />
        )}
      </div>
      {unit && (
        <div style={{ display: 'inline-block', fontSize: 11, color: unitColor || T.sub, fontWeight: 700, background: unitBg || 'transparent', padding: unitBg ? '2px 8px' : '0px', borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 }}>
          {unit}
        </div>
      )}
    </div>
  </div>
);

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6 }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', color: T.text, boxSizing: 'border-box', transition: 'all 0.2s', background: '#F8FAFC' }}
      onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = '0 0 0 4px rgba(13,51,39,0.08)'; e.target.style.background = 'white'; }}
      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
    />
  </div>
);

/* ─── 6-Box OTP Input (same style as admin login) ──────────────────────────── */
const OTPBoxInput = ({ value, onChange, disabled }) => {
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
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "8px 0" }}>
      {[0,1,2,3,4,5].map((i) => {
        const filled = i < value.length;
        return (
          <input
            key={i}
            ref={el => (inputs.current[i] = el)}
            type="text" inputMode="numeric" maxLength={1}
            value={filled ? value[i] : ""}
            disabled={disabled}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKey(e, i)}
            onPaste={handlePaste}
            style={{
              width: 48, height: 56, textAlign: "center",
              fontSize: 22, fontWeight: 900, color: "#0F172A",
              background: filled ? "rgba(13,51,39,0.05)" : "#F8FAFC",
              border: `2px solid ${filled ? "rgba(13,51,39,0.25)" : "#E2E8F0"}`,
              borderRadius: 12, outline: "none",
              transition: "all 0.15s",
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "text",
              boxSizing: "border-box",
            }}
            onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = "0 0 0 4px rgba(13,51,39,0.10)"; e.target.style.background = "white"; }}
            onBlur={e => { e.target.style.borderColor = filled ? "rgba(13,51,39,0.25)" : "#E2E8F0"; e.target.style.boxShadow = "none"; e.target.style.background = filled ? "rgba(13,51,39,0.05)" : "#F8FAFC"; }}
          />
        );
      })}
    </div>
  );
};

export default function HospitalChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatEndRef = useRef(null);

  const [hospital, setHospital] = useState(null);
  const [loadingHosp, setLoadingHosp] = useState(true);

  // Portal active tab
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "messages" | "appointments" | "profile" | "permissions"
  const [apptFilter, setApptFilter] = useState("all");

  // Portal database states
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // New Consultation booking modal states
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Specialty, 2: Doctor, 3: Date & Details, 4: Success Screen
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [bookingType, setBookingType] = useState("Video Consultation");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Rescheduling states
  const [reschedulingApptId, setReschedulingApptId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");

  // Allergy & Condition interactive list states
  const [allergies, setAllergies] = useState(["Penicillin", "Peanuts", "Dust Mites"]);
  const [newAllergy, setNewAllergy] = useState("");
  const [chronicConditions, setChronicConditions] = useState(["Hypertension", "Type 2 Diabetes"]);
  const [newCondition, setNewCondition] = useState("");

  // Auth state
  const [authMode, setAuthMode] = useState("login");
  const [authStep, setAuthStep] = useState("input");
  const [contactInfo, setContactInfo] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const sessionRestoredRef = useRef(false);

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [waitingForBot, setWaitingForBot] = useState(false);

  // For managing button & list interactions
  const [activeInteractive, setActiveInteractive] = useState(null);

  // Chat header menu
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useRef(null);

  // Profile State
  const [profile, setProfile] = useState({
    name: "", height: "", weight: "", blood_group: "O+", bmi: "", emergency_contact: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("cura_access_token");
    const savedPhone = localStorage.getItem("cura_phone");
    if (savedToken && savedPhone) {
      sessionRestoredRef.current = true;
      // Restore persisted chat from localStorage
      try {
        const key = `cura_chat_${savedPhone}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            sessionRestoredRef.current = false; // skip initial Hi greeting — history already loaded
          }
        }
      } catch (_) {}
      setSessionStarted(true);
    }
  }, []);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    const phone = localStorage.getItem("cura_phone");
    if (!phone || messages.length === 0) return;
    const key = `cura_chat_${phone}`;
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  // Close chat menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Hospital details
  useEffect(() => {
    async function fetchHospital() {
      if (!params?.id) return;
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name, address")
        .eq("id", params.id)
        .single();
      if (data && !error) setHospital(data);
      setLoadingHosp(false);
    }
    fetchHospital();
  }, [params?.id]);

  // Fetch data (history, doctors) when session starts
  async function fetchHistory() {
    const token = localStorage.getItem("cura_access_token");
    const phone = localStorage.getItem("cura_phone");
    if (!token || !phone) return;
    setLoadingData(true);
    try {
      const res = await fetch(`${BOT_URL}/patient/history?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setAppointments(data.appointments || []);
        setPrescriptions(data.prescriptions || []);
        setInvoices(data.invoices || []);
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoadingData(false);
    }
  }

  async function fetchDoctorsList() {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_available", true);
      if (data && !error) {
        setDoctors(data);
      }
    } catch (e) {
      console.error("Failed to fetch doctors:", e);
    }
  }

  // Fetch Profile and other records when session starts
  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("cura_access_token");
      if (!token) return;
      try {
        const res = await fetch(`${BOT_URL}/patient/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok && data.profile) {
          setProfile({
            name: data.profile.name || "",
            height: data.profile.height || "",
            weight: data.profile.weight || "",
            blood_group: data.profile.blood_group || "O+",
            bmi: data.profile.bmi || "",
            emergency_contact: data.profile.emergency_contact || "",
            uid: data.profile.uid || ""
          });
        }
      } catch (e) { console.error(e); }
    }
    if (sessionStarted) {
      fetchProfile();
      fetchHistory();
      fetchDoctorsList();
    }
  }, [sessionStarted]);

  // Auto-refresh history and doctors every 30 seconds while session is active
  useEffect(() => {
    if (!sessionStarted) return;
    const id = setInterval(() => {
      fetchHistory();
      fetchDoctorsList();
    }, 30000);
    return () => clearInterval(id);
  }, [sessionStarted]);

  // 5. PRESCRIPTION DETAILS MODAL
  const renderPrescriptionModal = () => {
    if (!selectedPrescription) return null;
    const p = selectedPrescription;
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="scale-up" style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: 24, padding: 32, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
          <button onClick={() => setSelectedPrescription(null)} style={{ position: "absolute", top: 20, right: 20, background: "#F1F5F9", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub }}>
            <X size={18} />
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: T.blue }}>
              <FileText size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Medical Prescription</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: 14, color: T.sub, fontWeight: 500 }}>Dr. {p.doctors?.name || "Specialist"} · {p.doctors?.department || "Department"} · {p.created_at?.split("T")?.[0]}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {p.notes && (
              <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 13, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Doctor's Notes</h4>
                <p style={{ margin: 0, fontSize: 14, color: T.primary, lineHeight: 1.6 }}>{p.notes}</p>
              </div>
            )}

            {p.medicines && p.medicines.length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: T.primary, fontWeight: 800 }}>Prescribed Medicines</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.medicines.map((m, idx) => (
                    <div key={idx} style={{ padding: 16, borderRadius: 16, background: "white", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.primary }}>{m.name}</h5>
                        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: T.sub }}>{m.instructions || "Follow doctor's schedule"}</p>
                      </div>
                      <div style={{ background: "#F1F5F9", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.primary }}>
                        {m.schedule && typeof m.schedule === 'object' ? 
                          ['morning','afternoon','evening','night'].filter(k => m.schedule[k]).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(" - ")
                          : "Regularly"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.tests && p.tests.length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: T.primary, fontWeight: 800 }}>Diagnostic Lab Tests</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {p.tests.map((t, idx) => (
                    <div key={idx} style={{ background: "#FEF2F2", padding: "10px 16px", borderRadius: 12, border: "1px solid #FEE2E2", fontSize: 13, fontWeight: 700, color: "#991B1B", display: "flex", alignItems: "center", gap: 8 }}>
                      <Activity size={16} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 5.5 INVOICE DETAILS MODAL
  const renderInvoiceModal = () => {
    if (!selectedInvoice) return null;
    const inv = selectedInvoice;
    const isPaid = inv.payment_status === "Paid" || inv.payment_status === "paid";
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="scale-up" style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: 24, padding: 32, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
          <button onClick={() => setSelectedInvoice(null)} style={{ position: "absolute", top: 20, right: 20, background: "#F1F5F9", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub }}>
            <X size={18} />
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: isPaid ? "#D1FAE5" : "#FFE4E6", display: "flex", alignItems: "center", justifyContent: "center", color: isPaid ? "#065F46" : "#E11D48" }}>
              <Receipt size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Invoice Details</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: 14, color: T.sub, fontWeight: 500 }}>
                Invoice #{inv.invoice_num} · Dr. {inv.doctors?.name || "Specialist"} · {inv.created_at?.split("T")?.[0]}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Billing Facility</span>
                <span style={{ fontSize: 13, color: T.primary, fontWeight: 700 }}>{inv.facility || "Hospital Clinic"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Payment Status</span>
                <span style={{ fontSize: 11, background: isPaid ? "#D1FAE5" : "#FEF3C7", color: isPaid ? "#065F46" : "#D97706", padding: "4px 8px", borderRadius: 8, fontWeight: 700, textTransform: "capitalize" }}>
                  {inv.payment_status || "Pending"}
                </span>
              </div>
              {inv.visit_date && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Visit Date</span>
                  <span style={{ fontSize: 13, color: T.primary, fontWeight: 700 }}>{inv.visit_date}</span>
                </div>
              )}
              {inv.due_date && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Due Date</span>
                  <span style={{ fontSize: 13, color: T.primary, fontWeight: 700 }}>{inv.due_date}</span>
                </div>
              )}
            </div>

            <div>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: T.primary, fontWeight: 800 }}>Invoice Items</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {inv.items && inv.items.length > 0 ? (
                  inv.items.map((item, idx) => (
                    <div key={idx} style={{ padding: 14, borderRadius: 12, background: "white", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.primary }}>{item.desc}</h5>
                        {item.category && <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.sub }}>{item.category}</p>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>
                          ₹{(Number(item.price) * Number(item.qty)).toFixed(2)}
                        </span>
                        <p style={{ margin: 0, fontSize: 10, color: T.sub }}>
                          ₹{Number(item.price).toFixed(2)} × {item.qty}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: T.sub }}>No items listed.</p>
                )}
              </div>
            </div>

            <div style={{ background: "#F8FAFC", padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.sub }}>
                <span>Subtotal</span>
                <span>₹{Number(inv.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(inv.tax || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.sub }}>
                  <span>Tax / GST</span>
                  <span>₹{Number(inv.tax).toFixed(2)}</span>
                </div>
              )}
              {Number(inv.insurance_adj || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#10B981", fontWeight: 600 }}>
                  <span>Insurance Adjustment</span>
                  <span>-₹{Number(inv.insurance_adj).toFixed(2)}</span>
                </div>
              )}
              {Number(inv.discount || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#10B981", fontWeight: 600 }}>
                  <span>Discount</span>
                  <span>-₹{Number(inv.discount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ height: 1, background: "#E2E8F0", margin: "4px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: T.primary }}>
                <span>Total Due</span>
                <span>₹{Number(inv.total || 0).toFixed(2)}</span>
              </div>
            </div>

            {inv.notes && (
              <div style={{ background: "#FFFBEB", padding: 16, borderRadius: 16, border: "1px solid #FEF3C7" }}>
                <h4 style={{ margin: "0 0 6px 0", fontSize: 11, color: "#B45309", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Invoice Notes</h4>
                <p style={{ margin: 0, fontSize: 13, color: "#78350F", lineHeight: 1.5 }}>{inv.notes}</p>
              </div>
            )}

            {!isPaid && (
              <a 
                href={`${BOT_URL}/pay/${inv.invoice_num}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ textDecoration: "none", width: "100%" }}
              >
                <button style={{ width: "100%", background: T.teal, color: "white", padding: "14px 20px", borderRadius: 14, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <CreditCard size={18} /> Proceed to Pay ₹{Number(inv.total).toFixed(2)}
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Real-time Appointment Updates (Websocket)
  useEffect(() => {
    if (!sessionStarted) return;
    const phone = localStorage.getItem("cura_phone");
    if (!phone) return;
    
    const formattedPhone = `web_${phone}`;
    
    const channel = supabase
      .channel('patient_appointments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `phone=eq.${formattedPhone}`
        },
        (payload) => {
          showToast(`Your appointment on ${payload.new.date} at ${payload.new.slot} is now ${payload.new.status}.`);
          fetchHistory(); // Refresh the appointments list instantly
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionStarted]);

  // Helper to determine BMI category and colors
  const getBmiStatus = (bmiStr) => {
    const bmi = parseFloat(bmiStr);
    if (isNaN(bmi) || bmi <= 0) return { text: "No Data", bg: "#F1F5F9", color: "#64748B" };
    if (bmi < 18.5) return { text: "Underweight", bg: "#DBEAFE", color: "#1E40AF" };
    if (bmi < 25) return { text: "Healthy", bg: "#D1FAE5", color: "#065F46" };
    if (bmi < 30) return { text: "Overweight", bg: "#FEF3C7", color: "#92400E" };
    return { text: "Obese", bg: "#FEE2E2", color: "#991B1B" };
  };

  // Auto-calculate BMI when height or weight changes
  useEffect(() => {
    const h = parseFloat(profile.height);
    const w = parseFloat(profile.weight);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      const calculatedBmi = (w / (hM * hM)).toFixed(1);
      if (profile.bmi !== calculatedBmi) {
        setProfile(prev => ({ ...prev, bmi: calculatedBmi }));
      }
    } else if (profile.bmi !== "") {
      setProfile(prev => ({ ...prev, bmi: "" }));
    }
  }, [profile.height, profile.weight]);

  // When session is restored AND hospital is loaded, we no longer send the auto-greeting.
  // The user must manually type "Hi" to start.
  useEffect(() => {
    if (sessionRestoredRef.current && sessionStarted && hospital && messages.length === 0) {
      sessionRestoredRef.current = false;
    }
  }, [sessionStarted, hospital, messages.length]);

  // Handle auto logout on browser back
  useEffect(() => {
    if (!sessionStarted) return;

    // Push a dummy state so that there is a state to pop when user clicks "Back"
    window.history.pushState(null, null, window.location.href);

    const handlePopState = () => {
      handleLogout();
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [sessionStarted]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waitingForBot]);

  async function handleSendOtp(e) {
    e.preventDefault();
    if (authMode === "signup") {
      if (!name.trim()) return setAuthError("Please enter your full name.");
      if (password.length < 6) return setAuthError("Password must be at least 6 characters.");
      if (password !== confirmPassword) return setAuthError("Passwords do not match.");
    }
    if (!contactInfo.trim()) return setAuthError("Please enter a mobile number or email.");
    if (!password) return setAuthError("Please enter your password.");

    const isEmail = contactInfo.includes("@");
    let payload = { password };
    if (authMode === "signup") payload.name = name.trim();
    if (isEmail) payload.email = contactInfo.trim();
    else {
      const cleanPhone = contactInfo.replace(/\D/g, "");
      if (cleanPhone.length < 10) return setAuthError("Please enter a valid 10-digit mobile number or email.");
      payload.phone = cleanPhone;
    }

    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint = authMode === "signup" ? "/auth/signup-init" : "/auth/login-init";
      const res = await fetch(`${BOT_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) setAuthStep("otp");
      else setAuthError(data.error || "Failed to initialize verification.");
    } catch (err) { setAuthError("Network error."); } finally { setAuthLoading(false); }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp || otp.length < 6) return setAuthError("Please enter a valid 6-digit OTP.");

    const isEmail = contactInfo.includes("@");
    let payload = { token: otp, authMode };
    if (authMode === "signup") payload.name = name.trim();
    if (isEmail) payload.email = contactInfo.trim();
    else payload.phone = contactInfo.replace(/\D/g, "");

    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch(`${BOT_URL}/auth/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("cura_access_token", data.accessToken);
        const userPhone = data.phone || data.email || "unknown";
        localStorage.setItem("cura_phone", userPhone);
        setSessionStarted(true);
      } else setAuthError(data.error || "Invalid OTP.");
    } catch (err) { setAuthError("Network error."); } finally { setAuthLoading(false); }
  }

  async function handleSendResetOtp(e) {
    e.preventDefault();
    if (!contactInfo.trim()) return setAuthError("Please enter a mobile number or email.");

    const isEmail = contactInfo.includes("@");
    let payload = {};
    if (isEmail) payload.email = contactInfo.trim();
    else {
      const cleanPhone = contactInfo.replace(/\D/g, "");
      if (cleanPhone.length < 10) return setAuthError("Please enter a valid 10-digit mobile number or email.");
      payload.phone = cleanPhone;
    }

    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch(`${BOT_URL}/auth/reset-init`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) setAuthStep("otp");
      else setAuthError(data.error || "Failed to initialize password reset.");
    } catch (err) { setAuthError("Network error."); } finally { setAuthLoading(false); }
  }

  async function handleVerifyResetOtp(e) {
    e.preventDefault();
    if (!otp || otp.length < 6) return setAuthError("Please enter a valid 6-digit OTP.");
    if (password.length < 6) return setAuthError("New password must be at least 6 characters.");
    if (password !== confirmPassword) return setAuthError("Passwords do not match.");

    const isEmail = contactInfo.includes("@");
    let payload = { token: otp, newPassword: password };
    if (isEmail) payload.email = contactInfo.trim();
    else payload.phone = contactInfo.replace(/\D/g, "");

    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch(`${BOT_URL}/auth/reset-verify`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        alert("Password reset successfully! Please log in with your new password.");
        setAuthMode("login");
        setAuthStep("input");
        setOtp("");
        setPassword("");
        setConfirmPassword("");
      } else setAuthError(data.error || "Invalid OTP.");
    } catch (err) { setAuthError("Network error."); } finally { setAuthLoading(false); }
  }

  async function saveProfile() {
    setSavingProfile(true);
    const token = localStorage.getItem("cura_access_token");
    try {
      const res = await fetch(`${BOT_URL}/patient/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.error === "Invalid token" || res.status === 401) {
          alert("Your session has expired. Please log in again.");
          handleLogout();
        } else {
          alert("Failed to save: " + data.error);
        }
      } else {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    } catch (e) { console.error(e); alert("Network error saving profile"); }
    setSavingProfile(false);
  }

  // Helper to parse time strings like "10:30 AM" or "18:00" to [hours, minutes]
  const parseTimeStr = (str, defH, defM) => {
    if (!str) return [defH, defM];
    const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!m) return [defH, defM];
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ampm = m[3]?.toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return [h, min];
  };

  // Dynamic Slot Generator synced with Doctor's actual working hours & slot duration
  const generateDoctorSlots = (doc) => {
    if (!doc) return [];
    const dur = doc.slot_duration || 20; 
    
    let startH = 9, startM = 0, endH = 17, endM = 0;
    if (doc.working_hours) {
      const parts = doc.working_hours.split(/\s*-\s*/);
      if (parts.length === 2) {
        [startH, startM] = parseTimeStr(parts[0], 9, 0);
        [endH, endM]     = parseTimeStr(parts[1], 17, 0);
      }
    }

    const slots = [];
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date();
    end.setHours(endH, endM, 0, 0);
    if (end <= current) end.setDate(end.getDate() + 1); // handle overnight shifts just in case
    
    while (current < end) {
      slots.push(current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
      current.setMinutes(current.getMinutes() + dur);
    }
    return slots;
  };

  async function sendToBot(userPhone, textToSend, optionId = null) {
    setWaitingForBot(true);
    if (optionId === null) {
      setMessages(prev => [...prev, { sender: "user", type: "text", body: textToSend }]);
    }
    try {
      const res = await fetch(`${BOT_URL}/api/web-chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `web_${userPhone}`, message: optionId || textToSend, hospitalId: params.id })
      });
      const data = await res.json();
      if (data.success && data.replies) {
        const newReplies = data.replies.map(r => ({
          sender: "bot", type: r.type, body: r.body, buttons: r.buttons || null, sections: r.sections || null
        }));
        setMessages(prev => [...prev, ...newReplies]);
        const lastReply = newReplies[newReplies.length - 1];
        if (lastReply && (lastReply.type === "buttons" || lastReply.type === "list")) setActiveInteractive(lastReply);
        else setActiveInteractive(null);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", type: "error", body: "⚠️ Connection to virtual assistant lost." }]);
    } finally { setWaitingForBot(false); }
  }

  function handleSendText(e) {
    e.preventDefault();
    if (!inputText.trim() || waitingForBot) return;
    const text = inputText;
    setInputText("");
    const storedPhone = localStorage.getItem("cura_phone") || "";
    sendToBot(storedPhone, text);
  }

  function handleInteractiveSelect(title, id) {
    const storedPhone = localStorage.getItem("cura_phone") || "";
    sendToBot(storedPhone, title, id);
    setMessages(prev => [...prev, { sender: "user", type: "text", body: title }]);
    setActiveInteractive(null);
  }

  function handleLogout() {
    // Do NOT clear chat on logout — messages persist until user explicitly clears them
    localStorage.removeItem("cura_access_token");
    localStorage.removeItem("cura_phone");
    setSessionStarted(false);
    setMessages([]);
  }

  function handleClearChat() {
    const phone = localStorage.getItem("cura_phone");
    if (phone) localStorage.removeItem(`cura_chat_${phone}`);
    setMessages([]);
    setShowChatMenu(false);
  }

  // Helper: render markdown text as formatted React nodes
  function renderFormattedText(text) {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, li) => {
      // Strip the slot_ prefix from time slots
      line = line.replace(/\bslot_/g, "");
      // Parse inline: *bold*, _italic_
      const parts = [];
      let remaining = line;
      let key = 0;
      while (remaining.length > 0) {
        const boldIdx = remaining.indexOf("*");
        const italicIdx = remaining.indexOf("_");
        let next = -1;
        let type = null;
        if (boldIdx !== -1 && (italicIdx === -1 || boldIdx < italicIdx)) { next = boldIdx; type = "bold"; }
        else if (italicIdx !== -1) { next = italicIdx; type = "italic"; }
        if (next === -1) { parts.push(<span key={key++}>{remaining}</span>); break; }
        const delimiter = type === "bold" ? "*" : "_";
        const closeIdx = remaining.indexOf(delimiter, next + 1);
        if (closeIdx === -1) { parts.push(<span key={key++}>{remaining}</span>); break; }
        if (next > 0) parts.push(<span key={key++}>{remaining.slice(0, next)}</span>);
        const inner = remaining.slice(next + 1, closeIdx);
        if (type === "bold") parts.push(<strong key={key++} style={{ fontWeight: 800 }}>{inner}</strong>);
        else parts.push(<em key={key++} style={{ fontStyle: "italic" }}>{inner}</em>);
        remaining = remaining.slice(closeIdx + 1);
      }
      return (
        <span key={li} style={{ display: "block", marginBottom: li < lines.length - 1 ? 2 : 0 }}>
          {parts}
        </span>
      );
    });
  }

  // Cancel Appointment Logic
  async function cancelAppointment(apptId) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", apptId);
      if (error) {
        alert("Failed to cancel appointment: " + error.message);
      } else {
        alert("Appointment cancelled successfully!");
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Submit Rescheduling Logic
  async function submitReschedule(apptId) {
    if (!rescheduleDate || !rescheduleSlot) {
      alert("Please select both a date and a slot.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update({ date: rescheduleDate, slot: rescheduleSlot })
        .eq("id", apptId)
        .select("*, doctors(name)")
        .single();
        
      if (error) {
        alert("Failed to reschedule: " + error.message);
      } else {
        alert("Appointment rescheduled successfully!");
        setReschedulingApptId(null);
        fetchHistory();
        
        // Send email notification
        const storedPhone = localStorage.getItem("cura_phone");
        if (storedPhone && storedPhone.includes("@")) {
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: storedPhone,
                subject: "Your Appointment has been Rescheduled",
                html: `<h3>Appointment Rescheduled</h3>
                       <p>Hello ${data?.name || "Patient"},</p>
                       <p>You have successfully rescheduled your appointment with Dr. ${data?.doctors?.name || "our clinic"}.</p>
                       <p><strong>New Time:</strong> ${rescheduleSlot}</p>
                       <p><strong>New Date:</strong> ${rescheduleDate}</p>
                       <p>Thank you for using Cura!</p>`
              })
            });
          } catch (e) {
            console.error("Failed to send reschedule email", e);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Book Consultation Logic from Stepper
  async function handleBookConsultation(e) {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate || !bookingSlot) {
      alert("Please complete all booking selections.");
      return;
    }
    setBookingLoading(true);
    const phone = localStorage.getItem("cura_phone");
    const formattedPhone = `web_${phone}`;
    const isVideo = bookingType === "Video Consultation";
    const meetLink = isVideo ? `https://meet.jit.si/cura-${Math.random().toString(36).substring(2, 9)}` : null;

    try {
      const { error } = await supabase
        .from("appointments")
        .insert([{
          phone: formattedPhone,
          doctor_id: selectedDoctor.id,
          name: profile.name || "Self",
          date: bookingDate,
          slot: bookingSlot,
          reason: bookingReason || "General Checkup",
          status: "pending",
          hospital_id: hospital.id,
          consultation_type: isVideo ? "call" : "personal",
          meet_link: meetLink
        }]);

      if (error) {
        alert("Failed to book appointment: " + error.message);
      } else {
        setBookingStep(4); // Success screen
        fetchHistory();
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("Error booking consultation. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  // --- SUB-RENDERERS FOR TABS ---

  // 1. DASHBOARD TAB
  const renderDashboard = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const upcoming = appointments.filter(a => a.status !== "cancelled" && a.date >= todayStr).slice(0, 2);
    
    // Separate prescriptions and lab tests based on content
    const activePrescriptions = prescriptions.filter(p => p.medicines && p.medicines.length > 0).slice(0, 3);
    const activeLabTests = prescriptions.filter(p => p.tests && p.tests.length > 0).slice(0, 3);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "8px 12px", overflowY: "auto", flex: 1, maxHeight: "calc(100vh - 48px)", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: T.primary, margin: 0, fontFamily: "'Syne', sans-serif" }}>
              Welcome back, {profile.name || "Patient"}! {profile.uid && <span style={{ fontSize: 16, color: T.sub, fontWeight: 700 }}>#{profile.uid}</span>}
            </h2>
            <p style={{ margin: "4px 0 0 0", color: T.sub, fontSize: 13, fontWeight: 500 }}>
              Here&apos;s a quick overview of your health metrics and active consultations.
            </p>
          </div>
          <button onClick={() => { fetchHistory(); fetchDoctorsList(); }} style={{ background: "white", border: "1px solid #E2E8F0", padding: 10, borderRadius: 12, color: T.primary, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13 }}>
            <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Snap Widgets Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {/* Heart Rate Widget */}
          <div className="hover-lift" style={{ background: "white", padding: 20, borderRadius: 20, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(13,51,39,0.01)" }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Heart Rate</p>
              <h3 style={{ margin: "8px 0 4px 0", fontSize: 28, fontWeight: 900, color: T.primary, display: "flex", alignItems: "baseline", gap: 4 }}>
                72 <span style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>bpm</span>
              </h3>
              <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Normal Range</span>
            </div>
            <div style={{ color: "#EF4444", animation: "heartbeat 1.2s infinite ease-in-out" }}>
              <Heart size={38} fill="#EF4444" />
            </div>
          </div>

          {/* Activity/Steps Widget */}
          <div className="hover-lift" style={{ background: "white", padding: 20, borderRadius: 20, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(13,51,39,0.01)" }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Steps Count</p>
              <h3 style={{ margin: "8px 0 4px 0", fontSize: 28, fontWeight: 900, color: T.primary, display: "flex", alignItems: "baseline", gap: 4 }}>
                8,432 <span style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>steps</span>
              </h3>
              <span style={{ fontSize: 11, background: "#DBEAFE", color: "#1E40AF", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>84% of Daily Goal</span>
            </div>
            <div style={{ color: "#3B82F6" }}>
              <TrendingUp size={38} />
            </div>
          </div>

          {/* Sleep Widget */}
          <div className="hover-lift" style={{ background: "white", padding: 20, borderRadius: 20, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 12px rgba(13,51,39,0.01)" }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: T.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sleep Sleep</p>
              <h3 style={{ margin: "8px 0 4px 0", fontSize: 28, fontWeight: 900, color: T.primary, display: "flex", alignItems: "baseline", gap: 4 }}>
                7.8 <span style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>hrs</span>
              </h3>
              <span style={{ fontSize: 11, background: "#F3E8FF", color: "#6B21A8", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Excellent Quality</span>
            </div>
            <div style={{ color: "#8B5CF6" }}>
              <Moon size={38} fill="#8B5CF6" />
            </div>
          </div>
        </div>


        {/* Double Column Grid: Upcoming & Prescriptions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Upcoming Consultations */}
          <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Upcoming Consultations</h4>
              <button onClick={() => setActiveTab("appointments")} style={{ background: "transparent", border: "none", color: T.teal, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>View All</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcoming.length > 0 ? (
                upcoming.map(appt => {
                  const isVideo = appt.consultation_type === "call";
                  return (
                    <div key={appt.id} style={{ padding: 16, borderRadius: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.primary }}>Dr. {appt.doctors?.name || "Specialist"}</h5>
                          <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.sub, fontWeight: 600 }}>{appt.doctors?.department || "General Medicine"}</p>
                        </div>
                        <span style={{ fontSize: 11, background: appt.status === "confirmed" || appt.status === "booked" ? "#D1FAE5" : appt.status === "pending" ? "#FEF3C7" : appt.status === "cancelled" || appt.status === "rejected" ? "#FEE2E2" : "#FEF3C7", color: appt.status === "confirmed" || appt.status === "booked" ? "#065F46" : appt.status === "pending" ? "#D97706" : appt.status === "cancelled" || appt.status === "rejected" ? "#991B1B" : "#D97706", padding: "4px 8px", borderRadius: 10, fontWeight: 700, textTransform: "capitalize" }}>
                          {appt.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.text, fontWeight: 600 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={13} color={T.sub} /> {appt.date}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} color={T.sub} /> {appt.slot}</span>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        {isVideo && appt.meet_link && (
                          <a href={appt.meet_link} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none" }}>
                            <button style={{ width: "100%", background: T.teal, color: "white", padding: "8px 12px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <Video size={13} /> Join Consultation
                            </button>
                          </a>
                        )}
                        <button onClick={() => cancelAppointment(appt.id)} style={{ flex: isVideo ? 0.5 : 1, background: "white", color: "#EF4444", border: "1.5px solid #FCA5A5", padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textShadow: "none", background: "#F8FAFC", padding: 32, borderRadius: 16, textAlign: "center", border: "1px dashed #E2E8F0", color: T.sub, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Calendar size={28} color={T.muted} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No upcoming consultations found.</p>
                  <button onClick={() => { setIsConsultationModalOpen(true); setBookingStep(1); }} style={{ marginTop: 4, background: T.primary, color: "white", border: "none", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Book Consultation</button>
                </div>
              )}
            </div>
          </div>

          {/* Active Prescriptions */}
          <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Active Prescriptions</h4>
              <button onClick={() => setActiveTab("profile")} style={{ background: "transparent", border: "none", color: T.teal, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>View History</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activePrescriptions.length > 0 ? (
                activePrescriptions.map(pres => (
                  <div key={pres.id} className="hover-lift" style={{ padding: "14px 16px", borderRadius: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setSelectedPrescription(pres)}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: T.blue, flexShrink: 0 }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {pres.medicines?.map(m => m.name).join(", ") || "Medicines Prescribed"}
                        </h5>
                        <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.sub, fontWeight: 500 }}>Dr. {pres.doctors?.name || "Specialist"} · {pres.created_at?.split("T")?.[0]}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPrescription(pres)} style={{ background: "transparent", border: "none", color: T.teal, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                      <FileText size={16} />
                      <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>View</span>
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textShadow: "none", background: "#F8FAFC", padding: 32, borderRadius: 16, textAlign: "center", border: "1px dashed #E2E8F0", color: T.sub, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <FileText size={28} color={T.muted} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No active prescriptions.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lab Tests Section (Added below the double grid) */}
        {activeLabTests.length > 0 && (
          <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Diagnostic Lab Tests</h4>
              <button onClick={() => setActiveTab("profile")} style={{ background: "transparent", border: "none", color: T.teal, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>View History</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {activeLabTests.map(test => (
                <div key={test.id} className="hover-lift" style={{ padding: "16px", borderRadius: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "flex-start", gap: 16, cursor: "pointer" }} onClick={() => setSelectedPrescription(test)}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706", flexShrink: 0 }}>
                    <Activity size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.primary, lineHeight: 1.4 }}>
                      {test.tests?.join(", ") || "Lab Tests Requested"}
                    </h5>
                    <p style={{ margin: "4px 0 0 0", fontSize: 11, color: T.sub, fontWeight: 500 }}>Ordered by Dr. {test.doctors?.name || "Specialist"} · {test.created_at?.split("T")?.[0]}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedPrescription(test); }} style={{ background: "transparent", border: "none", color: "#D97706", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, alignSelf: "center" }}>
                    <FileText size={16} />
                    <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>View</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices & Billing Section */}
        <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Invoices & Billing</h4>
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{invoices.length} total</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {invoices.length > 0 ? (
              invoices.map(inv => {
                const isPaid = inv.payment_status === "Paid" || inv.payment_status === "paid";
                return (
                  <div key={inv.id} className="hover-lift" style={{ padding: "16px", borderRadius: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "flex-start", gap: 16, cursor: "pointer" }} onClick={() => setSelectedInvoice(inv)}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: isPaid ? "#D1FAE5" : "#FFE4E6", display: "flex", alignItems: "center", justifyContent: "center", color: isPaid ? "#065F46" : "#E11D48", flexShrink: 0 }}>
                      <Receipt size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.primary, lineHeight: 1.4 }}>
                        Invoice #{inv.invoice_num}
                      </h5>
                      <p style={{ margin: "4px 0 0 0", fontSize: 11, color: T.sub, fontWeight: 500 }}>
                        Dr. {inv.doctors?.name || "Specialist"} · {inv.created_at?.split("T")?.[0]}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: 13, fontWeight: 700, color: T.primary }}>
                        ₹{Number(inv.total).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", alignSelf: "center" }}>
                      <span style={{ fontSize: 10, background: isPaid ? "#D1FAE5" : "#FEF3C7", color: isPaid ? "#065F46" : "#D97706", padding: "4px 8px", borderRadius: 8, fontWeight: 700, textTransform: "capitalize" }}>
                        {inv.payment_status || "Pending"}
                      </span>
                      {!isPaid && (
                        <a 
                          href={`${BOT_URL}/pay/${inv.invoice_num}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ textDecoration: "none" }}
                        >
                          <button style={{ background: T.teal, color: "white", padding: "6px 12px", borderRadius: 10, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <CreditCard size={12} /> Pay
                          </button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: "1 / -1", textShadow: "none", background: "#F8FAFC", padding: 32, borderRadius: 16, textAlign: "center", border: "1px dashed #E2E8F0", color: T.sub, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Receipt size={28} color={T.muted} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No invoices found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 2. APPOINTMENTS TAB
  const renderAppointments = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    let filteredAppts = appointments;
    if (apptFilter === "upcoming") {
      filteredAppts = appointments.filter(a => a.status !== "cancelled" && a.status !== "completed" && a.date >= todayStr);
    } else if (apptFilter === "past") {
      filteredAppts = appointments.filter(a => a.status === "completed" || a.status === "cancelled" || a.date < todayStr);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "8px 12px", overflowY: "auto", flex: 1, maxHeight: "calc(100vh - 48px)", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: T.primary, margin: 0, fontFamily: "'Syne', sans-serif" }}>Consultation History</h2>
            <p style={{ margin: "4px 0 0 0", color: T.sub, fontSize: 13 }}>Review your scheduled consultations, virtual links, and clinical logs.</p>
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: "flex", gap: 12, borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
          <button onClick={() => setApptFilter("all")} style={{ background: apptFilter === "all" ? "#0D3327" : "transparent", color: apptFilter === "all" ? "white" : T.sub, border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>All Consultations ({appointments.length})</button>
          <button onClick={() => setApptFilter("upcoming")} style={{ background: apptFilter === "upcoming" ? "#0D3327" : "transparent", color: apptFilter === "upcoming" ? "white" : T.sub, border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Upcoming Only</button>
          <button onClick={() => setApptFilter("past")} style={{ background: apptFilter === "past" ? "#0D3327" : "transparent", color: apptFilter === "past" ? "white" : T.sub, border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Completed & Cancelled</button>
        </div>

        {/* Appointments Table */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #E2E8F0", overflow: "hidden" }}>
          {filteredAppts.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textShadow: "none", fontSize: 13, color: T.text }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 700, color: T.sub }}>Doctor</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 700, color: T.sub }}>Department</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 700, color: T.sub }}>Date & Slot</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 700, color: T.sub }}>Type</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontWeight: 700, color: T.sub }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontWeight: 700, color: T.sub }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppts.map((appt, index) => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isUpcoming = appt.status !== "cancelled" && appt.status !== "completed" && appt.date >= todayStr;
                    const isVideo = appt.consultation_type === "call";
                    const isRescheduling = reschedulingApptId === appt.id;

                    return (
                      <tr key={appt.id} style={{ borderBottom: index === filteredAppts.length - 1 ? "none" : "1px solid #E2E8F0" }}>
                        <td style={{ padding: "18px 20px", fontWeight: 800 }}>Dr. {appt.doctors?.name || "Clinic Specialist"}</td>
                        <td style={{ padding: "18px 20px", fontWeight: 600, color: T.sub }}>{appt.doctors?.department || "General"}</td>
                        <td style={{ padding: "18px 20px" }}>
                          {isRescheduling ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 11 }} />
                              <select value={rescheduleSlot} onChange={e => setRescheduleSlot(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 11 }}>
                                <option value="">Select Time</option>
                                {generateDoctorSlots(appt.doctors).map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => submitReschedule(appt.id)} style={{ background: T.primary, color: "white", border: "none", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Save</button>
                                <button onClick={() => setReschedulingApptId(null)} style={{ background: "white", color: T.sub, border: "1px solid #E2E8F0", padding: "4px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 700 }}>{appt.date}</span>
                              <span style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>{appt.slot}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "18px 20px" }}>
                          <span style={{ background: isVideo ? "#EEF2FF" : "#F1F5F9", color: isVideo ? T.blue : T.sub, padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {isVideo ? <Video size={11} /> : <MapPin size={11} />} {isVideo ? "Virtual" : "Physical"}
                          </span>
                        </td>
                        <td style={{ padding: "18px 20px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                            background: appt.status === "confirmed" || appt.status === "completed" || appt.status === "booked" ? "#D1FAE5" : appt.status === "cancelled" || appt.status === "rejected" ? "#FEE2E2" : "#FEF3C7",
                            color: appt.status === "confirmed" || appt.status === "completed" || appt.status === "booked" ? "#065F46" : appt.status === "cancelled" || appt.status === "rejected" ? "#991B1B" : "#D97706",
                          }}>{appt.status}</span>
                        </td>
                        <td style={{ padding: "18px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                            {isUpcoming && isVideo && appt.meet_link && (
                              <a href={appt.meet_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                <button style={{ background: T.teal, color: "white", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Video size={12} /> Join</button>
                              </a>
                            )}
                            {isUpcoming && !isRescheduling && (
                              <>
                                <button onClick={() => { setReschedulingApptId(appt.id); setRescheduleDate(appt.date); setRescheduleSlot(appt.slot); }} style={{ background: "white", color: T.primary, border: "1px solid #CBD5E1", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Reschedule</button>
                                <button onClick={() => cancelAppointment(appt.id)} style={{ background: "white", color: "#EF4444", border: "1px solid #FCA5A5", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                              </>
                            )}
                            {!isUpcoming && <span style={{ color: T.sub, fontSize: 11, fontWeight: 600 }}>Archived</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textShadow: "none", padding: "48px 24px", textAlign: "center", color: T.sub, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Calendar size={36} color={T.muted} />
              <h4 style={{ margin: 0, color: T.primary, fontSize: 16, fontWeight: 800 }}>No Consultations Found</h4>
              <p style={{ margin: 0, fontSize: 13 }}>Try switching tabs or schedule a new appointment with the clinician.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 3. MEDICAL PROFILE TAB
  const renderMedicalProfile = () => {
    // Generate simple timeline events from actual appointments & prescriptions
    const timeline = [];
    appointments.forEach(a => {
      timeline.push({
        date: a.date,
        type: "Consultation Request",
        desc: `Requested ${a.consultation_type === "call" ? "virtual" : "in-clinic"} visit with Dr. ${a.doctors?.name || "Specialist"} for: "${a.reason || "General health evaluation"}"`,
        icon: <Activity size={12} />,
        bg: "#EEF2FF",
        color: T.blue
      });
    });
    prescriptions.forEach(p => {
      if (p.medicines && p.medicines.length > 0) {
        timeline.push({
          date: p.created_at?.split("T")?.[0],
          type: "Prescription Issued",
          desc: `Dr. ${p.doctors?.name || "Specialist"} prescribed: ${p.medicines.map(m => m.name).join(", ")}`,
          icon: <FileText size={12} />,
          bg: "#D1FAE5",
          color: "#047857"
        });
      }
      if (p.tests && p.tests.length > 0) {
        timeline.push({
          date: p.created_at?.split("T")?.[0],
          type: "Lab Tests Requested",
          desc: `Dr. ${p.doctors?.name || "Specialist"} ordered diagnostic tests: ${p.tests.join(", ")}`,
          icon: <Activity size={12} />,
          bg: "#FEF3C7",
          color: "#D97706"
        });
      }
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "8px 12px", overflowY: "auto", flex: 1, maxHeight: "calc(100vh - 48px)", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {/* Title */}
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: T.primary, margin: 0, fontFamily: "'Syne', sans-serif" }}>Medical Profile</h2>
          <p style={{ margin: "4px 0 0 0", color: T.sub, fontSize: 13 }}>Access your complete medical file, allergies, emergency contacts, and timelines.</p>
        </div>

        {/* Large Verified User Card */}
        <div style={{ background: "linear-gradient(135deg, #0D3327 0%, #1F4D3E 100%)", borderRadius: 24, padding: 32, color: "white", position: "relative", overflow: "hidden", boxShadow: "0 12px 36px rgba(13,51,39,0.18)" }}>
          <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: T.primary }}>
                <User size={44} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, fontFamily: "'Syne', sans-serif" }}>{profile.name || "Sarah Jenkins"}</h3>
                  <span style={{ background: "#10B981", color: "white", padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle size={11} /> VERIFIED USER
                  </span>
                  {profile.uid && (
                    <span style={{ background: "#065F46", color: "#A7F3D0", padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                      ID: #{profile.uid}
                    </span>
                  )}
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#A7F3D0", fontWeight: 500 }}>Verified patient since May 2026</p>
                <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, color: "#A7F3D0", textTransform: "uppercase", fontWeight: 700 }}>Blood Group</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 800 }}>{profile.blood_group || "O+"}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "#A7F3D0", textTransform: "uppercase", fontWeight: 700 }}>Height</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 800 }}>{profile.height || "172"} cm</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "#A7F3D0", textTransform: "uppercase", fontWeight: 700 }}>Weight</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 800 }}>{profile.weight || "68"} kg</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "#A7F3D0", textTransform: "uppercase", fontWeight: 700 }}>BMI</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      {profile.bmi || "23.0"}
                      <span style={{ fontSize: 11, background: getBmiStatus(profile.bmi).bg, color: getBmiStatus(profile.bmi).color, padding: "2px 8px", borderRadius: 8, fontWeight: 800 }}>
                        {getBmiStatus(profile.bmi).text}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glowing Background Glows */}
          <div style={{ position: "absolute", right: "-10%", top: "-30%", width: 250, height: 250, background: "rgba(16,185,129,0.18)", borderRadius: "50%", filter: "blur(60px)" }} />
        </div>

        {/* Double Column Grid: Allergies/Conditions & Contacts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {/* Allergies & Conditions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Allergies Box */}
            <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Medical Allergies</h4>
              <p style={{ margin: "4px 0 16px 0", fontSize: 12, color: T.sub }}>Click a tag to remove or enter a new allergen to append to your file.</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allergies.map(all => (
                  <span key={all} style={{ background: "#FEE2E2", color: "#991B1B", padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    {all}
                    <X size={12} color="#EF4444" style={{ cursor: "pointer" }} onClick={() => setAllergies(allergies.filter(item => item !== all))} />
                  </span>
                ))}
              </div>

              <form onSubmit={e => {
                e.preventDefault();
                if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
                  setAllergies([...allergies, newAllergy.trim()]);
                  setNewAllergy("");
                }
              }} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <input type="text" placeholder="e.g. Pollen, Latex" value={newAllergy} onChange={e => setNewAllergy(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, outline: "none" }} />
                <button type="submit" style={{ background: T.primary, color: "white", border: "none", padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ Add</button>
              </form>
            </div>

            {/* Chronic Conditions Box */}
            <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Chronic Conditions</h4>
              <p style={{ margin: "4px 0 16px 0", fontSize: 12, color: T.sub }}>Track long-term diagnosed conditions inside your dashboard card tags.</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {chronicConditions.map(cond => (
                  <span key={cond} style={{ background: "#FEF3C7", color: "#92400E", padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    {cond}
                    <X size={12} color="#D97706" style={{ cursor: "pointer" }} onClick={() => setChronicConditions(chronicConditions.filter(item => item !== cond))} />
                  </span>
                ))}
              </div>

              <form onSubmit={e => {
                e.preventDefault();
                if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
                  setChronicConditions([...chronicConditions, newCondition.trim()]);
                  setNewCondition("");
                }
              }} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <input type="text" placeholder="e.g. Asthma, Thyroid" value={newCondition} onChange={e => setNewCondition(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 13, outline: "none" }} />
                <button type="submit" style={{ background: T.primary, color: "white", border: "none", padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>+ Add</button>
              </form>
            </div>
          </div>

          {/* Emergency & Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Emergency Contacts Widget */}
            <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #EF4444", boxShadow: "0 4px 16px rgba(239,68,68,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: "#EF4444" }}>
                <AlertTriangle size={20} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Emergency Priority</h4>
              </div>
              <p style={{ margin: "0 0 16px 0", fontSize: 12, color: T.sub }}>In case of emergency medical crises, contacts will be called instantly.</p>

              <div style={{ background: "#FEF2F2", padding: 16, borderRadius: 16, border: "1px solid #FEE2E2", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#991B1B", fontWeight: 700, textTransform: "uppercase" }}>Primary Contact</span>
                <h5 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.primary }}>
                  {profile.emergency_contact || "Not Registered"}
                </h5>
                <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.sub, fontWeight: 600 }}>Emergency Contact Phone</p>
              </div>
            </div>

            {/* Clinical Timeline Journey */}
            <div style={{ background: "white", padding: 24, borderRadius: 24, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 16 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Clinical Log Timeline</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", paddingLeft: 12 }}>
                {/* Visual Line */}
                <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 2, background: "#E2E8F0" }} />

                {timeline.slice(0, 4).map((evt, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 12, position: "relative" }}>
                    <div style={{
                      position: "absolute", left: -14, top: 4, width: 10, height: 10, borderRadius: "50%",
                      background: evt.color, border: "3px solid white", boxShadow: "0 0 0 1px #E2E8F0"
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, color: T.sub, fontWeight: 700 }}>{evt.date}</span>
                      <h5 style={{ margin: "2px 0 2px 0", fontSize: 12, fontWeight: 800, color: T.primary }}>{evt.type}</h5>
                      <p style={{ margin: 0, fontSize: 11, color: T.sub, lineHeight: 1.4 }}>{evt.desc}</p>
                    </div>
                  </div>
                ))}

                {timeline.length === 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: T.sub, textAlign: "center" }}>No clinical records recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 4. NEW CONSULTATION stepper WIZARD
  const renderConsultationModal = () => {
    if (!isConsultationModalOpen) return null;

    const specialtiesList = [
      { id: "General Medicine", label: "General Medicine", desc: "Routine health diagnostics & colds", icon: <Activity size={24} />, bg: "#E0F2FE", color: "#0284C7" },
      { id: "Cardiology", label: "Cardiology", desc: "Heart, pulse rate & coronary issues", icon: <Heart size={24} />, bg: "#FEE2E2", color: "#DC2626" },
      { id: "Pediatrics", label: "Pediatrics", desc: "Child care, vaccinations & growth", icon: <User size={24} />, bg: "#F3E8FF", color: "#7C3AED" },
      { id: "Neurology", label: "Neurology", desc: "Headaches, nerves & seizures", icon: <Moon size={24} />, bg: "#E0F2FE", color: "#1E40AF" },
      { id: "Dermatology", label: "Dermatology", desc: "Skin disorders, acne & rashes", icon: <ShieldPlus size={24} />, bg: "#FEF3C7", color: "#D97706" },
      { id: "Psychiatry", label: "Psychiatry", desc: "Anxiety, depression & sleep cycles", icon: <HelpCircle size={24} />, bg: "#E0E7FF", color: "#4F46E5" },
    ];

    const filteredDoctors = doctors.filter(doc => {
      const spec = selectedSpecialty.toLowerCase();
      const docDept = (doc.department || "").toLowerCase();
      const docSpec = (doc.specialty || "").toLowerCase();
      return docDept.includes(spec) || docSpec.includes(spec);
    });

    // Fallback if no matching doctors
    const displayedDoctors = filteredDoctors.length > 0 ? filteredDoctors : doctors;

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: "rgba(13,51,39,0.6)", backdropFilter: "blur(8px)", display: "flex",
        justifyContent: "center", alignItems: "center", padding: 20
      }}>
        <div style={{
          background: "white", borderRadius: 28, width: "100%", maxWidth: 640,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden", display: "flex", flexDirection: "column"
        }}>
          {/* Modal Header */}
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.primary, fontFamily: "'Syne', sans-serif" }}>Book Consultation</h3>
              {bookingStep < 4 && (
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: T.sub, fontWeight: 600 }}>Step {bookingStep} of 3 · {bookingStep === 1 ? "Select Specialty" : bookingStep === 2 ? "Select Doctor" : "Choose Slot & Type"}</p>
              )}
            </div>
            <button onClick={() => setIsConsultationModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.sub }}>
              <X size={20} />
            </button>
          </div>

          {/* Stepper Content */}
          <div style={{ padding: "28px 32px", overflowY: "auto", maxHeight: 420 }}>
            {/* STEP 1: Specialty Selection */}
            {bookingStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.primary }}>Choose medical specialty department:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {specialtiesList.map(spec => (
                    <div
                      key={spec.id}
                      onClick={() => { setSelectedSpecialty(spec.id); setBookingStep(2); }}
                      className="hover-lift"
                      style={{
                        padding: 16, borderRadius: 20, border: "1.5px solid #E2E8F0", cursor: "pointer",
                        display: "flex", gap: 16, alignItems: "center", transition: "all 0.2s"
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: spec.bg, color: spec.color, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {spec.icon}
                      </div>
                      <div>
                        <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.primary }}>{spec.label}</h5>
                        <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.sub, lineHeight: 1.3 }}>{spec.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Doctor Selection */}
            {bookingStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.primary }}>Select clinician in {selectedSpecialty}:</h4>
                  <button onClick={() => setBookingStep(1)} style={{ background: "transparent", border: "none", color: T.teal, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Back to Specialties</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {displayedDoctors.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => { setSelectedDoctor(doc); setBookingStep(3); }}
                      className="hover-lift"
                      style={{
                        padding: 16, borderRadius: 20, border: selectedDoctor?.id === doc.id ? `2px solid ${T.primary}` : "1.5px solid #E2E8F0",
                        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}
                    >
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: T.blue, fontWeight: 800 }}>
                          {doc.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.primary }}>Dr. {doc.name}</h5>
                          <p style={{ margin: "2px 0 0 0", fontSize: 11, color: T.sub, fontWeight: 600 }}>{doc.department || selectedSpecialty} · Clinic Practitioner</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", padding: "4px 10px", borderRadius: 10, fontWeight: 700 }}>Available Today</span>
                    </div>
                  ))}
                  {displayedDoctors.length === 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: T.sub, textAlign: "center" }}>No medical doctor practitioners registered.</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Slot Date & Reason Selection */}
            {bookingStep === 3 && (
              <form onSubmit={handleBookConsultation} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Consultation Type Selector Toggle */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>Consultation Mode</label>
                  <div style={{ display: "flex", borderRadius: 12, background: "#F1F5F9", padding: 4 }}>
                    <button type="button" onClick={() => setBookingType("Video Consultation")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", background: bookingType === "Video Consultation" ? "white" : "transparent", color: bookingType === "Video Consultation" ? T.primary : T.sub, boxShadow: bookingType === "Video Consultation" ? "0 2px 6px rgba(0,0,0,0.05)" : "none" }}>📹 Virtual Video Call</button>
                    <button type="button" onClick={() => setBookingType("In-Person Visit")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer", background: bookingType === "In-Person Visit" ? "white" : "transparent", color: bookingType === "In-Person Visit" ? T.primary : T.sub, boxShadow: bookingType === "In-Person Visit" ? "0 2px 6px rgba(0,0,0,0.05)" : "none" }}>🏥 In-Clinic Physical</button>
                  </div>
                </div>

                {/* Calendar Date Picker */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>Choose Date</label>
                  <input type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none" }} />
                </div>

                {/* Slot Choice Grid */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>Select Time Slot</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {generateDoctorSlots(selectedDoctor).map(slot => (
                      <button
                        key={slot} type="button"
                        onClick={() => setBookingSlot(slot)}
                        style={{
                          padding: "10px 0", borderRadius: 10, border: bookingSlot === slot ? `2px solid ${T.primary}` : "1px solid #E2E8F0",
                          background: bookingSlot === slot ? "#EEF2FF" : "white", color: T.primary, fontSize: 12, fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason Text */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>Chief Complaints / Reasons</label>
                  <textarea placeholder="Tell your clinician your complaints or symptoms..." value={bookingReason} onChange={e => setBookingReason(e.target.value)} rows={3} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", resize: "none" }} />
                </div>

                {/* Submit Container */}
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button type="button" onClick={() => setBookingStep(2)} style={{ flex: 0.4, background: "white", color: T.sub, border: "1px solid #CBD5E1", padding: 14, borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>Back</button>
                  <button type="submit" disabled={bookingLoading} style={{ flex: 1, background: T.primary, color: "white", border: "none", padding: 14, borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>
                    {bookingLoading ? "Booking appointment..." : "Book Consultation Now"}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success Confetti screen */}
            {bookingStep === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 24,
                  padding: "16px 8px 8px 8px"
                }}
              >
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                  {/* Pulsing ring */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                    }}
                  />
                  
                  {/* Emerald Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    {/* SVG Checkmark */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path
                        d="M20 6L9 17L4 12"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
                      />
                    </svg>
                  </motion.div>
                </div>

                <div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 900,
                      color: T.primary,
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Booking Confirmed!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      margin: "8px 0 0 0",
                      fontSize: 13,
                      color: T.sub,
                      fontWeight: 550,
                      lineHeight: 1.4
                    }}
                  >
                    Your appointment has been successfully scheduled and added to the medical records ledger.
                  </motion.p>
                </div>

                {/* Glassmorphic Summary Receipt */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                  style={{
                    background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
                    border: "1px solid #E2E8F0",
                    borderRadius: 20,
                    padding: 20,
                    width: "100%",
                    boxShadow: "0 10px 25px -5px rgba(30, 77, 123, 0.05)",
                    boxSizing: "border-box",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #E2E8F0", paddingBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: T.teal, letterSpacing: "0.05em", textTransform: "uppercase" }}>Appointment Receipt</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>STATUS: CONFIRMED</span>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(30, 77, 123, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, letterSpacing: "0.02em" }}>ASSIGNED CLINICIAN</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: T.primary }}>Dr. {selectedDoctor?.name}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: T.teal, flexShrink: 0 }}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, letterSpacing: "0.02em" }}>DATE & TIME SLOT</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{bookingDate} · {bookingSlot}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239, 68, 68, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", flexShrink: 0 }}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, letterSpacing: "0.02em" }}>CONSULTATION TYPE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{bookingType}</div>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setIsConsultationModalOpen(false); setBookingStep(1); }}
                  style={{
                    background: T.primary,
                    color: "white",
                    border: "none",
                    width: "100%",
                    padding: 16,
                    borderRadius: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(30, 77, 123, 0.2)",
                    fontSize: 14,
                    fontFamily: "'Syne', sans-serif"
                  }}
                >
                  Close & View Consultations
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPermissions = () => {
    const accessRequests = prescriptions.filter(p => p.diagnosis === "MEDICAL_ACCESS_REQUEST");

    return (
      <div style={{ padding: "40px 48px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", marginBottom: 32, fontFamily: "'Syne', sans-serif" }}>Data Access Permissions</h2>
        
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 32, lineHeight: 1.6 }}>
          Manage which doctors have access to your full medical history (past prescriptions and lab reports).
        </p>

        {accessRequests.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", background: "#F8FAFC", borderRadius: 24, border: "1.5px dashed #E2E8F0" }}>
            <ShieldPlus size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#334155", margin: "0 0 8px 0" }}>No Access Requests</h3>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>You don't have any pending or active data access requests from doctors.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {accessRequests.map(req => (
              <div key={req.id} style={{ background: "white", borderRadius: 20, border: "1px solid #E2E8F0", padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShieldPlus size={24} color="#4F46E5" />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                      Dr. {req.doctors?.name || "Specialist"}
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                      {req.doctors?.department || "Department"} · Requested on {req.date}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  {req.status === "active" ? (
                    <>
                      <button onClick={async () => {
                        const { error } = await supabase.from("prescriptions").update({ status: "completed" }).eq("id", req.id);
                        if (!error) {
                          setPrescriptions(prev => prev.map(p => p.id === req.id ? { ...p, status: "completed" } : p));
                          showToast("Access Granted");
                        }
                      }} style={{ padding: "8px 16px", borderRadius: 12, background: T.teal, color: "white", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                        Approve
                      </button>
                      <button onClick={async () => {
                        const { error } = await supabase.from("prescriptions").delete().eq("id", req.id);
                        if (!error) {
                          setPrescriptions(prev => prev.filter(p => p.id !== req.id));
                          showToast("Request Denied");
                        }
                      }} style={{ padding: "8px 16px", borderRadius: 12, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                        Deny
                      </button>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "6px 12px", borderRadius: 8 }}>
                        ✓ Approved
                      </span>
                      <button onClick={async () => {
                        const { error } = await supabase.from("prescriptions").delete().eq("id", req.id);
                        if (!error) {
                          setPrescriptions(prev => prev.filter(p => p.id !== req.id));
                          showToast("Access Revoked");
                        }
                      }} style={{ padding: "6px 12px", borderRadius: 8, background: "white", color: "#64748B", border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Revoke Access
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loadingHosp) return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: T.bg }}>Loading...</div>;

  if (!hospital) return <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: T.bg }}>Hospital Not Found</div>;

  return (
    <div style={{ display: "flex", height: "100vh", maxHeight: "100vh", overflow: "hidden", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{
              position: "absolute", top: 24, left: "50%", zIndex: 9999,
              background: T.primary, color: "white", padding: "12px 24px",
              borderRadius: 999, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(13,51,39,0.3)",
              display: "flex", alignItems: "center", gap: 8
            }}
          >
            <Bell size={16} />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. LEFT SIDEBAR */}
      {sessionStarted && (
        <div style={{ width: 280, background: '#fff', borderRight: '1px solid #E2E8F0', padding: "32px 24px", display: 'flex', flexDirection: 'column', height: "100vh", maxHeight: "100vh", overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 14px rgba(30,77,123,0.25)" }}>
              <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 16, color: "#0F172A", lineHeight: 1.1 }}>Cura</div>
              <div style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Patient Portal</div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <NavItem icon={<MessageSquare size={18} />} label="Messages" active={activeTab === "messages"} onClick={() => setActiveTab("messages")} />
            <NavItem icon={<Calendar size={18} />} label="Appointments" active={activeTab === "appointments"} onClick={() => setActiveTab("appointments")} />
            <NavItem icon={<FileText size={18} />} label="Medical Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
            <NavItem icon={<ShieldPlus size={18} />} label="Data Permissions" active={activeTab === "permissions"} onClick={() => setActiveTab("permissions")} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <NavItem icon={<HelpCircle size={18} />} label="Help Center" />
              <NavItem icon={<LogOut size={18} />} label="Sign Out" onClick={handleLogout} />
            </div>
          </div>
        </div>
      )}

      {/* 2. CENTER CONTENT (Dynamic Tabs based on activeTab) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: sessionStarted ? "24px" : "0", background: sessionStarted ? T.bg : "white", height: "100vh", maxHeight: "100vh", overflow: "hidden", boxSizing: "border-box" }}>

        {!sessionStarted ? (
          // AUTH UI (Centered and clean)
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: T.bg }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "white", borderRadius: 24, padding: "2.5rem 2rem", boxShadow: "0 20px 48px rgba(13,51,39,0.10)", width: "100%", maxWidth: 420, border: "1px solid rgba(13,51,39,0.06)" }}
            >
              <h2 style={{ textAlign: "center", fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 8 }}>
                {authMode === "reset" ? "Reset Password" : `${hospital.name} Portal`}
              </h2>
              <p style={{ textAlign: "center", fontSize: 13, color: T.sub, marginBottom: 24 }}>
                {authMode === "reset" ? "Enter your email or phone to receive a reset code." : "Login to access your medical records and appointments."}
              </p>

              <div style={{ display: "flex", marginBottom: 24, borderRadius: 12, background: "rgba(13,51,39,0.05)", padding: 4 }}>
                <button onClick={() => { setAuthMode("login"); setAuthStep("input"); setAuthError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: authMode === "login" ? "white" : "transparent", boxShadow: authMode === "login" ? "0 4px 12px rgba(13,51,39,0.08)" : "none", border: "none", color: authMode === "login" ? T.primary : T.sub, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>LOGIN</button>
                <button onClick={() => { setAuthMode("signup"); setAuthStep("input"); setAuthError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: authMode === "signup" ? "white" : "transparent", boxShadow: authMode === "signup" ? "0 4px 12px rgba(13,51,39,0.08)" : "none", border: "none", color: authMode === "signup" ? T.primary : T.sub, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>SIGN UP</button>
              </div>

              {authMode === "reset" ? (
                authStep === "input" ? (
                  <form onSubmit={handleSendResetOtp}>
                    <InputField label="MOBILE NUMBER OR EMAIL" value={contactInfo} onChange={setContactInfo} />
                    {authError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 12 }}>{authError}</p>}
                    <button type="submit" disabled={authLoading} style={{ width: "100%", padding: 15, background: T.primary, color: "white", border: "none", borderRadius: 12, fontWeight: 900, marginTop: 24, cursor: "pointer" }}>{authLoading ? "SENDING OTP..." : "SEND RESET OTP"}</button>
                    <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.sub, cursor: "pointer" }} onClick={() => setAuthMode("login")}>Back to Login</p>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyResetOtp}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>ENTER RESET OTP</label>
                      <OTPBoxInput value={otp} onChange={setOtp} disabled={authLoading} />
                    </div>
                    <p style={{ fontSize: 12, color: T.sub, marginTop: 8, textAlign: "center" }}>Sent to {contactInfo} · <span style={{ color: T.primary, cursor: "pointer", fontWeight: 600 }} onClick={() => { setAuthStep("input"); setOtp(""); setAuthError(""); }}>Edit</span></p>
                    <div style={{ marginTop: 16 }}><InputField label="NEW PASSWORD" type="password" value={password} onChange={setPassword} /></div>
                    <div style={{ marginTop: 16 }}><InputField label="CONFIRM NEW PASSWORD" type="password" value={confirmPassword} onChange={setConfirmPassword} /></div>
                    {authError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 12, textAlign: "center" }}>{authError}</p>}
                    <button type="submit" disabled={authLoading || otp.length < 6} style={{ width: "100%", padding: 15, background: otp.length === 6 ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : "#E2E8F0", color: otp.length === 6 ? "white" : T.sub, border: "none", borderRadius: 12, fontWeight: 900, marginTop: 20, cursor: otp.length === 6 && !authLoading ? "pointer" : "not-allowed", transition: "all 0.3s", fontSize: 13, letterSpacing: "0.08em" }}>{authLoading ? "RESETTING..." : "RESET PASSWORD"}</button>
                  </form>
                )
              ) : (
                authStep === "input" ? (
                  <form onSubmit={handleSendOtp}>
                    {authMode === "signup" && <InputField label="FULL NAME" value={name} onChange={setName} />}
                    <div style={{ marginTop: 16 }}><InputField label="MOBILE NUMBER OR EMAIL" value={contactInfo} onChange={setContactInfo} /></div>
                    <div style={{ marginTop: 16 }}>
                      <InputField label="PASSWORD" type="password" value={password} onChange={setPassword} />
                    </div>
                    {authMode === "signup" && (
                      <div style={{ marginTop: 16 }}>
                        <InputField label="CONFIRM PASSWORD" type="password" value={confirmPassword} onChange={setConfirmPassword} />
                      </div>
                    )}
                    {authMode === "login" && (
                      <p style={{ textAlign: "right", marginTop: 8, fontSize: 12, color: T.teal, fontWeight: 700, cursor: "pointer" }} onClick={() => { setAuthMode("reset"); setAuthStep("input"); setAuthError(""); }}>Forgot Password?</p>
                    )}
                    {authError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 12 }}>{authError}</p>}
                    <button type="submit" disabled={authLoading} style={{ width: "100%", padding: 15, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})`, color: "white", border: "none", borderRadius: 12, fontWeight: 900, marginTop: 24, cursor: "pointer", fontSize: 13, letterSpacing: "0.08em", boxShadow: "0 6px 20px rgba(13,51,39,0.25)" }}>{authLoading ? "SENDING OTP..." : "SEND OTP"}</button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>ENTER OTP</label>
                      <OTPBoxInput value={otp} onChange={setOtp} disabled={authLoading} />
                    </div>
                    <p style={{ fontSize: 12, color: T.sub, marginTop: 8, textAlign: "center" }}>Sent to {contactInfo} · <span style={{ color: T.primary, cursor: "pointer", fontWeight: 600 }} onClick={() => { setAuthStep("input"); setOtp(""); setAuthError(""); }}>Edit</span></p>
                    {authError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 12, textAlign: "center" }}>{authError}</p>}
                    <button type="submit" disabled={authLoading || otp.length < 6} style={{ width: "100%", padding: 15, background: otp.length === 6 ? `linear-gradient(135deg, ${T.primary}, ${T.primaryLight})` : "#E2E8F0", color: otp.length === 6 ? "white" : T.sub, border: "none", borderRadius: 12, fontWeight: 900, marginTop: 20, cursor: otp.length === 6 && !authLoading ? "pointer" : "not-allowed", transition: "all 0.3s", fontSize: 13, letterSpacing: "0.08em" }}>{authLoading ? "VERIFYING..." : "VERIFY & START"}</button>
                  </form>
                )
              )}
            </motion.div>
          </div>
        ) : (
          // RENDER TAB VIEW DYNAMICALLY
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, height: "100%", maxHeight: "100%", overflow: "hidden" }}>
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "appointments" && renderAppointments()}
            {activeTab === "profile" && renderMedicalProfile()}
            {activeTab === "permissions" && renderPermissions()}
            {activeTab === "messages" && (
              // ORIGINAL CHAT UI
              <div style={{ flex: 1, background: '#fff', borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', maxWidth: 1200, width: "100%", margin: "0 auto", height: "100%", maxHeight: "100%", minHeight: 0 }}>

                {/* Chat Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldPlus size={22} color="#047857" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, fontFamily: "'Syne', sans-serif" }}>Cura AI</h2>
                      <p style={{ fontSize: 12, color: T.teal, margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, background: T.teal, borderRadius: '50%' }} /> Always active
                      </p>
                    </div>
                  </div>
                  {/* Three-dot menu */}
                  <div ref={chatMenuRef} style={{ position: "relative" }}>
                    <button onClick={() => setShowChatMenu(v => !v)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.sub, padding: 8, borderRadius: 8 }}>
                      <MoreVertical size={20} />
                    </button>
                    {showChatMenu && (
                      <div style={{
                        position: "absolute", top: "110%", right: 0, background: "white",
                        border: "1px solid #E2E8F0", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                        zIndex: 999, minWidth: 180, overflow: "hidden"
                      }}>
                        <button
                          onClick={handleClearChat}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "14px 18px",
                            background: "transparent", border: "none", color: "#EF4444",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left"
                          }}
                        >
                          <X size={15} /> Clear Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0 }}>
                  {messages.map((msg, index) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, alignSelf: isBot ? "flex-start" : "flex-end", maxWidth: "80%", flexDirection: isBot ? 'row' : 'row-reverse' }}>

                        {/* Avatars */}
                        {isBot ? (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldPlus size={16} color="#3730A3" />
                          </div>
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={16} color="white" />
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: isBot ? 'flex-start' : 'flex-end' }}>
                          {/* Bubble */}
                          {msg.body && (
                            <div style={{
                              padding: "16px 20px",
                              borderRadius: isBot ? "0 16px 16px 16px" : "16px 0 16px 16px",
                              background: isBot ? "#F8FAFC" : T.primary,
                              color: isBot ? T.text : "white",
                              fontSize: 14, lineHeight: 1.7, fontWeight: 500,
                              border: isBot ? "1px solid #E2E8F0" : "none",
                              boxShadow: isBot ? "none" : "0 8px 16px rgba(13,51,39,0.15)",
                              maxWidth: "100%"
                            }}>
                              {renderFormattedText(msg.body)}
                            </div>
                          )}

                          {/* Interactive Buttons */}
                          {isBot && msg.buttons && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {msg.buttons.map(btn => (
                                <button
                                  key={btn.id} disabled={activeInteractive !== msg}
                                  onClick={() => handleInteractiveSelect(btn.title, btn.id)}
                                  style={{
                                    padding: "10px 16px", borderRadius: 12, background: "white", border: "1.5px solid #E2E8F0",
                                    color: T.primary, fontSize: 13, fontWeight: 700, cursor: activeInteractive === msg ? "pointer" : "default",
                                    opacity: activeInteractive === msg ? 1 : 0.5, transition: "all 0.2s"
                                  }}
                                >{btn.title}</button>
                              ))}
                            </div>
                          )}

                          {/* Interactive Lists */}
                          {isBot && msg.sections && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                              {msg.sections.map((sec, secIdx) => (
                                <div key={secIdx}>
                                  {sec.title && <p style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{sec.title}</p>}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {sec.rows.map(row => (
                                      <button key={row.id} disabled={activeInteractive !== msg} onClick={() => handleInteractiveSelect(row.title, row.id)}
                                        style={{ textAlign: 'left', padding: "12px 16px", borderRadius: 12, background: "white", border: "1px solid #E2E8F0", color: T.text, fontSize: 13, fontWeight: 600, cursor: activeInteractive === msg ? "pointer" : "default", opacity: activeInteractive === msg ? 1 : 0.5 }}
                                      >{row.title}</button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {waitingForBot && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldPlus size={16} color="#3730A3" /></div>
                      <div style={{ padding: "16px 20px", borderRadius: "0 16px 16px 16px", background: "#F8FAFC", border: "1px solid #E2E8F0", display: 'flex', gap: 6 }}>
                        <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: T.muted }} />
                        <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: T.muted }} />
                        <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: T.muted }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: "20px 24px", borderTop: "1px solid #E2E8F0", flexShrink: 0 }}>
                  <form onSubmit={handleSendText} style={{ display: "flex", gap: 16, alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 16, padding: "8px 8px 8px 16px", background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
                    <Paperclip color={T.sub} size={20} style={{ cursor: 'pointer' }} />
                    <input
                      type="text"
                      disabled={waitingForBot || (activeInteractive !== null)}
                      placeholder="Type your message..."
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontWeight: 500, color: T.text, background: 'transparent' }}
                    />
                    <button type="submit" disabled={waitingForBot || (activeInteractive !== null) || !inputText.trim()}
                      style={{ width: 44, height: 44, borderRadius: 12, background: T.primary, border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: (!inputText.trim() || waitingForBot) ? 0.6 : 1 }}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. RIGHT SIDEBAR (Profile details) - ONLY show when on Messages tab */}
      {sessionStarted && activeTab === "messages" && (
        <div style={{ width: 340, background: T.bg, padding: "24px 24px 24px 0", display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: "100vh", maxHeight: "100vh", boxSizing: "border-box" }}>

          <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0, fontFamily: "'Syne', sans-serif" }}>Health Vitals</h3>
            <p style={{ fontSize: 12, color: T.sub, marginBottom: 20, marginTop: 4 }}>Manage your biometric data</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <VitalCard label="Height" value={profile.height} unit="cm" icon={<Activity size={14} />} onChange={v => setProfile({ ...profile, height: v })} />
              <VitalCard label="Weight" value={profile.weight} unit="kg" icon={<TrendingUp size={14} />} onChange={v => setProfile({ ...profile, weight: v })} />
              <VitalCard label="Blood Group" value={profile.blood_group} unit="" icon={<Droplet size={14} color="#EF4444" />} onChange={v => setProfile({ ...profile, blood_group: v })} isSelect />
              <VitalCard
                label="BMI"
                value={profile.bmi}
                unit={getBmiStatus(profile.bmi).text}
                unitBg={getBmiStatus(profile.bmi).bg}
                unitColor={getBmiStatus(profile.bmi).color}
                icon={<Activity size={14} />}
                readOnly
                onChange={null}
              />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Syne', sans-serif" }}><User size={16} /> Account Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InputField label="Full Name" value={profile.name} onChange={v => setProfile({ ...profile, name: v })} />
              <InputField label="Emergency Contact" value={profile.emergency_contact} onChange={v => setProfile({ ...profile, emergency_contact: v })} />
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0, fontFamily: "'Syne', sans-serif" }}>Activity Trend</h3>
              <span style={{ color: T.teal, fontSize: 12, fontWeight: 800 }}>+12%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 60, gap: 6, justifyContent: 'space-between' }}>
              {[30, 45, 20, 60, 40, 50, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 6 ? T.primary : T.tealLight, height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
              ))}
            </div>
          </div>

          <button onClick={saveProfile} style={{ background: T.primary, color: 'white', padding: 18, borderRadius: 16, border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s', boxShadow: '0 8px 24px rgba(13,51,39,0.15)' }}>
            <Save size={18} /> {savingProfile ? "Saving..." : "Save Changes"}
          </button>

        </div>
      )}

      {/* Booking Stepper Overlay Modal */}
      {renderConsultationModal()}
      {renderPrescriptionModal()}
      {renderInvoiceModal()}

      {/* Profile Saved Success Fullscreen Overlay Animation */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)', // Sleek dark overlay
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '40px 48px',
                borderRadius: 32,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                maxWidth: 400,
                width: '90%',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                {/* Outer pulsing ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                  }}
                />
                
                {/* Inner green badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 20px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  {/* SVG Checkmark with path animation */}
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                      d="M20 6L9 17L4 12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              </div>

              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#0F172A',
                    margin: '0 0 8px 0',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '-0.02em',
                  }}
                >
                  Profile Updated!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontSize: 14,
                    color: '#64748B',
                    margin: 0,
                    fontWeight: 550,
                    lineHeight: '1.5',
                  }}
                >
                  Your changes have been saved successfully to your secure medical profile.
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .typing-dot { animation: wave 1.3s infinite ease-in-out; }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes wave { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

        /* Heartbeat Micro-animation */
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          40% { transform: scale(1.03); }
          60% { transform: scale(1.15); }
        }

        /* Pulse glow for status badge */
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        /* ECG Waveform sweep animation */
        @keyframes ecg-sweep {
          0% { stroke-dashoffset: 1200; }
          100% { stroke-dashoffset: 0; }
        }
        .ecg-line {
          stroke-dasharray: 1200;
          animation: ecg-sweep 3.8s linear infinite;
        }

        /* Modern hover transformations */
        .hover-lift {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(30,77,123,0.06);
          border-color: #CBD5E1 !important;
        }
      `}</style>
    </div>
  );
}
