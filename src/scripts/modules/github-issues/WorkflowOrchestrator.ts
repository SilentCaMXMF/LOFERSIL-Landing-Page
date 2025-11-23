/**
 * Workflow Orchestrator Component
 *
 * Coordinates the complete AI-powered GitHub Issues Reviewer workflow.
 * Manages state transitions, component interactions, and error handling.
 */

import { IssueAnalyzer, GitHubIssue, IssueAnalysis } from "./IssueAnalyzer";
import { AutonomousResolver, ResolutionResult } from "./AutonomousResolver";
import { CodeReviewer, ReviewResult } from "./CodeReviewer";
import { PRGenerator, PullRequest } from "./PRGenerator";
import { KanbanManager } from "../KanbanManager";

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
}

export interface WorkflowConfig {
  issueAnalyzer: IssueAnalyzer;
  autonomousResolver: AutonomousResolver;
  codeReviewer: CodeReviewer;
  prGenerator: PRGenerator;
  kanbanManager?: KanbanManager;
  maxWorkflowTime: number;
  enableMetrics: boolean;
  retryAttempts: number;
  humanInterventionThreshold: number;
}

export interface WorkflowResult {
  success: boolean;
  issueNumber: number;
  finalState: WorkflowState;
  outputs: {
    analysis?: IssueAnalysis;
    resolution?: ResolutionResult;
    review?: ReviewResult;
    pr?: PullRequest;
  };
  requiresHumanReview: boolean;
  error?: string;
  executionTime: number;
  retryCount: number;
  errors?: string[];
  workflowId?: string;
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
}

export class WorkflowOrchestrator {
  private config: WorkflowConfig;
  private activeWorkflows: Map<number, WorkflowState> = new Map();
  private completedWorkflows: WorkflowResult[] = [];
  private metrics: WorkflowMetrics = {
    totalWorkflows: 0,
    successRate: 0,
    averageExecutionTime: 0,
    totalProcessingTime: 0,
    averageComplexity: 0,
    errorCount: 0,
    humanInterventionCount: 0,
    failureReasons: {},
    componentExecutionTimes: {
      analysis: 0,
      resolution: 0,
      review: 0,
      pr: 0,
      prCreation: 0,
    },
  };

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  /**
   * Process a GitHub issue through the complete workflow
   */
  async processIssue(
    issueNumber: number,
    title?: string,
    body?: string,
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    let currentState = WorkflowState.INITIALIZING;
    let retryCount = 0;
    const workflowId = `workflow-${issueNumber}-${Date.now()}`;

    // Default values for testing
    const issueTitle = title || `Issue #${issueNumber}`;
    const issueBody = body || `Description for issue #${issueNumber}`;

    this.activeWorkflows.set(issueNumber, currentState);
    this.metrics.totalWorkflows++;

    try {
      // Step 1: Analyze the issue
      currentState = WorkflowState.ANALYZING_ISSUE;
      this.activeWorkflows.set(issueNumber, currentState);

      // Update kanban: Move to In Progress when AI processing starts
      if (this.config.kanbanManager) {
        await this.config.kanbanManager.onProcessingStart(
          issueNumber,
          workflowId,
        );
      }

      const mockIssue: GitHubIssue = {
        number: issueNumber,
        title: issueTitle,
        body: issueBody,
        labels: [],
        user: { login: "test-user" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        state: "open",
        html_url: `https://github.com/test/repo/issues/${issueNumber}`,
      };

      const analysis = await this.config.issueAnalyzer.analyzeIssue(mockIssue);

      // Step 2: Check feasibility
      currentState = WorkflowState.CHECKING_FEASIBILITY;
      this.activeWorkflows.set(issueNumber, currentState);

      if (!analysis.feasible || analysis.complexity === "critical") {
        return this.createResult(
          false,
          WorkflowState.REQUIRES_HUMAN_REVIEW,
          { analysis },
          true,
          startTime,
          retryCount,
          "Issue requires human review",
          issueNumber,
          workflowId,
        );
      }

      // Step 3: Generate solution
      currentState = WorkflowState.GENERATING_SOLUTION;
      this.activeWorkflows.set(issueNumber, currentState);

      const resolution = await this.config.autonomousResolver.resolveIssue(
        analysis,
        {
          number: issueNumber,
          title: issueTitle,
          body: issueBody,
        },
      );

      if (!resolution.success) {
        // Update kanban: Move back to Backlog on failure
        if (this.config.kanbanManager) {
          await this.config.kanbanManager.onProcessingFailed(
            issueNumber,
            workflowId,
          );
        }

        return this.createResult(
          false,
          WorkflowState.FAILED,
          { analysis, resolution },
          false,
          startTime,
          retryCount,
          "Solution generation failed",
          issueNumber,
          workflowId,
        );
      }

      // Step 4: Review code
      currentState = WorkflowState.REVIEWING_CODE;
      this.activeWorkflows.set(issueNumber, currentState);

      const review = await this.config.codeReviewer.reviewChanges(
        resolution.solution,
        {
          number: issueNumber,
          title: issueTitle,
          body: issueBody,
        },
      );

      if (!review.approved) {
        // Update kanban: Move back to Backlog on review failure
        if (this.config.kanbanManager) {
          await this.config.kanbanManager.onProcessingFailed(
            issueNumber,
            workflowId,
          );
        }

        return this.createResult(
          false,
          WorkflowState.REQUIRES_HUMAN_REVIEW,
          { analysis, resolution, review },
          true,
          startTime,
          retryCount,
          "Code review failed",
          issueNumber,
          workflowId,
        );
      }

      // Step 5: Create PR
      currentState = WorkflowState.CREATING_PR;
      this.activeWorkflows.set(issueNumber, currentState);

      const pr = await this.config.prGenerator.createPullRequest(
        resolution,
        review,
        {
          number: issueNumber,
          title: issueTitle,
          body: issueBody,
        },
      );

      // Update kanban: Move to In Review when PR is generated
      if (this.config.kanbanManager) {
        await this.config.kanbanManager.onPRGenerated(issueNumber, workflowId);
      }

      // Step 6: Complete
      currentState = WorkflowState.PR_COMPLETE;
      this.activeWorkflows.set(issueNumber, currentState);

      // Update kanban: Move to Done when processing is complete
      if (this.config.kanbanManager) {
        await this.config.kanbanManager.onProcessingComplete(
          issueNumber,
          workflowId,
        );
      }

      return this.createResult(
        true,
        WorkflowState.PR_COMPLETE,
        { analysis, resolution, review, pr },
        false,
        startTime,
        retryCount,
        undefined,
        issueNumber,
        workflowId,
      );
    } catch (error) {
      console.error("Workflow failed:", error);

      // Update kanban: Move back to Backlog on general failure
      if (this.config.kanbanManager) {
        await this.config.kanbanManager.onProcessingFailed(
          issueNumber,
          workflowId,
        );
      }

      return this.createResult(
        false,
        WorkflowState.FAILED,
        {},
        false,
        startTime,
        retryCount,
        error instanceof Error
          ? `Workflow execution failed: ${error.message}`
          : "Workflow execution failed: Unknown error",
        issueNumber,
        workflowId,
      );
    } finally {
      this.activeWorkflows.delete(issueNumber);
    }
  }

  /**
   * Get current workflow state
   */
  getCurrentState(issueNumber: number): WorkflowState | undefined {
    return this.activeWorkflows.get(issueNumber);
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): Array<{ issueNumber: number; state: WorkflowState }> {
    return Array.from(this.activeWorkflows.entries()).map(
      ([issueNumber, state]) => ({
        issueNumber,
        state,
      }),
    );
  }

  /**
   * Get completed workflows
   */
  getCompletedWorkflows(): WorkflowResult[] {
    return [...this.completedWorkflows];
  }

  /**
   * Get workflow metrics
   */
  getGlobalMetrics(): WorkflowMetrics {
    return { ...this.metrics };
  }

  /**
   * Create workflow result
   */
  private createResult(
    success: boolean,
    finalState: WorkflowState,
    outputs: any,
    requiresHumanReview: boolean,
    startTime: number,
    retryCount: number,
    error?: string,
    issueNumber?: number,
    workflowId?: string,
  ): WorkflowResult {
    const executionTime = Date.now() - startTime;

    const result: WorkflowResult = {
      success,
      issueNumber: issueNumber || 0,
      finalState,
      outputs,
      requiresHumanReview,
      executionTime,
      retryCount,
      workflowId: workflowId || `workflow-${issueNumber}-${Date.now()}`,
      errors: error ? [error] : [],
      ...(error && { error }),
    };

    this.completedWorkflows.push(result);

    // Update metrics
    if (success) {
      const successfulWorkflows = this.completedWorkflows.filter(
        (r) => r.success,
      ).length;
      this.metrics.successRate =
        successfulWorkflows / this.completedWorkflows.length;
    }

    const totalTime = this.completedWorkflows.reduce(
      (sum, r) => sum + r.executionTime,
      0,
    );
    this.metrics.averageExecutionTime =
      totalTime / this.completedWorkflows.length;
    this.metrics.totalProcessingTime = totalTime;

    if (error) {
      this.metrics.failureReasons[error] =
        (this.metrics.failureReasons[error] || 0) + 1;
      this.metrics.errorCount++;
    }

    if (requiresHumanReview) {
      this.metrics.humanInterventionCount++;
    }

    // Update average complexity (simplified)
    const complexities = this.completedWorkflows
      .filter((r) => r.outputs.analysis?.complexity)
      .map((r) => {
        const complexity = r.outputs.analysis!.complexity;
        return complexity === "low"
          ? 1
          : complexity === "medium"
            ? 2
            : complexity === "high"
              ? 3
              : 4;
      });

    if (complexities.length > 0) {
      this.metrics.averageComplexity =
        complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    }

    return result;
  }
}
