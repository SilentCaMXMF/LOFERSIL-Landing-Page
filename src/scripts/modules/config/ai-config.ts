/**
 * AI Configuration
 * Environment-based configuration for Gemini API integration
 */

import type { GeminiConfig } from "../ai";
import { DEFAULT_GEMINI_CONFIG } from "../ai";

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY || "";

  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY environment variable not set. AI features will be limited.",
    );
  }

  return {
    apiKey,
    model: (process.env.GEMINI_MODEL as any) || DEFAULT_GEMINI_CONFIG.model,
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "2048"),
    topK: parseInt(process.env.GEMINI_TOP_K || "40"),
    topP: parseFloat(process.env.GEMINI_TOP_P || "0.95"),
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold:
          (process.env.GEMINI_HARASSMENT_THRESHOLD as any) ||
          "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold:
          (process.env.GEMINI_HATE_SPEECH_THRESHOLD as any) ||
          "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold:
          (process.env.GEMINI_SEXUALLY_EXPLICIT_THRESHOLD as any) ||
          "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold:
          (process.env.GEMINI_DANGEROUS_CONTENT_THRESHOLD as any) ||
          "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
    rateLimit: {
      requestsPerMinute: parseInt(
        process.env.GEMINI_RATE_LIMIT_PER_MINUTE || "60",
      ),
      requestsPerDay: parseInt(process.env.GEMINI_RATE_LIMIT_PER_DAY || "1500"),
      maxConcurrent: parseInt(process.env.GEMINI_MAX_CONCURRENT || "5"),
      refillRate: parseFloat(process.env.GEMINI_REFILL_RATE || "1"),
      bucketCapacity: parseInt(process.env.GEMINI_BUCKET_CAPACITY || "10"),
    },
    cache: {
      enabled: process.env.GEMINI_CACHE_ENABLED !== "false",
      defaultTtl: parseInt(process.env.GEMINI_CACHE_TTL || "3600"),
      maxSize: parseInt(process.env.GEMINI_CACHE_MAX_SIZE || "1000"),
      cleanupInterval: parseInt(
        process.env.GEMINI_CACHE_CLEANUP_INTERVAL || "300",
      ),
    },
    retry: {
      maxAttempts: parseInt(process.env.GEMINI_RETRY_MAX_ATTEMPTS || "3"),
      baseDelay: parseInt(process.env.GEMINI_RETRY_BASE_DELAY || "1000"),
      maxDelay: parseInt(process.env.GEMINI_RETRY_MAX_DELAY || "10000"),
      backoffMultiplier: parseFloat(
        process.env.GEMINI_RETRY_BACKOFF_MULTIPLIER || "2",
      ),
    },
  };
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: GeminiConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check API key
  if (!config.apiKey) {
    errors.push("API key is required");
  } else if (config.apiKey.length < 10) {
    errors.push("API key appears to be invalid (too short)");
  }

  // Check model
  const validModels = [
    "gemini-pro",
    "gemini-pro-vision",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];
  if (!validModels.includes(config.model)) {
    errors.push(
      `Invalid model: ${config.model}. Must be one of: ${validModels.join(", ")}`,
    );
  }

  // Check temperature
  if (config.temperature < 0 || config.temperature > 1) {
    errors.push("Temperature must be between 0 and 1");
  }

  // Check max tokens
  if (config.maxTokens <= 0 || config.maxTokens > 8192) {
    errors.push("Max tokens must be between 1 and 8192");
  }

  // Check rate limits
  if (config.rateLimit.requestsPerMinute <= 0) {
    errors.push("Requests per minute must be greater than 0");
  }
  if (config.rateLimit.requestsPerDay <= 0) {
    errors.push("Requests per day must be greater than 0");
  }
  if (config.rateLimit.maxConcurrent <= 0) {
    errors.push("Max concurrent requests must be greater than 0");
  }

  // Check cache settings
  if (config.cache.defaultTtl <= 0) {
    errors.push("Cache TTL must be greater than 0");
  }
  if (config.cache.maxSize <= 0) {
    errors.push("Cache max size must be greater than 0");
  }

  // Check retry settings
  if (config.retry.maxAttempts <= 0 || config.retry.maxAttempts > 10) {
    errors.push("Max retry attempts must be between 1 and 10");
  }
  if (config.retry.baseDelay < 0) {
    errors.push("Retry base delay must be non-negative");
  }
  if (config.retry.maxDelay <= config.retry.baseDelay) {
    errors.push("Retry max delay must be greater than base delay");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default AI configuration for development
 */
export function getDevAIConfig(): GeminiConfig {
  return {
    apiKey: "development-key", // Special handling for dev
    model: "gemini-1.5-flash",
    temperature: 0.7,
    maxTokens: 1024,
    topK: 40,
    topP: 0.95,
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ],
    rateLimit: {
      requestsPerMinute: 30, // Lower for development
      requestsPerDay: 500,
      maxConcurrent: 2,
      refillRate: 0.5,
      bucketCapacity: 5,
    },
    cache: {
      enabled: true,
      defaultTtl: 300, // 5 minutes for development
      maxSize: 100,
      cleanupInterval: 60,
    },
    retry: {
      maxAttempts: 2, // Fewer retries for development
      baseDelay: 500,
      maxDelay: 3000,
      backoffMultiplier: 2,
    },
  };
}

/**
 * Get test AI configuration
 */
export function getTestAIConfig(): GeminiConfig {
  return {
    apiKey: "test-key",
    model: "gemini-1.5-flash",
    temperature: 0.5,
    maxTokens: 512,
    topK: 20,
    topP: 0.8,
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE", // More permissive for tests
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
      },
    ],
    rateLimit: {
      requestsPerMinute: 100, // High limit for tests
      requestsPerDay: 1000,
      maxConcurrent: 10,
      refillRate: 2,
      bucketCapacity: 20,
    },
    cache: {
      enabled: true,
      defaultTtl: 60, // Short TTL for tests
      maxSize: 50,
      cleanupInterval: 30,
    },
    retry: {
      maxAttempts: 1, // No retries for tests
      baseDelay: 100,
      maxDelay: 200,
      backoffMultiplier: 1.5,
    },
  };
}

/**
 * Environment detection helpers
 */
export const environment = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  hasApiKey: !!process.env.GEMINI_API_KEY,
};

/**
 * Configuration presets
 */
export const configPresets = {
  /** Conservative settings for production */
  production: {
    temperature: 0.3,
    maxTokens: 1024,
    requestsPerMinute: 30,
    cacheTtl: 7200, // 2 hours
  },

  /** Balanced settings for general use */
  balanced: {
    temperature: 0.7,
    maxTokens: 2048,
    requestsPerMinute: 60,
    cacheTtl: 3600, // 1 hour
  },

  /** Aggressive settings for creative tasks */
  creative: {
    temperature: 0.9,
    maxTokens: 4096,
    requestsPerMinute: 45,
    cacheTtl: 1800, // 30 minutes
  },

  /** Optimized for code analysis */
  codeAnalysis: {
    temperature: 0.2,
    maxTokens: 1536,
    requestsPerMinute: 40,
    cacheTtl: 7200, // 2 hours
  },
};
