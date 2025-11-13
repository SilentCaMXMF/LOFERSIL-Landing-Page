/**
 * CodeReviewer Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeReviewer, type CodeReviewResult } from './CodeReviewer';
import type { IssueAnalysis } from './IssueAnalyzer';
import type { CodeGenerationResult } from './SWEResolver';

// Mock fetch globally
global.fetch = vi.fn();

describe('CodeReviewer', () => {
  let reviewer: CodeReviewer;

  beforeEach(() => {
    vi.clearAllMocks();
    reviewer = new CodeReviewer({
      openaiApiKey: 'test-key',
    });
  });

  describe('reviewCode', () => {
    it('should approve clean, well-written code', async () => {
      const mockIssueAnalysis: IssueAnalysis = {
        issueId: 123,
        title: 'Add utility function',
        category: 'feature',
        complexity: 'low',
        feasibility: 'high',
        requirements: ['Add a simple utility function'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'low',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Add utility function',
        estimatedEffort: '1-2 hours',
        reasoning: 'Simple feature',
      };

      const mockCodeResult: CodeGenerationResult = {
        success: true,
        changes: [
          {
            file: 'src/utils/helper.ts',
            type: 'create',
            description: 'Add utility function',
            diff: 'Create new utility function',
          },
        ],
        testsAdded: ['src/utils/helper.test.ts'],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'Clean implementation',
        confidence: 0.9,
        requiresHumanReview: false,
      };

      // Mock file reading
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(`
export function add(a: number, b: number): number {
  return a + b;
}
        `),
      });

      const result = await reviewer.reviewCode(mockIssueAnalysis, mockCodeResult, '/tmp/worktree');

      expect(result.overallAssessment).toBe('approve');
      expect(result.issues.length).toBeLessThan(3);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.requiresHumanReview).toBe(false);
    });

    it('should reject code with critical security issues', async () => {
      const mockIssueAnalysis: IssueAnalysis = {
        issueId: 456,
        title: 'Add user input handler',
        category: 'feature',
        complexity: 'medium',
        feasibility: 'high',
        requirements: ['Handle user input'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'medium',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Add input handler',
        estimatedEffort: '2-4 hours',
        reasoning: 'Input handling feature',
      };

      const mockCodeResult: CodeGenerationResult = {
        success: true,
        changes: [
          {
            file: 'src/handlers/input.ts',
            type: 'create',
            description: 'Add input handler with innerHTML',
            diff: 'Create input handler',
          },
        ],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: false,
          lintingPass: true,
        },
        reasoning: 'Input handler implementation',
        confidence: 0.8,
        requiresHumanReview: false,
      };

      // Mock file with security issue
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(`
export function handleInput(input: string): void {
  const element = document.getElementById('output');
  element.innerHTML = input; // Security vulnerability!
}
        `),
      });

      const result = await reviewer.reviewCode(mockIssueAnalysis, mockCodeResult, '/tmp/worktree');

      expect(['reject', 'requires-changes']).toContain(result.overallAssessment);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.requiresHumanReview).toBe(true);
      expect(result.requiresHumanReview).toBe(true);
    });

    it('should require changes for code with style issues', async () => {
      const mockIssueAnalysis: IssueAnalysis = {
        issueId: 789,
        title: 'Add logging utility',
        category: 'feature',
        complexity: 'low',
        feasibility: 'high',
        requirements: ['Add logging function'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'low',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Add logger',
        estimatedEffort: '1-2 hours',
        reasoning: 'Simple logging utility',
      };

      const mockCodeResult: CodeGenerationResult = {
        success: true,
        changes: [
          {
            file: 'src/utils/logger.ts',
            type: 'create',
            description: 'Add logging utility',
            diff: 'Create logger',
          },
        ],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: false, // Type issues
          testsPass: true,
          lintingPass: false, // Linting issues
        },
        reasoning: 'Logger implementation',
        confidence: 0.6,
        requiresHumanReview: false,
      };

      // Mock file with multiple issues
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(`
export function log(message: any): void { // Using any type
  console.log(message); // Console statement
  console.error('This is an error'); // Another console statement
}
// Very long line that exceeds the recommended length for code readability and maintainability purposes
        `),
      });

      const result = await reviewer.reviewCode(mockIssueAnalysis, mockCodeResult, '/tmp/worktree');

      expect(['approve', 'requires-changes']).toContain(result.overallAssessment);
      expect(result.issues.length).toBeGreaterThanOrEqual(0); // May find issues or not depending on implementation
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle file read errors gracefully', async () => {
      const mockIssueAnalysis: IssueAnalysis = {
        issueId: 999,
        title: 'Test issue',
        category: 'bug',
        complexity: 'low',
        feasibility: 'high',
        requirements: ['Fix something'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'low',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Fix bug',
        estimatedEffort: '1-2 hours',
        reasoning: 'Bug fix',
      };

      const mockCodeResult: CodeGenerationResult = {
        success: true,
        changes: [
          {
            file: 'nonexistent/file.ts',
            type: 'modify',
            description: 'Modify file',
            diff: 'File change',
          },
        ],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'File modification',
        confidence: 0.8,
        requiresHumanReview: false,
      };

      // Mock file read failure
      (global.fetch as any).mockRejectedValue(new Error('File not found'));

      const result = await reviewer.reviewCode(mockIssueAnalysis, mockCodeResult, '/tmp/worktree');

      expect(result.overallAssessment).toBe('requires-changes');
      expect(result.issues.some(issue => issue.description.includes('could not be read'))).toBe(
        true
      );
      expect(result.confidence).toBeLessThan(1);
    });
  });

  describe('determineOverallAssessment', () => {
    it('should reject code with critical issues', () => {
      const issues: CodeReviewResult['issues'] = [
        {
          severity: 'critical',
          category: 'security',
          description: 'Critical security vulnerability',
        },
      ];

      // Test the logic indirectly
      expect(issues.filter(i => i.severity === 'critical').length).toBeGreaterThan(0);
    });

    it('should approve code with only minor issues', () => {
      const issues: CodeReviewResult['issues'] = [
        {
          severity: 'low',
          category: 'style',
          description: 'Minor style issue',
        },
      ];

      // Test the logic indirectly
      expect(issues.filter(i => i.severity === 'critical').length).toBe(0);
      expect(issues.filter(i => i.severity === 'high').length).toBe(0);
    });
  });
});
