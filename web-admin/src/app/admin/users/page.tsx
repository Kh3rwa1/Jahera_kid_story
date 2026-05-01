import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import UsersClient from "./UsersClient";

export const revalidate = 30;

async function getUsers() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

  const [profiles, stories] = await Promise.all([
    databases.listDocuments(db, "profiles", [Query.limit(100), Query.orderDesc("$createdAt")]),
    databases.listDocuments(db, "stories", [Query.limit(200)]),
  ]);

  const storyCountMap: Record<string, number> = {};
  stories.documents.forEach((d: Record<string, unknown>) => {
    const pid = String(d.profile_id || "");
    if (pid) storyCountMap[pid] = (storyCountMap[pid] || 0) + 1;
  });

  return {
    users: profiles.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      name: String(d.kid_name || "Unknown"),
      age: String(d.age || "?"),
      lang: String(d.primary_language || ""),
      city: String(d.city || ""),
      country: String(d.country || ""),
      voiceId: String(d.elevenlabs_voice_id || ""),
      stories: storyCountMap[String(d.$id)] || 0,
      date: String(d.$createdAt),
    })),
    total: profiles.total,
  };
}

export default async function UsersPage() {
  const data = await getUsers();
  return <UsersClient data={data} />;
}
