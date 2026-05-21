"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, MapPin, Search,
  Users, ChevronRight, MessageSquare, Stethoscope, ExternalLink,
} from "lucide-react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ─── Design tokens ──────────────────────────────────────────────────────────── */
const T = {
  primary: "#0D3327",
  blue:    "#143D30",
  muted:   "#94A3B8",
  text:    "#0F172A",
  sub:     "#64748B",
};

/* ─── Framer variants ────────────────────────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const slide = {
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 26 } },
};

/* ─── Hospital Card ──────────────────────────────────────────────────────────── */
function HospitalCard({ hospital, doctorCount, index }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    router.push(`/hospitals/${hospital.id}/chat`);
  }

  return (
    <motion.div
      variants={slide}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        background: hovered ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(40px) saturate(1.6)",
        WebkitBackdropFilter: "blur(40px) saturate(1.6)",
        border: hovered
          ? "1px solid rgba(13,51,39,0.22)"
          : "1px solid rgba(255,255,255,0.95)",
        borderRadius: 24,
        padding: "1.75rem",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        boxShadow: hovered
          ? "0 24px 56px rgba(13,51,39,0.12), 0 4px 16px rgba(0,0,0,0.05)"
          : "0 4px 20px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Hover glow overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse at 20% 10%, rgba(13,51,39,0.06) 0%, transparent 65%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Card Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <motion.div
          animate={hovered ? { scale: 1.09, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          style={{
            width: 50, height: 50, borderRadius: 16,
            background: `linear-gradient(145deg, #10B981, ${T.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: hovered ? "0 10px 28px rgba(20,61,48,0.35)" : "0 4px 14px rgba(20,61,48,0.18)",
            transition: "box-shadow 0.3s", flexShrink: 0,
          }}
        >
          <Building2 size={22} color="white" />
        </motion.div>

        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999,
          background: hovered ? "rgba(20,61,48,0.10)" : "rgba(20,61,48,0.06)",
          border: `1px solid ${hovered ? "rgba(20,61,48,0.22)" : "rgba(20,61,48,0.10)"}`,
          transition: "all 0.3s",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#10B981",
            boxShadow: "0 0 0 2px rgba(16,185,129,0.25)",
            display: "inline-block",
          }} />
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: T.blue, fontFamily: "'Syne', sans-serif" }}>
            Online
          </span>
        </div>
      </div>

      {/* Index number */}
      <p style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.28em", color: T.muted, marginBottom: 6,
        fontFamily: "'Syne', sans-serif",
      }}>
        {String(index + 1).padStart(2, "0")} — Facility
      </p>

      {/* Hospital name */}
      <h2 style={{
        fontWeight: 800, fontSize: 19, color: T.text, marginBottom: 4,
        letterSpacing: "-0.02em", lineHeight: 1.25, fontFamily: "'Syne', sans-serif",
      }}>
        {hospital.name}
      </h2>

      {/* Address */}
      {hospital.address ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 18 }}>
          <MapPin size={13} style={{ color: T.blue, flexShrink: 0, marginTop: 3 }} />
          <span style={{ fontSize: 13, color: T.sub, fontWeight: 500, lineHeight: 1.5 }}>
            {hospital.address}
          </span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#CBD5E1", fontStyle: "italic", marginBottom: 18 }}>
          Address not set
        </p>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,61,48,0.08), transparent)", marginTop: "auto", marginBottom: 16 }} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* Doctors count */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "rgba(20,61,48,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Stethoscope size={14} style={{ color: T.blue }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 15, color: T.text, lineHeight: 1 }}>
              {doctorCount}
            </p>
            <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              {doctorCount === 1 ? "Doctor" : "Doctors"}
            </p>
          </div>
        </div>

        {/* AI Chat Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "rgba(20,61,48,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageSquare size={14} style={{ color: T.blue }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 15, color: T.text, lineHeight: 1 }}>
              Active
            </p>
            <p style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              AI Triage Chat
            </p>
          </div>
        </div>
      </div>

      {/* Hover CTA */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{ marginTop: 18 }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 12,
              background: `linear-gradient(135deg, ${T.blue}, #065F46)`,
              boxShadow: "0 6px 18px rgba(20,61,48,0.25)",
              fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.16em", color: "white",
              fontFamily: "'Syne', sans-serif",
            }}>
              <MessageSquare size={13} /> Consult Virtual Assistant <ChevronRight size={13} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function HospitalsPage() {
  const router = useRouter();

  const [hospitals,     setHospitals]     = useState([]);
  const [doctorCounts,  setDoctorCounts]  = useState({}); // { hospital_id: count }
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState("");

  /* ─── Fetch ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      /* 1. Fetch all hospitals */
      const { data: hospData, error: hospErr } = await supabase
        .from("hospitals")
        .select("id, name, address, created_at")
        .order("created_at", { ascending: false });

      if (hospErr) {
        setError("Failed to load hospitals: " + hospErr.message);
        setLoading(false);
        return;
      }

      setHospitals(hospData || []);

      /* 2. Fetch doctors to compute per-hospital count */
      const { data: docData } = await supabase
        .from("doctors")
        .select("hospital_id");

      if (docData) {
        const counts = {};
        docData.forEach((d) => {
          counts[d.hospital_id] = (counts[d.hospital_id] || 0) + 1;
        });
        setDoctorCounts(counts);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  /* ─── Filter ─────────────────────────────────────────────────────────────── */
  const filtered = hospitals.filter((h) => {
    const q = search.toLowerCase();
    return (
      h.name?.toLowerCase().includes(q) ||
      h.address?.toLowerCase().includes(q)
    );
  });

  const totalDoctors = Object.values(doctorCounts).reduce((s, v) => s + v, 0);

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #ECF1F8 0%, #FAFCFF 45%, #EAF0F8 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: "hidden",
      position: "relative",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,61,48,0.09) 0%, transparent 70%)",
            top: -200, left: -200 }}
        />
        <motion.div
          animate={{ x: [0, -18, 0], y: [0, 22, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          style={{ position: "absolute", width: 550, height: 550, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
            bottom: -80, right: -80 }}
        />
      </div>

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 3rem", height: 72,
          background: "rgba(236,241,248,0.96)",
          backdropFilter: "blur(48px) saturate(2)",
          WebkitBackdropFilter: "blur(48px) saturate(2)",
          borderBottom: "1px solid rgba(20,61,48,0.08)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.9), 0 4px 32px rgba(20,61,48,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div whileHover={{ scale: 1.05 }}
            style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden",
              boxShadow: "0 2px 12px rgba(20,61,48,0.20)" }}>
            <img src="/logo.jpeg" alt="Cura" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </motion.div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 17, color: T.text, lineHeight: 1, letterSpacing: "-0.04em", fontFamily: "'Syne', sans-serif" }}>Cura</p>
            <p style={{ fontSize: 9, letterSpacing: "0.28em", color: T.muted, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>Healthcare OS</p>
          </div>
        </div>

        <motion.button
          onClick={() => router.push("/")}
          whileHover={{ scale: 1.02, background: "white" }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(20,61,48,0.12)",
            color: T.sub, fontSize: 11, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.14em",
            cursor: "pointer", fontFamily: "'Syne', sans-serif",
            transition: "all 0.2s",
          }}
        >
          <ArrowLeft size={12} />Home
        </motion.button>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 3rem 40px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" animate="show">

          <motion.div variants={slide} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 32, height: 1.5, background: "linear-gradient(90deg, transparent, rgba(20,61,48,0.35))", borderRadius: 1 }}/>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: T.muted, fontFamily: "'Syne', sans-serif" }}>
              Facility Directory
            </span>
          </motion.div>

          <motion.div variants={slide} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, flexShrink: 0,
              background: `linear-gradient(145deg, #059669ee, ${T.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 14px 36px rgba(20,61,48,0.30)",
            }}>
              <Building2 size={28} color="white" />
            </div>
            <h1 style={{
              fontWeight: 800, fontSize: "clamp(34px, 5vw, 58px)",
              color: T.text, lineHeight: 1.0, letterSpacing: "-0.04em",
              fontFamily: "'Syne', sans-serif",
            }}>
              Available{" "}
              <span style={{
                backgroundImage: "linear-gradient(135deg, #059669 0%, #143D30 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", fontStyle: "italic",
              }}>
                Hospitals
              </span>
            </h1>
          </motion.div>

          <motion.p variants={slide} style={{ fontSize: 15, color: "#64748B", margin: 0, lineHeight: 1.6, maxWidth: 500 }}>
            Browse every registered facility on the Cura network — complete with specialist count and website bot integration status.
          </motion.p>

          {/* Summary pills */}
          {!loading && (
            <motion.div variants={slide} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
              {[
                { icon: <Building2 size={13} />, label: `${hospitals.length} ${hospitals.length === 1 ? "Hospital" : "Hospitals"}` },
                { icon: <Stethoscope size={13} />, label: `${totalDoctors} Total Doctors` },
                { icon: <MessageSquare size={13} />, label: `${hospitals.length} Virtual Assistants` },
              ].map((pill) => (
                <div key={pill.label} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 999,
                  background: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(20,61,48,0.10)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  color: T.blue,
                }}>
                  {pill.icon}
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: T.sub, fontFamily: "'Syne', sans-serif" }}>
                    {pill.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Search bar */}
          <motion.div variants={slide} style={{ position: "relative", maxWidth: 460 }}>
            <Search size={15} style={{ position: "absolute", left: 17, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", paddingLeft: 46, paddingRight: 20,
                paddingTop: 14, paddingBottom: 14,
                background: "rgba(255,255,255,0.92)",
                border: "1.5px solid rgba(20,61,48,0.12)",
                borderRadius: 16, fontSize: 14, fontWeight: 500, color: T.text,
                outline: "none", boxSizing: "border-box",
                backdropFilter: "blur(20px)",
                boxShadow: "0 2px 12px rgba(20,61,48,0.06)",
                transition: "all 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = "0 0 0 4px rgba(20,61,48,0.09)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(20,61,48,0.12)"; e.target.style.boxShadow = "0 2px 12px rgba(20,61,48,0.06)"; }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── CONTENT ── */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 3rem 100px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 260, gap: 12 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid rgba(20,61,48,0.15)`, borderTopColor: T.blue }}
            />
            <span style={{ color: T.muted, fontSize: 14, fontWeight: 600 }}>Loading hospitals…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: 480, margin: "60px auto", textAlign: "center",
              padding: "2rem", background: "#FEF2F2",
              border: "1px solid #FECACA", borderRadius: 20,
            }}
          >
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#DC2626", marginBottom: 8 }}>
              Failed to Load
            </p>
            <p style={{ color: "#EF4444", fontSize: 13 }}>{error}</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "80px 0" }}
          >
            <div style={{ fontSize: 52, marginBottom: 18 }}>🏥</div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 8 }}>
              {search ? "No results found" : "No hospitals registered yet"}
            </p>
            <p style={{ color: T.muted, fontSize: 14, maxWidth: 320, margin: "0 auto" }}>
              {search
                ? `No facilities match "${search}". Try a different search.`
                : "Hospitals added by the admin will appear here automatically."}
            </p>
          </motion.div>
        )}

        {/* Results */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.28em", color: T.muted, marginBottom: 22,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {filtered.length} {filtered.length === 1 ? "Facility" : "Facilities"}
              {search ? ` · matching "${search}"` : " · Registered"}
            </motion.p>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 18,
              }}
            >
              {filtered.map((hospital, i) => (
                <HospitalCard
                  key={hospital.id}
                  hospital={hospital}
                  doctorCount={doctorCounts[hospital.id] || 0}
                  index={hospitals.indexOf(hospital)}
                />
              ))}
            </motion.div>
          </>
        )}
      </section>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          textAlign: "center", paddingBottom: 32, position: "relative", zIndex: 1,
          fontSize: 10, color: "#CBD5E1", fontWeight: 800,
          textTransform: "uppercase", letterSpacing: "0.3em",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        © 2026 Cura — Healthcare OS
      </motion.p>
    </div>
  );
}
