/**
 * AI Module Index
 * Central exports for all AI functionality
 */

// Configuration
export type {
  GeminiConfig,
  GenerationOptions,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
  GeminiModel,
  RateLimitConfig,
  CacheConfig,
  RetryConfig,
} from "./config/gemini-config";

// API Types
export type {
  GenerateContentResponse,
  Candidate,
  Content,
  Part,
  PromptFeedback,
  SafetyRating,
  UsageMetadata,
  FinishReason,
  BlockReason,
  SafetyProbability,
  CodeAnalysis,
  SecurityAssessment,
  SecurityIssue,
  Vulnerability,
  PerformanceAnalysis,
  PerformanceIssue,
  StyleIssue,
  Recommendation,
  CodePattern,
  ComplexityMetrics,
  TextProcessingResponse,
  Entity,
  SentimentAnalysis,
  RecommendationResponse,
  ActionRecommendation,
  RiskAssessment,
  RiskFactor,
  GeminiError,
} from "./types/api-types";

// Common Types
export type {
  FunctionDeclaration,
  FunctionCall,
  FunctionResponse,
} from "./types/common-types";

// Templates
export {
  PromptTemplateRegistry,
  PromptUtils,
  type PromptTemplate,
  type TemplateExample,
} from "./templates/PromptTemplates";

// Utils
export {
  CacheManager,
  CacheFactory,
  type CacheEntry,
  type CacheStats,
  type CacheOptions,
} from "./utils/CacheManager";

export {
  RateLimiter,
  KeyedRateLimiter,
  type RateLimitStatus,
  type RateLimitStats,
} from "./utils/RateLimiter";

// Gemini API
export {
  GeminiApiClient,
  type GeminiClientOptions,
  type RequestOptions,
  type StreamChunk,
} from "./gemini/GeminiApiClient";

export {
  GeminiService,
  type CodeAnalysisRequest,
  type TextProcessingRequest,
  type IssueAnalysisRequest,
  type DecisionSupportRequest,
} from "./gemini/GeminiService";

// Default configuration
export { DEFAULT_GEMINI_CONFIG } from "./config/gemini-config";

// Task Recommendation System
export * from "./tasks";
