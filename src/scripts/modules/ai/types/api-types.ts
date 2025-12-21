/**
 * Gemini API Response Types
 * Defines all response types for Google Gemini API integration
 */

import type { FunctionCall, FunctionResponse } from "./common-types";

export interface GenerateContentResponse {
  /** Generated content */
  candidates: Candidate[];
  /** Prompt feedback */
  promptFeedback?: PromptFeedback;
  /** Usage metadata */
  usageMetadata?: UsageMetadata;
  /** Model version used */
  modelVersion?: string;
}

export interface Candidate {
  /** Content of the candidate */
  content: Content;
  /** Finish reason */
  finishReason: FinishReason;
  /** Index of the candidate */
  index: number;
  /** Safety ratings */
  safetyRatings?: SafetyRating[];
  /** Token count */
  tokenCount?: number;
}

export interface Content {
  /** Parts of the content */
  parts: Part[];
  /** Role of the content creator */
  role?: "user" | "model";
}

export interface Part {
  /** Text content */
  text?: string;
  /** Function call */
  functionCall?: FunctionCall;
  /** Function response */
  functionResponse?: FunctionResponse;
  /** Inline data for images */
  inlineData?: {
    mimeType: string;
    data: string; // Base64 encoded
  };
}

export interface PromptFeedback {
  /** Block reason if any */
  blockReason?: BlockReason;
  /** Safety ratings */
  safetyRatings?: SafetyRating[];
  /** Keyword blocking reason */
  blockReasonMessage?: string;
}

export interface SafetyRating {
  /** Category */
  category: string;
  /** Probability */
  probability: SafetyProbability;
  /** Blocked status */
  blocked: boolean;
}

export interface UsageMetadata {
  /** Prompt token count */
  promptTokenCount: number;
  /** Candidates token count */
  candidatesTokenCount: number;
  /** Total token count */
  totalTokenCount: number;
}

export type FinishReason =
  | "FINISH_REASON_STOP"
  | "FINISH_REASON_MAX_TOKENS"
  | "FINISH_REASON_SAFETY"
  | "FINISH_REASON_RECITATION"
  | "FINISH_REASON_OTHER"
  | "FINISH_REASON_UNSPECIFIED";

export type BlockReason =
  | "BLOCK_REASON_UNSPECIFIED"
  | "SAFETY"
  | "OTHER"
  | "BLOCKLIST"
  | "PROHIBITED_CONTENT";

export type SafetyProbability =
  | "HARM_PROBABILITY_UNSPECIFIED"
  | "NEGLIGIBLE"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

/**
 * Streaming response types
 */
export interface GenerateContentStreamResponse {
  /** Chunk index */
  chunkIndex?: number;
  /** Content chunk */
  candidates?: Candidate[];
  /** Prompt feedback */
  promptFeedback?: PromptFeedback;
  /** Usage metadata */
  usageMetadata?: UsageMetadata;
}

/**
 * Error response types
 */
export interface GeminiError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
  /** Error status */
  status: string;
  /** Error details */
  details?: Array<{
    "@type": string;
    description?: string;
    fieldViolations?: Array<{
      field?: string;
      description?: string;
    }>;
  }>;
}

/**
 * Code analysis response types
 */
export interface CodeAnalysis {
  /** Overall quality score (0-100) */
  qualityScore: number;
  /** Security assessment */
  securityAssessment: SecurityAssessment;
  /** Performance analysis */
  performanceAnalysis: PerformanceAnalysis;
  /** Code style issues */
  styleIssues: StyleIssue[];
  /** Recommendations */
  recommendations: Recommendation[];
  /** Detected patterns */
  detectedPatterns: CodePattern[];
  /** Complexity metrics */
  complexity: ComplexityMetrics;
}

export interface SecurityAssessment {
  /** Security score (0-100) */
  score: number;
  /** Security issues found */
  issues: SecurityIssue[];
  /** Vulnerabilities detected */
  vulnerabilities: Vulnerability[];
  /** Security recommendations */
  recommendations: string[];
}

export interface SecurityIssue {
  /** Issue type */
  type: string;
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** Description */
  description: string;
  /** Line number */
  line?: number;
  /** Suggested fix */
  fix?: string;
}

export interface Vulnerability {
  /** CVE identifier if available */
  cve?: string;
  /** Description */
  description: string;
  /** Severity */
  severity: "low" | "medium" | "high" | "critical";
  /** Affected component */
  component: string;
}

export interface PerformanceAnalysis {
  /** Performance score (0-100) */
  score: number;
  /** Performance issues */
  issues: PerformanceIssue[];
  /** Optimization suggestions */
  optimizations: string[];
}

export interface PerformanceIssue {
  /** Issue type */
  type: string;
  /** Description */
  description: string;
  /** Impact level */
  impact: "low" | "medium" | "high";
  /** Location */
  location?: string;
}

export interface StyleIssue {
  /** Issue type */
  type: string;
  /** Description */
  description: string;
  /** Line number */
  line?: number;
  /** Rule that was violated */
  rule?: string;
}

export interface Recommendation {
  /** Type of recommendation */
  type: "security" | "performance" | "style" | "architecture" | "general";
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Priority level */
  priority: "low" | "medium" | "high";
  /** Implementation effort */
  effort: "low" | "medium" | "high";
  /** Code example */
  example?: string;
}

export interface CodePattern {
  /** Pattern name */
  name: string;
  /** Pattern type (design pattern, anti-pattern, etc.) */
  type: "design" | "anti-pattern" | "idiom" | "best-practice";
  /** Description */
  description: string;
  /** Location where found */
  location?: string;
  /** Confidence score */
  confidence: number;
}

export interface ComplexityMetrics {
  /** Cyclomatic complexity */
  cyclomatic: number;
  /** Cognitive complexity */
  cognitive: number;
  /** Lines of code */
  linesOfCode: number;
  /** Maintainability index */
  maintainability: number;
}

/**
 * Text processing response types
 */
export interface TextProcessingResponse {
  /** Processed text */
  text: string;
  /** Processing type */
  type: "summary" | "extraction" | "analysis" | "sentiment";
  /** Confidence score */
  confidence: number;
  /** Extracted entities */
  entities?: Entity[];
  /** Sentiment analysis */
  sentiment?: SentimentAnalysis;
  /** Key phrases */
  keyPhrases?: string[];
  /** Processing time in milliseconds */
  processingTime: number;
}

export interface Entity {
  /** Entity text */
  text: string;
  /** Entity type */
  type: "PERSON" | "ORGANIZATION" | "LOCATION" | "DATE" | "OTHER";
  /** Confidence score */
  confidence: number;
  /** Start position */
  start: number;
  /** End position */
  end: number;
}

export interface SentimentAnalysis {
  /** Sentiment score (-1 to 1) */
  score: number;
  /** Sentiment magnitude (0 to 1) */
  magnitude: number;
  /** Sentiment label */
  label: "positive" | "negative" | "neutral";
  /** Confidence score */
  confidence: number;
}

/**
 * Decision support response types
 */
export interface RecommendationResponse {
  /** Recommendations */
  recommendations: ActionRecommendation[];
  /** Overall confidence */
  confidence: number;
  /** Risk assessment */
  riskAssessment: RiskAssessment;
  /** Reasoning */
  reasoning: string;
  /** Processing time in milliseconds */
  processingTime: number;
}

export interface ActionRecommendation {
  /** Action ID */
  id: string;
  /** Action title */
  title: string;
  /** Description */
  description: string;
  /** Expected outcome */
  expectedOutcome: string;
  /** Priority level */
  priority: "low" | "medium" | "high" | "critical";
  /** Estimated effort */
  effort: "low" | "medium" | "high";
  /** Prerequisites */
  prerequisites?: string[];
  /** Risk level */
  risk: "low" | "medium" | "high";
}

export interface RiskAssessment {
  /** Overall risk score */
  overallScore: number;
  /** Risk factors */
  factors: RiskFactor[];
  /** Mitigation strategies */
  mitigations: string[];
}

export interface RiskFactor {
  /** Risk description */
  description: string;
  /** Impact level */
  impact: "low" | "medium" | "high";
  /** Likelihood */
  likelihood: "low" | "medium" | "high";
  /** Risk score */
  score: number;
}
