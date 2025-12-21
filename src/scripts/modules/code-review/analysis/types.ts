/**
 * Code Analysis Types
 * Type definitions for AI-powered code analysis system
 */

import type { CodeChanges } from "../../github-issues/AutonomousResolver";

export interface AnalysisContext {
  filePath: string;
  repository: RepositoryContext;
  pullRequest?: PullRequestContext;
  previousCommits?: CommitHistory[];
  teamStandards?: TeamStandards;
  analysisType?: "security" | "performance" | "style" | "comprehensive";
}

export interface RepositoryContext {
  name: string;
  owner: string;
  language: string;
  branch: string;
  size: number;
  contributors: number;
}

export interface PullRequestContext {
  number: number;
  title: string;
  description: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  changedFiles: number;
  additions: number;
  deletions: number;
}

export interface CommitHistory {
  sha: string;
  message: string;
  author: string;
  timestamp: Date;
  changes: number;
}

export interface TeamStandards {
  maxComplexity: number;
  maxLineLength: number;
  requiredCoverage: number;
  securityLevel: "strict" | "standard" | "lenient";
}

export interface ModuleResult {
  name: string;
  success: boolean;
  issues: AnalysisIssue[];
  metrics?: Record<string, number>;
  insights?: string[];
  processingTime: number;
}

export interface AnalysisIssue {
  id: string;
  type: IssueType;
  severity: Severity;
  title: string;
  description: string;
  location: CodeLocation;
  recommendation?: string;
  codeExample?: string;
  confidence: number;
  category: IssueCategory;
}

export interface CodeLocation {
  filePath: string;
  startLine?: number;
  endLine?: number;
  column?: number;
  function?: string;
  class?: string;
}

export const IssueType = {
  SYNTAX: "syntax" as const,
  LOGIC: "logic" as const,
  SECURITY: "security" as const,
  PERFORMANCE: "performance" as const,
  STYLE: "style" as const,
  DOCUMENTATION: "documentation" as const,
  TESTING: "testing" as const,
  ARCHITECTURE: "architecture" as const,
  MAINTAINABILITY: "maintainability" as const,
} as const;

export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const Severity = {
  INFO: "info" as const,
  LOW: "low" as const,
  MEDIUM: "medium" as const,
  HIGH: "high" as const,
  CRITICAL: "critical" as const,
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

export const IssueCategory = {
  ERROR: "error" as const,
  WARNING: "warning" as const,
  INFO: "info" as const,
  OPTIMIZATION: "optimization" as const,
  BEST_PRACTICE: "best_practice" as const,
} as const;

export type IssueCategory = (typeof IssueCategory)[keyof typeof IssueCategory];

export interface CodeAnalysis {
  filePath: string;
  language: string;
  changes: CodeChanges;
  qualityScore: number;
  issues: AnalysisIssue[];
  modules: ModuleResult[];
  metrics: AnalysisMetrics;
  insights: AnalysisInsight[];
  summary: AnalysisSummary;
  processingTime: number;
}

export interface AnalysisMetrics {
  complexity: ComplexityMetrics;
  security: SecurityMetrics;
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  testing: TestingMetrics;
  documentation: DocumentationMetrics;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  halstead: HalsteadMetrics;
  maintainability: number;
  technicalDebt: number;
}

export interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  difficulty: number;
  effort: number;
  time: number;
  bugs: number;
}

export interface SecurityMetrics {
  score: number;
  vulnerabilities: number;
  highRiskFlaws: number;
  securityHotspots: number;
}

export interface PerformanceMetrics {
  score: number;
  timeComplexity: string;
  spaceComplexity: string;
  bottlenecks: number;
  optimizations: number;
}

export interface QualityMetrics {
  score: number;
  maintainabilityIndex: number;
  duplicatedCode: number;
  codeSmells: number;
  standardsViolations: number;
}

export interface TestingMetrics {
  coverage: number;
  testCount: number;
  untestedPaths: number;
  criticalCoverage: number;
}

export interface DocumentationMetrics {
  coverage: number;
  documentedFunctions: number;
  undocumentedFunctions: number;
  completeness: number;
}

export interface AnalysisInsight {
  type: InsightType;
  title: string;
  description: string;
  impact: ImpactLevel;
  actionable: boolean;
  priority: Priority;
}

export enum InsightType {
  QUALITY = "quality",
  SECURITY = "security",
  PERFORMANCE = "performance",
  MAINTAINABILITY = "maintainability",
  ARCHITECTURE = "architecture",
  BEST_PRACTICE = "best_practice",
}

export enum ImpactLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface AnalysisSummary {
  overallScore: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  recommendations: string[];
  approvalStatus: "approved" | "needs_changes" | "rejected";
  estimatedEffort: number; // hours
}

export interface AnalysisModule {
  name: string;
  analyze(code: string, context: AnalysisContext): Promise<ModuleResult>;
  priority: number;
  enabled: boolean;
}

// Quality Analyzer Types
export interface QualityResult extends ModuleResult {
  styleIssues: StyleIssue[];
  codeSmells: CodeSmell[];
  maintainabilityIssues: MaintainabilityIssue[];
  duplicatedCode: DuplicatedCode[];
}

export interface StyleIssue {
  type: string;
  description: string;
  location: CodeLocation;
  rule: string;
  severity: Severity;
}

export interface CodeSmell {
  name: string;
  description: string;
  location: CodeLocation;
  severity: Severity;
  refactoring: string;
}

export interface MaintainabilityIssue {
  type: string;
  description: string;
  location: CodeLocation;
  complexityScore: number;
  refactoring: string;
}

export interface DuplicatedCode {
  lines: number;
  similarity: number;
  locations: CodeLocation[];
}

// Security Analyzer Types
export interface SecurityResult extends ModuleResult {
  vulnerabilities: Vulnerability[];
  securityHotspots: SecurityHotspot[];
  dataFlowIssues: DataFlowIssue[];
}

export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  description: string;
  location: CodeLocation;
  recommendation: string;
  cweId?: string;
  cvss?: number;
  evidence?: string;
}

export enum VulnerabilityType {
  XSS = "xss",
  SQL_INJECTION = "sql_injection",
  PATH_TRAVERSAL = "path_traversal",
  INSECURE_CRYPTO = "insecure_crypto",
  HARDCODED_SECRETS = "hardcoded_secrets",
  INSECURE_DESERIALIZATION = "insecure_deserialization",
  BUFFER_OVERFLOW = "buffer_overflow",
  COMMAND_INJECTION = "command_injection",
  INSECURE_DIRECTORY = "insecure_directory",
  WEAK_RANDOMNESS = "weak_randomness",
}

export interface SecurityHotspot {
  type: string;
  description: string;
  location: CodeLocation;
  severity: Severity;
  reviewRequired: boolean;
}

export interface DataFlowIssue {
  type: string;
  description: string;
  source: CodeLocation;
  sink: CodeLocation;
  sanitizer?: CodeLocation;
  severity: Severity;
}

// Performance Analyzer Types
export interface PerformanceResult extends ModuleResult {
  bottlenecks: Bottleneck[];
  algorithmicIssues: AlgorithmicIssue[];
  resourceIssues: ResourceIssue[];
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface Bottleneck {
  type: BottleneckType;
  description: string;
  location: CodeLocation;
  impact: ImpactLevel;
  frequency?: number;
}

export enum BottleneckType {
  INEFFICIENT_LOOP = "inefficient_loop",
  MEMORY_LEAK = "memory_leak",
  DATABASE_QUERY = "database_query",
  NETWORK_CALL = "network_call",
  SYNCHRONOUS_OPERATION = "synchronous_operation",
  LARGE_FILE_PROCESSING = "large_file_processing",
}

export interface AlgorithmicIssue {
  type: string;
  description: string;
  location: CodeLocation;
  currentComplexity: string;
  recommendedComplexity: string;
  improvement: string;
}

export interface ResourceIssue {
  type: ResourceType;
  description: string;
  location: CodeLocation;
  usage: number;
  threshold: number;
  impact: ImpactLevel;
}

export enum ResourceType {
  MEMORY = "memory",
  CPU = "cpu",
  NETWORK = "network",
  DISK_IO = "disk_io",
}

export interface OptimizationSuggestion {
  type: OptimizationType;
  description: string;
  location: CodeLocation;
  impact: ImpactAssessment;
  implementation: CodeExample;
  effort: EffortLevel;
}

export enum OptimizationType {
  ALGORITHM = "algorithm",
  CACHING = "caching",
  PARALLELIZATION = "parallelization",
  LAZY_LOADING = "lazy_loading",
  BULK_OPERATION = "bulk_operation",
  INDEXING = "indexing",
}

export interface ImpactAssessment {
  performanceGain: number; // percentage
  memoryReduction: number; // percentage
  complexityReduction: number; // percentage
}

export interface CodeExample {
  before: string;
  after: string;
  explanation: string;
}

export enum EffortLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}
