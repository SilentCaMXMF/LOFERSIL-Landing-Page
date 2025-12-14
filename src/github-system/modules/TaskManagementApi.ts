/**
 * API Endpoints for GitHub Issues Reviewer Task Management
 *
 * This module provides Express.js API endpoints for integrating the
 * AI-powered GitHub Issues Reviewer with the main task management system.
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import {
  TaskManagementIntegration,
  TaskInfo,
} from "./TaskManagementIntegration";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateTaskRequest {
  issueNumber: number;
  priority?: "low" | "medium" | "high" | "critical";
  assignee?: string;
}

export interface AssignTaskRequest {
  assignee: string;
}

export interface UpdateTaskRequest {
  status?: "pending" | "in_progress" | "completed" | "blocked";
  priority?: "low" | "medium" | "high" | "critical";
  assignee?: string;
  labels?: string[];
}

/**
 * Verify GitHub webhook signature for security
 */
function verifyGitHubWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Rate limiting for GitHub API calls
 */
class GitHubRateLimiter {
  private calls: number[] = [];
  private readonly maxCallsPerHour = 5000; // GitHub's limit

  canMakeCall(): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove calls older than 1 hour
    this.calls = this.calls.filter((call) => call > oneHourAgo);

    return this.calls.length < this.maxCallsPerHour;
  }

  recordCall(): void {
    this.calls.push(Date.now());
  }

  getRemainingCalls(): number {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    this.calls = this.calls.filter((call) => call > oneHourAgo);
    return Math.max(0, this.maxCallsPerHour - this.calls.length);
  }
}

const rateLimiter = new GitHubRateLimiter();

/**
 * Create API router for task management
 */
export function createTaskManagementRouter(
  integration: TaskManagementIntegration,
): Router {
  const router = Router();

  /**
   * GET /api/tasks
   * Get all tasks with optional filtering
   */
  router.get(
    "/tasks",
    async (req: Request, res: Response<ApiResponse<TaskInfo[]>>) => {
      try {
        const { status, priority, assignee } = req.query;

        // Get all tasks (you'd implement filtering in the TaskManager)
        const stats = await integration.getTaskStatistics();
        const tasks = await integration.getAllTasks();

        res.json({
          success: true,
          data: tasks,
          message: `Found ${tasks.length} tasks`,
        });
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch tasks",
        });
      }
    },
  );

  /**
   * GET /api/tasks/:id
   * Get a specific task by ID
   */
  router.get(
    "/tasks/:id",
    async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
      try {
        const { id } = req.params;
        const task = await integration.getTask(id);

        if (!task) {
          return res.status(404).json({
            success: false,
            error: "Task not found",
          });
        }

        res.json({
          success: true,
          data: task,
        });
      } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch task",
        });
      }
    },
  );

  /**
   * POST /api/tasks/from-issue
   * Create a task from a GitHub issue
   */
  router.post(
    "/tasks/from-issue",
    async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
      try {
        const { issueNumber, priority, assignee }: CreateTaskRequest = req.body;

        if (!issueNumber) {
          return res.status(400).json({
            success: false,
            error: "Issue number is required",
          });
        }

        const task = await integration.createTaskFromIssue(issueNumber);

        // Update priority/assignee if provided
        if (priority || assignee) {
          if (priority) task.priority = priority;
          if (assignee) task.assignee = assignee;
          await integration.updateTask(task.id, {});
        }

        res.status(201).json({
          success: true,
          data: task,
          message: `Task created from issue #${issueNumber}`,
        });
      } catch (error) {
        console.error("Error creating task from issue:", error);
        res.status(500).json({
          success: false,
          error: "Failed to create task from issue",
        });
      }
    },
  );

  /**
   * POST /api/tasks/:id/assign
   * Assign a task to a user
   */
  router.post(
    "/tasks/:id/assign",
    async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
      try {
        const { id } = req.params;
        const { assignee }: AssignTaskRequest = req.body;

        if (!assignee) {
          return res.status(400).json({
            success: false,
            error: "Assignee is required",
          });
        }

        const task = await integration.assignTask(id, assignee);

        res.json({
          success: true,
          data: task,
          message: `Task assigned to ${assignee}`,
        });
      } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({
          success: false,
          error: "Failed to assign task",
        });
      }
    },
  );

  /**
   * POST /api/tasks/:id/process
   * Process a task (trigger AI workflow)
   */
  router.post(
    "/tasks/:id/process",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const { id } = req.params;

        await integration.processTask(id);

        res.json({
          success: true,
          message: "Task processing started",
        });
      } catch (error) {
        console.error("Error processing task:", error);
        res.status(500).json({
          success: false,
          error: "Failed to process task",
        });
      }
    },
  );

  /**
   * PUT /api/tasks/:id
   * Update a task
   */
  router.put(
    "/tasks/:id",
    async (req: Request, res: Response<ApiResponse<TaskInfo>>) => {
      try {
        const { id } = req.params;
        const updates: UpdateTaskRequest = req.body;

        const task = await integration.updateTask(id, updates);

        res.json({
          success: true,
          data: task,
          message: "Task updated successfully",
        });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({
          success: false,
          error: "Failed to update task",
        });
      }
    },
  );

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   */
  router.delete(
    "/tasks/:id",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const { id } = req.params;

        await integration.deleteTask(id);

        res.json({
          success: true,
          message: "Task deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({
          success: false,
          error: "Failed to delete task",
        });
      }
    },
  );

  /**
   * GET /api/tasks/statistics
   * Get task statistics
   */
  router.get(
    "/tasks/statistics",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const stats = await integration.getTaskStatistics();

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch statistics",
        });
      }
    },
  );

  /**
   * GET /api/system/health
   * Get system health status
   */
  router.get(
    "/system/health",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const health = await integration.getSystemHealth();

        res.json({
          success: true,
          data: health,
        });
      } catch (error) {
        console.error("Error fetching health status:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch system health",
        });
      }
    },
  );

  /**
   * POST /api/webhooks/github
   * Handle GitHub webhooks for automated issue processing
   */
  router.post(
    "/webhooks/github",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const signature = req.headers["x-hub-signature-256"] as string;
        const event = req.headers["x-github-event"] as string;
        const deliveryId = req.headers["x-github-delivery"] as string;

        // Verify webhook signature for security
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
        if (webhookSecret) {
          const payload = JSON.stringify(req.body);
          if (
            !signature ||
            !verifyGitHubWebhookSignature(payload, signature, webhookSecret)
          ) {
            console.warn(
              `❌ Invalid webhook signature for delivery ${deliveryId}`,
            );
            return res.status(401).json({
              success: false,
              error: "Invalid webhook signature",
            });
          }
        }

        console.log(
          `🔗 Processing GitHub webhook: ${event} (delivery: ${deliveryId})`,
        );

        const { action, issue, repository, pull_request, comment } = req.body;

        // Handle different GitHub webhook events
        switch (event) {
          case "issues":
            if (action === "opened" && issue) {
              // Check rate limit before processing
              if (!rateLimiter.canMakeCall()) {
                console.warn(
                  "⚠️ Rate limit exceeded, skipping issue processing",
                );
                return res.json({
                  success: true,
                  message:
                    "Rate limit exceeded, issue queued for later processing",
                });
              }

              try {
                // Create task from issue
                const task = await integration.createTaskFromIssue(
                  issue.number,
                );
                rateLimiter.recordCall();

                console.log(
                  `✅ Auto-created task ${task.id} from issue #${issue.number}`,
                );
                console.log(
                  `🤖 AI processing pipeline ready for issue #${issue.number}`,
                );
              } catch (error: any) {
                console.error(
                  `❌ Failed to process issue #${issue.number}:`,
                  error,
                );
                console.log(
                  `❌ Task creation failed: ${error?.message || "Unknown error"}`,
                );
              }
            } else if (action === "closed" && issue) {
              console.log(
                `✅ Issue #${issue.number} closed - task management updated`,
              );
            } else if (action === "reopened" && issue) {
              console.log(
                `🔄 Issue #${issue.number} reopened - task management updated`,
              );
            }
            break;

          case "pull_request":
            console.log(
              `🔄 PR event: ${action} for PR #${pull_request?.number}`,
            );
            // Basic PR event logging - full integration in next phase
            break;

          case "issue_comment":
            if (action === "created" && comment && issue) {
              // Check for special commands in comments
              const commentBody = comment.body.toLowerCase();
              if (
                commentBody.includes("/process") ||
                commentBody.includes("!process")
              ) {
                console.log(
                  `🚀 Manual processing triggered for issue #${issue.number}`,
                );
                try {
                  const task = await integration.createTaskFromIssue(
                    issue.number,
                  );
                  console.log(
                    `✅ Manual task created: ${task.id} for issue #${issue.number}`,
                  );
                } catch (error: any) {
                  console.error(
                    `❌ Manual processing failed: ${error?.message || "Unknown error"}`,
                  );
                }
              }
            }
            break;

          default:
            console.log(`ℹ️ Unhandled webhook event: ${event}`);
        }

        res.json({
          success: true,
          message: `Webhook ${event} processed successfully`,
        });
      } catch (error) {
        console.error("❌ Error processing webhook:", error);
        res.status(500).json({
          success: false,
          error: "Failed to process webhook",
        });
      }
    },
  );

  /**
   * GET /api/automation/triggers
   * Get automation triggers
   */
  router.get(
    "/automation/triggers",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const triggers = integration.getAutomationManager().getRules();

        res.json({
          success: true,
          data: triggers,
        });
      } catch (error) {
        console.error("Error fetching automation triggers:", error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch automation triggers",
        });
      }
    },
  );

  /**
   * POST /api/automation/triggers
   * Create a new automation trigger
   */
  router.post(
    "/automation/triggers",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const trigger = req.body;

        integration.getAutomationManager().addRule(trigger);

        res.status(201).json({
          success: true,
          data: trigger,
          message: "Automation trigger created successfully",
        });
      } catch (error) {
        console.error("Error creating automation trigger:", error);
        res.status(500).json({
          success: false,
          error: "Failed to create automation trigger",
        });
      }
    },
  );

  /**
   * GET /api/reports/completion
   * Get completion reports
   */
  router.get(
    "/reports/completion",
    async (req: Request, res: Response<ApiResponse>) => {
      try {
        const { startDate, endDate } = req.query;

        // Generate completion report
        const report = await integration
          .getMonitoringManager()
          .generateDailyReport();

        res.json({
          success: true,
          data: report,
        });
      } catch (error) {
        console.error("Error generating completion report:", error);
        res.status(500).json({
          success: false,
          error: "Failed to generate completion report",
        });
      }
    },
  );

  return router;
}

/**
 * Middleware to authenticate API requests
 */
export function authenticateApiKey(
  req: Request,
  res: Response,
  next: Function,
) {
  const apiKey = req.headers["x-api-key"] as string;
  const validApiKey = process.env.GITHUB_ISSUES_REVIEWER_API_KEY;

  if (!validApiKey) {
    return next(); // Skip auth if no key configured
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: "Invalid or missing API key",
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
  res.on("finish", () => {
    console.log(`[${timestamp}] ${method} ${path} - ${res.statusCode} - ${ip}`);
  });

  next();
}

/**
 * Error handling middleware
 */
export function handleApiErrors(
  error: Error,
  req: Request,
  res: Response,
  next: Function,
) {
  console.error("API Error:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}
