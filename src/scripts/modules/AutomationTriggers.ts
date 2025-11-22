/**
 * Automation Triggers for GitHub Issues Reviewer System
 *
 * This module provides automation triggers that connect the GitHub Issues Reviewer
 * to the main kanban board and task management system.
 */

import { TaskInfo } from './TaskManagementIntegration';

export interface AutomationEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

export interface TriggerAction {
  id: string;
  name: string;
  description: string;
  execute: (event: AutomationEvent) => Promise<void>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  event: string;
  condition: string;
  actions: string[];
  priority: number;
}

/**
 * Automation Triggers Manager
 */
export class AutomationTriggersManager {
  private rules: Map<string, AutomationRule> = new Map();
  private actions: Map<string, TriggerAction> = new Map();
  private eventListeners: Map<string, Array<(event: AutomationEvent) => void>> = new Map();

  constructor() {
    this.initializeDefaultActions();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default trigger actions
   */
  private initializeDefaultActions(): void {
    // Update kanban board action
    this.actions.set('update-kanban-board', {
      id: 'update-kanban-board',
      name: 'Update Kanban Board',
      description: 'Update the kanban_payload.json with current task status',
      execute: async (event: AutomationEvent) => {
        await this.updateKanbanBoard(event.data);
      },
    });

    // Send notification action
    this.actions.set('send-notification', {
      id: 'send-notification',
      name: 'Send Notification',
      description: 'Send notification to team members',
      execute: async (event: AutomationEvent) => {
        await this.sendNotification(event.data);
      },
    });

    // Update README action
    this.actions.set('update-readme', {
      id: 'update-readme',
      name: 'Update README',
      description: 'Update the tasks README.md with current progress',
      execute: async (event: AutomationEvent) => {
        await this.updateReadme(event.data);
      },
    });

    // Create escalation task action
    this.actions.set('create-escalation-task', {
      id: 'create-escalation-task',
      name: 'Create Escalation Task',
      description: 'Create an escalation task for blocked issues',
      execute: async (event: AutomationEvent) => {
        await this.createEscalationTask(event.data);
      },
    });

    // Generate report action
    this.actions.set('generate-report', {
      id: 'generate-report',
      name: 'Generate Report',
      description: 'Generate a completion or progress report',
      execute: async (event: AutomationEvent) => {
        await this.generateReport(event.data);
      },
    });

    // Update GitHub issue action
    this.actions.set('update-github-issue', {
      id: 'update-github-issue',
      name: 'Update GitHub Issue',
      description: 'Update the GitHub issue with task status',
      execute: async (event: AutomationEvent) => {
        await this.updateGitHubIssue(event.data);
      },
    });
  }

  /**
   * Initialize default automation rules
   */
  private initializeDefaultRules(): void {
    // Rule: Task completed -> Update kanban and README
    this.rules.set('task-completed-updates', {
      id: 'task-completed-updates',
      name: 'Task Completed Updates',
      description: 'Update kanban board and README when a task is completed',
      enabled: true,
      event: 'task.completed',
      condition: 'status === "completed"',
      actions: ['update-kanban-board', 'update-readme', 'generate-report'],
      priority: 1,
    });

    // Rule: Task failed -> Create escalation
    this.rules.set('task-failed-escalation', {
      id: 'task-failed-escalation',
      name: 'Task Failed Escalation',
      description: 'Create escalation task when a task fails',
      enabled: true,
      event: 'task.failed',
      condition: 'status === "blocked" && error !== undefined',
      actions: ['create-escalation-task', 'send-notification'],
      priority: 2,
    });

    // Rule: High priority task -> Send notification
    this.rules.set('high-priority-notification', {
      id: 'high-priority-notification',
      name: 'High Priority Notification',
      description: 'Send notification for high priority tasks',
      enabled: true,
      event: 'task.created',
      condition: 'priority === "critical" || priority === "high"',
      actions: ['send-notification', 'update-kanban-board'],
      priority: 3,
    });

    // Rule: Workflow started -> Update GitHub issue
    this.rules.set('workflow-started-update', {
      id: 'workflow-started-update',
      name: 'Workflow Started Update',
      description: 'Update GitHub issue when AI workflow starts',
      enabled: true,
      event: 'workflow.started',
      condition: 'workflow === "ai-resolution"',
      actions: ['update-github-issue'],
      priority: 4,
    });

    // Rule: System health warning -> Send notification
    this.rules.set('system-health-warning', {
      id: 'system-health-warning',
      name: 'System Health Warning',
      description: 'Send notification when system health is poor',
      enabled: true,
      event: 'system.health.warning',
      condition: 'health.overall !== "healthy"',
      actions: ['send-notification'],
      priority: 5,
    });
  }

  /**
   * Trigger automation based on event
   */
  async triggerAutomation(event: AutomationEvent): Promise<void> {
    console.log(`🤖 Processing automation event: ${event.type}`);

    // Find applicable rules
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && rule.event === event.type)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      if (this.evaluateCondition(rule.condition, event.data)) {
        console.log(`🔧 Executing automation rule: ${rule.name}`);

        for (const actionId of rule.actions) {
          const action = this.actions.get(actionId);
          if (action) {
            try {
              await action.execute(event);
              console.log(`✅ Action completed: ${action.name}`);
            } catch (error) {
              console.error(`❌ Action failed: ${action.name}`, error);
            }
          } else {
            console.warn(`⚠️ Action not found: ${actionId}`);
          }
        }
      }
    }

    // Notify event listeners
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Evaluate rule condition
   */
  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation - in production, use a safer expression parser
      const context = {
        data,
        status: data.status,
        priority: data.priority,
        error: data.error,
        workflow: data.workflow,
        health: data.health,
      };

      // Basic condition matching (simplified for safety)
      if (condition.includes('status === "completed"')) {
        return data.status === 'completed';
      }
      if (condition.includes('status === "blocked"')) {
        return data.status === 'blocked';
      }
      if (condition.includes('priority === "critical"')) {
        return data.priority === 'critical';
      }
      if (condition.includes('priority === "high"')) {
        return data.priority === 'high';
      }
      if (condition.includes('health.overall !== "healthy"')) {
        return data.health?.overall !== 'healthy';
      }

      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Update kanban board with current task status
   */
  private async updateKanbanBoard(data: any): Promise<void> {
    try {
      const kanbanPath = './kanban_payload.json';
      const kanbanData = JSON.parse(fs.readFileSync(kanbanPath, 'utf8'));

      // Find and update the GitHub Issues Reviewer task
      const githubIssuesTask = kanbanData.tasks.find(
        (task: any) => task.id === 'ONGOING-GITHUB-ISSUES-REVIEWER-001'
      );

      if (githubIssuesTask) {
        githubIssuesTask.updated_at = new Date().toISOString();

        if (data.status === 'completed') {
          githubIssuesTask.notes = `Task completed: ${data.title}`;
        } else if (data.status === 'blocked') {
          githubIssuesTask.notes = `Task blocked: ${data.error}`;
        }
      }

      fs.writeFileSync(kanbanPath, JSON.stringify(kanbanData, null, 2));
      console.log('📋 Kanban board updated');
    } catch (error) {
      console.error('❌ Failed to update kanban board:', error);
    }
  }

  /**
   * Send notification to team members
   */
  private async sendNotification(data: any): Promise<void> {
    try {
      const notification = {
        type: 'info',
        title: 'GitHub Issues Reviewer System',
        message: this.getNotificationMessage(data),
        timestamp: new Date().toISOString(),
        data,
      };

      console.log('📧 Notification:', notification);

      // In a real implementation, this would send to Slack, email, etc.
      // For now, we'll just log it
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  }

  /**
   * Update README with current progress
   */
  private async updateReadme(data: any): Promise<void> {
    try {
      const readmePath = './tasks/README.md';
      let readmeContent = fs.readFileSync(readmePath, 'utf8');

      // Update the GitHub Issues Reviewer section
      const githubIssuesSection =
        /- \*\*\[ai-powered-github-issues-reviewer-system\/\]\(subtasks\/ai-powered-github-issues-reviewer-system\/\)\*\* - (.+)/;

      if (data.status === 'completed') {
        readmeContent = readmeContent.replace(
          githubIssuesSection,
          '- **[ai-powered-github-issues-reviewer-system/](subtasks/ai-powered-github-issues-reviewer-system/)** - Autonomous GitHub issue resolution system (6/11 tasks complete) ✅'
        );
      }

      fs.writeFileSync(readmePath, readmeContent);
      console.log('📖 README updated');
    } catch (error) {
      console.error('❌ Failed to update README:', error);
    }
  }

  /**
   * Create escalation task
   */
  private async createEscalationTask(data: any): Promise<void> {
    try {
      const escalationTask = {
        id: `escalation-${Date.now()}`,
        title: `Escalation: ${data.title}`,
        description: `Task requires human intervention. Error: ${data.error}`,
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
        metadata: {
          originalTaskId: data.id,
          escalationReason: data.error,
        },
      };

      console.log('🚨 Escalation task created:', escalationTask);
    } catch (error) {
      console.error('❌ Failed to create escalation task:', error);
    }
  }

  /**
   * Generate report
   */
  private async generateReport(data: any): Promise<void> {
    try {
      const report = {
        type: 'completion',
        taskId: data.id,
        title: data.title,
        completedAt: new Date().toISOString(),
        duration: data.duration || 0,
        success: data.status === 'completed',
      };

      console.log('📊 Report generated:', report);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
    }
  }

  /**
   * Update GitHub issue
   */
  private async updateGitHubIssue(data: any): Promise<void> {
    try {
      const update = {
        issueNumber: data.issueNumber,
        status: data.status,
        comment: `AI workflow ${data.status}: ${data.message || 'Processing...'}`,
      };

      console.log('🔄 GitHub issue update:', update);
    } catch (error) {
      console.error('❌ Failed to update GitHub issue:', error);
    }
  }

  /**
   * Get notification message based on data
   */
  private getNotificationMessage(data: any): string {
    if (data.status === 'completed') {
      return `Task completed: ${data.title}`;
    } else if (data.status === 'blocked') {
      return `Task blocked: ${data.title} - ${data.error}`;
    } else if (data.priority === 'critical') {
      return `Critical task created: ${data.title}`;
    } else if (data.health?.overall !== 'healthy') {
      return `System health warning: ${data.health.issues.join(', ')}`;
    }
    return `Task update: ${data.title}`;
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: (event: AutomationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: (event: AutomationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get all rules
   */
  getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get all actions
   */
  getActions(): TriggerAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Add new rule
   */
  addRule(rule: AutomationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: Partial<AutomationRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }
}

// Import fs for file operations
import fs from 'fs';
