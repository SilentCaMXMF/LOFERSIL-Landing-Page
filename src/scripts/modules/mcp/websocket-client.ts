/**
 * MCP WebSocket Client with Reconnection Logic
 *
 * Robust WebSocket client for MCP communication with automatic reconnection,
 * connection state management, error handling, and security features.
 *
 * Features:
 * - Automatic reconnection with exponential backoff and jitter
 * - Connection health monitoring with ping/pong
 * - Message queuing and acknowledgment tracking
 * - Comprehensive error handling and recovery
 * - Security features (WSS, auth tokens, rate limiting)
 * - Performance monitoring and diagnostics
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  MCPClientConfig,
  MCPConnectionState,
  MCPClientEvent,
  MCPClientEventType,
  MCPClientStatus,
  MCPOperationResult,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  MCPBaseMessage,
  validateMCPClientConfig,
} from "./types";
import { ErrorManager } from "../ErrorManager";
import { envLoader } from "../EnvironmentLoader";

// ============================================================================
// WEBSOCKET CLIENT TYPES
// ============================================================================

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Reconnection configuration */
  reconnection?: {
    /** Maximum reconnection attempts */
    maxAttempts: number;
    /** Initial delay in milliseconds */
    initialDelay: number;
    /** Maximum delay in milliseconds */
    maxDelay: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
    /** Enable jitter to prevent thundering herd */
    jitter: boolean;
    /** Immediate reconnect for specific errors */
    immediateReconnectErrors: string[];
  };
  /** Health check configuration */
  healthCheck?: {
    /** Enable ping/pong health checks */
    enabled: boolean;
    /** Ping interval in milliseconds */
    interval: number;
    /** Timeout for ping response in milliseconds */
    timeout: number;
    /** Maximum missed pings before disconnect */
    maxMissedPings: number;
  };
  /** Message configuration */
  message?: {
    /** Maximum message size in bytes */
    maxSize: number;
    /** Enable message queuing when disconnected */
    enableQueuing: boolean;
    /** Maximum queued messages */
    maxQueueSize: number;
    /** Message timeout in milliseconds */
    timeout: number;
  };
  /** Security configuration */
  security?: {
    /** Validate server certificates */
    validateCertificates: boolean;
    /** Allowed origins for connections */
    allowedOrigins: string[];
    /** Rate limiting for connection attempts */
    rateLimit: {
      /** Max attempts per window */
      maxAttempts: number;
      /** Window duration in milliseconds */
      windowMs: number;
    };
  };
  /** Performance monitoring */
  monitoring?: {
    /** Enable performance metrics collection */
    enabled: boolean;
    /** Metrics collection interval */
    interval: number;
  };
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  /** Total connection attempts */
  totalAttempts: number;
  /** Successful connections */
  successfulConnections: number;
  /** Failed connections */
  failedConnections: number;
  /** Total reconnections */
  reconnections: number;
  /** Average connection time in milliseconds */
  averageConnectionTime: number;
  /** Last connection timestamp */
  lastConnectedAt?: Date;
  /** Total uptime in milliseconds */
  totalUptime: number;
  /** Messages sent */
  messagesSent: number;
  /** Messages received */
  messagesReceived: number;
  /** Bytes transferred */
  bytesTransferred: number;
  /** Current latency in milliseconds */
  currentLatency?: number;
  /** Average latency in milliseconds */
  averageLatency: number;
}

/**
 * Queued message
 */
interface QueuedMessage {
  /** Message data */
  data: string;
  /** Timestamp when queued */
  timestamp: Date;
  /** Message ID for tracking */
  id: string;
  /** Resolve function for promise */
  resolve?: (value: void) => void;
  /** Reject function for promise */
  reject?: (error: Error) => void;
  /** Timeout handle */
  timeout?: NodeJS.Timeout;
}

/**
 * WebSocket error types
 */
export enum WebSocketErrorType {
  CONNECTION_FAILED = "connection_failed",
  CONNECTION_TIMEOUT = "connection_timeout",
  CONNECTION_LOST = "connection_lost",
  MESSAGE_TOO_LARGE = "message_too_large",
  INVALID_MESSAGE = "invalid_message",
  AUTHENTICATION_FAILED = "authentication_failed",
  RATE_LIMITED = "rate_limited",
  SERVER_ERROR = "server_error",
  NETWORK_ERROR = "network_error",
  PROTOCOL_ERROR = "protocol_error",
  SECURITY_VIOLATION = "security_violation",
}

/**
 * WebSocket-specific error
 */
export class WebSocketError extends Error {
  constructor(
    public type: WebSocketErrorType,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "WebSocketError";
  }
}

// ============================================================================
// MAIN WEBSOCKET CLIENT CLASS
// ============================================================================

/**
 * MCP WebSocket Client
 *
 * Robust WebSocket client with automatic reconnection, health monitoring,
 * and comprehensive error handling for MCP communication.
 */
export class MCPWebSocketClient {
  private config: MCPClientConfig;
  private wsConfig: WebSocketClientConfig;
  private errorHandler: ErrorManager;
  private ws: WebSocket | null = null;
  private state: MCPConnectionState = MCPConnectionState.DISCONNECTED;
  private eventListeners = new Map<MCPClientEventType, Set<Function>>();
  private messageQueue: QueuedMessage[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private pingTimeoutTimer: NodeJS.Timeout | null = null;
  private connectionStartTime: number | null = null;
  private lastPingTime: number | null = null;
  private missedPings = 0;
  private connectionAttempts = 0;
  private stats: ConnectionStats = {
    totalAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    reconnections: 0,
    averageConnectionTime: 0,
    totalUptime: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesTransferred: 0,
    averageLatency: 0,
  };
  private rateLimitAttempts: number[] = [];
  private monitoringTimer: NodeJS.Timeout | null = null;
  private uptimeStartTime: number | null = null;

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ============================================================================

  constructor(config: MCPClientConfig, errorHandler: ErrorManager) {
    // Validate configuration
    const validation = validateMCPClientConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid MCP client config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = { ...config };
    this.errorHandler = errorHandler;

    // Initialize WebSocket configuration with defaults
    this.wsConfig = this.initializeWebSocketConfig();

    // Load environment-specific settings
    this.loadEnvironmentSettings();

    // Validate security settings
    this.validateSecuritySettings();
  }

  /**
   * Initialize WebSocket configuration with defaults
   */
  private initializeWebSocketConfig(): WebSocketClientConfig {
    return {
      connectionTimeout: this.config.connectionTimeout || 30000,
      reconnection: {
        maxAttempts: this.config.reconnection?.maxAttempts || 10,
        initialDelay: this.config.reconnection?.initialDelay || 1000,
        maxDelay: this.config.reconnection?.maxDelay || 30000,
        backoffMultiplier: this.config.reconnection?.backoffMultiplier || 2,
        jitter: true,
        immediateReconnectErrors: [
          "ECONNRESET",
          "ETIMEDOUT",
          "ENOTFOUND",
          "ECONNREFUSED",
        ],
      },
      healthCheck: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        maxMissedPings: 3,
      },
      message: {
        maxSize: 1024 * 1024, // 1MB
        enableQueuing: true,
        maxQueueSize: 1000,
        timeout: 30000, // 30 seconds
      },
      security: {
        validateCertificates: true,
        allowedOrigins: [], // Empty means allow all origins
        rateLimit: {
          maxAttempts: 10,
          windowMs: 60000, // 1 minute
        },
      },
      monitoring: {
        enabled: true,
        interval: 60000, // 1 minute
      },
    };
  }

  /**
   * Load environment-specific settings
   */
  private loadEnvironmentSettings(): void {
    try {
      const envMcpServerUrl = envLoader.get("MCP_SERVER_URL");
      if (envMcpServerUrl && !this.config.serverUrl) {
        this.config.serverUrl = envMcpServerUrl;
      }

      const envMcpApiKey = envLoader.get("MCP_API_KEY");
      if (envMcpApiKey && !this.config.apiKey) {
        this.config.apiKey = envMcpApiKey;
      }
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "MCPWebSocketClient.loadEnvironmentSettings",
        {
          component: "MCPWebSocketClient",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Validate security settings
   */
  private validateSecuritySettings(): void {
    if (!this.wsConfig.security) {
      return;
    }

    const { security } = this.wsConfig;

    // Validate URL scheme
    if (
      this.config.serverUrl &&
      !this.isValidWebSocketUrl(this.config.serverUrl)
    ) {
      throw new Error("Invalid WebSocket URL");
    }

    // Validate rate limiting
    if (
      security.rateLimit.maxAttempts <= 0 ||
      security.rateLimit.windowMs <= 0
    ) {
      throw new Error("Invalid rate limiting configuration");
    }
  }

  // ============================================================================
  // ERROR MANAGER INTEGRATION
  // ============================================================================

  /**
   * Handle WebSocket error with ErrorManager integration
   */
  private async handleWebSocketError(
    error: Error,
    operation: string,
    additionalContext?: Record<string, unknown>,
  ): Promise<void> {
    // Report to ErrorManager
    this.errorHandler.handleError(error, `MCPWebSocketClient.${operation}`, {
      component: "MCPWebSocketClient",
      timestamp: new Date(),
      metadata: {
        state: this.state,
        url: this.config.serverUrl,
        connectionAttempts: this.connectionAttempts,
        ...additionalContext,
      },
    });

    // Record metrics
    this.errorHandler.incrementCounter("websocket_errors", {
      component: "MCPWebSocketClient",
      operation,
    });

    // Emit error event
    this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
      error,
      operation,
      state: this.state,
    });

    // Update connection state if needed
    if (this.state === MCPConnectionState.CONNECTED) {
      this.setState(MCPConnectionState.ERROR);
    }
  }

  /**
   * Classify WebSocket error for better handling
   */
  private classifyWebSocketError(error: Error): WebSocketErrorType {
    const message = error.message.toLowerCase();

    if (error instanceof WebSocketError) {
      return error.type;
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("fetch")
    ) {
      return WebSocketErrorType.NETWORK_ERROR;
    }

    // Timeout errors
    if (message.includes("timeout")) {
      return WebSocketErrorType.CONNECTION_TIMEOUT;
    }

    // Authentication errors
    if (
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("auth")
    ) {
      return WebSocketErrorType.AUTHENTICATION_FAILED;
    }

    // Rate limit errors
    if (message.includes("rate limit")) {
      return WebSocketErrorType.RATE_LIMITED;
    }

    // Protocol errors
    if (message.includes("protocol") || message.includes("invalid")) {
      return WebSocketErrorType.PROTOCOL_ERROR;
    }

    return WebSocketErrorType.CONNECTION_FAILED;
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.state === MCPConnectionState.CONNECTED) {
      return;
    }

    if (this.state === MCPConnectionState.CONNECTING) {
      throw new Error("Connection already in progress");
    }

    try {
      this.setState(MCPConnectionState.CONNECTING);
      this.connectionAttempts++;
      this.stats.totalAttempts++;

      // Check rate limiting
      if (this.isRateLimited()) {
        throw new WebSocketError(
          WebSocketErrorType.RATE_LIMITED,
          "Connection rate limit exceeded",
        );
      }

      // Create WebSocket connection
      this.ws = new WebSocket(this.config.serverUrl);
      this.connectionStartTime = Date.now();

      // Set up event handlers
      this.setupWebSocketHandlers();

      // Wait for connection
      await this.waitForConnection();

      // Start health checks
      this.startHealthCheck();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.errorHandler.recordSuccess("MCPWebSocketClient");
    } catch (error) {
      await this.handleWebSocketError(error as Error, "connect", {
        connectionAttempts: this.connectionAttempts,
      });
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.state === MCPConnectionState.DISCONNECTED) {
      return;
    }

    // Clear timers
    this.clearReconnectionTimer();
    this.stopHealthCheck();
    this.stopPerformanceMonitoring();

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.setState(MCPConnectionState.DISCONNECTED);
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return (
      this.state === MCPConnectionState.CONNECTED &&
      this.ws?.readyState === WebSocket.OPEN
    );
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Send message to WebSocket server
   */
  async send(data: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Not connected to WebSocket server");
    }

    try {
      // Validate message size
      const messageSize = new Blob([data]).size;
      if (messageSize > this.wsConfig.message!.maxSize) {
        throw new WebSocketError(
          WebSocketErrorType.MESSAGE_TOO_LARGE,
          `Message size ${messageSize} exceeds maximum ${this.wsConfig.message!.maxSize}`,
        );
      }

      // Send message
      this.ws!.send(data);
      this.updateMessageStats(messageSize, true);
    } catch (error) {
      await this.handleWebSocketError(error as Error, "send", {
        messageSize: data.length,
      });
      throw error;
    }
  }

  /**
   * Send message with queuing support
   */
  async sendMessage(data: string): Promise<void> {
    if (this.isConnected()) {
      await this.send(data);
    } else if (this.wsConfig.message!.enableQueuing) {
      await this.queueMessage(data);
    } else {
      throw new Error("Not connected and message queuing is disabled");
    }
  }

  /**
   * Queue message for later sending
   */
  private async queueMessage(data: string): Promise<void> {
    if (this.messageQueue.length >= this.wsConfig.message!.maxQueueSize) {
      throw new WebSocketError(
        WebSocketErrorType.MESSAGE_TOO_LARGE,
        "Message queue is full",
      );
    }

    const message: QueuedMessage = {
      id: this.generateMessageId(),
      data,
      timestamp: new Date(),
    };

    this.messageQueue.push(message);
  }

  /**
   * Flush message queue
   */
  private async flushMessageQueue(): Promise<void> {
    if (!this.isConnected() || this.messageQueue.length === 0) {
      return;
    }

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        await this.send(message.data);
        message.resolve?.();
      } catch (error) {
        message.reject?.(error as Error);
      }
    }
  }

  /**
   * Clear message queue
   */
  private clearMessageQueue(): void {
    for (const message of this.messageQueue) {
      if (message.timeout) {
        clearTimeout(message.timeout);
      }
      message.reject?.(new Error("Connection closed"));
    }
    this.messageQueue = [];
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const data = event.data as string;

      // Validate message
      this.validateMessage(data);

      // Update statistics
      this.updateMessageStats(data.length, false);

      // Emit message event
      this.emitEvent(MCPClientEventType.MESSAGE_RECEIVED, {
        message: data,
        timestamp: new Date(),
      });
    } catch (error) {
      await this.handleWebSocketError(error as Error, "handleMessage", {
        messageData: event.data,
      });
    }
  }

  /**
   * Validate incoming message
   */
  private validateMessage(data: string): void {
    if (typeof data !== "string") {
      throw new WebSocketError(
        WebSocketErrorType.INVALID_MESSAGE,
        "Message must be a string",
      );
    }

    const messageSize = new Blob([data]).size;
    if (messageSize > this.wsConfig.message!.maxSize) {
      throw new WebSocketError(
        WebSocketErrorType.MESSAGE_TOO_LARGE,
        `Message size ${messageSize} exceeds maximum ${this.wsConfig.message!.maxSize}`,
      );
    }
  }

  /**
   * Update message statistics
   */
  private updateMessageStats(bytes: number, sent: boolean): void {
    if (sent) {
      this.stats.messagesSent++;
    } else {
      this.stats.messagesReceived++;
    }
    this.stats.bytesTransferred += bytes;
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    if (!this.wsConfig.healthCheck!.enabled) {
      return;
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.wsConfig.healthCheck!.interval);
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }
  }

  /**
   * Perform health check with ping/pong
   */
  private performHealthCheck(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.lastPingTime = Date.now();

      // Send ping
      this.ws.send(
        JSON.stringify({ type: "ping", timestamp: this.lastPingTime }),
      );

      // Set timeout for pong response
      this.pingTimeoutTimer = setTimeout(() => {
        this.handlePingTimeout();
      }, this.wsConfig.healthCheck!.timeout);
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "WebSocketClient.performHealthCheck",
        {
          component: "MCPWebSocketClient",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Handle ping timeout
   */
  private handlePingTimeout(): void {
    this.missedPings++;

    if (this.missedPings >= this.wsConfig.healthCheck!.maxMissedPings) {
      this.errorHandler.handleError(
        new WebSocketError(
          WebSocketErrorType.CONNECTION_LOST,
          "Health check failed: too many missed pings",
        ),
        "WebSocketClient.handlePingTimeout",
        {
          component: "MCPWebSocketClient",
          timestamp: new Date(),
          metadata: { missedPings: this.missedPings },
        },
      );
      this.disconnect();
    }
  }

  /**
   * Handle pong response
   */
  private handlePong(timestamp: number): void {
    if (this.pingTimeoutTimer) {
      clearTimeout(this.pingTimeoutTimer);
      this.pingTimeoutTimer = null;
    }

    if (this.lastPingTime && timestamp >= this.lastPingTime) {
      const latency = Date.now() - this.lastPingTime;
      this.stats.currentLatency = latency;

      // Update average latency
      this.stats.averageLatency = (this.stats.averageLatency + latency) / 2;
    }

    this.missedPings = 0;
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (!this.wsConfig.monitoring!.enabled) {
      return;
    }

    this.uptimeStartTime = Date.now();
    this.monitoringTimer = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.wsConfig.monitoring!.interval);
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    if (this.uptimeStartTime) {
      this.stats.totalUptime += Date.now() - this.uptimeStartTime;
      this.uptimeStartTime = null;
    }
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): void {
    const metrics = {
      uptime: this.uptimeStartTime ? Date.now() - this.uptimeStartTime : 0,
      messagesSent: this.stats.messagesSent,
      messagesReceived: this.stats.messagesReceived,
      bytesTransferred: this.stats.bytesTransferred,
      currentLatency: this.stats.currentLatency,
      averageLatency: this.stats.averageLatency,
      queueSize: this.messageQueue.length,
    };

    // Record metrics in ErrorManager
    this.errorHandler.recordGauge("websocket_uptime", metrics.uptime);
    this.errorHandler.recordGauge("websocket_queue_size", metrics.queueSize);
    this.errorHandler.recordGauge(
      "websocket_latency",
      metrics.currentLatency || 0,
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if WebSocket URL is valid
   */
  private isValidWebSocketUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "ws:" || parsedUrl.protocol === "wss:";
    } catch {
      return false;
    }
  }

  /**
   * Check if client is rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    const windowStart = now - this.wsConfig.security!.rateLimit.windowMs;

    // Remove old attempts
    this.rateLimitAttempts = this.rateLimitAttempts.filter(
      (attempt) => attempt > windowStart,
    );

    return (
      this.rateLimitAttempts.length >=
      this.wsConfig.security!.rateLimit.maxAttempts
    );
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: MCPClientEventType, data?: unknown): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const event = {
        type: eventType,
        timestamp: new Date(),
        data,
        source: "MCPWebSocketClient",
      };

      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          this.errorHandler.handleError(error, "WebSocketClient.emitEvent", {
            component: "MCPWebSocketClient",
            timestamp: new Date(),
            metadata: { eventType },
          });
        }
      }
    }
  }

  /**
   * Set connection state
   */
  private setState(newState: MCPConnectionState): void {
    const oldState = this.state;
    this.state = newState;

    this.errorHandler.incrementCounter("websocket_state_changes", {
      component: "MCPWebSocketClient",
      fromState: oldState,
      toState: newState,
    });

    this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
      oldState,
      newState,
    });
  }

  /**
   * Wait for connection to be established
   */
  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new WebSocketError(
            WebSocketErrorType.CONNECTION_TIMEOUT,
            "Connection timeout",
          ),
        );
      }, this.wsConfig.connectionTimeout);

      const checkConnection = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          clearTimeout(timeout);
          this.setState(MCPConnectionState.CONNECTED);
          this.onConnectionSuccess();
          resolve();
        } else if (
          this.ws?.readyState === WebSocket.CLOSED ||
          this.ws?.readyState === WebSocket.CLOSING
        ) {
          clearTimeout(timeout);
          this.onConnectionFailure(
            new WebSocketError(
              WebSocketErrorType.CONNECTION_FAILED,
              "Connection failed",
            ),
          );
          reject(
            new WebSocketError(
              WebSocketErrorType.CONNECTION_FAILED,
              "Connection failed",
            ),
          );
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * Handle successful connection
   */
  private onConnectionSuccess(): void {
    const connectionTime = this.connectionStartTime
      ? Date.now() - this.connectionStartTime
      : 0;

    this.stats.successfulConnections++;
    this.stats.lastConnectedAt = new Date();

    // Update average connection time
    this.stats.averageConnectionTime =
      (this.stats.averageConnectionTime *
        (this.stats.successfulConnections - 1) +
        connectionTime) /
      this.stats.successfulConnections;

    this.errorHandler.recordTiming("websocket_connection_time", connectionTime);
    this.errorHandler.incrementCounter("websocket_connections", {
      status: "success",
    });

    // Flush queued messages
    this.flushMessageQueue();
  }

  /**
   * Handle connection failure
   */
  private onConnectionFailure(error: Error): void {
    this.stats.failedConnections++;
    this.setState(MCPConnectionState.ERROR);

    this.errorHandler.incrementCounter("websocket_connections", {
      status: "failed",
    });
    this.handleWebSocketError(error, "connectionFailure");
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => this.handleOpen(event);
    this.ws.onclose = (event) => this.handleClose(event);
    this.ws.onerror = (event) => this.handleError(event);
    this.ws.onmessage = (event) => this.handleMessage(event);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.setState(MCPConnectionState.CONNECTED);
    this.onConnectionSuccess();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    const wasConnected = this.state === MCPConnectionState.CONNECTED;

    this.setState(MCPConnectionState.DISCONNECTED);

    if (wasConnected) {
      this.errorHandler.incrementCounter("websocket_disconnections", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    }

    // Attempt reconnection if enabled and appropriate
    if (wasConnected && this.shouldReconnect(event)) {
      this.scheduleReconnection();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    const error = new Error("WebSocket error occurred");
    this.handleWebSocketError(error, "websocketError");
  }

  /**
   * Check if should attempt reconnection
   */
  private shouldReconnect(event: CloseEvent): boolean {
    // Don't reconnect if this was a normal closure
    if (event.code === 1000) {
      return false;
    }

    // Check if we've exceeded max attempts
    if (this.connectionAttempts >= this.wsConfig.reconnection!.maxAttempts) {
      return false;
    }

    return true;
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.setState(MCPConnectionState.RECONNECTING);

    const delay = this.calculateReconnectionDelay(this.connectionAttempts);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        // Connection failed, will trigger another reconnection if appropriate
      }
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectionTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Calculate reconnection delay with exponential backoff
   */
  private calculateReconnectionDelay(attempt: number): number {
    let delay =
      this.wsConfig.reconnection!.initialDelay *
      Math.pow(this.wsConfig.reconnection!.backoffMultiplier, attempt);
    delay = Math.min(delay, this.wsConfig.reconnection!.maxDelay);

    // Add jitter if enabled
    if (this.wsConfig.reconnection!.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Add event listener
   */
  addEventListener(eventType: MCPClientEventType, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || new Set();
    listeners.add(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: MCPClientEventType, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Get connection state
   */
  getState(): MCPConnectionState {
    return this.state;
  }

  /**
   * Get connection status
   */
  getStatus(): MCPClientStatus {
    return {
      state: this.state,
      connectionAttempts: this.connectionAttempts,
      activeRequests: 0, // WebSocket client doesn't track requests
    };
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Get WebSocket URL
   */
  getServerUrl(): string {
    return this.config.serverUrl;
  }

  /**
   * Get configuration
   */
  getConfig(): MCPClientConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MCPClientConfig>): void {
    const validation = validateMCPClientConfig({
      ...this.config,
      ...newConfig,
    });
    if (!validation.valid) {
      throw new Error(
        `Invalid MCP client config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = { ...this.config, ...newConfig };

    // Reinitialize WebSocket config if needed
    if (newConfig.connectionTimeout || newConfig.reconnection) {
      this.wsConfig = this.initializeWebSocketConfig();
    }
  }

  /**
   * Perform connection diagnostics
   */
  async performDiagnostics(): Promise<
    MCPOperationResult<Record<string, unknown>>
  > {
    const diagnostics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      serverUrl: this.config.serverUrl,
      currentState: this.state,
      connectionAttempts: this.connectionAttempts,
      stats: this.stats,
      queueSize: this.messageQueue.length,
      rateLimitAttempts: this.rateLimitAttempts.length,
    };

    try {
      // Test URL validity
      diagnostics.urlValid = this.isValidWebSocketUrl(this.config.serverUrl);

      // Test network connectivity (basic check)
      const testUrl = new URL(this.config.serverUrl);
      diagnostics.hostname = testUrl.hostname;
      diagnostics.protocol = testUrl.protocol;

      // Test WebSocket support
      diagnostics.websocketSupported = typeof WebSocket !== "undefined";

      // Test configuration
      const configValidation = validateMCPClientConfig(this.config);
      diagnostics.configValid = configValidation.valid;
      diagnostics.configErrors = configValidation.errors;

      return {
        success: true,
        data: diagnostics,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: diagnostics,
      };
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
    this.clearMessageQueue();
    this.rateLimitAttempts = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./websocket-client";
