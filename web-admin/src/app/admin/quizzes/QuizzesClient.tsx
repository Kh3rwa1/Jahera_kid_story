"use client";
import { motion } from "motion/react";
import { HelpCircle, ClipboardCheck, Clock } from "lucide-react";

interface Question {
  id: string;
  storyId: string;
  text: string;
  order: number;
  date: string;
}

export default function QuizzesClient({ data }: { data: { questions: Question[]; total: number; attempts: number } }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Quizzes</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {data.total} questions · {data.attempts} attempts
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Questions</span>
            <HelpCircle className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div className="text-2xl font-bold text-white">{data.total}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Attempts</span>
            <ClipboardCheck className="w-4 h-4 text-[var(--accent-green)]" />
          </div>
          <div className="text-2xl font-bold text-white">{data.attempts}</div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Story</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.questions.map((q, i) => (
              <motion.tr
                key={q.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="text-white font-medium">{q.order}</td>
                <td className="text-white max-w-[400px]">{q.text}</td>
                <td>
                  <span className="badge badge-purple text-xs">{q.storyId.slice(0, 8)}...</span>
                </td>
                <td className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(q.date).toLocaleDateString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
