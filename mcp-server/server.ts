/**
 * Enhanced MCP Server for GitHub Issues Reviewer
 *
 * Comprehensive MCP server implementation with tools for:
 * - Code analysis and security scanning
 * - Issue classification and complexity assessment
 * - Solution generation and test creation
 */

import { WebSocketServer, WebSocket } from "ws";
import { createServer as createHttpServer } from "http";
import {
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPToolResult,
  MCPServerInfo,
  MCPCapabilities,
  MCPInitializeResult,
  CodeAnalysisInput,
  IssueClassificationInput,
  SolutionGenerationInput,
  TestGenerationInput,
} from "./types/index.js";

class MCPServer {
  private wss: WebSocketServer;
  private serverInfo: MCPServerInfo;
  private capabilities: MCPCapabilities;
  private tools: Map<string, MCPTool> = new Map();
  private requestId: number = 1;

  constructor(port: number = 3001) {
    this.serverInfo = {
      name: "GitHub Issues Reviewer MCP Server",
      version: "1.0.0",
    };

    this.capabilities = {
      tools: {},
      resources: {},
      prompts: {
        experimental: {
          code_review: true,
          issue_analysis: true,
          solution_generation: true,
        },
      },
    };

    // Create HTTP server
    const httpServer = createHttpServer();

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: httpServer,
      path: "/mcp",
    });

    this.setupWebSocketHandlers();
    this.registerTools();

    // Start server
    httpServer.listen(port, () => {
      console.log(
        `🚀 Enhanced MCP Server running on ws://localhost:${port}/mcp`,
      );
      console.log(
        `📊 Server: ${this.serverInfo.name} v${this.serverInfo.version}`,
      );
      console.log(`🔧 Tools registered: ${this.tools.size}`);
    });
  }

  private setupWebSocketHandlers(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("🔌 MCP client connected");

      ws.on("message", async (data: Buffer) => {
        try {
          const request: MCPRequest = JSON.parse(data.toString());
          await this.handleRequest(ws, request);
        } catch (error) {
          console.error("❌ Error parsing request:", error);
          this.sendError(ws, -32700, "Parse error", null);
        }
      });

      ws.on("close", () => {
        console.log("🔌 MCP client disconnected");
      });

      ws.on("error", (error) => {
        console.error("❌ WebSocket error:", error);
      });
    });

    this.wss.on("error", (error) => {
      console.error("❌ WebSocket server error:", error);
    });
  }

  private async handleRequest(
    ws: WebSocket,
    request: MCPRequest,
  ): Promise<void> {
    console.log(`📨 Received request: ${request.method}`);

    try {
      switch (request.method) {
        case "initialize":
          await this.handleInitialize(ws, request);
          break;

        case "tools/list":
          await this.handleToolsList(ws, request);
          break;

        case "tools/call":
          await this.handleToolCall(ws, request);
          break;

        case "ping":
          this.sendResponse(ws, request.id, { pong: true });
          break;

        default:
          this.sendError(ws, -32601, "Method not found", request.id);
      }
    } catch (error) {
      console.error(`❌ Error handling ${request.method}:`, error);
      this.sendError(ws, -32603, "Internal error", request.id, error);
    }
  }

  private async handleInitialize(
    ws: WebSocket,
    request: MCPRequest,
  ): Promise<void> {
    const result: MCPInitializeResult = {
      protocolVersion: "2024-11-05",
      capabilities: this.capabilities,
      serverInfo: this.serverInfo,
    };

    this.sendResponse(ws, request.id, result);
    console.log("✅ MCP client initialized");
  }

  private async handleToolsList(
    ws: WebSocket,
    request: MCPRequest,
  ): Promise<void> {
    const tools = Array.from(this.tools.values());
    this.sendResponse(ws, request.id, { tools });
    console.log(`🔨 Listed ${tools.length} tools`);
  }

  private async handleToolCall(
    ws: WebSocket,
    request: MCPRequest,
  ): Promise<void> {
    const { name, arguments: args } = request.params;

    if (!this.tools.has(name)) {
      this.sendError(ws, -32602, "Tool not found", request.id, { tool: name });
      return;
    }

    console.log(`⚡ Calling tool: ${name}`);

    try {
      const result = await this.executeTool(name, args);
      this.sendResponse(ws, request.id, result);
      console.log(`✅ Tool ${name} executed successfully`);
    } catch (error) {
      console.error(`❌ Tool ${name} execution failed:`, error);
      this.sendError(ws, -32603, "Tool execution failed", request.id, error);
    }
  }

  private async executeTool(
    toolName: string,
    args: any,
  ): Promise<MCPToolResult> {
    switch (toolName) {
      case "analyze_code":
        return this.analyzeCode(args as CodeAnalysisInput);

      case "classify_issue":
        return this.classifyIssue(args as IssueClassificationInput);

      case "generate_solution":
        return this.generateSolution(args as SolutionGenerationInput);

      case "generate_tests":
        return this.generateTests(args as TestGenerationInput);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private sendResponse(ws: WebSocket, id: string | number, result: any): void {
    const response: MCPResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    id: string | number | null,
    code: number,
    message: string,
    data?: any,
  ): void {
    const response: MCPResponse = {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data,
      },
    };
    ws.send(JSON.stringify(response));
  }

  private registerTools(): void {
    // Code Analysis Tool
    this.tools.set("analyze_code", {
      name: "analyze_code",
      description:
        "Analyze code for security vulnerabilities, quality issues, and performance problems",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The code to analyze",
          },
          language: {
            type: "string",
            enum: ["javascript", "typescript", "python", "java", "go", "rust"],
            description: "Programming language of the code",
          },
          analysis_type: {
            type: "string",
            enum: ["security", "quality", "performance", "comprehensive"],
            description: "Type of analysis to perform",
          },
          file_path: {
            type: "string",
            description: "File path for context (optional)",
          },
        },
        required: ["code"],
      },
    });

    // Issue Classification Tool
    this.tools.set("classify_issue", {
      name: "classify_issue",
      description:
        "Classify GitHub issues by category, complexity, and feasibility",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Issue title",
          },
          body: {
            type: "string",
            description: "Issue body/description",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Issue labels (optional)",
          },
          assignee: {
            type: "string",
            description: "Issue assignee (optional)",
          },
        },
        required: ["title", "body"],
      },
    });

    // Solution Generation Tool
    this.tools.set("generate_solution", {
      name: "generate_solution",
      description: "Generate code solutions for classified issues",
      inputSchema: {
        type: "object",
        properties: {
          issue_analysis: {
            type: "object",
            description: "Analysis result from classify_issue tool",
          },
          codebase_context: {
            type: "object",
            properties: {
              language: { type: "string" },
              framework: { type: "string" },
              patterns: { type: "array", items: { type: "string" } },
            },
          },
        },
        required: ["issue_analysis"],
      },
    });

    // Test Generation Tool
    this.tools.set("generate_tests", {
      name: "generate_tests",
      description: "Generate unit tests for given code",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Code to generate tests for",
          },
          test_framework: {
            type: "string",
            enum: ["jest", "vitest", "mocha", "jasmine"],
            description: "Test framework to use",
          },
          file_path: {
            type: "string",
            description: "File path for context (optional)",
          },
          coverage_target: {
            type: "number",
            description: "Target coverage percentage (optional)",
          },
        },
        required: ["code"],
      },
    });
  }

  // Tool implementations will be added in subsequent tasks
  private async analyzeCode(input: CodeAnalysisInput): Promise<MCPToolResult> {
    // Placeholder implementation - will be enhanced in Task 2
    return {
      content: [
        {
          type: "text",
          text: `Code analysis placeholder for ${input.language || "unknown"} code. Analysis type: ${input.analysis_type || "comprehensive"}`,
        },
      ],
    };
  }

  private async classifyIssue(
    input: IssueClassificationInput,
  ): Promise<MCPToolResult> {
    // Placeholder implementation - will be enhanced in Task 3
    return {
      content: [
        {
          type: "text",
          text: `Issue classification placeholder for: "${input.title}"`,
        },
      ],
    };
  }

  private async generateSolution(
    input: SolutionGenerationInput,
  ): Promise<MCPToolResult> {
    // Placeholder implementation - will be enhanced in Task 4
    return {
      content: [
        {
          type: "text",
          text: `Solution generation placeholder for issue category: ${input.issue_analysis?.category || "unknown"}`,
        },
      ],
    };
  }

  private async generateTests(
    input: TestGenerationInput,
  ): Promise<MCPToolResult> {
    // Placeholder implementation - will be enhanced in Task 5
    return {
      content: [
        {
          type: "text",
          text: `Test generation placeholder for ${input.test_framework || "jest"} framework`,
        },
      ],
    };
  }

  public shutdown(): void {
    console.log("🛑 Shutting down MCP server...");
    this.wss.close(() => {
      console.log("✅ MCP server shutdown complete");
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.MCP_SERVER_PORT
    ? parseInt(process.env.MCP_SERVER_PORT)
    : 3001;
  const server = new MCPServer(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    server.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    server.shutdown();
    process.exit(0);
  });
}

export { MCPServer };
