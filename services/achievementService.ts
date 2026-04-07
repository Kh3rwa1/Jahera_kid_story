import { hapticFeedback } from '@/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

const ACHIEVEMENTS_KEY = 'user_achievements';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  {
    id: 'first_story',
    title: 'Story Explorer',
    description: 'Generate your first story',
    icon: '📖',
  },
  {
    id: 'five_stories',
    title: 'Avid Reader',
    description: 'Generate 5 stories',
    icon: '📚',
    maxProgress: 5,
  },
  {
    id: 'ten_stories',
    title: 'Story Master',
    description: 'Generate 10 stories',
    icon: '🌟',
    maxProgress: 10,
  },
  {
    id: 'first_quiz_perfect',
    title: 'Quiz Champion',
    description: 'Get a perfect score on your first quiz',
    icon: '🏆',
  },
  {
    id: 'multilingual',
    title: 'World Traveler',
    description: 'Generate stories in 3 different languages',
    icon: '🌍',
    maxProgress: 3,
  },
  {
    id: 'night_owl',
    title: 'Night Reader',
    description: 'Generate a story at night',
    icon: '🌙',
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Generate a story in the morning',
    icon: '🌅',
  },
  {
    id: 'quiz_streak',
    title: 'Perfect Streak',
    description: 'Get 3 perfect quiz scores in a row',
    icon: '🔥',
    maxProgress: 3,
  },
];

class AchievementService {
  private achievements: Achievement[] = [];

  async loadAchievements(): Promise<Achievement[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      this.achievements = stored ? JSON.parse(stored) : [];
      return this.achievements;
    } catch (error) {
      console.error('Failed to load achievements:', error);
      return [];
    }
  }

  async unlockAchievement(achievementId: string, onUnlock?: (achievement: Achievement) => void): Promise<boolean> {
    try {
      const achievement = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
      if (!achievement) return false;

      const existing = this.achievements.find((a) => a.id === achievementId);
      if (existing?.unlockedAt) return false; // Already unlocked

      const unlocked: Achievement = {
        ...achievement,
        unlockedAt: new Date().toISOString(),
      };

      this.achievements = [...this.achievements.filter((a) => a.id !== achievementId), unlocked];
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));

      // Celebration feedback
      await hapticFeedback.celebrate();

      onUnlock?.(unlocked);
      return true;
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      return false;
    }
  }

  async updateProgress(
    achievementId: string,
    progress: number,
    onComplete?: (achievement: Achievement) => void
  ): Promise<void> {
    try {
      const definition = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
      if (!definition?.maxProgress) return;

      let achievement = this.achievements.find((a) => a.id === achievementId);
      if (achievement?.unlockedAt) return; // Already completed

      if (!achievement) {
        achievement = { ...definition, progress: 0 };
      }

      achievement.progress = Math.min(progress, definition.maxProgress);

      this.achievements = [...this.achievements.filter((a) => a.id !== achievementId), achievement];

      if (achievement.progress >= definition.maxProgress) {
        achievement.unlockedAt = new Date().toISOString();
        await hapticFeedback.celebrate();
        onComplete?.(achievement);
      }

      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Failed to update achievement progress:', error);
    }
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    if (this.achievements.length === 0) {
      await this.loadAchievements();
    }
    return this.achievements.filter((a) => a.unlockedAt);
  }

  async getProgressAchievements(): Promise<Achievement[]> {
    if (this.achievements.length === 0) {
      await this.loadAchievements();
    }
    return this.achievements.filter((a) => !a.unlockedAt && a.progress !== undefined);
  }

  async getAchievementStats() {
    const unlocked = await this.getUnlockedAchievements();
    return {
      total: ACHIEVEMENT_DEFINITIONS.length,
      unlocked: unlocked.length,
      percentage: Math.round((unlocked.length / ACHIEVEMENT_DEFINITIONS.length) * 100),
    };
  }
}

export const achievementService = new AchievementService();
