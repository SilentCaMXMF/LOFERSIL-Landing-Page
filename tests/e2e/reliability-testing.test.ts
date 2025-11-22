/**
 * Reliability Testing for AI-powered GitHub Issues Reviewer System
 *
 * Tests system stability, error recovery mechanisms, timeout handling,
 * and resource cleanup under various failure conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowOrchestrator, WorkflowState } from '../../src/scripts/modules/github-issues/WorkflowOrchestrator';
import { IssueAnalyzer } from '../../src/scripts/modules/github-issues/IssueAnalyzer';
import { AutonomousResolver } from '../../src/scripts/modules/github-issues/AutonomousResolver';
import { CodeReviewer } from '../../src/scripts/modules/github-issues/CodeReviewer';
import { PRGenerator } from '../../src/scripts/modules/github-issues/PRGenerator';
import { DEFAULT_TEST_CONFIG } from '../../src/scripts/modules/github-issues/test-config';

// Reliability testing utilities
class ReliabilityMonitor {
  private failures: Error[] = [];
  private recoveries: number = 0;
  private timeouts: number = 0;
  private startTime: number = 0;

  start(): void {
    this.startTime = Date.now();
    this.failures = [];
    this.recoveries = 0;
    this.timeouts = 0;
  }

  recordFailure(error: Error): void {
    this.failures.push(error);
  }

  recordRecovery(): void {
    this.recoveries++;
  }

  recordTimeout(): void {
    this.timeouts++;
  }

  getReport() {
    const totalTime = Date.now() - this.startTime;
    return {
      totalTime,
      failureCount: this.failures.length,
      recoveryCount: this.recoveries,
      timeoutCount: this.timeouts,
      failureRate: this.failures.length / Math.max(1, totalTime / 1000), // failures per second
      recoveryRate: this.recoveries / Math.max(1, this.failures.length), // recovery rate
      errors: this.failures
    };
  }
}

// Test fixtures with failure simulation
const createUnreliableMockComponents = (failureRate: number = 0.1) => ({
  issueAnalyzer: {
    analyzeIssue: vi.fn().mockImplementation(async (issue: any) => {
      if (Math.random() < failureRate) {
        throw new Error('Analysis service temporarily unavailable');
      }
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
      return {
        category: 'bug',
        complexity: 'low',
        requirements: ['Fix the bug'],
        acceptanceCriteria: ['Bug is fixed'],
        feasible: true,
        confidence: 0.9,
        reasoning: 'Simple bug fix'
      };
    })
  } as any as IssueAnalyzer,

  autonomousResolver: {
    resolveIssue: vi.fn().mockImplementation(async (analysis: any, issue: any) => {
      if (Math.random() < failureRate) {
        throw new Error('AI service rate limited');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        solution: {
          description: 'Fixed the bug',
          files: [{ path: 'test.js', content: 'console.log("fixed");' }],
          tests: []
        },
        confidence: 0.85,
        reasoning: 'Applied standard fix'
      };
    })
  } as any as AutonomousResolver,

  codeReviewer: {
    reviewChanges: vi.fn().mockImplementation(async (solution: any, issue: any) => {
      if (Math.random() < failureRate) {
        throw new Error('Code review service failed');
      }
      await new Promise(resolve => setTimeout(resolve, 75));
      return {
        approved: true,
        score: 0.9,
        comments: [],
        suggestions: [],
        criticalIssues: []
      };
    })
  } as any as CodeReviewer,

  prGenerator: {
    createPullRequest: vi.fn().mockImplementation(async (resolution: any, review: any, analysis: any) => {
      if (Math.random() < failureRate) {
        throw new Error('GitHub API rate limited');
      }
      await new Promise(resolve => setTimeout(resolve, 60));
      return {
        number: Math.floor(Math.random() * 1000) + 1,
        title: 'Fix bug',
        body: 'This PR fixes the bug',
        html_url: 'https://github.com/test/repo/pull/123'
      };
    })
  } as any as PRGenerator
});

describe('Reliability Testing', () => {
  let orchestrator: WorkflowOrchestrator;
  let reliabilityMonitor: ReliabilityMonitor;
  let unreliableMocks: ReturnType<typeof createUnreliableMockComponents>;

  beforeEach(() => {
    vi.clearAllMocks();
    reliabilityMonitor = new ReliabilityMonitor();
    unreliableMocks = createUnreliableMockComponents(0.1); // 10% failure rate

    orchestrator = new WorkflowOrchestrator({
      ...unreliableMocks,
      maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      enableMetrics: true,
      retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
      humanInterventionThreshold: 3
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Error Recovery Mechanisms', () => {
    it('should recover from intermittent service failures', async () => {
      reliabilityMonitor.start();

      const results = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        try {
          const result = await orchestrator.processIssue(
            1000 + i,
            `Recovery test issue ${i}`,
            `Testing error recovery ${i}`
          );
          results.push(result);

          if (result.success) {
            reliabilityMonitor.recordRecovery();
          } else {
            reliabilityMonitor.recordFailure(new Error(result.error || 'Workflow failed'));
          }
        } catch (error) {
          reliabilityMonitor.recordFailure(error as Error);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const report = reliabilityMonitor.getReport();

      // Should have some failures but also some successes
      expect(report.failureCount).toBeGreaterThan(0);
      expect(report.recoveryCount).toBeGreaterThan(0);

      // Recovery rate should be reasonable
      expect(report.recoveryRate).toBeGreaterThan(0.5); // At least 50% success rate

      // Failure rate should not be too high
      expect(report.failureRate).toBeLessThan(1); // Less than 1 failure per second
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Create components that sometimes timeout
      const timeoutMocks = createUnreliableMockComponents(0);

      // Make one component very slow (timeout)
      timeoutMocks.issueAnalyzer.analyzeIssue.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis + 1000));
        return {
          category: 'bug',
          complexity: 'low',
          requirements: ['Fix the bug'],
          acceptanceCriteria: ['Bug is fixed'],
          feasible: true,
          confidence: 0.9,
          reasoning: 'Simple bug fix'
        };
      });

      const timeoutOrchestrator = new WorkflowOrchestrator({
        ...timeoutMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis + 500, // Shorter timeout
        enableMetrics: true,
        retryAttempts: 1,
        humanInterventionThreshold: 3
      });

      reliabilityMonitor.start();

      try {
        await timeoutOrchestrator.processIssue(2000, 'Timeout test', 'Testing timeout handling');
      } catch (error) {
        reliabilityMonitor.recordTimeout();
      }

      const report = reliabilityMonitor.getReport();

      // Should have recorded a timeout
      expect(report.timeoutCount).toBeGreaterThan(0);
    });

    it('should implement proper retry logic with exponential backoff', async () => {
      let attemptCount = 0;
      const failingMock = {
        analyzeIssue: vi.fn().mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error(`Attempt ${attemptCount} failed`);
          }
          return {
            category: 'bug',
            complexity: 'low',
            requirements: ['Fix the bug'],
            acceptanceCriteria: ['Bug is fixed'],
            feasible: true,
            confidence: 0.9,
            reasoning: 'Simple bug fix'
          };
        })
      } as any as IssueAnalyzer;

      const retryOrchestrator = new WorkflowOrchestrator({
        issueAnalyzer: failingMock,
        autonomousResolver: unreliableMocks.autonomousResolver,
        codeReviewer: unreliableMocks.codeReviewer,
        prGenerator: unreliableMocks.prGenerator,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 3,
        humanInterventionThreshold: 3
      });

      const startTime = Date.now();
      const result = await retryOrchestrator.processIssue(3000, 'Retry test', 'Testing retry logic');

      const duration = Date.now() - startTime;

      // Should eventually succeed after retries
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should have failed twice and succeeded on third try

      // Should show some delay from retries (but not too much)
      expect(duration).toBeGreaterThan(100); // At least some delay
      expect(duration).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout);
    });
  });

  describe('System Stability Under Load', () => {
    it('should maintain stability during sustained high load', async () => {
      const concurrentWorkflows = 15;
      const duration = 30000; // 30 seconds
      const startTime = Date.now();

      reliabilityMonitor.start();

      const workflowPromises: Promise<any>[] = [];
      let completedWorkflows = 0;
      let failedWorkflows = 0;

      // Start workflows continuously
      const interval = setInterval(() => {
        if (Date.now() - startTime < duration) {
          const promise = orchestrator.processIssue(
            Math.floor(Math.random() * 10000) + 4000,
            `Load test issue ${Math.random()}`,
            `Load testing ${Math.random()}`
          ).then(result => {
            completedWorkflows++;
            if (!result.success) {
              failedWorkflows++;
              reliabilityMonitor.recordFailure(new Error(result.error || 'Workflow failed'));
            } else {
              reliabilityMonitor.recordRecovery();
            }
          }).catch(error => {
            failedWorkflows++;
            reliabilityMonitor.recordFailure(error);
          });

          workflowPromises.push(promise);
        } else {
          clearInterval(interval);
        }
      }, 100); // Start a new workflow every 100ms

      // Wait for all workflows to complete
      await new Promise(resolve => setTimeout(resolve, duration + 2000));
      await Promise.allSettled(workflowPromises);

      const report = reliabilityMonitor.getReport();

      // Should have processed a reasonable number of workflows
      expect(completedWorkflows + failedWorkflows).toBeGreaterThan(10);

      // Failure rate should be acceptable under load
      const totalWorkflows = completedWorkflows + failedWorkflows;
      const failureRate = failedWorkflows / totalWorkflows;
      expect(failureRate).toBeLessThan(0.3); // Less than 30% failure rate under load

      // System should not have crashed
      expect(report.failureRate).toBeLessThan(2); // Less than 2 failures per second
    });

    it('should handle memory pressure gracefully', async () => {
      // Create large mock responses to simulate memory pressure
      const memoryIntensiveMocks = createUnreliableMockComponents(0);

      memoryIntensiveMocks.autonomousResolver.resolveIssue.mockResolvedValue({
        success: true,
        solution: {
          description: 'Memory intensive solution',
          files: Array.from({ length: 100 }, (_, i) => ({
            path: `large-file-${i}.js`,
            content: 'x'.repeat(10000) // 10KB per file
          })),
          tests: Array.from({ length: 50 }, (_, i) => `test-${i}.js`)
        },
        confidence: 0.85,
        reasoning: 'Memory intensive processing'
      });

      const memoryOrchestrator = new WorkflowOrchestrator({
        ...memoryIntensiveMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
        humanInterventionThreshold: 3
      });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const results = [];
      for (let i = 0; i < 10; i++) {
        const result = await memoryOrchestrator.processIssue(
          5000 + i,
          `Memory test ${i}`,
          `Testing memory handling ${i}`
        );
        results.push(result);

        // Force garbage collection if available
        if (typeof global !== 'undefined' && (global as any).gc) {
          (global as any).gc();
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // All workflows should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Memory increase should be reasonable (less than 50MB total)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Resource Cleanup and Leak Prevention', () => {
    it('should clean up resources after workflow completion', async () => {
      // Track active workflows
      const activeWorkflows: number[] = [];

      // Override to track workflow starts/completions
      const originalProcessIssue = orchestrator.processIssue.bind(orchestrator);
      orchestrator.processIssue = vi.fn().mockImplementation(async (issueNumber: number) => {
        activeWorkflows.push(issueNumber);
        try {
          const result = await originalProcessIssue(issueNumber);
          return result;
        } finally {
          const index = activeWorkflows.indexOf(issueNumber);
          if (index > -1) {
            activeWorkflows.splice(index, 1);
          }
        }
      });

      // Run multiple workflows
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(orchestrator.processIssue(6000 + i, `Cleanup test ${i}`, `Testing cleanup ${i}`));
      }

      await Promise.all(promises);

      // All workflows should be cleaned up
      expect(activeWorkflows.length).toBe(0);
      expect(orchestrator.getActiveWorkflows().length).toBe(0);
    });

    it('should handle cleanup on workflow failures', async () => {
      // Create a component that always fails
      const failingMocks = createUnreliableMockComponents(1.0); // 100% failure rate

      const failingOrchestrator = new WorkflowOrchestrator({
        ...failingMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 0, // No retries
        humanInterventionThreshold: 3
      });

      const results = [];
      for (let i = 0; i < 5; i++) {
        try {
          const result = await failingOrchestrator.processIssue(
            7000 + i,
            `Failure cleanup test ${i}`,
            `Testing failure cleanup ${i}`
          );
          results.push(result);
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }

      // All workflows should have failed
      results.forEach(result => {
        expect(result.success).toBe(false);
      });

      // No active workflows should remain
      expect(failingOrchestrator.getActiveWorkflows().length).toBe(0);
    });

    it('should prevent resource leaks during concurrent failures', async () => {
      const mixedMocks = createUnreliableMockComponents(0.5); // 50% failure rate

      const mixedOrchestrator = new WorkflowOrchestrator({
        ...mixedMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 1,
        humanInterventionThreshold: 3
      });

      // Run concurrent workflows that may fail
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          mixedOrchestrator.processIssue(
            8000 + i,
            `Concurrent failure test ${i}`,
            `Testing concurrent failures ${i}`
          ).catch(error => ({ success: false, error: error.message }))
        );
      }

      const results = await Promise.all(promises);

      // Should have mix of successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);

      // No workflows should remain active despite failures
      expect(mixedOrchestrator.getActiveWorkflows().length).toBe(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle component-level timeouts', async () => {
      const timeoutMocks = createUnreliableMockComponents(0);

      // Make analysis take too long
      timeoutMocks.issueAnalyzer.analyzeIssue.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis + 100));
        return {
          category: 'bug',
          complexity: 'low',
          requirements: ['Fix the bug'],
          acceptanceCriteria: ['Bug is fixed'],
          feasible: true,
          confidence: 0.9,
          reasoning: 'Simple bug fix'
        };
      });

      const timeoutOrchestrator = new WorkflowOrchestrator({
        ...timeoutMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis + 50, // Very short timeout
        enableMetrics: true,
        retryAttempts: 0,
        humanInterventionThreshold: 3
      });

      reliabilityMonitor.start();

      try {
        await timeoutOrchestrator.processIssue(9000, 'Timeout test', 'Testing timeout');
      } catch (error) {
        reliabilityMonitor.recordTimeout();
      }

      const report = reliabilityMonitor.getReport();

      // Should have recorded timeout
      expect(report.timeoutCount).toBeGreaterThan(0);
    });

    it('should cascade timeouts appropriately', async () => {
      // Create a scenario where one slow component causes overall timeout
      const cascadeMocks = createUnreliableMockComponents(0);

      cascadeMocks.codeReviewer.reviewChanges.mockImplementation(async () => {
        // Very slow review that will cause overall timeout
        await new Promise(resolve => setTimeout(resolve, DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout + 1000));
        return {
          approved: true,
          score: 0.9,
          comments: [],
          suggestions: [],
          criticalIssues: []
        };
      });

      const cascadeOrchestrator = new WorkflowOrchestrator({
        ...cascadeMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 0,
        humanInterventionThreshold: 3
      });

      const startTime = Date.now();

      try {
        await cascadeOrchestrator.processIssue(10000, 'Cascade timeout', 'Testing cascade timeout');
      } catch (error) {
        // Expected to timeout
      }

      const duration = Date.now() - startTime;

      // Should timeout within reasonable bounds
      expect(duration).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout + 2000);
      expect(duration).toBeGreaterThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout - 1000);
    });
  });
});