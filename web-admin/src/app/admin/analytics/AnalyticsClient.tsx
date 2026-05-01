"use client";
import { motion } from "motion/react";
import { BarChart3, BookOpen, Users, Type, Volume2 } from "lucide-react";
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

interface AnalyticsData {
  storiesPerDay: Array<{ date: string; count: number }>;
  langDist: Array<{ name: string; value: number }>;
  goalDist: Array<{ name: string; value: number }>;
  themeDist: Array<{ name: string; value: number }>;
  totalStories: number;
  totalUsers: number;
  avgWords: number;
  audioRate: number;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  "Total Stories": <BookOpen className="w-4 h-4 text-[#8B5CF6]" />,
  "Total Users": <Users className="w-4 h-4 text-[#22D3EE]" />,
  "Avg Words": <Type className="w-4 h-4 text-[#FB923C]" />,
  "Audio Rate": <Volume2 className="w-4 h-4 text-[#34D399]" />,
};

export default function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const STATS = [
    { label: "Total Stories", value: data.totalStories },
    { label: "Total Users", value: data.totalUsers },
    { label: "Avg Words", value: data.avgWords },
    { label: "Audio Rate", value: `${data.audioRate}%` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)]">Platform usage and content insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

      {/* Stories per day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 mb-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--accent-blue)]" />
          Stories Per Day
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.storiesPerDay}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F7CFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F7CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#5A6A94", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fill: "#5A6A94", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,25,60,0.9)",
                  border: "1px solid rgba(100,140,255,0.2)",
                  borderRadius: "8px",
                  color: "#F0F4FF",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#4F7CFF" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Languages</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.langDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                  {data.langDist.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,25,60,0.9)", border: "1px solid rgba(100,140,255,0.2)", borderRadius: "8px", color: "#F0F4FF", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.langDist.map((l, i) => (
              <span key={l.name} className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                {l.name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Goals</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.goalDist} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: "#8B9CC7", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "rgba(15,25,60,0.9)", border: "1px solid rgba(100,140,255,0.2)", borderRadius: "8px", color: "#F0F4FF", fontSize: "12px" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.goalDist.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Themes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Themes</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.themeDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                  {data.themeDist.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,25,60,0.9)", border: "1px solid rgba(100,140,255,0.2)", borderRadius: "8px", color: "#F0F4FF", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.themeDist.map((t, i) => (
              <span key={t.name} className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                {t.name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
