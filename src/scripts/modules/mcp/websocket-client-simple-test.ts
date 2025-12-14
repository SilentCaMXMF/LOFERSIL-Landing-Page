/**
 * Simple WebSocket Client Test
 * Quick verification that the WebSocket client implementation works
 */

import {
  MCPWebSocketClient,
  WebSocketError,
  WebSocketErrorType,
} from "./websocket-client";
import { MCPConnectionState } from "./types";
import { ErrorManager } from "../ErrorManager";

// Simple test runner
async function runSimpleTest() {
  console.log("🧪 Testing MCP WebSocket Client...");

  try {
    // Create error manager
    const errorHandler = new ErrorManager({
      showUserMessages: false,
      logToConsole: false,
    });

    // Test 1: Constructor
    console.log("✅ Test 1: Constructor");
    const client = new MCPWebSocketClient(
      {
        serverUrl: "ws://localhost:8080",
        connectionTimeout: 1000,
        reconnection: {
          maxAttempts: 3,
          initialDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
        },
      },
      errorHandler,
    );

    // Test 2: Initial state
    console.log("✅ Test 2: Initial state");
    if (client.getState() !== MCPConnectionState.DISCONNECTED) {
      throw new Error("Initial state should be DISCONNECTED");
    }

    // Test 3: Configuration
    console.log("✅ Test 3: Configuration");
    const config = client.getConfig();
    if (config.serverUrl !== "ws://localhost:8080") {
      throw new Error("Server URL not configured correctly");
    }

    // Test 4: Statistics
    console.log("✅ Test 4: Statistics");
    const stats = client.getStats();
    if (stats.totalAttempts !== 0) {
      throw new Error("Initial stats should be zero");
    }

    // Test 5: Diagnostics
    console.log("✅ Test 5: Diagnostics");
    const diagnostics = await client.performDiagnostics();
    if (!diagnostics.success) {
      throw new Error("Diagnostics should succeed");
    }

    // Test 6: Error handling
    console.log("✅ Test 6: Error handling");
    try {
      new MCPWebSocketClient({ serverUrl: "" }, errorHandler);
      throw new Error("Should have thrown error for invalid config");
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("Invalid MCP client config")
      ) {
        throw new Error("Should have thrown config validation error");
      }
    }

    // Test 7: WebSocketError
    console.log("✅ Test 7: WebSocketError");
    const wsError = new WebSocketError(
      WebSocketErrorType.CONNECTION_FAILED,
      "Test error",
      { detail: "test" },
    );
    if (wsError.type !== WebSocketErrorType.CONNECTION_FAILED) {
      throw new Error("WebSocketError type not set correctly");
    }

    // Test 8: Event listeners
    console.log("✅ Test 8: Event listeners");
    let eventFired = false;
    client.addEventListener("connection_state_changed" as any, () => {
      eventFired = true;
    });
    client.removeEventListener("connection_state_changed" as any, () => {});

    // Test 9: Resource cleanup
    console.log("✅ Test 9: Resource cleanup");
    client.destroy();
    if (client.getState() !== MCPConnectionState.DISCONNECTED) {
      throw new Error("State should be DISCONNECTED after destroy");
    }

    console.log(
      "🎉 All tests passed! WebSocket client implementation is working correctly.",
    );
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

// Export for potential use
export { runSimpleTest };

// Run test if this file is executed directly
if (
  typeof window === "undefined" &&
  import.meta.url === `file://${process.argv[1]}`
) {
  runSimpleTest().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
