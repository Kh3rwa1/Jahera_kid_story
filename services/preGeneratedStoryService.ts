import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { logger } from '@/utils/logger';

export interface StoryTemplate {
  id: string;
  theme: string;
  behavior_goal: string;
  mood: string;
  language_code: string;
  title: string;
  content: string;
  quiz: {
    question: string;
    options: { A: string; B: string; C: string };
    correct_answer: 'A' | 'B' | 'C';
  }[];
  word_count: number;
}

/**
 * Replace placeholder names with real user data
 */
function personalizeTemplate(
  template: StoryTemplate,
  kidName: string,
  familyMembers: string[],
  friends: string[],
  city?: string | null,
): { title: string; content: string; quiz: StoryTemplate['quiz'] } {
  let title = template.title;
  let content = template.content;
  const quiz = JSON.parse(
    JSON.stringify(template.quiz),
  ) as StoryTemplate['quiz'];

  // Name replacements
  const replacements: [string, string][] = [
    ['{{CHILD}}', kidName],
    ['{{FRIEND1}}', friends[0] || 'Alex'],
    ['{{FRIEND2}}', friends[1] || 'Sam'],
    ['{{FRIEND3}}', friends[2] || 'Jordan'],
    ['{{FAMILY1}}', familyMembers[0] || 'Mom'],
    ['{{FAMILY2}}', familyMembers[1] || 'Dad'],
    ['{{CITY}}', city || 'their town'],
  ];

  for (const [placeholder, value] of replacements) {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    title = title.replace(regex, value);
    content = content.replace(regex, value);
    for (const q of quiz) {
      q.question = q.question.replace(regex, value);
      q.options.A = q.options.A.replace(regex, value);
      q.options.B = q.options.B.replace(regex, value);
      q.options.C = q.options.C.replace(regex, value);
    }
  }

  return { title, content, quiz };
}

/**
 * Find a matching pre-generated story template
 */
async function findTemplate(
  theme: string,
  behaviorGoal: string,
  languageCode: string,
  mood?: string,
): Promise<StoryTemplate | null> {
  try {
    const queries = [
      Query.equal('theme', theme),
      Query.equal('behavior_goal', behaviorGoal),
      Query.equal('language_code', languageCode),
      Query.limit(10),
    ];

    if (mood) {
      queries.splice(2, 0, Query.equal('mood', mood));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      'story_templates',
      queries,
    );

    if (response.documents.length > 0) {
      // Pick a random match to add variety
      const doc =
        response.documents[
          Math.floor(Math.random() * response.documents.length)
        ];
      return {
        id: doc.$id,
        theme: doc.theme,
        behavior_goal: doc.behavior_goal,
        mood: doc.mood,
        language_code: doc.language_code,
        title: doc.title,
        content: doc.content,
        quiz: JSON.parse(doc.quiz_json),
        word_count: doc.word_count,
      } as StoryTemplate;
    }

    // Fallback: try without mood filter
    if (mood) {
      return findTemplate(theme, behaviorGoal, languageCode);
    }

    return null;
  } catch (err) {
    logger.error('[PreGenStory] Failed to find template:', err);
    return null;
  }
}

/**
 * Main entry point: get a personalized story from templates
 * Returns null if no template found (caller should fall back to AI generation)
 */
export async function getPreGeneratedStory(
  theme: string,
  behaviorGoal: string,
  languageCode: string,
  kidName: string,
  familyMembers: string[],
  friends: string[],
  city?: string | null,
  mood?: string,
): Promise<{
  title: string;
  content: string;
  quiz: StoryTemplate['quiz'];
  word_count: number;
  from_template: boolean;
} | null> {
  const template = await findTemplate(theme, behaviorGoal, languageCode, mood);

  if (!template) {
    return null;
  }

  const personalized = personalizeTemplate(
    template,
    kidName,
    familyMembers,
    friends,
    city,
  );

  return {
    title: personalized.title,
    content: personalized.content,
    quiz: personalized.quiz,
    word_count: template.word_count,
    from_template: true,
  };
}

export const preGeneratedStoryService = {
  getPreGeneratedStory,
  findTemplate,
};
