/**
 * API Endpoints for GitHub Issues Reviewer Task Management
 *
 * This module provides Express.js API endpoints for integrating the
 * AI-powered GitHub Issues Reviewer with the main task management system.
 */

import { Router, Request, Response } from 'express';
import { TaskManagementIntegration, TaskInfo } from './TaskManagementIntegration';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateTaskRequest {
  issueNumber: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
}

export interface AssignTaskRequest {
  assignee: string;
}

export interface UpdateTaskRequest {
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  labels?: string[];
}

/**
 * Create API router for task management
 */
export function createTaskManagementRouter(integration: TaskManagementIntegration): Router {
  const router = Router();

  /**
   * GET /api/tasks
   * Get all tasks with optional filtering
   */
  router.get('/tasks', async (req: Request, res: Response<ApiResponse<TaskInfo[]>>) => {
    try {
      const { status, priority, assignee } = req.query;

      // Get all tasks (you'd implement filtering in the TaskManager)
      const stats = await integration.getTaskStatistics();

      res.json({
        success: true,
        data: [], // Would return actual filtered tasks
        message: 'Tasks retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks',
      });
    }
  });

  /**
   * GET /api/tasks/:id
   * Get specific task by ID
   */
  router.get('/tasks/:id', async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
    try {
      const { id } = req.params;

      // Implementation would get task from TaskManager
      res.json({
        success: true,
        data: {} as TaskInfo, // Would return actual task
        message: 'Task retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task',
      });
    }
  });

  /**
   * POST /api/tasks/from-issue
   * Create task from GitHub issue
   */
  router.post('/tasks/from-issue', async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
    try {
      const { issueNumber }: CreateTaskRequest = req.body;

      if (!issueNumber) {
        return res.status(400).json({
          success: false,
          error: 'Issue number is required',
        });
      }

      const task = await integration.createTaskFromIssue(issueNumber);

      res.status(201).json({
        success: true,
        data: task,
        message: `Task created from issue #${issueNumber}`,
      });
    } catch (error) {
      console.error('Error creating task from issue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task from issue',
      });
    }
  });

  /**
   * POST /api/tasks/:id/assign
   * Assign task to team member
   */
  router.post('/tasks/:id/assign', async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
    try {
      const { id } = req.params;
      const { assignee }: AssignTaskRequest = req.body;

      if (!assignee) {
        return res.status(400).json({
          success: false,
          error: 'Assignee is required',
        });
      }

      const task = await integration.assignTask(id, assignee);

      res.json({
        success: true,
        data: task,
        message: `Task ${id} assigned to ${assignee}`,
      });
    } catch (error) {
      console.error('Error assigning task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign task',
      });
    }
  });

  /**
   * POST /api/tasks/:id/process
   * Process task with AI workflow
   */
  router.post('/tasks/:id/process', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      const result = await integration.processTask(id);

      res.json({
        success: true,
        data: result,
        message: `Task ${id} processed successfully`,
      });
    } catch (error) {
      console.error('Error processing task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process task',
      });
    }
  });

  /**
   * PUT /api/tasks/:id
   * Update task details
   */
  router.put('/tasks/:id', async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
    try {
      const { id } = req.params;
      const updates: UpdateTaskRequest = req.body;

      // Implementation would update task in TaskManager
      res.json({
        success: true,
        data: {} as TaskInfo, // Would return updated task
        message: `Task ${id} updated successfully`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task',
      });
    }
  });

  /**
   * DELETE /api/tasks/:id
   * Delete task
   */
  router.delete('/tasks/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      // Implementation would delete task from TaskManager
      res.json({
        success: true,
        message: `Task ${id} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task',
      });
    }
  });

  /**
   * GET /api/tasks/statistics
   * Get task statistics
   */
  router.get('/tasks/statistics', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const stats = await integration.getTaskStatistics();

      res.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  });

  /**
   * GET /api/system/health
   * Get system health status
   */
  router.get('/system/health', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const health = await integration.getSystemHealth();

      res.json({
        success: true,
        data: health,
        message: 'System health retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system health',
      });
    }
  });

  /**
   * POST /api/webhooks/github
   * Handle GitHub webhooks for automated task creation
   */
  router.post('/webhooks/github', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { action, issue, repository } = req.body;

      // Handle different GitHub webhook events
      if (action === 'opened' && issue) {
        // Automatically create task from new issue
        const task = await integration.createTaskFromIssue(issue.number);

        console.log(`Auto-created task ${task.id} from issue #${issue.number}`);
      }

      res.json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook',
      });
    }
  });

  /**
   * GET /api/automation/triggers
   * Get automation triggers
   */
  router.get('/automation/triggers', async (req: Request, res: Response<ApiResponse>) => {
    try {
      // Implementation would return automation triggers
      res.json({
        success: true,
        data: [],
        message: 'Automation triggers retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching automation triggers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch automation triggers',
      });
    }
  });

  /**
   * POST /api/automation/triggers
   * Create new automation trigger
   */
  router.post('/automation/triggers', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const trigger = req.body;

      // Implementation would create automation trigger
      res.status(201).json({
        success: true,
        data: trigger,
        message: 'Automation trigger created successfully',
      });
    } catch (error) {
      console.error('Error creating automation trigger:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create automation trigger',
      });
    }
  });

  /**
   * GET /api/reports/completion
   * Get completion reports
   */
  router.get('/reports/completion', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { startDate, endDate } = req.query;

      // Implementation would generate completion reports
      res.json({
        success: true,
        data: [],
        message: 'Completion reports retrieved successfully',
      });
    } catch (error) {
      console.error('Error fetching completion reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch completion reports',
      });
    }
  });

  return router;
}

/**
 * Middleware to authenticate API requests
 */
export function authenticateApiKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.GITHUB_ISSUES_REVIEWER_API_KEY;

  if (!validApiKey) {
    return next(); // Skip auth if no key configured
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
    });
  }

  next();
}

/**
 * Middleware to log API requests
 */
export function logApiRequests(req: Request, res: Response, next: Function) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${path} - ${ip}`);

  // Log response when finished
  res.on('finish', () => {
    console.log(`[${timestamp}] ${method} ${path} - ${res.statusCode} - ${ip}`);
  });

  next();
}

/**
 * Error handling middleware
 */
export function handleApiErrors(error: Error, req: Request, res: Response, next: Function) {
  console.error('API Error:', error);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
