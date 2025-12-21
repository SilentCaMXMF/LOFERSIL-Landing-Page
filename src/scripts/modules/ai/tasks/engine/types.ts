/**
 * Recommendation Engine Types
 * Defines interfaces for AI-powered task recommendations
 */

import type { TaskInfo } from "../../../TaskManager";
import type { TaskAnalysis, AnalysisContext } from "../analysis/types";

/**
 * Recommendation Context
 */
export interface RecommendationContext {
  user: UserContext;
  project: ProjectRecommendationContext;
  team: TeamRecommendationContext;
  tasks: TaskRecommendationContext;
  preferences: RecommendationPreferences;
  history: RecommendationHistory;
}

export interface UserContext {
  id: string;
  name: string;
  role: string;
  skills: string[];
  experience: number; // years
  preferences: UserPreferences;
  workload: UserWorkload;
  performance: UserPerformance;
}

export interface UserPreferences {
  taskTypes: string[];
  priorities: string[];
  complexities: string[];
  workHours: WorkingHours;
  collaboration: CollaborationStyle;
}

export interface WorkingHours {
  monday: { start: string; end: string };
  tuesday: { start: string; end: string };
  wednesday: { start: string; end: string };
  thursday: { start: string; end: string };
  friday: { start: string; end: string };
  saturday: { start: string; end: string };
  sunday: { start: string; end: string };
  timezone: string;
}

export interface CollaborationStyle {
  preferredTeamSize: number;
  communicationStyle: "synchronous" | "asynchronous" | "mixed";
  mentorship: "mentee" | "mentor" | "both" | "none";
  reviewLevel: "light" | "moderate" | "thorough";
}

export interface UserWorkload {
  currentTasks: number;
  totalHours: number;
  availableHours: number;
  utilizationRate: number; // 0-1
  overCapacity: boolean;
}

export interface UserPerformance {
  tasksCompleted: number;
  averageCompletionTime: number;
  qualityScore: number; // 0-100
  onTimeDelivery: number; // 0-1
  satisfactionScore: number; // 0-5
}

export interface ProjectRecommendationContext {
  id: string;
  name: string;
  phase: "planning" | "development" | "testing" | "deployment" | "maintenance";
  goals: string[];
  constraints: ProjectConstraints;
  stakeholders: string[];
  timeline: ProjectTimeline;
}

export interface ProjectConstraints {
  budget: BudgetConstraint;
  time: TimeConstraint;
  resources: ResourceConstraint[];
  quality: QualityConstraint;
}

export interface BudgetConstraint {
  total: number;
  allocated: number;
  remaining: number;
  currency: string;
}

export interface TimeConstraint {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  buffer: number; // days
  criticalPath: string[];
}

export interface Milestone {
  id: string;
  name: string;
  date: Date;
  dependencies: string[];
  deliverables: string[];
}

export interface ResourceConstraint {
  type: "human" | "technical" | "financial" | "infrastructure";
  name: string;
  capacity: number;
  allocated: number;
  availability: number;
}

export interface QualityConstraint {
  standards: string[];
  minimumTestCoverage: number;
  performanceThresholds: PerformanceThreshold[];
  securityRequirements: string[];
}

export interface PerformanceThreshold {
  metric: string;
  threshold: number;
  unit: string;
}

export interface ProjectTimeline {
  totalDays: number;
  remainingDays: number;
  phases: ProjectPhase[];
  criticalPath: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  tasks: string[];
  dependencies: string[];
}

export interface TeamRecommendationContext {
  id: string;
  name: string;
  members: TeamMember[];
  skills: TeamSkill[];
  workload: TeamWorkload;
  collaboration: TeamCollaboration;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: Skill[];
  availability: number; // hours per week
  currentWorkload: number;
  performance: number; // 0-100
  preferences: MemberPreferences;
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

export interface MemberPreferences {
  taskTypes: string[];
  complexities: string[];
  collaboration: "solo" | "pair" | "team";
  mentorship: "mentee" | "mentor" | "both" | "none";
}

export interface TeamSkill {
  skill: string;
  category: SkillCategory;
  averageLevel: number;
  availableMembers: string[];
  demand: number;
  gap: number;
}

export interface TeamWorkload {
  totalTasks: number;
  totalHours: number;
  averageLoad: number;
  utilizationRate: number;
  overloadedMembers: string[];
  availableCapacity: number;
}

export interface TeamCollaboration {
  communicationStyle: string;
  coordinationLevel: number; // 0-10
  conflictResolution: number; // 0-10
  knowledgeSharing: number; // 0-10
}

export interface TaskRecommendationContext {
  pending: TaskInfo[];
  inProgress: TaskInfo[];
  completed: TaskInfo[];
  blocked: TaskInfo[];
  priorities: TaskPriority[];
  dependencies: TaskDependency[];
}

export interface TaskPriority {
  taskId: string;
  priority: "low" | "medium" | "high" | "critical";
  score: number; // 0-100
  factors: PriorityFactor[];
}

export interface PriorityFactor {
  name: string;
  weight: number; // 0-1
  value: number; // 0-100
  reasoning: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  blockedBy: string[];
  strength: number; // 0-1
  type: DependencyType;
}

export enum DependencyType {
  BLOCKS = "blocks",
  REQUIRES = "requires",
  RELATED = "related",
  CONFLICTS = "conflicts",
}

export interface RecommendationPreferences {
  strategy: RecommendationStrategy;
  weights: RecommendationWeights;
  filters: RecommendationFilters;
  limits: RecommendationLimits;
}

export enum RecommendationStrategy {
  BALANCED = "balanced",
  URGENCY = "urgency",
  SKILL_BASED = "skill_based",
  WORKLOAD_BALANCED = "workload_balanced",
  DEADLINE_DRIVEN = "deadline_driven",
  QUALITY_FOCUSED = "quality_focused",
  STRATEGIC = "strategic",
}

export interface RecommendationWeights {
  impact: number; // 0-1
  effort: number; // 0-1
  urgency: number; // 0-1
  skillMatch: number; // 0-1
  workload: number; // 0-1
  deadline: number; // 0-1
  quality: number; // 0-1
  collaboration: number; // 0-1
}

export interface RecommendationFilters {
  taskTypes: string[];
  priorities: string[];
  complexities: string[];
  skills: string[];
  assignees: string[];
  deadlines: DateRange;
  effortRange: EffortRange;
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface EffortRange {
  min?: number;
  max?: number;
  unit: "hours" | "days" | "story_points";
}

export interface RecommendationLimits {
  maxRecommendations: number;
  maxPerUser: number;
  maxPerCategory: number;
  timeHorizon: number; // days
}

export interface RecommendationHistory {
  accepted: Recommendation[];
  rejected: Recommendation[];
  ignored: Recommendation[];
  effectiveness: RecommendationEffectiveness;
}

export interface RecommendationEffectiveness {
  acceptanceRate: number; // 0-1
  satisfactionScore: number; // 0-5
  completionRate: number; // 0-1
  accuracy: number; // 0-1
  feedback: RecommendationFeedback[];
}

export interface RecommendationFeedback {
  recommendationId: string;
  rating: number; // 1-5
  comment?: string;
  outcome: "completed" | "cancelled" | "modified";
  timestamp: Date;
}

/**
 * Task Recommendation Result
 */
export interface TaskRecommendation {
  id: string;
  task: TaskInfo;
  type: RecommendationType;
  priority: number; // 0-100
  confidence: number; // 0-1
  reasoning: RecommendationReasoning;
  benefits: RecommendationBenefit[];
  risks: RecommendationRisk[];
  effort: RecommendationEffort;
  timeline: RecommendationTimeline;
  assignee?: string;
  alternatives: TaskRecommendation[];
  metadata: RecommendationMetadata;
}

export enum RecommendationType {
  NEXT_TASK = "next_task",
  SKILL_DEVELOPMENT = "skill_development",
  WORKLOAD_BALANCE = "workload_balance",
  DEADLINE_FOCUS = "deadline_focus",
  QUALITY_IMPROVEMENT = "quality_improvement",
  COLLABORATION = "collaboration",
  STRATEGIC = "strategic",
  BACKLOG_CLEANUP = "backlog_cleanup",
}

export interface RecommendationReasoning {
  primary: string;
  factors: ReasoningFactor[];
  confidence: number; // 0-1
  methodology: string;
  dataSources: string[];
}

export interface ReasoningFactor {
  name: string;
  value: number; // 0-100
  weight: number; // 0-1
  contribution: number; // 0-1
  description: string;
}

export interface RecommendationBenefit {
  type: BenefitType;
  description: string;
  impact: number; // 0-100
  probability: number; // 0-1
}

export enum BenefitType {
  PRODUCTIVITY = "productivity",
  QUALITY = "quality",
  LEARNING = "learning",
  COLLABORATION = "collaboration",
  DEADLINE = "deadline",
  WORKLOAD = "workload",
  STRATEGIC = "strategic",
}

export interface RecommendationRisk {
  type: RiskType;
  description: string;
  impact: number; // 0-100
  probability: number; // 0-1
  mitigation: string[];
}

export enum RiskType {
  SKILL_GAP = "skill_gap",
  WORKLOAD = "workload",
  DEADLINE = "deadline",
  QUALITY = "quality",
  DEPENDENCY = "dependency",
  RESOURCE = "resource",
}

export interface RecommendationEffort {
  estimatedHours: number;
  complexity: "simple" | "moderate" | "complex" | "very_complex";
  confidence: number; // 0-1
  breakdown: EffortBreakdown[];
}

export interface EffortBreakdown {
  phase: string;
  hours: number;
  description: string;
  dependencies: string[];
}

export interface RecommendationTimeline {
  suggestedStart: Date;
  suggestedEnd: Date;
  criticalPath: boolean;
  dependencies: TimelineDependency[];
  milestones: TimelineMilestone[];
}

export interface TimelineDependency {
  taskId: string;
  type: DependencyType;
  buffer: number; // days
  reason: string;
}

export interface TimelineMilestone {
  name: string;
  date: Date;
  relevance: number; // 0-1
}

export interface RecommendationMetadata {
  generatedAt: Date;
  algorithm: string;
  version: string;
  modelConfidence: number; // 0-1
  dataSource: string;
  cacheHit: boolean;
  processingTime: number; // ms
}

/**
 * Recommendation Engine Configuration
 */
export interface RecommendationEngineConfig {
  models: ModelConfig[];
  algorithms: AlgorithmConfig[];
  cache: CacheConfig;
  performance: PerformanceConfig;
}

export interface ModelConfig {
  name: string;
  type: "collaborative_filtering" | "content_based" | "hybrid" | "rule_based";
  version: string;
  accuracy: number;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface AlgorithmConfig {
  name: string;
  type: "ranking" | "filtering" | "clustering" | "optimization";
  version: string;
  parameters: Record<string, any>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  maxSize: number; // entries
  strategy: "lru" | "lfu" | "fifo";
}

export interface PerformanceConfig {
  maxRecommendations: number;
  timeoutMs: number;
  parallelism: number;
  batchSize: number;
}

/**
 * Recommendation Request and Response
 */
export interface RecommendationRequest {
  context: RecommendationContext;
  strategy?: RecommendationStrategy;
  limit?: number;
  filters?: Partial<RecommendationFilters>;
  preferences?: Partial<RecommendationPreferences>;
}

export interface RecommendationResponse {
  recommendations: TaskRecommendation[];
  strategy: RecommendationStrategy;
  context: RecommendationContext;
  metadata: ResponseMetadata;
  alternatives: AlternativeRecommendation[];
  insights: RecommendationInsight[];
}

export interface ResponseMetadata {
  requestId: string;
  generatedAt: Date;
  processingTime: number; // ms
  algorithm: string;
  confidence: number; // 0-1
  cacheHit: boolean;
  sourceCount: number;
  filteredCount: number;
}

export interface AlternativeRecommendation {
  strategy: RecommendationStrategy;
  recommendations: TaskRecommendation[];
  reasoning: string;
}

export interface RecommendationInsight {
  type: InsightType;
  title: string;
  description: string;
  impact: number; // 0-100
  actionable: boolean;
  suggestions: string[];
}

export enum InsightType {
  WORKLOAD_PATTERN = "workload_pattern",
  SKILL_GAP = "skill_gap",
  DEADLINE_RISK = "deadline_risk",
  QUALITY_TREND = "quality_trend",
  COLLABORATION_OPPORTUNITY = "collaboration_opportunity",
  RESOURCE_OPTIMIZATION = "resource_optimization",
}

/**
 * Recommendation Implementation
 */
export interface Recommendation {
  id: string;
  taskId: string;
  userId: string;
  type: RecommendationType;
  priority: number;
  confidence: number;
  reasoning: string;
  accepted: boolean;
  feedback?: RecommendationFeedback;
  createdAt: Date;
  respondedAt?: Date;
}
