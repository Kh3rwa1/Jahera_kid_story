/**
 * Analytics Service for tracking user events and app performance
 * Production-ready with privacy-first approach
 */

/**
 * SMART STORY ENGINE ANALYTICS EVENTS
 *
 * behavior_goal_selected    - { goalId: string, goalLabel: string, category: string }
 * voice_preset_selected     - { voiceId: string, voiceLabel: string, isPremium: boolean }
 * bedtime_reminder_set      - { hour: number, minute: number, enabled: boolean }
 * bedtime_reminder_disabled - { }
 * behavior_progress_viewed  - { totalGoals: number, topGoal: string | null }
 * parent_consent_given      - { timestamp: string, version: string }
 * story_generated_with_goal - { goalId: string, language: string, voiceId: string | null, duration: string }
 * city_selected_onboarding  - { city: string, method: 'chip' | 'custom' }
 * prompt_sanitized          - { field: string, originalLength: number, sanitizedLength: number, hadUnsafeContent: boolean }
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private isEnabled = true;

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        platform: 'mobile',
      },
      timestamp: new Date().toISOString(),
    };

    this.queue.push(event);
    this.logEvent(event);
  }

  /**
   * Track screen views
   */
  screen(screenName: string, properties?: Record<string, any>) {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  trackStoryGeneration(language: string, success: boolean, duration?: number) {
    this.track('story_generated', {
      language,
      success,
      duration_ms: duration,
    });
  }

  trackQuizCompletion(score: number, totalQuestions: number, storyId: string) {
    this.track('quiz_completed', {
      score,
      total_questions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      story_id: storyId,
    });
  }

  trackEngagement(action: 'audio_played' | 'story_shared' | 'achievement_unlocked' | 'achievement_shared' | 'app_shared', properties?: Record<string, any>) {
    this.track('user_engagement', {
      action,
      ...properties,
    });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number, unit: 'ms' | 'bytes' | 'count') {
    this.track('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  trackBehaviorGoalSelected(goalId: string, goalLabel: string, category: string) {
    this.track('behavior_goal_selected', { goalId, goalLabel, category });
  }

  trackVoicePresetSelected(voiceId: string, voiceLabel: string, isPremium: boolean) {
    this.track('voice_preset_selected', { voiceId, voiceLabel, isPremium });
  }

  trackBedtimeReminderSet(hour: number, minute: number, enabled: boolean) {
    this.track('bedtime_reminder_set', { hour, minute, enabled });
  }

  trackBedtimeReminderDisabled() {
    this.track('bedtime_reminder_disabled', {});
  }

  trackBehaviorProgressViewed(totalGoals: number, topGoal: string | null) {
    this.track('behavior_progress_viewed', { totalGoals, topGoal });
  }

  trackParentConsentGiven(timestamp: string, version: string) {
    this.track('parent_consent_given', { timestamp, version });
  }

  trackStoryGeneratedWithGoal(goalId: string, language: string, voiceId: string | null, duration: string) {
    this.track('story_generated_with_goal', { goalId, language, voiceId, duration });
  }

  trackCitySelectedOnboarding(city: string, method: 'chip' | 'custom') {
    this.track('city_selected_onboarding', { city, method });
  }

  trackAppLifecycle(event: 'app_opened' | 'app_backgrounded' | 'app_closed') {
    this.track('app_lifecycle', {
      event,
    });
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  private logEvent(event: AnalyticsEvent) {
    if (__DEV__) {
      console.log('📊 Analytics:', event.name, event.properties);
    }
  }

  async flush() {
    if (this.queue.length === 0) return;
    console.log(`Flushing ${this.queue.length} analytics events`);
    this.queue = [];
  }
}

export const analytics = new AnalyticsService();
