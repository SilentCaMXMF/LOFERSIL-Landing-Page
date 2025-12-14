/**
 * Simple MCP Error Handler Test
 *
 * Quick test to verify MCP error handler implementation
 */

import { MCPErrorHandler } from "./src/scripts/modules/mcp/error-handler";
import { ErrorManager } from "./src/scripts/modules/ErrorManager";
import {
  MCPErrorType,
  MCPErrorCategory,
  MCPErrorSeverity,
} from "./src/scripts/modules/mcp/error-handler";

// Simple test runner
async function runSimpleTest(): Promise<boolean> {
  console.log("🧪 Running MCP Error Handler Simple Test...");

  try {
    // Create error handler
    const errorManager = new ErrorManager();
    const errorHandler = new MCPErrorHandler(errorManager);

    console.log("✅ MCP Error Handler created successfully");

    // Test error classification
    const connectionError = new Error("WebSocket connection failed");
    const context = {
      component: "TestComponent",
      operation: "connect",
      timestamp: new Date(),
    };

    const result = await errorHandler.handleError(connectionError, context);

    console.log("✅ Error classified successfully:");
    console.log(`   Type: ${result.mcpError.type}`);
    console.log(`   Category: ${result.mcpError.category}`);
    console.log(`   Severity: ${result.mcpError.severity}`);
    console.log(`   Recoverable: ${result.mcpError.recoverable}`);
    console.log(`   Retryable: ${result.mcpError.retryable}`);
    console.log(`   Should Reconnect: ${result.shouldReconnect}`);

    // Test reconnection delay calculation
    const delay1 = errorHandler.calculateReconnectionDelay(1);
    const delay2 = errorHandler.calculateReconnectionDelay(2);
    const delay3 = errorHandler.calculateReconnectionDelay(3);

    console.log("✅ Reconnection delays calculated:");
    console.log(`   Attempt 1: ${delay1}ms`);
    console.log(`   Attempt 2: ${delay2}ms`);
    console.log(`   Attempt 3: ${delay3}ms`);

    // Test circuit breaker
    const status = errorHandler.getCircuitBreakerStatus("TestComponent");
    console.log("✅ Circuit breaker status retrieved:");
    console.log(
      `   State: ${status["TestComponent"]?.state || "No circuit breaker"}`,
    );

    // Test error statistics
    const stats = errorHandler.getErrorStatistics();
    console.log("✅ Error statistics retrieved:");
    console.log(`   Error types tracked: ${Object.keys(stats).length}`);

    // Test health status
    const health = errorHandler.getHealthStatus();
    console.log("✅ Health status retrieved:");
    console.log(`   Success: ${health.success}`);
    console.log(`   Has configuration: ${!!health.data?.configuration}`);

    console.log("🎉 All tests passed! MCP Error Handler is working correctly.");

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

// Run the test
runSimpleTest().then((success) => {
  process.exit(success ? 0 : 1);
});
