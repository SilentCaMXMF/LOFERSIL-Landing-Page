/**
 * Enhanced Workflow Orchestrator
 *
 * Complete workflow orchestration system that coordinates between AI components,
 * manages task dependencies, handles asynchronous operations, and provides
 * intelligent decision-making for complex development workflows.
 */

import {
  WorkflowState,
  WorkflowConfig,
  WorkflowResult,
  WorkflowMetrics,
  TaskType,
  TaskHandler,
  TaskContext,
  TaskResult,
  Workflow,
  Task,
  Dependency,
  RetryPolicy,
  DependencyType,
} from "./core/types";

import { WorkflowEngine } from "./core/WorkflowEngine";
import { TaskExecutor, RetryManager } from "./core/TaskExecutor";
import {
  TaskScheduler,
  ResourceManager,
  DependencyResolver,
} from "./core/TaskScheduler";
import { WorkflowMonitor } from "./monitoring/MonitoringSystem";
import { ErrorManager } from "../ErrorManager";

// Import AI components
import {
  IssueAnalyzer,
  IssueAnalysis,
  GitHubIssue,
} from "../github-issues/IssueAnalyzer";
import {
  AutonomousResolver,
  ResolutionResult,
  CodeChanges,
} from "../github-issues/AutonomousResolver";
import { CodeReviewer, ReviewResult } from "../github-issues/CodeReviewer";
import { PRGenerator, PullRequest } from "../github-issues/PRGenerator";

export interface EnhancedWorkflowConfig extends WorkflowConfig {
  // AI component configuration
  issueAnalyzer: IssueAnalyzer;
  autonomousResolver: AutonomousResolver;
  codeReviewer: CodeReviewer;
  prGenerator: PRGenerator;

  // Orchestration settings
  enableOptimization: boolean;
  enableParallelProcessing: boolean;
  maxConcurrentWorkflows: number;
  enableIntelligentRetry: boolean;
  enableDynamicScheduling: boolean;

  // Monitoring and alerting
  enableRealTimeMonitoring: boolean;
  enablePerformanceAlerts: boolean;
  enableResourceAlerts: boolean;

  // Decision making
  enableAIDecisions: boolean;
  humanInterventionThreshold: number;
  autoEscalationThreshold: number;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  originalIssue: GitHubIssue;
  analysis?: IssueAnalysis;
  resolution?: ResolutionResult;
  review?: ReviewResult;
  pullRequest?: PullRequest;
  startTime: Date;
  currentState: WorkflowState;
  retryCount: number;
  errorHistory: Array<{ timestamp: Date; error: string; context: string }>;
  performanceMetrics: {
    phaseTimings: Record<string, number>;
    memoryUsage: number[];
    resourceUtilization: number[];
  };
}

export class WorkflowOrchestrator {
  private config: EnhancedWorkflowConfig;
  private workflowEngine: WorkflowEngine;
  private taskExecutor: TaskExecutor;
  private retryManager: RetryManager;
  private taskScheduler: TaskScheduler;
  private resourceManager: ResourceManager;
  private dependencyResolver: DependencyResolver;
  private workflowMonitor: WorkflowMonitor;
  private errorManager: ErrorManager;

  private activeWorkflows: Map<string, WorkflowExecutionContext> = new Map();
  private globalMetrics: WorkflowMetrics;
  private isShuttingDown = false;

  constructor(config: EnhancedWorkflowConfig) {
    this.config = config;
    this.errorManager = new ErrorManager();

    // Initialize core components
    this.retryManager = new RetryManager();
    this.taskExecutor = new TaskExecutor(this.retryManager, this.errorManager);
    this.resourceManager = new ResourceManager(config.maxConcurrentWorkflows);
    this.dependencyResolver = new DependencyResolver();
    this.taskScheduler = new TaskScheduler(
      this.resourceManager,
      this.errorManager,
      this.dependencyResolver,
    );
    this.workflowMonitor = new WorkflowMonitor(this.errorManager);
    this.workflowEngine = new WorkflowEngine(
      this.taskExecutor,
      this.taskScheduler,
      this.workflowMonitor,
      this.errorManager,
    );

    // Initialize global metrics
    this.globalMetrics = {
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
      concurrentWorkflows: 0,
      queueLength: 0,
      throughput: 0,
    };

    this.setupTaskHandlers();
    this.setupWorkflowDefinitions();
  }

  /**
   * Process a GitHub issue through the complete AI-powered workflow
   */
  async processIssue(
    issueNumber: number,
    title?: string,
    body?: string,
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const workflowId = `github-issue-${issueNumber}-${Date.now()}`;

    try {
      if (this.isShuttingDown) {
        throw new Error("Workflow orchestrator is shutting down");
      }

      // Create GitHub issue object
      const issue: GitHubIssue = {
        number: issueNumber,
        title: title || `Issue #${issueNumber}`,
        body: body || `Description for issue #${issueNumber}`,
        labels: [],
        user: { login: "system" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        state: "open",
        html_url: `https://github.com/test/repo/issues/${issueNumber}`,
      };

      // Create execution context
      const context: WorkflowExecutionContext = {
        workflowId,
        originalIssue: issue,
        startTime: new Date(),
        currentState: WorkflowState.INITIALIZING,
        retryCount: 0,
        errorHistory: [],
        performanceMetrics: {
          phaseTimings: {},
          memoryUsage: [],
          resourceUtilization: [],
        },
      };

      this.activeWorkflows.set(workflowId, context);
      this.globalMetrics.totalWorkflows++;
      this.globalMetrics.concurrentWorkflows++;

      // Start monitoring
      await this.workflowMonitor.trackWorkflowExecution(workflowId);

      // Execute workflow through engine
      const result = await this.workflowEngine.executeWorkflow(
        "github-issues-reviewer",
        { issue, workflowId },
        {
          priority: this.calculatePriority(issue),
          timeout: this.config.maxWorkflowTime,
          metadata: {
            issueNumber,
            title: issue.title,
            complexity: "unknown",
          },
        },
      );

      // Update global metrics
      this.updateGlobalMetrics(result, startTime);

      // Generate insights
      const insights = await this.workflowMonitor.generateInsights(workflowId);

      // Update result with insights
      result.requiresHumanReview =
        insights.performanceScore < 70 || result.requiresHumanReview;

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update error metrics
      this.globalMetrics.errorCount++;
      this.globalMetrics.failureReasons[errorMessage] =
        (this.globalMetrics.failureReasons[errorMessage] || 0) + 1;

      return this.createFailureResult(
        workflowId,
        issueNumber,
        errorMessage,
        startTime,
      );
    } finally {
      // Cleanup
      this.activeWorkflows.delete(workflowId);
      this.globalMetrics.concurrentWorkflows--;
      await this.workflowMonitor.stopTracking(workflowId);
    }
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string, reason: string): Promise<boolean> {
    try {
      // Cancel in workflow engine
      const engineCancelled = await this.workflowEngine.cancelWorkflow(
        workflowId,
        reason,
      );

      // Cancel in task scheduler
      await this.taskScheduler.cancelWorkflowTasks(workflowId);

      // Update context
      const context = this.activeWorkflows.get(workflowId);
      if (context) {
        context.currentState = WorkflowState.CANCELLED;
        context.errorHistory.push({
          timestamp: new Date(),
          error: reason,
          context: "cancel",
        });
      }

      // Stop monitoring
      await this.workflowMonitor.stopTracking(workflowId);

      return engineCancelled;
    } catch (error) {
      this.errorManager.handleError(error, "Failed to cancel workflow", {
        component: "WorkflowOrchestrator",
        operation: "cancelWorkflow",
        timestamp: new Date(),
        metadata: { workflowId, reason },
      });
      return false;
    }
  }

  /**
   * Get current workflow status
   */
  getWorkflowStatus(workflowId: string): {
    state: WorkflowState;
    progress: number;
    currentPhase: string;
    estimatedTimeRemaining?: number;
    errors: Array<{ timestamp: Date; error: string; context: string }>;
    performanceMetrics: any;
  } | null {
    const context = this.activeWorkflows.get(workflowId);
    if (!context) {
      return null;
    }

    const engineStatus = this.workflowEngine.getWorkflowStatus(workflowId);

    return {
      state: context.currentState,
      progress: engineStatus?.progress || 0,
      currentPhase: this.getCurrentPhase(context.currentState),
      estimatedTimeRemaining: this.estimateTimeRemaining(context),
      errors: context.errorHistory,
      performanceMetrics: context.performanceMetrics,
    };
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): Array<{
    workflowId: string;
    issueNumber: number;
    state: WorkflowState;
    progress: number;
    startTime: Date;
  }> {
    const activeWorkflows: Array<{
      workflowId: string;
      issueNumber: number;
      state: WorkflowState;
      progress: number;
      startTime: Date;
    }> = [];

    for (const [workflowId, context] of this.activeWorkflows) {
      const status = this.getWorkflowStatus(workflowId);
      if (status) {
        activeWorkflows.push({
          workflowId,
          issueNumber: context.originalIssue.number,
          state: status.state,
          progress: status.progress,
          startTime: context.startTime,
        });
      }
    }

    return activeWorkflows;
  }

  /**
   * Get global metrics
   */
  getGlobalMetrics(): WorkflowMetrics {
    // Update real-time metrics
    this.globalMetrics.concurrentWorkflows = this.activeWorkflows.size;

    // Calculate success rate
    const totalCompleted =
      this.globalMetrics.totalWorkflows -
      this.globalMetrics.concurrentWorkflows;
    const successful = Math.round(
      this.globalMetrics.successRate * totalCompleted,
    );
    this.globalMetrics.successRate =
      totalCompleted > 0 ? successful / totalCompleted : 0;

    return { ...this.globalMetrics };
  }

  /**
   * Get system health and performance insights
   */
  async getSystemInsights(): Promise<{
    health: "healthy" | "degraded" | "unhealthy";
    performanceScore: number;
    bottlenecks: string[];
    recommendations: string[];
    alerts: any[];
    metrics: any;
  }> {
    const metrics = this.workflowMonitor.getSystemMetrics();
    const health = this.errorManager.getSystemHealth();

    // Calculate performance score
    const performanceScore = this.calculateSystemPerformanceScore(metrics);

    // Identify bottlenecks
    const bottlenecks = this.identifySystemBottlenecks(metrics);

    // Generate recommendations
    const recommendations = this.generateSystemRecommendations(
      metrics,
      bottlenecks,
    );

    // Get active alerts
    const alerts = this.workflowMonitor.getActiveAlerts();

    return {
      health: this.mapHealthStatus(health.overall),
      performanceScore,
      bottlenecks,
      recommendations,
      alerts,
      metrics,
    };
  }

  /**
   * Shutdown the orchestrator gracefully
   */
  async shutdown(timeout: number = 60000): Promise<void> {
    this.isShuttingDown = true;

    try {
      // Cancel all active workflows
      const activeWorkflowIds = Array.from(this.activeWorkflows.keys());
      await Promise.all(
        activeWorkflowIds.map((id) =>
          this.cancelWorkflow(id, "System shutdown"),
        ),
      );

      // Shutdown components
      await this.workflowEngine.shutdown(timeout);
      await this.workflowMonitor.shutdown();

      // Clear data
      this.activeWorkflows.clear();

      this.errorManager.handleError(
        new Error("Workflow orchestrator shutdown completed"),
        "WorkflowOrchestrator.shutdown",
        {
          component: "WorkflowOrchestrator",
          operation: "shutdown",
          timestamp: new Date(),
        },
      );
    } catch (error) {
      this.errorManager.handleError(
        error,
        "Failed to shutdown workflow orchestrator",
        {
          component: "WorkflowOrchestrator",
          operation: "shutdown",
          timestamp: new Date(),
        },
      );
      throw error;
    }
  }

  /**
   * Setup task handlers for AI components
   */
  private setupTaskHandlers(): void {
    // Issue Analysis Handler
    this.taskExecutor.registerHandler(TaskType.ISSUE_ANALYSIS, {
      execute: async (context: TaskContext): Promise<TaskResult> => {
        const startTime = Date.now();
        try {
          const { issue } = context.input;
          const analysis = await this.config.issueAnalyzer.analyzeIssue(issue);

          // Update execution context
          const workflowContext = this.activeWorkflows.get(context.workflowId);
          if (workflowContext) {
            workflowContext.analysis = analysis;
            workflowContext.currentState = WorkflowState.ANALYZING_ISSUE;
            workflowContext.performanceMetrics.phaseTimings.analysis =
              Date.now() - startTime;
          }

          return {
            success: true,
            output: analysis,
            executionTime: Date.now() - startTime,
            retryable: false,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Issue analysis failed",
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        }
      },
      validate: async (context: TaskContext): Promise<boolean> => {
        const { issue } = context.input;
        return !!(issue && issue.number && issue.title);
      },
    });

    // Autonomous Resolution Handler
    this.taskExecutor.registerHandler(TaskType.AUTONOMOUS_RESOLUTION, {
      execute: async (context: TaskContext): Promise<TaskResult> => {
        const startTime = Date.now();
        try {
          const { issue, analysis } = context.input;
          const resolution = await this.config.autonomousResolver.resolveIssue(
            analysis,
            issue,
          );

          // Update execution context
          const workflowContext = this.activeWorkflows.get(context.workflowId);
          if (workflowContext) {
            workflowContext.resolution = resolution;
            workflowContext.currentState = WorkflowState.GENERATING_SOLUTION;
            workflowContext.performanceMetrics.phaseTimings.resolution =
              Date.now() - startTime;
          }

          return {
            success: resolution.success,
            output: resolution,
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Autonomous resolution failed",
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        }
      },
    });

    // Code Review Handler
    this.taskExecutor.registerHandler(TaskType.CODE_REVIEW, {
      execute: async (context: TaskContext): Promise<TaskResult> => {
        const startTime = Date.now();
        try {
          const { issue, changes } = context.input;
          const review = await this.config.codeReviewer.reviewChanges(
            changes,
            issue,
          );

          // Update execution context
          const workflowContext = this.activeWorkflows.get(context.workflowId);
          if (workflowContext) {
            workflowContext.review = review;
            workflowContext.currentState = WorkflowState.REVIEWING_CODE;
            workflowContext.performanceMetrics.phaseTimings.review =
              Date.now() - startTime;
          }

          return {
            success: review.approved,
            output: review,
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Code review failed",
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        }
      },
    });

    // PR Generation Handler
    this.taskExecutor.registerHandler(TaskType.PR_GENERATION, {
      execute: async (context: TaskContext): Promise<TaskResult> => {
        const startTime = Date.now();
        try {
          const { issue, resolution, review } = context.input;
          const pullRequest = await this.config.prGenerator.createPullRequest(
            resolution,
            review,
            issue,
          );

          // Update execution context
          const workflowContext = this.activeWorkflows.get(context.workflowId);
          if (workflowContext) {
            workflowContext.pullRequest = pullRequest;
            workflowContext.currentState = WorkflowState.CREATING_PR;
            workflowContext.performanceMetrics.phaseTimings.pr =
              Date.now() - startTime;
          }

          return {
            success: true,
            output: pullRequest,
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "PR generation failed",
            executionTime: Date.now() - startTime,
            retryable: true,
          };
        }
      },
    });
  }

  /**
   * Setup workflow definitions
   */
  private setupWorkflowDefinitions(): void {
    const githubIssuesWorkflow: Workflow = {
      id: "github-issues-reviewer",
      name: "GitHub Issues Reviewer Workflow",
      version: "1.0.0",
      description:
        "Complete AI-powered workflow for analyzing and resolving GitHub issues",
      tasks: [
        {
          id: "analyze-issue",
          name: "Analyze GitHub Issue",
          type: TaskType.ISSUE_ANALYSIS,
          handler: {} as TaskHandler, // Will be set by executor
          dependencies: [],
          retryPolicy: this.retryManager.getRecommendedPolicy(
            TaskType.ISSUE_ANALYSIS,
          ),
          timeout: 10000,
          metadata: { phase: "analysis" },
          status: "pending" as any,
        },
        {
          id: "resolve-issue",
          name: "Generate Solution",
          type: TaskType.AUTONOMOUS_RESOLUTION,
          handler: {} as TaskHandler,
          dependencies: ["analyze-issue"],
          retryPolicy: this.retryManager.getRecommendedPolicy(
            TaskType.AUTONOMOUS_RESOLUTION,
          ),
          timeout: 30000,
          metadata: { phase: "resolution" },
          status: "pending" as any,
        },
        {
          id: "review-code",
          name: "Review Generated Code",
          type: TaskType.CODE_REVIEW,
          handler: {} as TaskHandler,
          dependencies: ["resolve-issue"],
          retryPolicy: this.retryManager.getRecommendedPolicy(
            TaskType.CODE_REVIEW,
          ),
          timeout: 15000,
          metadata: { phase: "review" },
          status: "pending" as any,
        },
        {
          id: "create-pr",
          name: "Create Pull Request",
          type: TaskType.PR_GENERATION,
          handler: {} as TaskHandler,
          dependencies: ["review-code"],
          retryPolicy: this.retryManager.getRecommendedPolicy(
            TaskType.PR_GENERATION,
          ),
          timeout: 20000,
          metadata: { phase: "pr_creation" },
          status: "pending" as any,
        },
      ],
      dependencies: [],
      triggers: [],
      config: {
        maxWorkflowTime: this.config.maxWorkflowTime,
        enableMetrics: this.config.enableMetrics,
        retryAttempts: this.config.retryAttempts,
        retryDelay: 1000,
        humanInterventionThreshold: this.config.humanInterventionThreshold,
        enableNotifications: true,
        enableCaching: this.config.enableCaching,
        parallelExecution: this.config.enableParallelProcessing,
        timeoutHandling: "retry" as any,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflowEngine.registerWorkflow(githubIssuesWorkflow);
  }

  /**
   * Calculate workflow priority based on issue characteristics
   */
  private calculatePriority(issue: GitHubIssue): number {
    let priority = 50; // Base priority

    // Boost priority for urgent issues
    if (
      issue.labels.some(
        (label) =>
          label.name.toLowerCase().includes("urgent") ||
          label.name.toLowerCase().includes("critical"),
      )
    ) {
      priority += 30;
    }

    // Boost priority for bugs
    if (
      issue.labels.some((label) => label.name.toLowerCase().includes("bug"))
    ) {
      priority += 20;
    }

    // Adjust based on issue age
    const createdDate = new Date(issue.created_at);
    const daysOld =
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld > 30) priority += 15;
    else if (daysOld > 7) priority += 10;

    return Math.min(100, priority);
  }

  /**
   * Update global metrics with workflow result
   */
  private updateGlobalMetrics(result: WorkflowResult, startTime: number): void {
    const executionTime = Date.now() - startTime;

    if (result.success) {
      const successfulWorkflows =
        this.globalMetrics.totalWorkflows > 0
          ? Math.round(
              this.globalMetrics.successRate *
                (this.globalMetrics.totalWorkflows - 1),
            ) + 1
          : 1;
      this.globalMetrics.successRate =
        successfulWorkflows / this.globalMetrics.totalWorkflows;
    }

    this.globalMetrics.totalProcessingTime += executionTime;
    this.globalMetrics.averageExecutionTime =
      this.globalMetrics.totalProcessingTime /
      this.globalMetrics.totalWorkflows;

    if (result.requiresHumanReview) {
      this.globalMetrics.humanInterventionCount++;
    }

    // Update component execution times
    const componentTimes = this.globalMetrics.componentExecutionTimes;
    if (result.metrics.totalTasks > 0) {
      const avgTimePerTask = executionTime / result.metrics.totalTasks;

      // Simple distribution - could be enhanced with actual phase times
      componentTimes.analysis =
        (componentTimes.analysis + avgTimePerTask * 0.3) / 2;
      componentTimes.resolution =
        (componentTimes.resolution + avgTimePerTask * 0.4) / 2;
      componentTimes.review =
        (componentTimes.review + avgTimePerTask * 0.2) / 2;
      componentTimes.pr = (componentTimes.pr + avgTimePerTask * 0.1) / 2;
    }
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    workflowId: string,
    issueNumber: number,
    error: string,
    startTime: number,
  ): WorkflowResult {
    return {
      success: false,
      workflowId,
      finalState: WorkflowState.FAILED,
      outputs: {},
      requiresHumanReview: false,
      error,
      executionTime: Date.now() - startTime,
      retryCount: 0,
      errors: [error],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskExecutionTime: 0,
        totalExecutionTime: Date.now() - startTime,
        memoryUsage: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
      completedTasks: [],
      failedTasks: [],
    };
  }

  /**
   * Get current phase from state
   */
  private getCurrentPhase(state: WorkflowState): string {
    switch (state) {
      case WorkflowState.INITIALIZING:
        return "Initializing";
      case WorkflowState.ANALYZING_ISSUE:
        return "Analyzing Issue";
      case WorkflowState.CHECKING_FEASIBILITY:
        return "Checking Feasibility";
      case WorkflowState.GENERATING_SOLUTION:
        return "Generating Solution";
      case WorkflowState.REVIEWING_CODE:
        return "Reviewing Code";
      case WorkflowState.CREATING_PR:
        return "Creating Pull Request";
      case WorkflowState.PR_COMPLETE:
        return "Complete";
      case WorkflowState.REQUIRES_HUMAN_REVIEW:
        return "Requires Human Review";
      case WorkflowState.FAILED:
        return "Failed";
      default:
        return "Unknown";
    }
  }

  /**
   * Estimate time remaining for workflow
   */
  private estimateTimeRemaining(
    context: WorkflowExecutionContext,
  ): number | undefined {
    const elapsed = Date.now() - context.startTime.getTime();
    const totalPhases = 4; // Analysis, Resolution, Review, PR
    const completedPhases = this.getCompletedPhasesCount(context);

    if (completedPhases === 0) return undefined;

    const avgTimePerPhase = elapsed / completedPhases;
    const remainingPhases = totalPhases - completedPhases;

    return Math.max(0, remainingPhases * avgTimePerPhase);
  }

  /**
   * Get count of completed phases
   */
  private getCompletedPhasesCount(context: WorkflowExecutionContext): number {
    let count = 0;

    if (context.analysis) count++;
    if (context.resolution) count++;
    if (context.review) count++;
    if (context.pullRequest) count++;

    return count;
  }

  /**
   * Calculate system performance score
   */
  private calculateSystemPerformanceScore(metrics: any): number {
    let score = 100;

    // Penalize high error rate
    score -= Math.min(40, metrics.errorRate);

    // Penalize long execution times
    if (metrics.averageExecutionTime > 30000) score -= 30;
    else if (metrics.averageExecutionTime > 15000) score -= 15;

    // Penalize high system load
    score -= Math.min(20, metrics.systemLoad);

    // Penalize high memory usage
    score -= Math.min(15, metrics.memoryUsage - 50);

    return Math.max(0, Math.round(score));
  }

  /**
   * Identify system bottlenecks
   */
  private identifySystemBottlenecks(metrics: any): string[] {
    const bottlenecks: string[] = [];

    if (metrics.errorRate > 20) bottlenecks.push("High error rate");
    if (metrics.averageExecutionTime > 30000)
      bottlenecks.push("Slow workflow execution");
    if (metrics.systemLoad > 80) bottlenecks.push("High system load");
    if (metrics.memoryUsage > 85) bottlenecks.push("High memory usage");
    if (metrics.throughput < 1) bottlenecks.push("Low throughput");

    return bottlenecks;
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(
    metrics: any,
    bottlenecks: string[],
  ): string[] {
    const recommendations: string[] = [];

    for (const bottleneck of bottlenecks) {
      switch (bottleneck) {
        case "High error rate":
          recommendations.push("Review error logs and improve error handling");
          recommendations.push("Consider increasing retry limits");
          break;
        case "Slow workflow execution":
          recommendations.push("Enable parallel processing where possible");
          recommendations.push("Optimize AI component performance");
          break;
        case "High system load":
          recommendations.push("Reduce concurrent workflow limit");
          recommendations.push("Scale up resources");
          break;
        case "High memory usage":
          recommendations.push("Implement memory cleanup");
          recommendations.push("Reduce workflow complexity");
          break;
        case "Low throughput":
          recommendations.push("Optimize task scheduling");
          recommendations.push("Enable workflow caching");
          break;
      }
    }

    return recommendations;
  }

  /**
   * Map health status
   */
  private mapHealthStatus(
    health: string,
  ): "healthy" | "degraded" | "unhealthy" {
    switch (health) {
      case "healthy":
        return "healthy";
      case "degraded":
        return "degraded";
      case "unhealthy":
        return "unhealthy";
      default:
        return "degraded";
    }
  }
}
