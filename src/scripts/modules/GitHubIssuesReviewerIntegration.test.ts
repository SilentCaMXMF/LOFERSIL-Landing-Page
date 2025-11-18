/**
 * GitHub Issues Reviewer Integration Tests
 *
 * End-to-end integration tests for the complete AI-powered GitHub issues reviewer workflow.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowOrchestrator, WorkflowState } from './WorkflowOrchestrator';
import { GitHubIssuesReviewerConfigManager } from './GitHubIssuesReviewerConfig';
import { SystemMonitor } from './MonitoringSystem';
import { IssueAnalyzer } from './IssueAnalyzer';

// Mock all external dependencies
vi.mock('./IssueAnalyzer');
vi.mock('./WorktreeManager');
vi.mock('./SWEResolver');
vi.mock('./CodeReviewer');
vi.mock('./EnvironmentLoader');

// Mock GitHub API
global.fetch = vi.fn();

describe('GitHub Issues Reviewer Integration', () => {
  let orchestrator: WorkflowOrchestrator;
  let configManager: GitHubIssuesReviewerConfigManager;
  let monitor: SystemMonitor;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock EnvironmentLoader before creating configManager
    const { envLoader } = await import('./EnvironmentLoader');
    vi.mocked(envLoader).getRequired.mockImplementation((key: any) => {
      const mockValues: Record<string, string> = {
        GITHUB_TOKEN: 'test-token',
        GITHUB_REPOSITORY: 'test/repo',
        OPENAI_API_KEY: 'test-key',
      };
      return mockValues[key] || '';
    });
    vi.mocked(envLoader).get.mockImplementation((key: any) => {
      const mockValues: Record<string, string> = {
        GITHUB_API_URL: 'https://api.github.com',
        OPENAI_MODEL: 'gpt-4',
        WORKTREE_ROOT_DIR: '.git/ai-worktrees',
        MAIN_BRANCH: 'main',
      };
      return mockValues[key] || undefined;
    });

    // Setup configuration
    configManager = new GitHubIssuesReviewerConfigManager({
      github: {
        token: 'test-token',
        repository: 'test/repo',
      },
      openai: {
        apiKey: 'test-key',
      },
    });

    // Setup orchestrator with short timeout for tests
    orchestrator = new WorkflowOrchestrator({
      githubToken: 'test-token',
      repository: 'test/repo',
      openaiApiKey: 'test-key',
      timeout: 1000, // 1 second timeout for tests
    });

    // Setup monitor
    monitor = new SystemMonitor();

    // Mock successful GitHub API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/issues/')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 123,
              number: 456,
              title: 'Test issue for integration',
              body: `
## Description
This is a test issue for integration testing.

## Requirements
- Add a simple utility function
- Write tests for the function
- Update documentation

## Acceptance Criteria
- Function should work correctly
- Tests should pass
- Documentation should be updated
            `,
              state: 'open',
              labels: [{ name: 'enhancement', color: '84cc16' }],
              user: { login: 'testuser', id: 789 },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              html_url: 'https://github.com/test/repo/issues/456',
              repository_url: 'https://api.github.com/repos/test/repo',
            }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Workflow Integration', () => {
    it('should successfully process a complete workflow from issue to PR', async () => {
      // Setup all component mocks for successful execution
      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const WorktreeManagerModule = await import('./WorktreeManager');
      const SWEResolverModule = await import('./SWEResolver');
      const CodeReviewerModule = await import('./CodeReviewer');

      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);
      const mockWorktreeManager = vi.mocked(WorktreeManagerModule.WorktreeManager.prototype);
      const mockSWEResolver = vi.mocked(SWEResolverModule.SWEResolver.prototype);
      const mockCodeReviewer = vi.mocked(CodeReviewerModule.CodeReviewer.prototype);

      // Mock issue analysis - suitable for automation
      mockIssueAnalyzer.analyzeIssue.mockResolvedValue({
        issueId: 456,
        title: 'Test issue for integration',
        category: 'enhancement' as const,
        complexity: 'medium' as const,
        feasibility: 'high' as const,
        requirements: [
          'Add a simple utility function',
          'Write tests for the function',
          'Update documentation',
        ],
        acceptanceCriteria: [
          'Function should work correctly',
          'Tests should pass',
          'Documentation should be updated',
        ],
        requiredTools: ['edit', 'test-runner'],
        riskAssessment: {
          security: 'low' as const,
          performance: 'low' as const,
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Implement utility function with tests and docs',
        estimatedEffort: '2-4 hours' as const,
        reasoning: 'Well-defined enhancement with clear requirements',
      });

      mockIssueAnalyzer.isSuitableForAutonomousResolution.mockReturnValue(true);

      // Mock worktree creation
      mockWorktreeManager.createWorktree.mockResolvedValue({
        branch: 'ai-fix/issue-456-test-issue-for-integration',
        path: '/tmp/test-worktree-456',
        issueId: 456,
        createdAt: new Date(),
        status: 'active' as const,
      });

      // Mock code generation
      mockSWEResolver.resolveIssue.mockResolvedValue({
        success: true,
        changes: [
          {
            file: 'src/utils/testUtils.ts',
            type: 'create' as const,
            description: 'Add utility function',
            diff: 'Create new utility file',
          },
          {
            file: 'src/utils/testUtils.test.ts',
            type: 'create' as const,
            description: 'Add tests for utility function',
            diff: 'Create test file',
          },
        ],
        testsAdded: ['src/utils/testUtils.test.ts'],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'Successfully implemented utility function with tests',
        confidence: 0.9,
        requiresHumanReview: false,
      });

      // Mock code review
      mockCodeReviewer.reviewCode.mockResolvedValue({
        overallAssessment: 'approve' as const,
        issues: [
          {
            severity: 'low' as const,
            category: 'style' as const,
            description: 'Consider adding JSDoc comments',
            file: 'src/utils/testUtils.ts',
          },
        ],
        strengths: ['Good test coverage', 'Proper TypeScript types', 'Clean code structure'],
        recommendations: ['Consider adding JSDoc comments for better documentation'],
        confidence: 0.95,
        requiresHumanReview: false,
        reasoning: 'Code meets quality standards with minor style suggestions',
      });

      // Execute the workflow
      const startTime = Date.now();
      const result = await orchestrator.executeWorkflow(456);
      const duration = Date.now() - startTime;

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.finalState).toBe(WorkflowState.COMPLETED);
      expect(result.issueId).toBe(456);
      expect(result.totalDuration).toBeGreaterThan(0);
      expect(result.totalDuration).toBeLessThanOrEqual(duration);

      // Verify all steps were executed
      expect(result.steps).toHaveLength(5);
      expect(result.steps.map(s => s.step)).toEqual([
        WorkflowState.ANALYZING_ISSUE,
        WorkflowState.CREATING_WORKTREE,
        WorkflowState.GENERATING_SOLUTION,
        WorkflowState.REVIEWING_CODE,
        WorkflowState.CREATING_PR,
      ]);

      // Verify all steps succeeded
      expect(result.steps.every(s => s.success)).toBe(true);

      // Verify data is populated
      expect(result.issueAnalysis).toBeDefined();
      expect(result.codeResult).toBeDefined();
      expect(result.reviewResult).toBeDefined();
      expect(result.prUrl).toBeDefined();

      // Record metrics
      monitor.recordWorkflowExecution(result);

      // Verify metrics were recorded
      const metricsSummary = monitor.getMetricsSummary();
      expect(metricsSummary.totalWorkflows).toBeGreaterThanOrEqual(1);
      expect(metricsSummary.successRate).toBe(1); // 100% success
    }, 30000); // 30 second timeout

    it('should handle unsuitable issues gracefully', async () => {
      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);

      // Mock issue analysis - not suitable for automation
      mockIssueAnalyzer.analyzeIssue.mockResolvedValue({
        issueId: 789,
        title: 'Question about API usage',
        category: 'question' as const,
        complexity: 'low' as const,
        feasibility: 'not-suitable' as const,
        requirements: [],
        acceptanceCriteria: [],
        requiredTools: [],
        riskAssessment: {
          security: 'low' as const,
          performance: 'low' as const,
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Manual response required',
        estimatedEffort: 'complex' as const,
        reasoning: 'Question issues require human expertise',
      });

      mockIssueAnalyzer.isSuitableForAutonomousResolution.mockReturnValue(false);

      const result = await orchestrator.executeWorkflow(789);

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.COMPLETED); // Completed but not processed
      expect(result.error).toContain('not suitable');
      expect(result.steps).toHaveLength(1); // Only analysis step
      expect(result.steps[0].step).toBe(WorkflowState.ANALYZING_ISSUE);
      expect(result.steps[0].success).toBe(true);
    });

    it('should handle workflow failures and recovery', async () => {
      // Create orchestrator with no retries for fast failure
      const failingOrchestrator = new WorkflowOrchestrator({
        githubToken: 'test-token',
        repository: 'test/repo',
        openaiApiKey: 'test-key',
        maxRetries: 0,
        retryDelay: 0,
        timeout: 1000,
      });

      // Mock the instance method to fail
      (failingOrchestrator as any).issueAnalyzer.analyzeIssue.mockRejectedValue(
        new Error('GitHub API rate limited')
      );

      const result = await failingOrchestrator.executeWorkflow(999);

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.error).toContain('GitHub API rate limited');
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].success).toBe(false);
    });

    it('should handle code review rejections', async () => {
      const IssueAnalyzerModule = await import('./IssueAnalyzer');
      const WorktreeManagerModule = await import('./WorktreeManager');
      const SWEResolverModule = await import('./SWEResolver');
      const CodeReviewerModule = await import('./CodeReviewer');

      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);
      const mockWorktreeManager = vi.mocked(WorktreeManagerModule.WorktreeManager.prototype);
      const mockSWEResolver = vi.mocked(SWEResolverModule.SWEResolver.prototype);
      const mockCodeReviewer = vi.mocked(CodeReviewerModule.CodeReviewer.prototype);

      // Setup successful analysis and code generation
      mockIssueAnalyzer.analyzeIssue.mockResolvedValue({
        issueId: 101,
        title: 'Security-sensitive feature',
        category: 'feature' as const,
        complexity: 'high' as const,
        feasibility: 'medium' as const,
        requirements: ['Implement secure authentication'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'high' as const,
          performance: 'medium' as const,
          breakingChanges: false,
          humanReviewRequired: true,
        },
        solutionApproach: 'Implement secure auth',
        estimatedEffort: '4-8 hours' as const,
        reasoning: 'Security-critical feature',
      });

      mockIssueAnalyzer.isSuitableForAutonomousResolution.mockReturnValue(true);

      mockWorktreeManager.createWorktree.mockResolvedValue({
        branch: 'ai-fix/issue-101-security-sensitive-feature',
        path: '/tmp/test-worktree-101',
        issueId: 101,
        createdAt: new Date(),
        status: 'active' as const,
      });

      mockSWEResolver.resolveIssue.mockResolvedValue({
        success: true,
        changes: [
          {
            file: 'src/auth/security.ts',
            type: 'create' as const,
            description: 'Add security module',
            diff: 'Create security implementation',
          },
        ],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'Implemented security features',
        confidence: 0.8,
        requiresHumanReview: false,
      });

      // Mock code review rejection due to security concerns
      mockCodeReviewer.reviewCode.mockResolvedValue({
        overallAssessment: 'reject' as const,
        issues: [
          {
            severity: 'critical' as const,
            category: 'security' as const,
            description: 'Potential security vulnerability in authentication logic',
            file: 'src/auth/security.ts',
          },
          {
            severity: 'high' as const,
            category: 'security' as const,
            description: 'Missing input validation for user credentials',
            file: 'src/auth/security.ts',
          },
        ],
        strengths: ['Good code structure'],
        recommendations: [
          'Security review required before deployment',
          'Add comprehensive input validation',
          'Implement proper error handling for auth failures',
        ],
        confidence: 0.9,
        requiresHumanReview: true,
        reasoning: 'Critical security issues require human review',
      });

      const result = await orchestrator.executeWorkflow(101);

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.reviewResult?.overallAssessment).toBe('reject');
      expect(result.reviewResult?.requiresHumanReview).toBe(true);
      expect(result.steps).toHaveLength(4); // Stopped at review
    });
  });

  describe('System Health and Monitoring', () => {
    it('should track system health across multiple workflows', async () => {
      // Run multiple successful workflows
      for (let i = 1; i <= 3; i++) {
        const mockResult = {
          issueId: i,
          success: true,
          finalState: WorkflowState.COMPLETED,
          steps: [
            {
              step: WorkflowState.ANALYZING_ISSUE,
              success: true,
              timestamp: new Date(),
              duration: 100,
            },
            {
              step: WorkflowState.CREATING_WORKTREE,
              success: true,
              timestamp: new Date(),
              duration: 200,
            },
            {
              step: WorkflowState.GENERATING_SOLUTION,
              success: true,
              timestamp: new Date(),
              duration: 1000,
            },
            {
              step: WorkflowState.REVIEWING_CODE,
              success: true,
              timestamp: new Date(),
              duration: 300,
            },
            {
              step: WorkflowState.CREATING_PR,
              success: true,
              timestamp: new Date(),
              duration: 100,
            },
          ],
          totalDuration: 1700,
        };

        monitor.recordWorkflowExecution(mockResult);
      }

      const health = monitor.getSystemHealth();
      const metrics = monitor.getMetricsSummary();

      expect(health.overall).toBe('healthy');
      expect(metrics.totalWorkflows).toBe(3);
      expect(metrics.successRate).toBe(1); // 100%
      expect(metrics.averageDuration).toBeGreaterThan(0);
    });

    it('should detect system degradation', async () => {
      // Mix of successful and failed workflows
      const results = [
        { success: true, finalState: WorkflowState.COMPLETED },
        { success: false, finalState: WorkflowState.FAILED },
        { success: false, finalState: WorkflowState.FAILED },
        { success: true, finalState: WorkflowState.COMPLETED },
      ];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        monitor.recordWorkflowExecution({
          issueId: i + 1,
          success: result.success,
          finalState: result.finalState,
          steps: [],
          totalDuration: 1000,
        });
      }

      const health = monitor.getSystemHealth();
      const metrics = monitor.getMetricsSummary();

      expect(metrics.totalWorkflows).toBe(4);
      expect(metrics.successRate).toBe(0.5); // 50%
      // Health might be degraded depending on alert thresholds
    });
  });

  describe('Configuration Integration', () => {
    it('should use configuration settings in workflow execution', () => {
      const config = configManager.getConfig();

      expect(config.github.token).toBe('test-token');
      expect(config.github.repository).toBe('test/repo');
      expect(config.openai.apiKey).toBe('test-key');
      expect(config.workflow.maxRetries).toBe(3);
      expect(config.workflow.timeout).toBe(1800000);
    });

    it('should validate configuration before use', () => {
      const validation = configManager.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
