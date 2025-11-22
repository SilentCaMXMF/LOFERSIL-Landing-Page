/**
 * Test Configuration for E2E Test Framework
 *
 * Central configuration for test environment setup, benchmark definitions,
 * performance thresholds, and mock configuration defaults.
 */

import { IssueAnalyzer } from './IssueAnalyzer';
import { AutonomousResolver } from './AutonomousResolver';
import { CodeReviewer } from './CodeReviewer';
import { PRGenerator } from './PRGenerator';

export interface TestEnvironmentConfig {
  timeout: number;
  retries: number;
  parallelExecution: boolean;
  cleanupAfterEach: boolean;
  enableMetrics: boolean;
  mockLatency: {
    min: number;
    max: number;
  };
}

export interface PerformanceBenchmarks {
  workflowTimeout: number;
  stepTimeouts: {
    analysis: number;
    resolution: number;
    review: number;
    prCreation: number;
  };
  throughput: {
    maxConcurrentWorkflows: number;
    targetWorkflowsPerMinute: number;
  };
  memory: {
    maxHeapUsage: number;
    maxWorkflowMemory: number;
  };
}

export interface TestThresholds {
  successRate: number;
  averageExecutionTime: number;
  maxFailureRate: number;
  minThroughput: number;
  maxMemoryUsage: number;
}

export interface MockConfig {
  github: {
    baseUrl: string;
    rateLimitDelay: number;
    failureRate: number;
    responseLatency: number;
  };
  openCode: {
    analysisLatency: number;
    generationLatency: number;
    reviewLatency: number;
    failureRate: number;
    qualityScoreRange: [number, number];
  };
  worktree: {
    creationLatency: number;
    operationLatency: number;
    failureRate: number;
  };
  database: {
    connectionLatency: number;
    queryLatency: number;
    failureRate: number;
  };
}

export interface TestScenario {
  name: string;
  description: string;
  issueType: 'bug' | 'feature' | 'documentation' | 'question' | 'enhancement';
  complexity: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome: 'success' | 'human_review' | 'failure';
  performanceTarget: number;
  tags: string[];
}

export const DEFAULT_TEST_CONFIG = {
  environment: {
    timeout: 30000,
    retries: 2,
    parallelExecution: true,
    cleanupAfterEach: true,
    enableMetrics: true,
    mockLatency: {
      min: 10,
      max: 100,
    },
  } as TestEnvironmentConfig,

  benchmarks: {
    workflowTimeout: 15000,
    stepTimeouts: {
      analysis: 2000,
      resolution: 5000,
      review: 3000,
      prCreation: 2000,
    },
    throughput: {
      maxConcurrentWorkflows: 10,
      targetWorkflowsPerMinute: 20,
    },
    memory: {
      maxHeapUsage: 100 * 1024 * 1024, // 100MB
      maxWorkflowMemory: 50 * 1024 * 1024, // 50MB
    },
  } as PerformanceBenchmarks,

  thresholds: {
    successRate: 0.95,
    averageExecutionTime: 8000,
    maxFailureRate: 0.05,
    minThroughput: 15,
    maxMemoryUsage: 80 * 1024 * 1024, // 80MB
  } as TestThresholds,

  mocks: {
    github: {
      baseUrl: 'https://api.github.com',
      rateLimitDelay: 100,
      failureRate: 0.02,
      responseLatency: 50,
    },
    openCode: {
      analysisLatency: 200,
      generationLatency: 800,
      reviewLatency: 400,
      failureRate: 0.01,
      qualityScoreRange: [0.7, 1.0],
    },
    worktree: {
      creationLatency: 100,
      operationLatency: 50,
      failureRate: 0.005,
    },
    database: {
      connectionLatency: 20,
      queryLatency: 10,
      failureRate: 0.001,
    },
  } as MockConfig,
};

export const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'simple-bug-fix',
    description: 'Simple bug fix with clear requirements',
    issueType: 'bug',
    complexity: 'low',
    expectedOutcome: 'success',
    performanceTarget: 3000,
    tags: ['bug', 'low-complexity', 'fast'],
  },
  {
    name: 'complex-feature-request',
    description: 'Complex feature requiring multiple components',
    issueType: 'feature',
    complexity: 'high',
    expectedOutcome: 'human_review',
    performanceTarget: 12000,
    tags: ['feature', 'high-complexity', 'human-review'],
  },
  {
    name: 'documentation-update',
    description: 'Documentation update with clear scope',
    issueType: 'documentation',
    complexity: 'low',
    expectedOutcome: 'success',
    performanceTarget: 2500,
    tags: ['documentation', 'low-complexity', 'fast'],
  },
  {
    name: 'critical-security-fix',
    description: 'Critical security issue requiring immediate attention',
    issueType: 'bug',
    complexity: 'critical',
    expectedOutcome: 'human_review',
    performanceTarget: 10000,
    tags: ['security', 'critical', 'human-review'],
  },
  {
    name: 'enhancement-request',
    description: 'Enhancement request with moderate complexity',
    issueType: 'enhancement',
    complexity: 'medium',
    expectedOutcome: 'success',
    performanceTarget: 6000,
    tags: ['enhancement', 'medium-complexity'],
  },
  {
    name: 'question-clarification',
    description: 'Question requiring human clarification',
    issueType: 'question',
    complexity: 'low',
    expectedOutcome: 'human_review',
    performanceTarget: 1500,
    tags: ['question', 'clarification', 'human-review'],
  },
  {
    name: 'performance-issue',
    description: 'Performance optimization issue',
    issueType: 'bug',
    complexity: 'medium',
    expectedOutcome: 'success',
    performanceTarget: 8000,
    tags: ['performance', 'medium-complexity'],
  },
  {
    name: 'api-breaking-change',
    description: 'Breaking change requiring careful review',
    issueType: 'feature',
    complexity: 'high',
    expectedOutcome: 'human_review',
    performanceTarget: 15000,
    tags: ['breaking-change', 'high-complexity', 'human-review'],
  },
];

export function createTestWorkflowConfig(
  overrides: Partial<{
    issueAnalyzer: IssueAnalyzer;
    autonomousResolver: AutonomousResolver;
    codeReviewer: CodeReviewer;
    prGenerator: PRGenerator;
    maxWorkflowTime: number;
    enableMetrics: boolean;
    retryAttempts: number;
    humanInterventionThreshold: number;
  }> = {}
) {
  return {
    issueAnalyzer: overrides.issueAnalyzer || ({} as IssueAnalyzer),
    autonomousResolver: overrides.autonomousResolver || ({} as AutonomousResolver),
    codeReviewer: overrides.codeReviewer || ({} as CodeReviewer),
    prGenerator: overrides.prGenerator || ({} as PRGenerator),
    maxWorkflowTime: overrides.maxWorkflowTime || DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
    enableMetrics: overrides.enableMetrics ?? DEFAULT_TEST_CONFIG.environment.enableMetrics,
    retryAttempts: overrides.retryAttempts || DEFAULT_TEST_CONFIG.environment.retries,
    humanInterventionThreshold: overrides.humanInterventionThreshold || 3,
  };
}

export function getScenarioByName(name: string): TestScenario | undefined {
  return TEST_SCENARIOS.find(scenario => scenario.name === name);
}

export function getScenariosByTag(tag: string): TestScenario[] {
  return TEST_SCENARIOS.filter(scenario => scenario.tags.includes(tag));
}

export function getScenariosByComplexity(complexity: TestScenario['complexity']): TestScenario[] {
  return TEST_SCENARIOS.filter(scenario => scenario.complexity === complexity);
}

export function getScenariosByOutcome(outcome: TestScenario['expectedOutcome']): TestScenario[] {
  return TEST_SCENARIOS.filter(scenario => scenario.expectedOutcome === outcome);
}
