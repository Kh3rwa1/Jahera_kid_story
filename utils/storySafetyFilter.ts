/**
 * Story Safety Filter
 * 
 * Validates AI-generated story content before it reaches the user.
 * Runs on every story returned from the generation pipeline.
 * 
 * Strategy:
 *   1. Keyword blocklist scan (fast, catches obvious issues)
 *   2. Theme/sentiment analysis (pattern-based)
 *   3. Structural validation (story format checks)
 *   4. If any check fails → flag + use fallback story
 */

import { logger } from '@/utils/logger';

// ─── BLOCKLIST ──────────────────────────────────────────────────────
// Words/phrases that should NEVER appear in a children's story
const BLOCKED_WORDS: string[] = [
  // Violence
  'kill', 'killed', 'killing', 'murder', 'murdered', 'stab', 'stabbed',
  'shoot', 'shot', 'gunshot', 'strangle', 'choke', 'suffocate',
  'decapitate', 'dismember', 'torture', 'torment', 'slaughter',
  'massacre', 'assassin', 'execute', 'execution', 'bloodbath',
  'gore', 'gory', 'mutilate', 'corpse', 'dead body',
  
  // Weapons (specific)
  'pistol', 'rifle', 'shotgun', 'machete', 'grenade', 'explosive',
  'dynamite', 'ammunition', 'bullet wound',
  
  // Sexual content
  'sexual', 'sexually', 'orgasm', 'erotic', 'pornograph', 'molest',
  'rape', 'raped', 'grope', 'fondle', 'genital', 'nude', 'nudity',
  'naked body', 'undress', 'strip naked', 'sex scene',
  
  // Substance abuse
  'cocaine', 'heroin', 'methamphetamine', 'marijuana', 'overdose',
  'drug dealer', 'drug deal', 'getting high', 'snort', 'inject drugs',
  'drunk', 'drunken', 'alcoholic', 'wasted',
  
  // Self-harm / suicide
  'suicide', 'suicidal', 'self-harm', 'cut myself', 'cut herself',
  'cut himself', 'hang myself', 'hang herself', 'hang himself',
  'jump off', 'end my life', 'end their life', 'kill myself',
  'kill herself', 'kill himself', 'wrist', 'noose',
  
  // Horror / extreme fear (inappropriate for young children)
  'demon', 'demonic', 'possessed', 'possession', 'exorcis',
  'satanic', 'satan', 'lucifer', 'hell fire', 'damned',
  'nightmare creature', 'flesh eating', 'cannibal',
  
  // Abuse
  'child abuse', 'beat the child', 'hit the child', 'abused',
  'domestic violence', 'molested', 'trafficking',
  
  // Hate speech
  'racial slur', 'hate crime', 'supremacist', 'nazi', 'fascist',
  'ethnic cleansing', 'genocide',
  
  // Profanity
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn',
  'crap', 'piss', 'whore', 'slut',
];

// Phrases that indicate dark/inappropriate themes
const BLOCKED_PHRASES: string[] = [
  'everyone died',
  'no one survived',
  'the world ended',
  'lost all hope',
  'abandoned forever',
  'never loved',
  'nobody cared',
  'left to die',
  'burned alive',
  'eaten alive',
  'drowned in',
  'pool of blood',
  'covered in blood',
  'eyes gouged',
  'skin peeled',
  'bones cracked',
  'screamed in agony',
  'begged for death',
  'wished to die',
  'ran away from home forever',
  'parents never came back',
  'orphan forever',
  'locked in a cage',
  'locked in a room',
  'starved to death',
];

// ─── THEME VALIDATORS ───────────────────────────────────────────────
// Stories should have positive/neutral emotional arcs

const POSITIVE_INDICATORS: string[] = [
  'happy', 'joy', 'smile', 'laugh', 'friend', 'love', 'kind',
  'brave', 'courage', 'help', 'share', 'together', 'learn',
  'discover', 'adventure', 'magic', 'wonder', 'play', 'fun',
  'family', 'hug', 'thank', 'grateful', 'proud', 'hope',
  'gentle', 'caring', 'beautiful', 'bright', 'sunshine',
];

// ─── SAFETY CHECK RESULT ────────────────────────────────────────────

export interface SafetyCheckResult {
  safe: boolean;
  flags: string[];
  score: number; // 0-100, higher = safer
  details: string;
}

// ─── MAIN FILTER FUNCTION ───────────────────────────────────────────

export function checkStorySafety(
  title: string,
  content: string
): SafetyCheckResult {
  const flags: string[] = [];
  let score = 100;

  const fullText = `${title} ${content}`.toLowerCase();
  const words = fullText.split(/\s+/);

  // ── Check 1: Blocked words ────────────────────────────────────
  for (const blocked of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${blocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(fullText)) {
      flags.push(`blocked_word: "${blocked}"`);
      score -= 30;
    }
  }

  // ── Check 2: Blocked phrases ──────────────────────────────────
  for (const phrase of BLOCKED_PHRASES) {
    if (fullText.includes(phrase.toLowerCase())) {
      flags.push(`blocked_phrase: "${phrase}"`);
      score -= 40;
    }
  }

  // ── Check 3: Positive content ratio ───────────────────────────
  // Stories should have at least some positive language
  let positiveCount = 0;
  for (const word of POSITIVE_INDICATORS) {
    if (fullText.includes(word)) positiveCount++;
  }
  const positiveRatio = positiveCount / POSITIVE_INDICATORS.length;
  if (positiveRatio < 0.05) {
    flags.push('low_positive_content');
    score -= 15;
  }

  // ── Check 4: Story structure validation ───────────────────────
  // A valid story should have reasonable length
  if (words.length < 20) {
    flags.push('too_short');
    score -= 10;
  }
  if (words.length > 5000) {
    flags.push('too_long');
    score -= 5;
  }

  // Title should exist and be reasonable
  if (!title || title.trim().length < 3) {
    flags.push('missing_title');
    score -= 10;
  }
  if (title && title.length > 200) {
    flags.push('title_too_long');
    score -= 5;
  }

  // ── Check 5: Excessive negativity ─────────────────────────────
  const negativeWords = ['cry', 'crying', 'cried', 'scream', 'screaming',
    'afraid', 'terrified', 'horror', 'horrible', 'terrible',
    'scary', 'frightening', 'dark', 'darkness', 'alone', 'lonely',
    'angry', 'furious', 'rage', 'punish', 'punishment'];
  
  let negativeCount = 0;
  for (const neg of negativeWords) {
    const matches = fullText.match(new RegExp(`\\b${neg}\\b`, 'gi'));
    if (matches) negativeCount += matches.length;
  }
  
  // More than 5% negative words is a flag
  const negativeRatio = negativeCount / words.length;
  if (negativeRatio > 0.05) {
    flags.push(`high_negativity: ${(negativeRatio * 100).toFixed(1)}%`);
    score -= 20;
  }

  // ── Check 6: Repetitive content (AI hallucination indicator) ──
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length > 3) {
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    const repetitionRatio = uniqueSentences.size / sentences.length;
    if (repetitionRatio < 0.7) {
      flags.push('repetitive_content');
      score -= 15;
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  const safe = score >= 50 && !flags.some(f => 
    f.startsWith('blocked_word') || f.startsWith('blocked_phrase')
  );

  const details = safe
    ? `Story passed safety check (score: ${score}/100)`
    : `Story FAILED safety check (score: ${score}/100). Flags: ${flags.join(', ')}`;

  if (!safe) {
    logger.warn('[StorySafety] BLOCKED:', details);
  } else if (flags.length > 0) {
    logger.debug('[StorySafety] Passed with warnings:', details);
  }

  return { safe, flags, score, details };
}

// ─── FALLBACK STORIES ───────────────────────────────────────────────
// Pre-approved safe stories when AI output fails safety checks

const FALLBACK_STORIES = [
  {
    title: "The Kindness Garden",
    content: `Once upon a time, there was a magical garden where every kind word planted a new flower. A little child discovered this garden one sunny morning and decided to spread kindness everywhere. "Good morning!" they said to the birds, and a bright yellow sunflower sprouted. "Thank you!" they told the trees, and a beautiful rose appeared. By the end of the day, the garden was full of colorful flowers, each one representing a kind word shared with the world. The child smiled, knowing that kindness was the most powerful magic of all. From that day on, they made sure to plant at least one flower of kindness every single day, and the garden grew more beautiful than anyone could imagine.`,
  },
  {
    title: "The Brave Little Star",
    content: `High up in the night sky, there lived a tiny star who was afraid of the dark. All the other stars shone brightly, but this little star kept hiding behind the clouds. One night, a lost firefly asked the star for help. "Please shine your light so I can find my way home," the firefly said. The little star took a deep breath and began to glow. At first, the light was small, but as the star grew braver, it shone brighter and brighter. The firefly found its way home, and the little star realized something wonderful — being brave doesn't mean not being scared. It means helping others even when you are. From that night on, the brave little star shone the brightest of them all.`,
  },
  {
    title: "The Sharing Rainbow",
    content: `After a gentle rain, a beautiful rainbow appeared in the sky. But this was no ordinary rainbow — each color had a special gift. Red shared warmth, orange shared laughter, yellow shared sunshine, green shared growth, blue shared calm, and purple shared dreams. A young child looked up and wished they could share something too. The rainbow whispered, "You already do. Every time you share a smile, a toy, or a story with someone, you add your own color to the world." The child understood that sharing wasn't just about things — it was about spreading joy. And from that day on, everywhere the child went, people said the world seemed just a little more colorful.`,
  },
  {
    title: "The Curious Explorer",
    content: `There was once a curious child who asked questions about everything. "Why is the sky blue? Where do butterflies sleep? What makes the wind blow?" Some people said, "Too many questions!" But a wise old owl said, "Questions are the keys that open the doors of knowledge." So the child kept asking, and with every answer, they discovered something amazing. They learned that the sky is blue because of sunlight dancing with the air, that butterflies sleep under leaves, and that the wind blows because the sun warms the earth unevenly. The more they learned, the more wonderful the world became. And the child never stopped asking, because curiosity is the greatest adventure of all.`,
  },
  {
    title: "The Gratitude Tree",
    content: `In the middle of a village stood an ancient tree. The villagers called it the Gratitude Tree because whenever someone said "thank you" near it, a golden leaf would appear on its branches. One day, a child noticed the tree had very few leaves. "People must have forgotten to be grateful," the child thought. So the child started a mission. They thanked the baker for the bread, the teacher for the lessons, the sun for the warmth, and even the rain for helping the flowers grow. Soon, the tree was covered in shimmering golden leaves, and it became the most beautiful tree in the world. The child learned that gratitude doesn't just make trees beautiful — it makes hearts beautiful too.`,
  },
];

export function getFallbackStory(): { title: string; content: string } {
  const index = Math.floor(Math.random() * FALLBACK_STORIES.length);
  return FALLBACK_STORIES[index];
}
