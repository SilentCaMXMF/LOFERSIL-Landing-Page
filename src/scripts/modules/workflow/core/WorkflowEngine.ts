/**
 * Workflow Engine
 *
 * Core workflow execution engine with intelligent task coordination and state management
 */

import {
  Workflow,
  Task,
  WorkflowContext,
  WorkflowResult,
  TaskResult,
  TaskContext,
  WorkflowState,
  TaskStatus,
  TaskType,
  DependencyType,
  TimeoutHandling,
  WorkflowExecutionMetrics,
} from "./types";
import { TaskExecutor } from "./TaskExecutor";
import { TaskScheduler } from "./TaskScheduler";
import { WorkflowMonitor } from "../monitoring/MonitoringSystem";
import { ErrorManager } from "../../ErrorManager";

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private activeWorkflows: Map<string, WorkflowContext> = new Map();
  private taskExecutor: TaskExecutor;
  private scheduler: TaskScheduler;
  private monitor: WorkflowMonitor;
  private errorManager: ErrorManager;
  private isShuttingDown = false;

  constructor(
    taskExecutor: TaskExecutor,
    scheduler: TaskScheduler,
    monitor: WorkflowMonitor,
    errorManager: ErrorManager,
  ) {
    this.taskExecutor = taskExecutor;
    this.scheduler = scheduler;
    this.monitor = monitor;
    this.errorManager = errorManager;
  }

  /**
   * Register a workflow definition
   */
  async registerWorkflow(workflow: Workflow): Promise<void> {
    try {
      // Validate workflow structure
      this.validateWorkflow(workflow);

      // Register with scheduler
      await this.scheduler.registerWorkflow(workflow);

      // Store workflow definition
      this.workflows.set(workflow.id, workflow);

      this.errorManager.logInfo(`Workflow registered: ${workflow.id}`, {
        workflowId: workflow.id,
        name: workflow.name,
        taskCount: workflow.tasks.length,
      });
    } catch (error) {
      this.errorManager.handleError(
        "Workflow registration failed",
        error as Error,
        {
          workflowId: workflow.id,
        },
      );
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: any,
    options: {
      priority?: number;
      timeout?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    let workflowContext: WorkflowContext | null = null;
    const executionId = `${workflowId}-${Date.now()}`;

    try {
      // Check if workflow exists
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Check if shutting down
      if (this.isShuttingDown) {
        throw new Error("Workflow engine is shutting down");
      }

      // Create workflow context
      workflowContext = this.createWorkflowContext(workflow, input, options);

      // Register active workflow
      this.activeWorkflows.set(executionId, workflowContext);

      // Start monitoring
      await this.monitor.trackWorkflowExecution(executionId);

      // Update initial state
      await this.updateWorkflowState(executionId, WorkflowState.INITIALIZING);

      // Execute workflow
      const result = await this.executeWorkflowTasks(workflow, workflowContext);

      // Update final state
      await this.updateWorkflowState(executionId, result.finalState);

      // Record metrics
      const executionTime = Date.now() - startTime;
      await this.recordExecutionMetrics(workflowId, executionTime, result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update failed state
      if (workflowContext) {
        await this.updateWorkflowState(
          executionId,
          WorkflowState.FAILED,
          errorMessage,
        );
      }

      // Create failure result
      const result: WorkflowResult = {
        success: false,
        workflowId: executionId,
        finalState: WorkflowState.FAILED,
        outputs: {},
        requiresHumanReview: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
        retryCount: 0,
        errors: [errorMessage],
        metrics: this.createEmptyMetrics(),
        completedTasks: [],
        failedTasks: [],
      };

      // Record error metrics
      await this.recordExecutionMetrics(
        workflowId,
        Date.now() - startTime,
        result,
      );

      return result;
    } finally {
      // Cleanup
      if (workflowContext) {
        this.activeWorkflows.delete(executionId);
        await this.monitor.stopTracking(executionId);
      }
    }
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(executionId: string, reason: string): Promise<boolean> {
    try {
      const context = this.activeWorkflows.get(executionId);
      if (!context) {
        return false;
      }

      // Update state
      await this.updateWorkflowState(
        executionId,
        WorkflowState.CANCELLED,
        reason,
      );

      // Cancel scheduler tasks
      await this.scheduler.cancelWorkflowTasks(executionId);

      // Cancel running tasks
      await this.taskExecutor.cancelWorkflowTasks(executionId);

      // Remove from active workflows
      this.activeWorkflows.delete(executionId);

      this.errorManager.logInfo(`Workflow cancelled: ${executionId}`, {
        executionId,
        reason,
      });

      return true;
    } catch (error) {
      this.errorManager.handleError(
        "Failed to cancel workflow",
        error as Error,
        {
          executionId,
        },
      );
      return false;
    }
  }

  /**
   * Get active workflow status
   */
  getWorkflowStatus(executionId: string): {
    state: WorkflowState;
    progress: number;
    tasks: Array<{
      id: string;
      status: TaskStatus;
      startTime?: Date;
      endTime?: Date;
    }>;
  } | null {
    const context = this.activeWorkflows.get(executionId);
    if (!context) {
      return null;
    }

    const workflow = this.workflows.get(context.workflowId);
    if (!workflow) {
      return null;
    }

    const tasks = workflow.tasks.map((task) => ({
      id: task.id,
      status: task.status,
      startTime: task.startTime,
      endTime: task.endTime,
    }));

    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const progress =
      workflow.tasks.length > 0
        ? (completedTasks / workflow.tasks.length) * 100
        : 0;

    return {
      state: context.state.current || WorkflowState.INITIALIZING,
      progress,
      tasks,
    };
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): Array<{
    executionId: string;
    workflowId: string;
    state: WorkflowState;
    startTime: Date;
    progress: number;
  }> {
    const activeWorkflows: Array<{
      executionId: string;
      workflowId: string;
      state: WorkflowState;
      startTime: Date;
      progress: number;
    }> = [];

    for (const [executionId, context] of this.activeWorkflows) {
      const status = this.getWorkflowStatus(executionId);
      if (status) {
        activeWorkflows.push({
          executionId,
          workflowId: context.workflowId,
          state: status.state,
          startTime: context.startTime,
          progress: status.progress,
        });
      }
    }

    return activeWorkflows;
  }

  /**
   * Shutdown the workflow engine
   */
  async shutdown(timeout: number = 30000): Promise<void> {
    this.isShuttingDown = true;

    const shutdownStartTime = Date.now();

    try {
      // Cancel all active workflows
      const activeWorkflows = Array.from(this.activeWorkflows.keys());
      await Promise.all(
        activeWorkflows.map((id) => this.cancelWorkflow(id, "Engine shutdown")),
      );

      // Wait for tasks to complete or timeout
      while (
        this.activeWorkflows.size > 0 &&
        Date.now() - shutdownStartTime < timeout
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Force cancel remaining workflows
      if (this.activeWorkflows.size > 0) {
        const remainingWorkflows = Array.from(this.activeWorkflows.keys());
        await Promise.all(
          remainingWorkflows.map((id) =>
            this.cancelWorkflow(id, "Force shutdown"),
          ),
        );
      }

      // Shutdown components
      await this.scheduler.shutdown();
      await this.taskExecutor.shutdown();
      await this.monitor.shutdown();

      this.errorManager.logInfo("Workflow engine shutdown completed");
    } catch (error) {
      this.errorManager.handleError(
        "Workflow engine shutdown failed",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Execute workflow tasks with dependency resolution
   */
  private async executeWorkflowTasks(
    workflow: Workflow,
    context: WorkflowContext,
  ): Promise<WorkflowResult> {
    const completedTasks: string[] = [];
    const failedTasks: string[] = [];
    const outputs: Record<string, any> = {};

    try {
      // Create task execution graph
      const taskGraph = this.buildTaskExecutionGraph(workflow);

      // Execute tasks in dependency order
      while (taskGraph.length > 0) {
        const readyTasks = this.getReadyTasks(taskGraph, completedTasks);

        if (readyTasks.length === 0 && taskGraph.length > 0) {
          // Circular dependency or blocking tasks
          throw new Error(
            "Workflow blocked: circular dependency or unresolved dependencies",
          );
        }

        // Execute ready tasks
        const taskResults = await Promise.allSettled(
          readyTasks.map((task) => this.executeTask(workflow, task, context)),
        );

        // Process results
        for (let i = 0; i < readyTasks.length; i++) {
          const task = readyTasks[i];
          const result = taskResults[i];

          if (result.status === "fulfilled" && result.value.success) {
            completedTasks.push(task.id);
            outputs[task.id] = result.value.output;

            // Update task status
            task.status = TaskStatus.COMPLETED;
            task.endTime = new Date();
          } else {
            failedTasks.push(task.id);
            task.status = TaskStatus.FAILED;
            task.error =
              result.status === "rejected"
                ? result.reason.message
                : "Task failed";
            task.endTime = new Date();

            // Handle failure based on workflow config
            if (workflow.config.timeoutHandling === TimeoutHandling.FAIL) {
              throw new Error(`Task ${task.id} failed: ${task.error}`);
            }
          }
        }

        // Remove processed tasks from graph
        for (const task of readyTasks) {
          const index = taskGraph.findIndex((t) => t.id === task.id);
          if (index !== -1) {
            taskGraph.splice(index, 1);
          }
        }
      }

      // Determine final state
      let finalState = WorkflowState.PR_COMPLETE;
      let requiresHumanReview = false;

      if (failedTasks.length > 0) {
        finalState = WorkflowState.REQUIRES_HUMAN_REVIEW;
        requiresHumanReview = true;
      }

      return {
        success: failedTasks.length === 0,
        workflowId: context.workflowId,
        finalState,
        outputs,
        requiresHumanReview,
        executionTime: Date.now() - context.startTime.getTime(),
        retryCount: 0,
        metrics: await this.calculateExecutionMetrics(
          workflow,
          completedTasks,
          failedTasks,
        ),
        completedTasks,
        failedTasks,
      };
    } catch (error) {
      return {
        success: false,
        workflowId: context.workflowId,
        finalState: WorkflowState.FAILED,
        outputs,
        requiresHumanReview: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime: Date.now() - context.startTime.getTime(),
        retryCount: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        metrics: await this.calculateExecutionMetrics(
          workflow,
          completedTasks,
          failedTasks,
        ),
        completedTasks,
        failedTasks,
      };
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    workflow: Workflow,
    task: Task,
    context: WorkflowContext,
  ): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Create task context
      const taskContext: TaskContext = {
        workflowId: workflow.id,
        taskId: task.id,
        input: context.input,
        config: workflow.config,
        metadata: { ...context.metadata, ...task.metadata },
        retryCount: 0,
        startTime: new Date(),
      };

      // Update task status
      task.status = TaskStatus.RUNNING;
      task.startTime = new Date();

      // Execute task with timeout
      const result = await Promise.race([
        this.taskExecutor.executeTask(task, taskContext),
        this.createTaskTimeout(task.timeout),
      ]);

      // Update task status
      if (result.success) {
        task.status = TaskStatus.COMPLETED;
      } else {
        task.status = TaskStatus.FAILED;
        task.error = result.error;
      }
      task.endTime = new Date();

      return result;
    } catch (error) {
      task.status = TaskStatus.FAILED;
      task.error = error instanceof Error ? error.message : "Unknown error";
      task.endTime = new Date();

      return {
        success: false,
        error: task.error,
        executionTime: Date.now() - startTime,
        retryable: true,
      };
    }
  }

  /**
   * Create task timeout promise
   */
  private createTaskTimeout(timeout: number): Promise<TaskResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: `Task timeout after ${timeout}ms`,
          executionTime: timeout,
          retryable: true,
        });
      }, timeout);
    });
  }

  /**
   * Build task execution graph
   */
  private buildTaskExecutionGraph(workflow: Workflow): Task[] {
    const taskMap = new Map(
      workflow.tasks.map((task) => [task.id, { ...task }]),
    );
    const taskGraph: Task[] = [];

    // Initialize task statuses
    for (const task of taskMap.values()) {
      task.status = TaskStatus.PENDING;
      taskGraph.push(task);
    }

    return taskGraph;
  }

  /**
   * Get tasks that are ready to execute
   */
  private getReadyTasks(taskGraph: Task[], completedTasks: string[]): Task[] {
    return taskGraph.filter((task) => {
      if (task.status !== TaskStatus.PENDING) {
        return false;
      }

      // Check if all dependencies are completed
      return task.dependencies.every((depId) => completedTasks.includes(depId));
    });
  }

  /**
   * Create workflow context
   */
  private createWorkflowContext(
    workflow: Workflow,
    input: any,
    options: Record<string, any>,
  ): WorkflowContext {
    return {
      workflowId: workflow.id,
      input,
      config: workflow.config,
      state: { current: WorkflowState.INITIALIZING },
      history: [],
      startTime: new Date(),
      metadata: options.metadata || {},
    };
  }

  /**
   * Update workflow state
   */
  private async updateWorkflowState(
    executionId: string,
    newState: WorkflowState,
    reason?: string,
  ): Promise<void> {
    const context = this.activeWorkflows.get(executionId);
    if (!context) {
      return;
    }

    const previousState = context.state.current;
    context.state.current = newState;

    // Add to history
    context.history.push({
      timestamp: new Date(),
      taskId: "",
      previousState,
      newState,
      reason: reason || `State changed to ${newState}`,
    });

    // Notify monitor
    await this.monitor.updateWorkflowState(executionId, newState, reason);
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflow(workflow: Workflow): void {
    if (!workflow.id || !workflow.name || !workflow.tasks) {
      throw new Error("Invalid workflow: missing required fields");
    }

    // Check for duplicate task IDs
    const taskIds = workflow.tasks.map((t) => t.id);
    const uniqueTaskIds = new Set(taskIds);
    if (taskIds.length !== uniqueTaskIds.size) {
      throw new Error("Invalid workflow: duplicate task IDs");
    }

    // Check dependencies
    for (const task of workflow.tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.includes(depId)) {
          throw new Error(
            `Invalid workflow: task ${task.id} depends on non-existent task ${depId}`,
          );
        }
      }
    }
  }

  /**
   * Calculate execution metrics
   */
  private async calculateExecutionMetrics(
    workflow: Workflow,
    completedTasks: string[],
    failedTasks: string[],
  ): Promise<WorkflowExecutionMetrics> {
    const totalTasks = workflow.tasks.length;
    const completedCount = completedTasks.length;
    const failedCount = failedTasks.length;

    // Calculate average task execution time
    const executionTimes = workflow.tasks
      .filter((task) => task.startTime && task.endTime)
      .map((task) => task.endTime!.getTime() - task.startTime!.getTime());

    const averageTaskExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    return {
      totalTasks,
      completedTasks: completedCount,
      failedTasks: failedCount,
      averageTaskExecutionTime,
      totalExecutionTime: Date.now() - Date.now(), // Will be updated by caller
      memoryUsage: 0, // TODO: Implement memory tracking
      cacheHits: 0, // TODO: Implement cache metrics
      cacheMisses: 0,
    };
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(): WorkflowExecutionMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskExecutionTime: 0,
      totalExecutionTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Record execution metrics
   */
  private async recordExecutionMetrics(
    workflowId: string,
    executionTime: number,
    result: WorkflowResult,
  ): Promise<void> {
    try {
      await this.monitor.recordWorkflowMetrics(workflowId, {
        executionTime,
        success: result.success,
        taskCount: result.metrics.totalTasks,
        completedTasks: result.metrics.completedTasks,
        failedTasks: result.metrics.failedTasks,
        requiresHumanReview: result.requiresHumanReview,
      });
    } catch (error) {
      this.errorManager.handleError(
        "Failed to record execution metrics",
        error as Error,
        {
          workflowId,
        },
      );
    }
  }
}
