import { NextRequest, NextResponse } from "next/server";
import { Client, Storage, ID } from "node-appwrite";

function getStorage() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sfo.cloud.appwrite.io/v1")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "69b5657c000d2c28a436")
    .setKey(process.env.APPWRITE_API_KEY || "");
  return new Storage(client);
}

const BUCKET = "behavior_assets";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const habitId = formData.get("habitId") as string | null;

    if (!file || !habitId) {
      return NextResponse.json({ error: "Missing file or habitId" }, { status: 400 });
    }

    const storage = getStorage();

    // Delete existing file first (ignore errors if not found)
    try {
      await storage.deleteFile(BUCKET, habitId);
    } catch {}

    // Upload new file with habitId as the file ID
    const buffer = Buffer.from(await file.arrayBuffer());
    const { InputFile } = require("node-appwrite/file");
    const inputFile = InputFile.fromBuffer(buffer, habitId + ".json");

    await storage.createFile(BUCKET, habitId, inputFile);

    return NextResponse.json({ success: true, fileId: habitId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { habitId } = await req.json();
    if (!habitId) {
      return NextResponse.json({ error: "Missing habitId" }, { status: 400 });
    }

    const storage = getStorage();
    await storage.deleteFile(BUCKET, habitId);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
