/**
 * Enhanced MCP Server for GitHub Issues Reviewer
 * With improved code analysis and issue classification
 */

import { WebSocketServer, WebSocket } from "ws";
import { createServer as createHttpServer } from "http";

interface SimpleMCPRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: any;
}

interface SimpleMCPResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class EnhancedMCPServer {
  private wss: WebSocketServer;
  private requestId: number = 1;

  constructor(port: number = 3001) {
    const httpServer = createHttpServer();

    this.wss = new WebSocketServer({
      server: httpServer,
      path: "/mcp",
    });

    this.setupHandlers();

    httpServer.listen(port, () => {
      console.log(
        `🚀 Enhanced MCP Server running on ws://localhost:${port}/mcp`,
      );
      console.log(`📊 Server: GitHub Issues Reviewer MCP Server v1.0.0`);
    });
  }

  private setupHandlers(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("🔌 MCP client connected");

      ws.on("message", async (data: Buffer) => {
        try {
          const request: SimpleMCPRequest = JSON.parse(data.toString());
          await this.handleRequest(ws, request);
        } catch (error) {
          console.error("❌ Error parsing request:", error);
          this.sendError(ws, -32700, "Parse error");
        }
      });

      ws.on("close", () => {
        console.log("🔌 MCP client disconnected");
      });

      ws.on("error", (error) => {
        console.error("❌ WebSocket error:", error);
      });
    });
  }

  private async handleRequest(
    ws: WebSocket,
    request: SimpleMCPRequest,
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
      this.sendError(ws, -32603, "Internal error", request.id);
    }
  }

  private async handleInitialize(
    ws: WebSocket,
    request: SimpleMCPRequest,
  ): Promise<void> {
    const result = {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {
          experimental: {
            code_review: true,
            issue_analysis: true,
            solution_generation: true,
          },
        },
      },
      serverInfo: {
        name: "GitHub Issues Reviewer MCP Server",
        version: "1.0.0",
      },
    };

    this.sendResponse(ws, request.id, result);
    console.log("✅ MCP client initialized");
  }

  private async handleToolsList(
    ws: WebSocket,
    request: SimpleMCPRequest,
  ): Promise<void> {
    const tools = [
      {
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
              enum: [
                "javascript",
                "typescript",
                "python",
                "java",
                "go",
                "rust",
              ],
              description: "Programming language of code",
            },
            analysis_type: {
              type: "string",
              enum: ["security", "quality", "performance", "comprehensive"],
              description: "Type of analysis to perform",
            },
          },
          required: ["code"],
        },
      },
      {
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
          },
          required: ["title", "body"],
        },
      },
      {
        name: "generate_solution",
        description:
          "Generate comprehensive code solutions for GitHub issues based on requirements, code analysis, and best practices",
        inputSchema: {
          type: "object",
          properties: {
            issue_title: {
              type: "string",
              description: "Issue title",
            },
            issue_body: {
              type: "string",
              description: "Issue body/description",
            },
            programming_language: {
              type: "string",
              enum: [
                "javascript",
                "typescript",
                "python",
                "java",
                "go",
                "rust",
              ],
              description: "Programming language for the solution",
            },
            existing_code: {
              type: "string",
              description: "Existing code context (optional)",
            },
            requirements: {
              type: "array",
              items: { type: "string" },
              description: "Specific requirements for the solution",
            },
            acceptance_criteria: {
              type: "array",
              items: { type: "string" },
              description: "Acceptance criteria for the solution",
            },
          },
          required: ["issue_title", "issue_body", "programming_language"],
        },
      },
    ];

    this.sendResponse(ws, request.id, { tools });
    console.log(`🔨 Listed ${tools.length} tools`);
  }

  private async handleToolCall(
    ws: WebSocket,
    request: SimpleMCPRequest,
  ): Promise<void> {
    const { name, arguments: args } = request.params;

    console.log(`⚡ Calling tool: ${name}`);

    try {
      let result;
      switch (name) {
        case "analyze_code":
          result = await this.analyzeCode(args);
          break;

        case "classify_issue":
          result = await this.classifyIssue(args);
          break;

        case "generate_solution":
          result = await this.generateSolution(args);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      this.sendResponse(ws, request.id, result);
      console.log(`✅ Tool ${name} executed successfully`);
    } catch (error) {
      console.error(`❌ Tool ${name} execution failed:`, error);
      this.sendError(ws, -32603, "Tool execution failed", request.id);
    }
  }

  private async analyzeCode(args: any): Promise<any> {
    const {
      code,
      language = "unknown",
      analysis_type = "comprehensive",
    } = args;

    // Enhanced code analysis
    const issues: any[] = [];

    // Security analysis
    if (analysis_type === "comprehensive" || analysis_type === "security") {
      if (code.includes("eval(")) {
        issues.push({
          type: "security",
          severity: "critical",
          message: "Use of eval() function detected",
          recommendation: "Replace eval() with safer alternatives",
        });
      }

      if (code.includes("innerHTML")) {
        issues.push({
          type: "security",
          severity: "high",
          message: "Potential XSS vulnerability with innerHTML",
          recommendation: "Use textContent or sanitize HTML",
        });
      }

      if (code.includes("document.write")) {
        issues.push({
          type: "security",
          severity: "high",
          message: "Use of document.write() can lead to XSS",
          recommendation: "Use DOM manipulation methods instead",
        });
      }
    }

    // Quality analysis
    if (analysis_type === "comprehensive" || analysis_type === "quality") {
      if (code.includes("console.log")) {
        issues.push({
          type: "quality",
          severity: "low",
          message: "Console.log statement found",
          suggestion: "Remove or replace with proper logging",
        });
      }

      if (code.includes("debugger")) {
        issues.push({
          type: "quality",
          severity: "medium",
          message: "Debugger statement found",
          suggestion: "Remove debugger statements before production",
        });
      }

      if (code.includes("TODO") || code.includes("FIXME")) {
        issues.push({
          type: "quality",
          severity: "medium",
          message: "Development comment found",
          suggestion: "Address TODO/FIXME items before deployment",
        });
      }
    }

    // Performance analysis
    if (analysis_type === "comprehensive" || analysis_type === "performance") {
      if (code.includes("for...in") && code.includes("length")) {
        issues.push({
          type: "performance",
          severity: "medium",
          message: "Inefficient array iteration in for...in loop",
          optimization:
            "Use for...of, forEach, or traditional for loop with index",
        });
      }
    }

    // Calculate metrics
    const securityIssues = issues.filter((i) => i.type === "security");
    const qualityIssues = issues.filter((i) => i.type === "quality");
    const performanceIssues = issues.filter((i) => i.type === "performance");
    const criticalIssues = issues.filter((i) => i.severity === "critical");

    const securityScore = Math.max(0, 1 - securityIssues.length * 0.2);
    const qualityScore = Math.max(0, 1 - qualityIssues.length * 0.1);
    const performanceScore = Math.max(0, 1 - performanceIssues.length * 0.15);

    const lines = code.split("\n");
    const loc = lines.filter(
      (line) => line.trim() && !line.trim().startsWith("//"),
    ).length;

    // Generate summary
    let summary = `Code analysis completed for ${language} code. Found ${issues.length} issues: `;
    summary += `${securityIssues.length} security, ${qualityIssues.length} quality, ${performanceIssues.length} performance. `;

    if (criticalIssues.length > 0) {
      summary += `${criticalIssues.length} critical issues require immediate attention. `;
    }

    summary += `Overall security score: ${(securityScore * 100).toFixed(1)}%, `;
    summary += `quality score: ${(qualityScore * 100).toFixed(1)}%, `;
    summary += `performance score: ${(performanceScore * 100).toFixed(1)}%.`;

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalIssues.length > 0) {
      recommendations.push(
        "🚨 Address critical security vulnerabilities immediately",
      );
    }
    if (securityScore < 0.7) {
      recommendations.push("🔒 Improve security by addressing vulnerabilities");
    }
    if (qualityScore < 0.7) {
      recommendations.push(
        "📝 Improve code quality by addressing style issues",
      );
    }
    if (performanceScore < 0.7) {
      recommendations.push("⚡ Optimize performance by addressing bottlenecks");
    }
    if (securityScore < 0.7) {
      recommendations.push("🔒 Improve security by addressing vulnerabilities");
    }
    if (qualityScore < 0.7) {
      recommendations.push(
        "📝 Improve code quality by addressing style issues",
      );
    }
    if (performanceScore < 0.7) {
      recommendations.push("⚡ Optimize performance by addressing bottlenecks");
    }

    return {
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
      analysis: {
        language,
        analysis_type,
        issues,
        metrics: {
          complexity_score: Math.min(1, loc / 100),
          maintainability_index: 0.8,
          test_coverage_estimate: 0.6,
          security_score: securityScore,
          performance_score: performanceScore,
          lines_of_code: loc,
        },
        recommendations,
      },
    };
  }

  private async classifyIssue(args: any): Promise<any> {
    const { title, body, labels = [] } = args;

    // Enhanced issue classification
    let category = "bug";
    let complexity = "medium";
    let feasibility = true;
    let confidence = 0.8;

    const text = (title + " " + body).toLowerCase();

    // Category classification
    if (
      text.includes("feature") ||
      text.includes("add") ||
      text.includes("implement") ||
      text.includes("enhancement")
    ) {
      category = "feature";
    } else if (
      text.includes("documentation") ||
      text.includes("docs") ||
      text.includes("readme")
    ) {
      category = "documentation";
    } else if (
      text.includes("question") ||
      text.includes("how to") ||
      text.includes("help")
    ) {
      category = "question";
      feasibility = false;
      confidence = 0.9;
    } else if (
      text.includes("security") ||
      text.includes("vulnerability") ||
      text.includes("xss")
    ) {
      category = "security";
      complexity = "high";
    } else if (
      text.includes("performance") ||
      text.includes("slow") ||
      text.includes("optimization")
    ) {
      category = "performance";
      complexity = "high";
    } else if (
      text.includes("refactor") ||
      text.includes("cleanup") ||
      text.includes("technical debt")
    ) {
      category = "maintenance";
    }

    // Complexity assessment
    if (
      text.includes("critical") ||
      text.includes("urgent") ||
      text.includes("production") ||
      labels.includes("critical")
    ) {
      complexity = "critical";
    } else if (
      text.includes("complex") ||
      text.includes("epic") ||
      text.includes("architecture")
    ) {
      complexity = "high";
    } else if (
      text.includes("simple") ||
      text.includes("easy") ||
      text.includes("good-first-issue") ||
      text.includes("beginner")
    ) {
      complexity = "low";
    }

    // Extract requirements
    const issueRequirements: string[] = [];
    if (category === "feature") {
      issueRequirements.push("Implement new functionality");
      issueRequirements.push("Add tests");
      issueRequirements.push("Update documentation");
    } else if (category === "bug") {
      issueRequirements.push("Identify root cause");
      issueRequirements.push("Fix issue");
      issueRequirements.push("Add regression tests");
    } else if (category === "security") {
      issueRequirements.push("Address security vulnerability");
      issueRequirements.push("Security review");
      issueRequirements.push("Penetration testing");
    }

    // Generate acceptance criteria
    const acceptanceCriteria: string[] = [];
    if (category === "feature") {
      acceptanceCriteria.push("Feature works as expected");
      acceptanceCriteria.push("Tests pass");
      acceptanceCriteria.push("Documentation updated");
    } else if (category === "bug") {
      acceptanceCriteria.push("Bug is fixed");
      acceptanceCriteria.push("No regression");
      acceptanceCriteria.push("Tests pass");
    } else if (category === "security") {
      acceptanceCriteria.push("Security vulnerability is addressed");
      acceptanceCriteria.push("Security review completed");
      acceptanceCriteria.push("Penetration tests pass");
    } else if (category === "performance") {
      acceptanceCriteria.push("Performance issue is resolved");
      acceptanceCriteria.push("Benchmarks show improvement");
      acceptanceCriteria.push("No regression in other areas");
    }

    // Estimate effort
    let effortHours = 8;
    if (complexity === "low") effortHours = 4;
    else if (complexity === "medium") effortHours = 8;
    else if (complexity === "high") effortHours = 16;
    else if (complexity === "critical") effortHours = 32;

    return {
      content: [
        {
          type: "text",
          text: `Issue classified as ${category} with ${complexity} complexity (confidence: ${(confidence * 100).toFixed(0)}%)`,
        },
      ],
      classification: {
        category,
        complexity,
        feasibility,
        confidence,
        requirements: issueRequirements,
        acceptance_criteria: acceptanceCriteria,
        estimated_effort: {
          hours: effortHours,
          complexity_level: complexity,
        },
        reasoning: `Classified based on title, body, and labels analysis. Category: ${category}, Complexity: ${complexity}, Feasibility: ${feasibility}`,
      },
    };
  }

  private sendResponse(ws: WebSocket, id: number, result: any): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    code: number,
    message: string,
    id?: number,
  ): void {
    const response: SimpleMCPResponse = {
      jsonrpc: "2.0",
      id: id || 0,
      error: {
        code,
        message,
      },
    };
    ws.send(JSON.stringify(response));
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
  const server = new EnhancedMCPServer(port);

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

export { EnhancedMCPServer };
