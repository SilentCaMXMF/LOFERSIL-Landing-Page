/**
 * HTTP Transport Compilation Test
 *
 * Simple test to verify that the HTTP transport implementation
 * compiles correctly and all types are properly exported.
 */

import {
  // Core HTTP Transport
  HTTPTransport,
  createContext7Transport,
  type HTTPTransportConfig,

  // Transport Interface
  MCPTransport,
  type TransportConfig,
  type TransportStats,
  type TransportEventData,
  TransportError,
  TransportErrorType,
  createTransportError,
  validateTransportConfig,

  // HTTP Transport Types
  type MCPHTTPTransportConfig,
  type MCPHTTPClientConfig,
  type Context7Config,
  HTTPTransportErrorCategory,
  DEFAULT_CONTEXT7_CONFIG,

  // MCP Core Types
  MCPConnectionState,
  MCPClientEventType,
  JSONRPCRequest,
  JSONRPCResponse,

  // Utilities
  validateHTTPTransportConfig,
  createHTTPTransportConfig,
  mergeContext7Config,
} from "./index";

/**
 * Test function to verify all imports work correctly
 */
export function testHTTPTransportCompilation(): boolean {
  try {
    // Test basic transport creation
    const config: HTTPTransportConfig = {
      serverUrl: "https://mcp.context7.com/mcp",
      context7: {
        apiKey: "test-key",
        mcpEndpoint: "https://mcp.context7.com/mcp",
        apiVersion: "v1",
      },
    };

    const transport = new HTTPTransport(config);

    // Test factory function
    const factoryTransport = createContext7Transport("test-key");

    // Test type validation
    const validation = validateHTTPTransportConfig(config);

    // Test configuration merging
    const mergedConfig = mergeContext7Config({
      apiKey: "test-key",
      apiVersion: "v2",
    });

    // Test error creation
    const error = createTransportError(
      TransportErrorType.NETWORK_ERROR,
      "Test error",
      { retryable: true },
    );

    console.log("✅ HTTP Transport compilation test passed!");
    console.log("✅ All imports and types are working correctly");

    return true;
  } catch (error) {
    console.error("❌ HTTP Transport compilation test failed:", error);
    return false;
  }
}

// Export test runner
export { testHTTPTransportCompilation as default };
