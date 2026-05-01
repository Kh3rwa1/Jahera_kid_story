import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import AnalyticsClient from "./AnalyticsClient";

export const revalidate = 60;

async function getAnalytics() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

  const [stories, profiles] = await Promise.all([
    databases.listDocuments(db, "stories", [Query.limit(200), Query.orderDesc("$createdAt")]),
    databases.listDocuments(db, "profiles", [Query.limit(100), Query.orderDesc("$createdAt")]),
  ]);

  const perDay: Record<string, number> = {};
  const langs: Record<string, number> = {};
  const goals: Record<string, number> = {};
  const themes: Record<string, number> = {};
  let totalWords = 0;
  let audioCount = 0;

  stories.documents.forEach((d: Record<string, unknown>) => {
    const day = new Date(String(d.$createdAt)).toISOString().split("T")[0];
    perDay[day] = (perDay[day] || 0) + 1;
    const lc = String(d.language_code || "other");
    langs[lc] = (langs[lc] || 0) + 1;
    const bg = String(d.behavior_goal || "none");
    goals[bg] = (goals[bg] || 0) + 1;
    const th = String(d.theme || "none");
    themes[th] = (themes[th] || 0) + 1;
    totalWords += Number(d.word_count || 0);
    if (d.audio_url) audioCount++;
  });

  return {
    storiesPerDay: Object.entries(perDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    langDist: Object.entries(langs).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    goalDist: Object.entries(goals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    themeDist: Object.entries(themes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    totalStories: stories.total,
    totalUsers: profiles.total,
    avgWords: stories.total > 0 ? Math.round(totalWords / stories.total) : 0,
    audioRate: stories.total > 0 ? Math.round((audioCount / stories.total) * 100) : 0,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  return <AnalyticsClient data={data} />;
}
