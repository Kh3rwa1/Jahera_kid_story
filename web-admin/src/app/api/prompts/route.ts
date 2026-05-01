import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { databases } = createAdminClient();
    const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

    const allowed = ["system_prompt", "psychology_notes", "tone", "narrative_technique", "is_active"];
    const update: Record<string, unknown> = {};
    allowed.forEach((k) => {
      if (fields[k] !== undefined) update[k] = fields[k];
    });

    await databases.updateDocument(db, "behavior_prompts", id, update);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
