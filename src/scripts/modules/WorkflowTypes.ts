/**
 * Workflow Orchestration Types
 *
 * TypeScript interfaces and types for workflow definitions, execution, and management
 * in the OpenAI Image Specialist Agent.
 */

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum StepType {
  GENERATE_IMAGE = 'generate_image',
  EDIT_IMAGE = 'edit_image',
  ANALYZE_IMAGE = 'analyze_image',
  CONDITIONAL = 'conditional',
  PARALLEL = 'parallel',
  CUSTOM = 'custom',
}

export interface WorkflowMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description?: string;
  config: Record<string, any>;
  dependencies: string[]; // IDs of steps this depends on
  conditions?: WorkflowCondition[];
  timeout?: number; // in milliseconds
  retryCount?: number;
  retryDelay?: number;
}

export interface WorkflowCondition {
  type: 'if' | 'switch' | 'expression';
  expression: string; // Expression to evaluate
  value?: any; // For switch conditions
  branches: {
    [key: string]: string[]; // condition value -> step IDs to execute
  };
  defaultBranch?: string[]; // step IDs for default case
  operator?: 'and' | 'or'; // For combining multiple conditions
  conditions?: WorkflowCondition[]; // For nested conditions
}

export interface BranchResult {
  branch: string;
  stepsToExecute: string[];
  conditionResult: any;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  steps: WorkflowStep[];
  metadata: WorkflowMetadata;
  config: {
    maxConcurrency?: number;
    timeout?: number;
    allowParallel?: boolean;
    persistState?: boolean;
  };
}

export interface StepExecutionResult {
  stepId: string;
  status: StepStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionState {
  workflowId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  currentStep?: string;
  stepResults: Map<string, StepExecutionResult>;
  progress: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    percentage: number;
  };
  metadata: Record<string, any>;
}

export interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  startedAt: Date;
  completedAt: Date;
  duration: number;
  stepResults: StepExecutionResult[];
  aggregatedResult?: any;
  error?: string;
  metadata: Record<string, any>;
}

export interface WorkflowExecutionOptions {
  resumeFromStep?: string;
  maxConcurrency?: number;
  timeout?: number;
  onProgress?: (progress: WorkflowExecutionState['progress']) => void;
  onStepComplete?: (stepResult: StepExecutionResult) => void;
  onError?: (error: Error, stepId?: string) => void;
}

export interface WorkflowPersistenceData {
  definition: WorkflowDefinition;
  state: WorkflowExecutionState;
  lastSaved: Date;
  version: string;
}
