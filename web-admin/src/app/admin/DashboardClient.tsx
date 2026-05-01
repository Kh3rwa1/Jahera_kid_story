"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  BookOpen,
  Users,
  HelpCircle,
  CreditCard,
  Flame,
  Music,
  Database,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4F7CFF", "#8B5CF6", "#22D3EE", "#34D399", "#FB923C", "#F472B6", "#EF4444", "#FBBF24"];

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1200;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [target]);
  return <span className="stat-number">{val.toLocaleString()}</span>;
}

interface Stats {
  totals: Record<string, number>;
  recentStories: Array<Record<string, unknown>>;
  recentUsers: Array<Record<string, unknown>>;
  langDist: Array<{ name: string; value: number }>;
  goalDist: Array<{ name: string; value: number }>;
}

const CARD_ICONS: Record<string, React.ReactNode> = {
  Templates: <FileText className="w-4 h-4 text-[#4F7CFF]" />,
  Stories: <BookOpen className="w-4 h-4 text-[#8B5CF6]" />,
  Users: <Users className="w-4 h-4 text-[#22D3EE]" />,
  "Quiz Questions": <HelpCircle className="w-4 h-4 text-[#34D399]" />,
  Subscriptions: <CreditCard className="w-4 h-4 text-[#FB923C]" />,
  Streaks: <Flame className="w-4 h-4 text-[#F472B6]" />,
  "Audio Segments": <Music className="w-4 h-4 text-[#4F7CFF]" />,
  "Audio Cache": <Database className="w-4 h-4 text-[#8B5CF6]" />,
};

export default function DashboardClient({ stats }: { stats: Stats }) {
  const CARDS = [
    { label: "Templates", value: stats.totals.templates },
    { label: "Stories", value: stats.totals.stories },
    { label: "Users", value: stats.totals.profiles },
    { label: "Quiz Questions", value: stats.totals.quizzes },
    { label: "Subscriptions", value: stats.totals.subscriptions },
    { label: "Streaks", value: stats.totals.streaks },
    { label: "Audio Segments", value: stats.totals.segments },
    { label: "Audio Cache", value: stats.totals.cache },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
          Real-time overview of Jahera platform
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                {c.label}
              </span>
              {CARD_ICONS[c.label]}
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedNumber target={c.value} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Language Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4">
            Language Distribution
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.langDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.langDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,25,60,0.9)",
                    border: "1px solid rgba(100,140,255,0.2)",
                    borderRadius: "8px",
                    color: "#F0F4FF",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {stats.langDist.map((l, i) => (
              <div key={l.name} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {l.name} ({l.value})
              </div>
            ))}
          </div>
        </motion.div>

        {/* Goals Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4">
            Behavior Goals
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.goalDist} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "#8B9CC7", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,25,60,0.9)",
                    border: "1px solid rgba(100,140,255,0.2)",
                    borderRadius: "8px",
                    color: "#F0F4FF",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {stats.goalDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Stories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 md:col-span-2"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent-purple)]" />
            Recent Stories
          </h3>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Goal</th>
                  <th>Lang</th>
                  <th>Words</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentStories.map((s) => (
                  <tr key={String(s.id)}>
                    <td className="text-white font-medium max-w-[200px] truncate">
                      {String(s.title)}
                    </td>
                    <td>
                      <span className="badge badge-blue">{String(s.goal) || "—"}</span>
                    </td>
                    <td>
                      <span className="badge badge-cyan">{String(s.lang)}</span>
                    </td>
                    <td>{Number(s.words).toLocaleString()}w</td>
                    <td>
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(String(s.date)).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent-cyan)]" />
            Recent Users
          </h3>
          <div className="space-y-4">
            {stats.recentUsers.map((u) => (
              <div key={String(u.id)} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {String(u.name).charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {String(u.name)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Age {String(u.age)} · {String(u.lang)}{u.city ? ` · ${String(u.city)}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
