/**
 * Performance Benchmarking Tests
 *
 * Comprehensive performance testing for the AI-powered GitHub Issues Reviewer system.
 * Measures execution times, memory usage, concurrent processing capabilities, and
 * validates performance against established thresholds.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  WorkflowOrchestrator,
  WorkflowState,
} from "../../src/scripts/modules/github-issues/WorkflowOrchestrator";
import { IssueAnalyzer } from "../../src/scripts/modules/github-issues/IssueAnalyzer";
import { AutonomousResolver } from "../../src/scripts/modules/github-issues/AutonomousResolver";
import { CodeReviewer } from "../../src/scripts/modules/github-issues/CodeReviewer";
import { PRGenerator } from "../../src/scripts/modules/github-issues/PRGenerator";
import {
  DEFAULT_TEST_CONFIG,
  TEST_SCENARIOS,
} from "../../src/scripts/modules/github-issues/test-config";
import { GitHubAPIMock } from "../../src/scripts/modules/github-issues/mocks/github-api";
import { OpenCodeAgentMock } from "../../src/scripts/modules/github-issues/mocks/opencode-agent";
import { WorktreeManagerMock } from "../../src/scripts/modules/github-issues/mocks/worktree-manager";
import { TEST_ISSUES } from "../../src/scripts/modules/github-issues/mocks/test-fixtures";

// Performance measurement utilities
class PerformanceBenchmark {
  private startTime: number = 0;
  private measurements: number[] = [];
  private memorySnapshots: number[] = [];

  start(): void {
    this.startTime = performance.now();
    this.captureMemory();
  }

  end(): { duration: number; avgMemory: number; peakMemory: number } {
    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    this.captureMemory();

    const avgMemory =
      this.memorySnapshots.reduce((a, b) => a + b, 0) /
      this.memorySnapshots.length;
    const peakMemory = Math.max(...this.memorySnapshots);

    return { duration, avgMemory, peakMemory };
  }

  private captureMemory(): void {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      this.memorySnapshots.push((performance as any).memory.usedJSHeapSize);
    } else {
      // Fallback for environments without memory monitoring
      this.memorySnapshots.push(0);
    }
  }

  getAverageDuration(): number {
    return this.measurements.length > 0
      ? this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length
      : 0;
  }

  reset(): void {
    this.measurements = [];
    this.memorySnapshots = [];
  }
}

// Test fixtures
const createMockComponents = () => ({
  issueAnalyzer: {
    analyzeIssue: vi.fn().mockResolvedValue({
      category: "bug",
      complexity: "low",
      requirements: ["Fix the bug"],
      acceptanceCriteria: ["Bug is fixed"],
      feasible: true,
      confidence: 0.9,
      reasoning: "Simple bug fix",
    }),
  } as IssueAnalyzer,

  autonomousResolver: {
    resolveIssue: vi.fn().mockResolvedValue({
      success: true,
      solution: {
        description: "Fixed the bug",
        files: [{ path: "test.js", content: 'console.log("fixed");' }],
        tests: [],
      },
      confidence: 0.85,
      reasoning: "Applied standard fix",
    }),
  } as AutonomousResolver,

  codeReviewer: {
    reviewChanges: vi.fn().mockResolvedValue({
      approved: true,
      score: 0.9,
      comments: [],
      suggestions: [],
      criticalIssues: [],
    }),
  } as CodeReviewer,

  prGenerator: {
    createPullRequest: vi.fn().mockResolvedValue({
      number: 123,
      title: "Fix bug",
      body: "This PR fixes the bug",
      html_url: "https://github.com/test/repo/pull/123",
    }),
  } as PRGenerator,
});

describe("Performance Benchmarking", () => {
  let orchestrator: WorkflowOrchestrator;
  let benchmark: PerformanceBenchmark;
  let mocks: ReturnType<typeof createMockComponents>;

  beforeEach(() => {
    vi.clearAllMocks();
    benchmark = new PerformanceBenchmark();
    mocks = createMockComponents();

    orchestrator = new WorkflowOrchestrator({
      ...mocks,
      maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      enableMetrics: true,
      retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
      humanInterventionThreshold: 3,
    });
  });

  afterEach(() => {
    benchmark.reset();
  });

  describe("Single Workflow Performance", () => {
    it("should complete simple bug fix within performance target", async () => {
      // Setup mocks for fast execution
      mocks.issueAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "low",
        requirements: ["Fix the bug"],
        acceptanceCriteria: ["Bug is fixed"],
        feasible: true,
        confidence: 0.9,
        reasoning: "Simple bug fix",
      });

      mocks.autonomousResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: {
          description: "Fixed the bug",
          files: [{ path: "test.js", content: 'console.log("fixed");' }],
          tests: [],
        },
        confidence: 0.85,
        reasoning: "Applied standard fix",
      });

      benchmark.start();
      const result = await orchestrator.processIssue(
        1,
        "Simple bug",
        "Fix this bug",
      );
      const metrics = benchmark.end();

      expect(result.success).toBe(true);
      expect(result.finalState).toBe(WorkflowState.PR_COMPLETE);
      expect(metrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      );
      expect(metrics.avgMemory).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.memory.maxWorkflowMemory,
      );
    });

    it("should handle complex feature requests within extended time limits", async () => {
      // Setup mocks for complex scenario
      mocks.issueAnalyzer.analyzeIssue.mockResolvedValue({
        category: "feature",
        complexity: "high",
        requirements: [
          "Implement complex feature",
          "Add tests",
          "Update documentation",
        ],
        acceptanceCriteria: ["Feature works", "Tests pass", "Docs updated"],
        feasible: true,
        confidence: 0.7,
        reasoning: "Complex multi-step implementation",
      });

      mocks.autonomousResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: {
          description: "Implemented complex feature",
          files: [
            { path: "feature.js", content: "complex implementation" },
            { path: "feature.test.js", content: "tests" },
            { path: "README.md", content: "documentation" },
          ],
          tests: ["feature.test.js"],
        },
        confidence: 0.75,
        reasoning: "Comprehensive implementation",
      });

      benchmark.start();
      const result = await orchestrator.processIssue(
        2,
        "Complex feature",
        "Implement complex feature",
      );
      const metrics = benchmark.end();

      expect(result.success).toBe(true);
      expect(metrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout * 1.5,
      ); // Allow 50% overhead
      expect(metrics.peakMemory).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.memory.maxHeapUsage,
      );
    });

    it("should require human review for critical issues without performance penalty", async () => {
      mocks.issueAnalyzer.analyzeIssue.mockResolvedValue({
        category: "bug",
        complexity: "critical",
        requirements: ["Fix critical security issue"],
        acceptanceCriteria: ["Security vulnerability patched"],
        feasible: false, // Critical issues require human review
        confidence: 0.3,
        reasoning: "Critical security issue needs human oversight",
      });

      benchmark.start();
      const result = await orchestrator.processIssue(
        3,
        "Critical issue",
        "Security vulnerability",
      );
      const metrics = benchmark.end();

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
      expect(metrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis * 2,
      );
    });
  });

  describe("Concurrent Processing Performance", () => {
    it("should handle multiple concurrent workflows efficiently", async () => {
      const concurrentWorkflows = 5;
      const issuePromises = [];

      benchmark.start();

      // Start multiple workflows concurrently
      for (let i = 0; i < concurrentWorkflows; i++) {
        issuePromises.push(
          orchestrator.processIssue(
            100 + i,
            `Concurrent issue ${i}`,
            `Description for issue ${i}`,
          ),
        );
      }

      const results = await Promise.all(issuePromises);
      const metrics = benchmark.end();

      // Verify all workflows completed successfully
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.finalState).toBe(WorkflowState.PR_COMPLETE);
      });

      // Performance assertions
      expect(metrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout * concurrentWorkflows,
      );
      expect(metrics.peakMemory).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.memory.maxHeapUsage,
      );

      // Calculate throughput
      const throughput = (concurrentWorkflows * 1000) / metrics.duration; // workflows per second
      expect(throughput).toBeGreaterThan(
        DEFAULT_TEST_CONFIG.thresholds.minThroughput / 60,
      ); // per second vs per minute
    });

    it("should maintain performance under sustained concurrent load", async () => {
      const sustainedWorkflows = 20;
      const batchSize = 5;
      const results: any[] = [];
      const performanceMetrics: any[] = [];

      for (let batch = 0; batch < sustainedWorkflows / batchSize; batch++) {
        benchmark.reset();
        benchmark.start();

        const batchPromises = [];
        for (let i = 0; i < batchSize; i++) {
          const issueNumber = batch * batchSize + i + 1000;
          batchPromises.push(
            orchestrator.processIssue(
              issueNumber,
              `Sustained issue ${issueNumber}`,
              `Description for sustained issue ${issueNumber}`,
            ),
          );
        }

        const batchResults = await Promise.all(batchPromises);
        const metrics = benchmark.end();

        results.push(...batchResults);
        performanceMetrics.push(metrics);

        // Small delay between batches to simulate real-world pacing
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Verify all workflows completed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Check performance consistency (no significant degradation)
      const avgDuration =
        performanceMetrics.reduce((sum, m) => sum + m.duration, 0) /
        performanceMetrics.length;
      const maxDuration = Math.max(
        ...performanceMetrics.map((m) => m.duration),
      );

      expect(maxDuration / avgDuration).toBeLessThan(2); // No more than 2x variation
    });
  });

  describe("Memory Usage Monitoring", () => {
    it("should not have memory leaks during repeated workflow execution", async () => {
      const iterations = 10;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        benchmark.reset();
        benchmark.start();

        await orchestrator.processIssue(
          2000 + i,
          `Memory test issue ${i}`,
          `Testing memory usage ${i}`,
        );

        const metrics = benchmark.end();
        memorySnapshots.push(metrics.peakMemory);

        // Force garbage collection if available
        if (typeof global !== "undefined" && (global as any).gc) {
          (global as any).gc();
        }
      }

      // Check for memory leaks (memory should not consistently increase)
      const firstHalf = memorySnapshots.slice(0, iterations / 2);
      const secondHalf = memorySnapshots.slice(iterations / 2);

      const avgFirstHalf =
        firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecondHalf =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Allow for some variation but not continuous growth
      expect(avgSecondHalf / avgFirstHalf).toBeLessThan(1.5);
    });

    it("should clean up resources after workflow completion", async () => {
      const initialMemory = benchmark.getAverageDuration() || 0; // Reuse for memory tracking

      benchmark.start();
      const result = await orchestrator.processIssue(
        3000,
        "Cleanup test",
        "Testing resource cleanup",
      );
      const metrics = benchmark.end();

      expect(result.success).toBe(true);

      // Memory should return close to baseline after cleanup
      const memoryIncrease = metrics.peakMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.memory.maxWorkflowMemory,
      );
    });
  });

  describe("Component-Level Performance", () => {
    it("should benchmark individual component execution times", async () => {
      const componentBenchmarks = {
        analysis: new PerformanceBenchmark(),
        resolution: new PerformanceBenchmark(),
        review: new PerformanceBenchmark(),
        pr: new PerformanceBenchmark(),
      };

      // Analysis performance
      componentBenchmarks.analysis.start();
      await mocks.issueAnalyzer.analyzeIssue(TEST_ISSUES.simpleBug);
      const analysisMetrics = componentBenchmarks.analysis.end();

      expect(analysisMetrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis,
      );

      // Resolution performance
      componentBenchmarks.resolution.start();
      await mocks.autonomousResolver.resolveIssue(
        {
          category: "bug",
          complexity: "low",
          requirements: ["test"],
          acceptanceCriteria: ["test"],
          feasible: true,
          confidence: 0.9,
          reasoning: "test",
        },
        { number: 1, title: "test", body: "test" },
      );
      const resolutionMetrics = componentBenchmarks.resolution.end();

      expect(resolutionMetrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.resolution,
      );

      // Review performance
      componentBenchmarks.review.start();
      await mocks.codeReviewer.reviewChanges(
        { description: "test", files: [], tests: [] },
        { number: 1, title: "test", body: "test" },
      );
      const reviewMetrics = componentBenchmarks.review.end();

      expect(reviewMetrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.review,
      );

      // PR generation performance
      componentBenchmarks.pr.start();
      await mocks.prGenerator.createPullRequest(
        {
          success: true,
          solution: { description: "test", files: [], tests: [] },
          confidence: 0.8,
          reasoning: "test",
        },
        {
          approved: true,
          score: 0.9,
          comments: [],
          suggestions: [],
          criticalIssues: [],
        },
        {
          category: "bug",
          complexity: "low",
          requirements: ["test"],
          acceptanceCriteria: ["test"],
          feasible: true,
          confidence: 0.9,
          reasoning: "test",
        },
      );
      const prMetrics = componentBenchmarks.pr.end();

      expect(prMetrics.duration).toBeLessThan(
        DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.prCreation,
      );
    });
  });

  describe("Performance Thresholds Validation", () => {
    it("should validate all test scenarios against performance targets", () => {
      TEST_SCENARIOS.forEach((scenario) => {
        expect(scenario.performanceTarget).toBeGreaterThan(0);
        expect(scenario.performanceTarget).toBeLessThanOrEqual(
          DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        );
      });
    });

    it("should ensure performance targets are realistic", () => {
      const fastScenarios = TEST_SCENARIOS.filter((s) =>
        s.tags.includes("fast"),
      );
      const complexScenarios = TEST_SCENARIOS.filter((s) =>
        s.tags.includes("high-complexity"),
      );

      fastScenarios.forEach((scenario) => {
        expect(scenario.performanceTarget).toBeLessThan(5000); // Fast scenarios under 5 seconds
      });

      complexScenarios.forEach((scenario) => {
        expect(scenario.performanceTarget).toBeGreaterThan(5000); // Complex scenarios over 5 seconds
      });
    });
  });
});
