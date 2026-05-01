"use client";
import { motion } from "motion/react";
import { Download } from "lucide-react";

export default function CTA() {
  return (
    <section style={{ position: "relative", zIndex: 10, padding: "80px 0" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          style={{ background: "linear-gradient(135deg, rgba(79,124,255,0.12), rgba(139,92,246,0.08))", border: "1px solid rgba(100,140,255,0.15)", borderRadius: 24, padding: "80px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}
        >
          <div className="breathing-orb" style={{ width: 300, height: 300, background: "#4F7CFF", top: -100, left: -100, position: "absolute" }} />
          <div className="breathing-orb" style={{ width: 200, height: 200, background: "#8B5CF6", bottom: -60, right: -60, position: "absolute", animationDelay: "3s" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em", marginBottom: 20 }}>Start tonight.</h2>
            <p style={{ fontSize: 18, color: "#8B9CC7", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
              The habits your child builds before age 10 stay with them for life. One story at a time.
            </p>
            <a href="https://play.google.com/store/apps/details?id=com.hindi.harp" className="btn-primary animate-pulse-glow" style={{ fontSize: 17, padding: "18px 36px", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <Download style={{ width: 20, height: 20 }} />
              Download Jahera \u2014 It\u2019s Free
            </a>
            <p style={{ fontSize: 12, color: "#5A6A94", marginTop: 16 }}>Available on Android. iOS coming soon.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}