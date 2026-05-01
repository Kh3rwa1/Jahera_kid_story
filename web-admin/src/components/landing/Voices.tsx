"use client";
import { motion } from "motion/react";
import { Volume2 } from "lucide-react";

const VOICES = [
  { name: "Sarah (Mom)", desc: "Warm, calm & nurturing", lang: "29+ Languages", color: "#F472B6" },
  { name: "Liam (Dad)", desc: "Upbeat, energetic & fun", lang: "29+ Languages", color: "#4F7CFF" },
  { name: "Laura", desc: "Gentle, soothing & motherly", lang: "29+ Languages", color: "#FB923C" },
  { name: "Grandma Clo", desc: "Warm grandma storyteller", lang: "29+ Languages", color: "#8B5CF6" },
  { name: "Reva (Dadi)", desc: "Hindi Dadi, familiar & warm", lang: "HI, EN", color: "#34D399" },
];

export default function Voices() {
  return (
    <section style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em", marginBottom: 16 }}>Hear the magic.</h2>
          <p style={{ fontSize: 18, color: "#8B9CC7", maxWidth: 500, margin: "0 auto" }}>Five studio-quality AI voices. Each one designed to make bedtime feel like a warm hug.</p>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
          {VOICES.map((v, i) => (
            <motion.div key={v.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass-card glow-border" style={{ padding: "32px 20px", textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px", background: v.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Volume2 style={{ width: 24, height: 24, color: v.color }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F0F4FF", marginBottom: 4 }}>{v.name}</h3>
              <p style={{ fontSize: 12, color: "#5A6A94", marginBottom: 10 }}>{v.desc}</p>
              <span className="badge badge-blue" style={{ fontSize: 10 }}>{v.lang}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}