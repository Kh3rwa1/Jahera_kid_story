import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LANGUAGE_VOICE_MAP: Record<string, string> = {
  en: "pNInz6obpgDQGcFmaJgB",
  es: "VR6AewLTigWG4xSOukaG",
  fr: "TxGEqnHWrfWFTfGW9XjX",
  de: "nPczCjzI2devNBz1zQrb",
  it: "XB0fDUnXU5powFXDhCwa",
  pt: "yoZ06aMxZJJ28mfd3POQ",
  ru: "bIHbv24MWmeRgasZH58o",
  zh: "Xb7hH8MSUJpSbSDYk0k2",
  ja: "jsCqWAovK2LkecY7zXl4",
  ko: "bVMeCyTHy58xNoL34h3p",
  ar: "pqHfZKP75CvOlQylNhV4",
  hi: "ZQe5CZNOzWyzPSCn5a3c",
  tr: "flq6f7yk4E4fJM5XTYuZ",
  pl: "ThT5KcBeYPX3keUQqHPh",
  nl: "D38z5RcWu1voky8WS1ja",
  sv: "N2lVS1w4EtoT3dr4eOWO",
  no: "SOYHLrjzK2X1ezoPC6cr",
  da: "EXAVITQu4vr4xnSDxMaL",
  fi: "JBFqnCBsd6RMkjVDRZzb",
  el: "iP95p4xoKVk53GoZ742B",
};

const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { text, languageCode, storyId, elevenLabsApiKey: clientKey } = await req.json();

    if (!text || !storyId) {
      return new Response(JSON.stringify({ error: "Missing required fields: text, storyId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let elevenLabsApiKey: string | null =
      (clientKey as string | null) ||
      Deno.env.get("ELEVENLABS_API_KEY") ||
      null;

    if (!elevenLabsApiKey) {
      const { data: keyRow } = await supabase
        .from("api_keys")
        .select("key_value")
        .eq("key_name", "elevenlabs_api_key")
        .eq("is_active", true)
        .maybeSingle();

      if (keyRow?.key_value) {
        elevenLabsApiKey = keyRow.key_value;
      }
    }

    if (!elevenLabsApiKey || elevenLabsApiKey.length < 20) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured", audioUrl: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voiceId = LANGUAGE_VOICE_MAP[languageCode || "en"] || DEFAULT_VOICE_ID;
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const elevenResp = await fetch(elevenLabsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!elevenResp.ok) {
      const errText = await elevenResp.text();
      return new Response(
        JSON.stringify({ error: `ElevenLabs error: ${elevenResp.status}`, detail: errText.slice(0, 200), audioUrl: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await elevenResp.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const filePath = `${storyId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("story-audio")
      .upload(filePath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadError.message}`, audioUrl: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicData } = supabase.storage.from("story-audio").getPublicUrl(filePath);
    const audioUrl = publicData.publicUrl;

    return new Response(JSON.stringify({ audioUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error", audioUrl: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
