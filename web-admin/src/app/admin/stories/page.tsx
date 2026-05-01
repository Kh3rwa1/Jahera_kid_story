import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import StoriesClient from "./StoriesClient";

export const revalidate = 30;

async function getStories() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";
  const res = await databases.listDocuments(db, "stories", [
    Query.limit(100),
    Query.orderDesc("$createdAt"),
  ]);

  return {
    stories: res.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      title: String(d.title || "Untitled"),
      profileId: String(d.profile_id || ""),
      goal: String(d.behavior_goal || ""),
      theme: String(d.theme || ""),
      mood: String(d.mood || ""),
      lang: String(d.language_code || ""),
      words: Number(d.word_count || 0),
      audio: d.audio_url ? true : false,
      city: String(d.location_city || ""),
      content: String(d.content || ""),
      date: String(d.$createdAt),
    })),
    total: res.total,
  };
}

export default async function StoriesPage() {
  const data = await getStories();
  return <StoriesClient data={data} />;
}
