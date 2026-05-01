import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import AudioClient from "./AudioClient";

export const revalidate = 30;

async function getAudioData() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

  const [templates, segments, cache] = await Promise.all([
    databases.listDocuments(db, "story_templates", [Query.limit(100)]),
    databases.listDocuments(db, "audio_segments", [Query.limit(1)]).catch(() => ({ total: 0 })),
    databases.listDocuments(db, "audio_cache", [Query.limit(1)]).catch(() => ({ total: 0 })),
  ]);

  return {
    templates: templates.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id || ""),
      title: String(d.title_template || ""),
      goal: String(d.behavior_goal || ""),
      lang: String(d.language_code || ""),
    })),
    totalTemplates: templates.total,
    totalSegments: segments.total,
    totalCache: cache.total,
  };
}

export default async function AudioPage() {
  const data = await getAudioData();
  return <AudioClient data={data} />;
}
