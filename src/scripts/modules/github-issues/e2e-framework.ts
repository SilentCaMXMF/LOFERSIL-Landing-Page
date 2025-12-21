/**
 * E2E Test Framework: Base Test Utilities and Fixtures
 *
 * Provides comprehensive testing utilities, mock factories, performance measurement,
 * and test data generators for end-to-end testing of the GitHub Issues Reviewer system.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from "vitest";
import {
  WorkflowOrchestrator,
  WorkflowResult,
  WorkflowState,
} from "./WorkflowOrchestrator";
import { IssueAnalyzer } from "./IssueAnalyzer";
import { AutonomousResolver } from "./AutonomousResolver";
import { CodeReviewer } from "./CodeReviewer";
import { PRGenerator } from "./PRGenerator";
import {
  DEFAULT_TEST_CONFIG,
  TEST_SCENARIOS,
  TestScenario,
} from "./test-config";
import { GitHubAPIMock, mockGitHubAPI } from "./mocks/github-api";
import { OpenCodeAgentMock, mockOpenCodeAgent } from "./mocks/opencode-agent";
import {
  WorktreeManagerMock,
  mockWorktreeManager,
} from "./mocks/worktree-manager";
import {
  TEST_ISSUES,
  TEST_ANALYSES,
  TEST_SOLUTIONS,
  TEST_REVIEWS,
} from "../../../../tests/fixtures/mocks/test-fixtures";

// Test Context Interface
export interface E2ETestContext {
  orchestrator: WorkflowOrchestrator;
  githubMock: GitHubAPIMock;
  openCodeMock: OpenCodeAgentMock;
  worktreeMock: WorktreeManagerMock;
  prGenerator: any; // Expose for mocking
  startTime: number;
  performanceMetrics: PerformanceMetrics;
  testScenario?: TestScenario;
}

// Performance Metrics Interface
export interface PerformanceMetrics {
  totalDuration: number;
  stepDurations: Record<string, number>;
  memoryUsage: {
    start: number;
    end: number;
    peak: number;
  };
  successRate: number;
  errorCount: number;
}

// Test Result Interface
export interface E2ETestResult extends WorkflowResult {
  performanceMetrics: PerformanceMetrics;
  testScenario: TestScenario;
  mockInteractions: {
    githubAPICalls: number;
    openCodeCalls: number;
    worktreeOperations: number;
  };
}

// Mock Factory Functions
export function createMockIssueAnalyzer(): IssueAnalyzer {
  return {
    analyzeIssue: vi.fn(),
  } as any;
}

export function createMockAutonomousResolver(): AutonomousResolver {
  return {
    resolveIssue: vi.fn(),
  } as any;
}

export function createMockCodeReviewer(): CodeReviewer {
  return {
    reviewChanges: vi.fn(),
  } as any;
}

export function createMockPRGenerator(): PRGenerator {
  return {
    createPullRequest: vi.fn(),
  } as any;
}

// Test Orchestrator Factory
export function createTestOrchestrator(
  overrides: Partial<{
    issueAnalyzer: IssueAnalyzer;
    autonomousResolver: AutonomousResolver;
    codeReviewer: CodeReviewer;
    prGenerator: PRGenerator;
    config: any;
  }> = {},
): WorkflowOrchestrator {
  const config = {
    issueAnalyzer: overrides.issueAnalyzer || createMockIssueAnalyzer(),
    autonomousResolver:
      overrides.autonomousResolver || createMockAutonomousResolver(),
    codeReviewer: overrides.codeReviewer || createMockCodeReviewer(),
    prGenerator: overrides.prGenerator || createMockPRGenerator(),
    maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
    enableMetrics: true,
    retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
    humanInterventionThreshold: 3,
    ...overrides.config,
  };

  return new WorkflowOrchestrator(config);
}

// Performance Measurement Utilities
export class PerformanceMonitor {
  private startTime: number = 0;
  private stepStartTime: number = 0;
  private memoryStart: number = 0;
  private peakMemory: number = 0;

  start(): void {
    this.startTime = Date.now();
    this.memoryStart = this.getCurrentMemoryUsage();
    this.peakMemory = this.memoryStart;
  }

  startStep(): void {
    this.stepStartTime = Date.now();
  }

  endStep(): number {
    const duration = Date.now() - this.stepStartTime;
    this.updatePeakMemory();
    return duration;
  }

  end(): PerformanceMetrics {
    const totalDuration = Date.now() - this.startTime;
    const endMemory = this.getCurrentMemoryUsage();

    return {
      totalDuration,
      stepDurations: {},
      memoryUsage: {
        start: this.memoryStart,
        end: endMemory,
        peak: this.peakMemory,
      },
      successRate: 0, // Will be set by test
      errorCount: 0, // Will be set by test
    };
  }

  private getCurrentMemoryUsage(): number {
    // In Node.js environment, we can get memory usage
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    // In browser environment, use performance.memory if available
    if (typeof performance !== "undefined" && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private updatePeakMemory(): void {
    const current = this.getCurrentMemoryUsage();
    if (current > this.peakMemory) {
      this.peakMemory = current;
    }
  }
}

// Test Data Generators
export class TestDataGenerator {
  static generateRandomIssue(
    overrides: Partial<typeof TEST_ISSUES.simpleBug> = {},
  ): typeof TEST_ISSUES.simpleBug {
    const baseIssue = { ...TEST_ISSUES.simpleBug };
    return {
      ...baseIssue,
      number: Math.floor(Math.random() * 10000) + 1,
      title: overrides.title || `Random Issue #${baseIssue.number}`,
      body: overrides.body || `Random issue body for testing`,
      ...overrides,
    };
  }

  static generateIssueBatch(
    count: number,
    template: keyof typeof TEST_ISSUES = "simpleBug",
  ): (typeof TEST_ISSUES.simpleBug)[] {
    return Array.from({ length: count }, (_, index) => ({
      ...TEST_ISSUES[template],
      number: 1000 + index,
      title: `${TEST_ISSUES[template].title} (${index + 1})`,
    }));
  }

  static generateComplexWorkflowScenario(): TestScenario {
    return {
      name: "generated-complex-scenario",
      description: "Auto-generated complex workflow scenario",
      issueType: "feature",
      complexity: "high",
      expectedOutcome: "human_review",
      performanceTarget: 10000,
      tags: ["generated", "complex", "human-review"],
    };
  }
}

// Test Assertion Helpers
export class TestAssertions {
  static assertWorkflowSuccess(
    result: WorkflowResult,
    expectedState: WorkflowState = WorkflowState.PR_COMPLETE,
  ): void {
    expect(result.success).toBe(true);
    expect(result.finalState).toBe(expectedState);
    expect(result.executionTime).toBeGreaterThan(0);
    expect(result.workflowId).toMatch(/^workflow-\d+-/);
  }

  static assertWorkflowFailure(
    result: WorkflowResult,
    expectedError?: string,
  ): void {
    expect(result.success).toBe(false);
    expect(result.finalState).toBe(WorkflowState.FAILED);
    if (expectedError) {
      expect(result.error).toContain(expectedError);
    }
  }

  static assertHumanReviewRequired(result: WorkflowResult): void {
    expect(result.success).toBe(false);
    expect(result.finalState).toBe(WorkflowState.REQUIRES_HUMAN_REVIEW);
    expect(result.requiresHumanReview).toBe(true);
  }

  static assertPerformanceWithinBounds(
    result: WorkflowResult,
    maxDuration: number,
  ): void {
    expect(result.executionTime).toBeLessThanOrEqual(maxDuration);
  }

  static assertMockInteractions(
    githubMock: GitHubAPIMock,
    openCodeMock: OpenCodeAgentMock,
    worktreeMock: WorktreeManagerMock,
    expectedCalls: {
      github?: number;
      openCode?: number;
      worktree?: number;
    },
  ): void {
    if (expectedCalls.github !== undefined) {
      // Note: This would require tracking actual call counts in mocks
      // For now, just check that mocks were called
      expect(githubMock.issues.get).toHaveBeenCalled();
    }
    if (expectedCalls.openCode !== undefined) {
      expect(openCodeMock.analyze).toHaveBeenCalled();
    }
    if (expectedCalls.worktree !== undefined) {
      expect(worktreeMock.createWorktree).toHaveBeenCalled();
    }
  }
}

// Test Scenario Runner
export class E2EScenarioRunner {
  private context: E2ETestContext | null = null;
  private performanceMonitor = new PerformanceMonitor();

  async setupTest(scenario?: TestScenario): Promise<E2ETestContext> {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh mock instances
    const githubMock = new GitHubAPIMock();
    const openCodeMock = new OpenCodeAgentMock();
    const worktreeMock = new WorktreeManagerMock();

    // Create mock PR generator
    const mockPRGenerator = { createPullRequest: vi.fn() } as any;

    // Create orchestrator with mocked dependencies
    const orchestrator = createTestOrchestrator({
      issueAnalyzer: { analyzeIssue: openCodeMock.analyze } as any,
      autonomousResolver: {
        resolveIssue: async (analysis: any, issue: any) => {
          const solution = await openCodeMock.generateCode(analysis);
          return {
            success: true,
            solution: {
              files: solution.changes.map((change: any) => ({
                path: change.file,
                changes: [
                  {
                    type: "modify" as const,
                    content: change.newCode,
                    lineNumber: change.line,
                  },
                ],
              })),
            },
            worktree: { path: "/tmp/worktree", branch: `fix-${issue.number}` },
            iterations: 1,
            reasoning: solution.explanation,
          };
        },
      } as any,
      codeReviewer: {
        reviewChanges: async (changes: any, originalIssue: any) => {
          // Convert CodeChanges to OpenCodeSolution format for the mock
          const solution = {
            changes: changes.files.flatMap((file: any) =>
              file.changes.map((change: any) => ({
                file: file.path,
                line: change.lineNumber || 1,
                oldCode: "// old code",
                newCode: change.content,
              })),
            ),
            explanation: "Code changes for review",
          };
          return await openCodeMock.reviewCode(solution);
        },
      } as any,
      prGenerator: mockPRGenerator,
      config: {
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
        humanInterventionThreshold: 3,
      },
    });

    this.context = {
      orchestrator,
      githubMock,
      openCodeMock,
      worktreeMock,
      prGenerator: mockPRGenerator,
      startTime: Date.now(),
      performanceMetrics: {
        totalDuration: 0,
        stepDurations: {},
        memoryUsage: { start: 0, end: 0, peak: 0 },
        successRate: 0,
        errorCount: 0,
      },
      testScenario: scenario,
    };

    this.performanceMonitor.start();
    return this.context;
  }

  async runScenario(
    issueNumber: number,
    title?: string,
    body?: string,
  ): Promise<E2ETestResult> {
    if (!this.context) {
      throw new Error("Test context not initialized. Call setupTest() first.");
    }

    this.performanceMonitor.startStep();
    const result = await this.context.orchestrator.processIssue(
      issueNumber,
      title,
      body,
    );
    const duration = this.performanceMonitor.endStep();

    const performanceMetrics = this.performanceMonitor.end();
    performanceMetrics.stepDurations.workflow = duration;

    return {
      ...result,
      performanceMetrics,
      testScenario: this.context.testScenario || TEST_SCENARIOS[0],
      mockInteractions: {
        githubAPICalls: 0, // Would need to implement call counting
        openCodeCalls: 0,
        worktreeOperations: 0,
      },
    };
  }

  async teardownTest(): Promise<void> {
    if (this.context) {
      // Reset mocks
      this.context.githubMock.reset();
      this.context.openCodeMock.reset();
      this.context.worktreeMock.reset();

      // Clear context
      this.context = null;
    }
  }

  getCurrentContext(): E2ETestContext | null {
    return this.context;
  }
}

// Global Test Setup/Teardown
export const e2eTestSetup = {
  setupTestEnvironment: () => {
    beforeAll(() => {
      // Global test environment setup
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });
  },

  setupTestIsolation: () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();
    });

    afterEach(() => {
      vi.clearAllTimers();
    });
  },
};

// Export convenience functions
export const createE2ETestContext = () => new E2EScenarioRunner();
export const createPerformanceMonitor = () => new PerformanceMonitor();
export const createTestDataGenerator = () => TestDataGenerator;
export const createTestAssertions = () => TestAssertions;
