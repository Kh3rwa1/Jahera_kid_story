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
}

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

    const { profileId, languageCode, context } = await req.json() as GenerateStoryRequest;

    if (!profileId || !languageCode) {
      throw new Error('Missing required parameters');
    }

    const { data: apiKeyData, error: keyError } = await supabase.rpc('get_api_key', {
      p_key_name: 'openai_api_key',
    });

    if (keyError || !apiKeyData) {
      throw new Error('OpenAI API key not configured. Please add it in settings.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        languages:user_languages(*),
        family_members(*),
        friends(*)
      `)
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const familyNames = profile.family_members?.map((f: any) => f.name).join(', ') || '';
    const friendNames = profile.friends?.map((f: any) => f.name).join(', ') || '';

    let charactersSection = `The main character is ${profile.kid_name}.`;
    if (familyNames) {
      charactersSection += ` Family members who might appear in the story: ${familyNames}.`;
    }
    if (friendNames) {
      charactersSection += ` Friends who might appear in the story: ${friendNames}.`;
    }

    const prompt = `You are a children's story and quiz generator. Create a VERY SHORT, engaging story (2-3 sentences maximum) followed by an interactive quiz, designed specifically for young children aged 4-8 years.

LANGUAGE: Write EVERYTHING in ${languageCode.toUpperCase()} language. The title, story, quiz questions, and all answer options must be in ${languageCode.toUpperCase()}.

CHARACTERS: ${charactersSection}

SETTING:
- Season: ${context.season}
- Time of day: ${context.timeOfDay}
Based on the season, create appropriate weather (sunny summer day, snowy winter morning, etc.)

STORY REQUIREMENTS:
- Exactly 2-3 sentences
- Age-appropriate (4-8 years old)
- Simple vocabulary
- Happy, positive tone
- Include the main character ${profile.kid_name}
- Make it exciting and fun!

QUIZ REQUIREMENTS:
- EXACTLY 3 questions about the story
- Each question has EXACTLY 3 options (A, B, C)
- Questions must be simple enough for ages 4-8
- Test reading comprehension of the story
- One correct answer per question

Return ONLY a JSON object in this exact format:
{
  "title": "Story title in ${languageCode.toUpperCase()}",
  "content": "The 2-3 sentence story in ${languageCode.toUpperCase()}",
  "quiz": [
    {
      "question": "First quiz question in ${languageCode.toUpperCase()}",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text"
      },
      "correct_answer": "A"
    },
    {
      "question": "Second quiz question in ${languageCode.toUpperCase()}",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text"
      },
      "correct_answer": "B"
    },
    {
      "question": "Third quiz question in ${languageCode.toUpperCase()}",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text"
      },
      "correct_answer": "C"
    }
  ]
}

IMPORTANT:
- Story must be 2-3 sentences MAXIMUM
- EXACTLY 3 quiz questions
- Each question has EXACTLY 3 options (A, B, C)
- Questions must be simple for ages 4-8
- Everything in ${languageCode.toUpperCase()} language

Do not include any other text, explanation, or markdown formatting. Just the JSON object.`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeyData}`,
        'HTTP-Referer': 'https://adventure-stories.app',
        'X-Title': 'Adventure Stories App',
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
        max_tokens: 2000,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const story: GeneratedStory = JSON.parse(jsonMatch[0]);

    if (!story.title || !story.content || !story.quiz || story.quiz.length !== 3) {
      throw new Error('Invalid story format');
    }

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
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});