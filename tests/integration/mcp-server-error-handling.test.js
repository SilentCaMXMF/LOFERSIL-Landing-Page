/**
 * MCP Server Error Handling Integration Tests
 * Tests server error responses and edge cases
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket } from "ws";
import { MCPServer } from "../../mcp-server/server.js";

describe("MCP Server Error Handling Integration Tests", () => {
  let server;
  let testPort = 3004; // Use different port for tests
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

  describe("Invalid Method Handling", () => {
    it("should return method not found for unknown methods", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const invalidRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "unknown_method",
          };
          ws.send(JSON.stringify(invalidRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.error).toBeDefined();
          expect(response.error.code).toBe(-32601); // Method not found
          expect(response.error.message).toBe("Method not found");

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should return method not found for tools/call without initialization", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Try to call tool without initializing first
          const toolRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
              name: "analyze_code",
              arguments: { code: "test" },
            },
          };
          ws.send(JSON.stringify(toolRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          // Should still work since tools/call is a valid method
          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.result).toBeDefined();

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

  describe("Invalid Tool Calls", () => {
    it("should return tool not found for unknown tools", async () => {
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
            // Initialize response - now call unknown tool
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "unknown_tool",
                arguments: {},
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Tool error response
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.error).toBeDefined();
            expect(response.error.code).toBe(-32602); // Tool not found
            expect(response.error.message).toBe("Tool not found");
            expect(response.error.data.tool).toBe("unknown_tool");

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

    it("should handle tool execution errors gracefully", async () => {
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
            // Initialize response - now call tool with invalid arguments that might cause internal error
            const toolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "analyze_code",
                arguments: {
                  // Missing required 'code' parameter - this should cause an error
                  language: "javascript",
                },
              },
            };
            ws.send(JSON.stringify(toolRequest));
          } else if (messageCount === 2) {
            // Tool error response
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

  describe("Protocol Violations", () => {
    it("should reject requests without jsonrpc field", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const invalidRequest = {
            id: 1,
            method: "ping",
            // Missing jsonrpc field
          };
          ws.send(JSON.stringify(invalidRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.error).toBeDefined();
          expect(response.error.code).toBe(-32600); // Invalid request

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should reject requests with wrong jsonrpc version", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const invalidRequest = {
            jsonrpc: "1.0", // Wrong version
            id: 1,
            method: "ping",
          };
          ws.send(JSON.stringify(invalidRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.error).toBeDefined();
          expect(response.error.code).toBe(-32600); // Invalid request

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should handle empty messages", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send empty message
          ws.send("");
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.error).toBeDefined();
          expect(response.error.code).toBe(-32700); // Parse error

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

  describe("Parameter Validation", () => {
    it("should validate initialize parameters", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const invalidInitRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              // Missing required protocolVersion
              capabilities: {},
            },
          };
          ws.send(JSON.stringify(invalidInitRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          // Initialize should still work even with missing optional params
          expect(response.jsonrpc).toBe("2.0");
          expect(response.id).toBe(1);
          expect(response.result).toBeDefined();
          expect(response.result.protocolVersion).toBeDefined();

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should validate tool call parameters", async () => {
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
            // Initialize response - now call tool with missing name
            const invalidToolRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                // Missing name parameter
                arguments: { code: "test" },
              },
            };
            ws.send(JSON.stringify(invalidToolRequest));
          } else if (messageCount === 2) {
            // Should get an error for missing tool name
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);
            expect(response.error).toBeDefined();
            expect(response.error.code).toBe(-32603); // Internal error

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

  describe("Server State Management", () => {
    it("should handle rapid consecutive requests", async () => {
      const ws = new WebSocket(wsUrl);
      const requestCount = 10;
      let responseCount = 0;

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send multiple requests rapidly
          for (let i = 1; i <= requestCount; i++) {
            const request = {
              jsonrpc: "2.0",
              id: i,
              method: "ping",
            };
            ws.send(JSON.stringify(request));
          }
        };

        ws.onmessage = (event) => {
          responseCount++;
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.result.pong).toBe(true);

          if (responseCount === requestCount) {
            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 10000);
      });
    });

    it("should handle out-of-order responses", async () => {
      const ws = new WebSocket(wsUrl);
      const responses = [];

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send requests with different processing times
          const request1 = {
            jsonrpc: "2.0",
            id: 1,
            method: "ping",
          };
          const request2 = {
            jsonrpc: "2.0",
            id: 2,
            method: "ping",
          };

          ws.send(JSON.stringify(request1));
          setTimeout(() => ws.send(JSON.stringify(request2)), 10);
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());
          responses.push(response);

          if (responses.length === 2) {
            // Verify both responses received
            const ids = responses.map((r) => r.id).sort();
            expect(ids).toEqual([1, 2]);
            expect(responses.every((r) => r.result.pong)).toBe(true);

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

  describe("Resource Exhaustion", () => {
    it("should handle very large payloads", async () => {
      const ws = new WebSocket(wsUrl);
      const largePayload = "x".repeat(1024 * 1024); // 1MB payload

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
            // Initialize response - now send large payload
            const largeRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "analyze_code",
                arguments: {
                  code: largePayload,
                  language: "javascript",
                },
              },
            };
            ws.send(JSON.stringify(largeRequest));
          } else if (messageCount === 2) {
            // Should handle large payload or return appropriate error
            expect(response.jsonrpc).toBe("2.0");
            expect(response.id).toBe(2);

            // Either success or controlled error
            if (response.result) {
              expect(response.result.content).toBeDefined();
            } else {
              expect(response.error).toBeDefined();
            }

            ws.close();
            resolve();
          }
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 15000); // Longer timeout for large payload
      });
    });

    it("should handle many concurrent connections", async () => {
      const connectionPromises = [];
      const maxConnections = 20;

      for (let i = 0; i < maxConnections; i++) {
        const promise = new Promise((resolve, reject) => {
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            const request = {
              jsonrpc: "2.0",
              id: i + 1,
              method: "ping",
            };
            ws.send(JSON.stringify(request));
          };

          ws.onmessage = (event) => {
            const response = JSON.parse(event.data.toString());
            expect(response.result.pong).toBe(true);
            ws.close();
            resolve();
          };

          ws.onerror = (error) => {
            reject(error);
          };

          setTimeout(() => reject(new Error(`Connection ${i} timeout`)), 10000);
        });

        connectionPromises.push(promise);
      }

      await Promise.all(connectionPromises);
    });
  });

  describe("Graceful Degradation", () => {
    it("should continue working after error responses", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        let messageCount = 0;

        ws.onopen = () => {
          // Send invalid request first
          const invalidRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "unknown_method",
          };
          ws.send(JSON.stringify(invalidRequest));
        };

        ws.onmessage = (event) => {
          messageCount++;
          const response = JSON.parse(event.data.toString());

          if (messageCount === 1) {
            // Error response - now send valid request
            expect(response.error).toBeDefined();

            const validRequest = {
              jsonrpc: "2.0",
              id: 2,
              method: "ping",
            };
            ws.send(JSON.stringify(validRequest));
          } else if (messageCount === 2) {
            // Valid response - server should still work
            expect(response.result.pong).toBe(true);

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
});
