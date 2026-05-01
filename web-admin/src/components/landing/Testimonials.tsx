"use client";
import { motion } from "motion/react";
import { Quote } from "lucide-react";

const REVIEWS = [
  { name: "Priya M.", role: "Mom of 2", text: "My son now asks for his \u2018courage story\u2019 every night. He\u2019s noticeably braver at school." },
  { name: "Ahmed R.", role: "Dad", text: "The Hindi Dadi voice reminds my daughter of her real grandmother. She falls asleep smiling every night." },
  { name: "Sarah L.", role: "Mom", text: "Finally an app that doesn\u2019t bombard my kid with ads. The personalization is incredible." },
  { name: "Raj K.", role: "Dad of 3", text: "Jahera\u2019s stories actually changed my kids\u2019 behavior. The sharing goal worked in a week." },
  { name: "Fatima A.", role: "Mom", text: "Available in Urdu! My children hear stories in our mother tongue with their own names." },
  { name: "David T.", role: "Dad", text: "The quiz after each story is brilliant. My daughter actually remembers the lessons." },
];

export default function Testimonials() {
  return (
    <section style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em" }}>Parents love Jahera.</h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {REVIEWS.map((r, i) => (
            <motion.div key={r.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="glass-card" style={{ padding: 32 }}
            >
              <Quote style={{ width: 28, height: 28, color: "#4F7CFF", opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: "#8B9CC7", lineHeight: 1.7, marginBottom: 24 }}>\u201c{r.text}\u201d</p>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#F0F4FF" }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#5A6A94" }}>{r.role}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}