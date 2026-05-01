"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, FileText, ChevronDown, ChevronUp, Eye } from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  title: string;
  goal: string;
  theme: string;
  mood: string;
  lang: string;
  words: number;
  content: string;
  placeholders: string;
  date: string;
}

interface Data {
  templates: Template[];
  total: number;
  goals: string[];
  themes: string[];
}

const GOAL_COLORS: Record<string, string> = {
  confidence: "badge-blue",
  sharing: "badge-green",
  kindness: "badge-pink",
  discipline: "badge-orange",
  courage: "badge-cyan",
  honesty: "badge-purple",
  empathy: "badge-pink",
  calmness: "badge-blue",
  gratitude: "badge-green",
  teamwork: "badge-cyan",
  curiosity: "badge-purple",
  responsibility: "badge-orange",
  less_screen: "badge-red",
};

export default function TemplatesClient({ data }: { data: Data }) {
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = data.templates.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (goalFilter && t.goal !== goalFilter) return false;
    if (themeFilter && t.theme !== themeFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Story Templates</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {data.total} templates · {data.goals.length} goals · {data.themes.length} themes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 text-sm appearance-none min-w-[150px]"
          >
            <option value="">All Goals</option>
            {data.goals.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          className="px-4 py-2.5 text-sm appearance-none min-w-[140px]"
        >
          <option value="">All Themes</option>
          {data.themes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4">
        Showing {filtered.length} of {data.total}
      </p>

      {/* Templates list */}
      <div className="space-y-2">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <FileText className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {t.title}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={`badge ${GOAL_COLORS[t.goal] || "badge-blue"}`}>
                    {t.goal}
                  </span>
                  <span className="badge badge-purple">{t.theme}</span>
                  <span className="badge badge-cyan">{t.lang}</span>
                  {t.mood && <span className="badge badge-orange">{t.mood}</span>}
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                {t.words}w
              </span>
              {expanded === t.id ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
            <AnimatePresence>
              {expanded === t.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-[var(--border-glass)]"
                >
                  <div className="p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-wider">Content Preview</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                      {t.content.slice(0, 500)}{t.content.length > 500 ? "..." : ""}
                    </p>
                    {t.placeholders && (
                      <div className="mt-3">
                        <p className="text-xs text-[var(--text-muted)] mb-1">Placeholders</p>
                        <p className="text-xs text-[var(--accent-cyan)]">{t.placeholders}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
