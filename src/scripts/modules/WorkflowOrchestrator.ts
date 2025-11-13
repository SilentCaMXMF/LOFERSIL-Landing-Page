/**
 * WorkflowOrchestrator - Central Coordinator for GitHub Issues Reviewer
 *
 * Orchestrates the complete workflow from issue intake to PR creation.
 * Manages state transitions, error handling, and progress tracking.
 */

import type { ErrorHandler } from './ErrorHandler';
import { envLoader } from './EnvironmentLoader';
import { IssueAnalyzer, type IssueAnalysis } from './IssueAnalyzer';
import { WorktreeManager, type WorktreeInfo } from './WorktreeManager';
import { SWEResolver, type CodeGenerationResult } from './SWEResolver';
import { CodeReviewer, type CodeReviewResult } from './CodeReviewer';

/**
 * Workflow states
 */
export enum WorkflowState {
  INITIALIZING = 'initializing',
  ANALYZING_ISSUE = 'analyzing_issue',
  CREATING_WORKTREE = 'creating_worktree',
  GENERATING_SOLUTION = 'generating_solution',
  REVIEWING_CODE = 'reviewing_code',
  CREATING_PR = 'creating_pr',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Workflow step result
 */
export interface WorkflowStepResult {
  step: WorkflowState;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  duration: number;
}

/**
 * Workflow configuration
 */
export interface WorkflowOrchestratorConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableMetrics: boolean;
  autoCleanup: boolean;
  githubToken: string;
  repository: string;
  openaiApiKey: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  issueId: number;
  success: boolean;
  finalState: WorkflowState;
  steps: WorkflowStepResult[];
  issueAnalysis?: IssueAnalysis;
  codeResult?: CodeGenerationResult;
  reviewResult?: CodeReviewResult;
  prUrl?: string;
  totalDuration: number;
  error?: string;
}

/**
 * WorkflowOrchestrator - Coordinates the entire GitHub issues resolution pipeline
 */
export class WorkflowOrchestrator {
  private config: WorkflowOrchestratorConfig;
  private errorHandler?: ErrorHandler;

  // Component instances
  private issueAnalyzer: IssueAnalyzer;
  private worktreeManager: WorktreeManager;
  private sweResolver: SWEResolver;
  private codeReviewer: CodeReviewer;

  // Workflow state
  private currentState: WorkflowState = WorkflowState.INITIALIZING;
  private workflowHistory: WorkflowStepResult[] = [];
  private startTime: Date = new Date();

  constructor(config: Partial<WorkflowOrchestratorConfig> = {}, errorHandler?: ErrorHandler) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      timeout: config.timeout || 1800000, // 30 minutes
      enableMetrics: config.enableMetrics || true,
      autoCleanup: config.autoCleanup || true,
      githubToken: config.githubToken || envLoader.getRequired('GITHUB_TOKEN'),
      repository: config.repository || envLoader.getRequired('GITHUB_REPOSITORY'),
      openaiApiKey: config.openaiApiKey || envLoader.getRequired('OPENAI_API_KEY'),
      ...config,
    };
    this.errorHandler = errorHandler;

    // Initialize components
    this.issueAnalyzer = new IssueAnalyzer(
      {
        githubToken: this.config.githubToken,
        repository: this.config.repository,
      },
      errorHandler
    );

    this.worktreeManager = new WorktreeManager({
      autoCleanup: this.config.autoCleanup,
    });

    this.sweResolver = new SWEResolver(
      {
        openaiApiKey: this.config.openaiApiKey,
        worktreePath: '',
      },
      errorHandler
    );

    this.codeReviewer = new CodeReviewer(
      {
        openaiApiKey: this.config.openaiApiKey,
      },
      errorHandler
    );
  }

  /**
   * Execute the complete workflow for a GitHub issue
   */
  async executeWorkflow(issueNumber: number): Promise<WorkflowResult> {
    this.startTime = new Date();
    this.workflowHistory = [];
    this.currentState = WorkflowState.INITIALIZING;

    console.log(`🚀 Starting workflow execution for issue #${issueNumber}`);

    try {
      // Step 1: Analyze the issue
      const issueAnalysis = await this.executeStep(WorkflowState.ANALYZING_ISSUE, () =>
        this.issueAnalyzer.analyzeIssue(issueNumber)
      );

      if (!issueAnalysis.success || !issueAnalysis.data) {
        throw new Error('Issue analysis failed');
      }

      // Check if issue is suitable for autonomous resolution
      if (!this.issueAnalyzer.isSuitableForAutonomousResolution(issueAnalysis.data)) {
        console.log(`⏭️ Issue #${issueNumber} not suitable for autonomous resolution`);
        return this.createResult(
          issueNumber,
          false,
          WorkflowState.COMPLETED,
          'Issue not suitable for autonomous resolution'
        );
      }

      // Step 2: Create worktree
      const worktreeInfo = await this.executeStep(WorkflowState.CREATING_WORKTREE, () =>
        this.worktreeManager.createWorktree(issueNumber, issueAnalysis.data.title)
      );

      if (!worktreeInfo.success || !worktreeInfo.data) {
        throw new Error('Worktree creation failed');
      }

      // Step 3: Generate solution
      const codeResult = await this.executeStep(WorkflowState.GENERATING_SOLUTION, () =>
        this.sweResolver.resolveIssue(issueAnalysis.data, worktreeInfo.data)
      );

      if (!codeResult.success || !codeResult.data) {
        throw new Error('Solution generation failed');
      }

      // Step 4: Review code
      const reviewResult = await this.executeStep(WorkflowState.REVIEWING_CODE, () =>
        this.codeReviewer.reviewCode(issueAnalysis.data, codeResult.data, worktreeInfo.data.path)
      );

      if (!reviewResult.success || !reviewResult.data) {
        throw new Error('Code review failed');
      }

      // Check if code review requires changes
      if (
        reviewResult.data.overallAssessment === 'reject' ||
        (reviewResult.data.overallAssessment === 'requires-changes' &&
          reviewResult.data.requiresHumanReview)
      ) {
        console.log(
          `❌ Code review failed for issue #${issueNumber}: ${reviewResult.data.overallAssessment}`
        );
        return this.createResult(issueNumber, false, WorkflowState.FAILED, 'Code review failed', {
          issueAnalysis: issueAnalysis.data,
          codeResult: codeResult.data,
          reviewResult: reviewResult.data,
        });
      }

      // Step 5: Create PR (placeholder for now)
      const prResult = await this.executeStep(WorkflowState.CREATING_PR, () =>
        this.createPullRequest(
          issueAnalysis.data,
          codeResult.data,
          reviewResult.data,
          worktreeInfo.data
        )
      );

      // Complete the workflow
      this.currentState = WorkflowState.COMPLETED;
      const totalDuration = Date.now() - this.startTime.getTime();

      console.log(`✅ Workflow completed successfully for issue #${issueNumber}`);

      return {
        issueId: issueNumber,
        success: true,
        finalState: WorkflowState.COMPLETED,
        steps: this.workflowHistory,
        issueAnalysis: issueAnalysis.data,
        codeResult: codeResult.data,
        reviewResult: reviewResult.data,
        prUrl: prResult.success ? prResult.data : undefined,
        totalDuration,
      };
    } catch (error) {
      console.error(`❌ Workflow failed for issue #${issueNumber}:`, error);
      this.errorHandler?.handleError(error as Error, 'WorkflowOrchestrator.executeWorkflow');

      this.currentState = WorkflowState.FAILED;
      const totalDuration = Date.now() - this.startTime.getTime();

      return this.createResult(issueNumber, false, WorkflowState.FAILED, (error as Error).message);
    } finally {
      // Cleanup if enabled
      if (this.config.autoCleanup) {
        await this.cleanup(issueNumber);
      }
    }
  }

  /**
   * Execute a single workflow step with retry logic
   */
  private async executeStep<T>(
    step: WorkflowState,
    operation: () => Promise<T>,
    retryCount: number = 0
  ): Promise<WorkflowStepResult & { data?: T }> {
    const stepStartTime = Date.now();
    this.currentState = step;

    console.log(`📍 Executing step: ${step}`);

    try {
      const result = await this.withTimeout(operation(), this.config.timeout);

      const stepResult: WorkflowStepResult & { data?: T } = {
        step,
        success: true,
        data: result,
        timestamp: new Date(),
        duration: Date.now() - stepStartTime,
      };

      this.workflowHistory.push(stepResult);
      console.log(`✅ Step ${step} completed successfully (${stepResult.duration}ms)`);

      return stepResult;
    } catch (error) {
      const stepResult: WorkflowStepResult = {
        step,
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        duration: Date.now() - stepStartTime,
      };

      this.workflowHistory.push(stepResult);
      console.error(`❌ Step ${step} failed: ${(error as Error).message}`);

      // Retry logic
      if (retryCount < this.config.maxRetries && this.isRetryableError(error as Error)) {
        console.log(
          `🔄 Retrying step ${step} (attempt ${retryCount + 1}/${this.config.maxRetries})`
        );
        await this.delay(this.config.retryDelay);
        return this.executeStep(step, operation, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Create a pull request (placeholder implementation)
   */
  private async createPullRequest(
    issueAnalysis: IssueAnalysis,
    codeResult: CodeGenerationResult,
    reviewResult: CodeReviewResult,
    worktreeInfo: WorktreeInfo
  ): Promise<string> {
    // This would integrate with GitHub API to create a PR
    // For now, return a placeholder URL
    console.log('Creating pull request...');

    // Simulate PR creation
    await this.delay(1000);

    return `https://github.com/${this.config.repository}/pull/${issueAnalysis.issueId}`;
  }

  /**
   * Clean up resources
   */
  private async cleanup(issueId: number): Promise<void> {
    try {
      console.log(`🧹 Cleaning up resources for issue #${issueId}`);
      this.worktreeManager.cleanupWorktree(issueId);
    } catch (error) {
      console.warn(`Cleanup failed for issue #${issueId}:`, error);
    }
  }

  /**
   * Create workflow result
   */
  private createResult(
    issueId: number,
    success: boolean,
    finalState: WorkflowState,
    error?: string,
    additionalData?: any
  ): WorkflowResult {
    const totalDuration = Date.now() - this.startTime.getTime();

    return {
      issueId,
      success,
      finalState,
      steps: this.workflowHistory,
      totalDuration,
      error,
      ...additionalData,
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      'network',
      'timeout',
      'rate limit',
      'temporary',
      'service unavailable',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Execute operation with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current workflow state
   */
  getCurrentState(): WorkflowState {
    return this.currentState;
  }

  /**
   * Get workflow history
   */
  getWorkflowHistory(): WorkflowStepResult[] {
    return [...this.workflowHistory];
  }

  /**
   * Get workflow metrics
   */
  getMetrics(): {
    totalWorkflows: number;
    successRate: number;
    averageDuration: number;
    stepMetrics: Record<
      WorkflowState,
      { count: number; averageDuration: number; successRate: number }
    >;
  } {
    // This would track metrics across multiple workflow executions
    // For now, return basic metrics
    const completedWorkflows = this.workflowHistory.filter(
      step => step.step === WorkflowState.COMPLETED
    );
    const totalWorkflows = 1; // This instance
    const successRate = completedWorkflows.length / totalWorkflows;
    const averageDuration =
      this.workflowHistory.length > 0
        ? this.workflowHistory.reduce((sum, step) => sum + step.duration, 0) /
          this.workflowHistory.length
        : 0;

    const stepMetrics: Record<
      WorkflowState,
      { count: number; averageDuration: number; successRate: number }
    > = {} as any;

    // Calculate per-step metrics
    Object.values(WorkflowState).forEach(state => {
      const stateSteps = this.workflowHistory.filter(step => step.step === state);
      const successfulSteps = stateSteps.filter(step => step.success);

      stepMetrics[state] = {
        count: stateSteps.length,
        averageDuration:
          stateSteps.length > 0
            ? stateSteps.reduce((sum, step) => sum + step.duration, 0) / stateSteps.length
            : 0,
        successRate: stateSteps.length > 0 ? successfulSteps.length / stateSteps.length : 0,
      };
    });

    return {
      totalWorkflows,
      successRate,
      averageDuration,
      stepMetrics,
    };
  }

  /**
   * Cancel current workflow
   */
  cancelWorkflow(): void {
    console.log('🛑 Cancelling workflow...');
    this.currentState = WorkflowState.CANCELLED;
  }

  /**
   * Check if workflow is currently running
   */
  isRunning(): boolean {
    return ![
      WorkflowState.COMPLETED,
      WorkflowState.FAILED,
      WorkflowState.CANCELLED,
      WorkflowState.INITIALIZING,
    ].includes(this.currentState);
  }
}
