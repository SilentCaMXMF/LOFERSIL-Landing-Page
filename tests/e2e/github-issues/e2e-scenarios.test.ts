/**
 * E2E Test Scenarios: Complete Workflow Execution Tests
 *
 * Comprehensive test scenarios covering complete workflow execution, issue type handling,
 * performance benchmarking, error handling and recovery, complexity validation, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkflowState } from "./WorkflowOrchestrator";
import { TEST_SCENARIOS, DEFAULT_TEST_CONFIG } from "./test-config";
import { TEST_ISSUES, getTestIssuesByComplexity } from "./mocks/test-fixtures";
import {
  E2EScenarioRunner,
  PerformanceMonitor,
  TestAssertions,
  TestDataGenerator,
  e2eTestSetup,
  createE2ETestContext,
  E2ETestResult,
} from "./e2e-framework";

// Setup global test environment
e2eTestSetup.setupTestEnvironment();
e2eTestSetup.setupTestIsolation();

describe("E2E Test Scenarios: Complete AI-Powered GitHub Issues Workflow", () => {
  let scenarioRunner: E2EScenarioRunner;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(async () => {
    scenarioRunner = createE2ETestContext();
    performanceMonitor = new PerformanceMonitor();
    await scenarioRunner.setupTest();
  });

  afterEach(async () => {
    await scenarioRunner.teardownTest();
  });

  describe("Complete Workflow Execution Tests", () => {
    it("should execute complete successful workflow for simple bug fix", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      // Setup mocks for successful workflow
      context.openCodeMock.analyze.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Fix login button styling"],
        acceptanceCriteria: ["Button is properly styled"],
        feasible: true,
        confidence: 0.95,
        reasoning: "Simple CSS fix",
      });

      context.openCodeMock.generateCode.mockResolvedValue({
        changes: [
          {
            file: "src/components/LoginButton.css",
            line: 10,
            oldCode: "padding: 8px;",
            newCode: "padding: 12px;",
          },
        ],
        explanation: "Fixed button padding",
      });

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

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.githubMock.pulls.create.mockResolvedValue({
        data: {
          number: 100,
          html_url: "https://github.com/test/repo/pull/100",
        },
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowSuccess(result);
      TestAssertions.assertPerformanceWithinBounds(
        result,
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      );
      expect(result.outputs.pr).toBeDefined();
    });

    it("should handle workflow requiring human review for complex features", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.complexFeature;

      // Setup mocks for complex feature requiring human review
      context.openCodeMock.analyze.mockResolvedValue({
        category: "feature",
        complexity: "high",
        requirements: ["Implement full auth system"],
        acceptanceCriteria: ["Complete auth functionality"],
        feasible: false,
        confidence: 0.6,
        reasoning: "Too complex for autonomous resolution",
      });

      context.githubMock.issues.get.mockResolvedValue({ data: issue });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertHumanReviewRequired(result);
      expect(result.outputs.analysis).toBeDefined();
      expect(result.outputs.analysis!.feasible).toBe(false);
    });

    it("should execute documentation updates autonomously", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.documentationUpdate;

      // Setup mocks for documentation workflow
      context.openCodeMock.analyze.mockResolvedValue({
        category: "documentation",
        complexity: "low",
        requirements: ["Update API docs"],
        acceptanceCriteria: ["Docs are current"],
        feasible: true,
        confidence: 0.9,
        reasoning: "Simple documentation update",
      });

      context.openCodeMock.generateCode.mockResolvedValue({
        changes: [
          {
            file: "docs/api.md",
            line: 5,
            oldCode: "# API",
            newCode: "# API v2.0",
          },
        ],
        explanation: "Updated API documentation",
      });

      context.openCodeMock.reviewCode.mockResolvedValue({
        approved: true,
        score: 0.88,
        comments: ["Documentation updated correctly"],
        securityIssues: [],
        qualityScore: 0.9,
        performanceScore: 1.0,
        maintainabilityScore: 0.95,
        testCoverageScore: 0.0, // Docs don't need tests
        recommendations: [],
      });

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.githubMock.repos.createOrUpdateFileContents.mockResolvedValue({
        data: { commit: { sha: "abc123" } },
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowSuccess(result);
      expect(result.outputs.pr).toBeDefined();
    });
  });

  describe("Issue Type Handling Tests", () => {
    TEST_SCENARIOS.forEach((scenario) => {
      it(`should handle ${scenario.name} scenario correctly`, async () => {
        const context = scenarioRunner.getCurrentContext()!;
        const issue =
          getTestIssuesByComplexity(scenario.complexity)[0] ||
          TEST_ISSUES.simpleBug;

        // Configure mocks based on scenario
        context.openCodeMock.analyze.mockResolvedValue({
          category: scenario.issueType as any,
          complexity: scenario.complexity as any,
          requirements: [`Handle ${scenario.issueType}`],
          acceptanceCriteria: [`${scenario.issueType} handled`],
          feasible: scenario.expectedOutcome === "success",
          confidence: scenario.complexity === "low" ? 0.9 : 0.6,
          reasoning: `Test ${scenario.name}`,
        });

        if (scenario.expectedOutcome === "success") {
          context.openCodeMock.generateCode.mockResolvedValue({
            changes: [
              { file: "test.js", line: 1, oldCode: "old", newCode: "new" },
            ],
            explanation: "Test change",
          });

          context.openCodeMock.reviewCode.mockResolvedValue({
            approved: true,
            score: 0.85,
            comments: [],
            securityIssues: [],
            qualityScore: 0.9,
            performanceScore: 0.8,
            maintainabilityScore: 0.95,
            testCoverageScore: 0.7,
            recommendations: [],
          });

          context.githubMock.pulls.create.mockResolvedValue({
            data: {
              number: 200,
              html_url: "https://github.com/test/repo/pull/200",
            },
          });
        }

        context.githubMock.issues.get.mockResolvedValue({ data: issue });

        const result = await scenarioRunner.runScenario(
          issue.number,
          issue.title,
          issue.body,
        );

        if (scenario.expectedOutcome === "success") {
          TestAssertions.assertWorkflowSuccess(result);
        } else if (scenario.expectedOutcome === "human_review") {
          TestAssertions.assertHumanReviewRequired(result);
        } else {
          TestAssertions.assertWorkflowFailure(result);
        }

        TestAssertions.assertPerformanceWithinBounds(
          result,
          scenario.performanceTarget,
        );
      });
    });
  });

  describe("Performance Benchmarking Tests", () => {
    it("should complete workflow within performance benchmarks", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issues = TestDataGenerator.generateIssueBatch(5, "simpleBug");

      performanceMonitor.start();

      const results = await Promise.all(
        issues.map((issue) => {
          context.githubMock.issues.get.mockResolvedValue({ data: issue });
          context.openCodeMock.analyze.mockResolvedValue({
            category: "bug",
            complexity: "low",
            requirements: ["Fix bug"],
            acceptanceCriteria: ["Bug fixed"],
            feasible: true,
            confidence: 0.9,
            reasoning: "Simple fix",
          });
          context.openCodeMock.generateCode.mockResolvedValue({
            changes: [
              { file: "fix.js", line: 1, oldCode: "bug", newCode: "fixed" },
            ],
            explanation: "Fixed bug",
          });
          context.openCodeMock.reviewCode.mockResolvedValue({
            approved: true,
            score: 0.85,
            comments: [],
            securityIssues: [],
            qualityScore: 0.9,
            performanceScore: 0.8,
            maintainabilityScore: 0.95,
            testCoverageScore: 0.7,
            recommendations: [],
          });
          context.githubMock.pulls.create.mockResolvedValue({
            data: {
              number: issue.number + 1000,
              html_url: `https://github.com/test/repo/pull/${issue.number + 1000}`,
            },
          });

          return scenarioRunner.runScenario(
            issue.number,
            issue.title,
            issue.body,
          );
        }),
      );

      const metrics = performanceMonitor.end();

      // Assert all workflows succeeded
      results.forEach((result) => {
        TestAssertions.assertWorkflowSuccess(result);
      });

      // Assert performance benchmarks
      expect(metrics.totalDuration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout * 5,
      );
      expect(metrics.memoryUsage.peak).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.memory.maxWorkflowMemory * 10,
      );
    });

    it("should handle concurrent workflow processing", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const concurrentWorkflows = 10;
      const issues = TestDataGenerator.generateIssueBatch(
        concurrentWorkflows,
        "simpleBug",
      );

      performanceMonitor.start();

      // Setup all mocks
      issues.forEach((issue) => {
        context.githubMock.issues.get.mockResolvedValue({ data: issue });
        context.openCodeMock.analyze.mockResolvedValue({
          category: "bug",
          complexity: "low",
          requirements: ["Fix bug"],
          acceptanceCriteria: ["Bug fixed"],
          feasible: true,
          confidence: 0.9,
          reasoning: "Simple fix",
        });
        context.openCodeMock.generateCode.mockResolvedValue({
          changes: [
            { file: "fix.js", line: 1, oldCode: "bug", newCode: "fixed" },
          ],
          explanation: "Fixed bug",
        });
        context.openCodeMock.reviewCode.mockResolvedValue({
          approved: true,
          score: 0.85,
          comments: [],
          securityIssues: [],
          qualityScore: 0.9,
          performanceScore: 0.8,
          maintainabilityScore: 0.95,
          testCoverageScore: 0.7,
          recommendations: [],
        });
        context.githubMock.pulls.create.mockResolvedValue({
          data: {
            number: issue.number + 1000,
            html_url: `https://github.com/test/repo/pull/${issue.number + 1000}`,
          },
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(
        issues.map((issue) =>
          scenarioRunner.runScenario(issue.number, issue.title, issue.body),
        ),
      );
      const totalDuration = Date.now() - startTime;

      const metrics = performanceMonitor.end();

      // Assert all workflows succeeded
      results.forEach((result) => {
        TestAssertions.assertWorkflowSuccess(result);
      });

      // Assert throughput requirements
      const avgDuration = totalDuration / concurrentWorkflows;
      expect(avgDuration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      );
      expect(totalDuration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout * concurrentWorkflows,
      );
    });
  });

  describe("Error Handling and Recovery Tests", () => {
    it("should handle GitHub API failures gracefully", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      // Setup GitHub API to fail
      context.githubMock.issues.get.mockRejectedValue(
        new Error("GitHub API rate limit exceeded"),
      );

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowFailure(result, "GitHub API");
      expect(result.errors).toContain(
        "Workflow execution failed: GitHub API rate limit exceeded",
      );
    });

    it("should handle AI agent failures with retry logic", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      context.githubMock.issues.get.mockResolvedValue({ data: issue });

      // AI analysis fails
      context.openCodeMock.analyze.mockRejectedValue(
        new Error("AI service unavailable"),
      );

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowFailure(result, "AI service");
      expect(result.errors).toContain(
        "Workflow execution failed: AI service unavailable",
      );
    });

    it("should handle code generation failures", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Fix bug"],
        acceptanceCriteria: ["Bug fixed"],
        feasible: true,
        confidence: 0.9,
        reasoning: "Simple fix",
      });

      // Code generation fails
      context.openCodeMock.generateCode.mockRejectedValue(
        new Error("Code generation failed"),
      );

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowFailure(result, "Code generation failed");
    });

    it("should handle code review rejections", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Fix bug"],
        acceptanceCriteria: ["Bug fixed"],
        feasible: true,
        confidence: 0.9,
        reasoning: "Simple fix",
      });

      context.openCodeMock.generateCode.mockResolvedValue({
        changes: [
          { file: "fix.js", line: 1, oldCode: "bug", newCode: "fixed" },
        ],
        explanation: "Fixed bug",
      });

      // Code review rejects the changes
      context.openCodeMock.reviewCode.mockResolvedValue({
        approved: false,
        score: 0.4,
        comments: ["Code quality issues", "Missing error handling"],
        securityIssues: ["Potential vulnerability"],
        qualityScore: 0.5,
        performanceScore: 0.6,
        maintainabilityScore: 0.4,
        testCoverageScore: 0.3,
        recommendations: ["Add proper error handling", "Improve code quality"],
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertHumanReviewRequired(result);
      expect(result.outputs.review!.approved).toBe(false);
    });
  });

  describe("Complexity Validation Tests", () => {
    it("should reject critical complexity issues", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.criticalSecurity;

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "bug",
        complexity: "critical",
        requirements: ["Fix critical security issue"],
        acceptanceCriteria: ["Security vulnerability patched"],
        feasible: true, // Even if feasible, critical complexity triggers human review
        confidence: 0.95,
        reasoning: "Critical security fix required",
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertHumanReviewRequired(result);
      expect(result.outputs.analysis!.complexity).toBe("critical");
    });

    it("should handle infeasible issues appropriately", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.questionClarification;

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "question",
        complexity: "low",
        requirements: ["Provide guidance"],
        acceptanceCriteria: ["User has answer"],
        feasible: false, // Questions are not feasible for autonomous resolution
        confidence: 0.3,
        reasoning: "Question requires human clarification",
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertHumanReviewRequired(result);
      expect(result.outputs.analysis!.feasible).toBe(false);
      expect(result.outputs.analysis!.category).toBe("question");
    });

    it("should process medium complexity issues successfully", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TestDataGenerator.generateRandomIssue({
        title: "Implement user profile page",
        labels: [{ name: "enhancement" }],
      });

      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "enhancement",
        complexity: "medium",
        requirements: [
          "Create profile page",
          "Add user data display",
          "Implement edit functionality",
        ],
        acceptanceCriteria: [
          "Profile page functional",
          "User can view and edit data",
        ],
        feasible: true,
        confidence: 0.8,
        reasoning:
          "Medium complexity feature that can be implemented autonomously",
      });

      context.openCodeMock.generateCode.mockResolvedValue({
        changes: [
          {
            file: "src/pages/ProfilePage.js",
            line: 1,
            oldCode: "",
            newCode: "// Profile page implementation",
          },
          {
            file: "src/components/UserProfile.js",
            line: 1,
            oldCode: "",
            newCode: "// User profile component",
          },
        ],
        explanation: "Implemented user profile page with edit functionality",
      });

      context.openCodeMock.reviewCode.mockResolvedValue({
        approved: true,
        score: 0.82,
        comments: ["Good implementation", "Consider adding tests"],
        securityIssues: [],
        qualityScore: 0.85,
        performanceScore: 0.8,
        maintainabilityScore: 0.8,
        testCoverageScore: 0.6,
        recommendations: [
          "Add unit tests",
          "Consider accessibility improvements",
        ],
      });

      context.githubMock.pulls.create.mockResolvedValue({
        data: {
          number: 300,
          html_url: "https://github.com/test/repo/pull/300",
        },
      });

      const result = await scenarioRunner.runScenario(
        issue.number,
        issue.title,
        issue.body,
      );

      TestAssertions.assertWorkflowSuccess(result);
      expect(result.outputs.analysis!.complexity).toBe("medium");
    });
  });

  describe("Cleanup and Teardown Tests", () => {
    it("should properly cleanup resources after workflow completion", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      // Setup successful workflow
      context.githubMock.issues.get.mockResolvedValue({ data: issue });
      context.openCodeMock.analyze.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Fix bug"],
        acceptanceCriteria: ["Bug fixed"],
        feasible: true,
        confidence: 0.9,
        reasoning: "Simple fix",
      });

      context.openCodeMock.generateCode.mockResolvedValue({
        changes: [
          { file: "fix.js", line: 1, oldCode: "bug", newCode: "fixed" },
        ],
        explanation: "Fixed bug",
      });

      context.openCodeMock.reviewCode.mockResolvedValue({
        approved: true,
        score: 0.85,
        comments: [],
        securityIssues: [],
        qualityScore: 0.9,
        performanceScore: 0.8,
        maintainabilityScore: 0.95,
        testCoverageScore: 0.7,
        recommendations: [],
      });

      context.githubMock.pulls.create.mockResolvedValue({
        data: {
          number: 400,
          html_url: "https://github.com/test/repo/pull/400",
        },
      });

      // Run workflow
      await scenarioRunner.runScenario(issue.number, issue.title, issue.body);

      // Teardown should be called in afterEach, verify cleanup
      expect(context.orchestrator.getActiveWorkflows()).toHaveLength(0);
    });

    it("should handle cleanup after failed workflows", async () => {
      const context = scenarioRunner.getCurrentContext()!;
      const issue = TEST_ISSUES.simpleBug;

      // Setup failing workflow
      context.githubMock.issues.get.mockRejectedValue(new Error("API failure"));

      // Run failing workflow
      await scenarioRunner.runScenario(issue.number, issue.title, issue.body);

      // Verify cleanup still happens
      expect(context.orchestrator.getActiveWorkflows()).toHaveLength(0);

      // Verify completed workflows are tracked
      const completedWorkflows = context.orchestrator.getCompletedWorkflows();
      expect(completedWorkflows).toHaveLength(1);
      expect(completedWorkflows[0].success).toBe(false);
    });

    it("should maintain test isolation between scenarios", async () => {
      const context = scenarioRunner.getCurrentContext()!;

      // Run multiple scenarios and verify isolation
      const scenarios = [
        { issue: TEST_ISSUES.simpleBug, shouldSucceed: true },
        { issue: TEST_ISSUES.complexFeature, shouldSucceed: false },
        { issue: TEST_ISSUES.documentationUpdate, shouldSucceed: true },
      ];

      for (const scenario of scenarios) {
        // Reset mocks for each scenario
        vi.clearAllMocks();

        context.githubMock.issues.get.mockResolvedValue({
          data: scenario.issue,
        });

        if (scenario.shouldSucceed) {
          context.openCodeMock.analyze.mockResolvedValue({
            category: "bug",
            complexity: "low",
            requirements: ["Fix issue"],
            acceptanceCriteria: ["Issue fixed"],
            feasible: true,
            confidence: 0.9,
            reasoning: "Simple fix",
          });

          context.openCodeMock.generateCode.mockResolvedValue({
            changes: [
              { file: "fix.js", line: 1, oldCode: "old", newCode: "new" },
            ],
            explanation: "Fixed issue",
          });

          context.openCodeMock.reviewCode.mockResolvedValue({
            approved: true,
            score: 0.85,
            comments: [],
            securityIssues: [],
            qualityScore: 0.9,
            performanceScore: 0.8,
            maintainabilityScore: 0.95,
            testCoverageScore: 0.7,
            recommendations: [],
          });

          context.githubMock.pulls.create.mockResolvedValue({
            data: {
              number: 500,
              html_url: "https://github.com/test/repo/pull/500",
            },
          });
        } else {
          context.openCodeMock.analyze.mockResolvedValue({
            category: "feature",
            complexity: "high",
            requirements: ["Complex implementation"],
            acceptanceCriteria: ["Complex feature implemented"],
            feasible: false,
            confidence: 0.5,
            reasoning: "Too complex",
          });
        }

        const result = await scenarioRunner.runScenario(
          scenario.issue.number,
          scenario.issue.title,
          scenario.issue.body,
        );

        if (scenario.shouldSucceed) {
          TestAssertions.assertWorkflowSuccess(result);
        } else {
          TestAssertions.assertHumanReviewRequired(result);
        }
      }

      // Verify all workflows completed and were tracked separately
      const completedWorkflows = context.orchestrator.getCompletedWorkflows();
      expect(completedWorkflows).toHaveLength(scenarios.length);
    });
  });
});
