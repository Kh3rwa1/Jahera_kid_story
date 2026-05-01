"use client";
import { motion } from "motion/react";

const GOALS = [
  { name: "Confidence", emoji: "\ud83d\udcaa" }, { name: "Kindness", emoji: "\ud83d\udc9d" },
  { name: "Discipline", emoji: "\ud83c\udfaf" }, { name: "Courage", emoji: "\ud83e\udd81" },
  { name: "Honesty", emoji: "\u2b50" }, { name: "Sharing", emoji: "\ud83e\udd1d" },
  { name: "Calmness", emoji: "\ud83e\uddd8" }, { name: "Empathy", emoji: "\ud83e\udec2" },
  { name: "Gratitude", emoji: "\ud83d\ude4f" }, { name: "Teamwork", emoji: "\ud83c\udfc6" },
  { name: "Curiosity", emoji: "\ud83d\udd2c" }, { name: "Responsibility", emoji: "\ud83c\udf1f" },
];

export default function Goals() {
  return (
    <section style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            One goal per night.<br /><span style={{ color: "#5A6A94" }}>A lifetime of character.</span>
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          {GOALS.map((g, i) => (
            <motion.div key={g.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className="glass-card" style={{ padding: "24px 12px", textAlign: "center" }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{g.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#F0F4FF" }}>{g.name}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}