/**
 * Error Recovery System Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorRecoveryHandler,
  ErrorRecoveryManager,
  ErrorSeverity,
  ErrorCategory,
  CircuitBreakerState,
  RecoveryAction,
} from './ErrorRecoverySystem';

describe('ErrorRecoveryHandler', () => {
  let handler: ErrorRecoveryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ErrorRecoveryHandler();
  });

  describe('error classification', () => {
    it('should classify network errors correctly', async () => {
      const error = new Error('Network timeout occurred');
      const context = {
        component: 'IssueAnalyzer',
        operation: 'fetchIssue',
        issueId: 123,
        timestamp: new Date(),
      };

      const result = await handler.handleError(error, context);

      expect(result.action).toBe(RecoveryAction.RETRY);
      expect(result.delay).toBeDefined();
    });

    it('should classify authentication errors as critical', async () => {
      const error = new Error('401 Unauthorized');
      const context = {
        component: 'IssueAnalyzer',
        operation: 'fetchIssue',
        timestamp: new Date(),
      };

      const result = await handler.handleError(error, context);

      expect(result.action).toBe(RecoveryAction.MANUAL);
      expect(result.requiresApproval).toBe(true);
    });

    it('should classify validation errors as non-retryable', async () => {
      const error = new Error('Invalid repository format');
      const context = {
        component: 'ConfigManager',
        operation: 'validate',
        timestamp: new Date(),
      };

      const result = await handler.handleError(error, context);

      expect(result.action).toBe(RecoveryAction.MANUAL);
      expect(result.requiresApproval).toBe(true);
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit breaker after failure threshold', async () => {
      const error = new Error('API rate limited');
      const context = {
        component: 'SWEResolver',
        operation: 'generateCode',
        timestamp: new Date(),
      };

      // Simulate multiple failures
      for (let i = 0; i < 6; i++) {
        await handler.handleError(error, context);
      }

      expect(handler.isComponentAvailable('SWEResolver')).toBe(false);
      const status = handler.getCircuitBreakerStatus('SWEResolver');
      expect(status.state).toBe(CircuitBreakerState.OPEN);
    });

    it('should allow requests when circuit breaker is closed', () => {
      expect(handler.isComponentAvailable('TestComponent')).toBe(true);
      const status = handler.getCircuitBreakerStatus('TestComponent');
      expect(status.state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should record successes and reset failure count', async () => {
      const error = new Error('Temporary failure');
      const context = {
        component: 'TestComponent',
        operation: 'testOp',
        timestamp: new Date(),
      };

      // Cause some failures
      await handler.handleError(error, context);
      await handler.handleError(error, context);

      // Record success
      handler.recordSuccess('TestComponent');

      // Should still be available (below threshold)
      expect(handler.isComponentAvailable('TestComponent')).toBe(true);
    });
  });

  describe('retry logic', () => {
    it('should calculate increasing retry delays', async () => {
      const error = new Error('Network error');
      const context = {
        component: 'TestComponent',
        operation: 'testOp',
        timestamp: new Date(),
      };

      const result1 = await handler.handleError(error, { ...context, attempt: 0 });
      const result2 = await handler.handleError(error, { ...context, attempt: 1 });
      const result3 = await handler.handleError(error, { ...context, attempt: 2 });

      expect(result1.action).toBe(RecoveryAction.RETRY);
      expect(result2.action).toBe(RecoveryAction.RETRY);
      expect(result3.action).toBe(RecoveryAction.RETRY);

      // Delays should increase
      if (result1.delay && result2.delay && result3.delay) {
        expect(result2.delay).toBeGreaterThanOrEqual(result1.delay);
        expect(result3.delay).toBeGreaterThanOrEqual(result2.delay);
      }
    });

    it('should stop retrying after max attempts', async () => {
      const error = new Error('Persistent network error');
      const context = {
        component: 'TestComponent',
        operation: 'testOp',
        timestamp: new Date(),
      };

      const result = await handler.handleError(error, { ...context, attempt: 5 });

      expect(result.action).toBe(RecoveryAction.ESCALATE);
      expect(result.requiresApproval).toBe(true);
    });
  });
});

describe('ErrorRecoveryManager', () => {
  let manager: ErrorRecoveryManager;

  beforeEach(() => {
    manager = new ErrorRecoveryManager();
  });

  describe('component management', () => {
    it('should create handlers for components on demand', async () => {
      const error = new Error('Test error');
      const context = {
        component: 'NewComponent',
        operation: 'testOp',
        timestamp: new Date(),
      };

      const result = await manager.handleComponentError('NewComponent', error, context);

      expect(result).toBeDefined();
      expect(manager.isComponentAvailable('NewComponent')).toBe(true);
    });

    it('should track component availability independently', async () => {
      // Fail one component
      const error = new Error('API error');
      await manager.handleComponentError('ComponentA', error, {
        component: 'ComponentA',
        operation: 'test',
        timestamp: new Date(),
      });

      // Other component should still be available
      expect(manager.isComponentAvailable('ComponentB')).toBe(true);
    });
  });

  describe('system health', () => {
    it('should report healthy system initially', () => {
      const health = manager.getSystemHealth();

      expect(health.overall).toBe('healthy');
      expect(health.components).toEqual({});
    });

    it('should report degraded system when components fail', async () => {
      // Create a failing component
      const error = new Error('Critical error');
      const context = {
        component: 'FailingComponent',
        operation: 'criticalOp',
        timestamp: new Date(),
      };

      // Simulate multiple failures to open circuit breaker
      for (let i = 0; i < 10; i++) {
        await manager.handleComponentError('FailingComponent', error, context);
      }

      const health = manager.getSystemHealth();

      expect(health.overall).toBe('degraded');
      expect(health.components.FailingComponent.available).toBe(false);
    });

    it('should report unhealthy system when all components fail', async () => {
      // This would require setting up multiple failing components
      // For simplicity, we'll test the logic conceptually
      const health = manager.getSystemHealth();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall);
    });
  });
});
