import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import DashboardClient from "./DashboardClient";

export const revalidate = 30;

async function getStats() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

  const [templates, stories, profiles, quizzes, subs, streaks, segments, cache] =
    await Promise.all([
      databases.listDocuments(db, "story_templates", [Query.limit(1)]),
      databases.listDocuments(db, "stories", [Query.limit(1)]),
      databases.listDocuments(db, "profiles", [Query.limit(1)]),
      databases.listDocuments(db, "quiz_questions", [Query.limit(1)]),
      databases.listDocuments(db, "subscriptions", [Query.limit(1)]),
      databases.listDocuments(db, "streaks", [Query.limit(1)]),
      databases.listDocuments(db, "audio_segments", [Query.limit(1)]).catch(() => ({ total: 0 })),
      databases.listDocuments(db, "audio_cache", [Query.limit(1)]).catch(() => ({ total: 0 })),
    ]);

  const recentStories = await databases.listDocuments(db, "stories", [
    Query.orderDesc("$createdAt"),
    Query.limit(8),
  ]);

  const recentUsers = await databases.listDocuments(db, "profiles", [
    Query.orderDesc("$createdAt"),
    Query.limit(6),
  ]);

  const allStories = await databases.listDocuments(db, "stories", [
    Query.limit(100),
  ]);

  const langs: Record<string, number> = {};
  const goals: Record<string, number> = {};
  allStories.documents.forEach((d: Record<string, unknown>) => {
    const lc = String(d.language_code || "unknown");
    langs[lc] = (langs[lc] || 0) + 1;
    const bg = String(d.behavior_goal || "none");
    goals[bg] = (goals[bg] || 0) + 1;
  });

  return {
    totals: {
      templates: templates.total,
      stories: stories.total,
      profiles: profiles.total,
      quizzes: quizzes.total,
      subscriptions: subs.total,
      streaks: streaks.total,
      segments: segments.total,
      cache: cache.total,
    },
    recentStories: recentStories.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      title: String(d.title || "Untitled"),
      goal: String(d.behavior_goal || ""),
      theme: String(d.theme || ""),
      lang: String(d.language_code || ""),
      words: Number(d.word_count || 0),
      audio: d.audio_url ? "yes" : "no",
      date: String(d.$createdAt),
    })),
    recentUsers: recentUsers.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      name: String(d.kid_name || "Unknown"),
      age: String(d.age || "?"),
      lang: String(d.primary_language || ""),
      city: String(d.city || ""),
      date: String(d.$createdAt),
    })),
    langDist: Object.entries(langs)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    goalDist: Object.entries(goals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <DashboardClient stats={stats} />;
}
