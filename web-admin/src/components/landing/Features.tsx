"use client";
import { motion } from "motion/react";
import { Target, User, Globe, Mic, Library, ShieldCheck } from "lucide-react";

const FEATURES = [
  { icon: Target, title: "Habit-First Storytelling", desc: "Choose the habit you want to nurture. Jahera generates a story where your child naturally models that behavior.", color: "#4F7CFF" },
  { icon: User, title: "Deeply Personalized", desc: "Your child\u2019s name, their city, their friends \u2014 woven into every adventure. No two stories are the same.", color: "#8B5CF6" },
  { icon: Globe, title: "24+ Languages", desc: "English, Hindi, Urdu, Arabic, Spanish, French, Mandarin, Japanese, Bengali, Swahili and more.", color: "#22D3EE" },
  { icon: Mic, title: "Beautiful Narration", desc: "Five voice personas \u2014 Mom, Dad, Grandma, Fun Narrator, Hindi Dadi \u2014 studio-quality AI voices.", color: "#FB923C" },
  { icon: Library, title: "Growing Library", desc: "Every story is saved. Track habits. Replay favorites. Build a ritual your child loves.", color: "#34D399" },
  { icon: ShieldCheck, title: "Private & Ad-Free", desc: "No ads. No data sold. No child accounts. COPPA-compliant. You are the customer, not the product.", color: "#F472B6" },
];

export default function Features() {
  return (
    <section id="features" style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em" }}>Everything a bedtime ritual needs.</h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass-card glow-border" style={{ padding: 36 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: f.color + "15", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <f.icon style={{ width: 24, height: 24, color: f.color }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F0F4FF", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#8B9CC7", lineHeight: 1.7 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}