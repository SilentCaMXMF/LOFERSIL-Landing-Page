/**
 * MCP Server Tools Integration Tests
 * Tests all MCP tools (analyze_code, classify_issue, generate_solution, generate_tests) with real server
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket } from "ws";
import { MCPServer } from "../../mcp-server/server.js";

describe("MCP Server Tools Integration Tests", () => {
  let server;
  let testPort = 3002; // Use different port for tests
  let wsUrl = `ws://localhost:${testPort}/mcp`;

  beforeAll(async () => {
    // Start MCP server on test port
    server = new MCPServer(testPort);

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 100));
  }, 10000);

  afterAll(async () => {
    // Shutdown server
    if (server && server.shutdown) {
      server.shutdown();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("Server Initialization", () => {
    it("should initialize MCP connection successfully", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send initialize request
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };

          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.result).toBeDefined();
          expect(response.result.protocolVersion).toBe("2024-11-05");
          expect(response.result.serverInfo.name).toBe(
            "GitHub Issues Reviewer MCP Server",
          );
          expect(response.result.capabilities).toBeDefined();

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error("Connection timeout")), 5000);
      });
    });
  });

  describe("Tools Listing", () => {
    it("should list all available tools", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // First initialize
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };
          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Initialize response - now request tools list
            const toolsRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/list",
            };
            ws.send(JSON.stringify(toolsRequest));
          } else if (messageCount === 2) {
            // Tools list response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.result).toBeDefined();
            expect(response.result.tools).toBeDefined();
            expect(Array.isArray(response.result.tools)).toBe(true);
            expect(response.result.tools.length).toBe(4); // Should have 4 tools

            // Check tool names
            const toolNames = response.result.tools.map((tool) => tool.name);
            expect(toolNames).toContain("analyze_code");
            expect(toolNames).toContain("classify_issue");
            expect(toolNames).toContain("generate_solution");
            expect(toolNames).toContain("generate_tests");

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });
  });

  describe("analyze_code Tool", () => {
    it("should analyze JavaScript code successfully", async () => {
      const ws = new WebSocket(wsUrl);
      const testCode = `
function insecureFunction(userInput) {
  eval(userInput); // Security vulnerability
  console.log("This is test code");
}
      `.trim();

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // Initialize first
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };
          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Initialize response - now call analyze_code tool
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "analyze_code",
                arguments: {
                  code: testCode,
                  language: "javascript",
                  analysis_type: "security",
                },
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Tool response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.result).toBeDefined();
            expect(response.result.content).toBeDefined();
            expect(Array.isArray(response.result.content)).toBe(true);
            expect(response.result.content.length).toBeGreaterThan(0);

            // Check that it returns some analysis text
            const content = response.result.content[0];
            expect(content.type).toBe("text");
            expect(content.text).toBeDefined();
            expect(typeof content.text).toBe("string");
            expect(content.text.length).toBeGreaterThan(0);

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should handle missing required parameters", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // Initialize first
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };
          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Initialize response - now call analyze_code tool without required code parameter
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "analyze_code",
                arguments: {
                  language: "javascript", // Missing code parameter
                },
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Should get an error response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.error).toBeDefined();
            expect(response.error.code).toBe(-32603); // Internal error
            expect(response.error.message).toContain("Tool execution failed");

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });
  });

  describe("classify_issue Tool", () => {
    it("should classify a bug report successfully", async () => {
      const ws = new WebSocket(wsUrl);
      const issueData = {
        title: "Login button not working on mobile",
        body: "When users try to log in on mobile devices, the login button doesn't respond to clicks. This happens on both iOS Safari and Chrome mobile. Desktop version works fine.",
        labels: ["bug", "mobile", "urgent"],
      };

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // Initialize first
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };
          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Initialize response - now call classify_issue tool
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "classify_issue",
                arguments: issueData,
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Tool response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.result).toBeDefined();
            expect(response.result.content).toBeDefined();
            expect(Array.isArray(response.result.content)).toBe(true);

            const content = response.result.content[0];
            expect(content.type).toBe("text");
            expect(content.text).toBeDefined();
            expect(content.text).toContain("Login button not working");

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });
  });

  describe("generate_solution Tool", () => {
    it("should generate solution for classified issue", async () => {
      const ws = new WebSocket(wsUrl);
      const issueAnalysis = {
        category: "bug",
        complexity: "medium",
        requirements: ["Fix mobile login button", "Test on multiple devices"],
        feasibility: true,
      };

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // Initialize first
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };
          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Initialize response - now call generate_solution tool
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "generate_solution",
                arguments: {
                  issue_analysis: issueAnalysis,
                },
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Tool response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.result).toBeDefined();
            expect(response.result.content).toBeDefined();

            const content = response.result.content[0];
            expect(content.type).toBe("text");
            expect(content.text).toBeDefined();
            expect(content.text).toContain("bug");

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });
  });

  describe("generate_tests Tool", () => {
    it("should generate tests for JavaScript function", async () => {
      const ws = new WebSocket(wsUrl);
      const testCode = `
function add(a, b) {
  return a + b;
}
      `.trim();

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // Initialize first
          const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: {
                name: "Test Client",
                version: "1.0.0",
              },
            },
          };
          ws.send(JSON.stringify(initRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Initialize response - now call generate_tests tool
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "generate_tests",
                arguments: {
                  code: testCode,
                  test_framework: "jest",
                },
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Tool response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.result).toBeDefined();
            expect(response.result.content).toBeDefined();

            const content = response.result.content[0];
            expect(content.type).toBe("text");
            expect(content.text).toBeDefined();
            expect(content.text).toContain("jest");

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });
  });

  describe("Ping Functionality", () => {
    it("should respond to ping requests", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const pingRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "ping",
          };
          ws.send(JSON.stringify(pingRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.result).toBeDefined();
          expect(response.result.pong).toBe(true);

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });
  });
});
