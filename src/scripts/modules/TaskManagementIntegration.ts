/**
 * Task Management Integration for GitHub Issues Reviewer System
 *
 * This module integrates the AI-powered GitHub Issues Reviewer with the main
 * task management system, providing endpoints for task creation, assignment,
 * progress tracking, and automation triggers.
 */

import { GitHubIssuesReviewer } from './github-issues/GitHubIssuesReviewer';
import { WorkflowOrchestrator } from './github-issues/WorkflowOrchestrator';
import { TaskManager, TaskInfo } from './TaskManager';
import { AutomationTriggersManager, AutomationEvent } from './AutomationTriggers';
import { MonitoringReportingManager } from './MonitoringReporting';

export interface TaskManagementConfig {
  enableAutomation: boolean;
  autoAssignment: boolean;
  progressTracking: boolean;
  reportingEnabled: boolean;
  webhookEndpoints: string[];
}

// Re-export TaskInfo from TaskManager
export type { TaskInfo } from './TaskManager';

export interface AutomationTrigger {
  event: string;
  condition: string;
  action: string;
  enabled: boolean;
}

/**
 * Main Task Management Integration Class
 */
export class TaskManagementIntegration {
  private config: TaskManagementConfig;
  private reviewer: GitHubIssuesReviewer;
  private orchestrator: WorkflowOrchestrator;
  private taskManager: TaskManager;
  private automationTriggers: AutomationTrigger[] = [];
  private automationManager: AutomationTriggersManager;
  private monitoringManager: MonitoringReportingManager;

  constructor(config: TaskManagementConfig) {
    this.config = config;
    this.reviewer = new GitHubIssuesReviewer();
    this.orchestrator = new WorkflowOrchestrator();
    this.taskManager = new TaskManager();
    this.automationManager = new AutomationTriggersManager();
    this.monitoringManager = new MonitoringReportingManager(this.automationManager);
    this.initializeAutomationTriggers();
  }

  /**
   * Initialize default automation triggers
   */
  private initializeAutomationTriggers(): void {
    this.automationTriggers = [
      {
        event: 'issue.created',
        condition: 'labels.includes("bug") && priority === "high"',
        action: 'auto-assign-to-senior-dev',
        enabled: this.config.autoAssignment,
      },
      {
        event: 'workflow.completed',
        condition: 'result.success === true',
        action: 'update-task-status',
        enabled: this.config.progressTracking,
      },
      {
        event: 'workflow.failed',
        condition: 'result.error === "human_intervention_required"',
        action: 'create-escalation-task',
        enabled: this.config.enableAutomation,
      },
      {
        event: 'task.updated',
        condition: 'status === "completed"',
        action: 'generate-completion-report',
        enabled: this.config.reportingEnabled,
      },
    ];
  }

  /**
   * Create a new task from GitHub issue
   */
  async createTaskFromIssue(issueNumber: number): Promise<TaskInfo> {
    try {
      // Analyze the issue
      const analysis = await this.reviewer.analyzeIssue(issueNumber);

      // Create task object
      const task: TaskInfo = {
        id: `task-${issueNumber}-${Date.now()}`,
        title: analysis.title,
        description: analysis.description,
        priority: this.mapPriority(analysis.priority),
        status: 'pending',
        labels: analysis.labels,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          issueNumber,
          analysis: analysis.analysis,
          estimatedComplexity: analysis.complexity,
          suggestedApproach: analysis.suggestedApproach,
        },
      };

      // Save task
      await this.taskManager.saveTask(task);

      // Trigger automation if enabled
      if (this.config.enableAutomation) {
        await this.triggerAutomation('issue.created', task);
      }

      return task;
    } catch (error) {
      console.error('Failed to create task from issue:', error);
      throw error;
    }
  }

  /**
   * Assign task to team member
   */
  async assignTask(taskId: string, assignee: string): Promise<TaskInfo> {
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.assignee = assignee;
    task.status = 'in_progress';
    task.updatedAt = new Date();

    await this.taskManager.updateTask(task);
    await this.triggerAutomation('task.assigned', task);

    return task;
  }

  /**
   * Process task with AI workflow
   */
  async processTask(taskId: string): Promise<any> {
    const task = await this.taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    try {
      // Update task status
      task.status = 'in_progress';
      task.updatedAt = new Date();
      await this.taskManager.updateTask(task);

      // Run workflow
      const result = await this.orchestrator.processIssue(task.metadata.issueNumber);

      // Update task based on result
      if (result.success) {
        task.status = 'completed';
        task.metadata.result = result;
      } else {
        task.status = 'blocked';
        task.metadata.error = result.error;
      }

      task.updatedAt = new Date();
      await this.taskManager.updateTask(task);

      // Trigger automation
      await this.triggerAutomation(result.success ? 'workflow.completed' : 'workflow.failed', task);

      return result;
    } catch (error) {
      task.status = 'blocked';
      task.metadata.error = error;
      task.updatedAt = new Date();
      await this.taskManager.updateTask(task);

      await this.triggerAutomation('workflow.failed', task);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(): Promise<any> {
    const tasks = await this.taskManager.getAllTasks();

    const stats = {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
      },
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length,
      },
      averageCompletionTime: this.calculateAverageCompletionTime(tasks),
      successRate: this.calculateSuccessRate(tasks),
    };

    return stats;
  }

  /**
   * Trigger automation based on event and conditions
   */
  private async triggerAutomation(event: string, task: TaskInfo): Promise<void> {
    if (!this.config.enableAutomation) return;

    const applicableTriggers = this.automationTriggers.filter(
      trigger => trigger.enabled && trigger.event === event
    );

    for (const trigger of applicableTriggers) {
      if (this.evaluateCondition(trigger.condition, task)) {
        await this.executeAction(trigger.action, task);
      }
    }
  }

  /**
   * Evaluate trigger condition
   */
  private evaluateCondition(condition: string, task: TaskInfo): boolean {
    try {
      // Simple condition evaluation - in production, use a safer expression parser
      const context = {
        task,
        labels: task.labels,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
      };

      // Basic condition matching (this is simplified for safety)
      if (condition.includes('labels.includes("bug")')) {
        return task.labels.includes('bug');
      }
      if (condition.includes('priority === "high"')) {
        return task.priority === 'high';
      }
      if (condition.includes('status === "completed"')) {
        return task.status === 'completed';
      }

      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Execute automation action
   */
  private async executeAction(action: string, task: TaskInfo): Promise<void> {
    switch (action) {
      case 'auto-assign-to-senior-dev':
        // Implementation for auto-assignment
        console.log(`Auto-assigning task ${task.id} to senior developer`);
        break;

      case 'update-task-status':
        // Status is already updated in the calling method
        break;

      case 'create-escalation-task':
        await this.createEscalationTask(task);
        break;

      case 'generate-completion-report':
        await this.generateCompletionReport(task);
        break;

      default:
        console.warn(`Unknown automation action: ${action}`);
    }
  }

  /**
   * Create escalation task for blocked issues
   */
  private async createEscalationTask(originalTask: TaskInfo): Promise<void> {
    const escalationTask: TaskInfo = {
      id: `escalation-${originalTask.id}-${Date.now()}`,
      title: `Escalation: ${originalTask.title}`,
      description: `Original task ${originalTask.id} requires human intervention. Error: ${originalTask.metadata.error}`,
      priority: 'high',
      status: 'pending',
      labels: ['escalation', 'human-intervention-required'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        originalTaskId: originalTask.id,
        escalationReason: originalTask.metadata.error,
      },
    };

    await this.taskManager.saveTask(escalationTask);
  }

  /**
   * Generate completion report
   */
  private async generateCompletionReport(task: TaskInfo): Promise<void> {
    const report = {
      taskId: task.id,
      title: task.title,
      completedAt: new Date(),
      duration: this.calculateTaskDuration(task),
      result: task.metadata.result,
      complexity: task.metadata.estimatedComplexity,
      success: task.status === 'completed',
    };

    // Save report (implementation depends on your reporting system)
    console.log('Completion report generated:', report);
  }

  /**
   * Map analysis priority to task priority
   */
  private mapPriority(analysisPriority: string): TaskInfo['priority'] {
    switch (analysisPriority.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Calculate average completion time
   */
  private calculateAverageCompletionTime(tasks: TaskInfo[]): number {
    const completedTasks = tasks.filter((t: TaskInfo) => t.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + this.calculateTaskDuration(task);
    }, 0);

    return totalTime / completedTasks.length;
  }

  /**
   * Calculate task duration in hours
   */
  private calculateTaskDuration(task: TaskInfo): number {
    const endTime = task.status === 'completed' ? task.updatedAt : new Date();
    return (endTime.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(tasks: TaskInfo[]): number {
    const processedTasks = tasks.filter(
      (t: TaskInfo) => t.status === 'completed' || t.status === 'blocked'
    );

    if (processedTasks.length === 0) return 0;

    const successfulTasks = processedTasks.filter((t: TaskInfo) => t.status === 'completed');
    return (successfulTasks.length / processedTasks.length) * 100;
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    const stats = await this.getTaskStatistics();
    const systemHealth = {
      overall: 'healthy' as 'healthy' | 'warning' | 'critical',
      issues: [] as string[],
      metrics: {
        taskProcessingRate: stats.successRate,
        averageProcessingTime: stats.averageCompletionTime,
        activeTasks: stats.byStatus.in_progress + stats.byStatus.pending,
        blockedTasks: stats.byStatus.blocked,
      },
    };

    // Determine overall health
    if (stats.successRate < 50) {
      systemHealth.overall = 'critical';
      systemHealth.issues = [...systemHealth.issues, 'Low success rate'];
    } else if (stats.successRate < 75) {
      systemHealth.overall = 'warning';
      systemHealth.issues = [...systemHealth.issues, 'Moderate success rate'];
    }

    if (stats.byStatus.blocked > stats.total * 0.2) {
      systemHealth.overall = 'warning';
      systemHealth.issues = [...systemHealth.issues, 'High number of blocked tasks'];
    }

    return systemHealth;
  }

  /**
   * Get automation manager instance
   */
  getAutomationManager(): AutomationTriggersManager {
    return this.automationManager;
  }

  /**
   * Get monitoring manager instance
   */
  getMonitoringManager(): MonitoringReportingManager {
    return this.monitoringManager;
  }
}
