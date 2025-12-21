/**
 * Task Analysis Module Types
 * Defines comprehensive interfaces for task analysis and classification
 */

import type { TaskInfo } from "../../../TaskManager";

/**
 * Enhanced Task Input Interface
 */
export interface TaskInput extends TaskInfo {
  // Extended task data for analysis
  repository?: string;
  filesChanged?: string[];
  codeComplexity?: number;
  dependencies?: string[];
  estimatedHours?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  skillRequirements?: string[];
}

/**
 * Analysis Context
 */
export interface AnalysisContext {
  project: ProjectContext;
  team: TeamContext;
  history: HistoricalContext;
  constraints: ConstraintContext;
}

export interface ProjectContext {
  name: string;
  description: string;
  technology: string[];
  goals: string[];
  deadlines: Deadline[];
  budget?: number;
  stakeholders: string[];
}

export interface TeamContext {
  members: TeamMember[];
  skills: TeamSkill[];
  workload: WorkloadDistribution;
  availability: TeamAvailability;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: Skill[];
  experience: number; // years
  workload: number; // current tasks count
  availability: number; // hours per week
  performance: PerformanceMetrics;
}

export interface Skill {
  name: string;
  level: number; // 1-10
  category: SkillCategory;
  lastUsed?: Date;
  certifications?: string[];
}

export enum SkillCategory {
  FRONTEND = "frontend",
  BACKEND = "backend",
  DATABASE = "database",
  DEVOPS = "devops",
  TESTING = "testing",
  DESIGN = "design",
  MANAGEMENT = "management",
  SECURITY = "security",
}

export interface TeamSkill {
  skill: string;
  category: SkillCategory;
  averageLevel: number;
  availableMembers: string[];
  demand: number;
  gap: number;
}

export interface WorkloadDistribution {
  total: number;
  byMember: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface TeamAvailability {
  totalHours: number;
  availableHours: number;
  byMember: Record<string, number>;
  nextWeekAvailability: Record<string, number>;
}

export interface HistoricalContext {
  completedTasks: TaskInfo[];
  averageCompletionTime: number;
  successRate: number;
  commonPatterns: TaskPattern[];
  failureAnalysis: FailureAnalysis[];
}

export interface TaskPattern {
  type: string;
  frequency: number;
  avgDuration: number;
  successFactors: string[];
  riskFactors: string[];
}

export interface FailureAnalysis {
  failureType: string;
  frequency: number;
  commonCauses: string[];
  mitigationStrategies: string[];
}

export interface ConstraintContext {
  time: TimeConstraint;
  budget: BudgetConstraint;
  resources: ResourceConstraint[];
  dependencies: DependencyConstraint[];
}

export interface TimeConstraint {
  deadlines: Deadline[];
  milestones: Milestone[];
  workingHours: WorkingHours;
}

export interface Deadline {
  id: string;
  name: string;
  date: Date;
  priority: "low" | "medium" | "high" | "critical";
  impact: string;
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  dependencies: string[];
  deliverables: string[];
}

export interface WorkingHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  holidays: Date[];
}

export interface BudgetConstraint {
  total: number;
  allocated: number;
  remaining: number;
  limits: Record<string, number>;
}

export interface ResourceConstraint {
  type: string;
  name: string;
  capacity: number;
  used: number;
  availability: number;
}

export interface DependencyConstraint {
  taskId: string;
  dependsOn: string[];
  blockedBy: string[];
  impact: string;
}

/**
 * Task Classification
 */
export enum TaskCategory {
  FEATURE_DEVELOPMENT = "feature_development",
  BUG_FIX = "bug_fix",
  REFACTORING = "refactoring",
  DOCUMENTATION = "documentation",
  TESTING = "testing",
  MAINTENANCE = "maintenance",
  RESEARCH = "research",
  PERFORMANCE = "performance",
  SECURITY = "security",
  INTEGRATION = "integration",
}

export enum ComplexityLevel {
  SIMPLE = "simple",
  MODERATE = "moderate",
  COMPLEX = "complex",
  VERY_COMPLEX = "very_complex",
}

export enum EffortEstimate {
  VERY_LOW = "very_low", // < 4 hours
  LOW = "low", // 4-8 hours
  MEDIUM = "medium", // 8-16 hours
  HIGH = "high", // 16-32 hours
  VERY_HIGH = "very_high", // > 32 hours
}

export interface TaskClassification {
  category: TaskCategory;
  confidence: number; // 0-1
  tags: string[];
  complexity: ComplexityLevel;
  effort: EffortEstimate;
  estimatedHours: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasoning: string;
  features: TaskFeatures;
}

/**
 * Task Features (for ML models)
 */
export interface TaskFeatures {
  textFeatures: TextFeatures;
  metadataFeatures: MetadataFeatures;
  contextualFeatures: ContextualFeatures;
  temporalFeatures: TemporalFeatures;
}

export interface TextFeatures {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  urgencyKeywords: number;
  complexityKeywords: number;
  technicalTerms: number;
  actionVerbs: number;
  sentiment: number; // -1 to 1
  readabilityScore: number;
}

export interface MetadataFeatures {
  labelCount: number;
  hasAssignee: boolean;
  priorityLevel: number; // 0-3
  milestoneCount: number;
  dependencyCount: number;
  stakeholderCount: number;
}

export interface ContextualFeatures {
  projectComplexity: number;
  teamSize: number;
  skillRequirementLevel: number;
  resourcePressure: number;
  deadlinePressure: number;
  budgetPressure: number;
}

export interface TemporalFeatures {
  dayOfWeek: number;
  month: number;
  daysToDeadline: number;
  seasonality: number;
  recentActivity: number;
}

/**
 * Task Analysis Result
 */
export interface TaskAnalysis {
  task: TaskInput;
  classification: TaskClassification;
  dependencies: DependencyAnalysis;
  requirements: RequirementAnalysis;
  risks: RiskAnalysis;
  recommendations: AnalysisRecommendation[];
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

export interface DependencyAnalysis {
  blockers: Dependency[];
  dependents: Dependency[];
  circularDependencies: Dependency[];
  externalDependencies: Dependency[];
  impactScore: number;
  criticalPath: boolean;
}

export interface Dependency {
  taskId: string;
  type: DependencyType;
  strength: number; // 0-1
  description: string;
  resolved: boolean;
}

export enum DependencyType {
  BLOCKS = "blocks",
  REQUIRES = "requires",
  RELATED = "related",
  CONFLICTS = "conflicts",
}

export interface RequirementAnalysis {
  functional: Requirement[];
  nonFunctional: Requirement[];
  technical: Requirement[];
  business: Requirement[];
  gaps: Requirement[];
}

export interface Requirement {
  id: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: RequirementCategory;
  source: string;
  acceptanceCriteria: string[];
  effort: EffortEstimate;
  complexity: ComplexityLevel;
}

export enum RequirementCategory {
  FUNCTIONAL = "functional",
  NON_FUNCTIONAL = "non_functional",
  TECHNICAL = "technical",
  BUSINESS = "business",
  USER_EXPERIENCE = "user_experience",
}

export interface RiskAnalysis {
  technical: Risk[];
  project: Risk[];
  resource: Risk[];
  external: Risk[];
  overallRisk: number; // 0-100
  mitigation: MitigationStrategy[];
}

export interface Risk {
  id: string;
  description: string;
  category: RiskCategory;
  probability: number; // 0-1
  impact: number; // 0-100
  score: number; // probability * impact
  mitigation: string[];
  owner?: string;
}

export enum RiskCategory {
  TECHNICAL = "technical",
  PROJECT = "project",
  RESOURCE = "resource",
  EXTERNAL = "external",
  SECURITY = "security",
}

export interface MitigationStrategy {
  riskId: string;
  strategy: string;
  effectiveness: number; // 0-1
  cost: number; // 1-10
  owner?: string;
  timeline: string;
}

export interface AnalysisRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  effort: EffortEstimate;
  impact: number; // 0-100
  confidence: number; // 0-1
  reasoning: string;
  dependencies: string[];
  benefits: string[];
}

export enum RecommendationType {
  CLASSIFICATION = "classification",
  PRIORITIZATION = "prioritization",
  ASSIGNMENT = "assignment",
  DEPENDENCY = "dependency",
  RISK = "risk",
  OPTIMIZATION = "optimization",
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  tasksCompleted: number;
  averageCompletionTime: number;
  qualityScore: number; // 0-100
  successRate: number; // 0-1
  velocity: number; // tasks per sprint
  satisfaction: number; // 0-5
  peerReviews: number;
  mentorshipScore: number; // 0-10
}

/**
 * Analysis Engine Configuration
 */
export interface AnalysisConfig {
  models: ModelConfig[];
  features: FeatureConfig;
  thresholds: ThresholdConfig;
  weights: WeightConfig;
}

export interface ModelConfig {
  name: string;
  type: "classification" | "regression" | "clustering";
  version: string;
  accuracy: number;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface FeatureConfig {
  text: boolean;
  metadata: boolean;
  contextual: boolean;
  temporal: boolean;
  custom: string[];
}

export interface ThresholdConfig {
  classification: number;
  dependency: number;
  risk: number;
  recommendation: number;
}

export interface WeightConfig {
  complexity: number;
  urgency: number;
  importance: number;
  effort: number;
  risk: number;
  dependency: number;
  skillMatch: number;
}
