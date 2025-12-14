/**
 * MCP HTTP Transport Implementation
 *
 * HTTP transport layer for MCP protocol communication with Context7.
 * Implements the MCPTransport interface using fetch API for HTTP requests.
 *
 * Features:
 * - JSON-RPC 2.0 protocol over HTTP
 * - Context7 API key authentication
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Request/response caching
 * - Rate limiting support
 * - Performance monitoring
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  MCPConnectionState,
  MCPClientEventType,
  MCPEventHandler,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
} from "./types";
import {
  MCPTransport,
  TransportConfig,
  TransportStats,
  TransportEventData,
  TransportError,
  TransportErrorType,
  createTransportError,
  validateTransportConfig,
} from "./transport-interface";

// ============================================================================
// HTTP TRANSPORT CONFIGURATION
// ============================================================================

/**
 * HTTP transport specific configuration
 */
export interface HTTPTransportConfig extends TransportConfig {
  /** Base URL for API endpoints */
  baseUrl?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms) */
  retryBaseDelay?: number;
  /** Maximum retry delay (ms) */
  retryMaxDelay?: number;
  /** Enable jitter for retry delays */
  retryJitter?: boolean;
  /** Rate limiting configuration */
  rateLimit?: {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window duration in milliseconds */
    windowMs: number;
    /** Retry after rate limit hit (ms) */
    retryAfter: number;
  };
  /** Enable request/response compression */
  enableCompression?: boolean;
  /** Enable caching */
  enableCaching?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Context7 specific configuration */
  context7?: {
    /** API key */
    apiKey: string;
    /** MCP endpoint */
    mcpEndpoint?: string;
    /** API version */
    apiVersion?: string;
  };
}

// ============================================================================
// HTTP TRANSPORT STATE
// ============================================================================

/**
 * Internal HTTP transport state
 */
interface HTTPTransportState {
  /** Connection state */
  connectionState: MCPConnectionState;
  /** Active request controllers */
  activeRequests: Map<string | number, AbortController>;
  /** Request timestamps for rate limiting */
  requestTimestamps: number[];
  /** Response cache */
  responseCache: Map<string, { response: unknown; timestamp: number }>;
  /** Event listeners */
  eventListeners: Map<
    MCPClientEventType,
    Set<MCPEventHandler<TransportEventData>>
  >;
}

// ============================================================================
// MAIN HTTP TRANSPORT CLASS
// ============================================================================

/**
 * HTTP Transport for MCP Protocol
 *
 * Implements MCP communication over HTTP using the fetch API.
 * Specifically designed for Context7 MCP integration.
 */
export class HTTPTransport implements MCPTransport {
  private config: HTTPTransportConfig;
  private state: HTTPTransportState;
  private stats: TransportStats;
  private destroyed = false;
  private connectionStartTime?: number;

  // Default configuration
  private static readonly DEFAULT_CONFIG: Partial<HTTPTransportConfig> = {
    requestTimeout: 30000,
    maxRetries: 3,
    retryBaseDelay: 1000,
    retryMaxDelay: 30000,
    retryJitter: true,
    enableCompression: true,
    enableCaching: false,
    cacheTTL: 300000, // 5 minutes
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
    },
  };

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ============================================================================

  constructor(config: HTTPTransportConfig) {
    // Validate configuration
    const validation = validateTransportConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid HTTP transport config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = this.mergeWithDefaults(config);
    this.state = this.initializeState();
    this.stats = this.initializeStats();
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(config: HTTPTransportConfig): HTTPTransportConfig {
    const merged = {
      ...HTTPTransport.DEFAULT_CONFIG,
      ...config,
    } as HTTPTransportConfig;

    // Set up Context7 specific defaults if provided
    if (config.context7?.apiKey) {
      merged.headers = {
        ...merged.headers,
        Authorization: `Bearer ${config.context7.apiKey}`,
      };
    }

    // Ensure Context7 API key is set if available
    if (config.context7?.apiKey && !config.apiKey) {
      merged.apiKey = config.context7.apiKey;
    }

    return merged;
  }

  /**
   * Initialize transport state
   */
  private initializeState(): HTTPTransportState {
    return {
      connectionState: MCPConnectionState.DISCONNECTED,
      activeRequests: new Map(),
      requestTimestamps: [],
      responseCache: new Map(),
      eventListeners: new Map(),
    };
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): TransportStats {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      connectionUptime: 0,
      averageResponseTime: 0,
      connectionAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      transportSpecific: {
        cacheHits: 0,
        cacheMisses: 0,
        rateLimitHits: 0,
        retries: 0,
      },
    };
  }

  // ============================================================================
  // CORE TRANSPORT METHODS
  // ============================================================================

  /**
   * Initialize HTTP transport
   */
  async initialize(): Promise<void> {
    if (this.destroyed) {
      throw new Error("Transport has been destroyed");
    }

    try {
      this.updateConnectionState(MCPConnectionState.CONNECTING);
      this.connectionStartTime = Date.now();

      // Validate server URL
      await this.validateServerUrl();

      // Test connectivity with a simple request
      await this.performConnectivityTest();

      this.updateConnectionState(MCPConnectionState.CONNECTED);
      this.stats.successfulConnections++;
      this.stats.lastConnected = new Date();

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        connectionState: MCPConnectionState.CONNECTED,
      });
    } catch (error) {
      this.updateConnectionState(MCPConnectionState.ERROR);
      this.stats.failedConnections++;
      this.stats.lastError = new Date();

      const transportError = this.createTransportErrorFromError(
        error,
        TransportErrorType.CONNECTION_FAILED,
      );
      this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
        error: transportError,
        connectionState: MCPConnectionState.ERROR,
      });

      throw transportError;
    }
  }

  /**
   * Connect to HTTP server (alias for initialize)
   */
  async connect(): Promise<void> {
    await this.initialize();
  }

  /**
   * Disconnect from HTTP server
   */
  async disconnect(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    try {
      // Cancel all active requests
      this.cancelAllRequests();

      // Clear caches
      this.state.responseCache.clear();

      // Update connection state
      this.updateConnectionState(MCPConnectionState.DISCONNECTED);

      // Update connection uptime
      if (this.connectionStartTime) {
        this.stats.connectionUptime += Date.now() - this.connectionStartTime;
        this.connectionStartTime = undefined;
      }

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        connectionState: MCPConnectionState.DISCONNECTED,
      });
    } catch (error) {
      const transportError = this.createTransportErrorFromError(
        error,
        TransportErrorType.CONNECTION_FAILED,
      );
      this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
        error: transportError,
      });
    }
  }

  /**
   * Check if transport is connected
   */
  isConnected(): boolean {
    return (
      this.state.connectionState === MCPConnectionState.CONNECTED &&
      !this.destroyed
    );
  }

  /**
   * Get current connection state
   */
  getConnectionState(): MCPConnectionState {
    return this.state.connectionState;
  }

  /**
   * Perform connectivity test
   */
  private async performConnectivityTest(): Promise<{
    success: boolean;
    latency?: number;
  }> {
    const startTime = Date.now();

    try {
      // Send a simple initialize request
      const response = await this.sendHttpRequest(
        {
          jsonrpc: "2.0",
          id: "connectivity_test",
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
              name: "LOFERSIL MCP Client",
              version: "1.0.0",
            },
          },
        },
        10000,
      ); // 10 second timeout for connectivity test

      const latency = Date.now() - startTime;
      return { success: true, latency };
    } catch (error) {
      const errorCause =
        error instanceof Error ? error : new Error(String(error));
      throw createTransportError(
        TransportErrorType.CONNECTION_FAILED,
        "Connectivity test failed",
        { cause: errorCause },
      );
    }
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Send JSON-RPC request and wait for response
   */
  async sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown> | unknown[],
    timeoutMs?: number,
  ): Promise<T> {
    if (this.destroyed) {
      throw createTransportError(
        TransportErrorType.UNKNOWN_ERROR,
        "Transport has been destroyed",
      );
    }

    if (!this.isConnected()) {
      throw createTransportError(
        TransportErrorType.CONNECTION_FAILED,
        "Not connected to server",
      );
    }

    // Check rate limits
    await this.checkRateLimits();

    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const request: JSONRPCRequest = {
      jsonrpc: "2.0",
      id: requestId,
      method,
      params,
    };

    try {
      // Check cache if enabled
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey(method, params);
        const cached = this.state.responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL!) {
          if (this.stats.transportSpecific) {
            (this.stats.transportSpecific as any).cacheHits++;
          }
          return cached.response as T;
        }
        if (this.stats.transportSpecific) {
          (this.stats.transportSpecific as any).cacheMisses++;
        }
      }

      // Send request with retry logic
      const response = await this.sendRequestWithRetry(
        request,
        timeoutMs || this.config.requestTimeout!,
      );

      // Cache response if enabled
      if (this.config.enableCaching && !response.error) {
        const cacheKey = this.getCacheKey(method, params);
        this.state.responseCache.set(cacheKey, {
          response: (response as any).result,
          timestamp: Date.now(),
        });
      }

      // Handle JSON-RPC error
      if (response.error) {
        throw createTransportError(
          TransportErrorType.SERVER_ERROR,
          (response.error as any).message || "Server error",
          {
            statusCode: 200,
            response: response.error,
            request: request,
          },
        );
      }

      // Handle JSON-RPC error
      if (response.error) {
        throw createTransportError(
          TransportErrorType.SERVER_ERROR,
          (response.error as any).message || "Server error",
          {
            statusCode: 200,
            response: response.error,
            request: request,
          },
        );
      }

      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, true);
      this.stats.messagesSent++;
      this.stats.messagesReceived++;

      this.emitEvent(MCPClientEventType.MESSAGE_SENT, {
        message: request,
        responseTime,
        messageId: requestId,
      });

      this.emitEvent(MCPClientEventType.MESSAGE_RECEIVED, {
        message: response,
        responseTime,
        messageId: requestId,
      });

      return (response as any).result as T;
    } catch (error) {
      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);

      // Clean up on error
      this.state.activeRequests.delete(requestId);

      const transportError = this.createTransportErrorFromError(
        error,
        TransportErrorType.REQUEST_FAILED,
      );
      this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
        error: transportError,
        request: request,
        responseTime,
        messageId: requestId,
      });

      throw transportError;
    }
  }

  /**
   * Send JSON-RPC notification (no response expected)
   */
  async sendNotification(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): Promise<void> {
    if (this.destroyed) {
      throw createTransportError(
        TransportErrorType.UNKNOWN_ERROR,
        "Transport has been destroyed",
      );
    }

    if (!this.isConnected()) {
      throw createTransportError(
        TransportErrorType.CONNECTION_FAILED,
        "Not connected to server",
      );
    }

    // Check rate limits
    await this.checkRateLimits();

    const startTime = Date.now();
    const notification: JSONRPCNotification = {
      jsonrpc: "2.0",
      method,
      params,
    };

    try {
      await this.sendHttpRequest(notification);

      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, true);
      this.stats.messagesSent++;

      this.emitEvent(MCPClientEventType.MESSAGE_SENT, {
        message: notification,
        responseTime,
      });
    } catch (error) {
      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);

      const transportError = this.createTransportErrorFromError(
        error,
        TransportErrorType.REQUEST_FAILED,
      );
      this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
        error: transportError,
        request: notification,
        responseTime,
      });

      throw transportError;
    }
  }

  /**
   * Send raw JSON-RPC message
   */
  async sendMessage(message: string): Promise<void> {
    try {
      const parsedMessage = JSON.parse(message);

      if (this.isRequest(parsedMessage)) {
        await this.sendRequest(parsedMessage.method, parsedMessage.params);
      } else if (this.isNotification(parsedMessage)) {
        await this.sendNotification(parsedMessage.method, parsedMessage.params);
      } else {
        throw createTransportError(
          TransportErrorType.INVALID_RESPONSE,
          "Invalid message format",
          { request: message },
        );
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "type" in error &&
        "retryable" in error
      ) {
        throw error;
      }

      throw createTransportError(
        TransportErrorType.SERIALIZATION_ERROR,
        "Failed to parse message",
        { request: message, cause: error as Error },
      );
    }
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Add event listener
   */
  addEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<TransportEventData>,
  ): void {
    const listeners = this.state.eventListeners.get(eventType) || new Set();
    listeners.add(handler);
    this.state.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<TransportEventData>,
  ): void {
    const listeners = this.state.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler);
      if (listeners.size === 0) {
        this.state.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emitEvent(eventType: MCPClientEventType, data?: TransportEventData): void {
    const listeners = this.state.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener({
            type: eventType,
            timestamp: new Date(),
            data: data || {},
            source: "HTTPTransport",
          });
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      }
    }
  }

  // ============================================================================
  // CONFIGURATION AND STATE MANAGEMENT
  // ============================================================================

  /**
   * Get transport configuration
   */
  getConfig(): TransportConfig {
    return { ...this.config };
  }

  /**
   * Update transport configuration
   */
  updateConfig(newConfig: Partial<HTTPTransportConfig>): void {
    const validation = validateTransportConfig({
      ...this.config,
      ...newConfig,
    });
    if (!validation.valid) {
      throw new Error(
        `Invalid transport config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = { ...this.config, ...newConfig };

    // Update headers if provided
    if (newConfig.headers) {
      this.config.headers = { ...this.config.headers, ...newConfig.headers };
    }

    // Update Context7 API key if provided
    if (newConfig.context7?.apiKey) {
      this.config.headers = {
        ...this.config.headers,
        Authorization: `Bearer ${newConfig.context7.apiKey}`,
      };
      this.config.apiKey = newConfig.context7.apiKey;
    }
  }

  /**
   * Get transport statistics
   */
  getStats(): TransportStats {
    // Update connection uptime if currently connected
    if (this.connectionStartTime && this.isConnected()) {
      this.stats.connectionUptime = Date.now() - this.connectionStartTime;
    }

    return { ...this.stats };
  }

  /**
   * Reset transport statistics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * Perform transport diagnostics
   */
  async performDiagnostics(): Promise<Record<string, unknown>> {
    const diagnostics: Record<string, unknown> = {
      transportType: this.getTransportType(),
      connectionState: this.state.connectionState,
      connected: this.isConnected(),
      destroyed: this.destroyed,
      config: this.config,
      stats: this.getStats(),
      activeRequests: this.state.activeRequests.size,
      cacheSize: this.state.responseCache.size,
      eventListeners: {},
    };

    // Count event listeners
    for (const [eventType, listeners] of this.state.eventListeners) {
      (diagnostics.eventListeners as any)[eventType] = listeners.size;
    }

    try {
      // Test server connectivity
      const connectivityTest = await this.performConnectivityTest();
      diagnostics.connectivityTest = connectivityTest;
    } catch (error) {
      diagnostics.connectivityTest = {
        success: false,
        error: (error as Error).message,
      };
    }

    return diagnostics;
  }

  /**
   * Check transport health
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details?: Record<string, unknown>;
  }> {
    try {
      if (this.destroyed) {
        return {
          healthy: false,
          details: { reason: "Transport destroyed" },
        };
      }

      if (!this.isConnected()) {
        return {
          healthy: false,
          details: {
            reason: "Not connected",
            state: this.state.connectionState,
          },
        };
      }

      // Test basic connectivity
      await this.performConnectivityTest();

      return {
        healthy: true,
        details: {
          state: this.state.connectionState,
          activeRequests: this.state.activeRequests.size,
          uptime: this.connectionStartTime
            ? Date.now() - this.connectionStartTime
            : 0,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: (error as Error).message },
      };
    }
  }

  /**
   * Get transport type
   */
  getTransportType(): string {
    return "http";
  }

  /**
   * Destroy transport and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    try {
      await this.disconnect();

      // Clear all state
      this.state.activeRequests.clear();
      this.state.requestTimestamps = [];
      this.state.responseCache.clear();
      this.state.eventListeners.clear();
    } catch (error) {
      console.error("Error during HTTP transport destruction:", error);
    }
  }

  // ============================================================================
  // PRIVATE HTTP REQUEST METHODS
  // ============================================================================

  /**
   * Send HTTP request with retry logic
   */
  private async sendRequestWithRetry<T>(
    request: JSONRPCRequest,
    timeoutMs: number,
  ): Promise<JSONRPCResponse> {
    let lastError: Error | undefined;
    const maxRetries = this.config.maxRetries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendHttpRequest(request, timeoutMs);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (error && typeof error === "object" && "retryable" in error) {
          const transportError = error as TransportError;
          if (!transportError.retryable || attempt === maxRetries) {
            throw error;
          }
        }

        // Calculate delay for next attempt
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await this.delay(delay);
          if (this.stats.transportSpecific) {
            (this.stats.transportSpecific as any).retries++;
          }
        }
      }
    }

    throw lastError || new Error("Request failed after all retries");
  }

  /**
   * Send HTTP request
   */
  private async sendHttpRequest(
    message: JSONRPCRequest | JSONRPCNotification,
    timeoutMs?: number,
  ): Promise<JSONRPCResponse> {
    const controller = new AbortController();
    const requestId = "id" in message ? message.id : undefined;

    if (requestId !== undefined) {
      this.state.activeRequests.set(requestId, controller);
    }

    try {
      // Prepare request
      const url = this.buildRequestUrl();
      const headers = this.buildRequestHeaders();
      const body = JSON.stringify(message);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs || this.config.requestTimeout);

      // Send request
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Update byte transfer statistics
      this.stats.bytesTransferred += body.length;

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => null);
        throw createTransportError(
          TransportErrorType.SERVER_ERROR,
          `HTTP ${response.status}: ${response.statusText}`,
          {
            statusCode: response.status,
            response: errorText,
            request: message,
          },
        );
      }

      // Parse response
      const responseText = await response.text();
      this.stats.bytesTransferred += responseText.length;

      let parsedResponse: JSONRPCResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        throw createTransportError(
          TransportErrorType.DESERIALIZATION_ERROR,
          "Failed to parse server response",
          {
            response: responseText,
            request: message,
            cause: parseError as Error,
          },
        );
      }

      // Validate response format
      if (!this.isValidResponse(parsedResponse)) {
        throw createTransportError(
          TransportErrorType.INVALID_RESPONSE,
          "Invalid response format",
          {
            response: parsedResponse,
            request: message,
          },
        );
      }

      return parsedResponse;
    } catch (error) {
      // Handle fetch errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw createTransportError(
            TransportErrorType.REQUEST_TIMEOUT,
            "Request timed out",
            { request: message, retryCount: 0, retryDelay: 1000 },
          );
        }

        // Check if it's already a transport error by looking for transport-specific properties
        if (
          error &&
          typeof error === "object" &&
          "type" in error &&
          "retryable" in error
        ) {
          throw error;
        }

        // Convert network errors to transport errors
        throw createTransportError(
          TransportErrorType.NETWORK_ERROR,
          error.message,
          { request: message, cause: error },
        );
      }

      throw error;
    } finally {
      if (requestId !== undefined) {
        this.state.activeRequests.delete(requestId);
      }
    }
  }

  // ============================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================

  /**
   * Build request URL
   */
  private buildRequestUrl(): string {
    const baseUrl = this.config.context7?.mcpEndpoint || this.config.serverUrl;

    // Ensure URL has proper format
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      return `https://${baseUrl}`;
    }

    return baseUrl;
  }

  /**
   * Build request headers
   */
  private buildRequestHeaders(): Record<string, string> {
    const headers = { ...this.config.headers };

    // Add Context7 specific headers
    if (this.config.context7?.apiVersion) {
      headers["X-API-Version"] = this.config.context7.apiVersion;
    }

    // Add compression header if enabled
    if (this.config.enableCompression) {
      headers["Accept-Encoding"] = "gzip, deflate, br";
    }

    return headers;
  }

  /**
   * Validate server URL
   */
  private async validateServerUrl(): Promise<void> {
    const url = this.buildRequestUrl();

    try {
      new URL(url);
    } catch (error) {
      throw createTransportError(
        TransportErrorType.CONFIGURATION_ERROR,
        `Invalid server URL: ${url}`,
        { cause: error as Error },
      );
    }
  }

  /**
   * Check rate limits
   */
  private async checkRateLimits(): Promise<void> {
    if (!this.config.rateLimit) {
      return;
    }

    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;

    // Remove old timestamps
    this.state.requestTimestamps = this.state.requestTimestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    // Check if limit exceeded
    if (
      this.state.requestTimestamps.length >= this.config.rateLimit.maxRequests
    ) {
      if (this.stats.transportSpecific) {
        (this.stats.transportSpecific as any).rateLimitHits++;
      }

      throw createTransportError(
        TransportErrorType.RATE_LIMITED,
        "Rate limit exceeded",
        {
          retryDelay: this.config.rateLimit.retryAfter,
          retryable: true,
        },
      );
    }

    // Add current timestamp
    this.state.requestTimestamps.push(now);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    let delay = (this.config.retryBaseDelay || 1000) * Math.pow(2, attempt);
    delay = Math.min(delay, this.config.retryMaxDelay || 30000);

    // Add jitter if enabled
    if (this.config.retryJitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Update connection state
   */
  private updateConnectionState(newState: MCPConnectionState): void {
    const oldState = this.state.connectionState;
    this.state.connectionState = newState;

    this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
      connectionState: newState,
      oldState,
    });
  }

  /**
   * Update statistics
   */
  private updateStats(responseTime: number, success: boolean): void {
    // Update average response time
    const totalMessages = this.stats.messagesSent + this.stats.messagesReceived;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * totalMessages + responseTime) /
      (totalMessages + 1);
  }

  /**
   * Cancel all active requests
   */
  private cancelAllRequests(): void {
    for (const [id, controller] of this.state.activeRequests) {
      controller.abort();
    }
    this.state.activeRequests.clear();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `http_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Get cache key for request
   */
  private getCacheKey(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): string {
    return `${method}:${JSON.stringify(params || {})}`;
  }

  /**
   * Check if message is a request
   */
  private isRequest(message: unknown): message is JSONRPCRequest {
    return (
      typeof message === "object" &&
      message !== null &&
      (message as any).jsonrpc === "2.0" &&
      typeof (message as any).method === "string" &&
      (typeof (message as any).id === "string" ||
        typeof (message as any).id === "number")
    );
  }

  /**
   * Check if message is a notification
   */
  private isNotification(message: unknown): message is JSONRPCNotification {
    return (
      typeof message === "object" &&
      message !== null &&
      (message as any).jsonrpc === "2.0" &&
      typeof (message as any).method === "string" &&
      (message as any).id === undefined
    );
  }

  /**
   * Check if response is valid
   */
  private isValidResponse(response: unknown): response is JSONRPCResponse {
    return (
      typeof response === "object" &&
      response !== null &&
      (response as any).jsonrpc === "2.0" &&
      (typeof (response as any).id === "string" ||
        typeof (response as any).id === "number") &&
      ((response as any).result !== undefined ||
        (response as any).error !== undefined)
    );
  }

  /**
   * Create transport error from generic error
   */
  private createTransportErrorFromError(
    error: unknown,
    defaultType: TransportErrorType,
  ): TransportError {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      "retryable" in error
    ) {
      return error as TransportError;
    }

    if (error instanceof Error) {
      // Determine error type based on message
      let type = defaultType;
      if (error.message.includes("timeout")) {
        type = TransportErrorType.REQUEST_TIMEOUT;
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        type = TransportErrorType.NETWORK_ERROR;
      } else if (error.message.includes("rate limit")) {
        type = TransportErrorType.RATE_LIMITED;
      }

      return createTransportError(type, error.message, {
        cause: error,
        retryable:
          type !== TransportErrorType.AUTHENTICATION_FAILED &&
          type !== TransportErrorType.CONFIGURATION_ERROR,
      });
    }

    return createTransportError(defaultType, String(error));
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an HTTP transport client for Context7
 */
export function createContext7Transport(
  apiKey: string,
  mcpEndpoint?: string,
): HTTPTransport {
  const config: HTTPTransportConfig = {
    serverUrl: mcpEndpoint || "https://mcp.context7.com/mcp",
    context7: {
      apiKey,
      mcpEndpoint: mcpEndpoint || "https://mcp.context7.com/mcp",
      apiVersion: "v1",
    },
    requestTimeout: 30000,
    maxRetries: 3,
    enableCaching: false,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
    },
  };

  return new HTTPTransport(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./http-transport";
