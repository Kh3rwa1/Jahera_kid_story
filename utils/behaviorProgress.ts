import { BEHAVIOR_GOALS } from '@/constants/behaviorGoals';
import { Story } from '@/types/database';

export interface BehaviorProgressItem {
  goalId: string;
  label: string;
  emoji: string;
  count: number;
  percentage: number;
}

export function computeBehaviorProgress(
  stories: Story[],
  days: number = 30,
): BehaviorProgressItem[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = stories.filter(
    (s) =>
      s.behavior_goal &&
      new Date(s.generated_at || s.created_at).getTime() >= cutoff,
  );
  const total = filtered.length;
  if (total === 0) return [];

  const counts = filtered.reduce<Record<string, number>>((acc, s) => {
    const key = s.behavior_goal as string;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([goalId, count]) => {
      const goal = BEHAVIOR_GOALS.find((g) => g.id === goalId);
      return {
        goalId,
        label: goal?.label || goalId,
        emoji: goal?.emoji || '🎯',
        count,
        percentage: Math.round((count / total) * 100),
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function getWeeklySummary(stories: Story[]) {
  const last7 = computeBehaviorProgress(stories, 7);
  const totalStories = stories.filter(
    (s) =>
      new Date(s.generated_at || s.created_at).getTime() >=
      Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).length;
  return {
    totalStories,
    topGoal: last7[0] || null,
    goalsWorkedOn: last7.length,
  };
}
