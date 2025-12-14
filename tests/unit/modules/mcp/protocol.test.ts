/**
 * MCP Protocol Layer Unit Tests
 * Tests for JSON-RPC 2.0 protocol implementation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  MessageFactory,
  MessageSerializer,
  RequestManager,
  ProtocolHandler,
  MCPProtocol,
} from "../../../../src/scripts/modules/mcp/protocol";
import {
  JSONRPCErrorCode,
  type JSONRPCRequest,
  type JSONRPCResponse,
  type JSONRPCNotification,
} from "../../../../src/scripts/modules/mcp/types";

describe("MessageFactory", () => {
  it("should create valid JSON-RPC request", () => {
    const request = MessageFactory.createRequest("test.method", {
      arg1: "value1",
    });

    expect(request.jsonrpc).toBe("2.0");
    expect(request.method).toBe("test.method");
    expect(request.params).toEqual({ arg1: "value1" });
    expect(request.id).toBeDefined();
    expect(request.timestamp).toBeDefined();
  });

  it("should create JSON-RPC request with custom ID", () => {
    const customId = "custom-id-123";
    const request = MessageFactory.createRequest(
      "test.method",
      undefined,
      customId,
    );

    expect(request.id).toBe(customId);
  });

  it("should create valid JSON-RPC response", () => {
    const response = MessageFactory.createResponse("test-id", {
      result: "success",
    });

    expect(response.jsonrpc).toBe("2.0");
    expect(response.id).toBe("test-id");
    expect(response.result).toEqual({ result: "success" });
    expect(response.error).toBeUndefined();
    expect(response.timestamp).toBeDefined();
  });

  it("should create JSON-RPC response with error", () => {
    const error = MessageFactory.createError(
      JSONRPCErrorCode.INVALID_PARAMS,
      "Invalid parameters",
    );
    const response = MessageFactory.createResponse("test-id", undefined, error);

    expect(response.jsonrpc).toBe("2.0");
    expect(response.id).toBe("test-id");
    expect(response.result).toBeUndefined();
    expect(response.error).toEqual(error);
  });

  it("should create valid JSON-RPC notification", () => {
    const notification = MessageFactory.createNotification("test.event", {
      data: "test",
    });

    expect(notification.jsonrpc).toBe("2.0");
    expect(notification.method).toBe("test.event");
    expect(notification.params).toEqual({ data: "test" });
    expect("id" in notification).toBe(false);
    expect(notification.timestamp).toBeDefined();
  });

  it("should create MCP error", () => {
    const error = MessageFactory.createMCPError(
      JSONRPCErrorCode.UNAUTHORIZED,
      "Unauthorized access",
      { details: "Missing API key" },
    );

    expect(error.code).toBe(JSONRPCErrorCode.UNAUTHORIZED);
    expect(error.message).toBe("Unauthorized access");
    expect(error.data).toEqual({ details: "Missing API key" });
  });
});

describe("MessageSerializer", () => {
  it("should serialize and deserialize messages correctly", () => {
    const originalMessage = {
      jsonrpc: "2.0" as const,
      id: "test-id",
      method: "test.method",
      params: { arg1: "value1" },
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    const serialized = MessageSerializer.serialize(originalMessage);
    const deserialized = MessageSerializer.deserialize(serialized);

    expect(deserialized).toEqual(originalMessage);
  });

  it("should handle circular references", () => {
    const circular: any = { name: "test" };
    circular.self = circular;

    expect(() => MessageSerializer.serialize(circular)).not.toThrow();
  });

  it("should validate message size", () => {
    const smallMessage = { jsonrpc: "2.0" as const };
    const serialized = MessageSerializer.serialize(smallMessage);

    expect(MessageSerializer.validateSize(serialized)).toBe(true);
    expect(MessageSerializer.validateSize(serialized, 10)).toBe(false);
  });

  it("should throw error for invalid JSON", () => {
    expect(() => MessageSerializer.deserialize("invalid json")).toThrow();
  });

  it("should throw error for invalid JSON-RPC version", () => {
    const invalidMessage = JSON.stringify({ jsonrpc: "1.0" });
    expect(() => MessageSerializer.deserialize(invalidMessage)).toThrow();
  });
});

describe("RequestManager", () => {
  let requestManager: RequestManager;

  beforeEach(() => {
    requestManager = new RequestManager(1000); // 1 second timeout for tests
  });

  afterEach(() => {
    requestManager.clearAll();
  });

  it("should register and resolve requests", async () => {
    const promise = requestManager.registerRequest("test-id");

    setTimeout(() => {
      requestManager.resolveRequest("test-id", "success");
    }, 100);

    const result = await promise;
    expect(result).toBe("success");
  });

  it("should register and reject requests", async () => {
    const promise = requestManager.registerRequest("test-id");

    setTimeout(() => {
      requestManager.rejectRequest("test-id", new Error("Test error"));
    }, 100);

    await expect(promise).rejects.toThrow("Test error");
  });

  it("should timeout requests", async () => {
    const promise = requestManager.registerRequest("timeout-id");

    await expect(promise).rejects.toThrow("timed out");
  });

  it("should cancel requests", async () => {
    const promise = requestManager.registerRequest("cancel-id");

    const cancelled = requestManager.cancelRequest("cancel-id");
    expect(cancelled).toBe(true);

    await expect(promise).rejects.toThrow("was cancelled");
  });

  it("should track pending requests", () => {
    expect(requestManager.getPendingCount()).toBe(0);

    requestManager.registerRequest("test-1");
    requestManager.registerRequest("test-2");

    expect(requestManager.getPendingCount()).toBe(2);
    expect(requestManager.getPendingIds()).toContain("test-1");
    expect(requestManager.getPendingIds()).toContain("test-2");
  });

  it("should clear all requests", async () => {
    const promise1 = requestManager.registerRequest("test-1");
    const promise2 = requestManager.registerRequest("test-2");

    requestManager.clearAll();

    expect(requestManager.getPendingCount()).toBe(0);

    await expect(promise1).rejects.toThrow("were cleared");
    await expect(promise2).rejects.toThrow("were cleared");
  });
});

describe("ProtocolHandler", () => {
  let protocolHandler: ProtocolHandler;

  beforeEach(() => {
    protocolHandler = new ProtocolHandler(1000);
  });

  afterEach(() => {
    protocolHandler.clear();
  });

  it("should handle JSON-RPC requests", async () => {
    let handledRequest: JSONRPCRequest | undefined;

    protocolHandler.registerHandler("test.method", (request) => {
      handledRequest = request as JSONRPCRequest;
    });

    const request = MessageFactory.createRequest("test.method", {
      arg: "value",
    });
    const serialized = MessageSerializer.serialize(request);

    const response = await protocolHandler.handleMessage(serialized);

    expect(handledRequest).toBeDefined();
    expect(handledRequest?.method).toBe("test.method");
    expect(response).toBe(""); // Handler should send response
  });

  it("should handle JSON-RPC responses", async () => {
    const { promise, message } =
      await protocolHandler.sendRequest("test.method");

    const response = MessageFactory.createResponse("test-id", {
      result: "success",
    });
    const serializedResponse = MessageSerializer.serialize(response);

    // Simulate receiving response
    await protocolHandler.handleMessage(serializedResponse);

    const result = await promise;
    expect(result).toEqual({ result: "success" });
  });

  it("should handle JSON-RPC notifications", async () => {
    let handledNotification: JSONRPCNotification | undefined;

    protocolHandler.registerHandler("test.event", (notification) => {
      handledNotification = notification as JSONRPCNotification;
    });

    const notification = MessageFactory.createNotification("test.event", {
      data: "test",
    });
    const serialized = MessageSerializer.serialize(notification);

    const response = await protocolHandler.handleMessage(serialized);

    expect(handledNotification).toBeDefined();
    expect(handledNotification?.method).toBe("test.event");
    expect(response).toBeNull(); // Notifications don't get responses
  });

  it("should handle method not found errors", async () => {
    const request = MessageFactory.createRequest("unknown.method", {});
    const serialized = MessageSerializer.serialize(request);

    const response = await protocolHandler.handleMessage(serialized);

    expect(response).not.toBeNull();
    const parsedResponse = JSON.parse(response!) as JSONRPCResponse;
    expect(parsedResponse.error?.code).toBe(JSONRPCErrorCode.METHOD_NOT_FOUND);
  });

  it("should handle invalid messages", async () => {
    const invalidMessage = JSON.stringify({
      jsonrpc: "2.0" as const,
      invalid: "message",
    });

    const response = await protocolHandler.handleMessage(invalidMessage);

    expect(response).toBeNull(); // Can't respond to invalid messages
  });
});

describe("MCPProtocol", () => {
  it("should create initialize request", () => {
    const clientInfo = { name: "Test Client", version: "1.0.0" };
    const capabilities = { tools: {} };

    const request = MCPProtocol.createInitializeRequest(
      clientInfo,
      capabilities,
    );

    expect(request.method).toBe("initialize");
    expect(request.params).toEqual({
      protocolVersion: "2024-11-05",
      capabilities,
      clientInfo,
    });
  });

  it("should create tools/list request", () => {
    const request = MCPProtocol.createToolsListRequest();

    expect(request.method).toBe("tools/list");
    expect(request.params).toBeUndefined();
  });

  it("should create tools/call request", () => {
    const request = MCPProtocol.createToolsCallRequest("test-tool", {
      arg1: "value1",
    });

    expect(request.method).toBe("tools/call");
    expect(request.params).toEqual({
      name: "test-tool",
      arguments: { arg1: "value1" },
    });
  });

  it("should create resources/list request", () => {
    const request = MCPProtocol.createResourcesListRequest();

    expect(request.method).toBe("resources/list");
    expect(request.params).toBeUndefined();
  });

  it("should create resources/read request", () => {
    const request = MCPProtocol.createResourcesReadRequest(
      "test://example/resource",
    );

    expect(request.method).toBe("resources/read");
    expect(request.params).toEqual({ uri: "test://example/resource" });
  });

  it("should create prompts/list request", () => {
    const request = MCPProtocol.createPromptsListRequest();

    expect(request.method).toBe("prompts/list");
    expect(request.params).toBeUndefined();
  });

  it("should create prompts/get request", () => {
    const request = MCPProtocol.createPromptsGetRequest("test-prompt", {
      var1: "value1",
    });

    expect(request.method).toBe("prompts/get");
    expect(request.params).toEqual({
      name: "test-prompt",
      arguments: { var1: "value1" },
    });
  });

  it("should validate messages", () => {
    const validRequest = MessageFactory.createRequest("test.method", {});
    const validResponse = MessageFactory.createResponse("test-id", {
      result: "success",
    });
    const validNotification = MessageFactory.createNotification(
      "test.event",
      {},
    );

    expect(MCPProtocol.validateMessage(validRequest).valid).toBe(true);
    expect(MCPProtocol.validateMessage(validResponse).valid).toBe(true);
    expect(MCPProtocol.validateMessage(validNotification).valid).toBe(true);

    const invalidMessage = {
      jsonrpc: "2.0" as const,
      invalid: "message",
    };
    expect(MCPProtocol.validateMessage(invalidMessage).valid).toBe(false);
  });
});
