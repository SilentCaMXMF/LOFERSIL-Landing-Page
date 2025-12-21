/**
 * Rate Limiter for AI Services
 * Implements token bucket algorithm for API rate limiting
 */

import type { RateLimitConfig } from "../config/gemini-config";

export interface RateLimitStatus {
  /** Current token count */
  tokens: number;
  /** Maximum token capacity */
  capacity: number;
  /** Tokens added per second */
  refillRate: number;
  /** Requests waiting in queue */
  queueLength: number;
  /** Time until next token (ms) */
  nextTokenIn: number;
  /** Is rate limited */
  isLimited: boolean;
}

export interface RateLimitStats {
  /** Total requests made */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Rejected requests */
  rejectedRequests: number;
  /** Current time window start */
  windowStart: number;
  /** Requests in current window */
  currentWindowRequests: number;
  /** Daily request count */
  dailyRequestCount: number;
  /** Concurrency limit reached count */
  concurrencyLimitReached: number;
}

/**
 * Token Bucket Rate Limiter
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private tokens: number;
  private lastRefill: number;
  private requestQueue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private currentConcurrent = 0;
  private stats: RateLimitStats = {
    totalRequests: 0,
    successfulRequests: 0,
    rejectedRequests: 0,
    windowStart: Date.now(),
    currentWindowRequests: 0,
    dailyRequestCount: 0,
    concurrencyLimitReached: 0,
  };

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.tokens = config.bucketCapacity;
    this.lastRefill = Date.now();

    // Start periodic cleanup and stats reset
    this.startPeriodicCleanup();
  }

  /**
   * Acquire a token (blocks until available)
   */
  async acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stats.totalRequests++;

      // Check daily limit
      if (this.stats.dailyRequestCount >= this.config.requestsPerDay) {
        this.stats.rejectedRequests++;
        reject(new Error("Daily rate limit exceeded"));
        return;
      }

      // Check concurrent limit
      if (this.currentConcurrent >= this.config.maxConcurrent) {
        this.stats.concurrencyLimitReached++;
        reject(new Error("Concurrent request limit exceeded"));
        return;
      }

      // Check minute limit
      if (this.stats.currentWindowRequests >= this.config.requestsPerMinute) {
        const waitTime = this.getTimeUntilNextWindow();
        this.stats.rejectedRequests++;
        reject(new Error(`Rate limit exceeded. Try again in ${waitTime}ms`));
        return;
      }

      // Try to acquire token immediately
      if (this.tryAcquire()) {
        this.stats.successfulRequests++;
        this.currentConcurrent++;
        this.stats.currentWindowRequests++;
        this.stats.dailyRequestCount++;
        resolve();
      } else {
        // Add to queue
        this.requestQueue.push({
          resolve: () => {
            this.stats.successfulRequests++;
            this.currentConcurrent++;
            this.stats.currentWindowRequests++;
            this.stats.dailyRequestCount++;
            resolve();
          },
          reject: (error) => {
            this.stats.rejectedRequests++;
            reject(error);
          },
          timestamp: Date.now(),
        });

        // Process queue
        this.processQueue();
      }
    });
  }

  /**
   * Try to acquire a token without blocking
   */
  tryAcquire(): boolean {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Release a token (after request completion)
   */
  release(): void {
    if (this.currentConcurrent > 0) {
      this.currentConcurrent--;
    }

    // Process queue to allow waiting requests
    this.processQueue();
  }

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimitStatus {
    this.refillTokens();

    return {
      tokens: this.tokens,
      capacity: this.config.bucketCapacity,
      refillRate: this.config.refillRate,
      queueLength: this.requestQueue.length,
      nextTokenIn: this.getNextTokenTime(),
      isLimited:
        this.tokens < 1 || this.currentConcurrent >= this.config.maxConcurrent,
    };
  }

  /**
   * Get rate limit statistics
   */
  getStats(): RateLimitStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      rejectedRequests: 0,
      windowStart: Date.now(),
      currentWindowRequests: 0,
      dailyRequestCount: 0,
      concurrencyLimitReached: 0,
    };
  }

  /**
   * Wait until a token is available
   */
  async waitForToken(): Promise<void> {
    while (this.tokens < 1) {
      const waitTime = this.getNextTokenTime();
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refillTokens();
    }
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();

    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Execute multiple functions with rate limiting
   */
  async executeAll<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = [];

    // Execute functions with concurrency limits
    const executeWithLimit = async (fn: () => Promise<T>): Promise<T> => {
      return this.execute(fn);
    };

    // Process in batches
    const batchSize = this.config.maxConcurrent;
    for (let i = 0; i < fns.length; i += batchSize) {
      const batch = fns.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(executeWithLimit));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Reject all queued requests
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        request.reject(new Error("Rate limiter destroyed"));
      }
    }

    this.resetStats();
  }

  // Private methods

  private cleanupTimer?: NodeJS.Timeout;

  private refillTokens(): void {
    const now = Date.now();
    const timeSinceLastRefill = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timeSinceLastRefill * this.config.refillRate;

    this.tokens = Math.min(
      this.config.bucketCapacity,
      this.tokens + tokensToAdd,
    );

    this.lastRefill = now;
  }

  private processQueue(): void {
    this.refillTokens();

    while (
      this.requestQueue.length > 0 &&
      this.tokens >= 1 &&
      this.currentConcurrent < this.config.maxConcurrent
    ) {
      const request = this.requestQueue.shift();
      if (request) {
        this.tokens--;
        request.resolve();
      }
    }
  }

  private getNextTokenTime(): number {
    if (this.tokens >= 1) return 0;

    const tokensNeeded = 1 - this.tokens;
    const timeNeeded = (tokensNeeded / this.config.refillRate) * 1000;

    return Math.ceil(timeNeeded);
  }

  private getTimeUntilNextWindow(): number {
    const now = Date.now();
    const windowElapsed = now - this.stats.windowStart;
    const windowDuration = 60 * 1000; // 1 minute
    const timeRemaining = windowDuration - windowElapsed;

    return Math.max(0, timeRemaining);
  }

  private startPeriodicCleanup(): void {
    // Reset minute counter every minute
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();

      // Reset minute counter
      if (now - this.stats.windowStart >= 60 * 1000) {
        this.stats.windowStart = now;
        this.stats.currentWindowRequests = 0;
      }

      // Reset daily counter at midnight
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      if (now >= midnight.getTime()) {
        this.stats.dailyRequestCount = 0;
      }
    }, 60 * 1000); // Check every minute
  }
}

/**
 * Multi-dimension Rate Limiter (per-key limits)
 */
export class KeyedRateLimiter {
  private limiters = new Map<string, RateLimiter>();
  private globalLimiter: RateLimiter;

  constructor(config: RateLimitConfig) {
    this.globalLimiter = new RateLimiter(config);
  }

  /**
   * Acquire a token for a specific key
   */
  async acquire(key: string): Promise<void> {
    // Check global limit first
    await this.globalLimiter.acquire();

    // Then check per-key limit
    let limiter = this.limiters.get(key);
    if (!limiter) {
      // Create per-key limiter with lower limits
      const keyConfig = {
        ...this.globalLimiter["config"],
        requestsPerMinute: Math.floor(
          this.globalLimiter["config"].requestsPerMinute / 10,
        ),
        maxConcurrent: Math.floor(
          this.globalLimiter["config"].maxConcurrent / 2,
        ),
        bucketCapacity: Math.floor(
          this.globalLimiter["config"].bucketCapacity / 5,
        ),
      };
      limiter = new RateLimiter(keyConfig);
      this.limiters.set(key, limiter);
    }

    try {
      await limiter.acquire();
    } catch (error) {
      // Release global token if key-specific acquisition fails
      this.globalLimiter.release();
      throw error;
    }
  }

  /**
   * Release a token for a specific key
   */
  release(key: string): void {
    const limiter = this.limiters.get(key);
    if (limiter) {
      limiter.release();
    }
    this.globalLimiter.release();
  }

  /**
   * Get status for a specific key
   */
  getStatus(key?: string): RateLimitStatus | Record<string, RateLimitStatus> {
    if (key) {
      const limiter = this.limiters.get(key);
      return limiter ? limiter.getStatus() : this.globalLimiter.getStatus();
    }

    const statuses: Record<string, RateLimitStatus> = {
      global: this.globalLimiter.getStatus(),
    };

    for (const [key, limiter] of this.limiters) {
      statuses[key] = limiter.getStatus();
    }

    return statuses;
  }

  /**
   * Get combined statistics
   */
  getStats(): {
    global: RateLimitStats;
    byKey: Record<string, RateLimitStats>;
  } {
    const byKey: Record<string, RateLimitStats> = {};

    for (const [key, limiter] of this.limiters) {
      byKey[key] = limiter.getStats();
    }

    return {
      global: this.globalLimiter.getStats(),
      byKey,
    };
  }

  /**
   * Clear unused limiters
   */
  cleanup(): void {
    for (const [key, limiter] of this.limiters) {
      const stats = limiter.getStats();
      // Remove limiters that haven't been used recently
      if (stats.totalRequests === 0) {
        limiter.destroy();
        this.limiters.delete(key);
      }
    }
  }

  /**
   * Destroy all limiters
   */
  destroy(): void {
    this.globalLimiter.destroy();
    for (const limiter of this.limiters.values()) {
      limiter.destroy();
    }
    this.limiters.clear();
  }
}
