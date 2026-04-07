import * as Haptics from 'expo-haptics';
import { logger } from './logger';

/**
 * Premium haptic feedback utilities for delightful user interactions
 */

export const hapticFeedback = {
  /**
   * Light tap feedback for general interactions
   */
  light: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      logger.debug('Haptics typically unsupported on this device simulator', { error });
    }
  },

  /**
   * Medium tap feedback for important actions
   */
  medium: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not supported on device
    }
  },

  /**
   * Heavy tap feedback for significant actions
   */
  heavy: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Haptics not supported on device
    }
  },

  /**
   * Success feedback (e.g., quiz correct answer, story saved)
   */
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not supported on device
    }
  },

  /**
   * Warning feedback (e.g., quiz wrong answer)
   */
  warning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Haptics not supported on device
    }
  },

  /**
   * Error feedback (e.g., failed to load story)
   */
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptics not supported on device
    }
  },

  /**
   * Selection feedback (e.g., switching tabs, selecting items)
   */
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Haptics not supported on device
    }
  },

  /**
   * Celebration feedback pattern (multiple taps for achievements)
   */
  celebrate: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 100);
      setTimeout(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 200);
    } catch (error) {
      logger.debug('Haptics typically unsupported on this device simulator', { error });
    }
  },
};
