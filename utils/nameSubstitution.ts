import { Story } from '@/types/database';

/**
 * The original kid name used in all pre-generated stories.
 * All story content is generated with this name and dynamically
 * replaced at display/audio time with the current user's kid name.
 */
const ORIGINAL_KID_NAME = 'Jahera';

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace the original kid name with the current user's kid name
 * in both the story title and content. Handles case-insensitive
 * matching and preserves the original casing style of the replacement.
 *
 * Also handles possessives like "Jahera's" → "Max's".
 */
export function personalizeStory(
  story: Story,
  currentKidName: string,
  currentCity?: string | null
): Story {
  if (!currentKidName) return story;

  // If the name is the same, skip substitution
  if (currentKidName.toLowerCase() === ORIGINAL_KID_NAME.toLowerCase()) {
    return story;
  }

  // Build a regex that matches the original name (case-insensitive)
  const nameRegex = new RegExp(escapeRegExp(ORIGINAL_KID_NAME), 'gi');

  let personalizedTitle = story.title.replace(nameRegex, currentKidName);
  let personalizedContent = story.content.replace(nameRegex, currentKidName);

  return {
    ...story,
    title: personalizedTitle,
    content: personalizedContent,
  };
}

/**
 * Personalize an array of stories for the current user.
 */
export function personalizeStories(
  stories: Story[],
  currentKidName: string,
  currentCity?: string | null
): Story[] {
  return stories.map(s => personalizeStory(s, currentKidName, currentCity));
}
