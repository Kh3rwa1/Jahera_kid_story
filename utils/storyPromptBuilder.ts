import { BEHAVIOR_GOALS } from '@/constants/behaviorGoals';
import { ProfileWithRelations } from '@/types/database';
import { StoryContext } from '@/utils/contextUtils';
import { sanitizeCity, sanitizeFreeText, sanitizeName } from '@/utils/promptSanitizer';

interface PromptOptions {
  theme?: string;
  mood?: string;
  length?: 'short' | 'medium' | 'long';
  behaviorGoal?: string;
}

export function buildStorySystemPrompt(
  profile: ProfileWithRelations,
  languageCode: string,
  context: StoryContext,
  _contextLocation: { city?: string | null } | null,
  options?: PromptOptions
): string {
  const kid = sanitizeName(profile.kid_name || 'Child');
  const family = (profile.family_members || []).map(m => sanitizeName(m.name)).filter(Boolean);
  const friends = (profile.friends || []).map(f => sanitizeName(f.name)).filter(Boolean);
  const city = sanitizeCity(profile.city || '');
  const theme = sanitizeFreeText(options?.theme || 'adventure');
  const mood = sanitizeFreeText(options?.mood || 'exciting');
  const goal = BEHAVIOR_GOALS.find(g => g.id === options?.behaviorGoal);

  return [
    'You are a world-class children\'s storyteller writing safe, engaging adventure stories.',
    `Child: ${kid}`,
    `Family members: ${family.length ? family.join(', ') : 'None provided'}`,
    `Friends: ${friends.length ? friends.join(', ') : 'None provided'}`,
    `Language: ${languageCode}`,
    `Location: ${city || 'Not specified'}`,
    `Theme: ${theme || 'adventure'}`,
    `Mood: ${mood || 'exciting'}`,
    `Length: ${options?.length || 'medium'}`,
    `Time context: ${context.timeOfDay} in ${context.season}`,
    goal
      ? `BEHAVIORAL LESSON (CRITICAL): ${goal.promptInstruction} The story MUST naturally weave this lesson into the narrative. Do NOT lecture — teach through the adventure.`
      : null,
  ].filter(Boolean).join('\n');
}
