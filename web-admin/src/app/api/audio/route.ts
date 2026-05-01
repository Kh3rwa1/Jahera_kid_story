import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { Query, ID } from "node-appwrite";

const PLACEHOLDERS = ["CHILD_NAME", "FRIEND_NAME", "FAMILY_MEMBER", "CITY"];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[।.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function hasPlaceholder(sentence: string): boolean {
  return PLACEHOLDERS.some((p) => sentence.includes(`{${p}}`));
}

function getPlaceholders(sentence: string): string[] {
  return PLACEHOLDERS.filter((p) => sentence.includes(`{${p}}`));
}

export async function POST(req: NextRequest) {
  try {
    const { templateId } = await req.json();
    if (!templateId)
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });

    const { databases } = createAdminClient();
    const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

    const template = await databases.getDocument(db, "story_templates", templateId);
    const content = (template.content_template as string) || "";
    const sentences = splitSentences(content);

    let staticCount = 0;
    let placeholderCount = 0;

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const contains = hasPlaceholder(s);
      if (contains) placeholderCount++;
      else staticCount++;

      await databases.createDocument(db, "audio_segments", ID.unique(), {
        template_id: templateId,
        segment_index: i,
        sentence_text: s.slice(0, 2000),
        contains_placeholder: contains,
        placeholders_in_segment: contains ? getPlaceholders(s).join(",") : "",
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      total: sentences.length,
      static: staticCount,
      placeholder: placeholderCount,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    if (!templateId)
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });

    const { databases } = createAdminClient();
    const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

    const segments = await databases.listDocuments(db, "audio_segments", [
      Query.equal("template_id", templateId),
      Query.limit(100),
    ]);

    for (const doc of segments.documents) {
      await databases.deleteDocument(db, "audio_segments", doc.$id);
    }

    return NextResponse.json({ success: true, deleted: segments.documents.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
