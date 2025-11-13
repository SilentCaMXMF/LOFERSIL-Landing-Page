/**
 * WorkflowOrchestrator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowOrchestrator, WorkflowState } from './WorkflowOrchestrator';
import type { IssueAnalysis } from './IssueAnalyzer';
import type { WorktreeInfo } from './WorktreeManager';
import type { CodeGenerationResult } from './SWEResolver';
import type { CodeReviewResult } from './CodeReviewer';

// Mock all dependencies
vi.mock('./IssueAnalyzer');
vi.mock('./WorktreeManager');
vi.mock('./SWEResolver');
vi.mock('./CodeReviewer');

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new WorkflowOrchestrator({
      githubToken: 'test-github-token',
      repository: 'owner/repo',
      openaiApiKey: 'test-openai-key',
    });
  });

  describe('executeWorkflow', () => {
    it('should execute a successful workflow', async () => {
      // Mock successful responses for all components
      const mockIssueAnalysis: IssueAnalysis = {
        issueId: 999,
        title: 'Test issue',
        category: 'bug' as const,
        complexity: 'low' as const,
        feasibility: 'high' as const,
        requirements: ['Fix bug'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'low' as const,
          performance: 'low' as const,
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Fix the bug',
        estimatedEffort: '1-2 hours' as const,
        reasoning: 'Simple bug fix',
      };

      const mockWorktreeInfo: WorktreeInfo = {
        branch: 'ai-fix/issue-123',
        path: '/tmp/worktree',
        issueId: 123,
        createdAt: new Date(),
        status: 'active' as const,
      };

      const mockCodeResult: CodeGenerationResult = {
        success: true,
        changes: [],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'Success',
        confidence: 0.9,
        requiresHumanReview: false,
      };

      const mockReviewResult: CodeReviewResult = {
        overallAssessment: 'approve' as const,
        issues: [],
        strengths: ['Good code'],
        recommendations: [],
        confidence: 0.9,
        requiresHumanReview: false,
        reasoning: 'Approved',
      };

      // Setup mocks
      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const WorktreeManagerModule = await import('./WorktreeManager');
      const SWEResolverModule = await import('./SWEResolver');
      const CodeReviewerModule = await import('./CodeReviewer');

      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);
      const mockWorktreeManager = vi.mocked(WorktreeManagerModule.WorktreeManager.prototype);
      const mockSWEResolver = vi.mocked(SWEResolverModule.SWEResolver.prototype);
      const mockCodeReviewer = vi.mocked(CodeReviewerModule.CodeReviewer.prototype);

      mockIssueAnalyzer.analyzeIssue.mockResolvedValue(mockIssueAnalysis);
      mockIssueAnalyzer.isSuitableForAutonomousResolution.mockReturnValue(true);
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktreeInfo);
      mockSWEResolver.resolveIssue.mockResolvedValue(mockCodeResult);
      mockCodeReviewer.reviewCode.mockResolvedValue(mockReviewResult);

      const result = await orchestrator.executeWorkflow(123);

      expect(result.success).toBe(true);
      expect(result.finalState).toBe(WorkflowState.COMPLETED);
      expect(result.issueAnalysis).toEqual(mockIssueAnalysis);
      expect(result.codeResult).toEqual(mockCodeResult);
      expect(result.reviewResult).toEqual(mockReviewResult);
      expect(result.steps).toHaveLength(5); // All steps completed
    });

    it('should handle unsuitable issues', async () => {
      const mockIssueAnalysis: IssueAnalysis = {
        issueId: 456,
        title: 'Question about usage',
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
        solutionApproach: 'Manual review',
        estimatedEffort: 'complex' as const,
        reasoning: 'Question issue',
      };

      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);

      mockIssueAnalyzer.analyzeIssue.mockResolvedValue(mockIssueAnalysis);
      mockIssueAnalyzer.isSuitableForAutonomousResolution.mockReturnValue(false);

      const result = await orchestrator.executeWorkflow(456);

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.COMPLETED);
      expect(result.error).toContain('not suitable');
      expect(result.steps).toHaveLength(1); // Only analysis step
    });

    it('should handle workflow failures', async () => {
      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);

      mockIssueAnalyzer.analyzeIssue.mockRejectedValue(new Error('API rate limited'));

      const result = await orchestrator.executeWorkflow(789);

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.error).toContain('API rate limited');
    });

    it('should handle code review rejections', async () => {
      const mockIssueAnalysis = {
        issueId: 999,
        title: 'Test issue',
        category: 'bug',
        complexity: 'low',
        feasibility: 'high',
        requirements: ['Fix bug'],
        acceptanceCriteria: [],
        requiredTools: ['edit'],
        riskAssessment: {
          security: 'low',
          performance: 'low',
          breakingChanges: false,
          humanReviewRequired: false,
        },
        solutionApproach: 'Fix the bug',
        estimatedEffort: '1-2 hours',
        reasoning: 'Simple bug fix',
      };

      const mockWorktreeInfo: WorktreeInfo = {
        branch: 'ai-fix/issue-999',
        path: '/tmp/worktree',
        issueId: 999,
        createdAt: new Date(),
        status: 'active' as const,
      };

      const mockCodeResult: CodeGenerationResult = {
        success: true,
        changes: [],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'Success',
        confidence: 0.9,
        requiresHumanReview: false,
      };

      const mockReviewResult: CodeReviewResult = {
        overallAssessment: 'reject' as const,
        issues: [
          {
            severity: 'critical' as const,
            category: 'security' as const,
            description: 'Critical vulnerability',
          },
        ],
        strengths: [],
        recommendations: ['Fix security issue'],
        confidence: 0.9,
        requiresHumanReview: true,
        reasoning: 'Rejected due to security issues',
      };

      const mockCodeResult = {
        success: true,
        changes: [],
        testsAdded: [],
        validationResults: {
          syntaxCheck: true,
          typeCheck: true,
          testsPass: true,
          lintingPass: true,
        },
        reasoning: 'Success',
        confidence: 0.9,
        requiresHumanReview: false,
      };

      const mockReviewResult = {
        overallAssessment: 'reject',
        issues: [
          {
            severity: 'critical',
            category: 'security',
            description: 'Critical vulnerability',
          },
        ],
        strengths: [],
        recommendations: ['Fix security issue'],
        confidence: 0.9,
        requiresHumanReview: true,
        reasoning: 'Rejected due to security issues',
      };

      const IssueAnalyzerModule = await import('./IssueAnalyzer');
      const WorktreeManagerModule = await import('./WorktreeManager');
      const SWEResolverModule = await import('./SWEResolver');
      const CodeReviewerModule = await import('./CodeReviewer');

      const mockIssueAnalyzer = vi.mocked(IssueAnalyzerModule.IssueAnalyzer.prototype);
      const mockWorktreeManager = vi.mocked(WorktreeManagerModule.WorktreeManager.prototype);
      const mockSWEResolver = vi.mocked(SWEResolverModule.SWEResolver.prototype);
      const mockCodeReviewer = vi.mocked(CodeReviewerModule.CodeReviewer.prototype);

      mockIssueAnalyzer.analyzeIssue.mockResolvedValue(mockIssueAnalysis);
      mockIssueAnalyzer.isSuitableForAutonomousResolution.mockReturnValue(true);
      mockWorktreeManager.createWorktree.mockResolvedValue(mockWorktreeInfo);
      mockSWEResolver.resolveIssue.mockResolvedValue(mockCodeResult);
      mockCodeReviewer.reviewCode.mockResolvedValue(mockReviewResult);

      const result = await orchestrator.executeWorkflow(999);

      expect(result.success).toBe(false);
      expect(result.finalState).toBe(WorkflowState.FAILED);
      expect(result.reviewResult?.overallAssessment).toBe('reject');
    });
  });

  describe('workflow state management', () => {
    it('should track workflow state correctly', async () => {
      expect(orchestrator.getCurrentState()).toBe(WorkflowState.INITIALIZING);

      // Mock a quick failure
      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);
      mockIssueAnalyzer.analyzeIssue.mockRejectedValue(new Error('Test error'));

      await orchestrator.executeWorkflow(123);

      expect(orchestrator.getCurrentState()).toBe(WorkflowState.FAILED);
    });

    it('should provide workflow history', async () => {
      const { IssueAnalyzer } = await import('./IssueAnalyzer');
      const mockIssueAnalyzer = vi.mocked(IssueAnalyzer.prototype);
      mockIssueAnalyzer.analyzeIssue.mockRejectedValue(new Error('Test error'));

      await orchestrator.executeWorkflow(123);

      const history = orchestrator.getWorkflowHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].step).toBe(WorkflowState.ANALYZING_ISSUE);
      expect(history[0].success).toBe(false);
    });
  });

  describe('metrics', () => {
    it('should provide workflow metrics', () => {
      const metrics = orchestrator.getMetrics();

      expect(metrics).toHaveProperty('totalWorkflows');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageDuration');
      expect(metrics).toHaveProperty('stepMetrics');
    });
  });
});
