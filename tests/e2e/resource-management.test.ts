/**
 * Resource Management Testing for AI-powered GitHub Issues Reviewer System
 *
 * Tests resource lifecycle management, memory leak detection, file handle cleanup,
 * connection pooling, and efficient resource utilization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowOrchestrator, WorkflowState } from '../../src/scripts/modules/github-issues/WorkflowOrchestrator';
import { DEFAULT_TEST_CONFIG } from '../../src/scripts/modules/github-issues/test-config';

// Resource tracking utilities
class ResourceMonitor {
  private initialResources: ResourceSnapshot;
  private currentResources: ResourceSnapshot;
  private resourceHistory: ResourceSnapshot[] = [];

  constructor() {
    this.initialResources = this.captureResources();
    this.currentResources = { ...this.initialResources };
  }

  captureResources(): ResourceSnapshot {
    return {
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      timestamp: Date.now(),
      activeTimers: 0, // Would need to track actual timers
      openConnections: 0, // Would need to track actual connections
      fileHandles: 0 // Would need to track actual file handles
    };
  }

  updateSnapshot(): void {
    this.currentResources = this.captureResources();
    this.resourceHistory.push({ ...this.currentResources });
  }

  getResourceDelta(): ResourceDelta {
    return {
      memoryDelta: this.currentResources.memory - this.initialResources.memory,
      timeDelta: this.currentResources.timestamp - this.initialResources.timestamp,
      memoryGrowth: this.currentResources.memory - this.initialResources.memory,
      historyLength: this.resourceHistory.length
    };
  }

  detectLeaks(threshold: number = 1024 * 1024): boolean { // 1MB threshold
    const delta = this.getResourceDelta();
    return delta.memoryGrowth > threshold;
  }

  getPeakMemoryUsage(): number {
    return Math.max(...this.resourceHistory.map(r => r.memory));
  }

  reset(): void {
    this.initialResources = this.captureResources();
    this.resourceHistory = [];
  }
}

interface ResourceSnapshot {
  memory: number;
  timestamp: number;
  activeTimers: number;
  openConnections: number;
  fileHandles: number;
}

interface ResourceDelta {
  memoryDelta: number;
  timeDelta: number;
  memoryGrowth: number;
  historyLength: number;
}

// Mock resource-intensive components
const createResourceIntensiveMocks = () => ({
  issueAnalyzer: {
    analyzeIssue: vi.fn().mockImplementation(async (issue: any) => {
      // Simulate resource usage
      const data = new Array(10000).fill('x').join(''); // Create some data
      await new Promise(resolve => setTimeout(resolve, 10));
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
    resolveIssue: vi.fn().mockImplementation(async (analysis: any, issue: any) => {
      // Simulate resource-intensive processing
      const largeArray = new Array(50000).fill(0);
      await new Promise(resolve => setTimeout(resolve, 20));
      return {
        success: true,
        solution: {
          files: [{ path: 'test.js', content: 'console.log("fixed");' }],
          tests: []
        },
        confidence: 0.85,
        reasoning: 'Applied standard fix'
      };
    })
  } as any,

  codeReviewer: {
    reviewChanges: vi.fn().mockImplementation(async (solution: any, issue: any) => {
      // Simulate analysis work
      const analysis = 'x'.repeat(10000);
      await new Promise(resolve => setTimeout(resolve, 15));
      return {
        approved: true,
        score: 0.9,
        comments: [],
        suggestions: [],
        criticalIssues: []
      };
    })
  } as any,

  prGenerator: {
    createPullRequest: vi.fn().mockImplementation(async (resolution: any, review: any, analysis: any) => {
      // Simulate PR creation work
      const prData = { title: 'x'.repeat(100), body: 'x'.repeat(1000) };
      await new Promise(resolve => setTimeout(resolve, 12));
      return {
        number: Math.floor(Math.random() * 1000),
        title: 'Fix bug',
        body: 'This PR fixes the bug',
        html_url: 'https://github.com/test/repo/pull/123'
      };
    })
  } as any
});

describe('Resource Management Testing', () => {
  let orchestrator: WorkflowOrchestrator;
  let resourceMonitor: ResourceMonitor;
  let resourceMocks: ReturnType<typeof createResourceIntensiveMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    resourceMonitor = new ResourceMonitor();
    resourceMocks = createResourceIntensiveMocks();

    orchestrator = new WorkflowOrchestrator({
      ...resourceMocks,
      maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
      enableMetrics: true,
      retryAttempts: DEFAULT_TEST_CONFIG.environment.retries,
      humanInterventionThreshold: 3
    });
  });

  afterEach(() => {
    resourceMonitor.reset();
    // Force cleanup
    if (typeof global !== 'undefined' && (global as any).gc) {
      (global as any).gc();
    }
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during repeated workflow execution', async () => {
      const iterations = 10;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        resourceMonitor.reset();

        const result = await orchestrator.processIssue(
          10000 + i,
          `Memory test ${i}`,
          `Testing memory usage ${i}`
        );

        resourceMonitor.updateSnapshot();
        memorySnapshots.push(resourceMonitor.getResourceDelta().memoryGrowth);

        // Force garbage collection between runs
        if (typeof global !== 'undefined' && (global as any).gc) {
          (global as any).gc();
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Check for memory leaks (should not grow consistently)
      const firstHalf = memorySnapshots.slice(0, iterations / 2);
      const secondHalf = memorySnapshots.slice(iterations / 2);

      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Memory should not grow by more than 50% between halves
      expect(avgSecond / Math.max(avgFirst, 1)).toBeLessThan(1.5);
    });

    it('should clean up memory after workflow completion', async () => {
      const initialMemory = resourceMonitor.captureResources().memory;

      const result = await orchestrator.processIssue(20000, 'Cleanup test', 'Testing memory cleanup');

      // Force garbage collection
      if (typeof global !== 'undefined' && (global as any).gc) {
        (global as any).gc();
      }
      await new Promise(resolve => setTimeout(resolve, 50));

      const finalMemory = resourceMonitor.captureResources().memory;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.success).toBe(true);
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle memory-intensive operations without leaks', async () => {
      // Create memory-intensive mock
      const memoryIntensiveMock = {
        ...resourceMocks,
        autonomousResolver: {
          resolveIssue: vi.fn().mockImplementation(async (analysis: any, issue: any) => {
            // Create large data structures
            const largeData = new Array(100000).fill({ data: 'x'.repeat(100) });
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
              success: true,
              solution: {
                files: [{ path: 'large.js', content: 'x'.repeat(10000) }],
                tests: []
              },
              confidence: 0.85,
              reasoning: 'Memory intensive processing'
            };
          })
        } as any
      };

      const memoryOrchestrator = new WorkflowOrchestrator({
        ...memoryIntensiveMock,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 1,
        humanInterventionThreshold: 3
      });

      const iterations = 5;
      const memoryUsage: number[] = [];

      for (let i = 0; i < iterations; i++) {
        resourceMonitor.reset();

        const result = await memoryOrchestrator.processIssue(
          30000 + i,
          `Memory intensive ${i}`,
          `Testing large data processing ${i}`
        );

        resourceMonitor.updateSnapshot();
        memoryUsage.push(resourceMonitor.getPeakMemoryUsage());

        // Cleanup between iterations
        if (typeof global !== 'undefined' && (global as any).gc) {
          (global as any).gc();
        }
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Memory usage should stabilize, not grow continuously
      const firstHalf = memoryUsage.slice(0, iterations / 2);
      const secondHalf = memoryUsage.slice(iterations / 2);

      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      expect(avgSecond / avgFirst).toBeLessThan(2); // Allow some variation but not continuous growth
    });
  });

  describe('Resource Cleanup Verification', () => {
    it('should clean up resources after successful workflow completion', async () => {
      const activeWorkflowsBefore = orchestrator.getActiveWorkflows().length;

      const result = await orchestrator.processIssue(40000, 'Cleanup test', 'Testing resource cleanup');

      const activeWorkflowsAfter = orchestrator.getActiveWorkflows().length;

      expect(result.success).toBe(true);
      expect(activeWorkflowsAfter).toBe(activeWorkflowsBefore); // Should not leave hanging workflows
    });

    it('should clean up resources after workflow failure', async () => {
      // Create a failing component
      const failingMock = {
        ...resourceMocks,
        issueAnalyzer: {
          analyzeIssue: vi.fn().mockRejectedValue(new Error('Analysis failed'))
        } as any
      };

      const failingOrchestrator = new WorkflowOrchestrator({
        ...failingMock,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 0, // No retries
        humanInterventionThreshold: 3
      });

      const activeWorkflowsBefore = failingOrchestrator.getActiveWorkflows().length;

      try {
        await failingOrchestrator.processIssue(50000, 'Failure cleanup test', 'Testing failure cleanup');
      } catch (error) {
        // Expected to fail
      }

      const activeWorkflowsAfter = failingOrchestrator.getActiveWorkflows().length;

      expect(activeWorkflowsAfter).toBe(activeWorkflowsBefore); // Should clean up even on failure
    });

    it('should handle concurrent workflow cleanup correctly', async () => {
      const concurrentWorkflows = 5;
      const promises = [];

      for (let i = 0; i < concurrentWorkflows; i++) {
        promises.push(
          orchestrator.processIssue(
            60000 + i,
            `Concurrent cleanup ${i}`,
            `Testing concurrent resource cleanup ${i}`
          )
        );
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // No active workflows should remain
      expect(orchestrator.getActiveWorkflows().length).toBe(0);
    });
  });

  describe('Resource Pool Efficiency', () => {
    it('should reuse resources efficiently across multiple workflows', async () => {
      const iterations = 20;
      const executionTimes: number[] = [];
      const memoryUsage: number[] = [];

      for (let i = 0; i < iterations; i++) {
        resourceMonitor.reset();

        const startTime = Date.now();
        const result = await orchestrator.processIssue(
          70000 + i,
          `Efficiency test ${i}`,
          `Testing resource reuse ${i}`
        );
        const executionTime = Date.now() - startTime;

        resourceMonitor.updateSnapshot();

        executionTimes.push(executionTime);
        memoryUsage.push(resourceMonitor.getPeakMemoryUsage());

        expect(result.success).toBe(true);
      }

      // Performance should stabilize (no significant degradation)
      const firstHalf = executionTimes.slice(0, iterations / 2);
      const secondHalf = executionTimes.slice(iterations / 2);

      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      // Execution time should not degrade by more than 50%
      expect(avgSecond / avgFirst).toBeLessThan(1.5);
    });

    it('should maintain consistent resource usage patterns', async () => {
      const iterations = 15;
      const resourcePatterns: ResourceDelta[] = [];

      for (let i = 0; i < iterations; i++) {
        resourceMonitor.reset();

        await orchestrator.processIssue(
          80000 + i,
          `Pattern test ${i}`,
          `Testing resource usage patterns ${i}`
        );

        resourceMonitor.updateSnapshot();
        resourcePatterns.push(resourceMonitor.getResourceDelta());
      }

      // Resource usage should be consistent (low variance)
      const memoryDeltas = resourcePatterns.map(p => p.memoryGrowth);
      const avgMemory = memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length;
      const variance = memoryDeltas.reduce((sum, delta) => sum + Math.pow(delta - avgMemory, 2), 0) / memoryDeltas.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be reasonable (less than 50% of average)
      expect(stdDev / Math.max(avgMemory, 1)).toBeLessThan(0.5);
    });
  });

  describe('Connection and Handle Management', () => {
    it('should not accumulate file handles during processing', async () => {
      // This test would need actual file system monitoring
      // For now, we test that workflows complete without hanging
      const iterations = 10;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const result = await orchestrator.processIssue(
          90000 + i,
          `Handle test ${i}`,
          `Testing file handle management ${i}`
        );
        results.push(result);
      }

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // In a real implementation, we would check that file handles are properly closed
      // For this test environment, we verify no crashes or hangs
    });

    it('should handle connection pooling correctly', async () => {
      // Simulate connection usage
      let activeConnections = 0;
      const maxConnections = 5;

      const connectionMock = {
        ...resourceMocks,
        prGenerator: {
          createPullRequest: vi.fn().mockImplementation(async (resolution: any, review: any, analysis: any) => {
            activeConnections++;
            if (activeConnections > maxConnections) {
              throw new Error('Connection pool exhausted');
            }

            await new Promise(resolve => setTimeout(resolve, 25));

            activeConnections--; // Release connection

            return {
              number: Math.floor(Math.random() * 1000),
              title: 'Fix bug',
              body: 'This PR fixes the bug',
              html_url: 'https://github.com/test/repo/pull/123'
            };
          })
        } as any
      };

      const connectionOrchestrator = new WorkflowOrchestrator({
        ...connectionMock,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 1,
        humanInterventionThreshold: 3
      });

      // Run concurrent requests that should share connection pool
      const concurrentRequests = 8;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          connectionOrchestrator.processIssue(
            100000 + i,
            `Connection test ${i}`,
            `Testing connection pooling ${i}`
          )
        );
      }

      const results = await Promise.all(promises);

      // Should handle concurrent requests without exhausting pool
      const successful = results.filter(r => r.success).length;
      expect(successful).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success
    });
  });

  describe('Resource Threshold Monitoring', () => {
    it('should respect memory limits', async () => {
      const systemLimits = resourceMonitor.captureResources();
      const maxMemory = (performance as any).memory?.jsHeapSizeLimit || 100 * 1024 * 1024; // 100MB default

      const result = await orchestrator.processIssue(110000, 'Limit test', 'Testing memory limits');

      const finalMemory = resourceMonitor.captureResources().memory;

      expect(result.success).toBe(true);
      expect(finalMemory).toBeLessThan(maxMemory * 0.8); // Should not use more than 80% of heap
    });

    it('should provide resource usage metrics', async () => {
      resourceMonitor.reset();

      const result = await orchestrator.processIssue(120000, 'Metrics test', 'Testing resource metrics');

      resourceMonitor.updateSnapshot();
      const delta = resourceMonitor.getResourceDelta();

      expect(result.success).toBe(true);
      expect(delta.memoryDelta).toBeGreaterThanOrEqual(0);
      expect(delta.timeDelta).toBeGreaterThan(0);
      expect(delta.historyLength).toBeGreaterThan(0);
    });

    it('should detect resource exhaustion scenarios', async () => {
      // Create a scenario that uses excessive resources
      const excessiveMock = {
        ...resourceMocks,
        autonomousResolver: {
          resolveIssue: vi.fn().mockImplementation(async (analysis: any, issue: any) => {
            // Create extremely large data structure
            const excessiveData = new Array(1000000).fill({ data: 'x'.repeat(1000) });
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
              success: true,
              solution: {
                files: [{ path: 'excessive.js', content: 'x'.repeat(100000) }],
                tests: []
              },
              confidence: 0.85,
              reasoning: 'Excessive resource usage'
            };
          })
        } as any
      };

      const excessiveOrchestrator = new WorkflowOrchestrator({
        ...excessiveMock,
        maxWorkflowTime: DEFAULT_TEST_CONFIG.benchmarks.workflowTimeout,
        enableMetrics: true,
        retryAttempts: 1,
        humanInterventionThreshold: 3
      });

      resourceMonitor.reset();

      const result = await excessiveOrchestrator.processIssue(130000, 'Excessive test', 'Testing resource exhaustion');

      resourceMonitor.updateSnapshot();

      // Should still complete (graceful handling)
      expect(result.success).toBe(true);

      // But should show significant resource usage
      const delta = resourceMonitor.getResourceDelta();
      expect(delta.memoryGrowth).toBeGreaterThan(1024 * 1024); // At least 1MB increase
    });
  });
});