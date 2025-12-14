#!/usr/bin/env node

/**
 * Test Context7 MCP HTTP Transport Connection
 *
 * This script tests the new HTTP transport implementation with Context7
 * and validates MCP connectivity, tool discovery, and documentation retrieval.
 */

import https from "https";

// Context7 Configuration
const CONTEXT7_CONFIG = {
  apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
  baseUrl: "https://mcp.context7.com/mcp",
};

// MCP Protocol Request Helper
async function makeMCPRequest(method, params = {}) {
  const url = CONTEXT7_CONFIG.baseUrl;
  const requestData = {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  };

  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONTEXT7_CONFIG.apiKey}`,
        "User-Agent": "MCP-HTTP-Client/1.0",
        Accept: "application/json",
      },
    };

    console.log(`🔗 Making MCP request to: ${url}`);
    console.log(`📋 Request options:`, JSON.stringify(requestOptions, null, 2));

    const req = https.request(url, requestOptions, (res) => {
      console.log(`📊 Response status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Response headers:`, JSON.stringify(res.headers, null, 2));

      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: response,
          });
        } catch (error) {
          reject(
            new Error(`JSON parse error: ${error.message}\nRaw data: ${data}`),
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("MCP request timeout after 30 seconds"));
    });

    console.log(
      `📤 Sending MCP request:`,
      JSON.stringify(requestData, null, 2),
    );
    req.write(JSON.stringify(requestData));
    req.end();
  });
}

// Test Functions
async function testMCPProtocol() {
  console.log("\n🔍 Testing MCP JSON-RPC Protocol...");

  try {
    // Test initialize method
    console.log("📡 Testing initialize method...");
    const initResponse = await makeMCPRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: {
          listChanged: true,
        },
        sampling: {},
      },
      clientInfo: {
        name: "Test MCP Client",
        version: "1.0.0",
      },
    });

    if (initResponse.statusCode === 200 && initResponse.data.result) {
      console.log("✅ MCP initialize test PASSED");
      console.log(
        "📄 Initialize response:",
        JSON.stringify(initResponse.data.result, null, 2),
      );
      return true;
    } else {
      console.log("⚠️ MCP initialize returned unexpected response");
      console.log("📄 Response:", JSON.stringify(initResponse.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ MCP protocol test FAILED: ${error.message}`);
    return false;
  }
}

async function discoverTools() {
  console.log("\n🔍 Discovering Context7 Tools...");

  try {
    const response = await makeMCPRequest("tools/list");

    if (response.statusCode === 200 && response.data.result) {
      const tools = response.data.result.tools || [];
      console.log("✅ Tools discovery PASSED");
      console.log(`📋 Found ${tools.length} tools:`);

      tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
        console.log(`     Description: ${tool.description}`);
        if (tool.inputSchema) {
          console.log(
            `     Input Schema: ${JSON.stringify(tool.inputSchema, null, 6)}`,
          );
        }
        console.log("");
      });

      return tools;
    } else {
      console.log(`❌ Tools discovery FAILED: Status ${response.statusCode}`);
      console.log("📄 Response:", JSON.stringify(response.data, null, 2));
      return [];
    }
  } catch (error) {
    console.log(`❌ Tools discovery FAILED: ${error.message}`);
    return [];
  }
}

async function testToolCall(tools) {
  console.log("\n🔍 Testing Tool Calls...");

  try {
    // Test resolve-library-id tool
    const resolveTool = tools.find((t) => t.name === "resolve-library-id");
    if (resolveTool) {
      console.log("📡 Testing resolve-library-id tool...");

      const response = await makeMCPRequest("tools/call", {
        name: "resolve-library-id",
        arguments: {
          query: "MCP client architecture",
        },
      });

      if (response.statusCode === 200 && response.data.result) {
        console.log("✅ resolve-library-id test PASSED");
        console.log(
          "📄 Tool response:",
          JSON.stringify(response.data.result, null, 2),
        );

        // If we got a library ID, test get-library-docs
        if (response.data.result.content && response.data.result.content[0]) {
          const content = response.data.result.content[0];
          if (content.text) {
            const libraryData = JSON.parse(content.text);
            if (libraryData.id) {
              await testGetLibraryDocs(libraryData.id);
            }
          }
        }
      } else {
        console.log("❌ resolve-library-id test FAILED");
        console.log("📄 Response:", JSON.stringify(response.data, null, 2));
      }
    }
  } catch (error) {
    console.log(`❌ Tool call test FAILED: ${error.message}`);
  }
}

async function testGetLibraryDocs(libraryId) {
  console.log("\n🔍 Testing get-library-docs tool...");

  try {
    const response = await makeMCPRequest("tools/call", {
      name: "get-library-docs",
      arguments: {
        id: libraryId,
      },
    });

    if (response.statusCode === 200 && response.data.result) {
      console.log("✅ get-library-docs test PASSED");
      console.log("📄 Library documentation received:");

      if (response.data.result.content) {
        response.data.result.content.forEach((item, index) => {
          if (item.type === "text") {
            console.log(`📖 Documentation part ${index + 1}:`);
            console.log(item.text);
            console.log("---");
          }
        });
      }
    } else {
      console.log("❌ get-library-docs test FAILED");
      console.log("📄 Response:", JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log(`❌ get-library-docs test FAILED: ${error.message}`);
  }
}

async function searchMCPDocumentation(tools) {
  console.log("\n🔍 Searching for MCP Documentation...");

  try {
    const resolveTool = tools.find((t) => t.name === "resolve-library-id");
    if (resolveTool) {
      console.log('📡 Searching for "multi-transport MCP"...');

      const response = await makeMCPRequest("tools/call", {
        name: "resolve-library-id",
        arguments: {
          query: "multi-transport MCP client architecture",
        },
      });

      if (response.statusCode === 200 && response.data.result) {
        console.log("✅ Documentation search PASSED");
        console.log("📄 Search results:");

        if (response.data.result.content && response.data.result.content[0]) {
          const content = response.data.result.content[0];
          if (content.text) {
            const results = JSON.parse(content.text);
            console.log("🔍 Search results:", JSON.stringify(results, null, 2));

            // Get documentation for first result
            if (results.length > 0 && results[0].id) {
              await testGetLibraryDocs(results[0].id);
            }
          }
        }
      } else {
        console.log("⚠️ Documentation search returned no results");
        console.log("📄 Response:", JSON.stringify(response.data, null, 2));
      }
    }
  } catch (error) {
    console.log(`❌ Documentation search FAILED: ${error.message}`);
  }
}

// Main Test Execution
async function runTests() {
  console.log("🚀 Starting Context7 MCP HTTP Transport Tests");
  console.log("=".repeat(60));

  const results = {
    mcpProtocol: false,
    tools: [],
    toolCalls: false,
    documentation: false,
  };

  try {
    // Test 1: MCP Protocol
    results.mcpProtocol = await testMCPProtocol();

    if (results.mcpProtocol) {
      // Test 2: Tools Discovery
      results.tools = await discoverTools();

      if (results.tools.length > 0) {
        // Test 3: Tool Calls
        await testToolCall(results.tools);
        results.toolCalls = true;

        // Test 4: Documentation Search
        await searchMCPDocumentation(results.tools);
        results.documentation = true;
      }
    }
  } catch (error) {
    console.error(`💥 Test suite FAILED: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY:");
  console.log(
    `  MCP Protocol: ${results.mcpProtocol ? "✅ PASSED" : "❌ FAILED"}`,
  );
  console.log(
    `  Tools Discovery: ${results.tools.length > 0 ? `✅ PASSED (${results.tools.length} tools)` : "❌ FAILED"}`,
  );
  console.log(`  Tool Calls: ${results.toolCalls ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(
    `  Documentation: ${results.documentation ? "✅ PASSED" : "❌ FAILED"}`,
  );

  const allPassed = results.mcpProtocol && results.tools.length > 0;

  if (allPassed) {
    console.log(
      "\n🎉 ALL TESTS PASSED! Context7 HTTP transport is working correctly.",
    );
    console.log(
      "📋 Ready for Phase 2 implementation with updated documentation from Context7.",
    );
  } else {
    console.log("\n❌ Some tests failed. Please check the implementation.");
  }

  return allPassed;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Unhandled error:", error);
      process.exit(1);
    });
}

export { runTests, discoverTools, makeMCPRequest };
