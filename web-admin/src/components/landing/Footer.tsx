"use client";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(100,140,255,0.08)", padding: "64px 0 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr", gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #4F7CFF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: 16, height: 16, color: "white" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>Jahera</span>
            </div>
            <p style={{ fontSize: 13, color: "#5A6A94", lineHeight: 1.6 }}>AI bedtime stories that build character. Made with love for parents.</p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#F0F4FF", marginBottom: 16 }}>Product</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Features", "Pricing", "FAQ", "Download"].map((l) => (
                <a key={l} href={l === "Download" ? "https://play.google.com/store/apps/details?id=com.hindi.harp" : `#${l.toLowerCase()}`}
                  style={{ fontSize: 13, color: "#5A6A94", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#5A6A94")}
                >{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#F0F4FF", marginBottom: 16 }}>Company</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Privacy Policy", "/privacy"], ["Terms", "/terms"], ["Contact", "mailto:support@jahera.app"]].map(([l, h]) => (
                <a key={l} href={h} style={{ fontSize: 13, color: "#5A6A94", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#5A6A94")}
                >{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#F0F4FF", marginBottom: 16 }}>Languages</h4>
            <p style={{ fontSize: 13, color: "#5A6A94", lineHeight: 1.6 }}>English, Hindi, Urdu, Arabic, Spanish, French, Bengali, Mandarin, Japanese, and 15+ more.</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(100,140,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: "#5A6A94" }}>\u00a9 2026 Jahera. All rights reserved.</p>
          <p style={{ fontSize: 12, color: "#5A6A94" }}>COPPA Compliant \u00b7 No Ads \u00b7 No Data Sold</p>
        </div>
      </div>
    </footer>
  );
}