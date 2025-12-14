#!/usr/bin/env node

/**
 * Simple MCP Server for Testing
 */

const { WebSocketServer } = require("ws");

const WS_PORT = 3001;

const tools = [
  {
    name: "echo",
    description: "Echo back the provided message",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to echo back" },
      },
      required: ["message"],
    },
  },
  {
    name: "list_files",
    description: "List files in current directory",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path", default: "." },
      },
    },
  },
  {
    name: "get_time",
    description: "Get current server time",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "read_file",
    description: "Read file contents",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to write" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
  },
];

const resources = [
  {
    uri: "server://info",
    name: "Server Information",
    mimeType: "application/json",
    description: "Basic server information",
  },
];

const prompts = [
  {
    name: "summarize",
    description: "Create a summary prompt",
    arguments: [
      {
        name: "text",
        description: "Text to summarize",
        required: true,
      },
    ],
  },
];

function handleRequest(message, ws) {
  try {
    const data = JSON.parse(message);
    console.log("📥 Received:", data.method);

    const response = {
      jsonrpc: "2.0",
      id: data.id,
    };

    switch (data.method) {
      case "initialize":
        response.result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: "LOFERSIL Test MCP Server", version: "1.0.0" },
        };
        break;

      case "tools/list":
        response.result = { tools };
        break;

      case "tools/call":
        response.result = handleToolCall(data.params);
        break;

      case "resources/list":
        response.result = { resources };
        break;

      case "resources/read":
        response.result = handleResourceRead(data.params);
        break;

      case "prompts/list":
        response.result = { prompts };
        break;

      case "prompts/get":
        response.result = handlePromptGet(data.params);
        break;

      default:
        response.error = {
          code: -32601,
          message: `Method not found: ${data.method}`,
        };
    }

    console.log("📤 Sending response");
    ws.send(JSON.stringify(response));
  } catch (error) {
    console.error("❌ Error:", error.message);
    ws.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: data.id || null,
        error: { code: -32603, message: "Internal error" },
      }),
    );
  }
}

function handleToolCall(params) {
  const { name, arguments: args } = params;
  console.log(`🔨 Executing: ${name}`, args);

  switch (name) {
    case "echo":
      return {
        content: [{ type: "text", text: `Echo: ${args.message}` }],
        isError: false,
      };

    case "list_files":
      try {
        const fs = require("fs");
        const files = fs.readdirSync(args.path || ".");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ files, count: files.length }, null, 2),
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }

    case "get_time":
      return {
        content: [{ type: "text", text: new Date().toISOString() }],
        isError: false,
      };

    case "read_file":
      try {
        const fs = require("fs");
        const content = fs.readFileSync(args.path, "utf8");
        return {
          content: [{ type: "text", text: content }],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }

    case "write_file":
      try {
        const fs = require("fs");
        fs.writeFileSync(args.path, args.content, "utf8");
        return {
          content: [
            {
              type: "text",
              text: `Successfully wrote ${args.content.length} characters to ${args.path}`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
}

function handleResourceRead(params) {
  const { uri } = params;
  if (uri === "server://info") {
    return {
      uri,
      content: JSON.stringify(
        {
          name: "LOFERSIL Test MCP Server",
          version: "1.0.0",
          tools: tools.length,
          resources: resources.length,
          prompts: prompts.length,
          uptime: process.uptime(),
          nodeVersion: process.version,
        },
        null,
        2,
      ),
      mimeType: "application/json",
    };
  }

  throw new Error(`Resource not found: ${uri}`);
}

function handlePromptGet(params) {
  const { name, arguments: args } = params;
  if (name === "summarize") {
    return {
      description: "Summary generation prompt",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please summarize the following text:\n\n${args.text}`,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt not found: ${name}`);
}

// Install ws if needed
try {
  require("ws");
} catch {
  console.log("📦 Installing ws package...");
  require("child_process").execSync("npm install ws", { stdio: "inherit" });
}

// Start server
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
  console.log("🔌 MCP Client connected");

  ws.on("message", (message) => {
    handleRequest(message.toString(), ws);
  });

  ws.on("close", () => {
    console.log("🔌 Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });
});

console.log(`🚀 MCP Server running on ws://localhost:${WS_PORT}`);
console.log(`🛠️  Available tools: ${tools.length}`);
tools.forEach((tool, i) => {
  console.log(`   ${i + 1}. ${tool.name} - ${tool.description}`);
});
console.log(`📁 Available resources: ${resources.length}`);
console.log(`💬 Available prompts: ${prompts.length}`);
