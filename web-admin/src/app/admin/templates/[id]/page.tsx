import { createAdminClient } from "@/lib/appwrite";
import Link from "next/link";

async function getTemplate(id: string) {
  try {
    const { databases } = createAdminClient();
    const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";
    return await databases.getDocument(db, "story_templates", id);
  } catch {
    return null;
  }
}

export default async function TemplateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTemplate(id);

  if (!t) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Template not found</p>
        <Link href="/admin/templates" className="text-amber-400 text-sm mt-4 inline-block">← Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/templates" className="text-[13px] text-zinc-600 hover:text-white transition-colors">
        ← Back to templates
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title_template}</h1>
        <div className="flex gap-2 mt-3">
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 font-medium">{t.behavior_goal}</span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">{t.theme}</span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">{t.mood}</span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-500/10 text-zinc-400 font-medium">{t.language_code}</span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 font-medium font-mono">{t.word_count}w</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Story Content</h2>
          <div className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto pr-4">
            {t.content_template}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Placeholders</h2>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(t.placeholder_fields || "[]").map((p: string) => (
                <span key={p} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-medium">
                  {"{"}{p}{"}"}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Metadata</h2>
            <div className="space-y-3 text-[12px]">
              {[
                ["Created", new Date(t.$createdAt).toLocaleString()],
                ["Updated", new Date(t.$updatedAt).toLocaleString()],
                ["ID", t.$id],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-zinc-600">{label}</span>
                  <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[180px]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
