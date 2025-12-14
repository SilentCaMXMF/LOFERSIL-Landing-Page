/**
 * Scenario Builders
 *
 * Builders for creating complex test scenarios that combine multiple components
 * and simulate real-world workflows with various edge cases and error conditions.
 */

import { vi } from "vitest";
import { GitHubIssue } from "../mocks/github-api";
import {
  OpenCodeAnalysis,
  OpenCodeSolution,
  OpenCodeReviewResult,
} from "../mocks/opencode-agent";
import { WorktreeInfo } from "../mocks/worktree-manager";
import {
  createMockIssueAnalyzer,
  createMockAutonomousResolver,
  createMockCodeReviewer,
  createMockPRGenerator,
  createMockWorkflowOrchestrator,
  createMockWorktreeManager,
} from "../utils/mock-factories";
import {
  SIMPLE_BUGS,
  FEATURE_REQUESTS,
  COMPLEX_ISSUES,
  SECURITY_ISSUES,
} from "../fixtures/github-issues";

/**
 * Base scenario builder class
 */
export class ScenarioBuilder {
  private issue: GitHubIssue | null = null;
  private analysis: OpenCodeAnalysis | null = null;
  private solution: OpenCodeSolution | null = null;
  private review: OpenCodeReviewResult | null = null;
  private worktree: WorktreeInfo | null = null;
  private errorInjection: ErrorInjection | null = null;

  /**
   * Set the GitHub issue for this scenario
   */
  withIssue(issue: GitHubIssue): this {
    this.issue = issue;
    return this;
  }

  /**
   * Set the analysis result for this scenario
   */
  withAnalysis(analysis: OpenCodeAnalysis): this {
    this.analysis = analysis;
    return this;
  }

  /**
   * Set the solution for this scenario
   */
  withSolution(solution: OpenCodeSolution): this {
    return this;
  }

  /**
   * Set the review result for this scenario
   */
  withReview(review: OpenCodeReviewResult): this {
    this.review = review;
    return this;
  }

  /**
   * Set the worktree information for this scenario
   */
  withWorktree(worktree: WorktreeInfo): this {
    this.worktree = worktree;
    return this;
  }

  /**
   * Inject errors at specific points in the workflow
   */
  withErrorInjection(injection: ErrorInjection): this {
    this.errorInjection = injection;
    return this;
  }

  /**
   * Build the scenario configuration
   */
  build(): TestScenario {
    if (!this.issue) {
      throw new Error("Issue is required for scenario");
    }

    return {
      issue: this.issue,
      analysis: this.analysis,
      solution: this.solution,
      review: this.review,
      worktree: this.worktree,
      errorInjection: this.errorInjection,
    };
  }
}

/**
 * Error injection configuration
 */
export interface ErrorInjection {
  stage: "analysis" | "resolution" | "review" | "pr-creation" | "worktree";
  error: Error;
  timing: "immediate" | "delayed";
  delay?: number;
}

/**
 * Test scenario configuration
 */
export interface TestScenario {
  issue: GitHubIssue;
  analysis: OpenCodeAnalysis | null;
  solution: OpenCodeSolution | null;
  review: OpenCodeReviewResult | null;
  worktree: WorktreeInfo | null;
  errorInjection: ErrorInjection | null;
}

/**
 * Predefined scenario builders for common test cases
 */
export class ScenarioTemplates {
  /**
   * Create a successful bug fix scenario
   */
  static successfulBugFix(): TestScenario {
    return new ScenarioBuilder().withIssue(SIMPLE_BUGS.buttonStyling).build();
  }

  /**
   * Create a complex feature scenario that should be rejected
   */
  static complexFeatureRejection(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(COMPLEX_ISSUES.authenticationSystem)
      .build();
  }

  /**
   * Create a security issue scenario
   */
  static securityIssue(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(SECURITY_ISSUES.sqlInjection)
      .build();
  }

  /**
   * Create a scenario with analysis failure
   */
  static analysisFailure(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(SIMPLE_BUGS.buttonStyling)
      .withErrorInjection({
        stage: "analysis",
        error: new Error("Analysis service unavailable"),
        timing: "immediate",
      })
      .build();
  }

  /**
   * Create a scenario with solution generation failure
   */
  static solutionFailure(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(SIMPLE_BUGS.buttonStyling)
      .withErrorInjection({
        stage: "resolution",
        error: new Error("Code generation failed"),
        timing: "delayed",
        delay: 1000,
      })
      .build();
  }

  /**
   * Create a scenario with code review failure
   */
  static reviewFailure(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(SIMPLE_BUGS.buttonStyling)
      .withErrorInjection({
        stage: "review",
        error: new Error("Security vulnerability detected"),
        timing: "immediate",
      })
      .build();
  }

  /**
   * Create a performance test scenario with large data
   */
  static performanceTest(): TestScenario {
    const largeIssue: GitHubIssue = {
      ...SIMPLE_BUGS.buttonStyling,
      body: "A".repeat(50000), // 50KB of content
      title: "Performance test issue with large content",
    };

    return new ScenarioBuilder().withIssue(largeIssue).build();
  }

  /**
   * Create a scenario with network timeouts
   */
  static networkTimeout(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(SIMPLE_BUGS.buttonStyling)
      .withErrorInjection({
        stage: "analysis",
        error: new Error("Network timeout"),
        timing: "delayed",
        delay: 30000, // 30 second timeout
      })
      .build();
  }

  /**
   * Create a scenario with concurrent workflow conflicts
   */
  static concurrentWorkflow(): TestScenario {
    return new ScenarioBuilder()
      .withIssue(FEATURE_REQUESTS.darkMode)
      .withErrorInjection({
        stage: "worktree",
        error: new Error("Worktree already exists"),
        timing: "immediate",
      })
      .build();
  }
}

/**
 * Workflow executor for running test scenarios
 */
export class ScenarioExecutor {
  private mocks: {
    issueAnalyzer: any;
    autonomousResolver: any;
    codeReviewer: any;
    prGenerator: any;
    workflowOrchestrator: any;
    worktreeManager: any;
  };

  constructor() {
    this.mocks = {
      issueAnalyzer: createMockIssueAnalyzer(),
      autonomousResolver: createMockAutonomousResolver(),
      codeReviewer: createMockCodeReviewer(),
      prGenerator: createMockPRGenerator(),
      workflowOrchestrator: createMockWorkflowOrchestrator(),
      worktreeManager: createMockWorktreeManager(),
    };
  }

  /**
   * Configure mocks based on scenario
   */
  configureForScenario(scenario: TestScenario): void {
    // Configure issue analyzer
    if (scenario.analysis) {
      this.mocks.issueAnalyzer.analyzeIssue.mockResolvedValue(
        scenario.analysis,
      );
    }

    // Configure autonomous resolver
    if (scenario.solution) {
      this.mocks.autonomousResolver.resolveIssue.mockResolvedValue(
        scenario.solution,
      );
    }

    // Configure code reviewer
    if (scenario.review) {
      this.mocks.codeReviewer.reviewChanges.mockResolvedValue(scenario.review);
    }

    // Configure worktree manager
    if (scenario.worktree) {
      this.mocks.worktreeManager.createWorktree.mockResolvedValue(
        scenario.worktree,
      );
    }

    // Configure error injections
    if (scenario.errorInjection) {
      this.configureErrorInjection(scenario.errorInjection);
    }
  }

  /**
   * Configure error injection for specific stages
   */
  private configureErrorInjection(injection: ErrorInjection): void {
    const mock = this.getMockForStage(injection.stage);

    if (injection.timing === "immediate") {
      mock.mockRejectedValue(injection.error);
    } else {
      mock.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(injection.error), injection.delay || 1000);
        });
      });
    }
  }

  /**
   * Get the appropriate mock for a workflow stage
   */
  private getMockForStage(stage: ErrorInjection["stage"]): any {
    const stageMap = {
      analysis: this.mocks.issueAnalyzer.analyzeIssue,
      resolution: this.mocks.autonomousResolver.resolveIssue,
      review: this.mocks.codeReviewer.reviewChanges,
      "pr-creation": this.mocks.prGenerator.createPullRequest,
      worktree: this.mocks.worktreeManager.createWorktree,
    };

    return stageMap[stage];
  }

  /**
   * Execute the workflow for a scenario
   */
  async executeScenario(scenario: TestScenario): Promise<any> {
    this.configureForScenario(scenario);

    try {
      // Execute the workflow
      const result = await this.mocks.workflowOrchestrator.processIssue(
        scenario.issue.number,
      );
      return { success: true, result };
    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Get all configured mocks for verification
   */
  getMocks(): typeof this.mocks {
    return this.mocks;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    Object.values(this.mocks).forEach((mock) => {
      if (typeof mock === "object" && mock !== null) {
        Object.values(mock).forEach((method) => {
          if (
            typeof method === "object" &&
            method !== null &&
            "mockClear" in method
          ) {
            (method as any).mockClear();
          }
        });
      }
    });
  }
}

/**
 * Performance scenario builder for load and stress testing
 */
export class PerformanceScenarioBuilder {
  private concurrentUsers: number = 1;
  private duration: number = 60000; // 1 minute
  private rampUpTime: number = 10000; // 10 seconds
  private scenarios: TestScenario[] = [];

  /**
   * Set number of concurrent users
   */
  withConcurrentUsers(users: number): this {
    this.concurrentUsers = users;
    return this;
  }

  /**
   * Set test duration in milliseconds
   */
  withDuration(duration: number): this {
    this.duration = duration;
    return this;
  }

  /**
   * Set ramp-up time for gradual load increase
   */
  withRampUpTime(rampUpTime: number): this {
    this.rampUpTime = rampUpTime;
    return this;
  }

  /**
   * Add scenarios to the performance test
   */
  withScenarios(scenarios: TestScenario[]): this {
    this.scenarios = scenarios;
    return this;
  }

  /**
   * Build performance test configuration
   */
  build(): PerformanceTestConfig {
    return {
      concurrentUsers: this.concurrentUsers,
      duration: this.duration,
      rampUpTime: this.rampUpTime,
      scenarios: this.scenarios,
    };
  }
}

/**
 * Performance test configuration
 */
export interface PerformanceTestConfig {
  concurrentUsers: number;
  duration: number;
  rampUpTime: number;
  scenarios: TestScenario[];
}

/**
 * Load testing utilities
 */
export class LoadTester {
  /**
   * Run a performance test with the given configuration
   */
  static async runPerformanceTest(
    config: PerformanceTestConfig,
  ): Promise<PerformanceResults> {
    const startTime = Date.now();
    const results: PerformanceResults = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimes: [],
      errors: [],
    };

    const executors = Array.from(
      { length: config.concurrentUsers },
      () => new ScenarioExecutor(),
    );

    // Run scenarios concurrently
    const promises = executors.map(async (executor, index) => {
      const scenario = config.scenarios[index % config.scenarios.length];
      const scenarioStartTime = Date.now();

      try {
        const result = await executor.executeScenario(scenario);
        const responseTime = Date.now() - scenarioStartTime;

        results.totalRequests++;
        results.responseTimes.push(responseTime);
        results.averageResponseTime =
          (results.averageResponseTime * (results.totalRequests - 1) +
            responseTime) /
          results.totalRequests;
        results.minResponseTime = Math.min(
          results.minResponseTime,
          responseTime,
        );
        results.maxResponseTime = Math.max(
          results.maxResponseTime,
          responseTime,
        );

        if (result.success) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push(result.error);
        }
      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
        results.errors.push(error);
      }
    });

    await Promise.all(promises);

    results.averageResponseTime =
      results.responseTimes.reduce((a, b) => a + b, 0) /
      results.responseTimes.length;

    return results;
  }
}

/**
 * Performance test results
 */
export interface PerformanceResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  responseTimes: number[];
  errors: any[];
}
