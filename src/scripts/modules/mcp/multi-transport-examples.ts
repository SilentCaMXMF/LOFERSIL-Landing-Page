/**
 * MCP Multi-Transport Client Usage Examples
 *
 * This file demonstrates how to use the enhanced MCP client with multi-transport support.
 * Shows examples for both HTTP and WebSocket transports with Context7 integration.
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  MCPMultiTransportClient,
  createMultiTransportClient,
  createContext7Client,
  type MCPMultiTransportClientConfig,
} from "./multi-transport-client";
import { createTransportFactory } from "./transport-factory";
import { ErrorManager } from "../ErrorManager";
import { MCPClientEventType } from "./types";

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Create a Context7 HTTP client (recommended for Context7)
 */
export async function createContext7ClientExample() {
  // Initialize ErrorManager
  const errorHandler = new ErrorManager();

  // Create Context7 client with API key
  const context7ApiKey = "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44";
  const mcpClient = createContext7Client(context7ApiKey, errorHandler);

  try {
    // Connect to Context7
    await mcpClient.connect();
    console.log("Connected to Context7 MCP server");

    // List available tools
    const tools = await mcpClient.listTools();
    console.log(
      "Available tools:",
      tools.map((t) => t.name),
    );

    // Call a tool
    const result = await mcpClient.callTool("example_tool", {
      parameter1: "value1",
      parameter2: "value2",
    });
    console.log("Tool result:", result);

    // Get client statistics
    const stats = mcpClient.getStats();
    console.log("Client stats:", stats);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    await mcpClient.destroy();
  }
}

/**
 * Example 2: Create a multi-transport client with custom configuration
 */
export async function createCustomMultiTransportClientExample() {
  const errorHandler = new ErrorManager();

  // Custom configuration with HTTP-first strategy
  const config: MCPMultiTransportClientConfig = {
    serverUrl: "wss://example.com/mcp", // WebSocket server
    transportType: "websocket",
    transportStrategy: "http-first", // Try HTTP first, then fallback to WebSocket
    enableFallback: true,
    fallbackOrder: ["http", "websocket"],

    // Context7 HTTP transport configuration
    httpTransport: {
      context7: {
        apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
        mcpEndpoint: "https://mcp.context7.com/mcp",
        apiVersion: "v1",
      },
      requestTimeout: 30000,
      maxRetries: 3,
      enableCompression: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyApp-MCP-Client/1.0.0",
      },
    },

    // Connection settings
    connectionTimeout: 30000,

    // Retry configuration
    retry: {
      maxAttemptsPerTransport: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: true,
    },

    // Health checking
    healthCheckInterval: 60000,
    enableTransportMetrics: true,
  };

  const mcpClient = createMultiTransportClient(config, errorHandler);

  try {
    await mcpClient.connect();
    console.log("Connected with multi-transport client");

    // Demonstrate transport switching
    const status = mcpClient.getStatus();
    console.log("Active transport:", status);

    // Use MCP features
    const resources = await mcpClient.listResources();
    console.log("Available resources:", resources.length);
  } catch (error) {
    console.error("Connection error:", error);
  } finally {
    await mcpClient.destroy();
  }
}

/**
 * Example 3: Using transport factory directly
 */
export async function transportFactoryExample() {
  const errorHandler = new ErrorManager();

  // Create transport factory
  const transportFactory = createTransportFactory(errorHandler);

  try {
    // Create HTTP transport for Context7
    const httpTransport = transportFactory.createTransport(
      {
        serverUrl: "https://mcp.context7.com/mcp",
        apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
      },
      {
        forceType: "http",
        enableFallback: false,
      },
    );

    // Create WebSocket transport
    const wsTransport = transportFactory.createTransport(
      {
        serverUrl: "wss://example.com/mcp",
      },
      {
        forceType: "websocket",
        enableFallback: false,
      },
    );

    // Use transports
    await httpTransport.connect();
    console.log("HTTP transport connected");

    // Get factory statistics
    const factoryStats = transportFactory.getStats();
    console.log("Factory statistics:", factoryStats);

    // Get health status
    const healthStatus = await transportFactory.getHealthStatus();
    console.log("Transport health:", healthStatus);
  } catch (error) {
    console.error("Transport factory error:", error);
  } finally {
    await transportFactory.destroy();
  }
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

/**
 * Example 4: Implementing custom fallback logic
 */
export async function customFallbackExample() {
  const errorHandler = new ErrorManager();

  // Configuration with custom fallback strategy
  const config: MCPMultiTransportClientConfig = {
    serverUrl: "https://primary-server.com/mcp",
    transportType: "http", // Required property
    transportStrategy: "auto",
    enableFallback: true,
    fallbackOrder: ["websocket", "http"], // Try WebSocket first, then HTTP

    // Custom Context7 configuration for HTTP fallback
    httpTransport: {
      context7: {
        apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
        mcpEndpoint: "https://mcp.context7.com/mcp",
        apiVersion: "v1",
      },
      requestTimeout: 15000, // Faster timeout for fallback
      maxRetries: 2, // Fewer retries for fallback
    },

    // WebSocket configuration
    connectionTimeout: 10000, // Faster WebSocket connection

    // Custom retry logic
    retry: {
      maxAttemptsPerTransport: 2,
      baseDelay: 500,
      maxDelay: 10000,
      jitter: true,
    },
  };

  const mcpClient = createMultiTransportClient(config, errorHandler);

  // Set up event listeners for fallback monitoring
  mcpClient.addEventListener(
    MCPClientEventType.CONNECTION_STATE_CHANGED,
    (event) => {
      console.log("Connection state changed:", event.data);
    },
  );

  mcpClient.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
    console.log("Error occurred:", event.data);
  });

  try {
    await mcpClient.connect();

    // Monitor transport switches
    const stats = mcpClient.getStats();
    if (stats.fallbackActivations > 0) {
      console.log(`Fallback activated ${stats.fallbackActivations} times`);
    }

    // Use the client
    const prompts = await mcpClient.listPrompts();
    console.log(
      "Available prompts:",
      prompts.map((p) => p.name),
    );
  } catch (error) {
    console.error("Custom fallback failed:", error);
  } finally {
    await mcpClient.destroy();
  }
}

/**
 * Example 5: Performance monitoring and metrics
 */
export async function performanceMonitoringExample() {
  const errorHandler = new ErrorManager();

  const mcpClient = createContext7Client(
    "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
    errorHandler,
    {
      enableTransportMetrics: true,
      healthCheckInterval: 30000, // Check health every 30 seconds
    },
  );

  try {
    await mcpClient.connect();

    // Perform multiple operations to generate metrics
    const operations: Promise<{
      success: boolean;
      result?: any;
      error?: any;
    }>[] = [];
    for (let i = 0; i < 10; i++) {
      operations.push(
        mcpClient
          .callTool("example_tool", { iteration: i })
          .then((result) => ({ success: true, result }))
          .catch((error) => ({ success: false, error })),
      );
    }

    const results = await Promise.allSettled(operations);

    // Get detailed statistics
    const clientStats = mcpClient.getStats();
    const transportStats = mcpClient.getTransportStats();

    console.log("Client Performance Stats:");
    console.log("- Total requests:", clientStats.totalRequests);
    console.log("- Fallback activations:", clientStats.fallbackActivations);
    console.log("- Transport switches:", clientStats.transportSwitches);
    console.log("- Average response time:", clientStats.averageResponseTime);

    console.log("\nTransport Stats:");
    Object.entries(transportStats).forEach(([type, stats]) => {
      console.log(`- ${type}:`, {
        messagesSent: stats.messagesSent,
        averageResponseTime: stats.averageResponseTime,
        connectionUptime: stats.connectionUptime,
      });
    });

    // Perform health check
    const healthCheck = await mcpClient.performHealthCheck();
    console.log("\nHealth Check:", healthCheck);
  } catch (error) {
    console.error("Performance monitoring error:", error);
  } finally {
    await mcpClient.destroy();
  }
}

/**
 * Example 6: Error handling and recovery
 */
export async function errorHandlingExample() {
  const errorHandler = new ErrorManager();

  const config: MCPMultiTransportClientConfig = {
    serverUrl: "https://unreliable-server.com/mcp",
    transportType: "http", // Required property
    transportStrategy: "http-first",
    enableFallback: true,

    httpTransport: {
      context7: {
        apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
        mcpEndpoint: "https://mcp.context7.com/mcp",
      },
      // Aggressive retry settings for unreliable connections
      maxRetries: 5,
      retryBaseDelay: 2000,
      retryMaxDelay: 60000,
      retryJitter: true,
    },

    // Permissive retry configuration
    retry: {
      maxAttemptsPerTransport: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      jitter: true,
    },
  };

  const mcpClient = createMultiTransportClient(config, errorHandler);

  // Set up comprehensive error monitoring
  mcpClient.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
    const eventData = event.data as any;
    if (eventData && eventData.mcpError) {
      const { mcpError, originalError } = eventData;
      console.error("MCP Error:", {
        id: mcpError.id,
        message: mcpError.message,
        category: mcpError.category,
        severity: mcpError.severity,
        recoverable: mcpError.recoverable,
        retryable: mcpError.retryable,
        transportType: mcpError.context?.transportType,
      });
    }
  });

  try {
    await mcpClient.connect();

    // Test resilience with potentially failing operations
    for (let i = 0; i < 5; i++) {
      try {
        const result = await mcpClient.callTool("potentially_failing_tool", {
          attempt: i + 1,
        });
        console.log(`Attempt ${i + 1} succeeded:`, result);
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error.message);
        // Continue trying - the client will handle retries and fallbacks
      }
    }

    // Check final statistics
    const finalStats = mcpClient.getStats();
    console.log("Final error recovery stats:", {
      fallbackActivations: finalStats.fallbackActivations,
      transportSwitches: finalStats.transportSwitches,
      totalRequests: finalStats.totalRequests,
    });
  } catch (error) {
    console.error("Error handling example failed:", error);
  } finally {
    await mcpClient.destroy();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility function to create a Context7 client with sensible defaults
 */
function createProductionContext7Client(
  apiKey: string,
): MCPMultiTransportClient {
  const errorHandler = new ErrorManager();

  return createContext7Client(apiKey, errorHandler, {
    transportStrategy: "http-first",
    enableFallback: true,
    healthCheckInterval: 120000, // 2 minutes in production

    httpTransport: {
      requestTimeout: 45000, // Longer timeout for production
      maxRetries: 5,
      enableCompression: true,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes cache
    },

    retry: {
      maxAttemptsPerTransport: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      jitter: true,
    },
  });
}

/**
 * Utility function to create a development client with debugging
 */
function createDevelopmentContext7Client(
  apiKey: string,
): MCPMultiTransportClient {
  const errorHandler = new ErrorManager();

  return createContext7Client(apiKey, errorHandler, {
    transportStrategy: "auto",
    enableFallback: true,
    healthCheckInterval: 30000, // 30 seconds for development

    httpTransport: {
      requestTimeout: 30000,
      maxRetries: 3,
      enableCompression: true,
      enableCaching: false, // No caching in development
    },

    retry: {
      maxAttemptsPerTransport: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      jitter: true,
    },
  });
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Main function to run all examples
 */
export async function runAllExamples() {
  console.log("=== MCP Multi-Transport Client Examples ===\n");

  try {
    console.log("1. Context7 Client Example:");
    await createContext7ClientExample();

    console.log("\n2. Custom Multi-Transport Client Example:");
    await createCustomMultiTransportClientExample();

    console.log("\n3. Transport Factory Example:");
    await transportFactoryExample();

    console.log("\n4. Custom Fallback Example:");
    await customFallbackExample();

    console.log("\n5. Performance Monitoring Example:");
    await performanceMonitoringExample();

    console.log("\n6. Error Handling Example:");
    await errorHandlingExample();
  } catch (error) {
    console.error("Example suite failed:", error);
  }
}

// Export everything for easy importing
export { createProductionContext7Client, createDevelopmentContext7Client };
