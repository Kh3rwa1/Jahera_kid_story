import { createAdminClient } from "@/lib/appwrite";
import { Query } from "node-appwrite";
import SettingsClient from "./SettingsClient";

export const revalidate = 30;

async function getSettings() {
  const { databases } = createAdminClient();
  const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

  const [config, apiKeys] = await Promise.all([
    databases.listDocuments(db, "config", [Query.limit(50)]).catch(() => ({ documents: [], total: 0 })),
    databases.listDocuments(db, "api_keys", [Query.limit(10)]).catch(() => ({ documents: [], total: 0 })),
  ]);

  return {
    config: config.documents.map((d: Record<string, unknown>) => ({
      id: d.$id,
      ...Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith("$"))),
    })),
    apiKeys: apiKeys.total,
    collections: 16,
  };
}

export default async function SettingsPage() {
  const data = await getSettings();
  return <SettingsClient data={data} />;
}
