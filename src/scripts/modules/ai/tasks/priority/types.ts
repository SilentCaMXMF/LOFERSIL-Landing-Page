/**
 * Priority Scorer Types
 * Defines interfaces for task priority scoring and scheduling
 */

import type { TaskInfo } from "../../../TaskManager";
import type { TaskAnalysis } from "../analysis/types";

/**
 * Priority Scoring Context
 */
export interface PriorityContext {
  user: UserPriorityContext;
  project: ProjectPriorityContext;
  team: TeamPriorityContext;
  business: BusinessPriorityContext;
  time: TimePriorityContext;
}

export interface UserPriorityContext {
  id: string;
  role: string;
  preferences: UserPriorityPreferences;
  workload: UserWorkloadPriority;
  skills: UserSkillPriority;
  performance: UserPerformancePriority;
}

export interface UserPriorityPreferences {
  preferredTaskTypes: string[];
  avoidedTaskTypes: string[];
  workHours: WorkHourPreference;
  collaborationLevel: "solo" | "pair" | "team";
  complexityPreference: "simple" | "moderate" | "complex";
  deadlineSensitivity: "low" | "medium" | "high";
}

export interface WorkHourPreference {
  preferredStart: string;
  preferredEnd: string;
  breakDuration: number; // minutes
  peakProductivityHours: number[];
  lowProductivityHours: number[];
}

export interface UserWorkloadPriority {
  currentTasks: number;
  availableHours: number;
  utilizationRate: number; // 0-1
  overCapacity: boolean;
  stressLevel: number; // 0-10
}

export interface UserSkillPriority {
  expertSkills: string[];
  learningSkills: string[];
  preferredSkills: string[];
  skillGrowthTargets: string[];
}

export interface UserPerformancePriority {
  averageCompletionTime: number;
  qualityScore: number; // 0-100
  onTimeDeliveryRate: number; // 0-1
  successRate: number; // 0-1
  recentPerformance: number; // 0-100
}

export interface ProjectPriorityContext {
  phase: ProjectPhase;
  goals: ProjectGoals;
  constraints: ProjectConstraints;
  stakeholders: ProjectStakeholders;
  timeline: ProjectTimeline;
}

export enum ProjectPhase {
  PLANNING = "planning",
  DEVELOPMENT = "development",
  TESTING = "testing",
  DEPLOYMENT = "deployment",
  MAINTENANCE = "maintenance",
}

export interface ProjectGoals {
  primary: string;
  secondary: string[];
  successMetrics: ProjectSuccessMetric[];
}

export interface ProjectSuccessMetric {
  name: string;
  type: "quality" | "performance" | "timeline" | "budget";
  weight: number; // 0-1
  current: number;
  target: number;
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
  critical: boolean;
}

export interface TimeConstraint {
  startDate: Date;
  endDate: Date;
  criticalPath: string[];
  milestones: ProjectMilestone[];
  bufferDays: number;
  slackTime: number; // days
}

export interface ProjectMilestone {
  id: string;
  name: string;
  date: Date;
  importance: "low" | "medium" | "high" | "critical";
  deliverables: string[];
  dependencies: string[];
}

export interface QualityConstraint {
  minimumQuality: number; // 0-100
  testCoverage: number; // 0-100
  performanceStandards: PerformanceStandard[];
  securityRequirements: string[];
}

export interface PerformanceStandard {
  metric: string;
  threshold: number;
  unit: string;
  critical: boolean;
}

export interface ProjectStakeholders {
  primary: Stakeholder[];
  secondary: Stakeholder[];
  influence: Record<string, number>; // stakeholder ID to influence level (1-10)
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: number; // 1-10
  interest: number; // 1-10
  requirements: string[];
  communicationStyle: "formal" | "informal" | "technical";
}

export interface ProjectTimeline {
  totalDuration: number; // days
  elapsedDuration: number; // days
  remainingDuration: number; // days
  criticalPathDuration: number; // days
  slackAvailable: boolean;
  riskOfDelay: number; // 0-1
}

export interface TeamPriorityContext {
  size: number;
  skills: TeamSkillPriority;
  workload: TeamWorkloadPriority;
  collaboration: TeamCollaborationPriority;
  capacity: TeamCapacityPriority;
}

export interface TeamSkillPriority {
  availableSkills: string[];
  skillGaps: string[];
  expertiseDistribution: Record<string, number>; // skill to expert count
  learningNeeds: string[];
}

export interface TeamWorkloadPriority {
  totalWorkload: number;
  averageWorkload: number;
  workloadDistribution: Record<string, number>; // user ID to workload
  overloadedMembers: string[];
  availableCapacity: number;
}

export interface TeamCollaborationPriority {
  communicationEfficiency: number; // 0-10
  knowledgeSharing: number; // 0-10
  conflictResolution: number; // 0-10
  mentoringCulture: number; // 0-10
}

export interface TeamCapacityPriority {
  totalCapacity: number; // hours per week
  availableCapacity: number; // hours per week
  utilizationRate: number; // 0-1
  flexibility: number; // 0-10
}

export interface BusinessPriorityContext {
  objectives: BusinessObjective[];
  valueDrivers: ValueDriver[];
  marketFactors: MarketFactor[];
  competitiveFactors: CompetitiveFactor[];
}

export interface BusinessObjective {
  id: string;
  name: string;
  type:
    | "revenue"
    | "cost_reduction"
    | "market_share"
    | "customer_satisfaction"
    | "innovation";
  priority: number; // 1-10
  measurable: boolean;
  target: number;
  current: number;
}

export interface ValueDriver {
  name: string;
  impact: number; // 0-100
  timeline: "short_term" | "medium_term" | "long_term";
  stakeholders: string[];
  metrics: string[];
}

export interface MarketFactor {
  type:
    | "trend"
    | "competition"
    | "regulation"
    | "technology"
    | "customer_demand";
  description: string;
  impact: number; // -100 to 100
  urgency: number; // 0-10
  timeHorizon: string; // days
}

export interface CompetitiveFactor {
  competitor: string;
  strength: string;
  weakness: string;
  threat: number; // 0-100
  opportunity: number; // 0-100
}

export interface TimePriorityContext {
  currentTime: Date;
  businessHours: BusinessHours;
  seasonality: SeasonalityFactor;
  deadlines: DeadlinePriority[];
  opportunities: TimeOpportunity[];
}

export interface BusinessHours {
  timezone: string;
  workingDays: number[]; // 0-6 where 0 is Sunday
  workingHours: { start: string; end: string };
  holidays: Date[];
  peakProductivity: TimeWindow[];
}

export interface TimeWindow {
  start: string; // HH:MM
  end: string; // HH:MM
  productivity: number; // 0-10
}

export interface SeasonalityFactor {
  quarter: number;
  month: number;
  season: string;
  impact: number; // -100 to 100
  factors: string[];
}

export interface DeadlinePriority {
  taskId: string;
  deadline: Date;
  importance: "low" | "medium" | "high" | "critical";
  flexibility: number; // 0-10, how much can it be moved
  consequences: string[];
}

export interface TimeOpportunity {
  type:
    | "available_time"
    | "resource_availability"
    | "market_timing"
    | "collaboration_window";
  description: string;
  timeWindow: TimeWindow;
  value: number; // 0-100
}

/**
 * Priority Score Result
 */
export interface PriorityScore {
  taskId: string;
  overallScore: number; // 0-100
  componentScores: ComponentScores;
  factors: PriorityFactor[];
  confidence: number; // 0-1
  reasoning: string;
  metadata: PriorityMetadata;
}

export interface ComponentScores {
  userFit: number; // 0-100
  projectAlignment: number; // 0-100
  businessValue: number; // 0-100
  teamContribution: number; // 0-100
  timeOptimality: number; // 0-100
}

export interface PriorityFactor {
  name: string;
  weight: number; // 0-1
  score: number; // 0-100
  contribution: number; // 0-1
  reasoning: string;
  source: string;
}

export interface PriorityMetadata {
  calculatedAt: Date;
  algorithm: string;
  version: string;
  dataPoints: number;
  processingTime: number; // ms
  confidenceFactors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  factor: string;
  confidence: number; // 0-1
  reason: string;
}

/**
 * Priority Configuration
 */
export interface PriorityConfig {
  weights: PriorityWeights;
  factors: PriorityFactors;
  thresholds: PriorityThresholds;
  business: BusinessRules;
}

export interface PriorityWeights {
  userFit: number; // 0-1
  projectAlignment: number; // 0-1
  businessValue: number; // 0-1
  teamContribution: number; // 0-1
  timeOptimality: number; // 0-1
  custom: Record<string, number>;
}

export interface PriorityFactors {
  user: UserFactors;
  project: ProjectFactors;
  business: BusinessFactors;
  time: TimeFactors;
}

export interface UserFactors {
  skillMatch: number; // 0-1
  workloadCapacity: number; // 0-1
  preferences: number; // 0-1
  performance: number; // 0-1
  availability: number; // 0-1
}

export interface ProjectFactors {
  goalAlignment: number; // 0-1
  phaseRelevance: number; // 0-1
  stakeholderImpact: number; // 0-1
  criticalPath: number; // 0-1
  dependencyImpact: number; // 0-1
}

export interface BusinessFactors {
  valueCreation: number; // 0-1
  marketTiming: number; // 0-1
  competitiveAdvantage: number; // 0-1
  revenueImpact: number; // 0-1
  costEfficiency: number; // 0-1
}

export interface TimeFactors {
  deadlinePressure: number; // 0-1
  resourceAvailability: number; // 0-1
  businessHoursAlignment: number; // 0-1
  seasonality: number; // 0-1
  opportunityWindow: number; // 0-1
}

export interface PriorityThresholds {
  high: number; // Score above this is high priority
  medium: number; // Score above this is medium priority
  low: number; // Score above this is low priority
  critical: number; // Score above this is critical priority
}

export interface BusinessRules {
  rules: BusinessRule[];
  conditions: BusinessCondition[];
  actions: BusinessAction[];
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  priority: number; // 1-10
  enabled: boolean;
  conditions: string[]; // Condition IDs
  actions: string[]; // Action IDs
}

export interface BusinessCondition {
  id: string;
  name: string;
  type:
    | "task_property"
    | "user_property"
    | "project_property"
    | "time_property";
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "not_contains";
  value: any;
  description: string;
}

export interface BusinessAction {
  id: string;
  name: string;
  type:
    | "adjust_weight"
    | "add_bonus"
    | "override_priority"
    | "exclude"
    | "require_review";
  parameters: Record<string, any>;
  description: string;
}

/**
 * Scheduling Types
 */
export interface Schedule {
  id: string;
  tasks: ScheduledTask[];
  timeline: ScheduleTimeline;
  resources: ScheduleResource[];
  constraints: ScheduleConstraint[];
  metrics: ScheduleMetrics;
}

export interface ScheduledTask {
  task: TaskInfo;
  assignedTo: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  estimatedHours: number;
  priority: number;
  dependencies: string[];
  resources: string[];
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
}

export interface ScheduleTimeline {
  startDate: Date;
  endDate: Date;
  totalDuration: number; // hours
  workingDays: number[];
  holidays: Date[];
  bufferTime: number; // hours
}

export interface ScheduleResource {
  id: string;
  type: "human" | "technical" | "infrastructure";
  name: string;
  capacity: number; // hours
  allocated: number; // hours
  availability: ResourceAvailability[];
}

export interface ResourceAvailability {
  date: Date;
  availableHours: number;
  allocatedHours: number;
  utilizationRate: number; // 0-1
}

export interface ScheduleConstraint {
  id: string;
  type: "hard" | "soft";
  name: string;
  description: string;
  violationPenalty: number; // 0-100
  parameters: Record<string, any>;
}

export interface ScheduleMetrics {
  utilization: number; // 0-100
  efficiency: number; // 0-100
  completionProbability: number; // 0-1
  riskScore: number; // 0-100
  cost: number;
}

/**
 * Priority Scoring Request/Response
 */
export interface PriorityScoringRequest {
  tasks: TaskInfo[];
  context: PriorityContext;
  config?: Partial<PriorityConfig>;
  filters?: PriorityFilters;
}

export interface PriorityFilters {
  taskTypes: string[];
  priorities: string[];
  assignees: string[];
  dateRange: DateRange;
  effortRange: EffortRange;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface EffortRange {
  min: number;
  max: number;
  unit: "hours" | "days" | "story_points";
}

export interface PriorityScoringResponse {
  scores: PriorityScore[];
  ranking: TaskRanking[];
  insights: PriorityInsight[];
  recommendations: PriorityRecommendation[];
  metadata: ScoringMetadata;
}

export interface TaskRanking {
  rank: number;
  taskId: string;
  score: number;
  previousRank?: number;
  rankChange: number;
  confidence: number;
}

export interface PriorityInsight {
  type: InsightType;
  title: string;
  description: string;
  impact: number; // 0-100
  actionable: boolean;
  suggestions: string[];
  affectedTasks: string[];
}

export enum InsightType {
  WORKLOAD_IMBALANCE = "workload_imbalance",
  SKILL_MISMATCH = "skill_mismatch",
  DEADLINE_CONFLICT = "deadline_conflict",
  RESOURCE_CONTENTION = "resource_contention",
  PRIORITY_INVERSION = "priority_inversion",
  BOTTLENECK = "bottleneck",
}

export interface PriorityRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  tasks: string[];
  reasoning: string;
  impact: number; // 0-100
  effort: number; // hours
  priority: "low" | "medium" | "high" | "critical";
}

export enum RecommendationType {
  WORKLOAD_REBALANCE = "workload_rebalance",
  SKILL_ALLOCATION = "skill_allocation",
  DEADLINE_ADJUSTMENT = "deadline_adjustment",
  RESOURCE_REALLOCATION = "resource_reallocation",
  PRIORITY_REVIEW = "priority_review",
}

export interface ScoringMetadata {
  requestId: string;
  calculatedAt: Date;
  processingTime: number; // ms
  algorithm: string;
  version: string;
  taskCount: number;
  ruleApplications: RuleApplication[];
}

export interface RuleApplication {
  ruleId: string;
  ruleName: string;
  conditionsMet: string[];
  actionsApplied: string[];
  impact: number; // 0-100
}

/**
 * Integration with Task Analysis
 */
export interface EnhancedPriorityScore extends PriorityScore {
  taskAnalysis: TaskAnalysis;
  predictedCompletionTime: Date;
  riskAdjustedScore: number;
  confidenceAdjustedScore: number;
  teamImpactScore: number;
}
