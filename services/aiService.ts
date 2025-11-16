import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  correct_answer: 'A' | 'B' | 'C';
}

export interface GeneratedStory {
  title: string;
  content: string;
  quiz: QuizQuestion[];
}

function buildPrompt(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext
): string {
  const familyNames = profile.family_members.map(f => f.name).join(', ');
  const friendNames = profile.friends.map(f => f.name).join(', ');

  let charactersSection = `The main character is ${profile.kid_name}.`;

  if (familyNames) {
    charactersSection += ` Family members who might appear in the story: ${familyNames}.`;
  }

  if (friendNames) {
    charactersSection += ` Friends who might appear in the story: ${friendNames}.`;
  }

  return `You are a children's story and quiz generator. Create a VERY SHORT, engaging story (2-3 sentences maximum) followed by an interactive quiz, designed specifically for young children aged 4-8 years.

LANGUAGE: Write EVERYTHING in ${languageCode.toUpperCase()} language. The title, story, quiz questions, and all answer options must be in ${languageCode.toUpperCase()}.

CHARACTERS: ${charactersSection}

SETTING:
- Season: ${context.season}
- Time of day: ${context.timeOfDay}
Based on the season, create appropriate weather (sunny summer day, snowy winter morning, etc.)

STORY REQUIREMENTS:
- Keep the story EXTREMELY BRIEF (2-3 sentences ONLY) to maintain child attention
- Use SIMPLE vocabulary appropriate for early readers (ages 4-8)
- Include relatable characters (animals, children, or friendly objects)
- Focus on positive themes like friendship, kindness, or simple adventures
- Make it visually descriptive to spark imagination
- The main character should be ${profile.kid_name}

QUIZ REQUIREMENTS:
- Generate EXACTLY 3 multiple-choice questions about the story
- Each question must have EXACTLY 3 answer options (A, B, C)
- Questions should test basic comprehension of the story
- Use simple, clear language in questions
- Include one obvious correct answer and two plausible but incorrect options
- Make questions engaging and fun, not intimidating
- Questions should be easy enough for young children (ages 4-8)

FORMAT:
Return ONLY a JSON object with this EXACT structure:
{
  "title": "Very short story title in ${languageCode.toUpperCase()}",
  "content": "The complete 2-3 sentence story in ${languageCode.toUpperCase()}",
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
}

export async function generateAdventureStory(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext
): Promise<GeneratedStory | null> {
  try {
    const prompt = buildPrompt(profile, languageCode, context);

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://adventure-stories.app',
        'X-Title': 'Adventure Stories App',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response');
      return null;
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response');
      return null;
    }

    const story = JSON.parse(jsonMatch[0]);

    if (!story.title || !story.content || !story.quiz || !Array.isArray(story.quiz) || story.quiz.length !== 3) {
      console.error('Invalid story format - missing title, content, or quiz');
      return null;
    }

    return story;
  } catch (error) {
    console.error('Error generating story:', error);
    return null;
  }
}
