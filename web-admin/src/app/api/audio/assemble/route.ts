import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { ID, Query } from "node-appwrite";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const MODEL = "eleven_multilingual_v2";

async function generateSentenceAudio(
  text: string,
  voiceId: string,
  apiKey: string,
  previousText?: string,
  nextText?: string,
  previousRequestIds?: string[]
): Promise<{ buffer: Buffer; requestId: string; charCost: number }> {
  const body: Record<string, unknown> = {
    text,
    model_id: MODEL,
    voice_settings: {
      stability: 0.65,
      similarity_boost: 0.85,
      style: 0.2,
      use_speaker_boost: true,
    },
  };

  if (previousText) body.previous_text = previousText;
  if (nextText) body.next_text = nextText;
  if (previousRequestIds && previousRequestIds.length > 0) {
    body.previous_request_ids = previousRequestIds.slice(-3);
  }

  const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);

  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    requestId: res.headers.get("request-id") || "",
    charCost: parseInt(res.headers.get("character-cost") || "0", 10),
  };
}

// POST — Assemble full audio for a specific kid + template combo
export async function POST(request: NextRequest) {
  try {
    const { templateId, kidName, friendName, familyMember, city, voiceId } =
      await request.json();

    if (!templateId || !kidName) {
      return NextResponse.json({ error: "Missing templateId or kidName" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
    }

    // Voice IDs: Sarah=EXAVITQu4vr4xnSDxMaL, Liam=TX3LPaxmHKxFdv7VOQHJ, Laura=FGY2WhTYpPnrIDTdsKH5, GrandmaClo=EMuO6fFLrXKOryHzij6K, Reva(Dadi)=8FsOrsZSELg9otqX9nPu
    const voice = voiceId || "EXAVITQu4vr4xnSDxMaL";
    const { databases } = createAdminClient();
    const db = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "jahera_db";

    // Check cache first
    const cached = await databases.listDocuments(db, "audio_cache", [
      Query.equal("template_id", templateId),
      Query.equal("kid_name", kidName),
      Query.equal("voice_id", voice),
      Query.limit(1),
    ]);

    if (cached.total > 0 && cached.documents[0].status === "ready") {
      return NextResponse.json({
        success: true,
        cached: true,
        audioUrl: cached.documents[0].audio_url,
        cost: "$0.00",
      });
    }

    // Get all segments ordered
    const allSegments = await databases.listDocuments(db, "audio_segments", [
      Query.equal("template_id", templateId),
      Query.orderAsc("segment_index"),
      Query.limit(200),
    ]);

    if (allSegments.total === 0) {
      return NextResponse.json(
        { error: "No segments found. Split the template first." },
        { status: 404 }
      );
    }

    const segments = allSegments.documents;
    const audioBuffers: Buffer[] = [];
    const previousRequestIds: string[] = [];
    let totalCharCost = 0;
    let newGenerations = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      if (!seg.contains_placeholder && seg.request_id) {
        // Static segment — already generated, fetch from stored request
        // For now, we regenerate with previous_request_ids for stitching
        // In production, you'd fetch the stored audio from Appwrite Storage
        const prevText = i > 0 ? segments[i - 1].sentence_text : undefined;
        const nextText =
          i < segments.length - 1 ? segments[i + 1].sentence_text : undefined;

        const result = await generateSentenceAudio(
          seg.sentence_text,
          voice,
          apiKey,
          prevText,
          nextText,
          previousRequestIds
        );

        audioBuffers.push(result.buffer);
        previousRequestIds.push(result.requestId);
        if (previousRequestIds.length > 3) previousRequestIds.shift();
        totalCharCost += result.charCost;
      } else {
        // Placeholder segment — personalize and generate
        let personalizedText = seg.sentence_text;
        personalizedText = personalizedText.replace(/\{CHILD_NAME\}/g, kidName);
        personalizedText = personalizedText.replace(
          /\{FRIEND_NAME\}/g,
          friendName || "their friend"
        );
        personalizedText = personalizedText.replace(
          /\{FAMILY_MEMBER\}/g,
          familyMember || "their family"
        );
        personalizedText = personalizedText.replace(
          /\{CITY\}/g,
          city || "their town"
        );

        const prevText = i > 0 ? segments[i - 1].sentence_text : undefined;
        const nextText =
          i < segments.length - 1 ? segments[i + 1].sentence_text : undefined;

        // Personalize context too
        let prevPersonalized = prevText;
        let nextPersonalized = nextText;
        if (prevPersonalized) {
          prevPersonalized = prevPersonalized
            .replace(/\{CHILD_NAME\}/g, kidName)
            .replace(/\{FRIEND_NAME\}/g, friendName || "their friend")
            .replace(/\{FAMILY_MEMBER\}/g, familyMember || "their family")
            .replace(/\{CITY\}/g, city || "their town");
        }
        if (nextPersonalized) {
          nextPersonalized = nextPersonalized
            .replace(/\{CHILD_NAME\}/g, kidName)
            .replace(/\{FRIEND_NAME\}/g, friendName || "their friend")
            .replace(/\{FAMILY_MEMBER\}/g, familyMember || "their family")
            .replace(/\{CITY\}/g, city || "their town");
        }

        const result = await generateSentenceAudio(
          personalizedText,
          voice,
          apiKey,
          prevPersonalized,
          nextPersonalized,
          previousRequestIds
        );

        audioBuffers.push(result.buffer);
        previousRequestIds.push(result.requestId);
        if (previousRequestIds.length > 3) previousRequestIds.shift();
        totalCharCost += result.charCost;
        newGenerations++;

        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // Concatenate all MP3 buffers into one
    const fullAudio = Buffer.concat(audioBuffers);
    const audioBase64 = fullAudio.toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    // Save to cache
    const cacheDoc = cached.total > 0 ? cached.documents[0] : null;
    if (cacheDoc) {
      await databases.updateDocument(db, "audio_cache", cacheDoc.$id, {
        audio_url: audioDataUrl.length > 450 ? "assembled" : audioDataUrl,
        voice_id: voice,
        character_cost: String(totalCharCost),
        status: "ready",
      });
    } else {
      await databases.createDocument(db, "audio_cache", ID.unique(), {
        template_id: templateId,
        kid_name: kidName,
        friend_name: friendName || "",
        family_member: familyMember || "",
        city: city || "",
        audio_url: audioDataUrl.length > 450 ? "assembled" : audioDataUrl,
        voice_id: voice,
        character_cost: String(totalCharCost),
        status: "ready",
      });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      segments: segments.length,
      newGenerations,
      totalCharacters: totalCharCost,
      estimatedCost: `$${(totalCharCost * 0.0003).toFixed(4)}`,
      audioSizeKB: Math.round(fullAudio.length / 1024),
    });
  } catch (e) {
    console.error("Assemble error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
