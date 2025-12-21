#!/usr/bin/env node

/**
 * Test script to verify MCP GitHub SSE connection fix
 */

import { HTTPMCPClient } from "./src/scripts/modules/mcp/http-client.js";

// Simple error handler for testing
class TestErrorHandler {
  handleError(error, context, details = {}) {
    console.error(`❌ Error in ${context}: ${error.message}`);
    if (details && Object.keys(details).length > 0) {
      console.error("Details:", details);
    }
  }

  recordSuccess(context) {
    console.log(`✅ Success: ${context}`);
  }
}

async function testMCPConnection() {
  const errorHandler = new TestErrorHandler();
  const token =
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    console.error(
      "❌ No GitHub token found. Please set GITHUB_PERSONAL_ACCESS_TOKEN",
    );
    process.exit(1);
  }

  console.log("🚀 Testing MCP GitHub SSE Connection (Fixed Version)");
  console.log("=".repeat(60));

  const client = new HTTPMCPClient(
    {
      serverUrl: "https://api.githubcopilot.com/mcp/",
      clientInfo: { name: "MCP Test Client", version: "1.0.0" },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      enableLogging: true,
      requestTimeout: 15000,
    },
    errorHandler,
  );

  try {
    console.log("🔗 Connecting to GitHub MCP Server...");
    await client.connect();
    console.log("✅ Connected successfully!");

    console.log("🔧 Initializing connection...");
    const capabilities = await client.sendRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        clientInfo: {
          name: "MCP Test Client",
          version: "1.0.0",
        },
      },
    });

    console.log(
      "✅ Server capabilities received:",
      capabilities ? "Yes" : "No",
    );

    console.log("🛠️ Listing available tools...");
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.length} available tools`);

    if (tools.length > 0) {
      console.log("Sample tools:");
      tools.slice(0, 5).forEach((tool, i) => {
        console.log(
          `  ${i + 1}. ${tool.name} - ${tool.description || "No description"}`,
        );
      });
    }

    console.log("🎉 MCP connection test completed successfully!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    if (error.message.includes("400")) {
      console.log("\n💡 If you still get 400 errors, this could mean:");
      console.log("   - GitHub Copilot subscription is not active");
      console.log("   - Token lacks 'copilot' scope");
      console.log("   - Account doesn't have access to GitHub Copilot");
      console.log("   - GitHub Copilot MCP service is temporarily down");
    }

    process.exit(1);
  } finally {
    await client.destroy();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPConnection().catch(console.error);
}

export { testMCPConnection };
