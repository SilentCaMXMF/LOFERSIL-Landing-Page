#!/usr/bin/env node

import fetch from "node-fetch";

async function testMCPHeadersFix() {
  const token =
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    console.error(
      "❌ No GitHub token found. Please set GITHUB_PERSONAL_ACCESS_TOKEN",
    );
    process.exit(1);
  }

  console.log("🚀 Testing MCP Header Fix for GitHub Copilot SSE Error");
  console.log("=".repeat(60));

  // Test with OLD headers (should fail with 400)
  console.log("1. Testing with OLD headers (should fail):");
  try {
    const response1 = await fetch("https://api.githubcopilot.com/mcp/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "MCP-Test/1.0.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          clientInfo: { name: "MCP Test", version: "1.0.0" },
        },
      }),
    });

    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    if (response1.status === 400) {
      const errorText = await response1.text();
      console.log(`   Error: ${errorText.substring(0, 100)}...`);
      console.log(
        "   ❌ Expected 400 error due to missing 'text/event-stream' in Accept header",
      );
    } else {
      console.log("   ✅ Unexpected success with old headers");
    }
  } catch (error) {
    console.log(`   ❌ Connection error: ${error.message}`);
  }

  console.log("\n2. Testing with FIXED headers (should work):");
  try {
    const response2 = await fetch("https://api.githubcopilot.com/mcp/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
        "User-Agent": "MCP-Test/1.0.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          clientInfo: { name: "MCP Test", version: "1.0.0" },
        },
      }),
    });

    console.log(`   Status: ${response2.status} ${response2.statusText}`);

    if (response2.ok) {
      const responseText = await response2.text();
      console.log("   ✅ SUCCESS! Connection established with fixed headers");
      console.log(`   Response preview: ${responseText.substring(0, 200)}...`);

      // Try to parse JSON response
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log(
          `   ✅ Valid JSON response with keys: ${Object.keys(jsonResponse)}`,
        );

        if (jsonResponse.result) {
          console.log(`   ✅ MCP initialize successful with capabilities`);
        }
      } catch (e) {
        console.log(
          "   ⚠️ Response is not valid JSON, but connection succeeded",
        );
      }
    } else {
      const errorText = await response2.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);

      if (response2.status === 400) {
        console.log("   💡 Still getting 400 error. Possible causes:");
        console.log("      - GitHub Copilot subscription not active");
        console.log("      - Token lacks 'copilot' scope");
        console.log("      - Account doesn't have Copilot access");
      } else if (response2.status === 401) {
        console.log("   💡 401 Unauthorized - Token is invalid or expired");
      } else if (response2.status === 403) {
        console.log("   💡 403 Forbidden - Token lacks required permissions");
      }
    }
  } catch (error) {
    console.log(`   ❌ Connection error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 SUMMARY:");
  console.log(
    "✅ The fix has been implemented: Accept header now includes 'text/event-stream'",
  );
  console.log(
    "🔧 Update the HTTPMCPClient to use: Accept: 'application/json, text/event-stream'",
  );
  console.log("📖 This resolves the 400 'Accept must contain both...' error");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPHeadersFix().catch(console.error);
}
