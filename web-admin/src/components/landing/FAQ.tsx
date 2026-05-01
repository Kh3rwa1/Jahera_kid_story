"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "Is Jahera safe for my child?", a: "Absolutely. COPPA-compliant with no child accounts, no tracking, no ads, and a server-side AI safety filter. Parents control everything." },
  { q: "How does habit-building through stories work?", a: "Based on bibliotherapy research, children who see themselves as the hero naturally internalize character traits. Your child experiences being brave, kind, or disciplined." },
  { q: "What languages are supported?", a: "24+ languages including English, Hindi, Urdu, Arabic, Spanish, French, Mandarin, Japanese, Korean, Bengali, Swahili, and more." },
  { q: "Does it work offline?", a: "Yes. Once generated, stories and audio are cached on your device. Listen anywhere without internet." },
  { q: "What age is Jahera designed for?", a: "Ages 3-10. Stories adjust complexity based on age. Younger kids get simpler adventures, older kids get richer narratives." },
  { q: "Is there a free version?", a: "Yes! Free tier includes 3 stories/day, 12 goals, 2 voices, 5 languages. Premium unlocks everything." },
  { q: "Can I cancel Premium anytime?", a: "Yes, cancel anytime through Google Play. No contracts, no hidden fees. Free access continues forever." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ position: "relative", zIndex: 10, padding: "120px 0" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 32px" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em" }}>Frequently asked questions.</h2>
        </motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQS.map((f, i) => (
            <div key={i} className="glass-card" style={{ overflow: "hidden" }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", background: "none", border: "none", textAlign: "left", color: "#F0F4FF", fontSize: 15, fontWeight: 600 }}
              >
                {f.q}
                <ChevronDown style={{ width: 18, height: 18, color: "#5A6A94", transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p style={{ padding: "0 24px 20px", fontSize: 14, color: "#8B9CC7", lineHeight: 1.7 }}>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}