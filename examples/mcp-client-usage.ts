/**
 * MCP Client Usage Example
 *
 * This example demonstrates how to use the MCP client for various operations
 * including connection, tool execution, resource access, and prompt generation.
 */

import { MCPClient } from "../src/scripts/modules/mcp/client";
import { ErrorManager } from "../src/scripts/modules/ErrorManager";
import { MCPClientEventType } from "../src/scripts/modules/mcp/types";

// Example usage of MCP Client
async function exampleMCPClientUsage() {
  // Initialize ErrorManager
  const errorHandler = new ErrorManager();

  // Create MCP client with configuration
  const client = new MCPClient(
    {
      serverUrl: "ws://localhost:3000", // MCP server URL
      clientInfo: {
        name: "LOFERSIL Example Client",
        version: "1.0.0",
      },
      connectionTimeout: 30000,
      reconnection: {
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
      capabilities: {
        experimental: {
          customFeatures: true,
        },
      },
      debug: true,
    },
    errorHandler,
  );

  try {
    console.log("🚀 Connecting to MCP server...");

    // Connect to server
    await client.connect();
    console.log("✅ Connected successfully!");

    // Initialize protocol
    const capabilities = await client.initialize();
    console.log("🔧 Protocol initialized with capabilities:", capabilities);

    // List available tools
    console.log("\n🔨 Discovering available tools...");
    const tools = await client.listTools();
    console.log(
      `Found ${tools.length} tools:`,
      tools.map((t) => t.name),
    );

    // Execute a tool if available
    if (tools.length > 0) {
      const tool = tools[0];
      console.log(`\n⚡ Executing tool: ${tool.name}`);

      try {
        const result = await client.callTool(tool.name, {
          // Example arguments - adjust based on actual tool schema
          message: "Hello from MCP Client!",
        });

        console.log("✅ Tool executed successfully:");
        console.log("Result:", result);
      } catch (error) {
        console.error("❌ Tool execution failed:", error);
      }
    }

    // List available resources
    console.log("\n📁 Discovering available resources...");
    const resources = await client.listResources();
    console.log(
      `Found ${resources.length} resources:`,
      resources.map((r) => r.uri),
    );

    // Read a resource if available
    if (resources.length > 0) {
      const resource = resources[0];
      console.log(`\n📖 Reading resource: ${resource.uri}`);

      try {
        const content = await client.readResource(resource.uri);
        console.log("✅ Resource read successfully:");
        console.log("Content:", content);
      } catch (error) {
        console.error("❌ Resource read failed:", error);
      }
    }

    // List available prompts
    console.log("\n💭 Discovering available prompts...");
    const prompts = await client.listPrompts();
    console.log(
      `Found ${prompts.length} prompts:`,
      prompts.map((p) => p.name),
    );

    // Generate a prompt if available
    if (prompts.length > 0) {
      const prompt = prompts[0];
      console.log(`\n✨ Generating prompt: ${prompt.name}`);

      try {
        const result = await client.getPrompt(prompt.name, {
          // Example arguments - adjust based on actual prompt schema
          context: "Example context",
        });

        console.log("✅ Prompt generated successfully:");
        console.log("Result:", result);
      } catch (error) {
        console.error("❌ Prompt generation failed:", error);
      }
    }

    // Set up event listeners
    console.log("\n👂 Setting up event listeners...");

    client.addEventListener(
      MCPClientEventType.CONNECTION_STATE_CHANGED,
      (event) => {
        console.log("🔄 Connection state changed:", event.data);
      },
    );

    client.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
      console.error("🚨 Error occurred:", event.data);
    });

    client.addEventListener(MCPClientEventType.TOOL_CALLED, (event) => {
      console.log("🔨 Tool called:", event.data);
    });

    client.addEventListener(MCPClientEventType.RESOURCE_ACCESSED, (event) => {
      console.log("📁 Resource accessed:", event.data);
    });

    // Get client status and metrics
    console.log("\n📊 Client Status:");
    const status = client.getStatus();
    console.log("Status:", status);

    console.log("\n📈 Performance Metrics:");
    const metrics = client.getMetrics();
    console.log("Metrics:", metrics);

    // Perform health check
    console.log("\n🏥 Performing health check...");
    const health = await client.performHealthCheck();
    console.log("Health check result:", health);

    // Perform diagnostics
    console.log("\n🔍 Running diagnostics...");
    const diagnostics = await client.performDiagnostics();
    console.log("Diagnostics result:", diagnostics);
  } catch (error) {
    console.error("❌ MCP Client error:", error);
  } finally {
    // Clean up
    console.log("\n🧹 Disconnecting and cleaning up...");
    await client.destroy();
    console.log("✅ Cleanup completed!");
  }
}

// Example with error handling and reconnection
async function exampleWithRobustErrorHandling() {
  const errorHandler = new ErrorManager();

  const client = new MCPClient(
    {
      serverUrl: "ws://localhost:3000",
      autoReconnect: true,
      maxConcurrentRequests: 5,
      enableMonitoring: true,
      tools: {
        enableCaching: true,
        cacheTTL: 300000, // 5 minutes
      },
      resources: {
        enableCaching: true,
        cacheTTL: 600000, // 10 minutes
      },
    },
    errorHandler,
  );

  // Set up comprehensive error handling
  client.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
    const error = (event.data as any).error;
    console.error("MCP Error:", error.message);

    // Log to error manager
    errorHandler.handleError(error, "MCPClient.example", {
      component: "Example",
      timestamp: new Date(),
    });
  });

  client.addEventListener(
    MCPClientEventType.CONNECTION_STATE_CHANGED,
    (event) => {
      const { oldState, newState } = event.data as any;
      console.log(`Connection state: ${oldState} → ${newState}`);

      if (newState === "connected") {
        console.log("🎉 Connected! Ready to use MCP features.");
      } else if (newState === "error") {
        console.log("⚠️ Connection error. Will attempt reconnection...");
      }
    },
  );

  try {
    await client.connect();

    // Example: Batch tool operations
    const tools = await client.listTools();
    const results = await Promise.allSettled(
      tools
        .slice(0, 3)
        .map((tool) => client.callTool(tool.name, { batch: true })),
    );

    console.log("Batch operation results:", results);
  } catch (error) {
    console.error("Example failed:", error);
  } finally {
    await client.destroy();
  }
}

// Export examples for use
export { exampleMCPClientUsage, exampleWithRobustErrorHandling };

// Run example if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
  console.log("🚀 Running MCP Client Example...");
  exampleMCPClientUsage().catch(console.error);
}
