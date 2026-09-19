/**
 * Shared Safety Wordlist — single source of truth
 * ================================================================
 * This file is the canonical blocklist for children's story content.
 *
 * Consumers:
 *  - utils/storySafetyFilter.ts   (client-side post-generation check)
 *  - appwrite/functions/generate-story/index.js (server-side check)
 *  - config collection keys 'blocked_words' / 'blocked_phrases'
 *    (runtime overrides — merged ON TOP of these defaults)
 *
 * IMPORTANT: The server function is plain JS and cannot import TS directly,
 * so its index.js carries a mirrored copy of these arrays. When you change
 * a list here, mirror the change in:
 *   appwrite/functions/generate-story/index.js  (BLOCKED_WORDS / BLOCKED_PHRASES)
 */

/** Words that must NEVER appear in a children's story. */
export const BLOCKED_WORDS: string[] = [
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
  'zombie',
  'haunted',

  // Abuse
  'child abuse',
  'beat the child',
  'hit the child',
  'abused',
  'domestic violence',
  'molested',
  'predator',
  'trafficking',

  // Hate speech
  'racial slur',
  'hate crime',
  'supremacist',
  'nazi',
  'fascist',
  'ethnic cleansing',
  'genocide',
  'racist',

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

/** Phrases that indicate dark/inappropriate themes. */
export const BLOCKED_PHRASES: string[] = [
  'everyone died',
  'they all died',
  'no one survived',
  'the world ended',
  'world ended',
  'lost all hope',
  'abandoned forever',
  'never loved',
  'nobody cared',
  'left to die',
  'burned alive',
  'eaten alive',
  'drowned in',
  'drowned to death',
  'bled to death',
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
  'abandoned by parents',
  'orphan forever',
  'locked in a cage',
  'locked in a room',
  'starved to death',
  'tortured',
  'touched inappropriately',
  'secret between us',
  'dont tell anyone',
  'you are worthless',
  'nobody loves you',
  'you deserve pain',
];
