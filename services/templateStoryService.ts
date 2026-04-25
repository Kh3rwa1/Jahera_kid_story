import { COLLECTIONS, DATABASE_ID, databases, Query } from '@/lib/appwrite';
import { GeneratedStory, QuizQuestion } from '@/services/aiService';
import { HydratedTemplate, StoryTemplate } from '@/types/storyTemplate';
import { ProfileWithRelations } from '@/types/database';
import { sanitizeCity, sanitizeName } from '@/utils/promptSanitizer';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_TEMPLATE_LIMIT = 20;
const RECENT_TEMPLATE_KEY_PREFIX = 'recent_template_story_ids_';

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
    return value
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean);
  }
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function humanize(value: string): string {
  return value.replace(/[-_]/g, ' ').trim();
}

function makeQuestion(
  question: string,
  correctAnswer: string,
  distractors: string[],
): QuizQuestion {
  const choices = shuffle([
    correctAnswer,
    ...distractors.filter(Boolean),
  ]).slice(0, 3);
  while (choices.length < 3) {
    choices.push('Something else');
  }

  const answerMap: Record<'A' | 'B' | 'C', string> = {
    A: choices[0],
    B: choices[1],
    C: choices[2],
  };

  const correctIndex = choices.indexOf(correctAnswer);
  const correctAnswerKey: 'A' | 'B' | 'C' = (['A', 'B', 'C'][correctIndex] ??
    'A') as 'A' | 'B' | 'C';

  return {
    question,
    options: answerMap,
    correct_answer: correctAnswerKey,
  };
}

async function getRecentTemplateIds(profileId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(
      `${RECENT_TEMPLATE_KEY_PREFIX}${profileId}`,
    );
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

async function rememberTemplateId(
  profileId: string,
  templateId: string,
): Promise<void> {
  try {
    const recent = await getRecentTemplateIds(profileId);
    const next = [
      templateId,
      ...recent.filter((id) => id !== templateId),
    ].slice(0, RECENT_TEMPLATE_LIMIT);
    await AsyncStorage.setItem(
      `${RECENT_TEMPLATE_KEY_PREFIX}${profileId}`,
      JSON.stringify(next),
    );
  } catch (error) {
    logger.warn(
      '[templateStoryService] Failed to persist recent template id:',
      error,
    );
  }
}

function replacePlaceholders(
  template: string,
  profile: ProfileWithRelations,
): string {
  const childName = sanitizeName(profile.kid_name || '') || 'little hero';
  const friendName =
    sanitizeName(profile.friends?.[0]?.name || '') || 'best friend';
  const familyMember =
    sanitizeName(profile.family_members?.[0]?.name || '') || 'family';
  const city = sanitizeCity(profile.city || '') || 'their hometown';

  return template
    .replace(/\{CHILD_NAME\}/g, childName)
    .replace(/\{FRIEND_NAME\}/g, friendName)
    .replace(/\{FAMILY_MEMBER\}/g, familyMember)
    .replace(/\{CITY\}/g, city);
}

function buildTemplateQuiz(template: HydratedTemplate): QuizQuestion[] {
  const lesson = humanize(template.behavior_goal);
  const theme = humanize(template.theme);
  const mood = humanize(template.mood);
  const distractorLessons = [
    'sharing',
    'courage',
    'calmness',
    'kindness',
    'curiosity',
    'honesty',
  ];
  return [
    makeQuestion(
      'What lesson was this story helping us practice?',
      lesson,
      distractorLessons.filter((item) => item !== lesson).slice(0, 2),
    ),
    makeQuestion(
      'Which kind of adventure did this story feel like?',
      theme,
      ['bedtime', 'forest', 'space', 'ocean']
        .filter((item) => item !== theme)
        .slice(0, 2),
    ),
    makeQuestion(
      'How did this story feel?',
      mood,
      ['exciting', 'quiet', 'serious', 'silly']
        .filter((item) => item !== mood)
        .slice(0, 2),
    ),
  ];
}

export function hydrateTemplate(
  template: StoryTemplate,
  profile: ProfileWithRelations,
): HydratedTemplate {
  const content = replacePlaceholders(template.content_template, profile);
  return {
    id: template.id,
    title: replacePlaceholders(template.title_template, profile),
    content,
    behavior_goal: template.behavior_goal,
    theme: template.theme,
    mood: template.mood,
    word_count:
      content.split(/\s+/).filter(Boolean).length || template.word_count,
  };
}

export const templateStoryService = {
  async getMatchingTemplate(
    profile: ProfileWithRelations,
    behaviorGoal: string | null | undefined,
    languageCode: string,
  ): Promise<HydratedTemplate | null> {
    const filters = [
      Query.equal('language_code', languageCode),
      Query.limit(50),
    ];

    if (behaviorGoal) {
      filters.unshift(Query.equal('behavior_goal', behaviorGoal));
    }

    try {
      let response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORY_TEMPLATES,
        filters,
      );

      if (response.documents.length === 0 && languageCode !== 'en') {
        response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STORY_TEMPLATES,
          [
            ...(behaviorGoal
              ? [Query.equal('behavior_goal', behaviorGoal)]
              : []),
            Query.equal('language_code', 'en'),
            Query.limit(50),
          ],
        );
      }

      if (response.documents.length === 0) {
        response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STORY_TEMPLATES,
          [Query.limit(50)],
        );
      }

      const templates = response.documents.map((doc) => mapTemplateDoc(doc));
      const recentIds = await getRecentTemplateIds(profile.id);
      const unseenTemplates = templates.filter(
        (template) => !recentIds.includes(template.id),
      );
      const selectedPool =
        unseenTemplates.length > 0 ? unseenTemplates : templates;
      const selected = pickRandom(selectedPool);
      return selected ? hydrateTemplate(selected, profile) : null;
    } catch (error) {
      logger.error('[templateStoryService] Failed to fetch template:', error);
      return null;
    }
  },

  async generateTemplateStory(
    profile: ProfileWithRelations,
    behaviorGoal: string | null | undefined,
    languageCode: string,
  ): Promise<GeneratedStory | null> {
    const template = await this.getMatchingTemplate(
      profile,
      behaviorGoal,
      languageCode,
    );
    if (!template) return null;
    await rememberTemplateId(profile.id, template.id);

    // If language isn't English, translate the hydrated template
    if (languageCode !== 'en') {
      try {
        const { functions } = await import('@/lib/appwrite');
        const execution = await functions.createExecution({
          functionId: 'generate-story',
          body: JSON.stringify({
            action: 'translate',
            title: template.title,
            content: template.content,
            targetLanguage: languageCode,
          }),
          async: false,
        });
        if (execution.responseBody) {
          const parsed = JSON.parse(execution.responseBody);
          if (parsed.title && parsed.content) {
            template.title = parsed.title;
            template.content = parsed.content;
            template.word_count = parsed.content.split(/\s+/).filter(Boolean).length;
          }
        }
      } catch (e) {
        // Translation failed — fall back to English
        const { logger } = await import('@/utils/logger');
        logger.warn('[templateStoryService] Translation failed, using English:', e);
      }
    }

    return {
      title: template.title,
      content: template.content,
      word_count: template.word_count,
      quiz: buildTemplateQuiz(template),
    };
  },
};
