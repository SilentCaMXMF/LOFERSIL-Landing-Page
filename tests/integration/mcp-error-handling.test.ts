/**
 * MCP Error Handling Integration Tests
 *
 * Integration tests for MCP error handling system with other MCP components
 * including WebSocket client, protocol handler, and core client.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MCPErrorHandler } from "../../src/scripts/modules/mcp/error-handler";
import { ErrorManager } from "../../src/scripts/modules/ErrorManager";
import { MCPWebSocketClient } from "../../src/scripts/modules/mcp/websocket-client";
import { MCPClient } from "../../src/scripts/modules/mcp/client";
import {
  MCPErrorType,
  MCPErrorCategory,
  MCPErrorSeverity,
  type MCPErrorContext,
} from "../../src/scripts/modules/mcp/error-handler";

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection after very short delay for faster tests
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 1); // Much shorter delay
  }

  send(data: string): void {
    // Mock send
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent("close"));
    }
  }

  addEventListener(type: string, listener: EventListener): void {
    // Mock event listener
  }

  removeEventListener(type: string, listener: EventListener): void {
    // Mock event listener removal
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe("MCP Error Handling Integration", () => {
  let errorHandler: MCPErrorHandler;
  let errorManager: ErrorManager;
  let wsClient: MCPWebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
    errorManager = new ErrorManager();
    // Spy on methods
    vi.spyOn(errorManager, "handleError").mockImplementation(() => {});
    vi.spyOn(errorManager, "incrementCounter").mockImplementation(() => {});

    errorHandler = new MCPErrorHandler(errorManager, {
      reconnection: {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false, // Disable for predictable tests
      },
      circuitBreaker: {
        failureThreshold: 3,
        successThreshold: 2,
        recoveryTimeout: 5000,
        enabled: true,
      },
    });
  });

  // Helper to create fresh MCP client for each test
  const createFreshClient = () => {
    const config = {
      serverUrl: "ws://localhost:8080/mcp",
      connectionTimeout: 1000,
      reconnection: {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
      },
    };
    return new MCPClient(config, errorManager);
  };

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    // Reset mock WebSocket
    global.WebSocket = MockWebSocket as any;

    // Clear any pending timers
    vi.clearAllTimers();
  });

  describe("WebSocket Client Integration", () => {
    it("should handle WebSocket connection failures", async () => {
      vi.useFakeTimers();

      const client = createFreshClient();

      // Mock WebSocket to fail connection
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          vi.useRealTimers(); // Use real timers for this specific timeout
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            if (this.onerror) {
              this.onerror(new Event("error"));
            }
            if (this.onclose) {
              this.onclose(new CloseEvent("close"));
            }
          }, 50);
        }
      } as any;

      try {
        await client.connect();
        expect.fail("Should have thrown connection error");
      } catch (error) {
        // Verify error was handled by error handler
        expect(errorManager.handleError).toHaveBeenCalled();
      } finally {
        client.destroy();
        vi.useFakeTimers(); // Restore fake timers
        vi.useRealTimers(); // Clean up
      }

      // Restore original WebSocket
      global.WebSocket = originalWebSocket;
    });

    it("should handle connection timeouts", async () => {
      vi.useFakeTimers();

      const client = createFreshClient();

      // Mock WebSocket to never connect
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          // Never call onopen - simulate timeout
        }
      } as any;

      try {
        const connectPromise = client.connect();

        // Advance time beyond connection timeout (default 10 seconds)
        vi.advanceTimersByTime(11000);

        await connectPromise;
        expect.fail("Should have thrown timeout error");
      } catch (error) {
        expect(errorManager.handleError).toHaveBeenCalled();
      } finally {
        client.destroy();
        vi.useRealTimers();
      }

      global.WebSocket = originalWebSocket;
    });

    it("should handle unexpected connection loss", async () => {
      vi.useFakeTimers();

      const client = createFreshClient();

      try {
        // Fast forward connection
        const connectPromise = client.connect();
        vi.advanceTimersByTime(200);
        await connectPromise;

        // Simulate connection loss
        const wsInstance = (client as any).wsClient.ws;
        if (wsInstance) {
          wsInstance.readyState = MockWebSocket.CLOSED;
          if (wsInstance.onclose) {
            wsInstance.onclose(new CloseEvent("close", { code: 1006 }));
          }
        }

        // Verify error handling
        expect(errorManager.handleError).toHaveBeenCalled();
      } finally {
        client.destroy();
        vi.useRealTimers();
      }
    });
  });

  describe("Protocol Error Integration", () => {
    it("should handle malformed JSON-RPC messages", async () => {
      const client = createFreshClient();
      await client.connect();

      // Simulate receiving malformed message
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const malformedEvent = new MessageEvent("message", {
          data: "invalid json{",
        });
        wsInstance.onmessage(malformedEvent);
      }

      // Verify error was handled
      expect(errorManager.handleError).toHaveBeenCalled();
    });

    it("should handle invalid JSON-RPC responses", async () => {
      const client = createFreshClient();
      await client.connect();

      // Simulate receiving invalid response
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const invalidResponse = {
          jsonrpc: "2.0",
          // Missing id and result/error
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(invalidResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });

    it("should handle method not found errors", async () => {
      const client = createFreshClient();
      await client.connect();

      // Simulate receiving method not found error
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const errorResponse = {
          jsonrpc: "2.0",
          id: "test-request",
          error: {
            code: -32601,
            message: "Method not found",
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(errorResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });
  });

  describe("Tool Execution Error Integration", () => {
    it("should handle tool not found errors", async () => {
      const client = createFreshClient();
      await client.connect();

      try {
        await createFreshClient().callTool("nonexistent_tool", {});
        expect.fail("Should have thrown tool not found error");
      } catch (error) {
        expect(errorManager.handleError).toHaveBeenCalled();
      }
    });

    it("should handle invalid tool parameters", async () => {
      const client = createFreshClient();
      await client.connect();

      // Mock a tool that requires specific parameters
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const errorResponse = {
          jsonrpc: "2.0",
          id: "tool-call",
          error: {
            code: -32602,
            message: "Invalid params",
            data: {
              validationErrors: [
                {
                  field: "required_param",
                  message: "Required parameter missing",
                },
              ],
            },
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(errorResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });

    it("should handle tool execution timeouts", async () => {
      vi.useFakeTimers();

      const config = {
        serverUrl: "ws://localhost:8080/mcp",
        tools: {
          defaultTimeout: 100, // Very short timeout
        },
      };
      const timeoutClient = new MCPClient(config, errorManager);

      await timeoutClient.connect();

      try {
        // Start the tool call but don't wait for it to complete naturally
        const toolCallPromise = timeoutClient.callTool("slow_tool", {});

        // Advance time past the timeout
        vi.advanceTimersByTime(150);

        // Now the tool call should timeout
        await toolCallPromise;
        expect.fail("Should have thrown timeout error");
      } catch (error) {
        expect(errorManager.handleError).toHaveBeenCalled();
      } finally {
        timeoutClient.destroy();
        vi.useRealTimers();
      }
    });
  });

  describe("Resource Access Error Integration", () => {
    it("should handle resource not found errors", async () => {
      const client = createFreshClient();
      await client.connect();

      try {
        const client = createFreshClient();
        await client.readResource("file://nonexistent.txt");
        expect.fail("Should have thrown resource not found error");
      } catch (error) {
        expect(errorManager.handleError).toHaveBeenCalled();
      }
    });

    it("should handle resource access denied errors", async () => {
      const client = createFreshClient();
      await client.connect();

      // Mock access denied response
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const errorResponse = {
          jsonrpc: "2.0",
          id: "resource-read",
          error: {
            code: -32002,
            message: "Access denied",
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(errorResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });

    it("should handle resource too large errors", async () => {
      const config = {
        serverUrl: "ws://localhost:8080/mcp",
        resources: {
          maxSize: 1024, // 1KB limit
        },
      };
      const sizeLimitClient = new MCPClient(config, errorManager);

      await sizeLimitClient.connect();

      // Mock large resource response
      const wsInstance = (sizeLimitClient as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const largeContent = "x".repeat(2048); // 2KB content
        const response = {
          jsonrpc: "2.0",
          id: "resource-read",
          result: {
            contents: [
              {
                uri: "file://large.txt",
                mimeType: "text/plain",
                text: largeContent,
              },
            ],
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(response),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
      sizeLimitClient.destroy();
    });
  });

  describe("Authentication Error Integration", () => {
    it("should handle authentication failures", async () => {
      const config = {
        serverUrl: "ws://localhost:8080/mcp",
        apiKey: "invalid_key",
      };
      const authClient = new MCPClient(config, errorManager);

      // Mock authentication failure
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            if (this.onerror) {
              const errorEvent = new Event("error");
              (errorEvent as any).code = 4001;
              (errorEvent as any).reason = "Authentication failed";
              this.onerror(errorEvent);
            }
            if (this.onclose) {
              this.onclose(
                new CloseEvent("close", {
                  code: 4001,
                  reason: "Authentication failed",
                }),
              );
            }
          }, 50);
        }
      } as any;

      try {
        await authClient.connect();
        expect.fail("Should have thrown authentication error");
      } catch (error) {
        expect(errorManager.handleError).toHaveBeenCalled();
      } finally {
        authClient.destroy();
        global.WebSocket = originalWebSocket;
      }
    });

    it("should handle authorization failures", async () => {
      const client = createFreshClient();
      await client.connect();

      // Mock authorization failure response
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const errorResponse = {
          jsonrpc: "2.0",
          id: "initialize",
          error: {
            code: -32002,
            message: "Forbidden - insufficient permissions",
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(errorResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });
  });

  describe("Rate Limiting Integration", () => {
    it("should handle rate limiting errors", async () => {
      const client = createFreshClient();
      await client.connect();

      // Mock rate limiting response
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const errorResponse = {
          jsonrpc: "2.0",
          id: "tool-call",
          error: {
            code: -32006,
            message: "Rate limit exceeded",
            data: {
              retryAfter: 60,
              limit: 100,
              remaining: 0,
            },
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(errorResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });

    it("should implement exponential backoff for rate limiting", async () => {
      vi.useFakeTimers();

      const startTime = Date.now();

      // Simulate multiple rate limit errors
      for (let i = 0; i < 3; i++) {
        const error = new Error(`Rate limit exceeded ${i}`);
        const context: MCPErrorContext = {
          component: "MCPClient",
          operation: "callTool",
          timestamp: new Date(),
        };

        // Start the error handling (it will return a promise that resolves after backoff)
        const handleErrorPromise = errorHandler.handleError(error, context);

        // Fast-forward time by the expected backoff (100ms * 2^i)
        const expectedDelay = 100 * Math.pow(2, i);
        vi.advanceTimersByTime(expectedDelay);

        // Wait for the promise to resolve
        await handleErrorPromise;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have taken some time due to backoff
      expect(duration).toBeGreaterThan(100);

      vi.useRealTimers();
    });
  });

  describe("Circuit Breaker Integration", () => {
    it("should open circuit breaker after repeated failures", async () => {
      const component = "MCPClient";
      const context: MCPErrorContext = {
        component,
        operation: "connect",
        timestamp: new Date(),
      };

      // Generate enough failures to open circuit
      for (let i = 0; i < 3; i++) {
        const error = new Error(`Connection failed ${i}`);
        await errorHandler.handleError(error, context);
      }

      const status = errorHandler.getCircuitBreakerStatus(component);
      expect(status[component].state).toBe("open");
    });

    it("should prevent operations when circuit is open", async () => {
      const component = "MCPClient";
      const context: MCPErrorContext = {
        component,
        operation: "connect",
        timestamp: new Date(),
      };

      // Open circuit breaker
      for (let i = 0; i < 3; i++) {
        const error = new Error(`Connection failed ${i}`);
        await errorHandler.handleError(error, context);
      }

      // Try another operation
      const error = new Error("Another error");
      const result = await errorHandler.handleError(error, context);

      expect(result.shouldReconnect).toBe(false);
      expect(result.recoveryStrategy.action).toBe("escalate");
    });
  });

  describe("Error Recovery Integration", () => {
    it("should implement retry logic for recoverable errors", async () => {
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "connect",
        timestamp: new Date(),
      };

      const error = new Error("Connection lost");
      const result = await errorHandler.handleError(error, context);

      expect(result.recoveryStrategy.action).toBe("retry");
      expect(result.shouldReconnect).toBe(true);
    });

    it("should skip non-recoverable errors", async () => {
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "parseMessage",
        timestamp: new Date(),
      };

      const error = new Error("Invalid JSON");
      const result = await errorHandler.handleError(error, context);

      expect(result.recoveryStrategy.action).toBe("skip");
      expect(result.shouldReconnect).toBe(false);
    });

    it("should escalate critical errors", async () => {
      // Create a fresh error handler to avoid circuit breaker state from previous tests
      const freshErrorHandler = new MCPErrorHandler(errorManager, {
        circuitBreaker: { enabled: false }, // Disable circuit breaker for this test
      });

      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "authenticate",
        timestamp: new Date(),
      };

      const error = new Error("Authentication failed");
      const result = await freshErrorHandler.handleError(error, context);

      console.log("Error classification:", {
        requiresHumanIntervention: result.mcpError.requiresHumanIntervention,
        recoverable: result.mcpError.recoverable,
        retryable: result.mcpError.retryable,
        severity: result.mcpError.severity,
        category: result.mcpError.category,
        type: result.mcpError.type,
        recoveryStrategy: result.recoveryStrategy,
      });

      expect(result.recoveryStrategy.action).toBe("escalate");
      expect(result.shouldReconnect).toBe(false);
    });
  });

  describe("Performance and Monitoring Integration", () => {
    it("should track error statistics across components", async () => {
      const contexts: MCPErrorContext[] = [
        {
          component: "MCPClient",
          operation: "connect",
          timestamp: new Date(),
        },
        {
          component: "WebSocketClient",
          operation: "send",
          timestamp: new Date(),
        },
        {
          component: "ProtocolHandler",
          operation: "parse",
          timestamp: new Date(),
        },
      ];

      // Generate errors for different components
      for (const context of contexts) {
        const error = new Error(`Test error for ${context.component}`);
        await errorHandler.handleError(error, context);
      }

      const stats = errorHandler.getErrorStatistics();
      expect(Object.keys(stats)).toContain(MCPErrorType.INTERNAL_SERVER_ERROR);
      expect(stats[MCPErrorType.INTERNAL_SERVER_ERROR].count).toBe(3);
    });

    it("should provide comprehensive health status", () => {
      const healthStatus = errorHandler.getHealthStatus();

      expect(healthStatus.success).toBe(true);
      expect(healthStatus.data).toHaveProperty("circuitBreakers");
      expect(healthStatus.data).toHaveProperty("reconnectionStates");
      expect(healthStatus.data).toHaveProperty("errorStatistics");
      expect(healthStatus.data).toHaveProperty("configuration");
    });

    it("should integrate with ErrorManager metrics", async () => {
      const error = new Error("Test error");
      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "test",
        timestamp: new Date(),
      };

      await errorHandler.handleError(error, context);

      expect(errorManager.incrementCounter).toHaveBeenCalledWith(
        "mcp_errors_total",
        expect.objectContaining({
          errorType: expect.any(String),
          category: expect.any(String),
          severity: expect.any(String),
        }),
      );
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle network connectivity issues", async () => {
      // Simulate network going down
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            if (this.onerror) {
              const errorEvent = new Event("error");
              (errorEvent as any).code = 1006;
              (errorEvent as any).reason = "Connection lost";
              this.onerror(errorEvent);
            }
            if (this.onclose) {
              this.onclose(
                new CloseEvent("close", {
                  code: 1006,
                  reason: "Connection lost",
                }),
              );
            }
          }, 50);
        }
      } as any;

      try {
        const client = createFreshClient();
        await client.connect();
        expect.fail("Should have thrown network error");
      } catch (error) {
        expect(errorManager.handleError).toHaveBeenCalled();
      }

      global.WebSocket = originalWebSocket;
    });

    it("should handle server overload scenarios", async () => {
      const client = createFreshClient();
      await client.connect();

      // Mock server overload responses
      const wsInstance = (client as any).wsClient.ws;
      if (wsInstance && wsInstance.onmessage) {
        const overloadResponse = {
          jsonrpc: "2.0",
          id: "tool-call",
          error: {
            code: -32000,
            message: "Server overloaded",
            data: {
              load: 0.95,
              queueSize: 1000,
            },
          },
        };
        const event = new MessageEvent("message", {
          data: JSON.stringify(overloadResponse),
        });
        wsInstance.onmessage(event);
      }

      expect(errorManager.handleError).toHaveBeenCalled();
    });

    it("should handle graceful degradation", async () => {
      // Enable graceful degradation
      const gracefulHandler = new MCPErrorHandler(errorManager, {
        recovery: {
          gracefulDegradation: true,
        },
      });

      const context: MCPErrorContext = {
        component: "MCPClient",
        operation: "callTool",
        timestamp: new Date(),
      };

      // Simulate multiple non-critical errors
      for (let i = 0; i < 5; i++) {
        const error = new Error(`Non-critical error ${i}`);
        await gracefulHandler.handleError(error, context);
      }

      // System should continue operating with degraded functionality
      const healthStatus = gracefulHandler.getHealthStatus();
      expect(healthStatus.success).toBe(true);
    });
  });
});
