"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ChevronDown, ChevronUp, Save, ToggleLeft, ToggleRight } from "lucide-react";

interface Prompt {
  id: string;
  goal_id: string;
  system_prompt: string;
  psychology_notes: string;
  tone: string;
  narrative_technique: string;
  is_active: boolean;
  date: string;
}

export default function PromptsClient({ data }: { data: { prompts: Prompt[]; total: number } }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, Prompt>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const startEdit = (p: Prompt) => {
    setEditing((prev) => ({ ...prev, [p.id]: { ...p } }));
  };

  const updateField = (id: string, field: string, val: string | boolean) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: val },
    }));
  };

  const save = async (id: string) => {
    setSaving(id);
    const p = editing[id];
    try {
      await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          system_prompt: p.system_prompt,
          psychology_notes: p.psychology_notes,
          tone: p.tone,
          narrative_technique: p.narrative_technique,
          is_active: p.is_active,
        }),
      });
    } catch {}
    setSaving(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Behavior Prompts</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {data.total} psychology-backed system prompts for story generation
        </p>
      </div>

      <div className="space-y-3">
        {data.prompts.map((p, i) => {
          const ed = editing[p.id] || p;
          const isOpen = expanded === p.id;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => {
                  setExpanded(isOpen ? null : p.id);
                  if (!isOpen) startEdit(p);
                }}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <Brain className="w-5 h-5 text-[var(--accent-purple)] flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white capitalize">
                    {p.goal_id.replace(/_/g, " ")}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <span className="badge badge-purple">{p.tone || "—"}</span>
                    <span className={`badge ${p.is_active ? "badge-green" : "badge-red"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-[var(--border-glass)]"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                          System Prompt
                        </label>
                        <textarea
                          rows={6}
                          value={ed.system_prompt}
                          onChange={(e) => updateField(p.id, "system_prompt", e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                          Psychology Notes
                        </label>
                        <textarea
                          rows={3}
                          value={ed.psychology_notes}
                          onChange={(e) => updateField(p.id, "psychology_notes", e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                            Tone
                          </label>
                          <input
                            value={ed.tone}
                            onChange={(e) => updateField(p.id, "tone", e.target.value)}
                            className="w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">
                            Narrative Technique
                          </label>
                          <input
                            value={ed.narrative_technique}
                            onChange={(e) => updateField(p.id, "narrative_technique", e.target.value)}
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => updateField(p.id, "is_active", !ed.is_active)}
                          className="flex items-center gap-2 text-sm"
                        >
                          {ed.is_active ? (
                            <ToggleRight className="w-6 h-6 text-[var(--accent-green)]" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-[var(--text-muted)]" />
                          )}
                          <span className={ed.is_active ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"}>
                            {ed.is_active ? "Active" : "Inactive"}
                          </span>
                        </button>
                        <button
                          onClick={() => save(p.id)}
                          disabled={saving === p.id}
                          className="btn-primary flex items-center gap-2 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          {saving === p.id ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
