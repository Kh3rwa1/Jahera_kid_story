import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const THEME_PROMPTS: Record<string, string> = {
  adventure: "an exciting adventure with exploration and discovery",
  fantasy: "a magical fantasy world with spells, dragons, and wonder",
  magic: "a magical world with spells and wonder",
  animals: "friendly animals as the main characters",
  space: "outer space, stars, and planets",
  ocean: "the deep ocean and colourful sea creatures",
  forest: "an enchanted forest full of secrets",
  dinosaurs: "dinosaurs and prehistoric times",
  superheroes: "superheroes with special powers",
  heroes: "brave heroes overcoming challenges",
  nature: "the beauty of nature, plants, and wildlife",
  science: "science, invention, and curious discoveries",
};

const MOOD_PROMPTS: Record<string, string> = {
  funny: "funny, playful, and full of silly humour",
  exciting: "exciting, fast-paced, and full of action",
  calming: "calm, peaceful, and soothing",
  calm: "calm, peaceful, and soothing",
  mysterious: "mysterious and intriguing",
  educational: "educational and informative — teaching a fun fact",
};

const LENGTH_CONFIGS: Record<string, { words: string; tokens: number }> = {
  short: { words: "200-280 words", tokens: 1100 },
  medium: { words: "350-500 words", tokens: 1800 },
  long: { words: "600-800 words", tokens: 2800 },
};

const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENAI_MODEL = "gpt-4o-mini";

function buildPrompt(profile: any, languageCode: string, context: any, options: any) {
  const characterNames = [
    ...(profile.family_members || []).map((m: any) => m.name),
    ...(profile.friends || []).map((f: any) => f.name),
  ];
  const characterContext =
    characterNames.length > 0
      ? `Include these characters: ${characterNames.join(", ")}.`
      : "";

  const themeDesc = options?.theme
    ? THEME_PROMPTS[options.theme] || options.theme
    : "an adventure";
  const moodDesc = options?.mood
    ? MOOD_PROMPTS[options.mood] || options.mood
    : "engaging and fun";
  const lengthConfig = LENGTH_CONFIGS[options?.length || "medium"];

  const loc = options?.locationContext;
  const locationParts = [loc?.city, loc?.country].filter(Boolean);
  const locationLine =
    locationParts.length > 0
      ? `- Location: Set the story in or around ${locationParts.join(
          ", "
        )} — weave in local landmarks, nature, or culture naturally`
      : "";

  const systemMessage = `You are a creative children's story writer. You write engaging, age-appropriate stories for children aged 4-10. Always respond with valid JSON only — no markdown, no code fences, no extra text.`;

  const userMessage = `Write a children's story for a child named ${profile.kid_name}.

Requirements:
- Language: ${languageCode}
- Setting: ${context.season} season, ${context.timeOfDay}
- Theme: ${themeDesc}
- Tone: ${moodDesc}
- Length: ${lengthConfig.words}
- Age group: 4-10 years old
- Must be educational and positive
- Structure: write in 4-6 clear paragraphs separated by newlines, with a proper story arc (beginning, middle, end)
${locationLine}
${characterContext}

Return ONLY this JSON structure (no markdown, no extra keys):
{
  "title": "Story title here",
  "content": "Full story text here",
  "quiz": [
    {
      "question": "A question about the story?",
      "options": { "A": "First option", "B": "Second option", "C": "Third option" },
      "correct_answer": "A"
    },
    {
      "question": "Another question?",
      "options": { "A": "First option", "B": "Second option", "C": "Third option" },
      "correct_answer": "B"
    },
    {
      "question": "Third question?",
      "options": { "A": "First option", "B": "Second option", "C": "Third option" },
      "correct_answer": "C"
    }
  ]
}`;

  return { systemMessage, userMessage, tokens: lengthConfig.tokens };
}

function parseStoryJson(raw: string) {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  const story = JSON.parse(cleaned);
  if (!story.title || typeof story.title !== "string")
    throw new Error("Missing story title");
  if (!story.content || typeof story.content !== "string")
    throw new Error("Missing story content");
  if (!Array.isArray(story.quiz) || story.quiz.length < 2)
    throw new Error("Missing or incomplete quiz");

  const validQuiz = story.quiz.slice(0, 3).filter(
    (q: any) =>
      q.question &&
      q.options?.A &&
      q.options?.B &&
      q.options?.C &&
      q.correct_answer
  );
  if (validQuiz.length < 2) throw new Error("Quiz questions are malformed");

  return { ...story, quiz: validQuiz };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { profile, languageCode, context, options } = body;

    if (!profile || !languageCode || !context) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: profile, languageCode, context",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let openrouterKey = Deno.env.get("OPENROUTER_API_KEY") || null;
    let openaiKey = Deno.env.get("OPENAI_API_KEY") || null;

    if (!openrouterKey && !openaiKey) {
      const { data: keys } = await supabase
        .from("api_keys")
        .select("key_name, key_value")
        .in("key_name", ["openrouter_api_key", "openai_api_key"])
        .eq("is_active", true);

      if (keys) {
        for (const row of keys) {
          if (row.key_name === "openrouter_api_key") openrouterKey = row.key_value;
          if (row.key_name === "openai_api_key") openaiKey = row.key_value;
        }
      }
    }

    let apiKey: string | null = null;
    let provider: string | null = null;

    if (openrouterKey && openrouterKey.startsWith("sk-or-") && openrouterKey.length > 20) {
      apiKey = openrouterKey;
      provider = "openrouter";
    } else if (openaiKey && openaiKey.startsWith("sk-") && openaiKey.length > 20) {
      apiKey = openaiKey;
      provider = "openai";
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "No AI API key configured. Add OPENROUTER_API_KEY or OPENAI_API_KEY in settings or as an edge function secret.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { systemMessage, userMessage, tokens } = buildPrompt(
      profile,
      languageCode,
      context,
      options
    );

    const isOpenRouter = provider === "openrouter";
    const baseUrl = isOpenRouter
      ? "https://openrouter.ai"
      : "https://api.openai.com";
    const model = isOpenRouter ? OPENROUTER_MODEL : OPENAI_MODEL;

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (isOpenRouter) {
      reqHeaders["HTTP-Referer"] = "https://jahera.app";
      reqHeaders["X-Title"] = "Jahera Kids Stories";
    }

    const aiResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: tokens,
        response_format: { type: "json_object" },
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({
          error: "API quota exceeded. Please check your plan or try again later.",
          quotaExceeded: true,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiResponse.status === 401) {
      return new Response(
        JSON.stringify({
          error: `Invalid API key for ${isOpenRouter ? "OpenRouter" : "OpenAI"}.`,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiResponse.ok) {
      return new Response(
        JSON.stringify({ error: `AI API error: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI provider" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const story = parseStoryJson(content);

    return new Response(JSON.stringify({ story }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
