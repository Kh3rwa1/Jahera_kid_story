import { analytics } from '@/services/analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';

const RATING_STORAGE_KEY = 'app_rating_data';
const MIN_STORIES_FOR_RATING = 3;
const MIN_DAYS_FOR_RATING = 3;
const REMIND_LATER_DAYS = 7;

interface RatingData {
  hasRated: boolean;
  lastPromptDate?: string;
  firstLaunchDate: string;
  storiesGenerated: number;
  remindLater: boolean;
}

class AppRatingService {
  private ratingData: RatingData | null = null;

  async loadRatingData(): Promise<RatingData> {
    try {
      const stored = await AsyncStorage.getItem(RATING_STORAGE_KEY);
      if (stored) {
        this.ratingData = JSON.parse(stored);
      } else {
        // First time initialization
        this.ratingData = {
          hasRated: false,
          firstLaunchDate: new Date().toISOString(),
          storiesGenerated: 0,
          remindLater: false,
        };
        await this.saveRatingData();
      }
      return this.ratingData!;
    } catch (error) {
      console.error('Failed to load rating data:', error);
      return {
        hasRated: false,
        firstLaunchDate: new Date().toISOString(),
        storiesGenerated: 0,
        remindLater: false,
      };
    }
  }

  private async saveRatingData() {
    try {
      if (this.ratingData) {
        await AsyncStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(this.ratingData));
      }
    } catch (error) {
      console.error('Failed to save rating data:', error);
    }
  }

  async incrementStoriesGenerated() {
    if (!this.ratingData) {
      await this.loadRatingData();
    }
    if (this.ratingData) {
      this.ratingData.storiesGenerated += 1;
      await this.saveRatingData();
    }
  }

  async shouldShowRatingPrompt(): Promise<boolean> {
    if (!this.ratingData) {
      await this.loadRatingData();
    }

    if (!this.ratingData) return false;
    if (this.ratingData.hasRated) return false;

    // Check minimum stories threshold
    if (this.ratingData.storiesGenerated < MIN_STORIES_FOR_RATING) {
      return false;
    }

    // Check minimum days since first launch
    const daysSinceFirstLaunch = this.getDaysSince(this.ratingData.firstLaunchDate);
    if (daysSinceFirstLaunch < MIN_DAYS_FOR_RATING) {
      return false;
    }

    // Check if user selected "remind later"
    if (this.ratingData.remindLater && this.ratingData.lastPromptDate) {
      const daysSinceLastPrompt = this.getDaysSince(this.ratingData.lastPromptDate);
      if (daysSinceLastPrompt < REMIND_LATER_DAYS) {
        return false;
      }
    }

    return true;
  }

  async showRatingPrompt() {
    const shouldShow = await this.shouldShowRatingPrompt();
    if (!shouldShow) return;

    Alert.alert(
      '⭐ Enjoying Jahera?',
      'Would you like to rate us on the App Store? It helps us create more amazing stories for kids!',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => this.handleNotNow(),
        },
        {
          text: 'Remind Later',
          onPress: () => this.handleRemindLater(),
        },
        {
          text: 'Rate Now',
          onPress: () => this.handleRateNow(),
        },
      ],
      { cancelable: false }
    );

    analytics.track('rating_prompt_shown');
  }

  private async handleNotNow() {
    if (this.ratingData) {
      this.ratingData.lastPromptDate = new Date().toISOString();
      await this.saveRatingData();
    }
    analytics.track('rating_prompt_dismissed', { action: 'not_now' });
  }

  private async handleRemindLater() {
    if (this.ratingData) {
      this.ratingData.remindLater = true;
      this.ratingData.lastPromptDate = new Date().toISOString();
      await this.saveRatingData();
    }
    analytics.track('rating_prompt_dismissed', { action: 'remind_later' });
  }

  private async handleRateNow() {
    if (this.ratingData) {
      this.ratingData.hasRated = true;
      await this.saveRatingData();
    }

    // Open app store
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id123456789', // Replace with actual App Store ID
      android: 'https://play.google.com/store/apps/details?id=com.jahera', // Replace with actual package name
    });

    if (storeUrl) {
      try {
        await Linking.openURL(storeUrl);
        analytics.track('rating_prompt_accepted');
      } catch (error) {
        console.error('Failed to open app store:', error);
      }
    }
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async markAsRated() {
    if (!this.ratingData) {
      await this.loadRatingData();
    }
    if (this.ratingData) {
      this.ratingData.hasRated = true;
      await this.saveRatingData();
    }
  }
}

export const appRating = new AppRatingService();
