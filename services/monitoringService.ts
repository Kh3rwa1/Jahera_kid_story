/**
 * Production Monitoring Service
 * Tracks app health, performance, and errors
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
}

interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = [];
  private errorLogs: ErrorLog[] = [];
  private readonly timers = new Map<string, number>();

  /**
   * Start performance timer
   */
  startTimer(name: string) {
    this.timers.set(name, Date.now());
  }

  /**
   * End performance timer and record metric
   */
  endTimer(name: string) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.performanceMetrics.push(metric);

    if (__DEV__) {
      console.log(`⚡ Performance: ${name} took ${duration}ms`);
    }

    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics.shift();
    }

    return duration;
  }

  /**
   * Log error with context
   */
  logError(error: Error | string, severity: ErrorLog['severity'] = 'medium', context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      severity,
      timestamp: new Date().toISOString(),
    };

    this.errorLogs.push(errorLog);

    // Log to console in development
    if (__DEV__) {
      console.error('🔴 Error:', errorLog);
    }

    // Keep only last 50 errors
    if (this.errorLogs.length > 50) {
      this.errorLogs.shift();
    }

    // In production, send to error tracking service (e.g., Sentry)
    // this.sendToSentry(errorLog);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.performanceMetrics.length === 0) {
      return null;
    }

    const durations = this.performanceMetrics.map((m) => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return {
      average: Math.round(avg),
      max,
      min,
      count: this.performanceMetrics.length,
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      total: this.errorLogs.length,
      bySeverity: {
        low: this.errorLogs.filter((e) => e.severity === 'low').length,
        medium: this.errorLogs.filter((e) => e.severity === 'medium').length,
        high: this.errorLogs.filter((e) => e.severity === 'high').length,
        critical: this.errorLogs.filter((e) => e.severity === 'critical').length,
      },
      recent: this.errorLogs.slice(-5),
    };
  }

  /**
   * Track API call
   */
  trackAPICall(endpoint: string, success: boolean, duration: number) {
    const metric: PerformanceMetric = {
      name: `api_${endpoint}`,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.performanceMetrics.push(metric);

    if (!success) {
      this.logError(`API call failed: ${endpoint}`, 'medium', { duration });
    }
  }

  /**
   * Clear all metrics and logs
   */
  clear() {
    this.performanceMetrics = [];
    this.errorLogs = [];
    this.timers.clear();
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const errorStats = this.getErrorStats();
    const performanceStats = this.getPerformanceStats();

    const hasRecentCriticalErrors = errorStats.bySeverity.critical > 0;
    const hasHighErrorRate = errorStats.total > 20;
    const hasPerformanceIssues = performanceStats && performanceStats.average > 5000;

    if (hasRecentCriticalErrors) {
      return { status: 'critical', message: 'Critical errors detected' };
    }

    if (hasHighErrorRate) {
      return { status: 'degraded', message: 'High error rate detected' };
    }

    if (hasPerformanceIssues) {
      return { status: 'degraded', message: 'Performance issues detected' };
    }

    return { status: 'healthy', message: 'All systems operational' };
  }
}

export const monitoring = new MonitoringService();
