/**
 * Rate Limiter - Advanced rate limiting with multiple strategies
 * Supports IP-based, email-based, and token-based rate limiting
 */

// Rate limiting strategies
export enum RateLimitStrategy {
  FIXED_WINDOW = "fixed_window",
  SLIDING_WINDOW = "sliding_window",
  TOKEN_BUCKET = "token_bucket",
}

// Rate limit identifier types
export enum RateLimitType {
  IP = "ip",
  EMAIL = "email",
  GLOBAL = "global",
  USER = "user",
}

// Rate limit breach levels
export enum RateLimitBreachLevel {
  WARNING = "warning",
  CRITICAL = "critical",
  BLOCK = "block",
}

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed
  strategy: RateLimitStrategy;
  type: RateLimitType;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
  headers?: boolean;
  onLimitReached?: (
    identifier: string,
    breachLevel: RateLimitBreachLevel,
  ) => void;
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  breachLevel?: RateLimitBreachLevel;
  identifier: string;
  strategy: RateLimitStrategy;
}

// Rate limit entry
interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastReset: number;
  // Token bucket specific
  tokens?: number;
  lastRefill?: number;
  // Sliding window specific
  requests?: number[];
}

// Whitelist entry
interface WhitelistEntry {
  identifier: string;
  type: RateLimitType;
  expiry?: Date;
  reason: string;
  createdAt: Date;
}

// Rate limit breach notification
interface BreachNotification {
  identifier: string;
  type: RateLimitType;
  breachLevel: RateLimitBreachLevel;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Advanced Rate Limiter implementation
 */
export class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private whitelist: Map<string, WhitelistEntry> = new Map();
  private breachNotifications: BreachNotification[] = [];
  private config: RateLimitConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      headers: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if request is allowed
   */
  public async checkLimit(
    identifier: string,
    options: {
      skipSuccessful?: boolean;
      skipFailed?: boolean;
      weight?: number;
    } = {},
  ): Promise<RateLimitResult> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : `${this.config.type}:${identifier}`;

    // Check whitelist first
    if (this.isWhitelisted(identifier, this.config.type)) {
      return this.createAllowedResult(
        identifier,
        Infinity,
        Infinity,
        new Date(),
      );
    }

    const entry = this.getOrCreateEntry(key);
    const now = Date.now();

    switch (this.config.strategy) {
      case RateLimitStrategy.FIXED_WINDOW:
        return this.checkFixedWindow(key, entry, now, options);

      case RateLimitStrategy.SLIDING_WINDOW:
        return this.checkSlidingWindow(key, entry, now, options);

      case RateLimitStrategy.TOKEN_BUCKET:
        return this.checkTokenBucket(key, entry, now, options);

      default:
        throw new Error(`Unknown rate limit strategy: ${this.config.strategy}`);
    }
  }

  /**
   * Fixed window rate limiting
   */
  private checkFixedWindow(
    key: string,
    entry: RateLimitEntry,
    now: number,
    options: any,
  ): RateLimitResult {
    const windowStart =
      Math.floor(now / this.config.windowMs) * this.config.windowMs;

    // Reset window if expired
    if (entry.windowStart !== windowStart) {
      entry.count = 0;
      entry.windowStart = windowStart;
    }

    const weight = options.weight || 1;
    const newCount = entry.count + weight;
    const allowed = newCount <= this.config.maxRequests;

    if (allowed) {
      entry.count = newCount;
    }

    const resetTime = new Date(windowStart + this.config.windowMs);
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const breachLevel = this.calculateBreachLevel(
      entry.count,
      this.config.maxRequests,
    );

    // Record breach if threshold exceeded
    if (!allowed && breachLevel) {
      this.recordBreach(key, breachLevel, {
        count: entry.count,
        limit: this.config.maxRequests,
        strategy: this.config.strategy,
      });
    }

    return this.createResult(
      key,
      allowed,
      remaining,
      resetTime,
      breachLevel || undefined,
    );
  }

  /**
   * Sliding window rate limiting
   */
  private checkSlidingWindow(
    key: string,
    entry: RateLimitEntry,
    now: number,
    options: any,
  ): RateLimitResult {
    const weight = options.weight || 1;

    // For sliding window, we need to track request timestamps
    if (!entry.requests) {
      entry.requests = [];
    }

    // Remove requests outside the window
    const windowStart = now - this.config.windowMs;
    entry.requests = entry.requests.filter(
      (timestamp: number) => timestamp > windowStart,
    );

    const newCount = entry.requests.length + weight;
    const allowed = newCount <= this.config.maxRequests;

    if (allowed) {
      entry.requests.push(now);
      entry.count = entry.requests.length;
    }

    const resetTime = new Date(now + this.config.windowMs);
    const remaining = Math.max(
      0,
      this.config.maxRequests - entry.requests.length,
    );
    const breachLevel = this.calculateBreachLevel(
      entry.requests.length,
      this.config.maxRequests,
    );

    // Record breach if threshold exceeded
    if (!allowed && breachLevel) {
      this.recordBreach(key, breachLevel, {
        count: entry.requests.length,
        limit: this.config.maxRequests,
        strategy: this.config.strategy,
      });
    }

    return this.createResult(
      key,
      allowed,
      remaining,
      resetTime,
      breachLevel || undefined,
    );
  }

  /**
   * Token bucket rate limiting
   */
  private checkTokenBucket(
    key: string,
    entry: RateLimitEntry,
    now: number,
    options: any,
  ): RateLimitResult {
    const weight = options.weight || 1;

    // Initialize tokens if not set
    if (entry.tokens === undefined) {
      entry.tokens = this.config.maxRequests;
      entry.lastRefill = now;
    }

    // Refill tokens based on time passed
    const timePassed = now - (entry.lastRefill || now);
    const tokensToAdd =
      (timePassed / this.config.windowMs) * this.config.maxRequests;
    entry.tokens = Math.min(
      this.config.maxRequests,
      entry.tokens + tokensToAdd,
    );
    entry.lastRefill = now;

    const allowed = entry.tokens >= weight;

    if (allowed) {
      entry.tokens -= weight;
    }

    const resetTime = new Date(now + this.config.windowMs);
    const remaining = Math.floor(entry.tokens);
    const breachLevel = this.calculateBreachLevel(
      this.config.maxRequests - entry.tokens,
      this.config.maxRequests,
    );

    // Record breach if bucket is empty and request blocked
    if (!allowed && breachLevel) {
      this.recordBreach(key, breachLevel, {
        tokensRemaining: entry.tokens,
        weight,
        strategy: this.config.strategy,
      });
    }

    return this.createResult(
      key,
      allowed,
      remaining,
      resetTime,
      breachLevel || undefined,
    );
  }

  /**
   * Calculate breach level based on usage
   */
  private calculateBreachLevel(
    current: number,
    limit: number,
  ): RateLimitBreachLevel | null {
    const ratio = current / limit;

    if (ratio >= 2.0) {
      return RateLimitBreachLevel.BLOCK;
    } else if (ratio >= 1.5) {
      return RateLimitBreachLevel.CRITICAL;
    } else if (ratio >= 1.0) {
      return RateLimitBreachLevel.WARNING;
    }

    return null;
  }

  /**
   * Record rate limit breach
   */
  private recordBreach(
    key: string,
    breachLevel: RateLimitBreachLevel,
    metadata: Record<string, any>,
  ): void {
    const notification: BreachNotification = {
      identifier: key,
      type: this.config.type,
      breachLevel,
      timestamp: new Date(),
      metadata,
    };

    this.breachNotifications.push(notification);

    // Trigger callback if configured
    if (this.config.onLimitReached) {
      this.config.onLimitReached(key, breachLevel);
    }

    // Log breach
    console.warn(`Rate limit breach detected:`, {
      identifier: key,
      type: this.config.type,
      breachLevel,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get or create rate limit entry
   */
  private getOrCreateEntry(key: string): RateLimitEntry {
    if (!this.storage.has(key)) {
      const entry: RateLimitEntry = {
        count: 0,
        windowStart: Date.now(),
        lastReset: Date.now(),
      };
      this.storage.set(key, entry);
    }
    return this.storage.get(key)!;
  }

  /**
   * Create rate limit result
   */
  private createResult(
    key: string,
    allowed: boolean,
    remaining: number,
    resetTime: Date,
    breachLevel?: RateLimitBreachLevel,
  ): RateLimitResult {
    const identifier = key.replace(`${this.config.type}:`, "");
    const retryAfter = allowed
      ? undefined
      : Math.ceil((resetTime.getTime() - Date.now()) / 1000);

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
      retryAfter,
      breachLevel,
      identifier,
      strategy: this.config.strategy,
    };
  }

  /**
   * Create allowed result for whitelisted identifiers
   */
  private createAllowedResult(
    identifier: string,
    limit: number,
    remaining: number,
    resetTime: Date,
  ): RateLimitResult {
    return {
      allowed: true,
      limit,
      remaining,
      resetTime,
      identifier,
      strategy: this.config.strategy,
    };
  }

  /**
   * Add identifier to whitelist
   */
  public addToWhitelist(
    identifier: string,
    type: RateLimitType,
    reason: string,
    expiry?: Date,
  ): void {
    const key = `${type}:${identifier}`;
    const entry: WhitelistEntry = {
      identifier,
      type,
      reason,
      createdAt: new Date(),
      expiry,
    };
    this.whitelist.set(key, entry);
  }

  /**
   * Remove identifier from whitelist
   */
  public removeFromWhitelist(identifier: string, type: RateLimitType): void {
    const key = `${type}:${identifier}`;
    this.whitelist.delete(key);
  }

  /**
   * Check if identifier is whitelisted
   */
  public isWhitelisted(identifier: string, type: RateLimitType): boolean {
    const key = `${type}:${identifier}`;
    const entry = this.whitelist.get(key);

    if (!entry) {
      return false;
    }

    // Check if whitelist entry has expired
    if (entry.expiry && entry.expiry < new Date()) {
      this.whitelist.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get breach notifications
   */
  public getBreachNotifications(since?: Date): BreachNotification[] {
    if (!since) {
      return [...this.breachNotifications];
    }
    return this.breachNotifications.filter((n) => n.timestamp >= since);
  }

  /**
   * Clear breach notifications
   */
  public clearBreachNotifications(): void {
    this.breachNotifications = [];
  }

  /**
   * Get rate limit statistics
   */
  public getStatistics(): {
    totalEntries: number;
    whitelistEntries: number;
    breachNotifications: number;
    averageUsage: number;
  } {
    const totalEntries = this.storage.size;
    const whitelistEntries = this.whitelist.size;
    const breachNotifications = this.breachNotifications.length;

    let totalUsage = 0;
    let activeEntries = 0;

    for (const entry of this.storage.values()) {
      if (Date.now() - entry.lastReset < this.config.windowMs * 2) {
        totalUsage += entry.count;
        activeEntries++;
      }
    }

    const averageUsage = activeEntries > 0 ? totalUsage / activeEntries : 0;

    return {
      totalEntries,
      whitelistEntries,
      breachNotifications,
      averageUsage,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  public reset(identifier: string): void {
    const key = `${this.config.type}:${identifier}`;
    this.storage.delete(key);
  }

  /**
   * Reset all rate limits
   */
  public resetAll(): void {
    this.storage.clear();
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expirationTime = this.config.windowMs * 2;

    // Clean up rate limit entries
    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.lastReset > expirationTime) {
        this.storage.delete(key);
      }
    }

    // Clean up expired whitelist entries
    for (const [key, entry] of this.whitelist.entries()) {
      if (entry.expiry && entry.expiry < new Date()) {
        this.whitelist.delete(key);
      }
    }

    // Clean up old breach notifications (keep last 1000)
    if (this.breachNotifications.length > 1000) {
      this.breachNotifications = this.breachNotifications.slice(-1000);
    }
  }

  /**
   * Destroy rate limiter and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
    this.whitelist.clear();
    this.breachNotifications = [];
  }
}

/**
 * Rate Limiter Factory - Creates configured rate limiters
 */
export class RateLimiterFactory {
  private static limiters: Map<string, RateLimiter> = new Map();

  /**
   * Create IP-based rate limiter
   */
  public static createIpLimiter(
    config: Partial<RateLimitConfig> = {},
  ): RateLimiter {
    const fullConfig: RateLimitConfig = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute
      strategy: RateLimitStrategy.SLIDING_WINDOW,
      type: RateLimitType.IP,
      headers: true,
      ...config,
    };

    return new RateLimiter(fullConfig);
  }

  /**
   * Create email-based rate limiter
   */
  public static createEmailLimiter(
    config: Partial<RateLimitConfig> = {},
  ): RateLimiter {
    const fullConfig: RateLimitConfig = {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 50, // 50 emails per day
      strategy: RateLimitStrategy.FIXED_WINDOW,
      type: RateLimitType.EMAIL,
      headers: true,
      ...config,
    };

    return new RateLimiter(fullConfig);
  }

  /**
   * Create global rate limiter
   */
  public static createGlobalLimiter(
    config: Partial<RateLimitConfig> = {},
  ): RateLimiter {
    const fullConfig: RateLimitConfig = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute globally
      strategy: RateLimitStrategy.SLIDING_WINDOW,
      type: RateLimitType.GLOBAL,
      headers: true,
      ...config,
    };

    return new RateLimiter(fullConfig);
  }

  /**
   * Get or create rate limiter by name
   */
  public static getLimiter(name: string, config: RateLimitConfig): RateLimiter {
    if (!this.limiters.has(name)) {
      this.limiters.set(name, new RateLimiter(config));
    }
    return this.limiters.get(name)!;
  }

  /**
   * Destroy all rate limiters
   */
  public static destroyAll(): void {
    for (const limiter of this.limiters.values()) {
      limiter.destroy();
    }
    this.limiters.clear();
  }
}

/**
 * Express middleware for rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (req: any, res: any, next: any) => {
    try {
      // Get identifier based on limiter type
      const identifier = getIdentifier(req, limiter);

      // Check rate limit
      const result = await limiter.checkLimit(identifier);

      // Set rate limit headers if configured
      if (limiter["config"]?.headers) {
        res.set({
          "X-RateLimit-Limit": result.limit,
          "X-RateLimit-Remaining": result.remaining,
          "X-RateLimit-Reset": Math.ceil(result.resetTime.getTime() / 1000),
        });

        if (!result.allowed && result.retryAfter) {
          res.set("Retry-After", result.retryAfter);
        }
      }

      // Block request if rate limit exceeded
      if (!result.allowed) {
        const statusCode = getStatusCode(result.breachLevel);
        return res.status(statusCode).json({
          success: false,
          error: getErrorMessage(result.breachLevel),
          rateLimit: {
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: result.retryAfter,
          },
        });
      }

      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      next();
    }
  };
}

/**
 * Helper function to get identifier from request
 */
function getIdentifier(req: any, limiter: RateLimiter): string {
  const type = limiter["config"]?.type;

  switch (type) {
    case RateLimitType.IP:
      return (
        req.ip ||
        req.connection.remoteAddress ||
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        "unknown"
      );

    case RateLimitType.EMAIL:
      return req.body?.email || req.user?.email || "unknown";

    case RateLimitType.USER:
      return req.user?.id || req.user?.email || "unknown";

    case RateLimitType.GLOBAL:
      return "global";

    default:
      return "unknown";
  }
}

/**
 * Get HTTP status code based on breach level
 */
function getStatusCode(breachLevel?: RateLimitBreachLevel): number {
  switch (breachLevel) {
    case RateLimitBreachLevel.BLOCK:
      return 429; // Too Many Requests
    case RateLimitBreachLevel.CRITICAL:
      return 429;
    case RateLimitBreachLevel.WARNING:
      return 200; // Allow but warn
    default:
      return 429;
  }
}

/**
 * Get error message based on breach level
 */
function getErrorMessage(breachLevel?: RateLimitBreachLevel): string {
  switch (breachLevel) {
    case RateLimitBreachLevel.BLOCK:
      return "Too many requests. Please try again later.";
    case RateLimitBreachLevel.CRITICAL:
      return "Rate limit exceeded. Please slow down your requests.";
    case RateLimitBreachLevel.WARNING:
      return "Approaching rate limit. Please consider slowing down.";
    default:
      return "Rate limit exceeded.";
  }
}
