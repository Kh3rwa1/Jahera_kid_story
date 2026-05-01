import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import PromptsClient from "./PromptsClient";

export const revalidate = 30;

async function getPrompts() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";
  const res = await databases.listDocuments(db, "behavior_prompts", [
    Query.limit(25),
    Query.orderAsc("goal_id"),
  ]);

  return {
    prompts: res.documents.map((d: Record<string, unknown>) => ({
      id: String(d.$id),
      goal_id: String(d.goal_id || ""),
      system_prompt: String(d.system_prompt || ""),
      psychology_notes: String(d.psychology_notes || ""),
      tone: String(d.tone || ""),
      narrative_technique: String(d.narrative_technique || ""),
      is_active: d.is_active !== false,
      date: String(d.$updatedAt || d.$createdAt),
    })),
    total: res.total,
  };
}

export default async function PromptsPage() {
  const data = await getPrompts();
  return <PromptsClient data={data} />;
}
