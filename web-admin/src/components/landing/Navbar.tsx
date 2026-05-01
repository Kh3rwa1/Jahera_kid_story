"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Sparkles } from "lucide-react";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? "rgba(5,10,24,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(30px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(30px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(100,140,255,0.08)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4F7CFF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles style={{ width: 18, height: 18, color: "white" }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Jahera</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 36 }} className="hidden md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} style={{ fontSize: 14, color: "#8B9CC7", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8B9CC7")}
              >{l.label}</a>
            ))}
          </div>
          <a href="https://play.google.com/store/apps/details?id=com.hindi.harp" className="btn-primary hidden md:inline-flex" style={{ fontSize: 14, padding: "10px 24px" }}>
            Download Free
          </a>
          <button className="md:hidden" onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "white" }}>
            {open ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(5,10,24,0.95)", backdropFilter: "blur(30px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}
          >
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ fontSize: 28, color: "white", textDecoration: "none", fontWeight: 600 }}>{l.label}</a>
            ))}
            <a href="https://play.google.com/store/apps/details?id=com.hindi.harp" className="btn-primary" style={{ fontSize: 18, padding: "14px 32px", marginTop: 16 }}>Download Free</a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}