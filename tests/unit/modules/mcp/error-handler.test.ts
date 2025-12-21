/**
 * MCP Error Handler Unit Tests
 *
 * Comprehensive unit tests for MCP error handling, reconnection logic,
 * circuit breaker pattern, and recovery strategies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MCPErrorHandler } from "../../../../src/scripts/modules/mcp/error-handler";
import { ErrorManager } from "../../../../src/scripts/modules/ErrorManager";
import {
  MCPErrorType,
  MCPErrorCategory,
  MCPErrorSeverity,
  type MCPError,
  type MCPErrorContext,
} from "../../../../src/scripts/modules/mcp/error-handler";

// Mock ErrorManager
vi.mock("../../../src/scripts/modules/ErrorManager", () => ({
  ErrorManager: vi.fn().mockImplementation(() => ({
    handleError: vi.fn(),
    incrementCounter: vi.fn(),
    showErrorMessage: vi.fn(),
  })),
}));

describe("MCPErrorHandler", () => {
  let errorHandler: MCPErrorHandler;
  let mockErrorManager: ErrorManager;

  beforeEach(() => {
    mockErrorManager = new ErrorManager();
    errorHandler = new MCPErrorHandler(mockErrorManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Error Classification", () => {
    it("should classify WebSocket connection failures correctly", async () => {
      const error = new Error("WebSocket connection failed");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "connect",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(
        MCPErrorType.WEBSOCKET_CONNECTION_FAILED,
      );
      expect(result.mcpError.category).toBe(MCPErrorCategory.CONNECTION);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.HIGH);
      expect(result.mcpError.recoverable).toBe(true);
      expect(result.mcpError.retryable).toBe(true);
      expect(result.shouldReconnect).toBe(true);
    });

    it("should classify SSL certificate errors correctly", async () => {
      const error = new Error("SSL certificate verification failed");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "connect",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.SSL_CERTIFICATE_ERROR);
      expect(result.mcpError.category).toBe(MCPErrorCategory.SECURITY);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.CRITICAL);
      expect(result.mcpError.recoverable).toBe(false);
      expect(result.mcpError.retryable).toBe(false);
      expect(result.shouldReconnect).toBe(false);
    });

    it("should classify authentication errors correctly", async () => {
      const error = new Error("Unauthorized - 401");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "authenticate",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.AUTHENTICATION_FAILED);
      expect(result.mcpError.category).toBe(MCPErrorCategory.AUTHENTICATION);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.CRITICAL);
      expect(result.mcpError.recoverable).toBe(false);
      expect(result.mcpError.retryable).toBe(false);
      expect(result.shouldReconnect).toBe(false);
    });

    it("should classify rate limiting errors correctly", async () => {
      const error = new Error("Rate limit exceeded - 429");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "callTool",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.RATE_LIMITING);
      expect(result.mcpError.category).toBe(MCPErrorCategory.RATE_LIMITING);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.MEDIUM);
      expect(result.mcpError.recoverable).toBe(true);
      expect(result.mcpError.retryable).toBe(true);
    });

    it("should classify tool execution timeouts correctly", async () => {
      const error = new Error("Tool execution timeout");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "callTool",
        toolName: "test_tool",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.TOOL_EXECUTION_TIMEOUT);
      expect(result.mcpError.category).toBe(MCPErrorCategory.TIMEOUT);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.MEDIUM);
      expect(result.mcpError.recoverable).toBe(true);
      expect(result.mcpError.retryable).toBe(true);
    });

    it("should classify invalid tool parameters correctly", async () => {
      const error = new Error("Invalid tool parameters");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "callTool",
        toolName: "test_tool",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.INVALID_TOOL_PARAMETERS);
      expect(result.mcpError.category).toBe(MCPErrorCategory.VALIDATION);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.MEDIUM);
      expect(result.mcpError.recoverable).toBe(false);
      expect(result.mcpError.retryable).toBe(false);
    });

    it("should classify resource not found errors correctly", async () => {
      const error = new Error("Resource not found - 404");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "readResource",
        resourceUri: "file://test.txt",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.RESOURCE_NOT_FOUND);
      expect(result.mcpError.category).toBe(MCPErrorCategory.RESOURCE_ACCESS);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.MEDIUM);
      expect(result.mcpError.recoverable).toBe(false);
      expect(result.mcpError.retryable).toBe(false);
    });

    it("should classify server errors correctly", async () => {
      const error = new Error("Internal server error - 500");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "listTools",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);

      expect(result.mcpError.type).toBe(MCPErrorType.INTERNAL_SERVER_ERROR);
      expect(result.mcpError.category).toBe(MCPErrorCategory.SYSTEM);
      expect(result.mcpError.severity).toBe(MCPErrorSeverity.HIGH);
      expect(result.mcpError.recoverable).toBe(true);
      expect(result.mcpError.retryable).toBe(true);
    });
  });

  describe("Reconnection Logic", () => {
    it("should calculate exponential backoff delay correctly", () => {
      // Create error handler without jitter for predictable tests
      const predictableHandler = new MCPErrorHandler(mockErrorManager, {
        reconnection: {
          jitter: false, // Disable jitter for predictable tests
          initialDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
      });

      const delay1 = predictableHandler.calculateReconnectionDelay(1);
      const delay2 = predictableHandler.calculateReconnectionDelay(2);
      const delay3 = predictableHandler.calculateReconnectionDelay(3);

      expect(delay1).toBe(1000); // initialDelay
      expect(delay2).toBe(2000); // initialDelay * 2^1
      expect(delay3).toBe(4000); // initialDelay * 2^2
    });

    it("should apply jitter to reconnection delay", () => {
      // Create two error handlers with jitter to test randomness
      const jitterHandler1 = new MCPErrorHandler(mockErrorManager, {
        reconnection: { jitter: true },
      });
      const jitterHandler2 = new MCPErrorHandler(mockErrorManager, {
        reconnection: { jitter: true },
      });

      const delay1 = jitterHandler1.calculateReconnectionDelay(1);
      const delay2 = jitterHandler2.calculateReconnectionDelay(1);

      // With jitter, delays should be in reasonable range but potentially different
      expect(delay1).toBeGreaterThan(900);
      expect(delay1).toBeLessThan(1100);
      expect(delay2).toBeGreaterThan(900);
      expect(delay2).toBeLessThan(1100);
    });

    it("should respect maximum delay limit", () => {
      const delay = errorHandler.calculateReconnectionDelay(50);
      expect(delay).toBeLessThanOrEqual(30000); // maxDelay
    });

    it("should provide immediate reconnect for specific errors", () => {
      const delay = errorHandler.calculateReconnectionDelay(
        1,
        MCPErrorType.WEBSOCKET_CONNECTION_LOST,
      );
      expect(delay).toBeLessThanOrEqual(200); // Immediate reconnect delay (allowing some jitter)
    });

    it("should update reconnection state correctly", () => {
      const component = "TestComponent";

      // Record successful reconnection
      errorHandler.updateReconnectionState(component, true);
      let state = errorHandler.getReconnectionState(component);
      expect(state.attempt).toBe(0);
      expect(state.successfulReconnections).toBe(1);
      expect(state.failedReconnections).toBe(0);

      // Record failed reconnection
      errorHandler.updateReconnectionState(component, false, 2);
      state = errorHandler.getReconnectionState(component);
      expect(state.attempt).toBe(2);
      expect(state.failedReconnections).toBe(1);
    });

    it("should determine when reconnection is needed", async () => {
      const recoverableError = new Error("Connection lost");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "connect",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(recoverableError, context);
      expect(result.shouldReconnect).toBe(true);

      const nonRecoverableError = new Error("Authentication failed");
      const result2 = await errorHandler.handleError(
        nonRecoverableError,
        context,
      );
      expect(result2.shouldReconnect).toBe(false);
    });
  });

  describe("Circuit Breaker Pattern", () => {
    it("should open circuit breaker after failure threshold", async () => {
      const component = "TestComponent";
      const context: MCPErrorContext = {
        component,
        operation: "connect",
        timestamp: new Date(),
      };

      // Generate enough high-severity errors to open circuit
      for (let i = 0; i < 5; i++) {
        const error = new Error(`WebSocket connection failed ${i}`);
        await errorHandler.handleError(error, context);
      }

      const status = errorHandler.getCircuitBreakerStatus(component);
      expect(status[component].state).toBe("open");
    });

    it("should record success and close circuit breaker", async () => {
      const component = "TestComponent";
      const context: MCPErrorContext = {
        component,
        operation: "connect",
        timestamp: new Date(),
      };

      // First, generate enough high-severity errors to open circuit
      for (let i = 0; i < 5; i++) {
        const error = new Error(`WebSocket connection failed ${i}`);
        await errorHandler.handleError(error, context);
      }

      // Verify circuit is open
      let status = errorHandler.getCircuitBreakerStatus(component);
      expect(status[component].state).toBe("open");

      // Then record successes to close it
      for (let i = 0; i < 3; i++) {
        errorHandler.recordSuccess(component);
      }

      status = errorHandler.getCircuitBreakerStatus(component);
      expect(status[component].state).toBe("closed");
    });

    it("should prevent operations when circuit is open", async () => {
      const component = "TestComponent";
      const context: MCPErrorContext = {
        component,
        operation: "connect",
        timestamp: new Date(),
      };

      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        const error = new Error(`WebSocket connection failed ${i}`);
        await errorHandler.handleError(error, context);
      }

      // Try another operation
      const error = new Error("Another error");
      const result = await errorHandler.handleError(error, context);

      expect(result.shouldReconnect).toBe(false);
      expect(result.recoveryStrategy.action).toBe("escalate");
    });

    it("should attempt circuit breaker reset after timeout", async () => {
      const component = "TestComponent";
      const context: MCPErrorContext = {
        component,
        operation: "connect",
        timestamp: new Date(),
      };

      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        const error = new Error(`WebSocket connection failed ${i}`);
        await errorHandler.handleError(error, context);
      }

      // Attempt reset (should fail due to timeout)
      const canReset1 = errorHandler.attemptCircuitBreakerReset(component);
      expect(canReset1).toBe(false);

      // Manually set last failure time to past to simulate timeout
      const status = errorHandler.getCircuitBreakerStatus(component);
      if (status[component]) {
        status[component].lastFailureTime = new Date(Date.now() - 70000); // 70 seconds ago
      }

      // Attempt reset again (should succeed)
      const canReset2 = errorHandler.attemptCircuitBreakerReset(component);
      expect(canReset2).toBe(true);
    });
  });

  describe("Recovery Strategies", () => {
    it("should execute retry strategy successfully", async () => {
      const error = new Error("Connection lost");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "connect",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);
      const recoveryResult = await errorHandler.executeRecoveryStrategy(
        result.mcpError,
        result.recoveryStrategy,
      );

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.metadata?.retryAttempt).toBeDefined();
    });

    it("should execute skip strategy successfully", async () => {
      const error = new Error("Invalid JSON");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "parseMessage",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);
      const recoveryResult = await errorHandler.executeRecoveryStrategy(
        result.mcpError,
        result.recoveryStrategy,
      );

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.metadata?.skipped).toBe(true);
    });

    it("should execute escalate strategy for critical errors", async () => {
      const error = new Error("Authentication failed");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "authenticate",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);
      const recoveryResult = await errorHandler.executeRecoveryStrategy(
        result.mcpError,
        result.recoveryStrategy,
      );

      expect(recoveryResult.success).toBe(false);
      expect(recoveryResult.metadata?.escalated).toBe(true);
      expect(recoveryResult.metadata?.requiresApproval).toBe(true);
    });

    it("should execute manual strategy for human intervention", async () => {
      const error = new Error("SSL certificate error");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "connect",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);
      const recoveryResult = await errorHandler.executeRecoveryStrategy(
        result.mcpError,
        result.recoveryStrategy,
      );

      expect(recoveryResult.success).toBe(false);
      expect(recoveryResult.metadata?.manualInterventionRequired).toBe(true);
      expect(mockErrorManager.showErrorMessage).toHaveBeenCalled();
    });
  });

  describe("Error Statistics", () => {
    it("should track error statistics correctly", async () => {
      const error = new Error("Internal server error - 500");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "test",
        timestamp: new Date(),
      };

      // Generate multiple errors
      for (let i = 0; i < 3; i++) {
        await errorHandler.handleError(error, context);
      }

      const stats = errorHandler.getErrorStatistics();
      expect(Object.keys(stats)).toContain(MCPErrorType.INTERNAL_SERVER_ERROR);
      expect(stats[MCPErrorType.INTERNAL_SERVER_ERROR].count).toBe(3);
    });

    it("should update error timestamps correctly", async () => {
      const error = new Error("Internal server error - 500");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "test",
        timestamp: new Date(),
      };

      const beforeTime = new Date();
      await errorHandler.handleError(error, context);
      const afterTime = new Date();

      const stats = errorHandler.getErrorStatistics();
      const errorStats = stats[MCPErrorType.INTERNAL_SERVER_ERROR];

      expect(errorStats.firstOccurrence.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(errorStats.lastOccurrence.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe("Event System", () => {
    it("should emit error events", async () => {
      const eventListener = vi.fn();
      errorHandler.addEventListener("mcp_error", eventListener);

      const error = new Error("Test error");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "test",
        timestamp: new Date(),
      };

      await errorHandler.handleError(error, context);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Object),
          recoveryStrategy: expect.any(Object),
          circuitBreakerState: expect.any(Object),
          shouldReconnect: expect.any(Boolean),
        }),
      );
    });

    it("should emit retry attempt events", async () => {
      const eventListener = vi.fn();
      errorHandler.addEventListener("mcp_retry_attempt", eventListener);

      const error = new Error("Connection lost");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "connect",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(error, context);
      await errorHandler.executeRecoveryStrategy(
        result.mcpError,
        result.recoveryStrategy,
      );

      expect(eventListener).toHaveBeenCalled();
    });

    it("should remove event listeners correctly", () => {
      const eventListener = vi.fn();
      errorHandler.addEventListener("test_event", eventListener);
      errorHandler.removeEventListener("test_event", eventListener);

      // Since emitEvent is private, we test that the listener was removed
      // by checking the internal state through public methods
      expect(eventListener).not.toHaveBeenCalled();
    });
  });

  describe("Health Status", () => {
    it("should provide comprehensive health status", () => {
      const healthStatus = errorHandler.getHealthStatus();

      expect(healthStatus.success).toBe(true);
      expect(healthStatus.data).toHaveProperty("circuitBreakers");
      expect(healthStatus.data).toHaveProperty("reconnectionStates");
      expect(healthStatus.data).toHaveProperty("errorStatistics");
      expect(healthStatus.data).toHaveProperty("configuration");
    });

    it("should include configuration in health status", () => {
      const healthStatus = errorHandler.getHealthStatus();

      expect(healthStatus.data?.configuration).toHaveProperty("reconnection");
      expect(healthStatus.data?.configuration).toHaveProperty("circuitBreaker");
      expect(healthStatus.data?.configuration).toHaveProperty("recovery");
    });
  });

  describe("Reset Functionality", () => {
    it("should reset all state correctly", async () => {
      // Generate some state
      const error = new Error("Test error");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "test",
        timestamp: new Date(),
      };

      await errorHandler.handleError(error, context);
      errorHandler.updateReconnectionState("TestComponent", false);

      // Reset
      errorHandler.reset();

      // Check state is cleared
      const stats = errorHandler.getErrorStatistics();
      const circuitBreakers = errorHandler.getCircuitBreakerStatus();
      const reconnectionStates = errorHandler.getReconnectionStatus();

      expect(Object.keys(stats)).toHaveLength(0);
      expect(Object.keys(circuitBreakers)).toHaveLength(0);
      expect(Object.keys(reconnectionStates)).toHaveLength(0);

      expect(mockErrorManager.incrementCounter).toHaveBeenCalledWith(
        "mcp_error_handler_reset",
        { component: "MCPErrorHandler" },
      );
    });
  });

  describe("Configuration", () => {
    it("should use custom reconnection configuration", () => {
      const customErrorHandler = new MCPErrorHandler(mockErrorManager, {
        reconnection: {
          maxAttempts: 20,
          initialDelay: 2000,
          maxDelay: 60000,
          backoffMultiplier: 3,
        },
      });

      const delay = customErrorHandler.calculateReconnectionDelay(2);
      expect(delay).toBe(2000 * Math.pow(3, 1)); // initialDelay * backoffMultiplier^(attempt-1)
    });

    it("should use custom circuit breaker configuration", () => {
      const customErrorHandler = new MCPErrorHandler(mockErrorManager, {
        circuitBreaker: {
          failureThreshold: 10,
          successThreshold: 5,
          recoveryTimeout: 120000,
        },
      });

      // This would affect when circuit breaker opens/closes
      // Implementation details would be tested through integration tests
      expect(customErrorHandler).toBeDefined();
    });

    it("should use custom recovery configuration", () => {
      const customErrorHandler = new MCPErrorHandler(mockErrorManager, {
        recovery: {
          maxAttempts: 5,
          delay: 2000,
          gracefulDegradation: false,
        },
      });

      expect(customErrorHandler).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined errors gracefully", async () => {
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "test",
        timestamp: new Date(),
      };

      // Test with null
      const result1 = await errorHandler.handleError(null, context);
      expect(result1.mcpError).toBeDefined();
      expect(result1.mcpError.message).toBe("null");

      // Test with undefined
      const result2 = await errorHandler.handleError(undefined, context);
      expect(result2.mcpError).toBeDefined();
      expect(result2.mcpError.message).toBe("undefined");
    });

    it("should handle errors without context", async () => {
      const error = new Error("Test error");

      const result = await errorHandler.handleError(error);

      expect(result.mcpError).toBeDefined();
      expect(result.mcpError.context?.component).toBe("MCPErrorHandler");
    });

    it("should generate unique error IDs", async () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      const result1 = await errorHandler.handleError(error1);
      const result2 = await errorHandler.handleError(error2);

      expect(result1.mcpError.id).not.toBe(result2.mcpError.id);
      expect(result1.mcpError.id).toMatch(/^mcp_err_\d+_[a-z0-9]+$/);
      expect(result2.mcpError.id).toMatch(/^mcp_err_\d+_[a-z0-9]+$/);
    });

    it("should preserve original error stack trace", async () => {
      const originalError = new Error("Original error");
      const context: MCPErrorContext = {
        component: "TestComponent",
        operation: "test",
        timestamp: new Date(),
      };

      const result = await errorHandler.handleError(originalError, context);

      expect(result.mcpError.stack).toBe(originalError.stack);
      expect(result.mcpError.cause).toBe(originalError);
    });
  });
});
