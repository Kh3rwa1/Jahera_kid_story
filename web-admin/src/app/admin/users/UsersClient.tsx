"use client";
import { motion } from "motion/react";
import { Users, BookOpen, Globe, MapPin } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  age: string;
  lang: string;
  city: string;
  country: string;
  voiceId: string;
  stories: number;
  date: string;
}

export default function UsersClient({ data }: { data: { users: UserProfile[]; total: number } }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Users & Profiles</h1>
        <p className="text-sm text-[var(--text-muted)]">{data.total} profiles</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.users.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 glow-border"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white">{u.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Age {u.age} · Joined {new Date(u.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Globe className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                {u.lang || "—"}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                {u.city || u.country || "—"}
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <BookOpen className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                {u.stories} stories
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Users className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                {u.voiceId ? "Custom Voice" : "Default"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
