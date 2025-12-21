/**
 * Task Executor
 *
 * Handles task execution with retry logic and timeout management
 */

import {
  Task,
  TaskContext,
  TaskResult,
  TaskHandler,
  TaskType,
  RetryPolicy,
} from "./types";
import { ErrorManager } from "../../ErrorManager";

export class TaskExecutor {
  private handlers: Map<TaskType, TaskHandler> = new Map();
  private retryManager: RetryManager;
  private errorManager: ErrorManager;
  private executingTasks: Map<string, AbortController> = new Map();
  private isShuttingDown = false;

  constructor(retryManager: RetryManager, errorManager: ErrorManager) {
    this.retryManager = retryManager;
    this.errorManager = errorManager;
  }

  /**
   * Register a task handler
   */
  registerHandler(type: TaskType, handler: TaskHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Execute a task with retry logic
   */
  async executeTask(task: Task, context: TaskContext): Promise<TaskResult> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    try {
      // Check if shutting down
      if (this.isShuttingDown) {
        return {
          success: false,
          error: "Task executor is shutting down",
          executionTime: 0,
          retryable: false,
        };
      }

      // Validate task
      const isValid = await this.validateTask(task, context);
      if (!isValid) {
        return {
          success: false,
          error: "Task validation failed",
          executionTime: 0,
          retryable: false,
        };
      }

      // Get handler
      const handler = this.handlers.get(task.type);
      if (!handler) {
        return {
          success: false,
          error: `No handler registered for task type: ${task.type}`,
          executionTime: 0,
          retryable: false,
        };
      }

      // Create abort controller for timeout
      const abortController = new AbortController();
      this.executingTasks.set(context.taskId, abortController);

      // Execute with retry
      while (attempt < task.retryPolicy.maxAttempts) {
        try {
          // Check if aborted
          if (abortController.signal.aborted) {
            return {
              success: false,
              error: "Task was aborted",
              executionTime: Date.now() - startTime,
              retryable: false,
            };
          }

          // Create task context with retry count
          const taskContextWithRetry: TaskContext = {
            ...context,
            retryCount: attempt,
          };

          // Execute task
          const result = await Promise.race([
            handler.execute(taskContextWithRetry),
            this.createTimeoutPromise(task.timeout, abortController.signal),
          ]);

          // If successful, return result
          if (result.success) {
            this.executingTasks.delete(context.taskId);
            return {
              ...result,
              executionTime: Date.now() - startTime,
            };
          }

          // If not retryable, return failure
          if (!result.retryable) {
            this.executingTasks.delete(context.taskId);
            return {
              ...result,
              executionTime: Date.now() - startTime,
            };
          }

          // Store error for potential retry
          lastError = new Error(result.error || "Task failed");
          attempt++;
        } catch (error) {
          lastError = error as Error;
          attempt++;
        }

        // Calculate retry delay
        if (attempt < task.retryPolicy.maxAttempts) {
          const delay = this.retryManager.calculateDelay(
            attempt,
            task.retryPolicy,
            lastError?.message,
          );

          await this.sleep(delay);
        }
      }

      // All attempts failed
      this.executingTasks.delete(context.taskId);
      return {
        success: false,
        error: lastError?.message || "Task failed after all retry attempts",
        executionTime: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      this.executingTasks.delete(context.taskId);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown task execution error",
        executionTime: Date.now() - startTime,
        retryable: false,
      };
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const controller = this.executingTasks.get(taskId);
      if (controller) {
        controller.abort();
        this.executingTasks.delete(taskId);
        return true;
      }
      return false;
    } catch (error) {
      this.errorManager.handleError(error, "Failed to cancel task", {
        component: "TaskExecutor",
        operation: "cancelTask",
        timestamp: new Date(),
        metadata: { taskId },
      });
      return false;
    }
  }

  /**
   * Cancel all tasks for a workflow
   */
  async cancelWorkflowTasks(workflowId: string): Promise<void> {
    const tasksToCancel = Array.from(this.executingTasks.entries())
      .filter(([taskId]) => taskId.startsWith(`${workflowId}-`))
      .map(([taskId, controller]) => ({ taskId, controller }));

    for (const { taskId, controller } of tasksToCancel) {
      try {
        controller.abort();
        this.executingTasks.delete(taskId);
      } catch (error) {
        this.errorManager.handleError(error, "Failed to cancel task", {
          component: "TaskExecutor",
          operation: "cancelTask",
          timestamp: new Date(),
          metadata: { taskId },
        });
      }
    }
  }

  /**
   * Shutdown the task executor
   */
  async shutdown(timeout: number = 30000): Promise<void> {
    this.isShuttingDown = true;

    const startTime = Date.now();

    // Cancel all executing tasks
    const activeTasks = Array.from(this.executingTasks.keys());
    await Promise.all(activeTasks.map((taskId) => this.cancelTask(taskId)));

    // Wait for tasks to finish
    while (this.executingTasks.size > 0 && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Force cleanup
    this.executingTasks.clear();
    this.handlers.clear();
  }

  /**
   * Get executing task count
   */
  getExecutingTaskCount(): number {
    return this.executingTasks.size;
  }

  /**
   * Validate task before execution
   */
  private async validateTask(
    task: Task,
    context: TaskContext,
  ): Promise<boolean> {
    try {
      // Check if handler has custom validation
      const handler = this.handlers.get(task.type);
      if (handler && handler.validate) {
        return await handler.validate(context);
      }

      // Default validation
      return true;
    } catch (error) {
      this.errorManager.handleError(error, "Task validation failed", {
        component: "TaskExecutor",
        operation: "validateTask",
        timestamp: new Date(),
        metadata: {
          taskId: task.id,
          taskType: task.type,
        },
      });
      return false;
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(
    timeout: number,
    signal: AbortSignal,
  ): Promise<TaskResult> {
    return new Promise((resolve) => {
      const handleTimeout = () => {
        resolve({
          success: false,
          error: `Task timeout after ${timeout}ms`,
          executionTime: timeout,
          retryable: true,
        });
      };

      const timeoutId = setTimeout(handleTimeout, timeout);

      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: "Task was aborted",
          executionTime: 0,
          retryable: false,
        });
      });
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Retry Manager
 *
 * Manages retry logic with exponential backoff
 */
export class RetryManager {
  /**
   * Calculate retry delay based on policy and attempt
   */
  calculateDelay(attempt: number, policy: RetryPolicy, error?: string): number {
    // Check if error is retryable
    if (error && !this.isRetryableError(error, policy.retryableErrors)) {
      return policy.maxDelay; // Return max delay to effectively stop retries
    }

    // Calculate exponential backoff
    const exponentialDelay =
      policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;

    // Apply max delay limit
    const delay = Math.min(exponentialDelay + jitter, policy.maxDelay);

    return Math.floor(delay);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: string, retryableErrors: string[]): boolean {
    if (retryableErrors.length === 0) {
      return true; // All errors are retryable if no specific list provided
    }

    return retryableErrors.some((pattern) => {
      if (pattern.includes("*")) {
        // Glob pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(error);
      }
      return error.includes(pattern);
    });
  }

  /**
   * Get recommended retry policy for task type
   */
  getRecommendedPolicy(taskType: TaskType): RetryPolicy {
    switch (taskType) {
      case TaskType.ISSUE_ANALYSIS:
        return {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          retryableErrors: ["timeout", "network", "rate limit", "temporary"],
        };

      case TaskType.AUTONOMOUS_RESOLUTION:
        return {
          maxAttempts: 2,
          baseDelay: 2000,
          maxDelay: 15000,
          backoffMultiplier: 2,
          retryableErrors: ["timeout", "ai service", "temporary"],
        };

      case TaskType.CODE_REVIEW:
        return {
          maxAttempts: 3,
          baseDelay: 500,
          maxDelay: 5000,
          backoffMultiplier: 1.5,
          retryableErrors: ["timeout", "service", "temporary"],
        };

      case TaskType.PR_GENERATION:
        return {
          maxAttempts: 2,
          baseDelay: 1500,
          maxDelay: 8000,
          backoffMultiplier: 2,
          retryableErrors: ["github", "api", "temporary"],
        };

      default:
        return {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          retryableErrors: [],
        };
    }
  }
}
