/**
 * Task Scheduler
 *
 * Intelligent task scheduling with dependency resolution and optimization
 */

import {
  Workflow,
  Task,
  TaskType,
  Dependency,
  DependencyType,
  ResourceAllocation,
  ResourcePriority,
} from "./types";
import { ErrorManager } from "../../ErrorManager";

export interface ScheduledTask {
  task: Task;
  scheduledTime: Date;
  priority: number;
  dependencies: string[];
  estimatedDuration: number;
  resources: ResourceAllocation;
}

export interface Schedule {
  workflowId: string;
  tasks: ScheduledTask[];
  totalTime: number;
  parallelTasks: number;
  resourceUsage: ResourceAllocation;
  createdAt: Date;
}

export class TaskScheduler {
  private scheduledWorkflows: Map<string, Schedule> = new Map();
  private activeTasks: Map<string, ScheduledTask> = new Map();
  private resourceManager: ResourceManager;
  private errorManager: ErrorManager;
  private dependencyResolver: DependencyResolver;
  private isShuttingDown = false;

  constructor(
    resourceManager: ResourceManager,
    errorManager: ErrorManager,
    dependencyResolver: DependencyResolver,
  ) {
    this.resourceManager = resourceManager;
    this.errorManager = errorManager;
    this.dependencyResolver = dependencyResolver;
  }

  /**
   * Register a workflow for scheduling
   */
  async registerWorkflow(workflow: Workflow): Promise<void> {
    try {
      // Create execution plan
      const schedule = await this.createExecutionSchedule(workflow);

      // Store schedule
      this.scheduledWorkflows.set(workflow.id, schedule);

      this.errorManager.handleError(
        new Error(`Workflow registered for scheduling: ${workflow.id}`),
        "TaskScheduler.registerWorkflow",
        {
          component: "TaskScheduler",
          operation: "registerWorkflow",
          timestamp: new Date(),
          metadata: {
            workflowId: workflow.id,
            taskCount: workflow.tasks.length,
            totalTime: schedule.totalTime,
          },
        },
      );
    } catch (error) {
      this.errorManager.handleError(
        error,
        `Failed to register workflow for scheduling: ${workflow.id}`,
        {
          component: "TaskScheduler",
          operation: "registerWorkflow",
          timestamp: new Date(),
          metadata: { workflowId: workflow.id },
        },
      );
      throw error;
    }
  }

  /**
   * Get next tasks ready for execution
   */
  getNextTasks(workflowId: string, maxTasks: number = 5): ScheduledTask[] {
    try {
      const schedule = this.scheduledWorkflows.get(workflowId);
      if (!schedule) {
        return [];
      }

      const now = new Date();
      const readyTasks: ScheduledTask[] = [];

      // Find tasks that are ready to execute
      for (const scheduledTask of schedule.tasks) {
        // Skip if already active
        if (this.activeTasks.has(`${workflowId}-${scheduledTask.task.id}`)) {
          continue;
        }

        // Check if dependencies are satisfied
        if (this.areDependenciesSatisfied(scheduledTask, workflowId)) {
          // Check if resources are available
          if (
            this.resourceManager.areResourcesAvailable(scheduledTask.resources)
          ) {
            readyTasks.push(scheduledTask);
          }
        }
      }

      // Sort by priority and scheduled time
      readyTasks.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.scheduledTime.getTime() - b.scheduledTime.getTime(); // Earlier time first
      });

      // Return limited number of tasks
      return readyTasks.slice(0, maxTasks);
    } catch (error) {
      this.errorManager.handleError(error, "Failed to get next tasks", {
        component: "TaskScheduler",
        operation: "getNextTasks",
        timestamp: new Date(),
        metadata: { workflowId, maxTasks },
      });
      return [];
    }
  }

  /**
   * Mark task as started
   */
  markTaskStarted(workflowId: string, taskId: string): void {
    const schedule = this.scheduledWorkflows.get(workflowId);
    if (!schedule) {
      return;
    }

    const scheduledTask = schedule.tasks.find((t) => t.task.id === taskId);
    if (scheduledTask) {
      this.activeTasks.set(`${workflowId}-${taskId}`, scheduledTask);
      this.resourceManager.allocateResources(scheduledTask.resources);
    }
  }

  /**
   * Mark task as completed
   */
  markTaskCompleted(
    workflowId: string,
    taskId: string,
    actualDuration?: number,
  ): void {
    const taskKey = `${workflowId}-${taskId}`;
    const scheduledTask = this.activeTasks.get(taskKey);

    if (scheduledTask) {
      // Release resources
      this.resourceManager.releaseResources(scheduledTask.resources);

      // Remove from active tasks
      this.activeTasks.delete(taskKey);

      // Update estimated duration for future scheduling
      if (actualDuration) {
        this.updateTaskDurationEstimate(taskId, actualDuration);
      }
    }
  }

  /**
   * Cancel workflow tasks
   */
  async cancelWorkflowTasks(workflowId: string): Promise<void> {
    try {
      // Release all resources for active tasks
      const activeTasks = Array.from(this.activeTasks.entries()).filter(
        ([key]) => key.startsWith(`${workflowId}-`),
      );

      for (const [taskKey, scheduledTask] of activeTasks) {
        this.resourceManager.releaseResources(scheduledTask.resources);
        this.activeTasks.delete(taskKey);
      }

      // Remove schedule
      this.scheduledWorkflows.delete(workflowId);

      this.errorManager.handleError(
        new Error(`Workflow tasks cancelled: ${workflowId}`),
        "TaskScheduler.cancelWorkflowTasks",
        {
          component: "TaskScheduler",
          operation: "cancelWorkflowTasks",
          timestamp: new Date(),
          metadata: { workflowId },
        },
      );
    } catch (error) {
      this.errorManager.handleError(
        error,
        `Failed to cancel workflow tasks: ${workflowId}`,
        {
          component: "TaskScheduler",
          operation: "cancelWorkflowTasks",
          timestamp: new Date(),
          metadata: { workflowId },
        },
      );
    }
  }

  /**
   * Get scheduler statistics
   */
  getSchedulerStats(): {
    scheduledWorkflows: number;
    activeTasks: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      availableSlots: number;
    };
  } {
    return {
      scheduledWorkflows: this.scheduledWorkflows.size,
      activeTasks: this.activeTasks.size,
      resourceUtilization: this.resourceManager.getResourceUtilization(),
    };
  }

  /**
   * Shutdown the scheduler
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Cancel all scheduled workflows
    const workflowIds = Array.from(this.scheduledWorkflows.keys());
    await Promise.all(workflowIds.map((id) => this.cancelWorkflowTasks(id)));

    // Shutdown resource manager
    this.resourceManager.shutdown();

    this.scheduledWorkflows.clear();
    this.activeTasks.clear();
  }

  /**
   * Create execution schedule for a workflow
   */
  private async createExecutionSchedule(workflow: Workflow): Promise<Schedule> {
    // Resolve dependencies
    const resolvedTasks = this.dependencyResolver.resolveDependencies(
      workflow.tasks,
      workflow.dependencies,
    );

    // Estimate task durations
    const tasksWithEstimates = await this.estimateTaskDurations(resolvedTasks);

    // Allocate resources
    const tasksWithResources = await this.allocateResources(tasksWithEstimates);

    // Calculate optimal schedule
    const scheduledTasks =
      await this.calculateOptimalSchedule(tasksWithResources);

    // Calculate total metrics
    const totalTime = this.calculateTotalTime(scheduledTasks);
    const parallelTasks = this.calculateMaxParallelTasks(scheduledTasks);
    const resourceUsage = this.calculateTotalResourceUsage(scheduledTasks);

    return {
      workflowId: workflow.id,
      tasks: scheduledTasks,
      totalTime,
      parallelTasks,
      resourceUsage,
      createdAt: new Date(),
    };
  }

  /**
   * Estimate task durations based on historical data and task type
   */
  private async estimateTaskDurations(
    tasks: Task[],
  ): Promise<Array<Task & { estimatedDuration: number }>> {
    return tasks.map((task) => ({
      ...task,
      estimatedDuration: this.getTaskDurationEstimate(task),
    }));
  }

  /**
   * Get duration estimate for a task
   */
  private getTaskDurationEstimate(task: Task): number {
    const baseDurations: Record<TaskType, number> = {
      [TaskType.ISSUE_ANALYSIS]: 5000, // 5 seconds
      [TaskType.AUTONOMOUS_RESOLUTION]: 15000, // 15 seconds
      [TaskType.CODE_REVIEW]: 8000, // 8 seconds
      [TaskType.PR_GENERATION]: 6000, // 6 seconds
      [TaskType.NOTIFICATION]: 1000, // 1 second
      [TaskType.CLEANUP]: 2000, // 2 seconds
    };

    return baseDurations[task.type] || 5000;
  }

  /**
   * Allocate resources for tasks
   */
  private async allocateResources(
    tasks: Array<Task & { estimatedDuration: number }>,
  ): Promise<
    Array<Task & { estimatedDuration: number; resources: ResourceAllocation }>
  > {
    return tasks.map((task) => ({
      ...task,
      resources: this.calculateTaskResources(task),
    }));
  }

  /**
   * Calculate resources needed for a task
   */
  private calculateTaskResources(
    task: Task & { estimatedDuration: number },
  ): ResourceAllocation {
    const baseResources: Record<TaskType, ResourceAllocation> = {
      [TaskType.ISSUE_ANALYSIS]: {
        taskId: task.id,
        cpu: 0.5,
        memory: 256,
        priority: ResourcePriority.NORMAL,
        constraints: [],
      },
      [TaskType.AUTONOMOUS_RESOLUTION]: {
        taskId: task.id,
        cpu: 1.0,
        memory: 512,
        priority: ResourcePriority.HIGH,
        constraints: [],
      },
      [TaskType.CODE_REVIEW]: {
        taskId: task.id,
        cpu: 0.3,
        memory: 128,
        priority: ResourcePriority.NORMAL,
        constraints: [],
      },
      [TaskType.PR_GENERATION]: {
        taskId: task.id,
        cpu: 0.4,
        memory: 256,
        priority: ResourcePriority.NORMAL,
        constraints: [],
      },
      [TaskType.NOTIFICATION]: {
        taskId: task.id,
        cpu: 0.1,
        memory: 64,
        priority: ResourcePriority.LOW,
        constraints: [],
      },
      [TaskType.CLEANUP]: {
        taskId: task.id,
        cpu: 0.2,
        memory: 128,
        priority: ResourcePriority.LOW,
        constraints: [],
      },
    };

    return (
      baseResources[task.type] || {
        taskId: task.id,
        cpu: 0.5,
        memory: 256,
        priority: ResourcePriority.NORMAL,
        constraints: [],
      }
    );
  }

  /**
   * Calculate optimal schedule
   */
  private async calculateOptimalSchedule(
    tasks: Array<
      Task & { estimatedDuration: number; resources: ResourceAllocation }
    >,
  ): Promise<ScheduledTask[]> {
    const scheduledTasks: ScheduledTask[] = [];
    const completedTasks = new Set<string>();
    let currentTime = new Date();

    // Simple greedy scheduling - can be enhanced with more sophisticated algorithms
    while (completedTasks.size < tasks.length) {
      // Find tasks ready to execute
      const readyTasks = tasks.filter(
        (task) =>
          !completedTasks.has(task.id) &&
          task.dependencies.every((depId) => completedTasks.has(depId)),
      );

      if (readyTasks.length === 0) {
        throw new Error("Circular dependency detected in workflow tasks");
      }

      // Sort by priority and estimated duration
      readyTasks.sort((a, b) => {
        // Higher priority first
        if (a.resources.priority !== b.resources.priority) {
          const priorityOrder = {
            [ResourcePriority.CRITICAL]: 4,
            [ResourcePriority.HIGH]: 3,
            [ResourcePriority.NORMAL]: 2,
            [ResourcePriority.LOW]: 1,
          };
          return (
            priorityOrder[b.resources.priority] -
            priorityOrder[a.resources.priority]
          );
        }
        // Shorter duration first for better throughput
        return a.estimatedDuration - b.estimatedDuration;
      });

      // Schedule as many parallel tasks as resources allow
      let availableResources = this.resourceManager.getAvailableResources();
      let batchScheduled = 0;

      for (const task of readyTasks) {
        if (
          this.resourceManager.canAllocateResources(
            task.resources,
            availableResources,
          )
        ) {
          const scheduledTask: ScheduledTask = {
            task,
            scheduledTime: new Date(currentTime.getTime()),
            priority: this.getTaskPriority(task),
            dependencies: task.dependencies,
            estimatedDuration: task.estimatedDuration,
            resources: task.resources,
          };

          scheduledTasks.push(scheduledTask);
          completedTasks.add(task.id);

          // Update available resources
          availableResources = this.resourceManager.simulateAllocation(
            task.resources,
            availableResources,
          );
          batchScheduled++;

          // Limit parallel tasks per batch
          if (batchScheduled >= 3) break;
        }
      }

      if (batchScheduled === 0) {
        // Wait for resources to become available
        const minDuration = Math.min(
          ...readyTasks.map((t) => t.estimatedDuration),
        );
        currentTime = new Date(currentTime.getTime() + minDuration);
      } else {
        // Advance time by the shortest task in the batch
        const batchDurations = readyTasks
          .filter((t) => completedTasks.has(t.id))
          .map((t) => t.estimatedDuration);

        if (batchDurations.length > 0) {
          const minBatchDuration = Math.min(...batchDurations);
          currentTime = new Date(currentTime.getTime() + minBatchDuration);
        }
      }
    }

    return scheduledTasks;
  }

  /**
   * Get task priority for scheduling
   */
  private getTaskPriority(
    task: Task & { estimatedDuration: number; resources: ResourceAllocation },
  ): number {
    const priorityWeights = {
      [ResourcePriority.CRITICAL]: 100,
      [ResourcePriority.HIGH]: 75,
      [ResourcePriority.NORMAL]: 50,
      [ResourcePriority.LOW]: 25,
    };

    return priorityWeights[task.resources.priority] || 50;
  }

  /**
   * Calculate total execution time
   */
  private calculateTotalTime(scheduledTasks: ScheduledTask[]): number {
    if (scheduledTasks.length === 0) return 0;

    const endTime = Math.max(
      ...scheduledTasks.map(
        (t) => t.scheduledTime.getTime() + t.estimatedDuration,
      ),
    );
    const startTime = Math.min(
      ...scheduledTasks.map((t) => t.scheduledTime.getTime()),
    );

    return endTime - startTime;
  }

  /**
   * Calculate maximum parallel tasks
   */
  private calculateMaxParallelTasks(scheduledTasks: ScheduledTask[]): number {
    let maxParallel = 0;

    for (let i = 0; i < scheduledTasks.length; i++) {
      const task = scheduledTasks[i];
      const taskEnd = task.scheduledTime.getTime() + task.estimatedDuration;

      let currentParallel = 1;
      for (let j = 0; j < scheduledTasks.length; j++) {
        if (i === j) continue;

        const otherTask = scheduledTasks[j];
        const otherStart = otherTask.scheduledTime.getTime();
        const otherEnd =
          otherTask.scheduledTime.getTime() + otherTask.estimatedDuration;

        // Check if tasks overlap
        if (otherStart < taskEnd && otherEnd > task.scheduledTime.getTime()) {
          currentParallel++;
        }
      }

      maxParallel = Math.max(maxParallel, currentParallel);
    }

    return maxParallel;
  }

  /**
   * Calculate total resource usage
   */
  private calculateTotalResourceUsage(
    scheduledTasks: ScheduledTask[],
  ): ResourceAllocation {
    return scheduledTasks.reduce(
      (total, scheduledTask) => ({
        taskId: "total",
        cpu: total.cpu + scheduledTask.resources.cpu,
        memory: total.memory + scheduledTask.resources.memory,
        priority: ResourcePriority.NORMAL,
        constraints: [],
      }),
      {
        taskId: "total",
        cpu: 0,
        memory: 0,
        priority: ResourcePriority.NORMAL,
        constraints: [],
      },
    );
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesSatisfied(
    scheduledTask: ScheduledTask,
    workflowId: string,
  ): boolean {
    return scheduledTask.dependencies.every((depId) => {
      const depKey = `${workflowId}-${depId}`;
      return !this.activeTasks.has(depKey); // Dependency is not running, so it must be completed
    });
  }

  /**
   * Update task duration estimate based on actual execution time
   */
  private updateTaskDurationEstimate(
    taskId: string,
    actualDuration: number,
  ): void {
    // This would integrate with a learning system to improve estimates
    // For now, just log the data
    console.log(`Task ${taskId} actual duration: ${actualDuration}ms`);
  }
}

/**
 * Resource Manager
 *
 * Manages resource allocation and utilization
 */
export class ResourceManager {
  private totalResources: {
    cpu: number;
    memory: number;
    maxConcurrentTasks: number;
  };
  private allocatedResources: {
    cpu: number;
    memory: number;
    tasks: Set<string>;
  };

  constructor(maxConcurrentTasks: number = 10) {
    this.totalResources = {
      cpu: 4.0, // 4 CPU cores
      memory: 4096, // 4GB memory
      maxConcurrentTasks,
    };
    this.allocatedResources = {
      cpu: 0,
      memory: 0,
      tasks: new Set(),
    };
  }

  /**
   * Check if resources are available
   */
  areResourcesAvailable(resources: ResourceAllocation): boolean {
    return (
      this.allocatedResources.cpu + resources.cpu <= this.totalResources.cpu &&
      this.allocatedResources.memory + resources.memory <=
        this.totalResources.memory &&
      this.allocatedResources.tasks.size <
        this.totalResources.maxConcurrentTasks
    );
  }

  /**
   * Check if resources can be allocated from a specific pool
   */
  canAllocateResources(
    resources: ResourceAllocation,
    available: { cpu: number; memory: number },
  ): boolean {
    return (
      available.cpu >= resources.cpu && available.memory >= resources.memory
    );
  }

  /**
   * Allocate resources
   */
  allocateResources(resources: ResourceAllocation): void {
    this.allocatedResources.cpu += resources.cpu;
    this.allocatedResources.memory += resources.memory;
    this.allocatedResources.tasks.add(resources.taskId);
  }

  /**
   * Release resources
   */
  releaseResources(resources: ResourceAllocation): void {
    this.allocatedResources.cpu = Math.max(
      0,
      this.allocatedResources.cpu - resources.cpu,
    );
    this.allocatedResources.memory = Math.max(
      0,
      this.allocatedResources.memory - resources.memory,
    );
    this.allocatedResources.tasks.delete(resources.taskId);
  }

  /**
   * Get available resources
   */
  getAvailableResources(): { cpu: number; memory: number } {
    return {
      cpu: this.totalResources.cpu - this.allocatedResources.cpu,
      memory: this.totalResources.memory - this.allocatedResources.memory,
    };
  }

  /**
   * Simulate resource allocation
   */
  simulateAllocation(
    resources: ResourceAllocation,
    available: { cpu: number; memory: number },
  ): { cpu: number; memory: number } {
    return {
      cpu: available.cpu - resources.cpu,
      memory: available.memory - resources.memory,
    };
  }

  /**
   * Get resource utilization
   */
  getResourceUtilization(): {
    cpu: number;
    memory: number;
    availableSlots: number;
  } {
    return {
      cpu: this.allocatedResources.cpu / this.totalResources.cpu,
      memory: this.allocatedResources.memory / this.totalResources.memory,
      availableSlots:
        this.totalResources.maxConcurrentTasks -
        this.allocatedResources.tasks.size,
    };
  }

  /**
   * Shutdown resource manager
   */
  shutdown(): void {
    this.allocatedResources.cpu = 0;
    this.allocatedResources.memory = 0;
    this.allocatedResources.tasks.clear();
  }
}

/**
 * Dependency Resolver
 *
 * Resolves task dependencies and detects circular dependencies
 */
export class DependencyResolver {
  /**
   * Resolve dependencies and order tasks
   */
  resolveDependencies(tasks: Task[], dependencies: Dependency[]): Task[] {
    // Create dependency map
    const dependencyMap = new Map<string, string[]>();
    const taskMap = new Map<string, Task>();

    // Initialize task map
    for (const task of tasks) {
      taskMap.set(task.id, task);
      dependencyMap.set(task.id, task.dependencies);
    }

    // Add additional dependencies from dependency definitions
    for (const dep of dependencies) {
      if (dep.type === DependencyType.FINISH_TO_START) {
        const currentDeps = dependencyMap.get(dep.targetTaskId) || [];
        currentDeps.push(dep.sourceTaskId);
        dependencyMap.set(dep.targetTaskId, currentDeps);
      }
    }

    // Topological sort
    return this.topologicalSort(Array.from(taskMap.values()), dependencyMap);
  }

  /**
   * Topological sort to resolve dependencies
   */
  private topologicalSort(
    tasks: Task[],
    dependencyMap: Map<string, string[]>,
  ): Task[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Task[] = [];

    const visit = (taskId: string): void => {
      if (visiting.has(taskId)) {
        throw new Error(
          `Circular dependency detected involving task: ${taskId}`,
        );
      }

      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);

      const dependencies = dependencyMap.get(taskId) || [];
      for (const depId of dependencies) {
        visit(depId);
      }

      visiting.delete(taskId);
      visited.add(taskId);

      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        result.push(task);
      }
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    }

    return result;
  }
}
