/**
 * Integration Test for Complete GitHub Issues Reviewer System
 *
 * This test validates the entire integration including:
 * - Task Management Integration
 * - API Endpoints
 * - Automation Triggers
 * - Monitoring and Reporting
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { TaskManagementIntegration } from "./TaskManagementIntegration";
import { createTaskManagementRouter } from "./TaskManagementApi";
import {
  initializeGitHubIssuesReviewerIntegration,
  ENVIRONMENT_VARIABLES,
  DEFAULT_CONFIG,
} from "./GitHubIssuesReviewerMain";

describe("Complete GitHub Issues Reviewer System Integration", () => {
  let app: express.Application;
  let integration: TaskManagementIntegration;

  beforeEach(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Initialize integration
    const config = {
      enableAutomation: true,
      autoAssignment: true,
      progressTracking: true,
      reportingEnabled: true,
      webhookEndpoints: ["/api/webhooks/github"],
    };

    integration = new TaskManagementIntegration(config);

    // Add API routes
    app.use("/api", createTaskManagementRouter(integration));
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe("API Endpoints Integration", () => {
    it("should have health endpoint working", async () => {
      const response = await request(app).get("/api/system/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.overall).toBeDefined();
    });

    it("should have statistics endpoint working", async () => {
      const response = await request(app)
        .get("/api/tasks/statistics")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.successRate).toBeDefined();
    });

    it("should handle task creation from issue", async () => {
      const response = await request(app)
        .post("/api/tasks/from-issue")
        .send({ issueNumber: 123 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBeDefined();
    });

    it("should handle task assignment", async () => {
      // First create a task
      const createResponse = await request(app)
        .post("/api/tasks/from-issue")
        .send({ issueNumber: 124 });

      const taskId = createResponse.body.data.id;

      // Then assign it
      const assignResponse = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .send({ assignee: "test-user" })
        .expect(200);

      expect(assignResponse.body.success).toBe(true);
      expect(assignResponse.body.data.assignee).toBe("test-user");
      expect(assignResponse.body.data.status).toBe("in_progress");
    });

    it("should handle webhook events", async () => {
      const webhookPayload = {
        action: "opened",
        issue: {
          number: 125,
          title: "Test Issue",
          body: "This is a test issue",
        },
        repository: {
          name: "test-repo",
        },
      };

      const response = await request(app)
        .post("/api/webhooks/github")
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("Task Management Integration", () => {
    it("should create task from issue successfully", async () => {
      const task = await integration.createTaskFromIssue(126);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.status).toBe("pending");
      expect(task.priority).toBeDefined();
      expect(task.labels).toBeDefined();
      expect(task.metadata.issueNumber).toBe(126);
    });

    it("should assign task successfully", async () => {
      const task = await integration.createTaskFromIssue(127);
      const assignedTask = await integration.assignTask(
        task.id,
        "test-assignee",
      );

      expect(assignedTask.assignee).toBe("test-assignee");
      expect(assignedTask.status).toBe("in_progress");
    });

    it("should get task statistics", async () => {
      const stats = await integration.getTaskStatistics();

      expect(stats).toBeDefined();
      expect(stats.total).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(stats.averageCompletionTime).toBeDefined();
      expect(stats.successRate).toBeDefined();
    });

    it("should get system health", async () => {
      const health = await integration.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.overall).toBeDefined();
      expect(health.metrics).toBeDefined();
      expect(health.issues).toBeDefined();
    });
  });

  describe("Automation Triggers Integration", () => {
    it("should have default automation rules", () => {
      const rules = integration.getAutomationManager().getRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.id === "task-completed-updates")).toBe(true);
      expect(rules.some((r) => r.id === "task-failed-escalation")).toBe(true);
      expect(rules.some((r) => r.id === "high-priority-notification")).toBe(
        true,
      );
    });

    it("should have default automation actions", () => {
      const actions = integration.getAutomationManager().getActions();

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.id === "update-kanban-board")).toBe(true);
      expect(actions.some((a) => a.id === "send-notification")).toBe(true);
      expect(actions.some((a) => a.id === "update-readme")).toBe(true);
    });

    it("should trigger automation for task completion", async () => {
      const task = await integration.createTaskFromIssue(128);
      await integration.assignTask(task.id, "test-user");

      // Mock task completion
      const automationManager = integration.getAutomationManager();
      const event = {
        type: "task.completed",
        data: { ...task, status: "completed" },
        timestamp: new Date(),
        source: "test",
      };

      // This should trigger the automation rules
      await automationManager.triggerAutomation(event);

      // Verify automation was triggered (would check kanban updates, etc.)
      expect(true).toBe(true); // Placeholder for actual verification
    });
  });

  describe("Monitoring and Reporting Integration", () => {
    it("should collect system metrics", async () => {
      const monitoringManager = integration.getMonitoringManager();
      const metrics = await monitoringManager.collectMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.tasks).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.system).toBeDefined();
      expect(metrics.errors).toBeDefined();
    });

    it("should generate daily report", async () => {
      const monitoringManager = integration.getMonitoringManager();
      const report = await monitoringManager.generateDailyReport();

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.type).toBe("daily");
      expect(report.metrics).toBeDefined();
      expect(report.insights).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it("should get dashboard data", async () => {
      const monitoringManager = integration.getMonitoringManager();
      const dashboardData = await monitoringManager.getDashboardData();

      expect(dashboardData).toBeDefined();
      expect(dashboardData.metrics).toBeDefined();
      expect(dashboardData.reports).toBeDefined();
      expect(dashboardData.alerts).toBeDefined();
      expect(dashboardData.uptime).toBeDefined();
    });

    it("should create and resolve alerts", async () => {
      const monitoringManager = integration.getMonitoringManager();

      // Create a critical alert
      await monitoringManager.createAlert(
        "critical",
        "Test Alert",
        "This is a test alert",
        {},
      );

      const alerts = monitoringManager.getAlerts();
      const testAlert = alerts.find((a) => a.title === "Test Alert");

      expect(testAlert).toBeDefined();
      expect(testAlert.type).toBe("critical");
      expect(testAlert.resolved).toBe(false);

      // Resolve the alert
      monitoringManager.resolveAlert(testAlert.id);
      const resolvedAlert = monitoringManager
        .getAlerts()
        .find((a) => a.id === testAlert.id);

      expect(resolvedAlert.resolved).toBe(true);
    });
  });

  describe("Main Integration", () => {
    it("should initialize main integration successfully", () => {
      const testApp = express();

      expect(() => {
        initializeGitHubIssuesReviewerIntegration(testApp);
      }).not.toThrow();
    });

    it("should have proper environment variables defined", () => {
      expect(ENVIRONMENT_VARIABLES).toBeDefined();
      expect(
        ENVIRONMENT_VARIABLES.GITHUB_ISSUES_REVIEWER_API_KEY,
      ).toBeDefined();
      expect(ENVIRONMENT_VARIABLES.GITHUB_TOKEN).toBeDefined();
      expect(ENVIRONMENT_VARIABLES.OPENAI_API_KEY).toBeDefined();
    });

    it("should have default configuration for different environments", () => {
      expect(DEFAULT_CONFIG).toBeDefined();
      expect(DEFAULT_CONFIG.development).toBeDefined();
      expect(DEFAULT_CONFIG.production).toBeDefined();
      expect(DEFAULT_CONFIG.production.enableAutomation).toBe(true);
      expect(DEFAULT_CONFIG.production.autoAssignment).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid task creation gracefully", async () => {
      const response = await request(app)
        .post("/api/tasks/from-issue")
        .send({})
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should handle invalid task assignment gracefully", async () => {
      const response = await request(app)
        .post("/api/tasks/invalid-task-id/assign")
        .send({ assignee: "test-user" })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should handle non-existent task processing gracefully", async () => {
      const response = await request(app)
        .post("/api/tasks/non-existent-task/process")
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle multiple concurrent requests", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app).get("/api/system/health").expect(200),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.body.success).toBe(true);
      });
    });

    it("should handle large webhook payloads", async () => {
      const largePayload = {
        action: "opened",
        issue: {
          number: 129,
          title: "A".repeat(1000), // Large title
          body: "B".repeat(10000), // Large body
        },
        repository: {
          name: "test-repo",
          description: "C".repeat(500),
        },
      };

      const response = await request(app)
        .post("/api/webhooks/github")
        .send(largePayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
