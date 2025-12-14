/**
 * HTTP Transport Test Example
 *
 * This file demonstrates how to use the HTTP transport for MCP communication
 * with Context7. It shows the complete setup and usage pattern.
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  HTTPTransport,
  type HTTPTransportConfig,
  createContext7Transport,
} from "./http-transport";
import { MCPConnectionState, MCPClientEventType } from "./types";
import { ErrorManager } from "../ErrorManager";

// ============================================================================
// CONTEXT7 CONFIGURATION
// ============================================================================

/**
 * Context7 configuration for testing
 */
const CONTEXT7_CONFIG = {
  // API Key provided in the requirements
  apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
  // MCP URL from requirements
  mcpEndpoint: "https://mcp.context7.com/mcp",
  // API version
  apiVersion: "v1",
};

// ============================================================================
// HTTP TRANSPORT EXAMPLES
// ============================================================================

/**
 * Example 1: Basic HTTP Transport Setup
 */
export async function basicHTTPTransportExample(): Promise<void> {
  console.log("=== Basic HTTP Transport Example ===");

  try {
    // Create error manager
    const errorHandler = new ErrorManager();

    // Create HTTP transport configuration
    const config: HTTPTransportConfig = {
      serverUrl: CONTEXT7_CONFIG.mcpEndpoint,
      context7: {
        apiKey: CONTEXT7_CONFIG.apiKey,
        mcpEndpoint: CONTEXT7_CONFIG.mcpEndpoint,
        apiVersion: CONTEXT7_CONFIG.apiVersion,
      },
      requestTimeout: 30000,
      maxRetries: 3,
      retryBaseDelay: 1000,
      retryMaxDelay: 10000,
      enableCompression: true,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
      },
    };

    // Create HTTP transport
    const transport = new HTTPTransport(config);

    // Set up event listeners
    transport.addEventListener(
      MCPClientEventType.CONNECTION_STATE_CHANGED,
      (event) => {
        console.log(`Connection state changed: ${event.data.connectionState}`);
      },
    );

    transport.addEventListener(MCPClientEventType.MESSAGE_SENT, (event) => {
      console.log(`Message sent: ${JSON.stringify(event.data.message)}`);
    });

    transport.addEventListener(MCPClientEventType.MESSAGE_RECEIVED, (event) => {
      console.log(`Message received: ${JSON.stringify(event.data.message)}`);
    });

    transport.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
      console.error(`Transport error: ${event.data.error?.message}`);
    });

    // Initialize transport
    console.log("Initializing HTTP transport...");
    await transport.initialize();
    console.log("Transport initialized successfully!");

    // Check connection state
    console.log(`Connection state: ${transport.getConnectionState()}`);
    console.log(`Is connected: ${transport.isConnected()}`);

    // Test basic MCP initialize request
    console.log("Testing MCP initialize...");
    const initResult = await transport.sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        experimental: {},
      },
      clientInfo: {
        name: "LOFERSIL MCP Client",
        version: "1.0.0",
      },
    });

    console.log(`Initialize result: ${JSON.stringify(initResult, null, 2)}`);

    // Test listing available tools
    console.log("Testing tools/list...");
    const toolsResult = await transport.sendRequest("tools/list");
    console.log(`Available tools: ${JSON.stringify(toolsResult, null, 2)}`);

    // Get transport statistics
    const stats = transport.getStats();
    console.log(`Transport stats: ${JSON.stringify(stats, null, 2)}`);

    // Perform health check
    const health = await transport.healthCheck();
    console.log(`Health check: ${JSON.stringify(health, null, 2)}`);

    // Perform diagnostics
    const diagnostics = await transport.performDiagnostics();
    console.log(`Diagnostics: ${JSON.stringify(diagnostics, null, 2)}`);
  } catch (error) {
    console.error("HTTP transport example failed:", error);
  }
}

/**
 * Example 2: Using the factory function
 */
export async function factoryFunctionExample(): Promise<void> {
  console.log("\n=== Factory Function Example ===");

  try {
    // Create transport using factory function
    const transport = createContext7Transport(
      CONTEXT7_CONFIG.apiKey,
      CONTEXT7_CONFIG.mcpEndpoint,
    );

    console.log("Transport created with factory function");

    // Initialize and test
    await transport.initialize();
    console.log("Transport initialized successfully!");

    // Test a simple request
    const result = await transport.sendRequest("ping");
    console.log(`Ping result: ${JSON.stringify(result, null, 2)}`);

    // Clean up
    await transport.destroy();
    console.log("Transport destroyed");
  } catch (error) {
    console.error("Factory function example failed:", error);
  }
}

/**
 * Example 3: Error handling and recovery
 */
export async function errorHandlingExample(): Promise<void> {
  console.log("\n=== Error Handling Example ===");

  try {
    // Create transport with short timeout for testing
    const config: HTTPTransportConfig = {
      serverUrl: "https://httpstat.us/404", // Use a service that returns errors
      context7: {
        apiKey: CONTEXT7_CONFIG.apiKey,
        mcpEndpoint: CONTEXT7_CONFIG.mcpEndpoint,
      },
      requestTimeout: 5000, // 5 second timeout
      maxRetries: 2,
      retryBaseDelay: 500,
      retryMaxDelay: 2000,
    };

    const transport = new HTTPTransport(config);

    // Set up error event listener
    transport.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
      const error = event.data.error;
      if (error) {
        console.log(`Error type: ${(error as any).type}`);
        console.log(`Error message: ${error.message}`);
        console.log(`Error retryable: ${(error as any).retryable}`);
        console.log(`Error recoverable: ${(error as any).recoverable}`);
      }
    });

    // Try to initialize (should fail)
    try {
      await transport.initialize();
      console.log("Unexpected success!");
    } catch (error) {
      console.log("Expected error caught:", (error as Error).message);
    }

    // Get error statistics
    const stats = transport.getStats();
    console.log(`Error stats: ${JSON.stringify(stats, null, 2)}`);
  } catch (error) {
    console.error("Error handling example failed:", error);
  }
}

/**
 * Example 4: Rate limiting demonstration
 */
export async function rateLimitingExample(): Promise<void> {
  console.log("\n=== Rate Limiting Example ===");

  try {
    // Create transport with rate limiting
    const config: HTTPTransportConfig = {
      serverUrl: CONTEXT7_CONFIG.mcpEndpoint,
      context7: {
        apiKey: CONTEXT7_CONFIG.apiKey,
        mcpEndpoint: CONTEXT7_CONFIG.mcpEndpoint,
      },
      rateLimit: {
        maxRequests: 2, // Only 2 requests per window
        windowMs: 5000, // 5 second window
        retryAfter: 1000, // Retry after 1 second
      },
    };

    const transport = new HTTPTransport(config);

    // Set up event listeners
    transport.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
      const error = event.data.error;
      if (error && (error as any).type === "rate_limit") {
        console.log("Rate limit hit! Waiting before retry...");
      }
    });

    await transport.initialize();

    // Make multiple requests quickly (should trigger rate limiting)
    console.log("Making rapid requests to test rate limiting...");

    for (let i = 0; i < 5; i++) {
      try {
        console.log(`Request ${i + 1}...`);
        await transport.sendRequest("ping");
        console.log(`Request ${i + 1} succeeded`);
      } catch (error) {
        console.log(`Request ${i + 1} failed: ${(error as Error).message}`);
      }
    }

    // Get stats to show rate limit hits
    const stats = transport.getStats();
    console.log(`Stats with rate limiting: ${JSON.stringify(stats, null, 2)}`);

    await transport.destroy();
  } catch (error) {
    console.error("Rate limiting example failed:", error);
  }
}

/**
 * Example 5: Performance monitoring
 */
export async function performanceMonitoringExample(): Promise<void> {
  console.log("\n=== Performance Monitoring Example ===");

  try {
    const transport = createContext7Transport(
      CONTEXT7_CONFIG.apiKey,
      CONTEXT7_CONFIG.mcpEndpoint,
    );

    // Set up performance monitoring
    const requestTimes: number[] = [];

    transport.addEventListener(MCPClientEventType.MESSAGE_SENT, (event) => {
      if (event.data.responseTime) {
        requestTimes.push(event.data.responseTime);
      }
    });

    await transport.initialize();

    // Make multiple requests and measure performance
    const numRequests = 10;
    console.log(`Making ${numRequests} requests for performance testing...`);

    for (let i = 0; i < numRequests; i++) {
      const startTime = performance.now();
      await transport.sendRequest("ping");
      const endTime = performance.now();
      requestTimes.push(endTime - startTime);
    }

    // Calculate performance metrics
    const avgTime =
      requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
    const minTime = Math.min(...requestTimes);
    const maxTime = Math.max(...requestTimes);

    console.log(`Performance metrics:`);
    console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min response time: ${minTime.toFixed(2)}ms`);
    console.log(`  Max response time: ${maxTime.toFixed(2)}ms`);

    // Get transport stats
    const stats = transport.getStats();
    console.log(`Transport performance: ${JSON.stringify(stats, null, 2)}`);

    await transport.destroy();
  } catch (error) {
    console.error("Performance monitoring example failed:", error);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

/**
 * Run all HTTP transport examples
 */
export async function runHTTPTransportExamples(): Promise<void> {
  console.log("Starting HTTP Transport Examples...\n");

  try {
    await basicHTTPTransportExample();
    await factoryFunctionExample();
    await errorHandlingExample();
    await rateLimitingExample();
    await performanceMonitoringExample();

    console.log("\n✅ All HTTP transport examples completed successfully!");
  } catch (error) {
    console.error("\n❌ HTTP transport examples failed:", error);
  }
}

// ============================================================================
// AUTO-EXECUTION FOR TESTING
// ============================================================================

// Run examples if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
  runHTTPTransportExamples()
    .then(() => {
      console.log("\n🎉 HTTP transport examples completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 HTTP transport examples failed:", error);
      process.exit(1);
    });
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { CONTEXT7_CONFIG };

/**
 * Example usage in browser environment:
 *
 * ```typescript
 * import { createContext7Transport } from './modules/mcp';
 *
 * // Create transport
 * const transport = createContext7Transport(
 *   'ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44'
 * );
 *
 * // Use transport
 * await transport.initialize();
 * const tools = await transport.sendRequest('tools/list');
 * console.log('Available tools:', tools);
 *
 * // Clean up
 * await transport.destroy();
 * ```
 *
 * Example usage with custom configuration:
 *
 * ```typescript
 * import { HTTPTransport, type HTTPTransportConfig } from './modules/mcp';
 *
 * const config: HTTPTransportConfig = {
 *   serverUrl: 'https://mcp.context7.com/mcp',
 *   context7: {
 *     apiKey: 'ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44',
 *     apiVersion: 'v1',
 *   },
 *   requestTimeout: 45000,
 *   maxRetries: 5,
 *   enableCaching: true,
 * };
 *
 * const transport = new HTTPTransport(config);
 * // ... use transport
 * ```
 */
