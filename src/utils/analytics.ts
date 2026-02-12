/**
 * Privacy-Focused Analytics for LOFERSIL
 * Lightweight analytics with respect for user privacy
 */

export interface AnalyticsEvent {
  type: 'pageview' | 'event' | 'performance' | 'error';
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  timestamp: number;
  url: string;
  referrer?: string;
  userAgent?: string;
  screen?: {
    width: number;
    height: number;
  };
  sessionId: string;
}

export interface AnalyticsConfig {
  endpoint?: string;
  apiKey?: string;
  enabled?: boolean;
  respectDNT?: boolean; // Respect Do Not Track
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
}

export class PrivacyAnalytics {
  private config: Required<AnalyticsConfig>;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      endpoint: '',
      apiKey: '',
      enabled: true,
      respectDNT: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      debug: false,
      ...config,
    };

    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate session ID without fingerprinting
   */
  private generateSessionId(): string {
    // Use timestamp + random, avoiding any user fingerprinting
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if analytics should run (respect DNT)
   */
  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;
    
    if (this.config.respectDNT && 
        navigator.doNotTrack === '1' || 
        navigator.doNotTrack === 'yes') {
      if (this.config.debug) {
        console.log('Analytics disabled due to DNT');
      }
      return false;
    }

    return true;
  }

  /**
   * Initialize analytics
   */
  public initialize(): void {
    if (!this.shouldTrack()) {
      return;
    }

    // Track page view
    this.trackPageView();

    // Setup automatic flushing
    this.setupAutoFlush();

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    if (this.config.debug) {
      console.log('Privacy analytics initialized with session:', this.sessionId);
    }
  }

  /**
   * Track page view
   */
  public trackPageView(url?: string): void {
    if (!this.shouldTrack()) return;

    const event: AnalyticsEvent = {
      type: 'pageview',
      url: url || window.location.href,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.queueEvent(event);
  }

  /**
   * Track custom event
   */
  public trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    if (!this.shouldTrack()) return;

    const event: AnalyticsEvent = {
      type: 'event',
      category,
      action,
      label,
      value,
      url: window.location.href,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.queueEvent(event);
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metrics: Record<string, number>): void {
    if (!this.shouldTrack()) return;

    // Only track performance in production to avoid data bloat
    if (this.config.debug || window.location.hostname === 'localhost') {
      return;
    }

    Object.entries(metrics).forEach(([name, value]) => {
      const event: AnalyticsEvent = {
        type: 'performance',
        category: 'performance',
        action: name,
        value,
        url: window.location.href,
        timestamp: Date.now(),
        sessionId: this.sessionId,
      };

      this.queueEvent(event);
    });
  }

  /**
   * Track errors
   */
  public trackError(
    message: string,
    source?: string,
    line?: number,
    column?: number
  ): void {
    if (!this.shouldTrack()) return;

    const event: AnalyticsEvent = {
      type: 'error',
      category: 'javascript',
      action: source || 'unknown',
      label: message,
      url: window.location.href,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.queueEvent(event);
  }

  /**
   * Add event to queue
   */
  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('Analytics event queued:', event);
    }

    // Flush immediately if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Setup automatic flushing
   */
  private setupAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Flush events to endpoint
   */
  public async flush(sync = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (this.config.debug) {
      console.log('Flushing analytics events:', events.length);
    }

    if (this.config.endpoint) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
          },
          body: JSON.stringify({
            events,
            sessionId: this.sessionId,
            timestamp: Date.now(),
          }),
          // Use keepalive for sync requests (like page unload)
          keepalive: sync,
        });

        if (!response.ok && this.config.debug) {
          console.warn('Analytics upload failed:', response.status);
        }
      } catch (error) {
        if (this.config.debug) {
          console.warn('Analytics upload error:', error);
        }
        // Re-queue events on failure
        this.eventQueue.unshift(...events);
      }
    } else if (this.config.debug) {
      console.log('Analytics data (no endpoint configured):', events);
    }
  }

  /**
   * Get session info
   */
  public getSessionInfo(): { sessionId: string; eventCount: number } {
    return {
      sessionId: this.sessionId,
      eventCount: this.eventQueue.length,
    };
  }

  /**
   * Reset analytics
   */
  public reset(): void {
    this.flush();
    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Destroy analytics
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    this.flush(true);
    this.eventQueue = [];
  }
}

/**
 * Initialize analytics for LOFERSIL
 */
export function initializeAnalytics(config: AnalyticsConfig = {}): PrivacyAnalytics {
  const analytics = new PrivacyAnalytics({
    // Only enable in production
    enabled: window.location.hostname !== 'localhost' && 
             window.location.hostname !== '127.0.0.1',
    respectDNT: true,
    debug: false,
    ...config,
  });
  
  analytics.initialize();
  return analytics;
}

/**
 * Global event tracking functions
 */
declare global {
  interface Window {
    lofersilAnalytics?: PrivacyAnalytics;
  }
}

/**
 * Quick tracking functions
 */
export function trackEvent(category: string, action: string, label?: string, value?: number): void {
  if (window.lofersilAnalytics) {
    window.lofersilAnalytics.trackEvent(category, action, label, value);
  }
}

export function trackError(message: string, source?: string, line?: number, column?: number): void {
  if (window.lofersilAnalytics) {
    window.lofersilAnalytics.trackError(message, source, line, column);
  }
}

export default PrivacyAnalytics;