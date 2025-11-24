/**
 * Tests for Workflow Orchestrator Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  WorkflowOrchestrator,
  WorkflowState,
  WorkflowResult,
} from "./WorkflowOrchestrator";
import { IssueAnalyzer } from "./IssueAnalyzer";
import { AutonomousResolver } from "./AutonomousResolver";
import { CodeReviewer } from "./CodeReviewer";
import { PRGenerator } from "./PRGenerator";

// Mock all dependencies
vi.mock("./IssueAnalyzer");
vi.mock("./AutonomousResolver");
vi.mock("./CodeReviewer");
vi.mock("./PRGenerator");

describe("WorkflowOrchestrator", () => {
  let mockAnalyzer: any;
  let mockResolver: any;
  let mockReviewer: any;
  let mockPrGenerator: any;
  let orchestrator: WorkflowOrchestrator;

  const mockConfig = {
    issueAnalyzer: {} as IssueAnalyzer,
    autonomousResolver: {} as AutonomousResolver,
    codeReviewer: {} as CodeReviewer,
    prGenerator: {} as PRGenerator,
    maxWorkflowTime: 30000,
    enableMetrics: true,
    retryAttempts: 2,
    humanInterventionThreshold: 3,
  };

  const mockIssue = {
    number: 123,
    title: "Fix login validation bug",
    body: "The login form validation is not working properly.",
  };

  beforeEach(() => {
    mockAnalyzer = {
      analyzeIssue: vi.fn(),
    };
    mockResolver = {
      resolveIssue: vi.fn(),
    };
    mockReviewer = {
      reviewChanges: vi.fn(),
    };
    mockPrGenerator = {
      createPullRequest: vi.fn(),
    };

    mockConfig.issueAnalyzer = mockAnalyzer;
    mockConfig.autonomousResolver = mockResolver;
    mockConfig.codeReviewer = mockReviewer;
    mockConfig.prGenerator = mockPrGenerator;

    orchestrator = new WorkflowOrchestrator(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("processIssue", () => {
    it("should execute complete successful workflow", async () => {
      // Mock successful responses for all components
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Add validation"],
        acceptanceCriteria: ["Emails are validated"],
        feasible: true,
        confidence: 0.8,
        reasoning: "Simple bug fix",
      });

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test-branch",
          path: "/tmp/test",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Solution generated",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Code looks good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValue({
        number: 456,
        title: "feat: fix login validation",
        body: "PR description",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      expect(result.success).toBe(true);
      expect(result.finalState).toBe(WorkflowState.PR_COMPLETE);
      expect(result.outputs.analysis).toBeDefined();
      expect(result.outputs.resolution).toBeDefined();
      expect(result.outputs.review).toBeDefined();
      expect(result.outputs.pr).toBeDefined();
      expect(result.requiresHumanReview).toBe(false);
    });

    it("should handle infeasible issues requiring human review", async () => {
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "question",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: false,
        confidence: 0.5,
        reasoning: "Question requires human clarification",
      });

      const result = await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.requiresHumanReview).toBe(true);
    });

    it("should handle critical complexity issues", async () => {
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "critical",
        requirements: ["Complex fix"],
        acceptanceCriteria: ["Complex validation"],
        feasible: true,
        confidence: 0.9,
        reasoning: "Critical complexity detected",
      });

      const result = await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.requiresHumanReview).toBe(true);
    });

    it("should handle component failures gracefully", async () => {
      mockAnalyzer.analyzeIssue.mockRejectedValue(
        new Error("Analysis service unavailable"),
      );

      const result = await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.errors).toContain(
        "Workflow execution failed: Analysis service unavailable",
      );
    });
  });

  describe("workflow management", () => {
    it("should track workflow status", async () => {
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.8,
        reasoning: "Test",
      });

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test-branch",
          path: "/tmp/test",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Solution generated",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Code looks good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValue({
        number: 456,
        title: "feat: fix login validation",
        body: "PR description",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      expect(result.workflowId).toMatch(/^workflow-123-/);
    });

    it("should list active workflows", () => {
      const activeWorkflows = orchestrator.getActiveWorkflows();
      expect(Array.isArray(activeWorkflows)).toBe(true);
    });

    it("should list completed workflows", () => {
      const completedWorkflows = orchestrator.getCompletedWorkflows();
      expect(Array.isArray(completedWorkflows)).toBe(true);
    });

    it("should provide global metrics", () => {
      const metrics = orchestrator.getGlobalMetrics();

      expect(metrics).toHaveProperty("totalProcessingTime");
      expect(metrics).toHaveProperty("componentExecutionTimes");
      expect(metrics).toHaveProperty("successRate");
      expect(metrics).toHaveProperty("averageComplexity");
      expect(metrics).toHaveProperty("errorCount");
      expect(metrics).toHaveProperty("humanInterventionCount");
    });
  });

  describe("state transitions", () => {
    it("should follow correct state progression for successful workflow", async () => {
      // Mock all components to succeed
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.8,
        reasoning: "Test",
      });

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test",
          path: "/tmp",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Success",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValue({
        number: 456,
        title: "test",
        body: "test",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      expect(result.finalState).toBe(WorkflowState.PR_COMPLETE);
    });
  });

  describe("metrics and monitoring", () => {
    it("should track component execution times", async () => {
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.8,
        reasoning: "Test",
      });

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test",
          path: "/tmp",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Success",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValue({
        number: 456,
        title: "test",
        body: "test",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await orchestrator.processIssue(
        mockIssue.number,
        mockIssue.title,
        mockIssue.body,
      );

      const metrics = orchestrator.getGlobalMetrics();
      expect(metrics.componentExecutionTimes.analysis).toBeGreaterThanOrEqual(
        0,
      );
      expect(metrics.componentExecutionTimes.resolution).toBeGreaterThanOrEqual(
        0,
      );
      expect(metrics.componentExecutionTimes.review).toBeGreaterThanOrEqual(0);
      expect(metrics.componentExecutionTimes.prCreation).toBeGreaterThanOrEqual(
        0,
      );
    });

    it("should update success rates", async () => {
      // First successful workflow
      mockAnalyzer.analyzeIssue.mockResolvedValueOnce({
        category: "bug",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.8,
        reasoning: "Test",
      });

      mockResolver.resolveIssue.mockResolvedValueOnce({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test",
          path: "/tmp",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Success",
      });

      mockReviewer.reviewChanges.mockResolvedValueOnce({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValueOnce({
        number: 456,
        title: "test",
        body: "test",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await orchestrator.processIssue(123, "Test Issue", "Test body");

      const metrics = orchestrator.getGlobalMetrics();
      expect(metrics.successRate).toBeGreaterThan(0);
    });
  });

  describe("workflow state management", () => {
    it("should return undefined for non-existent workflow state", () => {
      const state = orchestrator.getCurrentState(999);
      expect(state).toBeUndefined();
    });

    it("should return correct state for active workflow", async () => {
      // Mock a slow operation to keep workflow active
      mockAnalyzer.analyzeIssue.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  category: "bug",
                  complexity: "low",
                  requirements: [],
                  acceptanceCriteria: [],
                  feasible: true,
                  confidence: 0.8,
                  reasoning: "Test",
                }),
              50,
            ),
          ),
      );

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test",
          path: "/tmp",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Success",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValue({
        number: 456,
        title: "test",
        body: "test",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Start the workflow
      const workflowPromise = orchestrator.processIssue(
        123,
        "Test Issue",
        "Test body",
      );

      // Check state during execution
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const state = orchestrator.getCurrentState(123);
      expect(state).toBeDefined();
      expect(typeof state).toBe("string");

      // Wait for completion
      await workflowPromise;
    });
  });

  describe("error handling in workflow steps", () => {
    it("should handle timeout scenarios", async () => {
      // Mock a very slow operation
      mockAnalyzer.analyzeIssue.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  category: "bug",
                  complexity: "low",
                  requirements: [],
                  acceptanceCriteria: [],
                  feasible: true,
                  confidence: 0.8,
                  reasoning: "Test",
                }),
              100,
            ),
          ),
      );

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test",
          path: "/tmp",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Success",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: true,
        score: 0.9,
        issues: [],
        recommendations: [],
        reasoning: "Good",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      mockPrGenerator.createPullRequest.mockResolvedValue({
        number: 456,
        title: "test",
        body: "test",
        html_url: "https://github.com/test/repo/pull/456",
        state: "open",
        merged: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await orchestrator.processIssue(
        123,
        "Test Issue",
        "Test body",
      );

      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe("human intervention required paths", () => {
    it("should handle workflows requiring human review without kanban manager", async () => {
      // Mock failed review requiring human intervention
      mockAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: [],
        acceptanceCriteria: [],
        feasible: true,
        confidence: 0.8,
        reasoning: "Test",
      });

      mockResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: { files: [] },
        worktree: {
          branch: "test",
          path: "/tmp",
          issueId: 123,
          createdAt: new Date(),
          status: "active",
        },
        iterations: 1,
        reasoning: "Success",
      });

      mockReviewer.reviewChanges.mockResolvedValue({
        approved: false,
        score: 0.5,
        issues: [
          {
            type: "error",
            category: "quality",
            severity: "high",
            message: "Needs human review",
            file: "test.ts",
          },
        ],
        recommendations: [],
        reasoning: "Requires human review",
        metadata: {
          staticAnalysisScore: 0.9,
          securityScore: 1.0,
          qualityScore: 0.8,
          testCoverageScore: 0.7,
          performanceScore: 0.9,
          documentationScore: 0.6,
        },
      });

      const result = await orchestrator.processIssue(
        123,
        "Test Issue",
        "Test body",
      );

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.requiresHumanReview).toBe(true);
    });
  });






  });
});
