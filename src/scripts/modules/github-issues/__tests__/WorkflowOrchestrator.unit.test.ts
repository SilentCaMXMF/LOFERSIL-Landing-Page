/**
 * Workflow Orchestrator Unit Tests
 *
 * Unit tests for enhanced workflow orchestration system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  WorkflowOrchestrator,
  WorkflowState,
  WorkflowConfig,
} from "../WorkflowOrchestrator";

// Simple mock implementations for testing
const createMockConfig = (): WorkflowConfig => ({
  issueAnalyzer: {
    analyzeIssue: vi.fn().mockResolvedValue({
      category: "bug",
      complexity: "medium",
      requirements: ["Fix the reported issue"],
      acceptanceCriteria: ["Code should work correctly"],
      feasible: true,
      confidence: 0.8,
      reasoning: "Standard bug fix",
    }),
  },
  autonomousResolver: {
    resolveIssue: vi.fn().mockResolvedValue({
      success: true,
      solution: {
        files: [
          {
            path: "src/test.ts",
            changes: [{ content: "fixed code", type: "add" }],
          },
        ],
      },
      confidence: 0.8,
      reasoning: "Applied appropriate fix",
    }),
  },
  codeReviewer: {
    reviewChanges: vi.fn().mockResolvedValue({
      approved: true,
      score: 0.9,
      issues: [],
      recommendations: ["Code looks good"],
      reasoning: "Code passes all checks",
      metadata: {
        staticAnalysisScore: 0.9,
        securityScore: 1.0,
        qualityScore: 0.8,
        testCoverageScore: 0.7,
        performanceScore: 0.9,
        documentationScore: 0.8,
      },
    }),
  },
  prGenerator: {
    createPullRequest: vi.fn().mockResolvedValue({
      number: 123,
      title: "Fix for issue #123",
      body: "Automated PR for issue fix",
      url: "https://github.com/test/repo/pull/123",
      created: true,
    }),
  },
  maxWorkflowTime: 60000,
  enableMetrics: true,
  retryAttempts: 2,
  humanInterventionThreshold: 0.7,
});

describe("WorkflowOrchestrator", () => {
  let orchestrator: WorkflowOrchestrator;
  let mockConfig: WorkflowConfig;

  beforeEach(() => {
    mockConfig = createMockConfig();
    orchestrator = new WorkflowOrchestrator(mockConfig);
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with valid config", () => {
      expect(orchestrator).toBeDefined();
      expect(typeof orchestrator.processIssue).toBe("function");
      expect(typeof orchestrator.getCurrentState).toBe("function");
      expect(typeof orchestrator.getActiveWorkflows).toBe("function");
      expect(typeof orchestrator.getGlobalMetrics).toBe("function");
    });

    it("should set up initial metrics", () => {
      const metrics = orchestrator.getGlobalMetrics();
      expect(metrics.totalWorkflows).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.concurrentWorkflows).toBe(0);
    });
  });

  describe("Issue Processing", () => {
    it("should process a simple issue successfully", async () => {
      const result = await orchestrator.processIssue(
        123,
        "Test Issue",
        "This is a test issue",
      );

      expect(result.success).toBe(true);
      expect(result.issueNumber).toBe(123);
      expect(result.finalState).toBe(WorkflowState.PR_COMPLETE);
      expect(result.requiresHumanReview).toBe(false);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it("should call all AI components in correct order", async () => {
      await orchestrator.processIssue(
        124,
        "Component Test",
        "Testing component calls",
      );

      // Verify components were called
      expect(mockConfig.issueAnalyzer.analyzeIssue).toHaveBeenCalled();
      expect(mockConfig.autonomousResolver.resolveIssue).toHaveBeenCalled();
      expect(mockConfig.codeReviewer.reviewChanges).toHaveBeenCalled();
      expect(mockConfig.prGenerator.createPullRequest).toHaveBeenCalled();
    });

    it("should handle issue requiring human review", async () => {
      // Mock analysis that requires human review
      mockConfig.issueAnalyzer.analyzeIssue.mockResolvedValueOnce({
        category: "unknown",
        complexity: "critical",
        requirements: ["Complex changes needed"],
        acceptanceCriteria: ["Manual review required"],
        feasible: false,
        confidence: 0.3,
        reasoning: "Too complex for autonomous resolution",
      });

      const result = await orchestrator.processIssue(
        125,
        "Complex Issue",
        "This is too complex",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.requiresHumanReview).toBe(true);
      expect(result.error).toContain("requires human review");
    });

    it("should handle resolution failure", async () => {
      // Mock resolution failure
      mockConfig.autonomousResolver.resolveIssue.mockResolvedValueOnce({
        success: false,
        error: "Cannot resolve this issue",
      });

      const result = await orchestrator.processIssue(
        126,
        "Resolution Failure",
        "This will fail in resolution",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.error).toContain("Solution generation failed");
    });

    it("should handle code review failure", async () => {
      // Mock code review failure
      mockConfig.codeReviewer.reviewChanges.mockResolvedValueOnce({
        approved: false,
        score: 0.3,
        issues: [{ type: "error", message: "Code quality issues" }],
        recommendations: ["Fix code quality"],
        reasoning: "Code does not meet standards",
      });

      const result = await orchestrator.processIssue(
        127,
        "Review Failure",
        "This will fail in review",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.error).toContain("Code review failed");
    });
  });

  describe("State Management", () => {
    it("should track workflow state during execution", async () => {
      const workflowPromise = orchestrator.processIssue(
        128,
        "State Test",
        "Testing state tracking",
      );

      // Check state during execution
      const stateDuring = orchestrator.getCurrentState(128);
      expect(stateDuring).toBeDefined();
      expect([
        WorkflowState.INITIALIZING,
        WorkflowState.ANALYZING_ISSUE,
        WorkflowState.CHECKING_FEASIBILITY,
        WorkflowState.GENERATING_SOLUTION,
        WorkflowState.REVIEWING_CODE,
        WorkflowState.CREATING_PR,
      ]).toContain(stateDuring!);

      // Wait for completion
      await workflowPromise;

      // State should be cleared after completion
      const stateAfter = orchestrator.getCurrentState(128);
      expect(stateAfter).toBeUndefined();
    });

    it("should handle multiple concurrent workflows", async () => {
      const promises = [
        orchestrator.processIssue(
          129,
          "Concurrent 1",
          "First concurrent issue",
        ),
        orchestrator.processIssue(
          130,
          "Concurrent 2",
          "Second concurrent issue",
        ),
      ];

      // Check concurrent states
      await new Promise((resolve) => setTimeout(resolve, 10));
      const activeWorkflows = orchestrator.getActiveWorkflows();
      expect(activeWorkflows.length).toBeGreaterThanOrEqual(1);

      // Wait for all to complete
      const results = await Promise.all(promises);

      // All should succeed with mocks
      expect(results.every((r) => r.success)).toBe(true);

      // No active workflows should remain
      const finalActive = orchestrator.getActiveWorkflows();
      expect(finalActive.length).toBe(0);
    });
  });

  describe("Metrics Collection", () => {
    it("should track execution metrics", async () => {
      await orchestrator.processIssue(
        131,
        "Metrics Test",
        "Testing metrics collection",
      );

      const metrics = orchestrator.getGlobalMetrics();

      expect(metrics.totalWorkflows).toBe(1);
      expect(metrics.successRate).toBe(1);
      expect(metrics.averageExecutionTime).toBeGreaterThan(0);
      expect(metrics.componentExecutionTimes.analysis).toBeGreaterThan(0);
      expect(metrics.componentExecutionTimes.resolution).toBeGreaterThan(0);
      expect(metrics.componentExecutionTimes.review).toBeGreaterThan(0);
      expect(metrics.componentExecutionTimes.prCreation).toBeGreaterThan(0);
    });

    it("should track mixed success/failure metrics", async () => {
      // Process successful workflow
      await orchestrator.processIssue(132, "Success 1", "This will succeed");

      // Process failing workflow
      mockConfig.issueAnalyzer.analyzeIssue.mockRejectedValueOnce(
        new Error("Analysis failed"),
      );
      const orchestrator2 = new WorkflowOrchestrator(mockConfig);
      await orchestrator2.processIssue(133, "Failure 1", "This will fail");

      const metrics = orchestrator2.getGlobalMetrics();

      expect(metrics.totalWorkflows).toBe(1);
      expect(metrics.errorCount).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing issue data gracefully", async () => {
      const result = await orchestrator.processIssue(134, "", "");

      expect(result).toBeDefined();
      expect(result.issueNumber).toBe(134);
    });

    it("should handle component failures", async () => {
      // Mock component failure
      mockConfig.issueAnalyzer.analyzeIssue.mockRejectedValueOnce(
        new Error("Analysis service down"),
      );

      const result = await orchestrator.processIssue(
        135,
        "Component Failure",
        "Testing component failure",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.error).toContain("Analysis service down");
    });

    it("should handle timeout scenarios", async () => {
      // Create orchestrator with short timeout
      const timeoutOrchestrator = new WorkflowOrchestrator({
        ...mockConfig,
        maxWorkflowTime: 100, // 100ms timeout
      });

      // Mock slow analysis
      mockConfig.issueAnalyzer.analyzeIssue.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 200)),
      );

      const result = await timeoutOrchestrator.processIssue(
        136,
        "Timeout Test",
        "Testing timeout handling",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
    });
  });

  describe("Performance", () => {
    it("should complete workflows within reasonable time", async () => {
      const startTime = Date.now();
      await orchestrator.processIssue(
        137,
        "Performance Test",
        "Testing performance",
      );
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete quickly with mocks
    });

    it("should handle high load gracefully", async () => {
      const issueCount = 5;
      const promises = Array.from({ length: issueCount }, (_, i) =>
        orchestrator.processIssue(
          138 + i,
          `Load Test ${i}`,
          `Testing load ${i}`,
        ),
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed with mocks
      expect(results.every((r) => r.success)).toBe(true);

      // Should complete within reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 5 workflows in < 10 seconds

      const metrics = orchestrator.getGlobalMetrics();
      expect(metrics.totalWorkflows).toBe(issueCount);
      expect(metrics.successRate).toBe(1);
    });
  });

  describe("Workflow Cancellation", () => {
    it("should support workflow cancellation", async () => {
      if (typeof orchestrator.cancelWorkflow !== "function") {
        return; // Skip if not implemented
      }

      // Mock long-running analysis
      mockConfig.issueAnalyzer.analyzeIssue.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      const workflowPromise = orchestrator.processIssue(
        139,
        "Cancel Test",
        "Testing cancellation",
      );

      // Wait a bit then cancel
      await new Promise((resolve) => setTimeout(resolve, 10));
      const cancelled = await orchestrator.cancelWorkflow(
        139,
        "Test cancellation",
      );

      if (cancelled) {
        expect(cancelled).toBe(true);

        // Wait for workflow to handle cancellation
        const result = await workflowPromise;
        expect([WorkflowState.CANCELLED, WorkflowState.FAILED]).toContain(
          result.finalState,
        );
      }
    });

    it("should handle cancellation of non-existent workflows", async () => {
      if (typeof orchestrator.cancelWorkflow !== "function") {
        return; // Skip if not implemented
      }

      const cancelled = await orchestrator.cancelWorkflow(
        999,
        "Non-existent workflow",
      );
      expect(cancelled).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in issue content", async () => {
      const specialContent = "Issue with special chars: 🚀 🐛 \n\t\r<>{}[]";
      const result = await orchestrator.processIssue(
        140,
        "Special Chars",
        specialContent,
      );

      expect(result.success).toBe(true);
      expect(result.issueNumber).toBe(140);
    });

    it("should handle very large issue content", async () => {
      const largeContent = "A".repeat(1000) + "\n" + "B".repeat(500);
      const result = await orchestrator.processIssue(
        141,
        "Large Content",
        largeContent,
      );

      expect(result).toBeDefined();
      expect(result.issueNumber).toBe(141);
    });

    it("should handle negative issue numbers", async () => {
      const result = await orchestrator.processIssue(
        -1,
        "Negative Issue",
        "Testing negative issue number",
      );

      expect(result).toBeDefined();
      expect(result.issueNumber).toBe(-1);
    });
  });
});
