/**
 * IssueAnalyzer Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueAnalyzer, type GitHubIssue, type IssueAnalysis } from './IssueAnalyzer';

// Mock fetch globally
global.fetch = vi.fn();

describe('IssueAnalyzer', () => {
  let analyzer: IssueAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new IssueAnalyzer({
      githubToken: 'test-token',
      repository: 'owner/repo',
    });
  });

  describe('analyzeIssue', () => {
    it('should analyze a bug issue correctly', async () => {
      const mockIssue: GitHubIssue = {
        id: 123,
        number: 456,
        title: 'Fix login button not working',
        body: `
## Description
The login button is not responding when clicked.

## Steps to reproduce
1. Go to login page
2. Click login button
3. Nothing happens

## Expected behavior
Should redirect to dashboard

## Actual behavior
Button is unresponsive
        `,
        state: 'open',
        labels: [{ name: 'bug', color: 'red' }],
        user: { login: 'testuser', id: 789 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/456',
        repository_url: 'https://api.github.com/repos/owner/repo',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      });

      const result = await analyzer.analyzeIssue(456);

      expect(result.category).toBe('bug');
      expect(result.complexity).toBe('medium');
      expect(result.feasibility).toBe('high');
      expect(result.requirements).toContain('1. Go to login page');
      expect(result.riskAssessment.security).toBe('low');
    });

    it('should categorize feature requests correctly', async () => {
      const mockIssue: GitHubIssue = {
        id: 124,
        number: 457,
        title: 'Add dark mode toggle',
        body: `
## Feature Request
Please add a dark mode toggle to the application.

## Requirements
- Add toggle button in header
- Persist user preference in localStorage
- Apply dark theme styles
        `,
        state: 'open',
        labels: [{ name: 'enhancement', color: 'blue' }],
        user: { login: 'testuser', id: 789 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/457',
        repository_url: 'https://api.github.com/repos/owner/repo',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      });

      const result = await analyzer.analyzeIssue(457);

      expect(result.category).toBe('enhancement');
      expect(result.complexity).toBe('medium');
      expect(result.feasibility).toBe('high');
    });

    it('should flag security issues for human review', async () => {
      const mockIssue: GitHubIssue = {
        id: 125,
        number: 458,
        title: 'Security vulnerability in authentication',
        body: `
## Security Issue
Found a vulnerability in the authentication system.

## Details
The password reset token is not properly validated.
Attackers could potentially reset any user's password.
        `,
        state: 'open',
        labels: [{ name: 'security', color: 'red' }],
        user: { login: 'testuser', id: 789 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/458',
        repository_url: 'https://api.github.com/repos/owner/repo',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      });

      const result = await analyzer.analyzeIssue(458);

      expect(result.riskAssessment.security).toBe('high');
      expect(result.riskAssessment.humanReviewRequired).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await analyzer.analyzeIssue(999);

      expect(result.feasibility).toBe('not-suitable');
      expect(result.riskAssessment.humanReviewRequired).toBe(true);
      expect(result.reasoning).toContain('Analysis failed');
    });

    it('should extract acceptance criteria correctly', async () => {
      const mockIssue: GitHubIssue = {
        id: 126,
        number: 459,
        title: 'Implement user search',
        body: `
## Acceptance Criteria
- Given a user types in search box
- When they press enter
- Then results should be displayed
- And results should be sorted by relevance
        `,
        state: 'open',
        labels: [],
        user: { login: 'testuser', id: 789 },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/459',
        repository_url: 'https://api.github.com/repos/owner/repo',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      });

      const result = await analyzer.analyzeIssue(459);

      console.log('Acceptance criteria found:', result.acceptanceCriteria);
      expect(result.acceptanceCriteria.length).toBeGreaterThan(0);
      // The extraction logic finds the Gherkin-style criteria
      expect(
        result.acceptanceCriteria.some(
          criteria =>
            criteria.toLowerCase().includes('given') ||
            criteria.toLowerCase().includes('when') ||
            criteria.toLowerCase().includes('then')
        )
      ).toBe(true);
    });
  });

  describe('isSuitableForAutonomousResolution', () => {
    it('should return true for high feasibility issues', () => {
      const analysis: IssueAnalysis = {
        issueId: 1,
        title: 'Test',
        category: 'bug',
        complexity: 'low',
        feasibility: 'high',
        requirements: [],
        acceptanceCriteria: [],
        requiredTools: [],
        riskAssessment: {
          security: 'low',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'test',
        estimatedEffort: '1-2 hours',
        reasoning: 'test',
      };

      expect(analyzer.isSuitableForAutonomousResolution(analysis)).toBe(true);
    });

    it('should return false for not-suitable issues', () => {
      const analysis: IssueAnalysis = {
        issueId: 1,
        title: 'Test',
        category: 'question',
        complexity: 'high',
        feasibility: 'not-suitable',
        requirements: [],
        acceptanceCriteria: [],
        requiredTools: [],
        riskAssessment: {
          security: 'low',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'test',
        estimatedEffort: '1-2 hours',
        reasoning: 'test',
      };

      expect(analyzer.isSuitableForAutonomousResolution(analysis)).toBe(false);
    });
  });
});
