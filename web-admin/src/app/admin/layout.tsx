"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Brain,
  Music,
  HelpCircle,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/templates", label: "Story Templates", icon: FileText },
  { href: "/admin/stories", label: "Generated Stories", icon: BookOpen },
  { href: "/admin/users", label: "Users & Profiles", icon: Users },
  { href: "/admin/prompts", label: "Behavior Prompts", icon: Brain },
  { href: "/admin/audio", label: "Audio Engine", icon: Music },
  { href: "/admin/quizzes", label: "Quizzes", icon: HelpCircle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex" style={{ background: "#050A18" }}>
      {/* Background orbs */}
      <div
        className="breathing-orb"
        style={{ width: 600, height: 600, background: "#4F7CFF", top: "-15%", left: "-10%" }}
      />
      <div
        className="breathing-orb"
        style={{ width: 500, height: 500, background: "#8B5CF6", bottom: "-10%", right: "-5%", animationDelay: "4s" }}
      />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          background: "rgba(8, 14, 35, 0.92)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRight: "1px solid rgba(100, 140, 255, 0.1)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 12,
            borderBottom: "1px solid rgba(100, 140, 255, 0.08)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4F7CFF, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles style={{ width: 18, height: 18, color: "white" }} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                style={{ fontSize: 16, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden" }}
              >
                Jahera Admin
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px 14px" : "10px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#F0F4FF" : "#5A6A94",
                  background: active ? "linear-gradient(90deg, rgba(79,124,255,0.12) 0%, transparent 100%)" : "transparent",
                  borderLeft: active ? "2px solid #4F7CFF" : "2px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#8B9CC7";
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#5A6A94";
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <n.icon style={{ width: 18, height: 18, color: active ? "#4F7CFF" : "inherit", flexShrink: 0 }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                    >
                      {n.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: 12, borderTop: "1px solid rgba(100, 140, 255, 0.08)", display: "flex", flexDirection: "column", gap: 4 }}>
          {!collapsed && (
            <a
              href="https://jahera.app"
              target="_blank"
              rel="noopener"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#5A6A94",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 8,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5A6A94")}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
              View Live Site
            </a>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 8,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "#5A6A94",
              fontSize: 12,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F0F4FF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5A6A94")}
          >
            {collapsed ? <ChevronRight style={{ width: 16, height: 16 }} /> : (
              <>
                <ChevronLeft style={{ width: 16, height: 16 }} />
                Collapse
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 280 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{
          flex: 1,
          minHeight: "100vh",
          padding: "32px 40px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {children}
      </motion.main>
    </div>
  );
}
