/**
 * Workflow Module Types
 *
 * Core type definitions for the workflow orchestration system
 */

export enum WorkflowState {
  INITIALIZING = "initializing",
  ANALYZING_ISSUE = "analyzing_issue",
  CHECKING_FEASIBILITY = "checking_feasibility",
  GENERATING_SOLUTION = "generating_solution",
  REVIEWING_CODE = "reviewing_code",
  CREATING_PR = "creating_pr",
  PR_COMPLETE = "pr_complete",
  REQUIRES_HUMAN_REVIEW = "requires_human_review",
  FAILED = "failed",
  CANCELLED = "cancelled",
  RETRYING = "retrying",
  WAITING_APPROVAL = "waiting_approval",
}

export enum TaskType {
  ISSUE_ANALYSIS = "issue_analysis",
  AUTONOMOUS_RESOLUTION = "autonomous_resolution",
  CODE_REVIEW = "code_review",
  PR_GENERATION = "pr_generation",
  NOTIFICATION = "notification",
  CLEANUP = "cleanup",
}

export interface Workflow {
  id: string;
  name: string;
  version: string;
  description: string;
  tasks: Task[];
  dependencies: Dependency[];
  triggers: Trigger[];
  config: WorkflowConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  handler: TaskHandler;
  dependencies: string[];
  retryPolicy: RetryPolicy;
  timeout: number;
  metadata: Record<string, any>;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface Dependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: DependencyType;
  condition?: string;
}

export enum DependencyType {
  FINISH_TO_START = "finish_to_start",
  START_TO_START = "start_to_start",
  FINISH_TO_FINISH = "finish_to_finish",
  START_TO_FINISH = "start_to_finish",
}

export interface Trigger {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
  enabled: boolean;
}

export enum TriggerType {
  MANUAL = "manual",
  SCHEDULED = "scheduled",
  EVENT_DRIVEN = "event_driven",
  API_CALL = "api_call",
}

export interface WorkflowConfig {
  maxWorkflowTime: number;
  enableMetrics: boolean;
  retryAttempts: number;
  retryDelay: number;
  humanInterventionThreshold: number;
  enableNotifications: boolean;
  enableCaching: boolean;
  parallelExecution: boolean;
  timeoutHandling: TimeoutHandling;
}

export enum TimeoutHandling {
  FAIL = "fail",
  RETRY = "retry",
  ESCALATE = "escalate",
  CONTINUE = "continue",
}

export interface TaskHandler {
  execute(context: TaskContext): Promise<TaskResult>;
  validate?(context: TaskContext): Promise<boolean>;
  rollback?(context: TaskContext): Promise<void>;
}

export interface TaskContext {
  workflowId: string;
  taskId: string;
  input: any;
  config: WorkflowConfig;
  metadata: Record<string, any>;
  retryCount: number;
  startTime: Date;
}

export interface TaskResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
  executionTime: number;
  retryable: boolean;
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  RETRYING = "retrying",
}

export interface WorkflowContext {
  workflowId: string;
  input: any;
  config: WorkflowConfig;
  state: Record<string, any>;
  history: WorkflowHistoryEntry[];
  startTime: Date;
  endTime?: Date;
  metadata: Record<string, any>;
}

export interface WorkflowHistoryEntry {
  timestamp: Date;
  taskId: string;
  previousState: WorkflowState;
  newState: WorkflowState;
  reason: string;
  metadata?: Record<string, any>;
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  finalState: WorkflowState;
  outputs: Record<string, any>;
  requiresHumanReview: boolean;
  error?: string;
  executionTime: number;
  retryCount: number;
  errors?: string[];
  metrics: WorkflowExecutionMetrics;
  completedTasks: string[];
  failedTasks: string[];
}

export interface WorkflowExecutionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskExecutionTime: number;
  totalExecutionTime: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  successRate: number;
  averageExecutionTime: number;
  totalProcessingTime: number;
  averageComplexity: number;
  errorCount: number;
  humanInterventionCount: number;
  failureReasons: Record<string, number>;
  componentExecutionTimes: Record<string, number>;
  concurrentWorkflows: number;
  queueLength: number;
  throughput: number;
}

export interface WorkflowAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  workflowId: string;
  taskId?: string;
  timestamp: Date;
  actions: AlertAction[];
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export enum AlertType {
  WORKFLOW_FAILURE = "workflow_failure",
  TASK_FAILURE = "task_failure",
  TIMEOUT = "timeout",
  PERFORMANCE_ISSUE = "performance_issue",
  RESOURCE_EXHAUSTION = "resource_exhaustion",
  SECURITY_ISSUE = "security_issue",
}

export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface AlertAction {
  id: string;
  type: AlertActionType;
  label: string;
  config: Record<string, any>;
}

export enum AlertActionType {
  RETRY = "retry",
  CANCEL = "cancel",
  ESCALATE = "escalate",
  IGNORE = "ignore",
  CUSTOM = "custom",
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  enabled: boolean;
  nextRun: Date;
  lastRun?: Date;
  timezone: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">;
  parameters: TemplateParameter[];
  tags: string[];
  version: string;
  author: string;
}

export interface TemplateParameter {
  name: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: ParameterValidation;
}

export enum ParameterType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  ARRAY = "array",
  OBJECT = "object",
  JSON = "json",
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: any[];
  customValidation?: string;
}

export interface DecisionPoint {
  id: string;
  name: string;
  condition: string;
  options: DecisionOption[];
  aiRecommendation?: AIRecommendation;
  fallback: FallbackOption;
  timeout: number;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  taskIds: string[];
  conditions?: string[];
  probability?: number;
}

export interface AIRecommendation {
  optionId: string;
  confidence: number;
  reasoning: string;
  data: any;
}

export interface FallbackOption {
  optionId: string;
  reason: string;
  automatic: boolean;
}

export interface OptimizationSuggestion {
  type: OptimizationType;
  description: string;
  impact: OptimizationImpact;
  effort: OptimizationEffort;
  recommendation: string;
}

export enum OptimizationType {
  TASK_REORDERING = "task_reordering",
  PARALLEL_EXECUTION = "parallel_execution",
  CACHING = "caching",
  TIMEOUT_ADJUSTMENT = "timeout_adjustment",
  RETRY_POLICY = "retry_policy",
  RESOURCE_ALLOCATION = "resource_allocation",
}

export interface OptimizationImpact {
  executionTimeImprovement: number;
  resourceUsageImprovement: number;
  successRateImprovement: number;
}

export enum OptimizationEffort {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface ResourceAllocation {
  taskId: string;
  cpu: number;
  memory: number;
  priority: ResourcePriority;
  constraints: ResourceConstraint[];
}

export enum ResourcePriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ResourceConstraint {
  type: ConstraintType;
  value: number;
  unit: string;
}

export enum ConstraintType {
  MAX_CPU = "max_cpu",
  MAX_MEMORY = "max_memory",
  MAX_EXECUTION_TIME = "max_execution_time",
  MIN_SUCCESS_RATE = "min_success_rate",
}
