"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Check, AlertCircle, Sparkles, RefreshCw, Eye, Trash2 } from "lucide-react";

interface Habit {
  id: string;
  label: string;
  emoji: string;
  category: string;
  lottieUrl: string;
  previewUrl: string;
}

interface Props {
  habits: Habit[];
  endpoint: string;
  project: string;
  bucket: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  emotional: "#F472B6",
  social: "#4F7CFF",
  discipline: "#FB923C",
  cognitive: "#34D399",
};

const CATEGORY_LABELS: Record<string, string> = {
  emotional: "Emotional Growth",
  social: "Social Skills",
  discipline: "Habits & Discipline",
  cognitive: "Thinking Skills",
};

export default function HabitsClient({ habits, endpoint, project, bucket }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [previews, setPreviews] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>("all");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const categories = ["all", "emotional", "social", "discipline", "cognitive"];
  const filtered = filter === "all" ? habits : habits.filter((h) => h.category === filter);

  const handleUpload = async (habitId: string, file: File) => {
    if (!file.name.endsWith(".json")) {
      setStatus((p) => ({ ...p, [habitId]: { ok: false, msg: "Must be a .json Lottie file" } }));
      return;
    }

    setUploading(habitId);
    setStatus((p) => ({ ...p, [habitId]: { ok: true, msg: "Uploading..." } }));

    try {
      // First try to delete existing file
      try {
        await fetch(`/api/habits`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId }),
        });
      } catch {}

      // Upload new file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("habitId", habitId);

      const res = await fetch(`/api/habits`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setStatus((p) => ({ ...p, [habitId]: { ok: true, msg: "Uploaded! Animation updated." } }));
        // Force refresh preview
        setPreviews((p) => ({ ...p, [habitId]: false }));
        setTimeout(() => setPreviews((p) => ({ ...p, [habitId]: true })), 500);
      } else {
        setStatus((p) => ({ ...p, [habitId]: { ok: false, msg: json.error || "Upload failed" } }));
      }
    } catch (err: any) {
      setStatus((p) => ({ ...p, [habitId]: { ok: false, msg: err.message || "Upload failed" } }));
    }

    setUploading(null);
  };

  const togglePreview = (id: string) => {
    setPreviews((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          <Sparkles className="inline w-7 h-7 mr-2 text-[#FB923C]" />
          Nature & Habits
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage Lottie animations for each behavior goal. Upload .json files from LottieFiles.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="btn-glass text-xs px-3 py-1.5"
            style={{
              background: filter === cat ? (CATEGORY_COLORS[cat] || "#4F7CFF") + "20" : undefined,
              borderColor: filter === cat ? (CATEGORY_COLORS[cat] || "#4F7CFF") : undefined,
              color: filter === cat ? "#F0F4FF" : undefined,
            }}
          >
            {cat === "all" ? "All Goals" : CATEGORY_LABELS[cat] || cat}
            {cat !== "all" && ` (${habits.filter((h) => h.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Goals</span>
          <div className="text-2xl font-bold text-white mt-2">{habits.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Emotional</span>
          <div className="text-2xl font-bold text-[#F472B6] mt-2">{habits.filter((h) => h.category === "emotional").length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Social</span>
          <div className="text-2xl font-bold text-[#4F7CFF] mt-2">{habits.filter((h) => h.category === "social").length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Discipline</span>
          <div className="text-2xl font-bold text-[#FB923C] mt-2">{habits.filter((h) => h.category === "discipline").length}</div>
        </motion.div>
      </div>

      {/* Habit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((h, i) => {
          const color = CATEGORY_COLORS[h.category] || "#4F7CFF";
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card p-5"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: color + "15",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  {h.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{h.label}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: color + "20", color }}>
                    {CATEGORY_LABELS[h.category]}
                  </span>
                </div>
              </div>

              {/* Lottie Preview */}
              <AnimatePresence>
                {previews[h.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 200, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-4 rounded-lg overflow-hidden"
                    style={{ background: "#0A0F1E" }}
                  >
                    <iframe
                      src={`https://lottie.host/embed?src=${encodeURIComponent(h.lottieUrl)}&autoplay=true&loop=true`}
                      style={{ width: "100%", height: 200, border: "none" }}
                      title={h.label}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status */}
              {status[h.id] && (
                <div className={`text-xs mb-3 flex items-center gap-1 ${status[h.id].ok ? "text-[#34D399]" : "text-[#F87171]"}`}>
                  {status[h.id].ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {status[h.id].msg}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => togglePreview(h.id)}
                  className="btn-glass text-xs flex items-center gap-1 px-3 py-1.5 flex-1"
                >
                  <Eye className="w-3 h-3" />
                  {previews[h.id] ? "Hide" : "Preview"}
                </button>

                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={(el) => { fileRefs.current[h.id] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(h.id, file);
                    e.target.value = "";
                  }}
                />

                <button
                  onClick={() => fileRefs.current[h.id]?.click()}
                  disabled={uploading === h.id}
                  className="btn-glass text-xs flex items-center gap-1 px-3 py-1.5 flex-1"
                  style={{ background: color + "15", borderColor: color + "40" }}
                >
                  {uploading === h.id ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-3 h-3" /> Replace</>
                  )}
                </button>
              </div>

              {/* File ID hint */}
              <p className="text-[10px] text-[var(--text-muted)] mt-2 font-mono">
                ID: {h.id} &middot; Bucket: behavior_assets
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
