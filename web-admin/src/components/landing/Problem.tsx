"use client";
import { motion } from "motion/react";
import { X, Check, Sparkles } from "lucide-react";

const FAILS = ["Lectures don\u2019t land", "Reward charts lose steam", "Screen-time battles exhaust everyone", "Moralizing gets tuned out"];
const WINS = ["Stories are absorbed, not resisted", "Your child becomes the hero", "Values are experienced, not taught", "Habits form through imagination"];

export default function Problem() {
  return (
    <section style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Most habit advice for parents<br /><span style={{ color: "#5A6A94" }}>doesn\u2019t work.</span>
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 20, padding: 40 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#EF4444", marginBottom: 24 }}>What parents try</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {FAILS.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: "#8B9CC7" }}>
                  <X style={{ width: 18, height: 18, color: "#EF4444", flexShrink: 0 }} /> {f}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 20, padding: 40 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#34D399", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles style={{ width: 18, height: 18 }} /> What actually works
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {WINS.map((w) => (
                <div key={w} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: "#8B9CC7" }}>
                  <Check style={{ width: 18, height: 18, color: "#34D399", flexShrink: 0 }} /> {w}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}