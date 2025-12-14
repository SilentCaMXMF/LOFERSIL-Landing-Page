/**
 * MCP WebSocket Client Tests
 *
 * Comprehensive test suite for the MCP WebSocket client implementation.
 * Tests all major functionality including connection management,
 * reconnection logic, message handling, health monitoring, and security.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MCPWebSocketClient,
  WebSocketError,
  WebSocketErrorType,
} from "../../../../src/scripts/modules/mcp/websocket-client";
import {
  MCPClientConfig,
  MCPConnectionState,
  MCPClientEventType,
} from "../../../../src/scripts/modules/mcp/types";
import { ErrorManager } from "../../../../src/scripts/modules/ErrorManager";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;

  private eventTarget = new EventTarget();

  constructor(url: string) {
    this.url = url;

    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    // Echo ping messages as pong
    try {
      const message = JSON.parse(data);
      if (message.type === "ping") {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(
              new MessageEvent("message", {
                data: JSON.stringify({
                  type: "pong",
                  timestamp: message.timestamp,
                }),
              }),
            );
          }
        }, 5);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(
        new CloseEvent("close", {
          code: code || 1000,
          reason: reason || "",
          wasClean: true,
        }),
      );
    }
  }

  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.eventTarget.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions,
  ): void {
    this.eventTarget.removeEventListener(type, listener, options);
  }

  // Helper method for testing
  simulateError(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
    if (this.onclose) {
      this.onclose(
        new CloseEvent("close", {
          code: 1006,
          reason: "Connection failed",
          wasClean: false,
        }),
      );
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe("MCPWebSocketClient", () => {
  let client: MCPWebSocketClient;
  let errorHandler: ErrorManager;
  let config: MCPClientConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    errorHandler = new ErrorManager({
      showUserMessages: false,
      logToConsole: false,
    });

    config = {
      serverUrl: "ws://localhost:8080",
      connectionTimeout: 1000,
      reconnection: {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
      },
      debug: true,
    };

    client = new MCPWebSocketClient(config, errorHandler);
  });

  afterEach(() => {
    client.destroy();
  });

  describe("Constructor and Initialization", () => {
    it("should create client with valid configuration", () => {
      expect(client).toBeDefined();
      expect(client.getState()).toBe(MCPConnectionState.DISCONNECTED);
      expect(client.getServerUrl()).toBe(config.serverUrl);
    });

    it("should throw error with invalid configuration", () => {
      expect(() => {
        new MCPWebSocketClient({ serverUrl: "" }, errorHandler);
      }).toThrow("Invalid MCP client config");
    });

    it("should load environment settings", () => {
      const clientWithEnv = new MCPWebSocketClient(
        {
          serverUrl: "ws://test.com",
        },
        errorHandler,
      );

      expect(clientWithEnv).toBeDefined();
      clientWithEnv.destroy();
    });
  });

  describe("Connection Management", () => {
    it("should connect successfully", async () => {
      const connectPromise = client.connect();
      expect(client.isConnecting()).toBe(true);

      await connectPromise;
      expect(client.isConnected()).toBe(true);
      expect(client.getState()).toBe(MCPConnectionState.CONNECTED);
    });

    it("should handle connection timeout", async () => {
      const timeoutConfig = {
        ...config,
        connectionTimeout: 1, // 1ms timeout
      };

      const timeoutClient = new MCPWebSocketClient(timeoutConfig, errorHandler);

      await expect(timeoutClient.connect()).rejects.toThrow(WebSocketError);
      expect(timeoutClient.getState()).toBe(MCPConnectionState.ERROR);

      timeoutClient.destroy();
    });

    it("should disconnect cleanly", async () => {
      await client.connect();
      expect(client.isConnected()).toBe(true);

      client.disconnect();
      expect(client.getState()).toBe(MCPConnectionState.DISCONNECTED);
    });

    it("should handle multiple connection attempts", async () => {
      const connectPromise1 = client.connect();
      const connectPromise2 = client.connect();

      await connectPromise1;
      expect(connectPromise2).rejects.toThrow(WebSocketError);
    });
  });

  describe("Reconnection Logic", () => {
    it("should schedule reconnection on unexpected disconnect", async () => {
      await client.connect();

      // Simulate unexpected disconnect
      const ws = (client as any).ws;
      ws.simulateError();

      expect(client.isReconnecting()).toBe(true);
    });

    it("should respect maximum reconnection attempts", async () => {
      const failClient = new MCPWebSocketClient(
        {
          ...config,
          serverUrl: "ws://invalid-host:8080", // Will fail to connect
          reconnection: {
            maxAttempts: 2,
            initialDelay: 10,
            maxDelay: 100,
            backoffMultiplier: 2,
          },
        },
        errorHandler,
      );

      try {
        await failClient.connect();
      } catch {
        // Expected to fail
      }

      // Wait for reconnection attempts
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(failClient.getState()).toBe(MCPConnectionState.ERROR);
      failClient.destroy();
    });

    it("should calculate exponential backoff with jitter", () => {
      const delays: number[] = [];

      // Access private method for testing
      const calculateDelay = (client as any).calculateReconnectionDelay.bind(
        client,
      );

      // Simulate multiple attempts
      for (let i = 1; i <= 5; i++) {
        (client as any).connectionAttempts = i;
        delays.push(calculateDelay());
      }

      // Verify exponential growth
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
      expect(delays[3]).toBeGreaterThan(delays[2]);

      // Verify maximum delay is respected
      expect(Math.max(...delays)).toBeLessThanOrEqual(
        config.reconnection!.maxDelay,
      );
    });
  });

  describe("Message Handling", () => {
    beforeEach(async () => {
      await client.connect();
    });

    it("should send messages successfully", async () => {
      const message = JSON.stringify({ type: "test", data: "hello" });

      await expect(client.send(message)).resolves.not.toThrow();

      const stats = client.getStats();
      expect(stats.messagesSent).toBe(1);
    });

    it("should queue messages when disconnected", async () => {
      client.disconnect();

      const message = JSON.stringify({ type: "test", data: "queued" });
      const sendPromise = client.send(message);

      // Should not reject immediately
      await expect(sendPromise).resolves.not.toThrow();
    });

    it("should reject messages that are too large", async () => {
      const largeMessage = "x".repeat(2 * 1024 * 1024); // 2MB

      await expect(client.send(largeMessage)).rejects.toThrow(WebSocketError);
    });

    it("should handle incoming messages", async () => {
      let receivedMessage: any = null;

      client.addEventListener(
        MCPClientEventType.MESSAGE_RECEIVED,
        (event: any) => {
          receivedMessage = event.data.message;
        },
      );

      const testMessage = JSON.stringify({ jsonrpc: "2.0", method: "test" });
      const ws = (client as any).ws;
      ws.simulateMessage(testMessage);

      expect(receivedMessage).toEqual(JSON.parse(testMessage));

      const stats = client.getStats();
      expect(stats.messagesReceived).toBe(1);
    });

    it("should handle invalid messages gracefully", async () => {
      const ws = (client as any).ws;

      // Invalid JSON
      ws.simulateMessage("invalid json");

      // Valid JSON but invalid structure
      ws.simulateMessage('{"invalid": "structure"}');

      // Should not crash
      expect(client.isConnected()).toBe(true);
    });
  });

  describe("Health Monitoring", () => {
    beforeEach(async () => {
      await client.connect();
    });

    it("should perform ping/pong health checks", async () => {
      // Wait for health check interval
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = client.getStats();
      expect(stats.currentLatency).toBeDefined();
      expect(stats.currentLatency!).toBeGreaterThanOrEqual(0);
    });

    it("should detect missed pings", async () => {
      // Create a client that doesn't respond to pings
      const silentWs = {
        ...MockWebSocket,
        send: vi.fn(),
      };
      global.WebSocket = silentWs as any;

      const silentClient = new MCPWebSocketClient(config, errorHandler);
      await silentClient.connect();

      // Wait for health check failures
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(silentClient.isConnected()).toBe(false);
      silentClient.destroy();
    });
  });

  describe("Security Features", () => {
    it("should validate WebSocket URLs", () => {
      expect(() => {
        new MCPWebSocketClient(
          {
            serverUrl: "invalid-url",
          },
          errorHandler,
        );
      }).toThrow(WebSocketError);
    });

    it("should prevent SSRF attacks", () => {
      expect(() => {
        new MCPWebSocketClient(
          {
            serverUrl: "ws://127.0.0.1:22",
          },
          errorHandler,
        );
      }).toThrow(WebSocketError);
    });

    it("should enforce rate limiting", async () => {
      const rateLimitedClient = new MCPWebSocketClient(
        {
          ...config,
          serverUrl: "ws://test.com",
        },
        errorHandler,
      );

      // Mock rapid connection attempts
      const promises = Array(20)
        .fill(null)
        .map(() => rateLimitedClient.connect().catch(() => null));

      await Promise.all(promises);

      // Should be rate limited
      expect(rateLimitedClient.getState()).toBe(
        MCPConnectionState.DISCONNECTED,
      );
      rateLimitedClient.destroy();
    });
  });

  describe("Event Management", () => {
    it("should emit connection state changes", async () => {
      const events: any[] = [];

      client.addEventListener(
        MCPClientEventType.CONNECTION_STATE_CHANGED,
        (event: any) => {
          events.push(event.data);
        },
      );

      await client.connect();

      expect(events).toHaveLength(2); // CONNECTING -> CONNECTED
      expect(events[0].newState).toBe(MCPConnectionState.CONNECTING);
      expect(events[1].newState).toBe(MCPConnectionState.CONNECTED);
    });

    it("should emit error events", async () => {
      const errors: any[] = [];

      client.addEventListener(
        MCPClientEventType.ERROR_OCCURRED,
        (event: any) => {
          errors.push(event.data);
        },
      );

      try {
        await client.connect();
        const ws = (client as any).ws;
        ws.simulateError();
      } catch {
        // Expected
      }

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].error).toBeDefined();
    });

    it("should remove event listeners", () => {
      const listener = vi.fn();

      client.addEventListener(MCPClientEventType.MESSAGE_RECEIVED, listener);
      client.removeEventListener(MCPClientEventType.MESSAGE_RECEIVED, listener);

      // Should not crash
      expect(() => {
        client.removeEventListener(
          MCPClientEventType.MESSAGE_RECEIVED,
          listener,
        );
      }).not.toThrow();
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should track connection statistics", async () => {
      await client.connect();

      const stats = client.getStats();
      expect(stats.totalAttempts).toBe(1);
      expect(stats.successfulConnections).toBe(1);
      expect(stats.failedConnections).toBe(0);
      expect(stats.lastConnectedAt).toBeDefined();
    });

    it("should provide client status", () => {
      const status = client.getStatus();
      expect(status.state).toBe(MCPConnectionState.DISCONNECTED);
      expect(status.connectionAttempts).toBe(0);
    });

    it("should perform diagnostics", async () => {
      const diagnostics = await client.performDiagnostics();

      expect(diagnostics.success).toBe(true);
      expect(diagnostics.data).toBeDefined();
      if (diagnostics.data) {
        expect(diagnostics.data.urlValid).toBe(true);
        expect(diagnostics.data.websocketSupported).toBe(true);
      }
    });
  });

  describe("Configuration Management", () => {
    it("should update configuration", () => {
      const newConfig = {
        connectionTimeout: 5000,
        debug: false,
      };

      client.updateConfig(newConfig);

      const updatedConfig = client.getConfig();
      expect(updatedConfig.connectionTimeout).toBe(5000);
      expect(updatedConfig.debug).toBe(false);
    });

    it("should reject invalid configuration updates", () => {
      expect(() => {
        client.updateConfig({ serverUrl: "" });
      }).toThrow("Invalid MCP client config");
    });
  });

  describe("Resource Management", () => {
    it("should clean up resources on destroy", () => {
      client.destroy();

      expect(client.getState()).toBe(MCPConnectionState.DISCONNECTED);
      expect(client.isConnected()).toBe(false);
    });

    it("should handle multiple destroy calls", () => {
      client.destroy();
      expect(() => client.destroy()).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should create WebSocketError with correct type", () => {
      const error = new WebSocketError(
        WebSocketErrorType.CONNECTION_FAILED,
        "Test error",
        { detail: "test" },
      );

      expect(error.type).toBe(WebSocketErrorType.CONNECTION_FAILED);
      expect(error.message).toBe("Test error");
      expect(error.details).toEqual({ detail: "test" });
      expect(error.name).toBe("WebSocketError");
    });

    it("should handle network errors gracefully", async () => {
      await client.connect();

      const ws = (client as any).ws;
      ws.readyState = MockWebSocket.CLOSED;

      await expect(client.send("test")).rejects.toThrow(WebSocketError);
    });
  });
});
