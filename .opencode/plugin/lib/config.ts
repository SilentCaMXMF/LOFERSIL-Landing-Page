/**
 * Centralized configuration for Telegram plugin
 * Contains all magic numbers, limits, and thresholds
 */

export interface MessageConfig {
  /** Maximum message length for Telegram API */
  MAX_MESSAGE_LENGTH: number;
  /** Maximum preview length for message truncation */
  MAX_PREVIEW_LENGTH: number;
  /** Maximum line length for validation */
  MAX_LINE_LENGTH: number;
  /** Content preview length for error messages */
  CONTENT_PREVIEW_LENGTH: number;
}

export interface RateLimitConfig {
  /** Rate limit window in milliseconds */
  RATE_LIMIT_WINDOW: number;
  /** Maximum messages per rate limit window */
  MAX_MESSAGES_PER_WINDOW: number;
  /** Minimum interval between messages in milliseconds */
  MIN_INTERVAL_MS: number;
  /** Default rate limit in milliseconds */
  DEFAULT_RATE_LIMIT_MS: number;
}

export interface TimeoutConfig {
  /** HTTP request timeout in milliseconds */
  HTTP_TIMEOUT: number;
  /** Default notification delay in milliseconds */
  DEFAULT_NOTIFICATION_DELAY: number;
  /** Default idle timeout in milliseconds */
  DEFAULT_IDLE_TIMEOUT: number;
  /** Default check interval in milliseconds */
  DEFAULT_CHECK_INTERVAL: number;
  /** Default maximum messages */
  DEFAULT_MAX_MESSAGES: number;
  /** Default maximum retries */
  DEFAULT_MAX_RETRIES: number;
}

export interface ValidationConfig {
  /** Minimum idle timeout in milliseconds */
  MIN_IDLE_TIMEOUT: number;
  /** Maximum idle timeout in milliseconds */
  MAX_IDLE_TIMEOUT: number;
  /** Minimum check interval in milliseconds */
  MIN_CHECK_INTERVAL: number;
  /** Maximum check interval in milliseconds */
  MAX_CHECK_INTERVAL: number;
  /** Minimum rate limit in milliseconds */
  MIN_RATE_LIMIT: number;
  /** Maximum rate limit in milliseconds */
  MAX_RATE_LIMIT: number;
  /** Minimum chat ID length */
  MIN_CHAT_ID_LENGTH: number;
  /** Maximum chat ID length */
  MAX_CHAT_ID_LENGTH: number;
}

export interface TelegramConfig {
  /** Message-related configuration */
  messages: MessageConfig;
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** Timeout configuration */
  timeouts: TimeoutConfig;
  /** Validation limits */
  validation: ValidationConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: TelegramConfig = {
  messages: {
    MAX_MESSAGE_LENGTH: 4096, // Telegram API limit
    MAX_PREVIEW_LENGTH: 200,
    MAX_LINE_LENGTH: 200,
    CONTENT_PREVIEW_LENGTH: 100,
  },
  rateLimit: {
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    MAX_MESSAGES_PER_WINDOW: 20,
    MIN_INTERVAL_MS: 1000, // 1 second
    DEFAULT_RATE_LIMIT_MS: 1000,
  },
  timeouts: {
    HTTP_TIMEOUT: 10000, // 10 seconds
    DEFAULT_NOTIFICATION_DELAY: 5000, // 5 seconds
    DEFAULT_IDLE_TIMEOUT: 300000, // 5 minutes
    DEFAULT_CHECK_INTERVAL: 30000, // 30 seconds
    DEFAULT_MAX_MESSAGES: 50,
    DEFAULT_MAX_RETRIES: 3,
  },
  validation: {
    MIN_IDLE_TIMEOUT: 60000, // 1 minute
    MAX_IDLE_TIMEOUT: 3600000, // 60 minutes
    MIN_CHECK_INTERVAL: 5000, // 5 seconds
    MAX_CHECK_INTERVAL: 300000, // 5 minutes
    MIN_RATE_LIMIT: 500, // 0.5 seconds
    MAX_RATE_LIMIT: 10000, // 10 seconds
    MIN_CHAT_ID_LENGTH: 5,
    MAX_CHAT_ID_LENGTH: 15,
  },
};

/**
 * Get configuration with optional overrides
 */
export function getConfig(overrides?: Partial<TelegramConfig>): TelegramConfig {
  if (!overrides) {
    return DEFAULT_CONFIG;
  }

  return {
    messages: { ...DEFAULT_CONFIG.messages, ...overrides.messages },
    rateLimit: { ...DEFAULT_CONFIG.rateLimit, ...overrides.rateLimit },
    timeouts: { ...DEFAULT_CONFIG.timeouts, ...overrides.timeouts },
    validation: { ...DEFAULT_CONFIG.validation, ...overrides.validation },
  };
}

/**
 * Individual configuration getters for backward compatibility
 */
export const messageConfig = DEFAULT_CONFIG.messages;
export const rateLimitConfig = DEFAULT_CONFIG.rateLimit;
export const timeoutConfig = DEFAULT_CONFIG.timeouts;
export const validationConfig = DEFAULT_CONFIG.validation;