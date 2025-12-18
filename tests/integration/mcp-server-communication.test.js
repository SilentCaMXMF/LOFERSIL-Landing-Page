/**
 * MCP Server Communication Integration Tests
 * Tests WebSocket protocol communication and message handling
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket } from "ws";
import { MCPServer } from "../../mcp-server/server.js";

describe("MCP Server Communication Integration Tests", () => {
  let server;
  let testPort = 3003; // Use different port for tests
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

  describe("WebSocket Connection", () => {
    it("should establish WebSocket connection successfully", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Connection timeout")), 5000);
      });
    });

    it("should handle connection closure gracefully", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          ws.close(1000, "Normal closure");
        };

        ws.onclose = (event) => {
          expect(event.code).toBe(1000);
          expect(event.reason).toBe("Normal closure");
          expect(event.wasClean).toBe(true);
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Closure timeout")), 5000);
      });
    });

    it("should reject connections to invalid paths", async () => {
      const invalidUrl = `ws://localhost:${testPort}/invalid`;

      await expect(async () => {
        const ws = new WebSocket(invalidUrl);

        await new Promise((resolve, reject) => {
          ws.onopen = () => {
            reject(new Error("Connection should not succeed"));
          };

          ws.onerror = () => {
            // Expected error for invalid path
            resolve();
          };

          setTimeout(() => resolve(), 2000); // Timeout after 2 seconds
        });
      }).rejects.toThrow();
    });
  });

  describe("JSON-RPC Protocol", () => {
    it("should handle valid JSON-RPC messages", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const validRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "ping",
          };
          ws.send(JSON.stringify(validRequest));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

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

    it("should reject malformed JSON", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send malformed JSON
          ws.send("{ invalid json }");
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());

          expect(response.jsonrpc).toBe("2.0");
          expect(response.error).toBeDefined();
          expect(response.error.code).toBe(-32700); // Parse error
          expect(response.error.message).toBe("Parse error");

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should handle requests without IDs (notifications)", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send notification (no id)
          const notification = {
            jsonrpc: "2.0",
            method: "ping",
            params: {},
          };
          ws.send(JSON.stringify(notification));

          // Server should not respond to notifications
          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        };

        ws.onmessage = (event) => {
          // If we get any message, it means the server responded to a notification
          reject(new Error("Server should not respond to notifications"));
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 5000);
      });
    });

    it("should handle batch requests", async () => {
      const ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        let responseCount = 0;

        ws.onopen = () => {
          // Send batch of requests
          const batchRequest = [
            {
              jsonrpc: "2.0",
              id: 1,
              method: "ping",
            },
            {
              jsonrpc: "2.0",
              id: 2,
              method: "ping",
            },
          ];
          ws.send(JSON.stringify(batchRequest));
        };

        ws.onmessage = (event) => {
          responseCount++;
          const response = JSON.parse(event.data.toString());

          if (responseCount === 1) {
            expect(response.id).toBe(1);
            expect(response.result.pong).toBe(true);
          } else if (responseCount === 2) {
            expect(response.id).toBe(2);
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

  describe("Message Ordering", () => {
    it("should handle multiple sequential requests", async () => {
      const ws = new WebSocket(wsUrl);
      const responses = [];

      await new Promise((resolve, reject) => {
        let requestCount = 0;

        ws.onopen = () => {
          // Send multiple requests sequentially
          const sendNext = () => {
            requestCount++;
            if (requestCount <= 3) {
              const request = {
                jsonrpc: "2.0",
                id: requestCount,
                method: "ping",
              };
              ws.send(JSON.stringify(request));
            }
          };

          sendNext();
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());
          responses.push(response);

          if (responses.length < 3) {
            // Send next request
            const nextRequest = {
              jsonrpc: "2.0",
              id: responses.length + 1,
              method: "ping",
            };
            ws.send(JSON.stringify(nextRequest));
          } else {
            // All responses received
            expect(responses.length).toBe(3);
            expect(responses[0].id).toBe(1);
            expect(responses[1].id).toBe(2);
            expect(responses[2].id).toBe(3);

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

  describe("Connection Limits", () => {
    it("should handle multiple concurrent connections", async () => {
      const connections = [];
      const maxConnections = 5;

      // Create multiple connections
      for (let i = 0; i < maxConnections; i++) {
        connections.push(new WebSocket(wsUrl));
      }

      await Promise.all(
        connections.map(
          (ws, index) =>
            new Promise((resolve, reject) => {
              ws.onopen = () => {
                // Send a ping to verify connection works
                const request = {
                  jsonrpc: "2.0",
                  id: index + 1,
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

              setTimeout(
                () => reject(new Error(`Connection ${index} timeout`)),
                5000,
              );
            }),
        ),
      );
    });
  });

  describe("Message Size Limits", () => {
    it("should handle large messages", async () => {
      const ws = new WebSocket(wsUrl);
      const largeCode =
        "function test() { " + "console.log('test'); ".repeat(1000) + "}";

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
              name: "analyze_code",
              arguments: {
                code: largeCode,
                language: "javascript",
              },
            },
          };
          ws.send(JSON.stringify(request));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());
          expect(response.result).toBeDefined();
          expect(response.result.content).toBeDefined();

          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 10000); // Longer timeout for large message
      });
    });
  });

  describe("Connection Recovery", () => {
    it("should handle connection drops and reconnections", async () => {
      let ws = new WebSocket(wsUrl);

      await new Promise((resolve, reject) => {
        ws.onopen = () => {
          // Send a request
          const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "ping",
          };
          ws.send(JSON.stringify(request));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data.toString());
          expect(response.result.pong).toBe(true);

          // Close connection abruptly
          ws.terminate();

          // Reconnect after a short delay
          setTimeout(() => {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
              // Send another request on new connection
              const request2 = {
                jsonrpc: "2.0",
                id: 2,
                method: "ping",
              };
              ws.send(JSON.stringify(request2));
            };

            ws.onmessage = (event2) => {
              const response2 = JSON.parse(event2.data.toString());
              expect(response2.result.pong).toBe(true);
              ws.close();
              resolve();
            };

            ws.onerror = (error) => {
              reject(error);
            };
          }, 500);
        };

        ws.onerror = (error) => {
          reject(error);
        };

        setTimeout(() => reject(new Error("Test timeout")), 10000);
      });
    });
  });
});
