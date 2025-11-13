// Workflow-related TypeScript interfaces and types for workflow definitions

/**
 * Enum representing the possible states of a workflow.
 */
export enum WorkflowState {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Paused = 'paused',
}

/**
 * Interface for defining conditions used in branching logic.
 * Supports basic if-then-else structures.
 */
export interface Condition {
  type: 'if';
  expression: string; // A string expression to evaluate (e.g., "input.value > 10")
  then: Step[]; // Steps to execute if condition is true
  else?: Step[]; // Optional steps to execute if condition is false
}

/**
 * Interface for a single step in a workflow.
 */
export interface Step {
  id: string;
  type: string; // e.g., 'task', 'decision', 'action'
  config: Record<string, unknown>; // Configuration specific to the step type
  dependencies: string[]; // Array of step IDs that this step depends on
  conditions?: Condition[]; // Optional conditions for branching
}

/**
 * Interface for the result of executing a step.
 */
export interface StepResult {
  stepId: string;
  output: unknown; // The output data from the step execution
  status: WorkflowState; // The state after execution
  error?: string; // Optional error message if failed
  timestamp: string; // ISO timestamp of completion
}

/**
 * Interface for a workflow definition.
 */
export interface Workflow {
  id: string;
  name: string;
  steps: Step[];
  metadata: Record<string, unknown>; // Additional metadata for the workflow
}

/**
 * Interface for workflow configuration.
 */
export interface WorkflowConfig {
  maxConcurrency?: number;
  timeout?: number;
  allowParallel?: boolean;
}

/**
 * Utility type for validating workflow steps.
 */
export type ValidatedStep = Step & {
  isValid: boolean;
  errors?: string[];
};

/**
 * Utility type for workflow execution context.
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  currentStepId?: string;
  state: WorkflowState;
  results: StepResult[];
  variables: Record<string, unknown>; // Shared variables across steps
}

/**
 * Enum for step types in workflows.
 */
export enum StepType {
  GENERATE_IMAGE = 'generate_image',
  EDIT_IMAGE = 'edit_image',
  ANALYZE_IMAGE = 'analyze_image',
  CONDITIONAL = 'conditional',
  PARALLEL = 'parallel',
  CUSTOM = 'custom',
}

/**
 * Interface for workflow metadata.
 */
export interface WorkflowMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  [key: string]: unknown;
}

/**
 * Interface for workflow conditions.
 */
export interface WorkflowCondition {
  type: 'if' | 'switch' | 'expression';
  expression?: string;
  value?: unknown;
  branches: Record<string, string[]>;
  defaultBranch?: string[];
  operator?: 'and' | 'or';
}

/**
 * Interface for a workflow step.
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, unknown>;
  dependencies: string[];
  conditions?: WorkflowCondition[];
  conditionsOperator?: 'and' | 'or';
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Interface for workflow definition.
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  metadata: WorkflowMetadata;
  config: WorkflowConfig;
}

/**
 * Enum for workflow status.
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

/**
 * Enum for step status.
 */
export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Interface for step execution result.
 */
export interface StepExecutionResult {
  stepId: string;
  status: StepStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: unknown;
  error?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Interface for workflow execution state.
 */
export interface WorkflowExecutionState {
  workflowId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  stepResults: Map<string, StepExecutionResult>;
  progress: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    percentage: number;
  };
  currentStep?: string;
  metadata: Record<string, unknown>;
}

/**
 * Interface for workflow result.
 */
export interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  stepResults: StepExecutionResult[];
  aggregatedResult?: unknown;
  error?: string;
  metadata: Record<string, unknown>;
}

/**
 * Interface for workflow execution options.
 */
export interface WorkflowExecutionOptions {
  onProgress?: (progress: WorkflowExecutionState['progress']) => void;
  onStepComplete?: (result: StepExecutionResult) => void;
  onError?: (error: Error, stepId?: string) => void;
  timeout?: number;
  maxConcurrency?: number;
}

/**
 * Interface for branch result.
 */
export interface BranchResult {
  branch: string;
  stepsToExecute: string[];
  conditionResult: unknown;
}
