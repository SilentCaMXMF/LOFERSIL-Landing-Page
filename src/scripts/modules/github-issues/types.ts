/**
 * GitHub Issues Reviewer Types
 * 
 * Type definitions for the GitHub Issues Reviewer system
 */

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  state: "open" | "closed";
  user: { login: string };
  created_at: string;
  updated_at: string;
  html_url: string;
  assignee?: { login: string };
  milestone?: any;
}

export interface AnalysisResult {
  category: "bug" | "feature" | "documentation" | "question" | "maintenance" | "security" | "performance";
  complexity: "low" | "medium" | "high" | "critical";
  feasibility: boolean;
  confidence: number;
  requirements: string[];
  acceptance_criteria: string[];
  reasoning: string;
  estimated_effort?: {
    hours: number;
    complexity_level: string;
  };
}

export interface CodeChanges {
  files: Array<{
    path: string;
    changes: Array<{
      type: "add" | "modify" | "delete";
      content: string;
    }>;
  }>;
}

export interface ReviewResult {
  approved: boolean;
  score: number;
  issues: Array<{
    type: string;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
    recommendation?: string;
  }>;
  recommendations: string[];
  reasoning: string;
  metadata: {
    static_analysis_score: number;
    security_score: number;
    quality_score: number;
    test_coverage_score: number;
    performance_score: number;
    documentation_score: number;
  };
}

export interface WorkflowResult {
  success: boolean;
  finalState: WorkflowState;
  requiresHumanReview: boolean;
  executionTime: number;
  outputs: {
    analysis?: AnalysisResult;
    resolution?: any;
    review?: ReviewResult;
    pr?: any;
  };
  errors?: string[];
  workflowId: string;
}

export enum WorkflowState {
  INITIATED = "initiated",
  ANALYZING = "analyzing",
  RESOLVING = "resolving",
  REVIEWING = "reviewing",
  CREATING_PR = "creating_pr",
  PR_COMPLETE = "pr_complete",
  FAILED = "failed",
  REQUIRES_HUMAN_REVIEW = "requires_human_review"
}

export interface MCPClientConfig {
  serverUrl: string;
  clientInfo: {
    name: string;
    version: string;
  };
  connectionTimeout?: number;
  reconnection?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  capabilities?: {
    tools?: {};
    resources?: {};
    prompts?: {
      experimental?: Record<string, any>;
    };
  };
  debug?: boolean;
}

export interface IssueAnalyzerConfig {
  mcpClient: any;
  confidenceThreshold?: number;
  enableCaching?: boolean;
  cacheTimeout?: number;
}

export interface CodeReviewerConfig {
  mcpClient?: any;
  mcpServerUrl?: string;
  minApprovalScore?: number;
  strictMode?: boolean;
  securityScanEnabled?: boolean;
  performanceAnalysisEnabled?: boolean;
  documentationRequired?: boolean;
  maxReviewTime?: number;
}

export interface WorkflowOrchestratorConfig {
  issueAnalyzer: any;
  codeReviewer: any;
  autonomousResolver?: any;
  prGenerator?: any;
  maxWorkflowTime?: number;
  enableMetrics?: boolean;
  retryAttempts?: number;
  humanInterventionThreshold?: number;
}