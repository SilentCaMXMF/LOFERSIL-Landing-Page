#!/usr/bin/env node

/**
 * MCP Tool Discovery Script
 *
 * Connects to the MCP server and discovers available tools
 */

import { MCPClient } from "./src/scripts/modules/mcp/client.js";
import { ErrorManager } from "./src/scripts/modules/ErrorManager.js";

async function discoverMCPTools() {
  console.log("🔍 Discovering MCP Tools...\n");

  try {
    // Initialize error handler
    const errorHandler = new ErrorManager();

    // Create MCP client with configuration from .env
    const client = new MCPClient(
      {
        serverUrl: "ws://localhost:3000",
        apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
        clientInfo: {
          name: "LOFERSIL OpenAgent",
          version: "1.0.0",
        },
        connectionTimeout: 10000,
        reconnection: {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
        },
      },
      errorHandler,
    );

    console.log("📡 Connecting to MCP server...");
    console.log(`   Server: ws://localhost:3000`);
    console.log(`   Client: LOFERSIL OpenAgent v1.0.0\n`);

    // Connect to server
    await client.connect();
    console.log("✅ Connected to MCP server successfully!");

    // Initialize protocol
    console.log("🔧 Initializing MCP protocol...");
    const capabilities = await client.initialize();
    console.log("✅ Protocol initialized");
    console.log(
      `   Protocol Version: ${capabilities.protocolVersion || "2024-11-05"}`,
    );
    console.log(`   Capabilities: ${JSON.stringify(capabilities, null, 2)}\n`);

    // Discover tools
    console.log("🛠️  Discovering available tools...");
    const tools = await client.listTools();

    if (tools.length === 0) {
      console.log("❌ No tools found on the server");
    } else {
      console.log(`✅ Found ${tools.length} tools:\n`);

      tools.forEach((tool, index) => {
        console.log(`${index + 1}. 📦 ${tool.name}`);
        console.log(`   Description: ${tool.description || "No description"}`);

        if (tool.inputSchema) {
          console.log(`   Input Schema:`);
          console.log(`   ${JSON.stringify(tool.inputSchema, null, 6)}`);
        }

        console.log("");
      });
    }

    // Discover resources
    console.log("📁 Discovering available resources...");
    try {
      const resources = await client.listResources();

      if (resources.length === 0) {
        console.log("❌ No resources found on the server");
      } else {
        console.log(`✅ Found ${resources.length} resources:\n`);

        resources.forEach((resource, index) => {
          console.log(`${index + 1}. 📄 ${resource.name || resource.uri}`);
          console.log(`   URI: ${resource.uri}`);
          console.log(`   MIME Type: ${resource.mimeType || "unknown"}`);
          console.log("");
        });
      }
    } catch (error) {
      console.log(`⚠️  Could not list resources: ${error.message}`);
    }

    // Discover prompts
    console.log("💬 Discovering available prompts...");
    try {
      const prompts = await client.listPrompts();

      if (prompts.length === 0) {
        console.log("❌ No prompts found on the server");
      } else {
        console.log(`✅ Found ${prompts.length} prompts:\n`);

        prompts.forEach((prompt, index) => {
          console.log(`${index + 1}. 🗣️  ${prompt.name}`);
          console.log(
            `   Description: ${prompt.description || "No description"}`,
          );

          if (prompt.arguments && prompt.arguments.length > 0) {
            console.log(`   Arguments:`);
            prompt.arguments.forEach((arg) => {
              console.log(
                `     - ${arg.name}: ${arg.description || "No description"} (${arg.required ? "required" : "optional"})`,
              );
            });
          }
          console.log("");
        });
      }
    } catch (error) {
      console.log(`⚠️  Could not list prompts: ${error.message}`);
    }

    // Get client status
    console.log("📊 Client Status:");
    const status = client.getStatus();
    console.log(`   State: ${status.state}`);
    console.log(`   Connected At: ${status.connectedAt}`);
    console.log(`   Connection Attempts: ${status.connectionAttempts}`);
    console.log(`   Active Requests: ${status.activeRequests}`);

    // Get metrics
    console.log("\n📈 Performance Metrics:");
    const metrics = client.getMetrics();
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Successful Requests: ${metrics.successfulRequests}`);
    console.log(`   Failed Requests: ${metrics.failedRequests}`);
    console.log(
      `   Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`,
    );

    // Disconnect
    console.log("\n🔌 Disconnecting from MCP server...");
    await client.disconnect();
    console.log("✅ Disconnected successfully");
  } catch (error) {
    console.error("❌ Error connecting to MCP server:");
    console.error(`   Message: ${error.message}`);

    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }

    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if MCP server is running on ws://localhost:3000");
    console.log("2. Verify API key is valid");
    console.log("3. Check network connectivity");
    console.log("4. Ensure firewall allows WebSocket connections");

    process.exit(1);
  }
}

// Run the discovery
discoverMCPTools().catch(console.error);
