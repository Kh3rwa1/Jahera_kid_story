"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, BookOpen, Volume2, VolumeX, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Story {
  id: string;
  title: string;
  profileId: string;
  goal: string;
  theme: string;
  mood: string;
  lang: string;
  words: number;
  audio: boolean;
  city: string;
  content: string;
  date: string;
}

export default function StoriesClient({ data }: { data: { stories: Story[]; total: number } }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = data.stories.filter(
    (s) => !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Generated Stories</h1>
        <p className="text-sm text-[var(--text-muted)]">{data.total} stories generated</p>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search stories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <BookOpen className="w-4 h-4 text-[var(--accent-purple)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {s.title}
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {s.goal && <span className="badge badge-blue">{s.goal}</span>}
                  {s.theme && <span className="badge badge-purple">{s.theme}</span>}
                  <span className="badge badge-cyan">{s.lang}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {s.audio ? (
                  <Volume2 className="w-4 h-4 text-[var(--accent-green)]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
                )}
                <span className="text-xs text-[var(--text-muted)]">{s.words}w</span>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(s.date).toLocaleDateString()}
                </div>
                {expanded === s.id ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {expanded === s.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-[var(--border-glass)]"
                >
                  <div className="p-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {s.content || "No content available"}
                    </p>
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
