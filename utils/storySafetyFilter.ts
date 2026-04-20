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
  'kill',
  'killed',
  'killing',
  'murder',
  'murdered',
  'stab',
  'stabbed',
  'shoot',
  'shot',
  'gunshot',
  'strangle',
  'choke',
  'suffocate',
  'decapitate',
  'dismember',
  'torture',
  'torment',
  'slaughter',
  'massacre',
  'assassin',
  'execute',
  'execution',
  'bloodbath',
  'gore',
  'gory',
  'mutilate',
  'corpse',
  'dead body',

  // Weapons (specific)
  'pistol',
  'rifle',
  'shotgun',
  'machete',
  'grenade',
  'explosive',
  'dynamite',
  'ammunition',
  'bullet wound',

  // Sexual content
  'sexual',
  'sexually',
  'orgasm',
  'erotic',
  'pornograph',
  'molest',
  'rape',
  'raped',
  'grope',
  'fondle',
  'genital',
  'nude',
  'nudity',
  'naked body',
  'undress',
  'strip naked',
  'sex scene',

  // Substance abuse
  'cocaine',
  'heroin',
  'methamphetamine',
  'marijuana',
  'overdose',
  'drug dealer',
  'drug deal',
  'getting high',
  'snort',
  'inject drugs',
  'drunk',
  'drunken',
  'alcoholic',
  'wasted',

  // Self-harm / suicide
  'suicide',
  'suicidal',
  'self-harm',
  'cut myself',
  'cut herself',
  'cut himself',
  'hang myself',
  'hang herself',
  'hang himself',
  'jump off',
  'end my life',
  'end their life',
  'kill myself',
  'kill herself',
  'kill himself',
  'wrist',
  'noose',

  // Horror / extreme fear (inappropriate for young children)
  'demon',
  'demonic',
  'possessed',
  'possession',
  'exorcis',
  'satanic',
  'satan',
  'lucifer',
  'hell fire',
  'damned',
  'nightmare creature',
  'flesh eating',
  'cannibal',

  // Abuse
  'child abuse',
  'beat the child',
  'hit the child',
  'abused',
  'domestic violence',
  'molested',
  'trafficking',

  // Hate speech
  'racial slur',
  'hate crime',
  'supremacist',
  'nazi',
  'fascist',
  'ethnic cleansing',
  'genocide',

  // Profanity
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'damn',
  'crap',
  'piss',
  'whore',
  'slut',
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
  'happy',
  'joy',
  'smile',
  'laugh',
  'friend',
  'love',
  'kind',
  'brave',
  'courage',
  'help',
  'share',
  'together',
  'learn',
  'discover',
  'adventure',
  'magic',
  'wonder',
  'play',
  'fun',
  'family',
  'hug',
  'thank',
  'grateful',
  'proud',
  'hope',
  'gentle',
  'caring',
  'beautiful',
  'bright',
  'sunshine',
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
  content: string,
): SafetyCheckResult {
  const flags: string[] = [];
  let score = 100;

  const fullText = `${title} ${content}`.toLowerCase();
  const words = fullText.split(/\s+/);

  // ── Check 1: Blocked words ────────────────────────────────────
  for (const blocked of BLOCKED_WORDS) {
    const regex = new RegExp(
      `\\b${blocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    );
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
  const negativeWords = [
    'cry',
    'crying',
    'cried',
    'scream',
    'screaming',
    'afraid',
    'terrified',
    'horror',
    'horrible',
    'terrible',
    'scary',
    'frightening',
    'dark',
    'darkness',
    'alone',
    'lonely',
    'angry',
    'furious',
    'rage',
    'punish',
    'punishment',
  ];

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
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length > 3) {
    const uniqueSentences = new Set(
      sentences.map((s) => s.trim().toLowerCase()),
    );
    const repetitionRatio = uniqueSentences.size / sentences.length;
    if (repetitionRatio < 0.7) {
      flags.push('repetitive_content');
      score -= 15;
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  const safe =
    score >= 50 &&
    !flags.some(
      (f) => f.startsWith('blocked_word') || f.startsWith('blocked_phrase'),
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
    title: 'The Kindness Garden',
    content: `Once upon a time, there was a magical garden where every kind word planted a new flower. A little child discovered this garden one sunny morning and decided to spread kindness everywhere. "Good morning!" they said to the birds, and a bright yellow sunflower sprouted. "Thank you!" they told the trees, and a beautiful rose appeared. By the end of the day, the garden was full of colorful flowers, each one representing a kind word shared with the world. The child smiled, knowing that kindness was the most powerful magic of all. From that day on, they made sure to plant at least one flower of kindness every single day, and the garden grew more beautiful than anyone could imagine.`,
  },
  {
    title: 'The Brave Little Star',
    content: `High up in the night sky, there lived a tiny star who was afraid of the dark. All the other stars shone brightly, but this little star kept hiding behind the clouds. One night, a lost firefly asked the star for help. "Please shine your light so I can find my way home," the firefly said. The little star took a deep breath and began to glow. At first, the light was small, but as the star grew braver, it shone brighter and brighter. The firefly found its way home, and the little star realized something wonderful — being brave doesn't mean not being scared. It means helping others even when you are. From that night on, the brave little star shone the brightest of them all.`,
  },
  {
    title: 'The Sharing Rainbow',
    content: `After a gentle rain, a beautiful rainbow appeared in the sky. But this was no ordinary rainbow — each color had a special gift. Red shared warmth, orange shared laughter, yellow shared sunshine, green shared growth, blue shared calm, and purple shared dreams. A young child looked up and wished they could share something too. The rainbow whispered, "You already do. Every time you share a smile, a toy, or a story with someone, you add your own color to the world." The child understood that sharing wasn't just about things — it was about spreading joy. And from that day on, everywhere the child went, people said the world seemed just a little more colorful.`,
  },
  {
    title: 'The Curious Explorer',
    content: `There was once a curious child who asked questions about everything. "Why is the sky blue? Where do butterflies sleep? What makes the wind blow?" Some people said, "Too many questions!" But a wise old owl said, "Questions are the keys that open the doors of knowledge." So the child kept asking, and with every answer, they discovered something amazing. They learned that the sky is blue because of sunlight dancing with the air, that butterflies sleep under leaves, and that the wind blows because the sun warms the earth unevenly. The more they learned, the more wonderful the world became. And the child never stopped asking, because curiosity is the greatest adventure of all.`,
  },
  {
    title: 'The Gratitude Tree',
    content: `In the middle of a village stood an ancient tree. The villagers called it the Gratitude Tree because whenever someone said "thank you" near it, a golden leaf would appear on its branches. One day, a child noticed the tree had very few leaves. "People must have forgotten to be grateful," the child thought. So the child started a mission. They thanked the baker for the bread, the teacher for the lessons, the sun for the warmth, and even the rain for helping the flowers grow. Soon, the tree was covered in shimmering golden leaves, and it became the most beautiful tree in the world. The child learned that gratitude doesn't just make trees beautiful — it makes hearts beautiful too.`,
  },

  {
    title: 'The Cloud Painter',
    content:
      'Every morning, a little cloud painter named Skye mixed colors from the sunrise to paint the sky. One day, Skye ran out of pink paint and had to use orange and purple instead. The result was the most spectacular sunset anyone had ever seen. The birds sang extra songs that evening, and the flowers stayed open a little longer just to watch. Skye learned that mistakes sometimes create the most beautiful things of all.',
  },
  {
    title: 'The Singing River',
    content:
      'Deep in the valley, a gentle river hummed a melody that only kind hearts could hear. A young traveler discovered the river and sat beside it, listening carefully. The river sang about every creature it had helped — the thirsty deer, the playful otters, the flowers along its banks. Inspired, the traveler began helping others too, and soon their own heart sang a melody just as beautiful.',
  },
  {
    title: 'The Library of Lost Dreams',
    content:
      'In a hidden corner of the city stood a tiny library where forgotten dreams were kept on shelves like books. A curious child wandered in one rainy afternoon and opened a glowing volume. Inside was a dream about learning to fly — not with wings, but with imagination. The child read every page, and by the time they finished, they realized their own dreams were just as powerful as any story ever written.',
  },
  {
    title: 'The Friendship Bridge',
    content:
      'Two villages sat on opposite sides of a wide canyon with no way to cross. One day, children from both sides started building a bridge — each side working toward the middle. When the two halves finally met, the children cheered and danced together. They discovered that the friends on the other side loved the same games, the same jokes, and the same starry nights. The bridge became the most popular place in both villages.',
  },
  {
    title: 'The Moonlight Festival',
    content:
      'Once a year, when the moon was biggest and brightest, the forest animals held a festival of lights. Every creature brought their own glow — fireflies carried lanterns, mushrooms shimmered softly, and the wise old owl wore a crown of stars. A child who had wandered into the forest was invited to join. They danced with rabbits, sang with frogs, and discovered that magic is everywhere when you know where to look.',
  },
  {
    title: 'The Garden of Gratitude',
    content:
      'In a quiet neighborhood, an elderly gardener tended the most wonderful garden anyone had ever seen. The secret was simple: every plant grew from a seed of gratitude. When you whispered something you were thankful for, a seed would sprout instantly. Children came from all around to plant seeds of thanks — for sunny days, warm hugs, and chocolate cake. The garden grew so large it became a park where everyone felt happy.',
  },
  {
    title: 'The Courageous Caterpillar',
    content:
      'A small caterpillar named Cleo was afraid of heights, which was a problem because caterpillars are supposed to climb. While all the others raced up the tallest trees, Cleo stayed close to the ground. One day, Cleo found a tiny snail struggling to cross a puddle. Cleo helped the snail, and together they explored the world from ground level — finding treasures everyone else missed. When it was finally time to become a butterfly, Cleo spread the most colorful wings of all, painted with every ground-level adventure.',
  },
  {
    title: 'The Treasure Map of Kindness',
    content:
      'A mysterious map appeared on the doorstep one morning, marked with an X and a note: Follow the kind path. The first stop was the bakery, where helping carry bags revealed the next clue. Then the park, where pushing a friend on the swings uncovered another. Each act of kindness led to the next marker. At the end of the trail was a mirror with a golden frame and a message: The treasure was you all along — a heart full of kindness is the greatest treasure in the world.',
  },
  {
    title: 'The Night Sky Orchestra',
    content:
      'Every night, the stars formed an orchestra to play lullabies for the sleeping world. The North Star conducted, the constellations played strings, and shooting stars added dramatic crescendos. One restless night, a child looked up and listened — really listened — and heard the faintest, most beautiful music. From that night on, they never had trouble falling asleep, because they knew the stars were always singing just for them.',
  },
  {
    title: 'The Color Thief Mystery',
    content:
      'One morning, all the colors in town began to fade. The red fire trucks turned grey, the green trees went pale, and even the blue sky looked washed out. A determined child set out to solve the mystery. They discovered that a lonely cloud had been accidentally absorbing all the colors because it wanted to be beautiful too. The child taught the cloud to share the colors by making rainbows, and the town became more colorful than ever — with twice as many rainbows as before.',
  },
  {
    title: 'The Whispering Shells',
    content:
      'At the edge of the sea, special shells washed ashore that whispered stories when held to the ear. Each shell told a different tale — of dolphins dancing at dawn, of seahorses racing through coral cities, of wise old turtles sharing ancient jokes. A child collected these shells and shared them with friends who could not visit the beach. The stories brought the ocean to everyone, proving that sharing joy multiplies it.',
  },
  {
    title: 'The Patience Tree',
    content:
      'In the center of town grew an enormous tree that only bloomed for those who waited patiently. Many people came and left quickly, but one child sat beneath it day after day, reading books and drawing pictures. Weeks passed, and just when the child had forgotten about the blooming, the tree burst into the most spectacular flowers — each petal containing a tiny wish that came true. The child learned that the best things in life are worth waiting for.',
  },
  {
    title: 'The Laugh Factory',
    content:
      'Hidden behind the tallest building in town was a tiny factory that bottled laughter. Giggles went into blue bottles, belly laughs into red ones, and the rarest of all — snort-laughs — went into golden bottles. A child discovered the factory and was given a job: testing the laughs to make sure they were genuine. It was the best job in the world. Every bottle they tested filled the factory with joy, and the child realized that laughter is the one thing that gets bigger the more you give it away.',
  },
  {
    title: 'The Dream Weaver',
    content:
      'Every night, a gentle spider named Silka wove special webs that caught good dreams and sent them floating down to sleeping children. One night, Silka noticed a child having a nightmare and wove the strongest, most beautiful web yet. It caught the bad dream and transformed it into an adventure where the scary monster turned out to be a friendly creature who just wanted a hug. The child woke up smiling, and Silka added a new pattern to remember — sometimes the things that scare us just need a little understanding.',
  },
  {
    title: 'The Compass of Curiosity',
    content:
      'An old compass found in a dusty attic did not point north — it pointed toward the most interesting thing nearby. Following it through the neighborhood revealed hidden wonders everywhere: a family of foxes living under the library, a wall covered in tiny fossils, a neighbor who once sailed around the world. Every discovery led to a new question, and every question led to a new adventure. The child learned that curiosity is the compass that makes life extraordinary.',
  },
];

export function getFallbackStory(): { title: string; content: string } {
  const index = Math.floor(Math.random() * FALLBACK_STORIES.length);
  return FALLBACK_STORIES[index];
}
