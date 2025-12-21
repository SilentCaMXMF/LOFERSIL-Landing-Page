/**
 * GitHub Issues Reviewer Type Definitions
 */

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  apiEndpoint: string;
  rateLimit: RateLimitConfig;
}

export interface RateLimitConfig {
  maxRequests: number;
  resetInterval: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  type: string;
  site_admin: boolean;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
  default: boolean;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  locked: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: GitHubUser;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  milestone: any;
  labels: GitHubLabel[];
  html_url: string;
  url: string;
  repository_url: string;
  comments: number;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export type IssueType =
  | "bug"
  | "feature"
  | "enhancement"
  | "documentation"
  | "question"
  | "maintenance"
  | "unknown";

export type Priority = "low" | "medium" | "high" | "critical";

export interface ClassificationResult {
  type: IssueType;
  confidence: number;
  labels: string[];
  priority: Priority;
  reasoning: string;
}

export interface IssueAnalysis {
  category: IssueType;
  complexity: Priority;
  requirements: string[];
  acceptanceCriteria: string[];
  feasible: boolean;
  confidence: number; // 0-1 scale
  reasoning: string;
  classification: ClassificationResult;
  estimatedEffort: EffortEstimate;
  suggestedAssignees: AssignmentRecommendation[];
}

export interface EffortEstimate {
  hours: number;
  complexity: Priority;
  uncertainty: number; // 0-1 scale
  factors: string[];
}

export interface AssignmentRecommendation {
  assignee: GitHubUser;
  confidence: number;
  reasoning: string;
  workload: WorkloadInfo;
  expertise: ExpertiseMatch;
}

export interface WorkloadInfo {
  currentIssues: number;
  totalAssignments: number;
  averageResolutionTime: number;
  availability: "high" | "medium" | "low";
}

export interface ExpertiseMatch {
  score: number;
  relevantSkills: string[];
  historicalPerformance: number;
  contributionsToRelatedFiles: number;
}

export interface AnalysisConfig {
  complexityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  maxAnalysisTime: number; // milliseconds
  supportedLabels: string[];
  aiConfig: AIConfig;
}

export interface AIConfig {
  provider: "gemini" | "openai";
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
}

export interface Metrics {
  totalIssues: number;
  analyzedIssues: number;
  classificationAccuracy: number;
  averageAnalysisTime: number;
  assignmentSuccess: number;
  errorRate: number;
}

export interface APIResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
  metadata?: {
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
    processingTime: number;
  };
}

export interface ErrorContext {
  operation: string;
  issueId?: number;
  timestamp: string;
  retryCount: number;
  originalError: Error;
}

export interface DashboardMetrics {
  issueVolume: {
    total: number;
    open: number;
    closed: number;
    daily: number[];
  };
  resolutionTime: {
    average: number;
    median: number;
    p95: number;
    trend: number[];
  };
  classificationAccuracy: {
    overall: number;
    byType: Record<string, number>;
  };
  assignmentSuccess: {
    overall: number;
    byAssignee: Record<string, number>;
  };
  alerts: AlertInfo[];
}

export interface AlertInfo {
  id: string;
  type: "sla_breach" | "high_priority" | "anomaly" | "performance";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort?: "created" | "updated" | "comments";
  direction?: "asc" | "desc";
  state?: "open" | "closed" | "all";
}

export interface IssueFilter {
  labels?: string[];
  assignee?: string;
  creator?: string;
  milestone?: string;
  state?: "open" | "closed" | "all";
  since?: string;
  until?: string;
}
