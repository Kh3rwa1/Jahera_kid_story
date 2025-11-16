/**
 * Analytics Service for tracking user events and app performance
 * Production-ready with privacy-first approach
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

    // In production, you would send this to your analytics backend
    // For now, we'll just log it
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

  /**
   * Track story generation
   */
  trackStoryGeneration(language: string, success: boolean, duration?: number) {
    this.track('story_generated', {
      language,
      success,
      duration_ms: duration,
    });
  }

  /**
   * Track quiz completion
   */
  trackQuizCompletion(score: number, totalQuestions: number, storyId: string) {
    this.track('quiz_completed', {
      score,
      total_questions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      story_id: storyId,
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: 'audio_played' | 'story_shared' | 'achievement_unlocked', properties?: Record<string, any>) {
    this.track('user_engagement', {
      action,
      ...properties,
    });
  }

  /**
   * Track errors for monitoring
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: 'ms' | 'bytes' | 'count') {
    this.track('performance_metric', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Track app lifecycle events
   */
  trackAppLifecycle(event: 'app_opened' | 'app_backgrounded' | 'app_closed') {
    this.track('app_lifecycle', {
      event,
    });
  }

  /**
   * Enable/disable analytics (for privacy settings)
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  private logEvent(event: AnalyticsEvent) {
    if (__DEV__) {
      console.log('📊 Analytics:', event.name, event.properties);
    }
  }

  /**
   * Flush queued events (call before app closes)
   */
  async flush() {
    if (this.queue.length === 0) return;

    // In production, send queued events to backend
    console.log(`Flushing ${this.queue.length} analytics events`);
    this.queue = [];
  }
}

export const analytics = new AnalyticsService();
