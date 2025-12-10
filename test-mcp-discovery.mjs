import { MCPClient } from "./src/scripts/modules/mcp/client.js";
import { ErrorManager } from "./src/scripts/modules/ErrorManager.js";

async function testMCPTools() {
  console.log("🔍 Testing MCP Tools Discovery...\n");

  try {
    const errorHandler = new ErrorManager();

    const client = new MCPClient(
      {
        serverUrl: "ws://localhost:3001",
        clientInfo: {
          name: "LOFERSIL Test Client",
          version: "1.0.0",
        },
        connectionTimeout: 5000,
        reconnection: {
          maxAttempts: 2,
          initialDelay: 500,
          maxDelay: 2000,
          backoffMultiplier: 1.5,
        },
      },
      errorHandler,
    );

    console.log("📡 Connecting to MCP server...");
    await client.connect();
    console.log("✅ Connected successfully!");

    console.log("🔧 Initializing protocol...");
    const capabilities = await client.initialize();
    console.log("✅ Protocol initialized");
    console.log(
      "   Protocol Version:",
      capabilities.protocolVersion || "2024-11-05",
    );

    console.log("\n🛠️  Discovering available tools...");
    const tools = await client.listTools();

    if (tools.length === 0) {
      console.log("❌ No tools found on server");
    } else {
      console.log(`✅ Found ${tools.length} tools:\n`);

      tools.forEach((tool, index) => {
        console.log(`${index + 1}. 📦 ${tool.name}`);
        console.log(`   Description: ${tool.description || "No description"}`);

        if (tool.inputSchema) {
          console.log("   Input Schema:");
          console.log("   " + JSON.stringify(tool.inputSchema, null, 4));
        }

        console.log("");
      });

      // Test executing a tool
      if (tools.length > 0) {
        const echoTool = tools.find((t) => t.name === "echo");
        if (echoTool) {
          console.log("⚡ Testing echo tool...");
          const result = await client.callTool("echo", {
            message: "Hello from MCP Client!",
          });

          console.log("✅ Tool executed successfully:");
          console.log("Result:", JSON.stringify(result, null, 2));
        }
      }
    }

    console.log("\n📁 Discovering available resources...");
    try {
      const resources = await client.listResources();

      if (resources.length === 0) {
        console.log("❌ No resources found on server");
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

    console.log("\n💬 Discovering available prompts...");
    try {
      const prompts = await client.listPrompts();

      if (prompts.length === 0) {
        console.log("❌ No prompts found on server");
      } else {
        console.log(`✅ Found ${prompts.length} prompts:\n`);

        prompts.forEach((prompt, index) => {
          console.log(`${index + 1}. 🗣️  ${prompt.name}`);
          console.log(
            `   Description: ${prompt.description || "No description"}`,
          );

          if (prompt.arguments && prompt.arguments.length > 0) {
            console.log("   Arguments:");
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
    console.log("\n📊 Client Status:");
    const status = client.getStatus();
    console.log("   State:", status.state);
    console.log("   Connected At:", status.connectedAt);
    console.log("   Connection Attempts:", status.connectionAttempts);
    console.log("   Active Requests:", status.activeRequests);

    // Get metrics
    console.log("\n📈 Performance Metrics:");
    const metrics = client.getMetrics();
    console.log("   Total Requests:", metrics.totalRequests);
    console.log("   Successful Requests:", metrics.successfulRequests);
    console.log("   Failed Requests:", metrics.failedRequests);
    console.log(
      "   Average Response Time:",
      metrics.averageResponseTime.toFixed(2) + "ms",
    );

    // Disconnect
    console.log("\n🔌 Disconnecting from MCP server...");
    await client.disconnect();
    console.log("✅ Disconnected successfully");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

testMCPTools();
