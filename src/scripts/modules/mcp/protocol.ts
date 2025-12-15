/**
 * MCP JSON-RPC 2.0 Protocol Layer
 *
 * Comprehensive implementation of JSON-RPC 2.0 protocol for MCP communication.
 * Handles message serialization, deserialization, request/response correlation,
 * and error handling according to JSON-RPC 2.0 specification.
 */

import {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  JSONRPCError,
  JSONRPCErrorCode,
  MCPBaseMessage,
  MCPRequestPromise,
  MCPMessageHandler,
  isJSONRPCRequest,
  isJSONRPCResponse,
  isJSONRPCNotification,
  MCPError,
  MCPErrorCategory,
  MCPErrorSeverity,
  MCPErrorContext,
  createMCPErrorContext,
  classifyMCPError,
  determineMCPErrorSeverity,
  generateMCPErrorId,
  sanitizeMCPErrorMessage,
  generateMCPCorrelationId,
} from "./types";
import { ErrorManager } from "../ErrorManager";

// ============================================================================
// MESSAGE FACTORY
// ============================================================================

/**
 * Factory for creating JSON-RPC 2.0 messages
 */
export class MessageFactory {
  private static idCounter = 0;

  /**
   * Generate unique request ID
   */
  private static generateId(): string {
    return `mcp_${Date.now()}_${++MessageFactory.idCounter}`;
  }

  /**
   * Create a JSON-RPC 2.0 request
   */
  static createRequest(
    method: string,
    params?: Record<string, unknown> | unknown[],
    id?: string | number,
  ): JSONRPCRequest {
    return {
      jsonrpc: "2.0",
      id: id || this.generateId(),
      method,
      params,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a JSON-RPC 2.0 response
   */
  static createResponse(
    id: string | number,
    result?: unknown,
    error?: JSONRPCError,
  ): JSONRPCResponse {
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id,
      timestamp: new Date().toISOString(),
    };

    if (result !== undefined) {
      response.result = result;
    }

    if (error !== undefined) {
      response.error = error;
    }

    return response;
  }

  /**
   * Create a JSON-RPC 2.0 notification
   */
  static createNotification(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): JSONRPCNotification {
    return {
      jsonrpc: "2.0",
      method,
      params,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a JSON-RPC 2.0 error
   */
  static createError(
    code: JSONRPCErrorCode | number,
    message: string,
    data?: unknown,
  ): JSONRPCError {
    return {
      code,
      message,
      data,
    };
  }

  /**
   * Create MCP-specific error
   */
  static createMCPError(
    code: JSONRPCErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): JSONRPCError {
    return {
      code,
      message,
      data: details,
    };
  }
}

// ============================================================================
// MESSAGE SERIALIZATION
// ============================================================================

/**
 * Message serialization and deserialization utilities
 */
export class MessageSerializer {
  /**
   * Serialize a message to JSON string
   */
  static serialize(message: MCPBaseMessage): string {
    try {
      return JSON.stringify(message, this.replacer);
    } catch (error) {
      throw new Error(
        `Failed to serialize message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Deserialize a JSON string to message object
   */
  static deserialize(data: string): MCPBaseMessage {
    try {
      const message = JSON.parse(data, this.reviver);

      // Validate basic JSON-RPC structure
      if (!message || typeof message !== "object") {
        throw new Error("Invalid message: not an object");
      }

      if (message.jsonrpc !== "2.0") {
        throw new Error("Invalid JSON-RPC version: must be '2.0'");
      }

      return message;
    } catch (error) {
      throw new Error(
        `Failed to deserialize message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * JSON replacer function for serialization
   */
  private static replacer(_key: string, value: unknown): unknown {
    // Handle undefined values
    if (value === undefined) {
      return undefined;
    }

    // Handle circular references
    if (typeof value === "object" && value !== null) {
      if (value.constructor === Object || Array.isArray(value)) {
        return value;
      }
      // Convert custom objects to plain objects
      return Object.fromEntries(Object.entries(value as any));
    }

    return value;
  }

  /**
   * JSON reviver function for deserialization
   */
  private static reviver(key: string, value: unknown): unknown {
    // Convert date strings back to Date objects
    if (typeof value === "string" && key === "timestamp") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return value;
  }

  /**
   * Validate message size
   */
  static validateSize(data: string, maxSize: number = 1024 * 1024): boolean {
    return data.length <= maxSize;
  }
}

// ============================================================================
// REQUEST MANAGER
// ============================================================================

/**
 * Manages pending requests and correlates responses
 */
export class RequestManager {
  private pendingRequests = new Map<string | number, MCPRequestPromise>();
  private timeoutMs: number;

  constructor(timeoutMs: number = 30000) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Register a new request
   */
  registerRequest<T = unknown>(
    id: string | number,
    timeoutMs?: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(
            `Request ${id} timed out after ${timeoutMs || this.timeoutMs}ms`,
          ),
        );
      }, timeoutMs || this.timeoutMs);

      const promise: MCPRequestPromise = {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      };

      this.pendingRequests.set(id, promise);
    });
  }

  /**
   * Resolve a pending request
   */
  resolveRequest<T = unknown>(id: string | number, result: T): boolean {
    const promise = this.pendingRequests.get(id);
    if (!promise) {
      return false;
    }

    if (promise.timeout) {
      clearTimeout(promise.timeout);
    }

    this.pendingRequests.delete(id);
    promise.resolve(result);
    return true;
  }

  /**
   * Reject a pending request
   */
  rejectRequest(id: string | number, error: Error): boolean {
    const promise = this.pendingRequests.get(id);
    if (!promise) {
      return false;
    }

    if (promise.timeout) {
      clearTimeout(promise.timeout);
    }

    this.pendingRequests.delete(id);
    promise.reject(error);
    return true;
  }

  /**
   * Cancel a pending request
   */
  cancelRequest(id: string | number): boolean {
    const promise = this.pendingRequests.get(id);
    if (!promise) {
      return false;
    }

    if (promise.timeout) {
      clearTimeout(promise.timeout);
    }

    this.pendingRequests.delete(id);
    promise.reject(new Error(`Request ${String(id)} was cancelled`));
    return true;
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    this.pendingRequests.forEach((promise, id) => {
      if (promise.timeout) {
        clearTimeout(promise.timeout);
      }
      promise.reject(new Error("All requests were cleared"));
    });
    this.pendingRequests.clear();
  }

  /**
   * Get pending request IDs
   */
  getPendingIds(): (string | number)[] {
    return Array.from(this.pendingRequests.keys());
  }
}

// ============================================================================
// PROTOCOL HANDLER
// ============================================================================

/**
 * Handles JSON-RPC 2.0 protocol processing
 */
export class ProtocolHandler {
  private requestManager: RequestManager;
  private messageHandlers = new Map<string, MCPMessageHandler>();
  private errorHandler?: (error: Error, message?: MCPBaseMessage) => void;
  private errorManager?: ErrorManager;

  constructor(timeoutMs: number = 30000, errorManager?: ErrorManager) {
    this.requestManager = new RequestManager(timeoutMs);
    this.errorManager = errorManager;
  }

  /**
   * Set error handler
   */
  setErrorHandler(
    handler: (error: Error, message?: MCPBaseMessage) => void,
  ): void {
    this.errorHandler = handler;
  }

  /**
   * Register a message handler for a specific method
   */
  registerHandler(method: string, handler: MCPMessageHandler): void {
    this.messageHandlers.set(method, handler);
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(method: string): void {
    this.messageHandlers.delete(method);
  }

  /**
   * Handle incoming message
   */
  async handleMessage(data: string): Promise<string | null> {
    try {
      // Deserialize message
      const message = MessageSerializer.deserialize(data);

      // Route message based on type
      if (isJSONRPCRequest(message)) {
        return await this.handleRequest(message);
      } else if (isJSONRPCResponse(message)) {
        this.handleResponse(message);
        return null; // Responses don't need to be sent back
      } else if (isJSONRPCNotification(message)) {
        this.handleNotification(message);
        return null; // Notifications don't need responses
      } else {
        throw new Error("Unknown message type");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error(String(error));

      // Handle with ErrorManager if available
      if (this.errorManager) {
        await this.handleProtocolError(error as Error, "handleMessage", {
          messageData: data,
          messageType: this.detectMessageType(data),
        });
      }

      // Use legacy error handler if available
      if (this.errorHandler) {
        this.errorHandler(errorMessage);
      }

      // Return error response for request messages
      try {
        const message = MessageSerializer.deserialize(data);
        if (isJSONRPCRequest(message)) {
          const errorResponse = MessageFactory.createResponse(
            message.id,
            undefined,
            MessageFactory.createError(
              JSONRPCErrorCode.INVALID_REQUEST,
              errorMessage.message,
            ),
          );
          return MessageSerializer.serialize(errorResponse);
        }
      } catch {
        // If we can't parse original message, we can't respond
      }

      return null;
    }
  }

  /**
   * Handle protocol error with ErrorManager integration
   */
  private async handleProtocolError(
    error: Error,
    operation: string,
    additionalContext?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.errorManager) {
      return;
    }

    const context = createMCPErrorContext({
      component: "ProtocolHandler",
      operation,
      metadata: {
        pendingRequests: this.requestManager.getPendingCount(),
        registeredHandlers: this.messageHandlers.size,
        ...additionalContext,
      },
    });

    const category = this.classifyProtocolError(error);
    const severity = determineMCPErrorSeverity(error, category);

    const mcpError: MCPError = {
      id: generateMCPErrorId(),
      message: sanitizeMCPErrorMessage(error.message),
      category,
      severity,
      context,
      cause: error,
      stack: error.stack,
      recoverable: this.isProtocolErrorRecoverable(category, severity),
      retryable: this.isProtocolErrorRetryable(category, severity),
      requiresHumanIntervention: severity === MCPErrorSeverity.CRITICAL,
      correlationId: generateMCPCorrelationId(),
    };

    // Report to ErrorManager
    this.errorManager.handleError(error, `ProtocolHandler.${operation}`, {
      component: context.component,
      timestamp: context.timestamp,
      metadata: {
        mcpErrorId: mcpError.id,
        category: mcpError.category,
        severity: mcpError.severity,
        correlationId: mcpError.correlationId,
        ...context.metadata,
      },
    });

    // Record metrics
    this.errorManager.incrementCounter("protocol_errors", {
      component: context.component,
      category: mcpError.category,
      severity: mcpError.severity,
      operation,
    });
  }

  /**
   * Classify protocol error
   */
  private classifyProtocolError(error: Error): MCPErrorCategory {
    const message = error.message.toLowerCase();

    if (
      message.includes("parse") ||
      message.includes("deserialize") ||
      message.includes("invalid json")
    ) {
      return MCPErrorCategory.DESERIALIZATION;
    }

    if (message.includes("serialize") || message.includes("invalid message")) {
      return MCPErrorCategory.SERIALIZATION;
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return MCPErrorCategory.TIMEOUT;
    }

    if (
      message.includes("method not found") ||
      message.includes("invalid method")
    ) {
      return MCPErrorCategory.PROTOCOL;
    }

    return MCPErrorCategory.PROTOCOL;
  }

  /**
   * Check if protocol error is recoverable
   */
  private isProtocolErrorRecoverable(
    category: MCPErrorCategory,
    severity: MCPErrorSeverity,
  ): boolean {
    if (severity === MCPErrorSeverity.CRITICAL) {
      return false;
    }

    const recoverableCategories = [
      MCPErrorCategory.TIMEOUT,
      MCPErrorCategory.DESERIALIZATION,
      MCPErrorCategory.SERIALIZATION,
    ];

    return recoverableCategories.includes(category);
  }

  /**
   * Check if protocol error is retryable
   */
  private isProtocolErrorRetryable(
    category: MCPErrorCategory,
    severity: MCPErrorSeverity,
  ): boolean {
    if (severity === MCPErrorSeverity.CRITICAL) {
      return false;
    }

    const retryableCategories = [
      MCPErrorCategory.TIMEOUT,
      MCPErrorCategory.DESERIALIZATION,
    ];

    return retryableCategories.includes(category);
  }

  /**
   * Detect message type from data
   */
  private detectMessageType(data: string): string {
    try {
      const parsed = JSON.parse(data);
      if (parsed.id !== undefined && parsed.method !== undefined) {
        return "request";
      } else if (
        parsed.id !== undefined &&
        (parsed.result !== undefined || parsed.error !== undefined)
      ) {
        return "response";
      } else if (parsed.id === undefined && parsed.method !== undefined) {
        return "notification";
      }
      return "unknown";
    } catch {
      return "invalid";
    }
  }

  /**
   * Handle JSON-RPC request
   */
  private async handleRequest(request: JSONRPCRequest): Promise<string> {
    const handler = this.messageHandlers.get(request.method);

    if (!handler) {
      const errorResponse = MessageFactory.createResponse(
        request.id,
        undefined,
        MessageFactory.createError(
          JSONRPCErrorCode.METHOD_NOT_FOUND,
          `Method '${request.method}' not found`,
        ),
      );
      return MessageSerializer.serialize(errorResponse);
    }

    try {
      await handler(request);

      // For requests, we expect the handler to send the response
      // Return empty string as the handler will handle the response
      return "";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error(String(error));
      const errorResponse = MessageFactory.createResponse(
        request.id,
        undefined,
        MessageFactory.createError(
          JSONRPCErrorCode.INTERNAL_ERROR,
          errorMessage.message,
        ),
      );
      return MessageSerializer.serialize(errorResponse);
    }
  }

  /**
   * Handle JSON-RPC response
   */
  private handleResponse(response: JSONRPCResponse): void {
    if (response.error) {
      const error = new Error(response.error.message);
      (error as any).code = response.error.code;
      (error as any).data = response.error.data;
      this.requestManager.rejectRequest(response.id, error);
    } else {
      this.requestManager.resolveRequest(response.id, response.result);
    }
  }

  /**
   * Handle JSON-RPC notification
   */
  private handleNotification(notification: JSONRPCNotification): void {
    const handler = this.messageHandlers.get(notification.method);

    if (handler) {
      try {
        handler(notification);
      } catch (error) {
        // Notifications don't get error responses
        if (this.errorHandler) {
          const errorMessage =
            error instanceof Error ? error : new Error(String(error));
          this.errorHandler(errorMessage, notification);
        }
      }
    }
    // If no handler is registered, silently ignore the notification
  }

  /**
   * Send a request and wait for response
   */
  async sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown> | unknown[],
    timeoutMs?: number,
  ): Promise<{ message: string; promise: Promise<T> }> {
    const request = MessageFactory.createRequest(method, params);
    const promise = this.requestManager.registerRequest<T>(
      request.id,
      timeoutMs,
    );

    // Return both the serialized message and the promise
    return {
      message: MessageSerializer.serialize(request),
      promise,
    };
  }

  /**
   * Send a notification (no response expected)
   */
  sendNotification(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): string {
    const notification = MessageFactory.createNotification(method, params);
    return MessageSerializer.serialize(notification);
  }

  /**
   * Get request manager
   */
  getRequestManager(): RequestManager {
    return this.requestManager;
  }

  /**
   * Clear all handlers and pending requests
   */
  clear(): void {
    this.messageHandlers.clear();
    this.requestManager.clearAll();
  }
}

// ============================================================================
// MCP PROTOCOL EXTENSIONS
// ============================================================================

/**
 * MCP-specific protocol extensions and utilities
 */
export class MCPProtocol {
  /**
   * Create initialize request
   */
  static createInitializeRequest(
    clientInfo: { name: string; version: string },
    capabilities?: any,
    requestId?: string,
  ): JSONRPCRequest {
    return MessageFactory.createRequest(
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: capabilities || {},
        clientInfo,
      },
      requestId,
    );
  }

  /**
   * Create tools/list request
   */
  static createToolsListRequest(requestId?: string): JSONRPCRequest {
    return MessageFactory.createRequest("tools/list", undefined, requestId);
  }

  /**
   * Create tools/call request
   */
  static createToolsCallRequest(
    name: string,
    args: Record<string, unknown>,
    requestId?: string,
  ): JSONRPCRequest {
    return MessageFactory.createRequest(
      "tools/call",
      {
        name,
        arguments: args,
      },
      requestId,
    );
  }

  /**
   * Create resources/list request
   */
  static createResourcesListRequest(requestId?: string): JSONRPCRequest {
    return MessageFactory.createRequest("resources/list", undefined, requestId);
  }

  /**
   * Create resources/read request
   */
  static createResourcesReadRequest(
    uri: string,
    requestId?: string,
  ): JSONRPCRequest {
    return MessageFactory.createRequest("resources/read", { uri }, requestId);
  }

  /**
   * Create prompts/list request
   */
  static createPromptsListRequest(requestId?: string): JSONRPCRequest {
    return MessageFactory.createRequest("prompts/list", undefined, requestId);
  }

  /**
   * Create prompts/get request
   */
  static createPromptsGetRequest(
    name: string,
    args?: Record<string, unknown>,
    requestId?: string,
  ): JSONRPCRequest {
    return MessageFactory.createRequest(
      "prompts/get",
      {
        name,
        arguments: args || {},
      },
      requestId,
    );
  }

  /**
   * Validate MCP message
   */
  static validateMessage(message: MCPBaseMessage): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!message.jsonrpc || message.jsonrpc !== "2.0") {
      errors.push("Invalid or missing jsonrpc version");
    }

    if (isJSONRPCRequest(message)) {
      if (!message.method || typeof message.method !== "string") {
        errors.push("Invalid or missing method");
      }
      if (message.id === undefined || message.id === null) {
        errors.push("Missing request ID");
      }
    } else if (isJSONRPCResponse(message)) {
      if (message.id === undefined || message.id === null) {
        errors.push("Missing response ID");
      }
      if (message.result === undefined && message.error === undefined) {
        errors.push("Response must have either result or error");
      }
      if (message.result !== undefined && message.error !== undefined) {
        errors.push("Response cannot have both result and error");
      }
    } else if (isJSONRPCNotification(message)) {
      if (!message.method || typeof message.method !== "string") {
        errors.push("Invalid or missing method");
      }
      if ("id" in message) {
        errors.push("Notification should not have an ID");
      }
    } else {
      errors.push("Unknown message type");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
