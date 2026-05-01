"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Download, Play, Shield, Globe, Zap } from "lucide-react";

const HABITS = ["Confidence & courage", "Kindness & empathy", "Better sleep routines", "Love of reading", "Emotional regulation", "Focus & discipline"];

export default function Hero() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setIdx((p) => (p + 1) % HABITS.length), 2800);
    return () => clearInterval(i);
  }, []);

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingTop: 72 }}>
      <div className="breathing-orb" style={{ width: 700, height: 700, background: "#4F7CFF", top: "-20%", left: "-15%" }} />
      <div className="breathing-orb" style={{ width: 500, height: 500, background: "#8B5CF6", bottom: "-15%", right: "-10%", animationDelay: "3s" }} />
      <div className="breathing-orb" style={{ width: 350, height: 350, background: "#22D3EE", top: "50%", right: "25%", animationDelay: "6s" }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
          <div className="glass-card" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", marginBottom: 40, fontSize: 13, color: "#8B9CC7", borderRadius: 9999 }}>
            <Zap style={{ width: 14, height: 14, color: "#22D3EE" }} />
            The bedtime story that builds character
          </div>

          <h1 style={{ fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#F0F4FF", marginBottom: 24 }}>
            One story.<br />One habit.<br />
            <span className="glow-text">
              <motion.span key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ display: "inline-block" }}>
                {HABITS[idx]}
              </motion.span>
            </span>
          </h1>

          <p style={{ fontSize: 20, color: "#8B9CC7", maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.7, letterSpacing: "-0.01em" }}>
            Jahera generates AI-powered bedtime stories where your child is the hero\u2009\u2014\u2009modeling courage, kindness, and discipline through adventures they\u2019ll ask for every night.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 56 }}>
            <a href="https://play.google.com/store/apps/details?id=com.hindi.harp" className="btn-primary animate-pulse-glow" style={{ fontSize: 16, padding: "16px 32px", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Download style={{ width: 20, height: 20 }} />
              Download Free
            </a>
            <a href="#how-it-works" className="btn-glass" style={{ fontSize: 16, padding: "16px 32px", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Play style={{ width: 20, height: 20 }} />
              See How It Works
            </a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 32, fontSize: 13, color: "#5A6A94" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Shield style={{ width: 16, height: 16, color: "#34D399" }} /> COPPA Compliant</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe style={{ width: 16, height: 16, color: "#22D3EE" }} /> 24+ Languages</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Zap style={{ width: 16, height: 16, color: "#FB923C" }} /> Stories in Seconds</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}