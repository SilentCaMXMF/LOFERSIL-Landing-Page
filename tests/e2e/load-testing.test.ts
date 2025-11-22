/**
 * Load Testing for AI-powered GitHub Issues Reviewer System
 *
 * Tests system behavior under sustained high load, measuring throughput,
 * resource utilization, and performance degradation over time.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowOrchestrator, WorkflowState } from '../../src/scripts/modules/github-issues/WorkflowOrchestrator';
import { DEFAULT_TEST_CONFIG } from '../../src/scripts/modules/github-issues/test-config';

// Load testing utilities
class LoadTestRunner {
  private orchestrator: WorkflowOrchestrator;
  private results: any[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(orchestrator: WorkflowOrchestrator) {
    this.orchestrator = orchestrator;
  }

  async runLoadTest(duration: number, requestInterval: number): Promise<any[]> {
    this.results = [];
    this.startTime = Date.now();

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        if (Date.now() - this.startTime >= duration) {
          clearInterval(interval);
          this.endTime = Date.now();
          resolve(this.results);
          return;
        }

        try {
          const issueNumber = Math.floor(Math.random() * 100000) + 10000;
          const result = await this.orchestrator.processIssue(
            issueNumber,
            `Load test issue ${issueNumber}`,
            `Load testing issue ${issueNumber}`
          );
          this.results.push({ ...result, timestamp: Date.now() });
        } catch (error) {
          this.results.push({
            success: false,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }, requestInterval);
    });
  }

  getMetrics() {
    const totalTime = this.endTime - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const throughput = this.results.length / (totalTime / 1000); // requests per second

    return {
      totalRequests: this.results.length,
      successfulRequests: successful,
      failedRequests: failed,
      successRate: successful / this.results.length,
      throughput,
      totalTime,
      averageResponseTime: this.results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / this.results.length
    };
  }
}

describe('Load Testing', () => {
  let orchestrator: WorkflowOrchestrator;
  let loadRunner: LoadTestRunner;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create orchestrator with mock components (simplified for load testing)
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

    loadRunner = new LoadTestRunner(orchestrator);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Sustained Load Performance', () => {
    it('should maintain acceptable throughput under moderate load', async () => {
      const testDuration = 10000; // 10 seconds
      const requestInterval = 200; // 5 requests per second

      const results = await loadRunner.runLoadTest(testDuration, requestInterval);
      const metrics = loadRunner.getMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(40); // At least 40 requests in 10 seconds
      expect(metrics.successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(metrics.throughput).toBeGreaterThan(3); // At least 3 requests per second
      expect(metrics.averageResponseTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout);
    });

    it('should handle high load gracefully', async () => {
      const testDuration = 5000; // 5 seconds
      const requestInterval = 50; // 20 requests per second

      const results = await loadRunner.runLoadTest(testDuration, requestInterval);
      const metrics = loadRunner.getMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(80); // At least 80 requests in 5 seconds
      expect(metrics.successRate).toBeGreaterThan(0.7); // At least 70% success rate under high load
      expect(metrics.throughput).toBeGreaterThan(10); // At least 10 requests per second
    });

    it('should recover from load spikes', async () => {
      // First phase: normal load
      const normalResults = await loadRunner.runLoadTest(3000, 200); // 3 seconds, 5 req/sec
      const normalMetrics = loadRunner.getMetrics();

      // Second phase: high load spike
      const spikeResults = await loadRunner.runLoadTest(2000, 50); // 2 seconds, 20 req/sec
      const spikeMetrics = loadRunner.getMetrics();

      // Third phase: recovery to normal load
      const recoveryResults = await loadRunner.runLoadTest(3000, 200); // 3 seconds, 5 req/sec
      const recoveryMetrics = loadRunner.getMetrics();

      // System should maintain reasonable performance throughout
      expect(normalMetrics.successRate).toBeGreaterThan(0.8);
      expect(spikeMetrics.successRate).toBeGreaterThan(0.6); // May drop during spike but not catastrophically
      expect(recoveryMetrics.successRate).toBeGreaterThan(0.8); // Should recover
    });
  });

  describe('Resource Utilization Under Load', () => {
    it('should monitor memory usage during load tests', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const results = await loadRunner.runLoadTest(5000, 100); // 5 seconds, 10 req/sec
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const metrics = loadRunner.getMetrics();

      expect(metrics.totalRequests).toBeGreaterThan(40);
      expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    it('should not have excessive memory growth over time', async () => {
      const memorySnapshots: number[] = [];

      // Take memory snapshots during load test
      const memoryInterval = setInterval(() => {
        const memory = (performance as any).memory?.usedJSHeapSize || 0;
        memorySnapshots.push(memory);
      }, 500);

      await loadRunner.runLoadTest(10000, 150); // 10 seconds, ~7 req/sec

      clearInterval(memoryInterval);

      const metrics = loadRunner.getMetrics();

      // Check memory growth trend
      if (memorySnapshots.length > 2) {
        const firstHalf = memorySnapshots.slice(0, memorySnapshots.length / 2);
        const secondHalf = memorySnapshots.slice(memorySnapshots.length / 2);

        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        // Memory should not grow excessively (less than 20% increase)
        expect(avgSecond / avgFirst).toBeLessThan(1.2);
      }

      expect(metrics.successRate).toBeGreaterThan(0.8);
    });
  });

  describe('Load Threshold Testing', () => {
    it('should identify performance degradation points', async () => {
      const loadLevels = [
        { duration: 2000, interval: 500, expectedThroughput: 2 }, // 2 req/sec
        { duration: 2000, interval: 200, expectedThroughput: 5 }, // 5 req/sec
        { duration: 2000, interval: 100, expectedThroughput: 10 }, // 10 req/sec
        { duration: 2000, interval: 50, expectedThroughput: 15 }, // 20 req/sec (theoretical)
      ];

      const performanceResults = [];

      for (const level of loadLevels) {
        const results = await loadRunner.runLoadTest(level.duration, level.interval);
        const metrics = loadRunner.getMetrics();

        performanceResults.push({
          targetThroughput: level.expectedThroughput,
          actualThroughput: metrics.throughput,
          successRate: metrics.successRate,
          avgResponseTime: metrics.averageResponseTime
        });
      }

      // Performance should degrade gracefully, not collapse
      for (let i = 1; i < performanceResults.length; i++) {
        const prev = performanceResults[i - 1];
        const curr = performanceResults[i];

        // Success rate shouldn't drop more than 30% between levels
        expect(curr.successRate).toBeGreaterThan(prev.successRate * 0.7);
      }
    });

    it('should handle queueing under overload conditions', async () => {
      // Simulate overload by creating very fast requests
      const results = await loadRunner.runLoadTest(3000, 10); // 100 req/sec theoretical
      const metrics = loadRunner.getMetrics();

      // Even under overload, system should not crash
      expect(metrics.totalRequests).toBeGreaterThan(100); // Should handle many requests

      // Success rate may be lower under overload, but should be > 0
      expect(metrics.successRate).toBeGreaterThan(0);

      // Average response time should still be reasonable
      expect(metrics.averageResponseTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout * 2);
    });
  });

  describe('Recovery After Load', () => {
    it('should recover quickly after load test completion', async () => {
      // Run high load test
      await loadRunner.runLoadTest(5000, 50); // 5 seconds, 20 req/sec

      // Immediately run a single request to test recovery
      const startTime = Date.now();
      const result = await orchestrator.processIssue(99999, 'Recovery test', 'Testing post-load recovery');
      const recoveryTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(recoveryTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout);
      expect(result.executionTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout);
    });

    it('should maintain consistent performance post-load', async () => {
      // High load phase
      await loadRunner.runLoadTest(3000, 50);

      // Recovery phase - multiple normal requests
      const recoveryResults = [];
      for (let i = 0; i < 10; i++) {
        const result = await orchestrator.processIssue(
          20000 + i,
          `Recovery issue ${i}`,
          `Post-load recovery test ${i}`
        );
        recoveryResults.push(result);
      }

      const successfulRecoveries = recoveryResults.filter(r => r.success).length;
      const avgRecoveryTime = recoveryResults.reduce((sum, r) => sum + r.executionTime, 0) / recoveryResults.length;

      expect(successfulRecoveries).toBe(recoveryResults.length); // All should succeed
      expect(avgRecoveryTime).toBeLessThan(DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout);
    });
  });
});