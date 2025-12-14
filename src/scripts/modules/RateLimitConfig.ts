/**
 * Rate Limiting Configuration
 * Centralized rate limiting settings for the LOFERSIL Landing Page
 */

/**
 * Rate limiting configuration interface
 */
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: {
    success: false;
    error: string;
    code: string;
    retryAfter: string;
  };
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // General rate limiting for all requests
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      success: false,
      error: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // Contact form rate limiting (stricter)
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: {
      success: false,
      error: "Too many contact form submissions. Please try again later.",
      code: "CONTACT_RATE_LIMIT_EXCEEDED",
      retryAfter: "1 hour",
    },
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // CSRF token rate limiting
  csrf: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per hour
    message: {
      success: false,
      error: "Too many CSRF token requests. Please try again later.",
      code: "CSRF_RATE_LIMIT_EXCEEDED",
      retryAfter: "1 hour",
    },
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // API endpoints rate limiting (moderate)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: {
      success: false,
      error: "API rate limit exceeded. Please try again later.",
      code: "API_RATE_LIMIT_EXCEEDED",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // Push notification subscription rate limiting
  push: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 subscriptions per hour
    message: {
      success: false,
      error:
        "Too many push notification subscription attempts. Please try again later.",
      code: "PUSH_RATE_LIMIT_EXCEEDED",
      retryAfter: "1 hour",
    },
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,
};

/**
 * Environment-specific rate limit adjustments
 */
export const getEnvironmentSpecificConfig = (
  baseConfig: RateLimitConfig,
  nodeEnv?: string,
): RateLimitConfig => {
  const isDevelopment = nodeEnv === "development";
  const isTest = nodeEnv === "test";

  if (isTest) {
    // More lenient limits for testing
    return {
      ...baseConfig,
      windowMs: 60 * 1000, // 1 minute
      max: baseConfig.max * 10, // 10x more requests
    };
  }

  if (isDevelopment) {
    // Slightly more lenient for development
    return {
      ...baseConfig,
      max: baseConfig.max * 2, // 2x more requests
    };
  }

  return baseConfig;
};

/**
 * Rate limiting utilities
 */
export const RateLimitUtils = {
  /**
   * Generate a rate limit key for a request
   */
  generateKey(req: any, endpointName: string): string {
    // Get client IP, considering proxy headers
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        "unknown";

    // Include user agent for more specific tracking (optional)
    const userAgent = req.headers["user-agent"]
      ? req.headers["user-agent"].substring(0, 50)
      : "";

    return `${endpointName}:${ip}:${userAgent}`;
  },

  /**
   * Log rate limit violation
   */
  logViolation(req: any, config: RateLimitConfig, endpointName: string): void {
    const clientIP = req.ip || req.connection?.remoteAddress || "unknown";

    console.warn(`[RATE_LIMIT] ${endpointName} rate limit exceeded`, {
      ip: clientIP,
      endpoint: req.path,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
      windowMs: config.windowMs,
      max: config.max,
      method: req.method,
      headers: {
        "x-forwarded-for": req.headers["x-forwarded-for"],
        "x-real-ip": req.headers["x-real-ip"],
        "user-agent": req.headers["user-agent"],
      },
    });
  },

  /**
   * Calculate retry after seconds
   */
  calculateRetryAfter(windowMs: number): number {
    return Math.ceil(windowMs / 1000);
  },

  /**
   * Format rate limit headers
   */
  formatHeaders(
    config: RateLimitConfig,
    remaining: number,
    resetTime: number,
  ): Record<string, string> {
    return {
      "X-RateLimit-Limit": config.max.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      "X-RateLimit-Window": config.windowMs.toString(),
    };
  },
};

/**
 * Default export
 */
export default {
  RATE_LIMIT_CONFIGS,
  getEnvironmentSpecificConfig,
  RateLimitUtils,
};
