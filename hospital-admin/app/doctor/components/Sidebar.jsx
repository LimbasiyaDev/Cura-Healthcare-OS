"use client";
import { 
  LayoutDashboard, Users, BarChart3, Settings, HelpCircle, 
  LogOut, BedDouble, Calendar, Clock, Zap, Receipt, Stethoscope, FlaskConical
} from "lucide-react";

export default function DoctorSidebar({ activeNav, setActiveNav, doctor, onSignOut, onSupportClick }) {
  const navItems = [
    { id: "dashboard",     label: "Dashboard",      Icon: LayoutDashboard },
    { id: "patients",      label: "Bookings",        Icon: Users },
    { id: "analytics",     label: "Analytics",       Icon: BarChart3 },
    { id: "settings",      label: "Settings",        Icon: Settings },
    { id: "invoice",       label: "Invoice",         Icon: Receipt },
    { id: "prescriptions", label: "Prescriptions",   Icon: Stethoscope },
    { id: "lab_tests",     label: "Lab Tests",       Icon: FlaskConical },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ overflow: "hidden" }}>
          <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <div>
          <div className="logo-text">Cura</div>
          <div className="logo-sub">Doctor Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item${activeNav === id ? " active" : ""}`}
            onClick={() => setActiveNav(id)}
          >
            <span className="nav-item-icon"><Icon size={17} /></span>
            {label}
          </button>
        ))}
      </nav>

      {/* Active Clinic Status */}
      <div style={{ padding: "0 10px", marginTop: "auto" }}>
        <div style={{
          padding: "14px",
          borderRadius: 13,
          background: "#F8FAF9",
          border: "1px solid rgba(20,61,48,0.07)",
          marginBottom: 10,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#94A3B8",
            fontFamily: "'Syne',sans-serif", marginBottom: 6,
          }}>
            ACTIVE CLINIC
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
              {doctor?.department || "General"}
            </span>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: doctor?.is_available ? "#10B981" : "#94A3B8",
            }} />
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-footer-item support" onClick={onSupportClick}>
          <HelpCircle size={16} /> Support
        </button>
        <button className="sidebar-footer-item" onClick={onSignOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}