import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateStoryRequest {
  profileId: string;
  languageCode: string;
  context: {
    season: string;
    timeOfDay: string;
  };
  theme?: string;
  mood?: string;
  length?: 'short' | 'medium' | 'long';
}

interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  correct_answer: 'A' | 'B' | 'C';
}

interface GeneratedStory {
  title: string;
  content: string;
  quiz: QuizQuestion[];
  word_count?: number;
}

const THEME_PROMPTS: Record<string, string> = {
  adventure: 'an exciting outdoor adventure',
  fantasy: 'a magical fantasy world with dragons and wizards',
  space: 'an amazing space exploration journey',
  animals: 'a heartwarming story about animals',
  nature: 'a beautiful nature discovery adventure',
  friendship: 'a touching story about friendship and kindness',
  science: 'a fun science discovery experiment',
  history: 'an exciting historical adventure',
  ocean: 'an underwater ocean exploration',
  superheroes: 'a superhero adventure saving the day',
};

const MOOD_PROMPTS: Record<string, string> = {
  exciting: 'exciting and action-packed',
  funny: 'funny and full of silly humor',
  calming: 'gentle, peaceful, and soothing',
  educational: 'educational and thought-provoking',
  mysterious: 'mysterious with a fun twist',
  heartwarming: 'heartwarming and emotionally touching',
};

const LENGTH_CONFIGS: Record<string, { sentences: string; max_tokens: number }> = {
  short: { sentences: '2-3 sentences (around 50 words)', max_tokens: 1200 },
  medium: { sentences: '4-6 sentences (around 120 words)', max_tokens: 1800 },
  long: { sentences: '8-12 sentences (around 250 words)', max_tokens: 2800 },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { profileId, languageCode, context, theme = 'adventure', mood = 'exciting', length = 'short' } = await req.json() as GenerateStoryRequest;

    if (!profileId || !languageCode) {
      throw new Error('Missing required parameters');
    }

    const serverApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY');

    let apiKey = serverApiKey;

    if (!apiKey) {
      const { data: apiKeyData, error: keyError } = await supabase.rpc('get_api_key', {
        p_key_name: 'openai_api_key',
      });

      if (keyError || !apiKeyData) {
        throw new Error('Story generation is temporarily unavailable. Please try again later.');
      }
      apiKey = apiKeyData;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        languages:user_languages(*),
        family_members(*),
        friends(*),
        interests:profile_interests(*)
      `)
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const canGenerate = await supabase.rpc('increment_story_usage', {
      p_profile_id: profileId,
    });

    if (canGenerate.data === false) {
      throw new Error('QUOTA_EXCEEDED: You have reached your free story limit for this month. Upgrade to Pro for unlimited stories!');
    }

    const familyNames = profile.family_members?.map((f: any) => f.name).join(', ') || '';
    const friendNames = profile.friends?.map((f: any) => f.name).join(', ') || '';
    const interests = profile.interests?.map((i: any) => i.interest).join(', ') || '';
    const ageText = profile.age ? `The child is ${profile.age} years old.` : 'The child is about 6 years old.';

    let charactersSection = `The main character is ${profile.kid_name}.`;
    if (familyNames) {
      charactersSection += ` Family members who might appear: ${familyNames}.`;
    }
    if (friendNames) {
      charactersSection += ` Friends who might appear: ${friendNames}.`;
    }
    if (interests) {
      charactersSection += ` The child loves: ${interests}.`;
    }

    const themeDescription = THEME_PROMPTS[theme] || THEME_PROMPTS.adventure;
    const moodDescription = MOOD_PROMPTS[mood] || MOOD_PROMPTS.exciting;
    const lengthConfig = LENGTH_CONFIGS[length] || LENGTH_CONFIGS.short;

    const prompt = `You are a children's story and quiz generator. Create an engaging story followed by an interactive quiz.

LANGUAGE: Write EVERYTHING in ${languageCode.toUpperCase()} language. Title, story, quiz questions, and all answers must be in ${languageCode.toUpperCase()}.

CHARACTERS: ${charactersSection}
AGE: ${ageText}

STORY THEME: Create ${themeDescription}
STORY MOOD: Make it ${moodDescription}

SETTING:
- Season: ${context.season}
- Time of day: ${context.timeOfDay}

STORY REQUIREMENTS:
- Length: ${lengthConfig.sentences}
- Age-appropriate vocabulary
- Happy, positive ending
- Feature ${profile.kid_name} as the main character
- Incorporate the theme and mood naturally

QUIZ REQUIREMENTS:
- EXACTLY 3 questions about the story
- Each question has EXACTLY 3 options (A, B, C)
- Questions test reading comprehension
- One clearly correct answer per question

Return ONLY this JSON (no other text):
{
  "title": "Story title",
  "content": "The full story text",
  "quiz": [
    {
      "question": "Question 1",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C" },
      "correct_answer": "A"
    },
    {
      "question": "Question 2",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C" },
      "correct_answer": "B"
    },
    {
      "question": "Question 3",
      "options": { "A": "Option A", "B": "Option B", "C": "Option C" },
      "correct_answer": "C"
    }
  ]
}`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://jahera.app',
        'X-Title': 'Jahera - AI Story Adventures',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: lengthConfig.max_tokens,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`Story generation failed. Please try again.`);
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const story: GeneratedStory = JSON.parse(jsonMatch[0]);

    if (!story.title || !story.content || !story.quiz || story.quiz.length !== 3) {
      throw new Error('Invalid story format');
    }

    story.word_count = story.content.split(/\s+/).filter(Boolean).length;

    return new Response(
      JSON.stringify({ success: true, story }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating story:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isQuotaError = errorMessage.startsWith('QUOTA_EXCEEDED:');

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        quota_exceeded: isQuotaError,
      }),
      {
        status: isQuotaError ? 402 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
