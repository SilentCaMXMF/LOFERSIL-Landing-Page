/**
 * MCP Client Integration Test
 *
 * Simple integration test to verify MCP client functionality
 * works correctly with all components integrated.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MCPClient } from "../../src/scripts/modules/mcp/client";
import { ErrorManager } from "../../src/scripts/modules/ErrorManager";
import {
  MCPConnectionState,
  MCPClientEventType,
} from "../../src/scripts/modules/mcp/types";

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
}

global.WebSocket = MockWebSocket as any;

describe("MCPClient Integration", () => {
  let client: MCPClient;
  let errorHandler: ErrorManager;

  beforeEach(() => {
    errorHandler = new ErrorManager();
    client = new MCPClient(
      {
        serverUrl: "ws://localhost:3000",
        clientInfo: {
          name: "Integration Test Client",
          version: "1.0.0",
        },
      },
      errorHandler,
    );
  });

  afterEach(async () => {
    await client.destroy();
  });

  it("should create client successfully", () => {
    expect(client).toBeDefined();
    expect(client.getConnectionState()).toBe(MCPConnectionState.DISCONNECTED);
  });

  it("should connect and initialize protocol", async () => {
    const mockWs = (client as any).wsClient.ws;
    mockWs.mockOpen();

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

    await client.connect();
    await client.initialize();

    expect(client.isConnected()).toBe(true);
    expect(client.getConnectionState()).toBe(MCPConnectionState.CONNECTED);
  });

  it("should handle tool operations", async () => {
    const mockWs = (client as any).wsClient.ws;
    mockWs.mockOpen();

    // Mock initialize response
    const initResponse = {
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
      },
    };

    // Mock tools list response
    const toolsResponse = {
      jsonrpc: "2.0",
      id: 2,
      result: {
        tools: [
          {
            name: "test_tool",
            description: "A test tool",
            inputSchema: {
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        ],
      },
    };

    // Mock tool call response
    const toolCallResponse = {
      jsonrpc: "2.0",
      id: 3,
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

    mockWs.mockMessage(JSON.stringify(initResponse));
    mockWs.mockMessage(JSON.stringify(toolsResponse));
    mockWs.mockMessage(JSON.stringify(toolCallResponse));

    await client.connect();
    await client.initialize();

    const tools = await client.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("test_tool");

    const result = await client.callTool("test_tool", { message: "hello" });
    expect(result.content).toHaveLength(1);
    expect((result.content[0] as any).text).toBe("Tool executed successfully");
  });

  it("should handle resource operations", async () => {
    const mockWs = (client as any).wsClient.ws;
    mockWs.mockOpen();

    // Mock initialize response
    const initResponse = {
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { resources: {} },
      },
    };

    // Mock resources list response
    const resourcesResponse = {
      jsonrpc: "2.0",
      id: 2,
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

    // Mock resource read response
    const resourceReadResponse = {
      jsonrpc: "2.0",
      id: 3,
      result: {
        uri: "test://resource",
        content: "Resource content here",
        mimeType: "text/plain",
      },
    };

    mockWs.mockMessage(JSON.stringify(initResponse));
    mockWs.mockMessage(JSON.stringify(resourcesResponse));
    mockWs.mockMessage(JSON.stringify(resourceReadResponse));

    await client.connect();
    await client.initialize();

    const resources = await client.listResources();
    expect(resources).toHaveLength(1);
    expect(resources[0].uri).toBe("test://resource");

    const content = await client.readResource("test://resource");
    expect(content.content).toBe("Resource content here");
    expect(content.mimeType).toBe("text/plain");
  });

  it("should emit events correctly", () => {
    const mockListener = vi.fn();

    client.addEventListener(
      MCPClientEventType.CONNECTION_STATE_CHANGED,
      mockListener,
    );

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

  it("should provide status and metrics", () => {
    const status = client.getStatus();
    expect(status).toHaveProperty("state");
    expect(status).toHaveProperty("connectionAttempts");
    expect(status).toHaveProperty("activeRequests");

    const metrics = client.getMetrics();
    expect(metrics).toHaveProperty("totalRequests");
    expect(metrics).toHaveProperty("successfulRequests");
    expect(metrics).toHaveProperty("failedRequests");
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
});
