"use client";
import { motion } from "motion/react";
import { Check, Crown } from "lucide-react";

const FREE = ["3 stories per day", "12 behavior goals", "2 voice personas", "5 languages", "Offline playback", "Quiz after each story", "No ads ever"];
const PREMIUM = ["Unlimited stories", "12 behavior goals", "5 voice personas", "24+ languages", "Offline playback", "Quiz after each story", "Priority audio generation", "Family member personalization", "Progress analytics", "Bedtime reminders"];

export default function Pricing() {
  return (
    <section id="pricing" style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em" }}>Start free. Upgrade when ready.</h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card" style={{ padding: 40 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F0F4FF", marginBottom: 8 }}>Free</h3>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>$0</div>
            <p style={{ fontSize: 14, color: "#5A6A94", marginBottom: 32 }}>Forever free. No credit card.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {FREE.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#8B9CC7" }}>
                  <Check style={{ width: 16, height: 16, color: "#4F7CFF", flexShrink: 0 }} /> {f}
                </div>
              ))}
            </div>
            <a href="https://play.google.com/store/apps/details?id=com.hindi.harp" className="btn-glass" style={{ display: "block", textAlign: "center", width: "100%" }}>Download Free</a>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ background: "rgba(15,25,60,0.55)", backdropFilter: "blur(20px)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 20, padding: 40, position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, background: "linear-gradient(135deg, #8B5CF6, #4F7CFF)", color: "white", fontSize: 11, fontWeight: 700, padding: "6px 16px", borderBottomLeftRadius: 12 }}>POPULAR</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Crown style={{ width: 20, height: 20, color: "#8B5CF6" }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F0F4FF" }}>Premium</h3>
            </div>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>$4.99<span style={{ fontSize: 18, color: "#5A6A94", fontWeight: 400 }}>/mo</span></div>
            <p style={{ fontSize: 14, color: "#5A6A94", marginBottom: 32 }}>Or $39.99/year (save 33%)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {PREMIUM.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#8B9CC7" }}>
                  <Check style={{ width: 16, height: 16, color: "#8B5CF6", flexShrink: 0 }} /> {p}
                </div>
              ))}
            </div>
            <a href="https://play.google.com/store/apps/details?id=com.hindi.harp" className="btn-primary" style={{ display: "block", textAlign: "center", width: "100%" }}>Start 7-Day Free Trial</a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}