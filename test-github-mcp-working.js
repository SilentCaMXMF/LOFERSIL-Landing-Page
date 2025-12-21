#!/usr/bin/env node

/**
 * Test GitHub MCP connection using fixed HTTP client
 * Simplified version without ErrorManager dependency
 */

import { HTTPMCPClient } from "./src/scripts/modules/mcp/http-client.js";

// Simple error handler for testing
class SimpleErrorHandler {
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

async function testGitHubMCP() {
  const errorHandler = new SimpleErrorHandler();
  const token =
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    console.error(
      "❌ No GitHub token found. Please set GITHUB_PERSONAL_ACCESS_TOKEN",
    );
    process.exit(1);
  }

  const client = new HTTPMCPClient(
    {
      serverUrl: "https://api.githubcopilot.com/mcp/",
      clientInfo: { name: "Test Client", version: "1.0.0" },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      enableLogging: true,
      requestTimeout: 15000,
    },
    errorHandler,
  );

  try {
    console.log("🚀 Connecting to GitHub MCP Server via HTTP...");
    await client.connect();
    console.log("✅ Connected successfully!");

    console.log("🔧 Initializing connection...");
    const capabilities = await client.initialize();
    console.log("🔧 Server capabilities:", capabilities);

    console.log("🛠️ Listing available tools...");
    const tools = await client.listTools();
    console.log(`🛠️ Available tools: ${tools.length}`);

    if (tools.length > 0) {
      console.log(
        "Sample tools:",
        tools.slice(0, 5).map((t) => t.name),
      );
    }

    console.log("🎉 MCP GitHub SSE connection test completed successfully!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.log("\n💡 If you still get errors, check:");
    console.log("   - GitHub Copilot subscription is active");
    console.log("   - Token has 'copilot' scope");
    console.log("   - Account has access to GitHub Copilot");
    process.exit(1);
  } finally {
    await client.destroy();
  }
}

// Call the test function
testGitHubMCP().catch(console.error);
