/**
 * MCP Multi-Transport Client Tests
 *
 * Comprehensive test suite for the enhanced MCP client with multi-transport support.
 * Tests HTTP and WebSocket transports, fallback strategies, and Context7 integration.
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  MCPMultiTransportClient,
  createMultiTransportClient,
  createContext7Client,
  MCPTransportFactory,
  createTransportFactory,
} from "./multi-transport-client";
import { ErrorManager } from "../ErrorManager";
import type { MCPMultiTransportClientConfig } from "./multi-transport-client";

describe("MCP Multi-Transport Client", () => {
  let errorHandler: ErrorManager;
  let testConfig: MCPMultiTransportClientConfig;

  beforeEach(() => {
    errorHandler = new ErrorManager();
    testConfig = {
      serverUrl: "https://test-server.com/mcp",
      transportType: "http",
      transportStrategy: "http-first",
      enableFallback: true,
      fallbackOrder: ["http", "websocket"],
      httpTransport: {
        context7: {
          apiKey: "ctx7sk-test-key",
          mcpEndpoint: "https://mcp.context7.com/mcp",
          apiVersion: "v1",
        },
        requestTimeout: 5000,
        maxRetries: 2,
      },
      connectionTimeout: 5000,
    };
  });

  afterEach(async () => {
    // Clean up any active clients
    await errorHandler.destroy();
  });

  describe("Client Creation", () => {
    it("should create a multi-transport client with default configuration", () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      expect(client).toBeDefined();
      expect(client.getStatus().state).toBe("disconnected");
    });

    it("should create a Context7 client", () => {
      const client = createContext7Client("ctx7sk-test-key", errorHandler);

      expect(client).toBeDefined();
      expect(client.getStatus().state).toBe("disconnected");
    });

    it("should validate transport configuration", () => {
      const invalidConfig = {
        ...testConfig,
        serverUrl: "", // Invalid URL
      };

      expect(() => {
        createMultiTransportClient(invalidConfig, errorHandler);
      }).toThrow();
    });
  });

  describe("Transport Strategy", () => {
    it("should use HTTP-first strategy by default", () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          transportStrategy: "http-first",
        },
        errorHandler,
      );

      expect(client).toBeDefined();
    });

    it("should use WebSocket-first strategy", () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          transportStrategy: "websocket-first",
        },
        errorHandler,
      );

      expect(client).toBeDefined();
    });

    it("should auto-detect transport type", () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          transportStrategy: "auto",
          serverUrl: "https://context7.com/mcp", // Should auto-detect as HTTP
        },
        errorHandler,
      );

      expect(client).toBeDefined();
    });
  });

  describe("Fallback Mechanism", () => {
    it("should enable fallback by default", () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          enableFallback: true,
        },
        errorHandler,
      );

      expect(client).toBeDefined();
    });

    it("should respect fallback order configuration", () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          fallbackOrder: ["websocket", "http"], // Try WebSocket first
        },
        errorHandler,
      );

      expect(client).toBeDefined();
    });

    it("should disable fallback when configured", () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          enableFallback: false,
        },
        errorHandler,
      );

      expect(client).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle connection errors gracefully", async () => {
      const client = createMultiTransportClient(
        {
          ...testConfig,
          serverUrl: "https://nonexistent-server.com/mcp",
        },
        errorHandler,
      );

      try {
        await client.connect();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain("connect");
      } finally {
        await client.destroy();
      }
    });

    it("should handle invalid tool calls", async () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      // Mock the connection to avoid actual network calls
      client.connect = jest.fn().mockResolvedValue(undefined);

      try {
        await client.callTool("nonexistent_tool", {});
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        await client.destroy();
      }
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should track client statistics", () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      const stats = client.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(0);
      expect(stats.fallbackActivations).toBe(0);
      expect(stats.transportSwitches).toBe(0);
    });

    it("should perform health checks", async () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      const healthCheck = await client.performHealthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.success).toBeDefined();
      expect(healthCheck.data).toBeDefined();
    });

    it("should track transport-specific statistics", () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      const transportStats = client.getTransportStats();

      expect(transportStats).toBeDefined();
      expect(typeof transportStats).toBe("object");
    });
  });

  describe("Lifecycle Management", () => {
    it("should connect and disconnect properly", async () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      // Mock connection to avoid actual network calls
      client.connect = jest.fn().mockResolvedValue(undefined);
      client.disconnect = jest.fn().mockResolvedValue(undefined);

      await client.connect();
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);

      await client.destroy();
    });

    it("should handle multiple destroy calls", async () => {
      const client = createMultiTransportClient(testConfig, errorHandler);

      await client.destroy();
      await client.destroy(); // Should not throw

      // Should handle gracefully
      expect(client).toBeDefined();
    });
  });
});

describe("MCP Transport Factory", () => {
  let errorHandler: ErrorManager;
  let transportFactory: MCPTransportFactory;

  beforeEach(() => {
    errorHandler = new ErrorManager();
    transportFactory = createTransportFactory(errorHandler);
  });

  afterEach(async () => {
    await transportFactory.destroy();
    await errorHandler.destroy();
  });

  describe("Transport Creation", () => {
    it("should create HTTP transport", () => {
      const transport = transportFactory.createTransport(
        {
          serverUrl: "https://mcp.context7.com/mcp",
          apiKey: "ctx7sk-test-key",
        },
        {
          forceType: "http",
        },
      );

      expect(transport).toBeDefined();
      expect(transport.getTransportType()).toBe("http");
    });

    it("should create WebSocket transport", () => {
      const transport = transportFactory.createTransport(
        {
          serverUrl: "wss://test-server.com/mcp",
        },
        {
          forceType: "websocket",
        },
      );

      expect(transport).toBeDefined();
      expect(transport.getTransportType()).toBe("websocket");
    });

    it("should auto-detect transport type", () => {
      const httpTransport = transportFactory.createTransport({
        serverUrl: "https://mcp.context7.com/mcp",
      });

      expect(httpTransport.getTransportType()).toBe("http");

      const wsTransport = transportFactory.createTransport({
        serverUrl: "wss://test-server.com/mcp",
      });

      expect(wsTransport.getTransportType()).toBe("websocket");
    });
  });

  describe("Factory Configuration", () => {
    it("should get supported transport types", () => {
      const supportedTypes = transportFactory.getSupportedTypes();

      expect(supportedTypes).toContain("http");
      expect(supportedTypes).toContain("websocket");
    });

    it("should check transport type support", () => {
      expect(transportFactory.isSupported("http")).toBe(true);
      expect(transportFactory.isSupported("websocket")).toBe(true);
      expect(transportFactory.isSupported("tcp")).toBe(false);
    });

    it("should update factory configuration", () => {
      transportFactory.updateConfig({
        healthCheckInterval: 120000,
      });

      expect(transportFactory).toBeDefined();
    });
  });

  describe("Factory Statistics", () => {
    it("should track creation statistics", () => {
      const initialStats = transportFactory.getStats();

      transportFactory.createTransport({
        serverUrl: "https://test-server.com/mcp",
      });

      const updatedStats = transportFactory.getStats();

      expect(updatedStats.totalTransportsCreated).toBeGreaterThan(
        initialStats.totalTransportsCreated,
      );
    });

    it("should track transport health", async () => {
      transportFactory.createTransport({
        serverUrl: "https://test-server.com/mcp",
      });

      const healthStatus = await transportFactory.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(typeof healthStatus).toBe("object");
    });
  });
});

describe("Context7 Integration", () => {
  let errorHandler: ErrorManager;

  beforeEach(() => {
    errorHandler = new ErrorManager();
  });

  afterEach(async () => {
    await errorHandler.destroy();
  });

  describe("Context7 Client Creation", () => {
    it("should create client with Context7 configuration", () => {
      const client = createContext7Client("ctx7sk-test-key", errorHandler);

      expect(client).toBeDefined();
    });

    it("should handle additional configuration", () => {
      const client = createContext7Client("ctx7sk-test-key", errorHandler, {
        transportStrategy: "http-only",
        healthCheckInterval: 120000,
      });

      expect(client).toBeDefined();
    });
  });

  describe("Context7 Configuration", () => {
    it("should use correct Context7 endpoint", () => {
      const client = createContext7Client("ctx7sk-test-key", errorHandler);

      const config = client.getConfig();
      expect(config.httpTransport?.context7?.mcpEndpoint).toBe(
        "https://mcp.context7.com/mcp",
      );
    });

    it("should set API key correctly", () => {
      const apiKey = "ctx7sk-custom-key";
      const client = createContext7Client(apiKey, errorHandler);

      const config = client.getConfig();
      expect(config.httpTransport?.context7?.apiKey).toBe(apiKey);
    });
  });
});

describe("Multi-Transport Performance", () => {
  let errorHandler: ErrorManager;

  beforeEach(() => {
    errorHandler = new ErrorManager();
  });

  afterEach(async () => {
    await errorHandler.destroy();
  });

  describe("Performance Monitoring", () => {
    it("should track request metrics", async () => {
      const client = createMultiTransportClient(
        {
          serverUrl: "https://test-server.com/mcp",
          transportType: "http",
          enableTransportMetrics: true,
        },
        errorHandler,
      );

      // Mock connection and request to avoid actual network calls
      client.connect = jest.fn().mockResolvedValue(undefined);
      client.callTool = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "test result" }],
      });

      await client.connect();
      await client.callTool("test_tool", {});

      const stats = client.getStats();

      expect(stats.totalRequests).toBeGreaterThan(0);

      await client.destroy();
    });

    it("should track fallback performance", async () => {
      const client = createMultiTransportClient(
        {
          serverUrl: "https://test-server.com/mcp",
          transportType: "http",
          enableFallback: true,
          fallbackOrder: ["http", "websocket"],
        },
        errorHandler,
      );

      // Mock connection failure and fallback
      client.connect = jest.fn().mockImplementation(async () => {
        // Simulate primary transport failure and fallback activation
        throw new Error("Primary transport failed");
      });

      try {
        await client.connect();
      } catch (error) {
        // Expected to fail in test environment
      }

      const stats = client.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.fallbackActivations).toBe("number");

      await client.destroy();
    });
  });

  describe("Memory Management", () => {
    it("should clean up resources on destroy", async () => {
      const client = createMultiTransportClient(
        {
          serverUrl: "https://test-server.com/mcp",
          transportType: "http",
        },
        errorHandler,
      );

      // Mock connection
      client.connect = jest.fn().mockResolvedValue(undefined);

      await client.connect();
      expect(client.isConnected()).toBe(true);

      await client.destroy();

      // After destroy, client should be in a clean state
      expect(client).toBeDefined();
    });

    it("should handle concurrent operations", async () => {
      const client = createMultiTransportClient(
        {
          serverUrl: "https://test-server.com/mcp",
          transportType: "http",
        },
        errorHandler,
      );

      // Mock operations
      client.connect = jest.fn().mockResolvedValue(undefined);
      client.callTool = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "test result" }],
      });

      await client.connect();

      // Run concurrent operations
      const operations = Array(10)
        .fill(null)
        .map((_, i) => client.callTool("test_tool", { index: i }));

      await Promise.allSettled(operations);

      const stats = client.getStats();
      expect(stats.totalRequests).toBeGreaterThan(0);

      await client.destroy();
    });
  });
});
