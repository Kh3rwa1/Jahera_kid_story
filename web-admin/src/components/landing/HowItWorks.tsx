"use client";
import { motion } from "motion/react";
import { Target, Wand2, Headphones } from "lucide-react";

const STEPS = [
  { num: "01", icon: Target, title: "Choose a Habit", desc: "Pick the value you want your child to internalize tonight \u2014 courage, kindness, discipline, or any of 12 goals.", color: "#4F7CFF" },
  { num: "02", icon: Wand2, title: "We Generate the Story", desc: "AI creates a personalized adventure with your child as the hero, modeling the exact behavior you chose.", color: "#8B5CF6" },
  { num: "03", icon: Headphones, title: "Listen Together", desc: "Beautiful narration in your language. Your child doesn\u2019t just hear values \u2014 they experience them.", color: "#22D3EE" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em" }}>Three steps to better bedtimes.</h2>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              style={{ display: "flex", gap: 24, alignItems: "flex-start" }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 18, background: s.color + "12", border: "1px solid " + s.color + "25", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <s.icon style={{ width: 28, height: 28, color: s.color }} />
              </div>
              <div className="glass-card" style={{ padding: 32, flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>Step {s.num}</span>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F0F4FF", margin: "8px 0 10px" }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "#8B9CC7", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}