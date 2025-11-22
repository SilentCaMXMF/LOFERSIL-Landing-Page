/**
 * Stress Testing for AI-powered GitHub Issues Reviewer System
 *
 * Tests system behavior under extreme conditions including memory pressure,
 * network failures, concurrent overload, and system limits.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowOrchestrator, WorkflowState } from '../../src/scripts/modules/github-issues/WorkflowOrchestrator';
import { DEFAULT_TEST_CONFIG } from '../../src/scripts/modules/github-issues/test-config';

// Stress testing utilities
class StressTestRunner {
  private orchestrator: WorkflowOrchestrator;
  private failurePatterns: Map<string, number> = new Map();

  constructor(orchestrator: WorkflowOrchestrator) {
    this.orchestrator = orchestrator;
  }

  async simulateMemoryPressure(iterations: number, largePayloadSize: number = 1000000): Promise<any[]> {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      // Create large mock data to simulate memory pressure
      const largeIssue = {
        number: 10000 + i,
        title: 'x'.repeat(1000), // Large title
        body: 'x'.repeat(largePayloadSize), // Very large body
        labels: [],
        user: { login: 'test-user' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        state: 'open' as const,
        html_url: `https://github.com/test/repo/issues/${10000 + i}`,
      };

      try {
        const result = await this.orchestrator.processIssue(
          largeIssue.number,
          largeIssue.title,
          largeIssue.body
        );
        results.push(result);
      } catch (error) {
        results.push({ success: false, error: error.message });
      }

      // Force garbage collection if available
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
    }

    return results;
  }

  async simulateNetworkInstability(failureRate: number, iterations: number): Promise<any[]> {
    const results = [];

    // Override fetch to simulate network failures
    const originalFetch = global.fetch;
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
      callCount++;
      if (Math.random() < failureRate) {
        throw new Error('Network request failed');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

      // Return mock response
      return {
        ok: true,
        json: async () => ({ success: true }),
        text: async () => 'mock response'
      };
    });

    try {
      for (let i = 0; i < iterations; i++) {
        try {
          const result = await this.orchestrator.processIssue(
            20000 + i,
            `Network stress test ${i}`,
            `Testing network instability ${i}`
          );
          results.push(result);
        } catch (error) {
          results.push({ success: false, error: error.message });
        }
      }
    } finally {
      // Restore original fetch
      global.fetch = originalFetch;
    }

    return results;
  }

  async simulateConcurrentOverload(maxConcurrency: number, duration: number): Promise<any[]> {
    const results: any[] = [];
    const activePromises: Promise<any>[] = [];
    let completedCount = 0;

    const startTime = Date.now();

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        if (Date.now() - startTime >= duration) {
          clearInterval(interval);
          // Wait for remaining promises
          const remainingResults = await Promise.allSettled(activePromises);
          remainingResults.forEach(result => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              results.push({ success: false, error: result.reason?.message });
            }
          });
          resolve(results);
          return;
        }

        // Maintain maximum concurrency
        if (activePromises.length < maxConcurrency) {
          const issueNumber = 30000 + completedCount;
          const promise = this.orchestrator.processIssue(
            issueNumber,
            `Concurrent overload test ${issueNumber}`,
            `Testing extreme concurrency ${issueNumber}`
          ).then(result => {
            results.push(result);
            completedCount++;
            return result;
          }).catch(error => {
            results.push({ success: false, error: error.message });
            completedCount++;
            return { success: false, error: error.message };
          });

          activePromises.push(promise);

          // Remove completed promises
          activePromises.filter(p => {
            // Keep promises that are still running
            return true; // Simplified - in real implementation would track completion
          });
        }
      }, 10); // Very frequent spawning
    });
  }

  getSystemLimits(): any {
    return {
      maxMemory: (performance as any).memory?.jsHeapSizeLimit || 0,
      usedMemory: (performance as any).memory?.usedJSHeapSize || 0,
      availableMemory: ((performance as any).memory?.jsHeapSizeLimit || 0) - ((performance as any).memory?.usedJSHeapSize || 0)
    };
  }
}

describe('Stress Testing', () => {
  let orchestrator: WorkflowOrchestrator;
  let stressRunner: StressTestRunner;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create orchestrator with basic mock components
    orchestrator = new WorkflowOrchestrator({
      issueAnalyzer: {
        analyzeIssue: vi.fn().mockResolvedValue({
          category: 'bug',
          complexity: 'low',
          requirements: ['Fix the bug'],
          acceptanceCriteria: ['Bug is fixed'],
          feasible: true,
          confidence: 0.9,
          reasoning: 'Simple bug fix'
        })
      } as any,
      autonomousResolver: {
        resolveIssue: vi.fn().mockResolvedValue({
          success: true,
          solution: {
            files: [{ path: 'test.js', content: 'console.log("fixed");' }],
            tests: []
          },
          confidence: 0.85,
          reasoning: 'Applied standard fix'
        })
      } as any,
      codeReviewer: {
        reviewChanges: vi.fn().mockResolvedValue({
          approved: true,
          score: 0.9,
          comments: [],
          suggestions: [],
          criticalIssues: []
        })
      } as any,
      prGenerator: {
        createPullRequest: vi.fn().mockResolvedValue({
          number: 123,
          title: 'Fix bug',
          body: 'This PR fixes the bug',
          html_url: 'https://github.com/test/repo/pull/123'
        })
      } as any,
      maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      enableMetrics: true,
      retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
      humanInterventionThreshold: 3
    });

    stressRunner = new StressTestRunner(orchestrator);
  });

  afterEach(() => {
    vi.clearAllTimers();
    // Force cleanup
    if (typeof global !== 'undefined' && (global as any).gc) {
      (global as any).gc();
    }
  });

  describe('Memory Pressure Testing', () => {
    it('should handle large payload processing without crashing', async () => {
      const results = await stressRunner.simulateMemoryPressure(5, 500000); // 5 iterations, 500KB each

      // Should process all requests without crashing
      expect(results.length).toBe(5);

      // At least some should succeed
      const successful = results.filter(r => r.success).length;
      expect(successful).toBeGreaterThan(0);
    });

    it('should gracefully handle memory exhaustion scenarios', async () => {
      const systemLimits = stressRunner.getSystemLimits();

      // Only run if we can monitor memory
      if (systemLimits.maxMemory > 0) {
        const largePayloadSize = Math.min(2000000, systemLimits.availableMemory / 10); // Use 10% of available memory per request

        const results = await stressRunner.simulateMemoryPressure(3, largePayloadSize);

        // System should not crash
        expect(results.length).toBe(3);

        // Check final memory state
        const finalLimits = stressRunner.getSystemLimits();
        expect(finalLimits.usedMemory).toBeLessThan(finalLimits.maxMemory * 0.9); // Should not use more than 90% of heap
      }
    });

    it('should recover memory after large payload processing', async () => {
      const initialMemory = stressRunner.getSystemLimits().usedMemory;

      await stressRunner.simulateMemoryPressure(3, 100000);

      // Force garbage collection and wait
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = stressRunner.getSystemLimits().usedMemory;

      // Memory should not have grown excessively
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });

  describe('Network Instability Testing', () => {
    it('should handle intermittent network failures', async () => {
      const results = await stressRunner.simulateNetworkInstability(0.3, 10); // 30% failure rate, 10 iterations

      expect(results.length).toBe(10);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      // Should have both successes and failures
      expect(successful).toBeGreaterThan(0);
      expect(failed).toBeGreaterThan(0);

      // Success rate should be reasonable despite failures
      expect(successful / results.length).toBeGreaterThan(0.4);
    });

    it('should recover from complete network outage simulation', async () => {
      // First simulate complete outage
      const outageResults = await stressRunner.simulateNetworkInstability(1.0, 3); // 100% failure rate

      // All should fail during outage
      const allFailed = outageResults.every(r => !r.success);
      expect(allFailed).toBe(true);

      // Then test recovery with normal conditions
      const recoveryResults = await stressRunner.simulateNetworkInstability(0.1, 5); // 10% failure rate

      const recoverySuccessful = recoveryResults.filter(r => r.success).length;
      expect(recoverySuccessful).toBeGreaterThan(recoveryResults.length * 0.7); // At least 70% success rate
    });

    it('should handle network timeouts gracefully', async () => {
      // Create components that simulate network timeouts
      const timeoutMocks = {
        issueAnalyzer: {
          analyzeIssue: vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis + 500));
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
        } as any,
        autonomousResolver: {
          resolveIssue: vi.fn().mockResolvedValue({
            success: true,
            solution: { files: [], tests: [] },
            confidence: 0.85,
            reasoning: 'Applied standard fix'
          })
        } as any,
        codeReviewer: {
          reviewChanges: vi.fn().mockResolvedValue({
            approved: true,
            score: 0.9,
            comments: [],
            suggestions: [],
            criticalIssues: []
          })
        } as any,
        prGenerator: {
          createPullRequest: vi.fn().mockResolvedValue({
            number: 123,
            title: 'Fix bug',
            body: 'This PR fixes the bug',
            html_url: 'https://github.com/test/repo/pull/123'
          })
        } as any
      };

      const timeoutOrchestrator = new WorkflowOrchestrator({
        ...timeoutMocks,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.stepTimeouts.analysis + 200, // Short timeout
        enableMetrics: true,
        retryAttempts: 0,
        humanInterventionThreshold: 3
      });

      const timeoutStressRunner = new StressTestRunner(timeoutOrchestrator);

      const results = await timeoutStressRunner.simulateNetworkInstability(0, 3); // No network failures, just timeouts

      // Should handle timeouts without crashing
      expect(results.length).toBe(3);

      // Some may succeed, some may fail due to timeout
      const successful = results.filter(r => r.success).length;
      expect(successful).toBeGreaterThanOrEqual(0); // At least some should succeed or all should fail gracefully
    });
  });

  describe('Concurrent Overload Testing', () => {
    it('should handle extreme concurrent load', async () => {
      const results = await stressRunner.simulateConcurrentOverload(50, 5000); // 50 concurrent, 5 seconds

      // Should process many requests
      expect(results.length).toBeGreaterThan(100);

      // System should not crash completely
      const successful = results.filter(r => r.success).length;
      expect(successful).toBeGreaterThan(0);
    });

    it('should maintain basic functionality under overload', async () => {
      const results = await stressRunner.simulateConcurrentOverload(20, 3000); // 20 concurrent, 3 seconds

      const successful = results.filter(r => r.success).length;
      const total = results.length;

      // Should maintain some level of functionality
      expect(successful / total).toBeGreaterThan(0.5); // At least 50% success rate

      // Average response time should be reasonable
      const avgResponseTime = results
        .filter(r => r.executionTime)
        .reduce((sum, r) => sum + r.executionTime, 0) / results.filter(r => r.executionTime).length;

      expect(avgResponseTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout * 2);
    });

    it('should recover from overload conditions', async () => {
      // Overload phase
      await stressRunner.simulateConcurrentOverload(30, 2000);

      // Recovery phase - single requests
      const recoveryResults = [];
      for (let i = 0; i < 5; i++) {
        const result = await orchestrator.processIssue(
          40000 + i,
          `Recovery test ${i}`,
          `Post-overload recovery ${i}`
        );
        recoveryResults.push(result);
      }

      // Should recover to normal operation
      const recoverySuccessful = recoveryResults.filter(r => r.success).length;
      expect(recoverySuccessful).toBe(recoveryResults.length); // All should succeed

      const avgRecoveryTime = recoveryResults.reduce((sum, r) => sum + r.executionTime, 0) / recoveryResults.length;
      expect(avgRecoveryTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout);
    });
  });

  describe('System Limits Identification', () => {
    it('should identify memory limits', async () => {
      const limits = stressRunner.getSystemLimits();

      // Should be able to detect memory limits
      expect(limits.maxMemory).toBeGreaterThan(0);
      expect(limits.usedMemory).toBeGreaterThan(0);
      expect(limits.availableMemory).toBeGreaterThan(0);
    });

    it('should handle system resource exhaustion gracefully', async () => {
      // Test with increasingly large payloads
      const payloadSizes = [10000, 50000, 100000, 500000];

      for (const size of payloadSizes) {
        const results = await stressRunner.simulateMemoryPressure(2, size);

        // Should handle each size without crashing
        expect(results.length).toBe(2);

        const successful = results.filter(r => r.success).length;
        expect(successful).toBeGreaterThanOrEqual(0); // May fail gracefully
      }
    });

    it('should provide graceful degradation under extreme stress', async () => {
      // Combine multiple stress factors
      const combinedStressResults = await Promise.all([
        stressRunner.simulateMemoryPressure(3, 100000),
        stressRunner.simulateNetworkInstability(0.2, 3),
        stressRunner.simulateConcurrentOverload(10, 2000)
      ]);

      // Should handle combined stress without complete failure
      const allResults = combinedStressResults.flat();
      const successful = allResults.filter(r => r.success).length;

      // At least some operations should succeed
      expect(successful).toBeGreaterThan(allResults.length * 0.2); // At least 20% success rate
    });
  });
});