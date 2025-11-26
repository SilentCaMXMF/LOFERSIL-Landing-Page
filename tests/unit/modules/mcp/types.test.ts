/**
 * MCP Types Unit Tests
 * Tests for MCP type definitions and validation utilities
 */

import { describe, it, expect } from "vitest";
import {
  MCP_VERSION,
  MCPConnectionState,
  JSONRPCErrorCode,
  MCPAuthenticationMethod,
  isJSONRPCRequest,
  isJSONRPCResponse,
  isJSONRPCNotification,
  isMCPTool,
  isMCPResource,
  isMCPPrompt,
  validateMCPClientConfig,
  type MCPClientConfig,
  type JSONRPCRequest,
  type JSONRPCResponse,
  type JSONRPCNotification,
  type MCPTool,
  type MCPResource,
  type MCPPrompt,
} from "../../../../src/scripts/modules/mcp/types";

describe("MCP Types", () => {
  describe("Constants", () => {
    it("should have correct MCP version", () => {
      expect(MCP_VERSION).toBe("2024-11-05");
    });
  });

  describe("Enums", () => {
    it("should have correct connection states", () => {
      expect(MCPConnectionState.DISCONNECTED).toBe("disconnected");
      expect(MCPConnectionState.CONNECTING).toBe("connecting");
      expect(MCPConnectionState.CONNECTED).toBe("connected");
      expect(MCPConnectionState.RECONNECTING).toBe("reconnecting");
      expect(MCPConnectionState.ERROR).toBe("error");
    });

    it("should have correct JSON-RPC error codes", () => {
      expect(JSONRPCErrorCode.PARSE_ERROR).toBe(-32700);
      expect(JSONRPCErrorCode.INVALID_REQUEST).toBe(-32600);
      expect(JSONRPCErrorCode.METHOD_NOT_FOUND).toBe(-32601);
      expect(JSONRPCErrorCode.INVALID_PARAMS).toBe(-32602);
      expect(JSONRPCErrorCode.INTERNAL_ERROR).toBe(-32603);
      expect(JSONRPCErrorCode.UNAUTHORIZED).toBe(-32001);
    });

    it("should have correct authentication methods", () => {
      expect(MCPAuthenticationMethod.NONE).toBe("none");
      expect(MCPAuthenticationMethod.TOKEN).toBe("token");
      expect(MCPAuthenticationMethod.CERTIFICATE).toBe("certificate");
      expect(MCPAuthenticationMethod.API_KEY).toBe("api_key");
    });
  });

  describe("Type Guards", () => {
    describe("isJSONRPCRequest", () => {
      it("should identify valid JSON-RPC requests", () => {
        const validRequest: JSONRPCRequest = {
          jsonrpc: "2.0",
          id: "test-id",
          method: "test.method",
          params: { arg1: "value1" },
        };

        expect(isJSONRPCRequest(validRequest)).toBe(true);
      });

      it("should reject invalid JSON-RPC requests", () => {
        const invalidRequests = [
          null,
          undefined,
          {},
          { jsonrpc: "2.0" },
          { jsonrpc: "2.0", method: "test" },
          { jsonrpc: "2.0", id: "test" },
          { jsonrpc: "1.0", id: "test", method: "test" },
        ];

        invalidRequests.forEach((req) => {
          expect(isJSONRPCRequest(req)).toBe(false);
        });
      });
    });

    describe("isJSONRPCResponse", () => {
      it("should identify valid JSON-RPC responses", () => {
        const successResponse: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: "test-id",
          result: { data: "success" },
        };

        const errorResponse: JSONRPCResponse = {
          jsonrpc: "2.0",
          id: "test-id",
          error: { code: -32601, message: "Method not found" },
        };

        expect(isJSONRPCResponse(successResponse)).toBe(true);
        expect(isJSONRPCResponse(errorResponse)).toBe(true);
      });

      it("should reject invalid JSON-RPC responses", () => {
        const invalidResponses = [
          null,
          undefined,
          {},
          { jsonrpc: "2.0" },
          { jsonrpc: "2.0", id: "test" },
          { jsonrpc: "2.0", result: "data" },
          { jsonrpc: "2.0", error: { code: -1 } },
        ];

        invalidResponses.forEach((res) => {
          expect(isJSONRPCResponse(res)).toBe(false);
        });
      });
    });

    describe("isJSONRPCNotification", () => {
      it("should identify valid JSON-RPC notifications", () => {
        const validNotification: JSONRPCNotification = {
          jsonrpc: "2.0",
          method: "test.notification",
          params: { data: "notification" },
        };

        expect(isJSONRPCNotification(validNotification)).toBe(true);
      });

      it("should reject invalid JSON-RPC notifications", () => {
        const invalidNotifications = [
          null,
          undefined,
          {},
          { jsonrpc: "2.0" },
          { jsonrpc: "2.0", method: "test", id: "123" },
          { jsonrpc: "1.0", method: "test" },
        ];

        invalidNotifications.forEach((notif) => {
          expect(isJSONRPCNotification(notif)).toBe(false);
        });
      });
    });

    describe("isMCPTool", () => {
      it("should identify valid MCP tools", () => {
        const validTool: MCPTool = {
          name: "test-tool",
          description: "A test tool",
          inputSchema: {
            type: "object",
            properties: {
              input1: { type: "string", description: "Test input" },
            },
            required: ["input1"],
          },
        };

        expect(isMCPTool(validTool)).toBe(true);
      });

      it("should reject invalid MCP tools", () => {
        const invalidTools = [
          null,
          undefined,
          {},
          { name: "test" },
          { description: "test" },
          { name: "test", description: "test" },
          { name: "test", description: "test", inputSchema: {} },
        ];

        invalidTools.forEach((tool) => {
          expect(isMCPTool(tool)).toBe(false);
        });
      });
    });

    describe("isMCPResource", () => {
      it("should identify valid MCP resources", () => {
        const validResource: MCPResource = {
          uri: "test://example/resource",
          name: "Test Resource",
          description: "A test resource",
          mimeType: "text/plain",
        };

        expect(isMCPResource(validResource)).toBe(true);
      });

      it("should reject invalid MCP resources", () => {
        const invalidResources = [
          null,
          undefined,
          {},
          { name: "test" },
          { uri: "test" },
          { uri: "test://example", name: 123 },
        ];

        invalidResources.forEach((resource) => {
          expect(isMCPResource(resource)).toBe(false);
        });
      });
    });

    describe("isMCPPrompt", () => {
      it("should identify valid MCP prompts", () => {
        const validPrompt: MCPPrompt = {
          name: "test-prompt",
          description: "A test prompt",
          arguments: [
            {
              name: "arg1",
              description: "Test argument",
              required: true,
              default: "default-value",
            },
          ],
        };

        expect(isMCPPrompt(validPrompt)).toBe(true);
      });

      it("should reject invalid MCP prompts", () => {
        const invalidPrompts = [
          null,
          undefined,
          {},
          { description: "test" },
          { name: 123 },
          { name: "test", arguments: "not-array" },
        ];

        invalidPrompts.forEach((prompt) => {
          expect(isMCPPrompt(prompt)).toBe(false);
        });
      });
    });
  });

  describe("Validation Functions", () => {
    describe("validateMCPClientConfig", () => {
      it("should validate correct configuration", () => {
        const validConfig: MCPClientConfig = {
          serverUrl: "ws://localhost:3000",
          apiKey: "test-api-key",
          connectionTimeout: 5000,
          reconnection: {
            maxAttempts: 5,
            initialDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
          },
        };

        const result = validateMCPClientConfig(validConfig);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should reject configuration with missing serverUrl", () => {
        const invalidConfig = {
          apiKey: "test-api-key",
        } as MCPClientConfig;

        const result = validateMCPClientConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "serverUrl is required and must be a string",
        );
      });

      it("should reject configuration with invalid connectionTimeout", () => {
        const invalidConfig: MCPClientConfig = {
          serverUrl: "ws://localhost:3000",
          connectionTimeout: -1000,
        };

        const result = validateMCPClientConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "connectionTimeout must be a positive number",
        );
      });

      it("should reject configuration with invalid reconnection settings", () => {
        const invalidConfig: MCPClientConfig = {
          serverUrl: "ws://localhost:3000",
          reconnection: {
            maxAttempts: -1,
            initialDelay: 0,
            maxDelay: -1000,
            backoffMultiplier: 0.5,
          },
        };

        const result = validateMCPClientConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          "reconnection.maxAttempts must be a non-negative number",
        );
        expect(result.errors).toContain(
          "reconnection.initialDelay must be a positive number",
        );
        expect(result.errors).toContain(
          "reconnection.maxDelay must be a positive number",
        );
        expect(result.errors).toContain(
          "reconnection.backoffMultiplier must be greater than 1",
        );
      });
    });
  });

  describe("Type Compatibility", () => {
    it("should allow proper type assignments", () => {
      // Test that types can be properly assigned
      const config: MCPClientConfig = {
        serverUrl: "ws://localhost:3000",
      };

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: "test",
        method: "test.method",
      };

      const tool: MCPTool = {
        name: "test",
        description: "test",
        inputSchema: {
          type: "object",
          properties: {},
        },
      };

      expect(config.serverUrl).toBe("ws://localhost:3000");
      expect(request.method).toBe("test.method");
      expect(tool.name).toBe("test");
    });
  });
});
