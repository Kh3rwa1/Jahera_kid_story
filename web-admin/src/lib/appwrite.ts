import { Client, Databases } from "node-appwrite";

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        "https://sfo.cloud.appwrite.io/v1"
    )
    .setProject(
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
        "69b5657c000d2c28a436"
    )
    .setKey(process.env.APPWRITE_API_KEY || "");

  return {
    databases: new Databases(client),
  };
}
