/**
 * MCP Transport Interface
 *
 * Common interface that both WebSocket and HTTP transports will implement.
 * Provides a unified API for MCP protocol communication over different transport layers.
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  MCPConnectionState,
  MCPClientEvent,
  MCPClientEventType,
  MCPEventHandler,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  MCPError,
  MCPErrorCategory,
  MCPErrorSeverity,
  MCPErrorContextBuilder,
  MCPErrorContext,
  createMCPErrorContext,
  determineMCPErrorSeverity,
  generateMCPErrorId,
  sanitizeMCPErrorMessage,
  MCPRecoveryAction,
} from "./types";

// ============================================================================
// TRANSPORT INTERFACE DEFINITION
// ============================================================================

/**
 * Transport configuration interface
 */
export interface TransportConfig {
  /** Server URL */
  serverUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Transport-specific configuration */
  transportSpecific?: Record<string, unknown>;
}

/**
 * Transport statistics interface
 */
export interface TransportStats {
  /** Total messages sent */
  messagesSent: number;
  /** Total messages received */
  messagesReceived: number;
  /** Total bytes transferred */
  bytesTransferred: number;
  /** Connection uptime in milliseconds */
  connectionUptime: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Number of connection attempts */
  connectionAttempts: number;
  /** Number of successful connections */
  successfulConnections: number;
  /** Number of failed connections */
  failedConnections: number;
  /** Last connected timestamp */
  lastConnected?: Date;
  /** Last error timestamp */
  lastError?: Date;
  /** Transport-specific statistics */
  transportSpecific?: Record<string, unknown>;
}

/**
 * Transport event data
 */
export interface TransportEventData {
  /** Event type specific data */
  [key: string]: unknown;
  /** Message data (if applicable) */
  message?: JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;
  /** Error information (if applicable) */
  error?: Error;
  /** Connection state information */
  connectionState?: MCPConnectionState;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Request/Response ID */
  messageId?: string | number;
}

/**
 * MCP Transport Interface
 *
 * Defines the contract that all MCP transport implementations must follow.
 * Provides a unified interface for different transport mechanisms (WebSocket, HTTP, etc.).
 */
export interface MCPTransport {
  // ========================================================================
  // CORE TRANSPORT METHODS
  // ========================================================================

  /**
   * Connect to the MCP server
   * @returns Promise that resolves when connection is established
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the MCP server
   * @returns Promise that resolves when disconnection is complete
   */
  disconnect(): Promise<void>;

  /**
   * Check if transport is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;

  /**
   * Get current connection state
   * @returns Current connection state
   */
  getConnectionState(): MCPConnectionState;

  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================

  /**
   * Send a JSON-RPC request and wait for response
   * @param method - RPC method name
   * @param params - Method parameters
   * @param timeoutMs - Request timeout in milliseconds
   * @returns Promise that resolves with the response result
   */
  sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown> | unknown[],
    timeoutMs?: number,
  ): Promise<T>;

  /**
   * Send a JSON-RPC notification (no response expected)
   * @param method - RPC method name
   * @param params - Method parameters
   * @returns Promise that resolves when notification is sent
   */
  sendNotification(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): Promise<void>;

  /**
   * Send a raw JSON-RPC message
   * @param message - JSON-RPC message as string
   * @returns Promise that resolves when message is sent
   */
  sendMessage(message: string): Promise<void>;

  // ========================================================================
  // EVENT HANDLING
  // ========================================================================

  /**
   * Add event listener for transport events
   * @param eventType - Event type to listen for
   * @param handler - Event handler function
   */
  addEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<TransportEventData>,
  ): void;

  /**
   * Remove event listener
   * @param eventType - Event type
   * @param handler - Event handler function to remove
   */
  removeEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<TransportEventData>,
  ): void;

  /**
   * Emit transport event
   * @param eventType - Event type
   * @param data - Event data
   */
  emitEvent(eventType: MCPClientEventType, data?: TransportEventData): void;

  // ========================================================================
  // CONFIGURATION AND STATE
  // ========================================================================

  /**
   * Get transport configuration
   * @returns Current transport configuration
   */
  getConfig(): TransportConfig;

  /**
   * Update transport configuration
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<TransportConfig>): void;

  /**
   * Get transport statistics
   * @returns Transport statistics
   */
  getStats(): TransportStats;

  /**
   * Reset transport statistics
   */
  resetStats(): void;

  /**
   * Get transport-specific diagnostics
   * @returns Promise that resolves with diagnostic information
   */
  performDiagnostics(): Promise<Record<string, unknown>>;

  // ========================================================================
  // LIFECYCLE MANAGEMENT
  // ========================================================================

  /**
   * Initialize transport
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Destroy transport and clean up resources
   * @returns Promise that resolves when cleanup is complete
   */
  destroy(): Promise<void>;

  /**
   * Check if transport is healthy
   * @returns Promise that resolves with health status
   */
  healthCheck(): Promise<{
    healthy: boolean;
    details?: Record<string, unknown>;
  }>;

  /**
   * Get transport type identifier
   * @returns Transport type string (e.g., 'websocket', 'http')
   */
  getTransportType(): string;
}

// ============================================================================
// TRANSPORT ERROR TYPES
// ============================================================================

/**
 * Transport-specific error types
 */
export enum TransportErrorType {
  /** Connection failed */
  CONNECTION_FAILED = "connection_failed",
  /** Connection timed out */
  CONNECTION_TIMEOUT = "connection_timeout",
  /** Connection lost */
  CONNECTION_LOST = "connection_lost",
  /** Request failed */
  REQUEST_FAILED = "request_failed",
  /** Request timed out */
  REQUEST_TIMEOUT = "request_timeout",
  /** Invalid response */
  INVALID_RESPONSE = "invalid_response",
  /** Authentication failed */
  AUTHENTICATION_FAILED = "authentication_failed",
  /** Rate limited */
  RATE_LIMITED = "rate_limited",
  /** Server error */
  SERVER_ERROR = "server_error",
  /** Network error */
  NETWORK_ERROR = "network_error",
  /** Protocol error */
  PROTOCOL_ERROR = "protocol_error",
  /** Serialization error */
  SERIALIZATION_ERROR = "serialization_error",
  /** Deserialization error */
  DESERIALIZATION_ERROR = "deserialization_error",
  /** Configuration error */
  CONFIGURATION_ERROR = "configuration_error",
  /** Unknown error */
  UNKNOWN_ERROR = "unknown_error",
}

/**
 * Transport error interface
 */
export interface TransportError extends Error {
  /** Error type */
  type: TransportErrorType;
  /** HTTP status code (if applicable) */
  statusCode?: number;
  /** Response data (if applicable) */
  response?: unknown;
  /** Request data (if applicable) */
  request?: unknown;
  /** Retry count */
  retryCount?: number;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Whether error is retryable */
  retryable: boolean;
  /** Suggested retry delay in milliseconds */
  retryDelay?: number;
  /** Transport-specific error data */
  transportData?: Record<string, unknown>;
  /** Original cause */
  cause?: Error;
}

/**
 * Create a transport error
 */
export function createTransportError(
  type: TransportErrorType,
  message: string,
  options: {
    statusCode?: number;
    response?: unknown;
    request?: unknown;
    retryCount?: number;
    recoverable?: boolean;
    retryable?: boolean;
    retryDelay?: number;
    transportData?: Record<string, unknown>;
    cause?: Error;
  } = {},
): TransportError {
  const error = new Error(message) as TransportError;
  error.name = "TransportError";
  error.type = type;
  error.statusCode = options.statusCode;
  error.response = options.response;
  error.request = options.request;
  error.retryCount = options.retryCount;
  error.recoverable = options.recoverable ?? true;
  error.retryable = options.retryable ?? true;
  error.retryDelay = options.retryDelay;
  error.transportData = options.transportData;

  if (options.cause) {
    error.cause = options.cause;
  }

  return error;
}

// ============================================================================
// TRANSPORT FACTORY
// ============================================================================

/**
 * Transport factory interface
 */
export interface TransportFactory {
  /**
   * Create transport instance
   * @param config - Transport configuration
   * @returns Transport instance
   */
  createTransport(config: TransportConfig): MCPTransport;

  /**
   * Get supported transport types
   * @returns Array of supported transport types
   */
  getSupportedTypes(): string[];

  /**
   * Check if transport type is supported
   * @param type - Transport type
   * @returns True if supported, false otherwise
   */
  isSupported(type: string): boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert transport error to MCP error
 */
export function transportErrorToMCPError(
  transportError: TransportError,
  context: Partial<MCPErrorContext>,
): MCPError {
  const mcpContext = createMCPErrorContext({
    component: context.component || "MCPTransport",
    operation: context.operation || "transport_operation",
    sessionId: context.sessionId,
    requestId: context.requestId,
    connectionId: context.connectionId,
    metadata: {
      ...context.metadata,
      transportType: "unknown",
      errorType: transportError.type,
      statusCode: transportError.statusCode,
      retryCount: transportError.retryCount,
    },
  });

  // Map transport error type to MCP error category
  let category: MCPErrorCategory;
  switch (transportError.type) {
    case TransportErrorType.CONNECTION_FAILED:
    case TransportErrorType.CONNECTION_TIMEOUT:
    case TransportErrorType.CONNECTION_LOST:
    case TransportErrorType.NETWORK_ERROR:
      category = MCPErrorCategory.NETWORK;
      break;

    case TransportErrorType.AUTHENTICATION_FAILED:
      category = MCPErrorCategory.AUTHENTICATION;
      break;

    case TransportErrorType.REQUEST_TIMEOUT:
      category = MCPErrorCategory.TIMEOUT;
      break;

    case TransportErrorType.RATE_LIMITED:
      category = MCPErrorCategory.RATE_LIMIT;
      break;

    case TransportErrorType.PROTOCOL_ERROR:
    case TransportErrorType.SERIALIZATION_ERROR:
    case TransportErrorType.DESERIALIZATION_ERROR:
      category = MCPErrorCategory.PROTOCOL;
      break;

    case TransportErrorType.CONFIGURATION_ERROR:
      category = MCPErrorCategory.CONFIGURATION;
      break;

    default:
      category = MCPErrorCategory.UNKNOWN;
  }

  const severity = determineMCPErrorSeverity(transportError, category);
  const errorId = generateMCPErrorId();

  // Create a proper Error object that extends MCPError
  const mcpError = new Error(transportError.message) as MCPError;
  mcpError.name = "MCPError";
  mcpError.id = errorId;
  mcpError.message = sanitizeMCPErrorMessage(transportError.message);
  mcpError.category = category;
  mcpError.severity = severity;
  mcpError.context = mcpContext;
  mcpError.cause = transportError;
  mcpError.stack = transportError.stack;
  mcpError.recoverable = transportError.recoverable;
  mcpError.retryable = transportError.retryable;
  mcpError.requiresHumanIntervention = severity === MCPErrorSeverity.CRITICAL;
  mcpError.recoveryStrategy = {
    action: transportError.retryable
      ? MCPRecoveryAction.RETRY
      : MCPRecoveryAction.MANUAL,
    delay: transportError.retryDelay,
  };

  return mcpError;
}

/**
 * Validate transport configuration
 */
export function validateTransportConfig(config: TransportConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.serverUrl || typeof config.serverUrl !== "string") {
    errors.push("serverUrl is required and must be a string");
  }

  if (config.connectionTimeout !== undefined) {
    if (
      typeof config.connectionTimeout !== "number" ||
      config.connectionTimeout <= 0
    ) {
      errors.push("connectionTimeout must be a positive number");
    }
  }

  if (config.requestTimeout !== undefined) {
    if (
      typeof config.requestTimeout !== "number" ||
      config.requestTimeout <= 0
    ) {
      errors.push("requestTimeout must be a positive number");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./transport-interface";
