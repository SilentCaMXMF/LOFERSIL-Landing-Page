/**
 * Gemini API Configuration Types
 * Defines all configuration options for Google Gemini API integration
 */

export type GeminiModel =
  | "gemini-pro"
  | "gemini-pro-vision"
  | "gemini-1.5-flash"
  | "gemini-1.5-pro";

export interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

export type HarmCategory =
  | "HARM_CATEGORY_HARASSMENT"
  | "HARM_CATEGORY_HATE_SPEECH"
  | "HARM_CATEGORY_SEXUALLY_EXPLICIT"
  | "HARM_CATEGORY_DANGEROUS_CONTENT";

export type HarmBlockThreshold =
  | "BLOCK_NONE"
  | "BLOCK_ONLY_HIGH"
  | "BLOCK_MEDIUM_AND_ABOVE"
  | "BLOCK_LOW_AND_ABOVE";

export interface GeminiConfig {
  /** Google AI API key */
  apiKey: string;
  /** Default model to use for text generation */
  model: GeminiModel;
  /** Optional custom API endpoint */
  apiEndpoint?: string;
  /** Default temperature for text generation (0.0 - 1.0) */
  temperature: number;
  /** Default maximum output tokens */
  maxTokens: number;
  /** Default top-k sampling parameter */
  topK?: number;
  /** Default top-p sampling parameter */
  topP?: number;
  /** Safety settings for content filtering */
  safetySettings: SafetySetting[];
  /** Rate limiting configuration */
  rateLimit: RateLimitConfig;
  /** Cache configuration */
  cache: CacheConfig;
  /** Retry configuration */
  retry: RetryConfig;
}

export interface RateLimitConfig {
  /** Maximum requests per minute */
  requestsPerMinute: number;
  /** Maximum requests per day */
  requestsPerDay: number;
  /** Maximum concurrent requests */
  maxConcurrent: number;
  /** Token bucket refill rate (tokens per second) */
  refillRate: number;
  /** Maximum token bucket capacity */
  bucketCapacity: number;
}

export interface CacheConfig {
  /** Enable/disable caching */
  enabled: boolean;
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Maximum cache size (number of entries) */
  maxSize: number;
  /** Cache cleanup interval in seconds */
  cleanupInterval: number;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

export interface GenerationOptions {
  /** Temperature for text generation (0.0 - 1.0) */
  temperature?: number;
  /** Maximum output tokens to generate */
  maxOutputTokens?: number;
  /** Top-k sampling parameter */
  topK?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Safety settings */
  safetySettings?: SafetySetting[];
  /** Enable streaming response */
  streaming?: boolean;
  /** Enable function calling */
  enableFunctionCalling?: boolean;
  /** Available functions for function calling */
  availableFunctions?: FunctionDeclaration[];
}

export interface FunctionDeclaration {
  /** Function name */
  name: string;
  /** Function description */
  description: string;
  /** Function parameters schema */
  parameters?: {
    type: "OBJECT";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface FunctionCall {
  /** Function name */
  name: string;
  /** Function arguments */
  args: Record<string, any>;
}

export interface FunctionResponse {
  /** Function name */
  name: string;
  /** Function response */
  response: Record<string, any>;
}

/**
 * Default configuration values
 */
export const DEFAULT_GEMINI_CONFIG: Partial<GeminiConfig> = {
  model: "gemini-1.5-flash",
  temperature: 0.7,
  maxTokens: 2048,
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
    requestsPerMinute: 60,
    requestsPerDay: 1500,
    maxConcurrent: 5,
    refillRate: 1,
    bucketCapacity: 10,
  },
  cache: {
    enabled: true,
    defaultTtl: 3600, // 1 hour
    maxSize: 1000,
    cleanupInterval: 300, // 5 minutes
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
};
