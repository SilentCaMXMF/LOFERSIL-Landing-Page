/**
 * Error Tracking System for LOFERSIL Landing Page
 * Monitors and reports JavaScript errors, performance issues, and user interactions
 */

export interface ErrorReport {
  type: 'javascript' | 'performance' | 'network' | 'user';
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface ErrorTrackerConfig {
  apiKey?: string;
  endpoint?: string;
  userId?: string;
  environment?: 'development' | 'staging' | 'production';
  maxErrors?: number;
  throttleDelay?: number;
}

export class ErrorTracker {
  private config: Required<ErrorTrackerConfig>;
  private sessionId: string;
  private errorCount = 0;
  private lastErrorTime = 0;
  private originalHandlers: {
    onError: OnErrorEventHandler | null;
    onUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null;
  };

  constructor(config: ErrorTrackerConfig = {}) {
    this.config = {
      apiKey: '',
      endpoint: '',
      userId: '',
      environment: 'development',
      maxErrors: 10,
      throttleDelay: 5000,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.originalHandlers = {
      onError: window.onerror,
      onUnhandledRejection: window.onunhandledrejection,
    };
  }

  /**
   * Initialize error tracking
   */
  public initialize(): void {
    // Skip in development if not explicitly enabled
    if (this.config.environment === 'development' && !this.config.endpoint) {
      console.warn('Error tracking disabled in development');
      return;
    }

    this.setupGlobalErrorHandlers();
    this.setupNetworkErrorTracking();
    this.setupPerformanceErrorTracking();

    console.log('Error tracking initialized with session:', this.sessionId);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // JavaScript errors
    window.onerror = (message, source, line, column, error) => {
      this.reportError({
        type: 'javascript',
        message: message as string,
        source,
        line,
        column,
        stack: error?.stack,
        severity: this.assessSeverity(error),
      });

      return this.originalHandlers.onError?.(message, source, line, column, error) ?? false;
    };

    // Unhandled promise rejections
    window.onunhandledrejection = event => {
      this.reportError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
      });

      this.originalHandlers.onUnhandledRejection?.(event);
    };
  }

  /**
   * Setup network error tracking
   */
  private setupNetworkErrorTracking(): void {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        if (!response.ok) {
          this.reportError({
            type: 'network',
            message: `HTTP Error: ${response.status} ${response.statusText}`,
            context: {
              url: response.url,
              status: response.status,
              statusText: response.statusText,
            },
            severity: response.status >= 500 ? 'high' : 'medium',
          });
        }

        return response;
      } catch (error) {
        this.reportError({
          type: 'network',
          message: `Network Error: ${error}`,
          stack: (error as Error)?.stack,
          severity: 'high',
        });
        throw error;
      }
    };
  }

  /**
   * Setup performance error tracking
   */
  private setupPerformanceErrorTracking(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();

        for (const entry of entries) {
          // Long tasks that might cause UI freezing
          if (entry.entryType === 'longtask' && entry.duration > 100) {
            this.reportError({
              type: 'performance',
              message: `Long Task Detected: ${entry.duration.toFixed(2)}ms`,
              context: {
                duration: entry.duration,
                startTime: entry.startTime,
              },
              severity: 'medium',
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task entry type not supported
      }
    }
  }

  /**
   * Assess error severity
   */
  private assessSeverity(error?: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (!error) return 'medium';

    const message = error.message.toLowerCase();

    // Critical errors that break the app
    if (
      message.includes('chunk load failed') ||
      message.includes('script error') ||
      message.includes('type error')
    ) {
      return 'critical';
    }

    // High severity errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'high';
    }

    // Medium severity
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Report an error
   */
  public reportError(errorData: Partial<ErrorReport>): void {
    // Throttle error reporting
    const now = Date.now();
    if (now - this.lastErrorTime < this.config.throttleDelay) {
      return;
    }
    this.lastErrorTime = now;

    // Don't exceed max errors per session
    if (this.errorCount >= this.config.maxErrors) {
      console.warn('Error limit reached for this session');
      return;
    }

    const report: ErrorReport = {
      type: errorData.type || 'javascript',
      message: errorData.message || 'Unknown error',
      source: errorData.source,
      line: errorData.line,
      column: errorData.column,
      stack: errorData.stack,
      timestamp: now,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      severity: errorData.severity || 'medium',
      context: errorData.context,
    };

    this.errorCount++;

    // Log in development
    if (this.config.environment === 'development') {
      console.group(`🚨 Error Report [${report.severity.toUpperCase()}]`);
      console.log('Type:', report.type);
      console.log('Message:', report.message);
      console.log('Context:', report.context);
      console.log('Stack:', report.stack);
      console.groupEnd();
    }

    // Send to endpoint in production
    if (this.config.endpoint && this.config.environment === 'production') {
      this.sendErrorReport(report);
    }
  }

  /**
   * Send error report to endpoint
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey || '',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.warn('Failed to send error report:', error);
    }
  }

  /**
   * Set user context
   */
  public setUser(userId: string): void {
    this.config.userId = userId;
  }

  /**
   * Set custom context
   */
  public setContext(context: Record<string, any>): void {
    this.config = { ...this.config, ...context };
  }

  /**
   * Get error statistics
   */
  public getStats(): { errorCount: number; sessionId: string; timeActive: number } {
    return {
      errorCount: this.errorCount,
      sessionId: this.sessionId,
      timeActive: Date.now() - parseInt(this.sessionId.substring(0, 8), 36),
    };
  }

  /**
   * Reset error tracker
   */
  public reset(): void {
    this.errorCount = 0;
    this.sessionId = this.generateSessionId();

    // Restore original handlers
    window.onerror = this.originalHandlers.onError;
    window.onunhandledrejection = this.originalHandlers.onUnhandledRejection;
  }

  /**
   * Destroy error tracker
   */
  public destroy(): void {
    this.reset();
  }
}

/**
 * Initialize error tracking for LOFERSIL
 */
export function initializeErrorTracking(config: ErrorTrackerConfig = {}): ErrorTracker {
  const tracker = new ErrorTracker({
    environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    ...config,
  });

  tracker.initialize();
  return tracker;
}

/**
 * Quick error reporting function
 */
export function reportError(message: string, context?: Record<string, any>): void {
  if (window.lofersilErrorTracker) {
    window.lofersilErrorTracker.reportError({
      message,
      context,
      severity: 'medium',
    });
  }
}

// Make tracker globally available
declare global {
  interface Window {
    lofersilErrorTracker?: ErrorTracker;
  }
}

export default ErrorTracker;
