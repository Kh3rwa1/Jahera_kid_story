"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Music, FileText, Database, Scissors } from "lucide-react";

interface Template {
  id: string;
  title: string;
  goal: string;
  lang: string;
}

interface Data {
  templates: Template[];
  totalTemplates: number;
  totalSegments: number;
  totalCache: number;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  Templates: <FileText className="w-4 h-4 text-[#4F7CFF]" />,
  Segments: <Scissors className="w-4 h-4 text-[#8B5CF6]" />,
  Cached: <Database className="w-4 h-4 text-[#34D399]" />,
};

export default function AudioClient({ data }: { data: Data }) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const splitTemplate = async (templateId: string) => {
    setProcessing(templateId);
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const json = await res.json();
      setResults((p) => ({ ...p, [templateId]: `Split: ${json.total} segments (${json.static} static, ${json.placeholder} personalized)` }));
    } catch {
      setResults((p) => ({ ...p, [templateId]: "Error splitting" }));
    }
    setProcessing(null);
  };

  const STATS = [
    { label: "Templates", value: data.totalTemplates },
    { label: "Segments", value: data.totalSegments },
    { label: "Cached", value: data.totalCache },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Audio Management</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Segment-based audio generation with ElevenLabs
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{s.label}</span>
              {STAT_ICONS[s.label]}
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        {data.templates.slice(0, 30).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <Music className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{t.title}</div>
              <div className="flex gap-2 mt-1">
                <span className="badge badge-blue">{t.goal}</span>
                <span className="badge badge-cyan">{t.lang}</span>
              </div>
            </div>
            {results[t.id] && (
              <span className="text-xs text-[var(--accent-green)]">{results[t.id]}</span>
            )}
            <button
              onClick={() => splitTemplate(t.id)}
              disabled={processing === t.id}
              className="btn-glass text-xs flex items-center gap-1 px-3 py-1.5"
            >
              <Scissors className="w-3 h-3" />
              {processing === t.id ? "Splitting..." : "Split"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
