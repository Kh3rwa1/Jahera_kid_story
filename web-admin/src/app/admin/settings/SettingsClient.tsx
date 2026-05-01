"use client";
import { motion } from "motion/react";
import { Settings, Database, Key, Server, Shield } from "lucide-react";

interface SettingsData {
  config: Array<Record<string, unknown>>;
  apiKeys: number;
  collections: number;
}

const SETTING_ICONS: Record<string, React.ReactNode> = {
  Collections: <Database className="w-4 h-4 text-[#4F7CFF]" />,
  "API Keys": <Key className="w-4 h-4 text-[#8B5CF6]" />,
  "Config Items": <Settings className="w-4 h-4 text-[#22D3EE]" />,
  Backend: <Server className="w-4 h-4 text-[#34D399]" />,
};

export default function SettingsClient({ data }: { data: SettingsData }) {
  const CARDS = [
    { label: "Collections", value: data.collections },
    { label: "API Keys", value: data.apiKeys },
    { label: "Config Items", value: data.config.length },
    { label: "Backend", value: "Appwrite" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">Platform configuration and system info</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{s.label}</span>
              {SETTING_ICONS[s.label]}
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* System Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-[var(--accent-blue)]" />
            Infrastructure
          </h3>
          <div className="space-y-3 text-sm">
            {[
              ["Backend", "Appwrite Cloud (SFO)"],
              ["Database", "jahera_db (16 collections)"],
              ["Hosting", "Vercel (Edge)"],
              ["TTS", "ElevenLabs Multilingual v2"],
              ["AI", "Google Gemini 2.0 via OpenRouter"],
              ["Payments", "RevenueCat (planned)"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[var(--text-muted)]">{k}</span>
                <span className="text-[var(--text-secondary)]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--accent-green)]" />
            Security & Compliance
          </h3>
          <div className="space-y-3 text-sm">
            {[
              ["COPPA", "Compliant"],
              ["DPDP (India)", "Compliant"],
              ["Child Accounts", "None (parent-only)"],
              ["Data Collection", "Minimal"],
              ["Ads", "None"],
              ["AI Safety", "Server-side filter + 20 fallback stories"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[var(--text-muted)]">{k}</span>
                <span className="text-[var(--accent-green)]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.config.length > 0 && (
        <div className="glass-card p-6 mt-6">
          <h3 className="text-sm font-semibold text-white mb-4">Config Values</h3>
          <div className="space-y-2">
            {data.config.map((c) => (
              <div key={String(c.id)} className="flex items-center gap-4 text-sm p-2 rounded-lg hover:bg-white/[0.02]">
                <span className="text-[var(--text-muted)] font-mono text-xs">{String(c.id)}</span>
                <span className="text-[var(--text-secondary)]">
                  {JSON.stringify(Object.fromEntries(Object.entries(c).filter(([k]) => k !== "id"))).slice(0, 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
