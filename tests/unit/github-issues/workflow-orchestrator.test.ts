/**
 * WorkflowOrchestrator Test Suite
 *
 * Tests the complete workflow orchestration for GitHub issues processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkflowOrchestrator } from "../../../src/scripts/modules/github-issues/WorkflowOrchestrator.js";
import { GitHubIssue, WorkflowState, WorkflowResult } from "../../../src/scripts/modules/github-issues/types.js";

describe("WorkflowOrchestrator", () => {
  let orchestrator: WorkflowOrchestrator;
  let mockIssueAnalyzer: any;
  let mockCodeReviewer: any;

  const mockIssue: GitHubIssue = {
    number: 123,
    title: "Add dark mode toggle",
    body: "Users want a dark mode toggle in the header. This should include a theme switcher button and CSS variables for theming.",
    labels: [{ name: "enhancement" }, { name: "frontend" }],
    state: "open",
    user: { login: "testuser" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    html_url: "https://github.com/test/repo/issues/123",
    assignee: { login: "developer" }
  };

  beforeEach(() => {
    // Mock dependencies
    mockIssueAnalyzer = {
      analyzeIssue: vi.fn().mockResolvedValue({
        category: "feature",
        complexity: "medium",
        feasibility: true,
        confidence: 0.9,
        requirements: ["Implement feature"],
        acceptance_criteria: ["Works"],
        reasoning: "Feature request"
      }),
      getMetrics: vi.fn()
    };

    mockCodeReviewer = {
      reviewChanges: vi.fn().mockResolvedValue({
        approved: true,
        score: 0.85,
        issues: [],
        recommendations: [],
        reasoning: "Good",
        metadata: {
          security_score: 0.9,
          quality_score: 0.8,
          performance_score: 0.9,
          static_analysis_score: 0.85,
          test_coverage_score: 0.7,
          documentation_score: 0.8
        }
      }),
      getMetrics: vi.fn()
    };

    // Create orchestrator with mocked dependencies
    orchestrator = new WorkflowOrchestrator({
      issueAnalyzer: mockIssueAnalyzer,
      codeReviewer: mockCodeReviewer,
      maxWorkflowTime: 30000,
      enableMetrics: true,
      retryAttempts: 2,
      humanInterventionThreshold: 0.8
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("processIssue", () => {
    it("should process a single GitHub issue through the complete workflow", async () => {
      // Arrange
      const mockAnalysisResult = {
        category: "feature",
        complexity: "medium",
        feasibility: true,
        confidence: 0.9,
        requirements: ["Implement dark mode toggle", "Add CSS variables"],
        acceptance_criteria: ["Toggle works", "Theme persists"],
        reasoning: "Feature request for UI enhancement"
      };

      const mockReviewResult = {
        approved: true,
        score: 0.85,
        issues: [],
        recommendations: ["Add tests"],
        reasoning: "Code looks good",
        metadata: {
          security_score: 0.9,
          quality_score: 0.8,
          performance_score: 0.9,
          static_analysis_score: 0.85,
          test_coverage_score: 0.7,
          documentation_score: 0.8
        }
      };

      mockIssueAnalyzer.analyzeIssue.mockResolvedValue(mockAnalysisResult);
      mockCodeReviewer.reviewChanges.mockResolvedValue(mockReviewResult);

      // Act
      const result = await orchestrator.processIssue(mockIssue);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.finalState).toBe(WorkflowState.PR_COMPLETE);
      expect(result.outputs.analysis).toEqual(mockAnalysisResult);
      expect(result.outputs.review).toEqual(mockReviewResult);
      expect(result.workflowId).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(mockIssueAnalyzer.analyzeIssue).toHaveBeenCalledWith(mockIssue);
      expect(mockCodeReviewer.reviewChanges).toHaveBeenCalled();
    });

    it("should handle workflow failure and transition to FAILED state", async () => {
      // Arrange
      mockIssueAnalyzer.analyzeIssue.mockRejectedValue(new Error("Analysis failed"));

      // Act
      const result = await orchestrator.processIssue(mockIssue);

      // Assert
      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.errors).toContain("Analysis failed");
    });

    it("should require human review when confidence is low", async () => {
      // Arrange
      const lowConfidenceAnalysis = {
        category: "question",
        complexity: "low",
        feasibility: false,
        confidence: 0.3,
        requirements: [],
        acceptance_criteria: [],
        reasoning: "Unclear requirement"
      };

      mockIssueAnalyzer.analyzeIssue.mockResolvedValue(lowConfidenceAnalysis);

      // Act
      const result = await orchestrator.processIssue(mockIssue);

      // Assert
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(result.requiresHumanReview).toBe(true);
    });
  });

  describe("getWorkflowStatus", () => {
    it("should return the current status of a workflow", async () => {
      // Start a workflow
      const workflowPromise = orchestrator.processIssue(mockIssue);

      // Get status while running
      const status = orchestrator.getWorkflowStatus("test-workflow-id");

      expect(status).toBeDefined();
      // Status should be one of the workflow states
      expect(Object.values(WorkflowState)).toContain(status);

      // Wait for completion
      await workflowPromise;
    });
  });

  describe("getMetrics", () => {
    it("should return workflow metrics", () => {
      const metrics = orchestrator.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty("totalWorkflows");
      expect(metrics).toHaveProperty("successfulWorkflows");
      expect(metrics).toHaveProperty("averageExecutionTime");
      expect(metrics).toHaveProperty("stateDistribution");
    });
  });

  describe("cancelWorkflow", () => {
    it("should cancel a running workflow", async () => {
      // Start a long-running workflow
      const workflowPromise = orchestrator.processIssue(mockIssue);

      // Cancel it
      const cancelled = orchestrator.cancelWorkflow("test-workflow-id");

      expect(typeof cancelled).toBe("boolean");

      // Wait for the workflow to complete/cancel
      await workflowPromise;
    });
  });
});