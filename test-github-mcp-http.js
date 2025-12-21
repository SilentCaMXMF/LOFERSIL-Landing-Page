import { HTTPMCPClient } from "./src/scripts/modules/mcp/http-client.js";
import { ErrorManager } from "./src/scripts/modules/ErrorManager.js";

async function testGitHubMCP() {
  const errorHandler = new ErrorManager();

  const client = new HTTPMCPClient(
    {
      serverUrl: "https://api.githubcopilot.com/mcp/",
      clientInfo: { name: "Test Client", version: "1.0.0" },
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      },
      enableLogging: true,
    },
    errorHandler,
  );

  try {
    console.log("🚀 Connecting to GitHub MCP Server via HTTP...");
    await client.connect();
    console.log("✅ Connected successfully!");

    const capabilities = await client.initialize();
    console.log("🔧 Server capabilities:", capabilities);

    const tools = await client.listTools();
    console.log(`🛠️ Available tools: ${tools.length}`);
    console.log(
      "Sample tools:",
      tools.slice(0, 5).map((t) => t.name),
    );
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.destroy();
  }
}

// Call the test function
testGitHubMCP();
