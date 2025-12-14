/**
 * MCP Client Unit Tests
 *
 * Comprehensive test suite for the MCP client implementation.
 * Tests all core functionality including connection management,
 * protocol methods, event handling, and error recovery.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MCPClient } from "../../../../src/scripts/modules/mcp/client";
import { ErrorManager } from "../../../../src/scripts/modules/ErrorManager";
import {
  MCPConnectionState,
  MCPClientEventType,
  type MCPClientConfig,
} from "../../../../src/scripts/modules/mcp/types";

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

  constructor(public url: string) {}

  send(data: string): void {
    // Mock send implementation
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(
        new CloseEvent("close", { code: code || 1000, reason: reason || "" }),
      );
    }
  }

  // Helper method for testing
  mockOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  mockMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  mockError(error: Error): void {
    if (this.onerror) {
      this.onerror(new ErrorEvent("error", { error }));
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe("MCPClient", () => {
  let client: MCPClient;
  let errorHandler: ErrorManager;
  let config: MCPClientConfig;

  beforeEach(() => {
    errorHandler = new ErrorManager();
    config = {
      serverUrl: "ws://localhost:3000",
      clientInfo: {
        name: "Test Client",
        version: "1.0.0",
      },
      connectionTimeout: 5000,
      reconnection: {
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
      },
    };

    client = new MCPClient(config, errorHandler);
  });

  afterEach(async () => {
    await client.destroy();
  });

  describe("Constructor and Initialization", () => {
    it("should create client with valid configuration", () => {
      expect(client).toBeDefined();
      expect(client.getConnectionState()).toBe(MCPConnectionState.DISCONNECTED);
    });

    it("should throw error with invalid configuration", () => {
      expect(() => {
        new MCPClient({} as MCPClientConfig, errorHandler);
      }).toThrow("Invalid MCP client config");
    });

    it("should merge configuration with defaults", () => {
      const clientWithDefaults = new MCPClient(
        {
          serverUrl: "ws://localhost:3000",
        },
        errorHandler,
      );

      const status = clientWithDefaults.getStatus();
      expect(status.state).toBe(MCPConnectionState.DISCONNECTED);
    });
  });

  describe("Connection Management", () => {
    it("should connect successfully", async () => {
      const mockWs = (client as any).wsClient.ws;
      mockWs.mockOpen();

      await client.connect();

      expect(client.isConnected()).toBe(true);
      expect(client.getConnectionState()).toBe(MCPConnectionState.CONNECTED);
    });

    it("should handle connection failure", async () => {
      const mockWs = (client as any).wsClient.ws;
      mockWs.mockError(new Error("Connection failed"));

      await expect(client.connect()).rejects.toThrow();
    });

    it("should disconnect gracefully", async () => {
      const mockWs = (client as any).wsClient.ws;
      mockWs.mockOpen();

      await client.connect();
      await client.disconnect();

      expect(client.isConnected()).toBe(false);
      expect(client.getConnectionState()).toBe(MCPConnectionState.DISCONNECTED);
    });

    it("should not connect if already connected", async () => {
      const mockWs = (client as any).wsClient.ws;
      mockWs.mockOpen();

      await client.connect();
      await client.connect(); // Should not throw

      expect(client.isConnected()).toBe(true);
    });

    it("should throw error when connecting while already connecting", async () => {
      const connectPromise = client.connect();

      await expect(client.connect()).rejects.toThrow(
        "Connection already in progress",
      );

      // Clean up
      try {
        await connectPromise;
      } catch {}
    });
  });

  describe("Protocol Methods", () => {
    beforeEach(async () => {
      const mockWs = (client as any).wsClient.ws;
      mockWs.mockOpen();
      await client.connect();
    });

    describe("initialize", () => {
      it("should initialize protocol successfully", async () => {
        const mockWs = (client as any).wsClient.ws;

        // Mock initialize response
        const initResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
            },
          },
        };

        mockWs.mockMessage(JSON.stringify(initResponse));

        const capabilities = await client.initialize();

        expect(capabilities).toBeDefined();
        expect((capabilities as any).protocolVersion).toBe("2024-11-05");
      });

      it("should handle initialization error", async () => {
        const mockWs = (client as any).wsClient.ws;

        // Mock error response
        const errorResponse = {
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32000,
            message: "Initialization failed",
          },
        };

        mockWs.mockMessage(JSON.stringify(errorResponse));

        await expect(client.initialize()).rejects.toThrow(
          "Initialization failed",
        );
      });
    });

    describe("listTools", () => {
      it("should list available tools", async () => {
        const mockWs = (client as any).wsClient.ws;

        const toolsResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            tools: [
              {
                name: "test_tool",
                description: "A test tool",
                inputSchema: {
                  type: "object",
                  properties: {
                    param: { type: "string" },
                  },
                },
              },
            ],
          },
        };

        mockWs.mockMessage(JSON.stringify(toolsResponse));

        const tools = await client.listTools();

        expect(tools).toHaveLength(1);
        expect(tools[0].name).toBe("test_tool");
        expect(client.hasTool("test_tool")).toBe(true);
      });

      it("should handle empty tools list", async () => {
        const mockWs = (client as any).wsClient.ws;

        const toolsResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            tools: [],
          },
        };

        mockWs.mockMessage(JSON.stringify(toolsResponse));

        const tools = await client.listTools();

        expect(tools).toHaveLength(0);
        expect(client.getAvailableTools()).toHaveLength(0);
      });
    });

    describe("callTool", () => {
      it("should call tool successfully", async () => {
        const mockWs = (client as any).wsClient.ws;

        const toolResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [
              {
                type: "text",
                text: "Tool executed successfully",
              },
            ],
            isError: false,
          },
        };

        mockWs.mockMessage(JSON.stringify(toolResponse));

        const result = await client.callTool("test_tool", { param: "value" });

        expect(result.content).toHaveLength(1);
        expect((result.content[0] as any).text).toBe(
          "Tool executed successfully",
        );
        expect(result.isError).toBe(false);
      });

      it("should handle tool execution error", async () => {
        const mockWs = (client as any).wsClient.ws;

        const errorResponse = {
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32001,
            message: "Tool execution failed",
          },
        };

        mockWs.mockMessage(JSON.stringify(errorResponse));

        await expect(client.callTool("test_tool", {})).rejects.toThrow(
          "Tool execution failed",
        );
      });

      it("should cache tool results when caching is enabled", async () => {
        const clientWithCaching = new MCPClient(
          {
            ...config,
            tools: {
              enableCaching: true,
              cacheTTL: 1000,
            },
          },
          errorHandler,
        );

        const mockWs = (clientWithCaching as any).wsClient.ws;
        mockWs.mockOpen();
        await clientWithCaching.connect();

        const toolResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [{ type: "text", text: "Cached result" }],
            isError: false,
          },
        };

        mockWs.mockMessage(JSON.stringify(toolResponse));

        // First call
        const result1 = await clientWithCaching.callTool("test_tool", {
          param: "value",
        });

        // Second call should use cache
        const result2 = await clientWithCaching.callTool("test_tool", {
          param: "value",
        });

        expect((result1.content[0] as any).text).toBe("Cached result");
        expect((result2.content[0] as any).text).toBe("Cached result");

        await clientWithCaching.destroy();
      });
    });

    describe("listResources", () => {
      it("should list available resources", async () => {
        const mockWs = (client as any).wsClient.ws;

        const resourcesResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            resources: [
              {
                uri: "test://resource",
                name: "Test Resource",
                mimeType: "text/plain",
              },
            ],
          },
        };

        mockWs.mockMessage(JSON.stringify(resourcesResponse));

        const resources = await client.listResources();

        expect(resources).toHaveLength(1);
        expect(resources[0].uri).toBe("test://resource");
        expect(client.hasResource("test://resource")).toBe(true);
      });
    });

    describe("readResource", () => {
      it("should read resource successfully", async () => {
        const mockWs = (client as any).wsClient.ws;

        const resourceResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            uri: "test://resource",
            content: "Resource content",
            mimeType: "text/plain",
          },
        };

        mockWs.mockMessage(JSON.stringify(resourceResponse));

        const content = await client.readResource("test://resource");

        expect(content.uri).toBe("test://resource");
        expect(content.content).toBe("Resource content");
        expect(content.mimeType).toBe("text/plain");
      });

      it("should validate resource size limits", async () => {
        const clientWithLimit = new MCPClient(
          {
            ...config,
            resources: {
              maxSize: 10, // Very small limit
            },
          },
          errorHandler,
        );

        const mockWs = (clientWithLimit as any).wsClient.ws;
        mockWs.mockOpen();
        await clientWithLimit.connect();

        const resourceResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            uri: "test://resource",
            content: "This content is too large for the limit",
            mimeType: "text/plain",
          },
        };

        mockWs.mockMessage(JSON.stringify(resourceResponse));

        await expect(
          clientWithLimit.readResource("test://resource"),
        ).rejects.toThrow("exceeds maximum");

        await clientWithLimit.destroy();
      });
    });

    describe("listPrompts", () => {
      it("should list available prompts", async () => {
        const mockWs = (client as any).wsClient.ws;

        const promptsResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            prompts: [
              {
                name: "test_prompt",
                description: "A test prompt",
              },
            ],
          },
        };

        mockWs.mockMessage(JSON.stringify(promptsResponse));

        const prompts = await client.listPrompts();

        expect(prompts).toHaveLength(1);
        expect(prompts[0].name).toBe("test_prompt");
        expect(client.hasPrompt("test_prompt")).toBe(true);
      });
    });

    describe("getPrompt", () => {
      it("should get prompt successfully", async () => {
        const mockWs = (client as any).wsClient.ws;

        const promptResponse = {
          jsonrpc: "2.0",
          id: 1,
          result: {
            description: "Generated prompt",
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: "Hello, world!",
                },
              },
            ],
          },
        };

        mockWs.mockMessage(JSON.stringify(promptResponse));

        const result = await client.getPrompt("test_prompt", { arg: "value" });

        expect(result.description).toBe("Generated prompt");
        expect(result.messages).toHaveLength(1);
        expect((result.messages[0].content as any).text).toBe("Hello, world!");
      });
    });
  });

  describe("Event System", () => {
    it("should emit and receive events", () => {
      const mockListener = vi.fn();

      client.addEventListener(
        MCPClientEventType.CONNECTION_STATE_CHANGED,
        mockListener,
      );

      // Simulate event
      (client as any).emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        oldState: MCPConnectionState.DISCONNECTED,
        newState: MCPConnectionState.CONNECTED,
      });

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MCPClientEventType.CONNECTION_STATE_CHANGED,
          data: {
            oldState: MCPConnectionState.DISCONNECTED,
            newState: MCPConnectionState.CONNECTED,
          },
        }),
      );
    });

    it("should remove event listeners", () => {
      const mockListener = vi.fn();

      client.addEventListener(MCPClientEventType.ERROR_OCCURRED, mockListener);
      client.removeEventListener(
        MCPClientEventType.ERROR_OCCURRED,
        mockListener,
      );

      (client as any).emitEvent(MCPClientEventType.ERROR_OCCURRED, {
        error: new Error("Test error"),
      });

      expect(mockListener).not.toHaveBeenCalled();
    });

    it("should handle event listener errors gracefully", () => {
      const errorHandlerSpy = vi.spyOn(errorHandler, "handleError");
      const faultyListener = vi.fn(() => {
        throw new Error("Listener error");
      });

      client.addEventListener(
        MCPClientEventType.MESSAGE_RECEIVED,
        faultyListener,
      );

      (client as any).emitEvent(MCPClientEventType.MESSAGE_RECEIVED, {
        message: "test",
      });

      expect(errorHandlerSpy).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle requests when not connected", async () => {
      await expect(client.listTools()).rejects.toThrow(
        "Not connected to MCP server",
      );
    });

    it("should handle destroyed client operations", async () => {
      await client.destroy();

      await expect(client.connect()).rejects.toThrow(
        "Client has been destroyed",
      );
    });

    it("should integrate with ErrorManager", async () => {
      const handleErrorSpy = vi.spyOn(errorHandler, "handleError");

      const mockWs = (client as any).wsClient.ws;
      mockWs.mockError(new Error("WebSocket error"));

      // Wait for error handling
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("Utilities and Helpers", () => {
    it("should get client status", () => {
      const status = client.getStatus();

      expect(status).toHaveProperty("state");
      expect(status).toHaveProperty("connectionAttempts");
      expect(status).toHaveProperty("activeRequests");
      expect(status.state).toBe(MCPConnectionState.DISCONNECTED);
    });

    it("should get performance metrics", () => {
      const metrics = client.getMetrics();

      expect(metrics).toHaveProperty("totalRequests");
      expect(metrics).toHaveProperty("successfulRequests");
      expect(metrics).toHaveProperty("failedRequests");
      expect(metrics).toHaveProperty("averageResponseTime");
    });

    it("should reset metrics", () => {
      client.resetMetrics();
      const metrics = client.getMetrics();

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });

    it("should perform health check", async () => {
      const health = await client.performHealthCheck();

      expect(health).toHaveProperty("success");
      expect(health).toHaveProperty("data");
      expect(health.data).toHaveProperty("timestamp");
      expect(health.data).toHaveProperty("connectionState");
    });

    it("should perform diagnostics", async () => {
      const diagnostics = await client.performDiagnostics();

      expect(diagnostics).toHaveProperty("success");
      expect(diagnostics).toHaveProperty("data");
      expect(diagnostics.data).toHaveProperty("config");
      expect(diagnostics.data).toHaveProperty("state");
    });

    it("should update configuration", () => {
      const newConfig = {
        connectionTimeout: 10000,
        debug: true,
      };

      client.updateConfig(newConfig);
      const updatedConfig = client.getConfig();

      expect(updatedConfig.connectionTimeout).toBe(10000);
      expect(updatedConfig.debug).toBe(true);
    });

    it("should validate configuration updates", () => {
      expect(() => {
        client.updateConfig({ serverUrl: "" });
      }).toThrow("Invalid MCP client config");
    });
  });

  describe("Caching", () => {
    it("should clear caches", () => {
      client.clearCaches();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("Resource Management", () => {
    it("should destroy client and clean up resources", async () => {
      const mockWs = (client as any).wsClient.ws;
      mockWs.mockOpen();
      await client.connect();

      await client.destroy();

      expect(client.isConnected()).toBe(false);
    });
  });
});
