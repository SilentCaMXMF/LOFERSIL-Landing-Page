/**
 * Mock Factories
 *
 * Factory functions for creating mock instances of components and dependencies
 * with configurable behavior for different test scenarios.
 */

import { vi } from "vitest";

/**
 * Mock factory for IssueAnalyzer
 */
export function createMockIssueAnalyzer(overrides: Partial<any> = {}) {
  return {
    analyzeIssue: vi.fn(),
    categorizeIssue: vi.fn(),
    extractRequirements: vi.fn(),
    assessComplexity: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock factory for AutonomousResolver
 */
export function createMockAutonomousResolver(overrides: Partial<any> = {}) {
  return {
    resolveIssue: vi.fn(),
    analyzeCodebase: vi.fn(),
    generateSolution: vi.fn(),
    applyChanges: vi.fn(),
    validateSolution: vi.fn(),
    runTests: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock factory for CodeReviewer
 */
export function createMockCodeReviewer(overrides: Partial<any> = {}) {
  return {
    reviewChanges: vi.fn(),
    performStaticAnalysis: vi.fn(),
    performSecurityScanning: vi.fn(),
    performQualityAssessment: vi.fn(),
    generateReviewComments: vi.fn(),
    calculateReviewScore: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock factory for PRGenerator
 */
export function createMockPRGenerator(overrides: Partial<any> = {}) {
  return {
    createPullRequest: vi.fn(),
    createCommits: vi.fn(),
    generatePRTitle: vi.fn(),
    generatePRDescription: vi.fn(),
    addPRLabels: vi.fn(),
    requestReviewers: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock factory for WorkflowOrchestrator
 */
export function createMockWorkflowOrchestrator(overrides: Partial<any> = {}) {
  return {
    processIssue: vi.fn(),
    executeWorkflow: vi.fn(),
    handleError: vi.fn(),
    updateProgress: vi.fn(),
    validateWorkflowState: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock factory for WorktreeManager
 */
export function createMockWorktreeManager(overrides: Partial<any> = {}) {
  return {
    createWorktree: vi.fn(),
    switchToWorktree: vi.fn(),
    commitChanges: vi.fn(),
    pushChanges: vi.fn(),
    cleanupWorktree: vi.fn(),
    getWorktreeInfo: vi.fn(),
    ...overrides,
  };
}
