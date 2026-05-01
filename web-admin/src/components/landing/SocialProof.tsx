"use client";
import { motion } from "motion/react";

const STATS = [
  { value: "12+", label: "Behavior Goals" },
  { value: "24+", label: "Languages" },
  { value: "5", label: "Voice Personas" },
  { value: "\u221e", label: "Unique Stories" },
];

export default function SocialProof() {
  return (
    <section style={{ position: "relative", zIndex: 10, padding: "64px 0", borderTop: "1px solid rgba(100,140,255,0.08)", borderBottom: "1px solid rgba(100,140,255,0.08)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <p style={{ textAlign: "center", fontSize: 13, color: "#5A6A94", marginBottom: 40, letterSpacing: "0.05em", textTransform: "uppercase" }}>Trusted by parents across 12+ countries</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass-card" style={{ padding: "32px 24px", textAlign: "center" }}
            >
              <div style={{ fontSize: 40, fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#5A6A94", fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}