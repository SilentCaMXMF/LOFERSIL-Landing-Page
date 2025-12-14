#!/usr/bin/env node

/**
 * Simple WebSocket MCP Test
 */

const WebSocket = require("ws");

console.log("🔍 Testing MCP Server Connection...\n");

const ws = new WebSocket("ws://localhost:3001");

let connected = false;

ws.on("open", () => {
  console.log("✅ WebSocket connection established");
  connected = true;

  // Send initialize message
  const initMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "LOFERSIL Test Client",
        version: "1.0.0",
      },
    },
  };

  console.log("📤 Sending initialize message...");
  ws.send(JSON.stringify(initMessage));
});

ws.on("message", (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log("📥 Received response:", JSON.stringify(response, null, 2));

    if (response.id === 1 && response.result) {
      console.log("✅ MCP protocol initialized successfully");

      // Request tools list
      const toolsMessage = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      };

      console.log("🛠️  Requesting tools list...");
      ws.send(JSON.stringify(toolsMessage));
    }

    if (response.id === 2 && response.result) {
      console.log("\n🎉 SUCCESS! MCP Tools discovered:");
      const tools = response.result.tools;

      console.log(`\n📊 Found ${tools.length} tools:\n`);

      tools.forEach((tool, index) => {
        console.log(`${index + 1}. 📦 ${tool.name}`);
        console.log(`   Description: ${tool.description || "No description"}`);

        if (tool.inputSchema) {
          console.log(`   Input Schema:`);
          console.log(`   ${JSON.stringify(tool.inputSchema, null, 4)}`);
        }

        console.log("");
      });

      // Test a tool
      if (tools.length > 0) {
        const echoTool = tools.find((t) => t.name === "echo");
        if (echoTool) {
          console.log("⚡ Testing echo tool...");
          const toolCallMessage = {
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: "echo",
              arguments: {
                message: "Hello from MCP Client!",
              },
            },
          };

          ws.send(JSON.stringify(toolCallMessage));
        }
      }
    }

    if (response.id === 3 && response.result) {
      console.log("\n✅ Tool execution result:");
      console.log(JSON.stringify(response.result, null, 2));

      // Request resources
      const resourcesMessage = {
        jsonrpc: "2.0",
        id: 4,
        method: "resources/list",
        params: {},
      };

      console.log("\n📁 Requesting resources list...");
      ws.send(JSON.stringify(resourcesMessage));
    }

    if (response.id === 4 && response.result) {
      console.log("\n📄 Resources discovered:");
      const resources = response.result.resources;

      resources.forEach((resource, index) => {
        console.log(`${index + 1}. 📄 ${resource.name || resource.uri}`);
        console.log(`   URI: ${resource.uri}`);
        console.log(`   MIME Type: ${resource.mimeType || "unknown"}`);
        console.log("");
      });

      // Request prompts
      const promptsMessage = {
        jsonrpc: "2.0",
        id: 5,
        method: "prompts/list",
        params: {},
      };

      console.log("💬 Requesting prompts list...");
      ws.send(JSON.stringify(promptsMessage));
    }

    if (response.id === 5 && response.result) {
      console.log("\n🗣️  Prompts discovered:");
      const prompts = response.result.prompts;

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

      console.log("🎉 MCP Discovery Complete!");
      console.log("\n📋 Summary:");
      console.log(`   ✅ MCP Server: Connected and working`);
      console.log(`   ✅ Protocol: MCP 2024-11-05`);
      console.log(`   ✅ Tools: ${tools.length} available`);
      console.log(`   ✅ Resources: ${resources.length} available`);
      console.log(`   ✅ Prompts: ${prompts.length} available`);

      setTimeout(() => {
        console.log("\n🔌 Closing connection...");
        ws.close();
      }, 1000);
    }
  } catch (e) {
    console.log("❌ Failed to parse response:", e.message);
  }
});

ws.on("error", (error) => {
  console.log("❌ WebSocket error:", error.message);
  if (!connected) {
    console.log("💡 This might mean:");
    console.log("   - MCP server is not running");
    console.log("   - Server expects different protocol");
    console.log("   - Authentication required");
  }
});

ws.on("close", () => {
  console.log("🔌 WebSocket connection closed");
  setTimeout(() => process.exit(0), 100);
});

// Timeout after 15 seconds
setTimeout(() => {
  if (!connected) {
    console.log("⏰ Connection timeout");
    console.log(
      "💡 Server might not be responding or requires different configuration",
    );
  }
  process.exit(1);
}, 15000);
