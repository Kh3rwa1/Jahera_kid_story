import { checkStorySafety, getFallbackStory } from '../storySafetyFilter';

describe('checkStorySafety', () => {
  // ─── Safe Stories ──────────────────────────────────────────

  it('passes a wholesome childrens story', () => {
    const result = checkStorySafety(
      'The Brave Little Bunny',
      'Once upon a time, a brave little bunny named Milo discovered a magical garden. ' +
        'He shared the beautiful flowers with all his friends and they laughed and played together. ' +
        'Milo learned that sharing brings joy to everyone. He felt proud and happy. ' +
        'The family gathered together for a warm hug under the sunshine. ' +
        'From that day on, Milo always helped his friends discover new adventures.',
    );
    expect(result.safe).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.flags).toHaveLength(0);
  });

  it('passes a story with mild conflict and positive resolution', () => {
    const result = checkStorySafety(
      'The Lost Treasure Map',
      'Lily found a mysterious treasure map in her attic. She was nervous about the adventure ' +
        'but gathered her courage and asked her friend Sam to come along. Together they solved ' +
        'puzzles, crossed a gentle river, and discovered that the real treasure was their friendship. ' +
        'They laughed with joy and shared their story with the whole family.',
    );
    expect(result.safe).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  // ─── Blocked Words ────────────────────────────────────────

  it('blocks a story containing violence keywords', () => {
    const result = checkStorySafety(
      'A Day in the Park',
      'The brave knight decided to kill the dragon with his sword. ' +
        'Blood was everywhere as the battle raged on. ' +
        'The villagers cheered at the murder of the beast.',
    );
    expect(result.safe).toBe(false);
    expect(result.flags.some((f) => f.includes('blocked_word'))).toBe(true);
  });

  it('blocks a story with profanity', () => {
    const result = checkStorySafety(
      'School Adventures',
      'The kids were playing when someone said a damn word. ' +
        'Everyone was shocked. They learned that using kind words ' +
        'makes everyone feel happy and loved.',
    );
    expect(result.safe).toBe(false);
    expect(result.flags.some((f) => f.includes('damn'))).toBe(true);
  });

  it('blocks stories with substance abuse references', () => {
    const result = checkStorySafety(
      'The Party',
      'The teenager went to a party where people were getting drunk and wasted. ' +
        'Someone offered cocaine and the room filled with smoke. ' +
        'Later they all felt terrible about their choices.',
    );
    expect(result.safe).toBe(false);
    expect(result.flags.some((f) => f.includes('blocked_word'))).toBe(true);
  });

  it('blocks stories with self-harm content', () => {
    const result = checkStorySafety(
      'Sad Story',
      'The character felt so hopeless they wanted to end my life. ' +
        'They thought about suicide and could not see any hope. ' +
        'Eventually a friend helped them feel better and find love again.',
    );
    expect(result.safe).toBe(false);
    expect(result.flags.some((f) => f.includes('blocked_word'))).toBe(true);
  });

  it('blocks stories with horror/demonic content', () => {
    const result = checkStorySafety(
      'The Old House',
      'The house was possessed by a demonic spirit. ' +
        'A satanic ritual was performed in the basement. ' +
        'The children ran away from the terrible creature.',
    );
    expect(result.safe).toBe(false);
  });

  it('blocks stories with sexual content', () => {
    const result = checkStorySafety(
      'Growing Up',
      'The story explored sexual themes that were inappropriate for children. ' +
        'There was nudity and erotic content throughout.',
    );
    expect(result.safe).toBe(false);
  });

  // ─── Blocked Phrases ──────────────────────────────────────

  it('blocks stories with dark phrases', () => {
    const result = checkStorySafety(
      'The End of Days',
      'Everyone died when the volcano erupted. No one survived the disaster. ' +
        'The world ended in fire and ash. ' +
        'Lost all hope, the last survivor wandered alone forever.',
    );
    expect(result.safe).toBe(false);
    expect(result.flags.some((f) => f.includes('blocked_phrase'))).toBe(true);
  });

  it('blocks abandonment-themed phrases', () => {
    const result = checkStorySafety(
      'Alone',
      'The child was abandoned forever by their family. ' +
        'Parents never came back and the child was locked in a room. ' +
        'Nobody cared about the little orphan forever.',
    );
    expect(result.safe).toBe(false);
    expect(result.flags.some((f) => f.includes('blocked_phrase'))).toBe(true);
  });

  // ─── Structural Validation ────────────────────────────────

  it('flags stories that are too short', () => {
    const result = checkStorySafety('Hi', 'Short story.');
    expect(result.flags).toContain('too_short');
  });

  it('flags stories with missing title', () => {
    const result = checkStorySafety(
      '',
      'This is a wonderful story about a brave rabbit who learned to share with friends and family. ' +
        'They discovered joy, laughter, and the beauty of kindness together.',
    );
    expect(result.flags).toContain('missing_title');
  });

  it('flags stories with excessively long titles', () => {
    const longTitle = 'A'.repeat(201);
    const result = checkStorySafety(
      longTitle,
      'A beautiful story about love, kindness, and adventure with friends and family. ' +
        'They explored magical forests and discovered hidden treasures together.',
    );
    expect(result.flags).toContain('title_too_long');
  });

  // ─── Negativity Detection ─────────────────────────────────

  it('flags stories with excessive negativity', () => {
    const negativeStory = Array(20)
      .fill(
        'The child was crying and screaming in fear. Alone and terrified, angry and furious.',
      )
      .join(' ');
    const result = checkStorySafety('Dark Times', negativeStory);
    expect(result.flags.some((f) => f.includes('high_negativity'))).toBe(true);
  });

  // ─── Repetition Detection (AI Hallucination) ──────────────

  it('flags repetitive content as potential AI hallucination', () => {
    const repetitive =
      'The cat sat on the mat and looked at the stars. '.repeat(20) +
      'The cat sat on the mat and looked at the stars. '.repeat(20);
    const result = checkStorySafety('The Cat Story', repetitive);
    expect(result.flags).toContain('repetitive_content');
  });

  // ─── Low Positive Content ─────────────────────────────────

  it('flags stories with no positive content', () => {
    const result = checkStorySafety(
      'The Report',
      'The machine processed the data. The numbers were calculated. ' +
        'The output was generated. The system completed the task. ' +
        'Another cycle began. The process repeated indefinitely. ' +
        'Sensors detected changes. Parameters were adjusted accordingly.',
    );
    expect(result.flags).toContain('low_positive_content');
  });

  // ─── Score Clamping ───────────────────────────────────────

  it('clamps score between 0 and 100', () => {
    const result = checkStorySafety(
      'Very Bad Story',
      'kill murder stab shoot blood death violence rape torture ' +
        'everyone died no one survived the world ended lost all hope ' +
        'left to die burned alive',
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.safe).toBe(false);
  });

  // ─── Edge Cases ───────────────────────────────────────────

  it('handles word boundary matching correctly (no false positives)', () => {
    // "skill" contains "kill" but should NOT trigger the blocklist
    // because the filter uses word boundaries
    const result = checkStorySafety(
      'Learning New Skills',
      'The child practiced a new skill every day. They discovered the thrill of learning. ' +
        'Together with friends, they shared joy and laughter. The adventure was magical and fun. ' +
        'Every skill they learned made them braver and more confident.',
    );
    expect(result.safe).toBe(true);
    expect(result.flags.filter((f) => f.includes('kill'))).toHaveLength(0);
  });

  it('is case-insensitive for blocked words', () => {
    const result = checkStorySafety(
      'Test Story',
      'The character was MURDERED in cold blood. KILL them all! ' +
        'VIOLENCE erupted across the land.',
    );
    expect(result.safe).toBe(false);
  });
});

describe('getFallbackStory', () => {
  it('returns a story with title and content', () => {
    const story = getFallbackStory();
    expect(story).toHaveProperty('title');
    expect(story).toHaveProperty('content');
    expect(story.title.length).toBeGreaterThan(3);
    expect(story.content.length).toBeGreaterThan(50);
  });

  it('returns stories that always pass the safety filter', () => {
    // Run this 50 times to test randomization
    for (let i = 0; i < 50; i++) {
      const story = getFallbackStory();
      const result = checkStorySafety(story.title, story.content);
      expect(result.safe).toBe(true);
      if (!result.safe) {
        // Helpful debug output if a fallback story fails
        console.error(`FALLBACK STORY FAILED SAFETY: "${story.title}"`, result);
      }
    }
  });

  it('returns different stories across calls (randomized)', () => {
    const titles = new Set<string>();
    for (let i = 0; i < 30; i++) {
      titles.add(getFallbackStory().title);
    }
    // With 20 fallback stories, 30 calls should hit at least 3 unique ones
    expect(titles.size).toBeGreaterThanOrEqual(3);
  });
});
