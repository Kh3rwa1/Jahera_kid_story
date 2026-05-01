import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import TemplatesClient from "./TemplatesClient";

export const revalidate = 30;

async function getTemplates() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";
  const res = await databases.listDocuments(db, "story_templates", [
    Query.limit(100),
    Query.orderDesc("$createdAt"),
  ]);

  const goals = [...new Set(res.documents.map((d: Record<string, unknown>) => String(d.behavior_goal || "")))].filter(Boolean);
  const themes = [...new Set(res.documents.map((d: Record<string, unknown>) => String(d.theme || "")))].filter(Boolean);

  return {
    templates: res.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      title: String(d.title_template || ""),
      goal: String(d.behavior_goal || ""),
      theme: String(d.theme || ""),
      mood: String(d.mood || ""),
      lang: String(d.language_code || ""),
      words: Number(d.word_count || 0),
      content: String(d.content_template || ""),
      placeholders: String(d.placeholder_fields || ""),
      date: String(d.$createdAt),
    })),
    total: res.total,
    goals,
    themes,
  };
}

export default async function TemplatesPage() {
  const data = await getTemplates();
  return <TemplatesClient data={data} />;
}
