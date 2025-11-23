/**
 * Assertion Helpers
 *
 * Specialized assertion functions for testing GitHub Issues Reviewer components
 * with detailed error messages and common test patterns.
 */

import { GitHubIssue, GitHubPR, GitHubComment } from "../mocks/github-api";
import {
  OpenCodeAnalysis,
  OpenCodeSolution,
  OpenCodeReviewResult,
} from "../mocks/opencode-agent";
import { WorktreeInfo } from "../mocks/worktree-manager";

/**
 * Assertions for GitHub Issues
 */
export const assertIssue = {
  /**
   * Asserts that an issue has the expected properties
   */
  hasValidStructure: (
    issue: any,
    message?: string,
  ): asserts issue is GitHubIssue => {
    const required = [
      "id",
      "number",
      "title",
      "body",
      "labels",
      "state",
      "user",
      "created_at",
      "updated_at",
      "html_url",
    ];
    const missing = required.filter((prop) => !(prop in issue));

    if (missing.length > 0) {
      throw new Error(
        message ||
          `Issue is missing required properties: ${missing.join(", ")}`,
      );
    }

    if (typeof issue.number !== "number" || issue.number <= 0) {
      throw new Error(
        message ||
          `Issue number must be a positive number, got ${issue.number}`,
      );
    }

    if (!issue.title || typeof issue.title !== "string") {
      throw new Error(
        message || `Issue title must be a non-empty string, got ${issue.title}`,
      );
    }
  },

  /**
   * Asserts that an issue has a specific label
   */
  hasLabel: (issue: GitHubIssue, labelName: string, message?: string): void => {
    const hasLabel = issue.labels.some((label) => label.name === labelName);
    if (!hasLabel) {
      const availableLabels = issue.labels.map((l) => l.name).join(", ");
      throw new Error(
        message ||
          `Issue #${issue.number} does not have label "${labelName}". Available labels: ${availableLabels}`,
      );
    }
  },

  /**
   * Asserts that an issue is in a specific state
   */
  hasState: (
    issue: GitHubIssue,
    expectedState: string,
    message?: string,
  ): void => {
    if (issue.state !== expectedState) {
      throw new Error(
        message ||
          `Issue #${issue.number} is in state "${issue.state}", expected "${expectedState}"`,
      );
    }
  },

  /**
   * Asserts that an issue belongs to a specific user
   */
  hasAssignee: (
    issue: GitHubIssue,
    expectedUser: string,
    message?: string,
  ): void => {
    if (issue.user.login !== expectedUser) {
      throw new Error(
        message ||
          `Issue #${issue.number} is assigned to "${issue.user.login}", expected "${expectedUser}"`,
      );
    }
  },
};

/**
 * Assertions for Issue Analysis
 */
export const assertAnalysis = {
  /**
   * Asserts that an analysis has valid structure
   */
  hasValidStructure: (
    analysis: any,
    message?: string,
  ): asserts analysis is OpenCodeAnalysis => {
    const required = [
      "category",
      "complexity",
      "requirements",
      "acceptanceCriteria",
      "feasible",
      "confidence",
      "reasoning",
    ];
    const missing = required.filter((prop) => !(prop in analysis));

    if (missing.length > 0) {
      throw new Error(
        message ||
          `Analysis is missing required properties: ${missing.join(", ")}`,
      );
    }

    if (
      typeof analysis.confidence !== "number" ||
      analysis.confidence < 0 ||
      analysis.confidence > 1
    ) {
      throw new Error(
        message ||
          `Analysis confidence must be between 0 and 1, got ${analysis.confidence}`,
      );
    }
  },

  /**
   * Asserts that an analysis has a specific category
   */
  hasCategory: (
    analysis: OpenCodeAnalysis,
    expectedCategory: string,
    message?: string,
  ): void => {
    if (analysis.category !== expectedCategory) {
      throw new Error(
        message ||
          `Analysis has category "${analysis.category}", expected "${expectedCategory}"`,
      );
    }
  },

  /**
   * Asserts that an analysis has a specific complexity level
   */
  hasComplexity: (
    analysis: OpenCodeAnalysis,
    expectedComplexity: string,
    message?: string,
  ): void => {
    if (analysis.complexity !== expectedComplexity) {
      throw new Error(
        message ||
          `Analysis has complexity "${analysis.complexity}", expected "${expectedComplexity}"`,
      );
    }
  },

  /**
   * Asserts that an analysis is feasible
   */
  isFeasible: (analysis: OpenCodeAnalysis, message?: string): void => {
    if (!analysis.feasible) {
      throw new Error(
        message ||
          `Analysis indicates issue is not feasible: ${analysis.reasoning}`,
      );
    }
  },

  /**
   * Asserts that an analysis is not feasible
   */
  isNotFeasible: (analysis: OpenCodeAnalysis, message?: string): void => {
    if (analysis.feasible) {
      throw new Error(
        message ||
          `Analysis indicates issue is feasible, but expected it not to be`,
      );
    }
  },

  /**
   * Asserts that an analysis has minimum confidence
   */
  hasMinConfidence: (
    analysis: OpenCodeAnalysis,
    minConfidence: number,
    message?: string,
  ): void => {
    if (analysis.confidence < minConfidence) {
      throw new Error(
        message ||
          `Analysis confidence ${analysis.confidence} is below minimum ${minConfidence}`,
      );
    }
  },
};

/**
 * Assertions for Code Solutions
 */
export const assertSolution = {
  /**
   * Asserts that a solution has valid structure
   */
  hasValidStructure: (
    solution: any,
    message?: string,
  ): asserts solution is OpenCodeSolution => {
    const required = ["changes", "explanation", "testCases", "documentation"];
    const missing = required.filter((prop) => !(prop in solution));

    if (missing.length > 0) {
      throw new Error(
        message ||
          `Solution is missing required properties: ${missing.join(", ")}`,
      );
    }

    if (!Array.isArray(solution.changes) || solution.changes.length === 0) {
      throw new Error(message || `Solution must have at least one change`);
    }
  },

  /**
   * Asserts that a solution modifies a specific file
   */
  modifiesFile: (
    solution: OpenCodeSolution,
    filePath: string,
    message?: string,
  ): void => {
    const modifiesFile = solution.changes.some(
      (change) => change.file === filePath,
    );
    if (!modifiesFile) {
      const modifiedFiles = solution.changes.map((c) => c.file).join(", ");
      throw new Error(
        message ||
          `Solution does not modify file "${filePath}". Modified files: ${modifiedFiles}`,
      );
    }
  },

  /**
   * Asserts that a solution has a specific number of changes
   */
  hasChangeCount: (
    solution: OpenCodeSolution,
    expectedCount: number,
    message?: string,
  ): void => {
    if (solution.changes.length !== expectedCount) {
      throw new Error(
        message ||
          `Solution has ${solution.changes.length} changes, expected ${expectedCount}`,
      );
    }
  },

  /**
   * Asserts that a solution includes test cases
   */
  hasTestCases: (solution: OpenCodeSolution, message?: string): void => {
    if (!solution.testCases || solution.testCases.length === 0) {
      throw new Error(message || `Solution must include test cases`);
    }
  },
};

/**
 * Assertions for Code Reviews
 */
export const assertReview = {
  /**
   * Asserts that a review has valid structure
   */
  hasValidStructure: (
    review: any,
    message?: string,
  ): asserts review is OpenCodeReviewResult => {
    const required = [
      "approved",
      "score",
      "comments",
      "securityIssues",
      "qualityScore",
      "performanceScore",
      "maintainabilityScore",
      "testCoverageScore",
      "recommendations",
    ];
    const missing = required.filter((prop) => !(prop in review));

    if (missing.length > 0) {
      throw new Error(
        message ||
          `Review is missing required properties: ${missing.join(", ")}`,
      );
    }

    const scores = [
      "qualityScore",
      "performanceScore",
      "maintainabilityScore",
      "testCoverageScore",
    ];
    for (const scoreProp of scores) {
      const score = (review as any)[scoreProp];
      if (typeof score !== "number" || score < 0 || score > 1) {
        throw new Error(
          message ||
            `Review ${scoreProp} must be between 0 and 1, got ${score}`,
        );
      }
    }
  },

  /**
   * Asserts that a review is approved
   */
  isApproved: (review: OpenCodeReviewResult, message?: string): void => {
    if (!review.approved) {
      throw new Error(
        message ||
          `Review is not approved. Comments: ${review.comments.join(", ")}`,
      );
    }
  },

  /**
   * Asserts that a review is rejected
   */
  isRejected: (review: OpenCodeReviewResult, message?: string): void => {
    if (review.approved) {
      throw new Error(message || `Review is approved, but expected rejection`);
    }
  },

  /**
   * Asserts that a review has a minimum score
   */
  hasMinScore: (
    review: OpenCodeReviewResult,
    minScore: number,
    message?: string,
  ): void => {
    if (review.score < minScore) {
      throw new Error(
        message || `Review score ${review.score} is below minimum ${minScore}`,
      );
    }
  },

  /**
   * Asserts that a review has security issues
   */
  hasSecurityIssues: (review: OpenCodeReviewResult, message?: string): void => {
    if (!review.securityIssues || review.securityIssues.length === 0) {
      throw new Error(
        message || `Review should have security issues but has none`,
      );
    }
  },

  /**
   * Asserts that a review has no security issues
   */
  hasNoSecurityIssues: (
    review: OpenCodeReviewResult,
    message?: string,
  ): void => {
    if (review.securityIssues && review.securityIssues.length > 0) {
      throw new Error(
        message ||
          `Review has security issues: ${review.securityIssues.join(", ")}`,
      );
    }
  },
};

/**
 * Assertions for Worktrees
 */
export const assertWorktree = {
  /**
   * Asserts that a worktree has valid structure
   */
  hasValidStructure: (
    worktree: any,
    message?: string,
  ): asserts worktree is WorktreeInfo => {
    const required = [
      "branch",
      "path",
      "issueId",
      "createdAt",
      "status",
      "commitSha",
      "parentBranch",
    ];
    const missing = required.filter((prop) => !(prop in worktree));

    if (missing.length > 0) {
      throw new Error(
        message ||
          `Worktree is missing required properties: ${missing.join(", ")}`,
      );
    }
  },

  /**
   * Asserts that a worktree has a specific status
   */
  hasStatus: (
    worktree: WorktreeInfo,
    expectedStatus: string,
    message?: string,
  ): void => {
    if (worktree.status !== expectedStatus) {
      throw new Error(
        message ||
          `Worktree for issue #${worktree.issueId} has status "${worktree.status}", expected "${expectedStatus}"`,
      );
    }
  },

  /**
   * Asserts that a worktree belongs to a specific issue
   */
  belongsToIssue: (
    worktree: WorktreeInfo,
    issueId: number,
    message?: string,
  ): void => {
    if (worktree.issueId !== issueId) {
      throw new Error(
        message ||
          `Worktree belongs to issue #${worktree.issueId}, expected #${issueId}`,
      );
    }
  },
};

/**
 * Assertions for Pull Requests
 */
export const assertPR = {
  /**
   * Asserts that a PR has valid structure
   */
  hasValidStructure: (pr: any, message?: string): asserts pr is GitHubPR => {
    const required = [
      "number",
      "title",
      "body",
      "html_url",
      "state",
      "merged",
      "created_at",
      "updated_at",
    ];
    const missing = required.filter((prop) => !(prop in pr));

    if (missing.length > 0) {
      throw new Error(
        message || `PR is missing required properties: ${missing.join(", ")}`,
      );
    }
  },

  /**
   * Asserts that a PR is merged
   */
  isMerged: (pr: GitHubPR, message?: string): void => {
    if (!pr.merged) {
      throw new Error(message || `PR #${pr.number} is not merged`);
    }
  },

  /**
   * Asserts that a PR is open
   */
  isOpen: (pr: GitHubPR, message?: string): void => {
    if (pr.state !== "open") {
      throw new Error(
        message || `PR #${pr.number} is not open (state: ${pr.state})`,
      );
    }
  },

  /**
   * Asserts that a PR title matches expected pattern
   */
  hasTitle: (pr: GitHubPR, expectedTitle: string, message?: string): void => {
    if (pr.title !== expectedTitle) {
      throw new Error(
        message ||
          `PR #${pr.number} has title "${pr.title}", expected "${expectedTitle}"`,
      );
    }
  },
};

/**
 * Assertions for Workflow Results
 */
export const assertWorkflow = {
  /**
   * Asserts that a workflow result indicates success
   */
  isSuccessful: (result: any, message?: string): void => {
    if (!result || !result.success) {
      const errorMsg = result?.error ? `: ${result.error}` : "";
      throw new Error(message || `Workflow failed${errorMsg}`);
    }
  },

  /**
   * Asserts that a workflow result indicates failure
   */
  hasFailed: (result: any, message?: string): void => {
    if (!result || result.success) {
      throw new Error(message || `Workflow succeeded, but expected failure`);
    }
  },

  /**
   * Asserts that a workflow completed within time limit
   */
  completedWithin: (result: any, maxTime: number, message?: string): void => {
    if (!result || !result.executionTime) {
      throw new Error(message || `Workflow result missing execution time`);
    }

    if (result.executionTime > maxTime) {
      throw new Error(
        message ||
          `Workflow took ${result.executionTime}ms, exceeded limit of ${maxTime}ms`,
      );
    }
  },

  /**
   * Asserts that a workflow result has expected outputs
   */
  hasOutput: (result: any, outputKey: string, message?: string): void => {
    if (!result || !result.outputs || !(outputKey in result.outputs)) {
      throw new Error(
        message || `Workflow result missing output: ${outputKey}`,
      );
    }
  },
};

/**
 * Assertions for Mock Interactions
 */
export const assertMock = {
  /**
   * Asserts that a mock function was called
   */
  wasCalled: (mock: any, message?: string): void => {
    if (!mock.mock || mock.mock.calls.length === 0) {
      throw new Error(message || `Mock function was not called`);
    }
  },

  /**
   * Asserts that a mock function was called a specific number of times
   */
  wasCalledTimes: (
    mock: any,
    expectedCalls: number,
    message?: string,
  ): void => {
    const actualCalls = mock.mock?.calls?.length || 0;
    if (actualCalls !== expectedCalls) {
      throw new Error(
        message ||
          `Mock function was called ${actualCalls} times, expected ${expectedCalls}`,
      );
    }
  },

  /**
   * Asserts that a mock function was called with specific arguments
   */
  wasCalledWith: (mock: any, expectedArgs: any[], message?: string): void => {
    const calls = mock.mock?.calls || [];
    const matchingCall = calls.find((call: any[]) => {
      if (call.length !== expectedArgs.length) return false;
      return call.every((arg, index) => arg === expectedArgs[index]);
    });

    if (!matchingCall) {
      throw new Error(
        message ||
          `Mock function was not called with arguments: ${JSON.stringify(expectedArgs)}`,
      );
    }
  },

  /**
   * Asserts that a mock function returned a specific value
   */
  returned: (mock: any, expectedValue: any, message?: string): void => {
    const results = mock.mock?.results || [];
    const matchingResult = results.find(
      (result: any) => result.value === expectedValue,
    );

    if (!matchingResult) {
      throw new Error(
        message ||
          `Mock function did not return: ${JSON.stringify(expectedValue)}`,
      );
    }
  },
};
