/**
 * End-to-End Test Suite: Complete AI-Powered GitHub Issues Reviewer Workflow
 *
 * This test validates the comprehensive E2E test framework for the
 * AI-powered GitHub Issues Reviewer System.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  E2EScenarioRunner,
  TestAssertions,
  E2ETestResult,
} from "../modules/e2e-framework";
import { TEST_ISSUES } from "../modules/mocks/test-fixtures";

describe("End-to-End: Complete AI-Powered GitHub Issues Workflow", () => {
  let scenarioRunner: E2EScenarioRunner;

  beforeEach(async () => {
    scenarioRunner = new E2EScenarioRunner();
    await scenarioRunner.setupTest();
  });

  afterEach(async () => {
    await scenarioRunner.teardownTest();
  });

  describe("Basic E2E Framework Validation", () => {
    it("should initialize test framework correctly", () => {
      const context = scenarioRunner.getCurrentContext();
      expect(context).toBeDefined();
      expect(context!.orchestrator).toBeDefined();
      expect(context!.githubMock).toBeDefined();
      expect(context!.openCodeMock).toBeDefined();
      expect(context!.worktreeMock).toBeDefined();
    });

    it("should execute simple bug fix workflow successfully", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      // Setup mocks for successful workflow
      context.openCodeMock.analyze.mockImplementation(async (issue) => ({
        category: "bug",
        complexity: "low",
        requirements: ["Fix login button styling"],
        acceptanceCriteria: ["Button is properly styled"],
        feasible: true,
        confidence: 0.95,
        reasoning: "Simple CSS fix",
      }));

      context.openCodeMock.generateCode.mockImplementation(
        async (analysis) => ({
          changes: [
            {
              file: "src/components/LoginButton.css",
              line: 10,
              oldCode: "padding: 8px;",
              newCode: "padding: 12px;",
            },
          ],
          explanation: "Fixed button padding",
        }),
      );

      context.openCodeMock.reviewCode.mockImplementation(async (solution) => ({
        approved: true,
        score: 0.92,
        comments: [],
        securityIssues: [],
        qualityScore: 0.95,
        performanceScore: 0.88,
        maintainabilityScore: 0.9,
        testCoverageScore: 0.85,
        recommendations: [],
      }));

      context.openCodeMock.generateCode.mockImplementation(
        async (analysis) => ({
          changes: [
            {
              file: "src/components/LoginButton.css",
              line: 10,
              oldCode: "padding: 8px;",
              newCode: "padding: 12px;",
            },
          ],
          explanation: "Fixed button padding",
        }),
      );

      context.openCodeMock.reviewCode.mockResolvedValue({
        approved: true,
        score: 0.92,
        comments: ["Good fix"],
        securityIssues: [],
        qualityScore: 0.95,
        performanceScore: 0.88,
        maintainabilityScore: 0.9,
        testCoverageScore: 0.85,
        recommendations: [],
      });

      // Mock the PR generator used by the orchestrator
      context.prGenerator.createPullRequest.mockResolvedValue({
        number: 100,
        title: "Fix bug",
        body: "This PR fixes the bug",
        html_url: "https://github.com/test/repo/pull/100",
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowSuccess(result);
      expect(result.outputs?.pr).toBeDefined();
    });

    it("should handle complex features requiring human review", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.complexFeature;

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "feature",
        complexity: "high",
        requirements: ["Implement full auth system"],
        acceptanceCriteria: ["Complete auth functionality"],
        feasible: false,
        confidence: 0.6,
        reasoning: "Too complex for autonomous resolution",
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertHumanReviewRequired(result);
      expect(result.outputs?.analysis!.feasible).toBe(false);
    });

    it("should handle API failures gracefully", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      // Mock the analysis to fail (simulating API failure)
      context.openCodeMock.analyze.mockRejectedValue(
        new Error("OpenCode API service unavailable"),
      );

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowFailure(result, "OpenCode API");
    });
  });
});
