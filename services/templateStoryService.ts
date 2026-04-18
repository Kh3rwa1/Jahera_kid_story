import { COLLECTIONS,DATABASE_ID,databases,Query } from '@/lib/appwrite';
import { GeneratedStory, QuizQuestion } from '@/services/aiService';
import { HydratedTemplate, StoryTemplate } from '@/types/storyTemplate';
import { ProfileWithRelations } from '@/types/database';
import { sanitizeCity, sanitizeName } from '@/utils/promptSanitizer';
import { logger } from '@/utils/logger';

function mapTemplateDoc(doc: Record<string, any>): StoryTemplate {
  return {
    id: doc.$id,
    title_template: doc.title_template,
    content_template: doc.content_template,
    behavior_goal: doc.behavior_goal,
    theme: doc.theme,
    mood: doc.mood,
    language_code: doc.language_code,
    placeholder_fields: parsePlaceholderFields(doc.placeholder_fields),
    word_count: doc.word_count,
    created_at: doc.$createdAt,
  };
}

function parsePlaceholderFields(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(',').map((field) => field.trim()).filter(Boolean);
  }
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function replacePlaceholders(template: string, profile: ProfileWithRelations): string {
  const childName = sanitizeName(profile.kid_name || '') || 'little hero';
  const friendName = sanitizeName(profile.friends?.[0]?.name || '') || 'best friend';
  const familyMember = sanitizeName(profile.family_members?.[0]?.name || '') || 'family';
  const city = sanitizeCity(profile.city || '') || 'their hometown';

  return template
    .replace(/\{CHILD_NAME\}/g, childName)
    .replace(/\{FRIEND_NAME\}/g, friendName)
    .replace(/\{FAMILY_MEMBER\}/g, familyMember)
    .replace(/\{CITY\}/g, city);
}

function buildTemplateQuiz(template: HydratedTemplate): QuizQuestion[] {
  const lesson = template.behavior_goal.replace(/[-_]/g, ' ');
  return [
    {
      question: `What lesson was this story helping us practice?`,
      options: {
        A: lesson,
        B: 'Giving up quickly',
        C: 'Ignoring others',
      },
      correct_answer: 'A',
    },
    {
      question: 'What should we remember after reading this story?',
      options: {
        A: 'Small kind choices can make a big difference.',
        B: 'Only adventures matter.',
        C: 'Feelings are never important.',
      },
      correct_answer: 'A',
    },
    {
      question: 'Who was the hero of the story?',
      options: {
        A: 'The child in the story',
        B: 'A stranger',
        C: 'Nobody',
      },
      correct_answer: 'A',
    },
  ];
}

export function hydrateTemplate(template: StoryTemplate, profile: ProfileWithRelations): HydratedTemplate {
  const content = replacePlaceholders(template.content_template, profile);
  return {
    id: template.id,
    title: replacePlaceholders(template.title_template, profile),
    content,
    behavior_goal: template.behavior_goal,
    theme: template.theme,
    mood: template.mood,
    word_count: content.split(/\s+/).filter(Boolean).length || template.word_count,
  };
}

export const templateStoryService = {
  async getMatchingTemplate(
    profile: ProfileWithRelations,
    behaviorGoal: string | null | undefined,
    languageCode: string
  ): Promise<HydratedTemplate | null> {
    const filters = [
      Query.equal('language_code', languageCode),
      Query.limit(50),
    ];

    if (behaviorGoal) {
      filters.unshift(Query.equal('behavior_goal', behaviorGoal));
    }

    try {
      let response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORY_TEMPLATES, filters);

      if (response.documents.length === 0 && languageCode !== 'en') {
        response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORY_TEMPLATES, [
          ...(behaviorGoal ? [Query.equal('behavior_goal', behaviorGoal)] : []),
          Query.equal('language_code', 'en'),
          Query.limit(50),
        ]);
      }

      if (response.documents.length === 0) {
        response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORY_TEMPLATES, [
          Query.limit(50),
        ]);
      }

      const selected = pickRandom(response.documents.map((doc) => mapTemplateDoc(doc)));
      return selected ? hydrateTemplate(selected, profile) : null;
    } catch (error) {
      logger.error('[templateStoryService] Failed to fetch template:', error);
      return null;
    }
  },

  async generateTemplateStory(
    profile: ProfileWithRelations,
    behaviorGoal: string | null | undefined,
    languageCode: string
  ): Promise<GeneratedStory | null> {
    const template = await this.getMatchingTemplate(profile, behaviorGoal, languageCode);
    if (!template) return null;

    return {
      title: template.title,
      content: template.content,
      word_count: template.word_count,
      quiz: buildTemplateQuiz(template),
    };
  },
};
