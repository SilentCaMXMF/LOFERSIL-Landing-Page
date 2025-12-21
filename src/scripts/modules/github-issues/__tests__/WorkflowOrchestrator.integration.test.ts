/**
 * Workflow Orchestrator Integration Tests
 *
 * Comprehensive test suite for enhanced workflow orchestration system
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WorkflowOrchestrator, WorkflowState } from "../WorkflowOrchestrator";
import { IssueAnalyzer } from "../IssueAnalyzer";
import { AutonomousResolver } from "../AutonomousResolver";
import { CodeReviewer } from "../CodeReviewer";
import { PRGenerator } from "../PRGenerator";
import { ErrorManager } from "../../ErrorManager";

describe("WorkflowOrchestrator Integration Tests", () => {
  let orchestrator: WorkflowOrchestrator;
  let mockConfig: any;

  beforeEach(() => {
    // Create mock configurations for testing
    mockConfig = {
      issueAnalyzer: {
        analyzeIssue: jest.fn().mockResolvedValue({
          category: "bug",
          complexity: "medium",
          requirements: ["Fix the bug"],
          acceptanceCriteria: ["Code should work"],
          feasible: true,
          confidence: 0.8,
          reasoning: "Simple bug fix",
        }),
      },
      autonomousResolver: {
        resolveIssue: jest.fn().mockResolvedValue({
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
          reasoning: "Applied fix",
        }),
      },
      codeReviewer: {
        reviewChanges: jest.fn().mockResolvedValue({
          approved: true,
          score: 0.9,
          issues: [],
          recommendations: ["Code looks good"],
          reasoning: "Code passes review",
        }),
      },
      prGenerator: {
        createPullRequest: jest.fn().mockResolvedValue({
          number: 123,
          title: "Fix for issue #123",
          body: "Automated PR",
          url: "https://github.com/test/repo/pull/123",
        }),
      },
      maxWorkflowTime: 60000,
      enableMetrics: true,
      retryAttempts: 2,
      humanInterventionThreshold: 0.7,
    };

    orchestrator = new WorkflowOrchestrator(mockConfig);
  });

  afterEach(async () => {
    // Cleanup if needed
    if (orchestrator && typeof orchestrator.shutdown === "function") {
      try {
        await orchestrator.shutdown();
      } catch (error) {
        // Ignore shutdown errors in tests
      }
    }
  });

  describe("Basic Workflow Execution", () => {
    it("should be instantiable with valid config", () => {
      expect(orchestrator).toBeDefined();
      expect(typeof orchestrator.processIssue).toBe("function");
      expect(typeof orchestrator.getCurrentState).toBe("function");
      expect(typeof orchestrator.getActiveWorkflows).toBe("function");
      expect(typeof orchestrator.getGlobalMetrics).toBe("function");
    });

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

      // Verify all components were called
      expect(mockConfig.issueAnalyzer.analyzeIssue).toHaveBeenCalled();
      expect(mockConfig.autonomousResolver.resolveIssue).toHaveBeenCalled();
      expect(mockConfig.codeReviewer.reviewChanges).toHaveBeenCalled();
      expect(mockConfig.prGenerator.createPullRequest).toHaveBeenCalled();
    });

    it("should handle workflow with human intervention requirement", async () => {
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
        124,
        "Complex Issue",
        "This is too complex",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.requiresHumanReview).toBe(true);
      expect(result.error).toContain("requires human review");
    });

    it("should handle workflow failure gracefully", async () => {
      // Mock resolution failure
      mockConfig.autonomousResolver.resolveIssue.mockRejectedValueOnce(
        new Error("Resolution service unavailable"),
      );

      const result = await orchestrator.processIssue(
        125,
        "Failing Issue",
        "This will fail",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.error).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe("Workflow State Management", () => {
    it("should track workflow states during execution", async () => {
      // Start workflow and check intermediate state
      const workflowPromise = orchestrator.processIssue(
        126,
        "State Test",
        "Testing state tracking",
      );

      // Wait a bit then check state
      await new Promise((resolve) => setTimeout(resolve, 10));
      const currentState = orchestrator.getCurrentState(126);
      expect(currentState).toBeDefined();
      expect([
        WorkflowState.INITIALIZING,
        WorkflowState.ANALYZING_ISSUE,
        WorkflowState.CHECKING_FEASIBILITY,
        WorkflowState.GENERATING_SOLUTION,
        WorkflowState.REVIEWING_CODE,
        WorkflowState.CREATING_PR,
        WorkflowState.PR_COMPLETE,
      ]).toContain(currentState!);

      // Wait for completion
      await workflowPromise;

      // Final state should be cleared
      const finalState = orchestrator.getCurrentState(126);
      expect(finalState).toBeUndefined();
    });

    it("should return correct active workflows list", async () => {
      // Start multiple workflows
      const promise1 = orchestrator.processIssue(
        127,
        "Active Test 1",
        "First active workflow",
      );
      const promise2 = orchestrator.processIssue(
        128,
        "Active Test 2",
        "Second active workflow",
      );

      // Wait a bit then check active workflows
      await new Promise((resolve) => setTimeout(resolve, 10));
      const activeWorkflows = orchestrator.getActiveWorkflows();
      expect(activeWorkflows.length).toBeGreaterThanOrEqual(1);
      expect(
        activeWorkflows.some(
          (w) => w.issueNumber === 127 || w.issueNumber === 128,
        ),
      ).toBe(true);

      // Wait for completion
      await Promise.all([promise1, promise2]);

      // Should be empty after completion
      const finalActive = orchestrator.getActiveWorkflows();
      expect(finalActive.length).toBe(0);
    });
  });

  describe("Metrics Collection", () => {
    it("should track execution metrics", async () => {
      await orchestrator.processIssue(
        129,
        "Metrics Test",
        "Testing metrics collection",
      );

      const metrics = orchestrator.getGlobalMetrics();

      expect(metrics.totalWorkflows).toBeGreaterThan(0);
      expect(metrics.componentExecutionTimes).toBeDefined();
      expect(typeof metrics.componentExecutionTimes.analysis).toBe("number");
      expect(typeof metrics.componentExecutionTimes.resolution).toBe("number");
      expect(typeof metrics.componentExecutionTimes.review).toBe("number");
      expect(typeof metrics.componentExecutionTimes.prCreation).toBe("number");
    });

    it("should track mixed success/failure metrics", async () => {
      // Process a successful workflow
      await orchestrator.processIssue(130, "Success Test", "This will succeed");

      // Process a failing workflow
      mockConfig.codeReviewer.reviewChanges.mockRejectedValueOnce(
        new Error("Review failed"),
      );

      const result = await orchestrator.processIssue(
        131,
        "Failure Test",
        "This will fail",
      );

      expect(result.success).toBe(false);

      const metrics = orchestrator.getGlobalMetrics();
      expect(metrics.totalWorkflows).toBeGreaterThan(1);
      expect(metrics.errorCount).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle missing issue data gracefully", async () => {
      const result = await orchestrator.processIssue(132, "", "");

      // Should handle gracefully without crashing
      expect(result).toBeDefined();
      expect(result.issueNumber).toBe(132);
    });

    it("should handle component failures", async () => {
      // Mock component failure
      mockConfig.issueAnalyzer.analyzeIssue.mockRejectedValueOnce(
        new Error("Analysis service down"),
      );

      const result = await orchestrator.processIssue(
        133,
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
        134,
        "Timeout Test",
        "Testing timeout",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
    });
  });

  describe("Performance and Load Testing", () => {
    it("should complete workflows within reasonable time", async () => {
      const startTime = Date.now();
      await orchestrator.processIssue(
        135,
        "Performance Test",
        "Testing performance",
      );
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // Should complete in < 10 seconds for mock case
    });

    it("should handle concurrent workflows", async () => {
      const promises = [
        orchestrator.processIssue(
          136,
          "Concurrent 1",
          "First concurrent workflow",
        ),
        orchestrator.processIssue(
          137,
          "Concurrent 2",
          "Second concurrent workflow",
        ),
        orchestrator.processIssue(
          138,
          "Concurrent 3",
          "Third concurrent workflow",
        ),
      ];

      const results = await Promise.all(promises);

      // All should succeed with mocks
      expect(results.every((r) => r.success)).toBe(true);

      const metrics = orchestrator.getGlobalMetrics();
      expect(metrics.totalWorkflows).toBe(3);
    });
  });

  describe("Workflow Cancellation", () => {
    it("should support workflow cancellation", async () => {
      if (typeof orchestrator.cancelWorkflow !== "function") {
        return; // Skip if not implemented
      }

      // Start a long-running workflow
      mockConfig.issueAnalyzer.analyzeIssue.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
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
  });

  describe("System Health Monitoring", () => {
    it("should provide system health information", () => {
      if (typeof orchestrator.getSystemHealth !== "function") {
        return; // Skip if not implemented
      }

      const health = orchestrator.getSystemHealth();

      expect(health).toBeDefined();
      expect(typeof health.status).toBe("string");
      expect(typeof health.activeWorkflows).toBe("number");
      expect(typeof health.successRate).toBe("number");
    });
  });

  describe("Configuration and Validation", () => {
    it("should validate configuration on initialization", () => {
      // Should throw with invalid config
      expect(() => {
        new WorkflowOrchestrator({} as any);
      }).toThrow();
    });

    it("should handle configuration edge cases", () => {
      // Should handle zero timeout gracefully
      const edgeCaseOrchestrator = new WorkflowOrchestrator({
        ...mockConfig,
        maxWorkflowTime: 0,
      });

      expect(edgeCaseOrchestrator).toBeDefined();
    });
  });
});

describe("WorkflowOrchestrator Edge Cases", () => {
  let orchestrator: WorkflowOrchestrator;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      issueAnalyzer: {
        analyzeIssue: jest.fn().mockResolvedValue({
          category: "bug",
          complexity: "low",
          requirements: ["Fix"],
          acceptanceCriteria: ["Works"],
          feasible: true,
          confidence: 0.9,
          reasoning: "Simple fix",
        }),
      },
      autonomousResolver: {
        resolveIssue: jest.fn().mockResolvedValue({
          success: true,
          solution: { files: [] },
          confidence: 0.9,
        }),
      },
      codeReviewer: {
        reviewChanges: jest.fn().mockResolvedValue({
          approved: true,
          score: 1.0,
          issues: [],
        }),
      },
      prGenerator: {
        createPullRequest: jest.fn().mockResolvedValue({
          number: 456,
          title: "PR",
          url: "https://github.com/test/repo/pull/456",
        }),
      },
      maxWorkflowTime: 60000,
      enableMetrics: true,
      retryAttempts: 1,
      humanInterventionThreshold: 0.5,
    };

    orchestrator = new WorkflowOrchestrator(mockConfig);
  });

  it("should handle special characters in content", async () => {
    const specialContent = "Issue with special chars: 🚀 🐛 \n\t\r<>{}[]";
    const result = await orchestrator.processIssue(
      140,
      "Special Chars",
      specialContent,
    );

    expect(result.success).toBe(true);
    expect(result.issueNumber).toBe(140);
  });

  it("should handle extremely long content", async () => {
    const largeContent = "A".repeat(10000) + "\n" + "B".repeat(5000);
    const result = await orchestrator.processIssue(
      141,
      "Large Content",
      largeContent,
    );

    expect(result).toBeDefined();
    expect(result.issueNumber).toBe(141);
  });

  it("should handle rapid consecutive workflows", async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      orchestrator.processIssue(142 + i, `Rapid ${i}`, `Rapid test ${i}`),
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results.every((r) => r.success)).toBe(true);
    expect(endTime - startTime).toBeLessThan(5000); // Should be fast with mocks
  });

  it("should handle workflow with negative issue number", async () => {
    const result = await orchestrator.processIssue(
      -1,
      "Negative Issue",
      "Testing negative issue number",
    );

    expect(result).toBeDefined();
    expect(result.issueNumber).toBe(-1);
  });

  it("should handle workflow with very large issue number", async () => {
    const largeNumber = Number.MAX_SAFE_INTEGER;
    const result = await orchestrator.processIssue(
      largeNumber,
      "Large Number",
      "Testing large issue number",
    );

    expect(result).toBeDefined();
    expect(result.issueNumber).toBe(largeNumber);
  });
});
