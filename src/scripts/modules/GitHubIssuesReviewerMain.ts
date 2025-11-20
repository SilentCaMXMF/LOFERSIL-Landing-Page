/**
 * Main Integration for GitHub Issues Reviewer System
 *
 * This file integrates the AI-powered GitHub Issues Reviewer System
 * with the main LOFERSIL landing page application.
 */

import { TaskManagementIntegration } from './TaskManagementIntegration';
import {
  createTaskManagementRouter,
  authenticateApiKey,
  logApiRequests,
  handleApiErrors,
} from './TaskManagementApi';

/**
 * Initialize GitHub Issues Reviewer System Integration
 */
export function initializeGitHubIssuesReviewerIntegration(app: any): void {
  // Configuration for the task management system
  const config = {
    enableAutomation: process.env.GITHUB_ISSUES_AUTO_ASSIGNMENT === 'true',
    autoAssignment: process.env.GITHUB_ISSUES_AUTO_ASSIGNMENT === 'true',
    progressTracking: process.env.GITHUB_ISSUES_PROGRESS_TRACKING !== 'false',
    reportingEnabled: process.env.GITHUB_ISSUES_REPORTING !== 'false',
    webhookEndpoints: ['/api/webhooks/github', '/api/webhooks/task-updates'],
  };

  // Initialize the integration
  const integration = new TaskManagementIntegration(config);

  // Create API router
  const taskRouter = createTaskManagementRouter(integration);

  // Apply middleware
  app.use('/api', logApiRequests);
  app.use('/api', authenticateApiKey);
  app.use('/api', taskRouter);
  app.use(handleApiErrors);

  // Store integration reference for global access
  (global as any).githubIssuesIntegration = integration;

  console.log('✅ GitHub Issues Reviewer System integrated successfully');
  console.log('📊 Task management API available at /api/tasks');
  console.log('🔧 System health endpoint at /api/system/health');
  console.log('📈 Statistics endpoint at /api/tasks/statistics');
}

/**
 * Get the global GitHub Issues Reviewer integration instance
 */
export function getGitHubIssuesIntegration(): TaskManagementIntegration | null {
  return (global as any).githubIssuesIntegration || null;
}

/**
 * Setup scheduled tasks for the GitHub Issues Reviewer System
 */
export function setupScheduledTasks(): void {
  const integration = getGitHubIssuesIntegration();
  if (!integration) {
    console.warn('GitHub Issues Reviewer integration not found');
    return;
  }

  // Schedule system health check every 5 minutes
  setInterval(
    async () => {
      try {
        const health = await integration.getSystemHealth();
        if (health.overall !== 'healthy') {
          console.warn('⚠️ GitHub Issues Reviewer System health warning:', health.issues);
        }
      } catch (error) {
        console.error('❌ Error checking system health:', error);
      }
    },
    5 * 60 * 1000
  ); // 5 minutes

  // Schedule statistics update every hour
  setInterval(
    async () => {
      try {
        const stats = await integration.getTaskStatistics();
        console.log('📊 GitHub Issues Reviewer Statistics:', {
          total: stats.total,
          successRate: `${stats.successRate.toFixed(1)}%`,
          activeTasks: stats.byStatus.in_progress + stats.byStatus.pending,
          averageTime: `${stats.averageCompletionTime.toFixed(1)}h`,
        });
      } catch (error) {
        console.error('❌ Error updating statistics:', error);
      }
    },
    60 * 60 * 1000
  ); // 1 hour

  console.log('⏰ Scheduled tasks configured for GitHub Issues Reviewer System');
}

/**
 * Add GitHub Issues Reviewer System to main navigation
 */
export function addNavigationIntegration(): void {
  // This would typically be handled by your frontend framework
  // For now, we'll document the integration points

  const navigationItems = [
    {
      title: 'Task Management',
      path: '/admin/tasks',
      icon: 'tasks',
      description: 'Manage AI-powered GitHub issue resolution tasks',
    },
    {
      title: 'System Health',
      path: '/admin/system-health',
      icon: 'health',
      description: 'Monitor GitHub Issues Reviewer system status',
    },
    {
      title: 'Automation',
      path: '/admin/automation',
      icon: 'automation',
      description: 'Configure automation triggers and workflows',
    },
    {
      title: 'Reports',
      path: '/admin/reports',
      icon: 'reports',
      description: 'View completion reports and analytics',
    },
  ];

  console.log('🧭 Navigation integration points:', navigationItems);
}

/**
 * Export integration utilities for the main application
 */
export const GitHubIssuesReviewerUtils = {
  initialize: initializeGitHubIssuesReviewerIntegration,
  getInstance: getGitHubIssuesIntegration,
  setupScheduledTasks,
  addNavigationIntegration,
};

/**
 * Type definitions for the main application integration
 */
export interface MainAppIntegration {
  githubIssuesReviewer: {
    enabled: boolean;
    apiEndpoints: {
      tasks: string;
      statistics: string;
      health: string;
      webhooks: string[];
    };
    navigation: Array<{
      title: string;
      path: string;
      icon: string;
      description: string;
    }>;
    scheduledTasks: {
      healthCheck: number; // interval in ms
      statisticsUpdate: number; // interval in ms
    };
  };
}

/**
 * Environment variable configuration
 */
export const ENVIRONMENT_VARIABLES = {
  GITHUB_ISSUES_REVIEWER_API_KEY: 'API key for securing task management endpoints',
  GITHUB_ISSUES_AUTO_ASSIGNMENT: 'Enable automatic task assignment (true/false)',
  GITHUB_ISSUES_PROGRESS_TRACKING: 'Enable progress tracking (true/false)',
  GITHUB_ISSUES_REPORTING: 'Enable reporting features (true/false)',
  GITHUB_TOKEN: 'GitHub token for accessing issues and repositories',
  OPENAI_API_KEY: 'OpenAI API key for AI-powered analysis and resolution',
};

/**
 * Default configuration for development and production
 */
export const DEFAULT_CONFIG = {
  development: {
    enableAutomation: true,
    autoAssignment: false,
    progressTracking: true,
    reportingEnabled: true,
    logLevel: 'debug',
  },
  production: {
    enableAutomation: true,
    autoAssignment: true,
    progressTracking: true,
    reportingEnabled: true,
    logLevel: 'info',
  },
};
