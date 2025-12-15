/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Comprehensive TypeScript interfaces and types for the MCP implementation.
 * Provides type safety and clear contracts for all MCP components.
 */

// ============================================================================
// CORE MCP TYPES
// ============================================================================

/**
 * MCP protocol version
 */
export const MCP_VERSION = "2024-11-05" as const;

/**
 * MCP protocol capabilities
 */
export interface MCPCapabilities {
  /** Experimental features */
  experimental?: Record<string, unknown>;
  /** Sampling capabilities */
  sampling?: {
    /** Supported sampling methods */
    methods?: string[];
  };
}

/**
 * MCP client configuration
 */
export interface MCPClientConfig {
  /** Server URL */
  serverUrl: string;
  /** API key for authentication */
  apiKey?: string;
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
  };
  /** Protocol capabilities */
  capabilities?: MCPCapabilities;
  /** Client information */
  clientInfo?: {
    name: string;
    version: string;
  };
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * MCP connection state
 */
export enum MCPConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

/**
 * Base MCP message
 */
export interface MCPBaseMessage {
  /** JSON-RPC version */
  jsonrpc: "2.0";
  /** Message timestamp */
  timestamp?: string;
  /** Message metadata */
  meta?: Record<string, unknown>;
}

// ============================================================================
// JSON-RPC 2.0 TYPES
// ============================================================================

/**
 * JSON-RPC 2.0 request message
 */
export interface JSONRPCRequest extends MCPBaseMessage {
  /** Request identifier */
  id: string | number;
  /** Method name */
  method: string;
  /** Method parameters */
  params?: Record<string, unknown> | unknown[];
}

/**
 * JSON-RPC 2.0 response message
 */
export interface JSONRPCResponse extends MCPBaseMessage {
  /** Request identifier (must match request) */
  id: string | number;
  /** Response result (if successful) */
  result?: unknown;
  /** Error information (if failed) */
  error?: JSONRPCError;
}

/**
 * JSON-RPC 2.0 notification message (no response expected)
 */
export interface JSONRPCNotification extends MCPBaseMessage {
  /** Method name */
  method: string;
  /** Method parameters */
  params?: Record<string, unknown> | unknown[];
}

/**
 * JSON-RPC 2.0 error object
 */
export interface JSONRPCError {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
  /** Additional error data */
  data?: unknown;
}

/**
 * JSON-RPC 2.0 error codes
 */
export enum JSONRPCErrorCode {
  // Standard JSON-RPC errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,

  // MCP-specific errors
  SERVER_ERROR_START = -32000,
  SERVER_ERROR_END = -32099,

  // MCP application errors
  UNAUTHORIZED = -32001,
  FORBIDDEN = -32002,
  NOT_FOUND = -32003,
  CONFLICT = -32004,
  VALIDATION_ERROR = -32005,
  RATE_LIMITED = -32006,
}

// ============================================================================
// MCP-SPECIFIC TYPES
// ============================================================================

/**
 * Tool definition
 */
export interface MCPTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema (JSON Schema) */
  inputSchema: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
        items?: {
          type: string;
        };
        required?: string[];
        [key: string]: unknown;
      }
    >;
    required?: string[];
    additionalProperties?: boolean;
  };
}

/**
 * Tool call request
 */
export interface MCPToolCall {
  /** Tool name */
  name: string;
  /** Tool arguments */
  arguments: Record<string, unknown>;
}

/**
 * Tool result
 */
export interface MCPToolResult {
  /** Result content */
  content: MCPContent[];
  /** Whether the call was successful */
  isError?: boolean;
}

/**
 * Resource definition
 */
export interface MCPResource {
  /** Resource URI */
  uri: string;
  /** Resource name */
  name: string;
  /** Optional description */
  description?: string;
  /** MIME type */
  mimeType?: string;
  /** Resource metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Resource content
 */
export interface MCPResourceContent {
  /** Resource URI */
  uri: string;
  /** Resource content */
  content?: string;
  /** MIME type */
  mimeType?: string;
}

/**
 * Prompt definition
 */
export interface MCPPrompt {
  /** Prompt name */
  name: string;
  /** Prompt description */
  description?: string;
  /** Prompt arguments */
  arguments?: MCPPromptArgument[];
}

/**
 * Prompt argument
 */
export interface MCPPromptArgument {
  /** Argument name */
  name: string;
  /** Argument description */
  description?: string;
  /** Whether argument is required */
  required?: boolean;
  /** Default value */
  default?: string | number | boolean;
}

/**
 * Prompt message
 */
export interface MCPPromptMessage {
  /** Message role */
  role: "user" | "assistant" | "system";
  /** Message content */
  content: MCPContent;
}

/**
 * Prompt result
 */
export interface MCPPromptResult {
  /** Result description */
  description?: string;
  /** Prompt messages */
  messages: MCPPromptMessage[];
}

/**
 * Content types
 */
export type MCPContent = MCPTextContent | MCPImageContent | MCPResourceContent;

/**
 * Text content
 */
export interface MCPTextContent {
  type: "text";
  /** Text content */
  text: string;
}

/**
 * Image content
 */
export interface MCPImageContent {
  type: "image";
  /** Image data (base64) */
  data: string;
  /** MIME type */
  mimeType: string;
}

// ============================================================================
// CLIENT STATE TYPES
// ============================================================================

/**
 * Client status information
 */
export interface MCPClientStatus {
  /** Connection state */
  state: MCPConnectionState;
  /** Last connected timestamp */
  connectedAt?: Date;
  /** Last error */
  lastError?: Error;
  /** Connection attempts */
  connectionAttempts: number;
  /** Server capabilities */
  serverCapabilities?: MCPCapabilities;
  /** Active requests */
  activeRequests: number;
}

/**
 * Operation result
 */
export interface MCPOperationResult<T = unknown> {
  /** Whether operation was successful */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error information */
  error?: Error;
  /** Operation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Client event types
 */
export enum MCPClientEventType {
  CONNECTION_STATE_CHANGED = "connection_state_changed",
  MESSAGE_RECEIVED = "message_received",
  MESSAGE_SENT = "message_sent",
  ERROR_OCCURRED = "error_occurred",
  TOOL_CALLED = "tool_called",
  RESOURCE_ACCESSED = "resource_accessed",
  PROMPT_GENERATED = "prompt_generated",
}

/**
 * Client event
 */
export interface MCPClientEvent {
  /** Event type */
  type: MCPClientEventType;
  /** Event timestamp */
  timestamp: Date;
  /** Event data */
  data?: unknown;
  /** Event source */
  source?: string;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

/**
 * Authentication methods
 */
export enum MCPAuthenticationMethod {
  NONE = "none",
  TOKEN = "token",
  CERTIFICATE = "certificate",
  API_KEY = "api_key",
}

/**
 * Authentication credentials
 */
export interface MCPAuthenticationCredentials {
  /** Authentication method */
  method: MCPAuthenticationMethod;
  /** Authentication token */
  token?: string;
  /** API key */
  apiKey?: string;
  /** Certificate data */
  certificate?: {
    cert: string;
    key: string;
    passphrase?: string;
  };
  /** Additional credentials */
  additional?: Record<string, unknown>;
}

/**
 * Permission definition
 */
export interface MCPPermission {
  /** Resource URI pattern */
  resource: string;
  /** Allowed actions */
  actions: ("read" | "write" | "execute" | "delete")[];
  /** Permission conditions */
  conditions?: Record<string, unknown>;
}

/**
 * Security context
 */
export interface MCPSecurityContext {
  /** User identifier */
  userId?: string;
  /** Session identifier */
  sessionId?: string;
  /** User permissions */
  permissions: MCPPermission[];
  /** Authentication credentials */
  credentials: MCPAuthenticationCredentials;
  /** Security metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

/**
 * Performance metrics
 */
export interface MCPPerformanceMetrics {
  /** Request count */
  requestCount: number;
  /** Average response time */
  averageResponseTime: number;
  /** Error rate */
  errorRate: number;
  /** Connection uptime */
  uptime: number;
  /** Memory usage */
  memoryUsage?: number;
  /** Active connections */
  activeConnections: number;
}

/**
 * Health check result
 */
export interface MCPHealthCheck {
  /** Overall health status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Component health */
  components: Record<
    string,
    {
      status: "healthy" | "degraded" | "unhealthy";
      message?: string;
      lastChecked: Date;
    }
  >;
  /** Health check timestamp */
  timestamp: Date;
}

// ============================================================================
// TYPE GUARDS AND VALIDATION
// ============================================================================

/**
 * Type guard for JSON-RPC request
 */
export function isJSONRPCRequest(obj: unknown): obj is JSONRPCRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj as any).jsonrpc === "2.0" &&
    (typeof (obj as any).id === "string" ||
      typeof (obj as any).id === "number") &&
    typeof (obj as any).method === "string"
  );
}

/**
 * Type guard for JSON-RPC response
 */
export function isJSONRPCResponse(obj: unknown): obj is JSONRPCResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj as any).jsonrpc === "2.0" &&
    (typeof (obj as any).id === "string" ||
      typeof (obj as any).id === "number") &&
    ((obj as any).result !== undefined || (obj as any).error !== undefined)
  );
}

/**
 * Type guard for JSON-RPC notification
 */
export function isJSONRPCNotification(
  obj: unknown,
): obj is JSONRPCNotification {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj as any).jsonrpc === "2.0" &&
    typeof (obj as any).method === "string" &&
    (obj as any).id === undefined
  );
}

/**
 * Type guard for MCP tool
 */
export function isMCPTool(obj: unknown): obj is MCPTool {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).name === "string" &&
    typeof (obj as any).description === "string" &&
    typeof (obj as any).inputSchema === "object" &&
    (obj as any).inputSchema.type === "object"
  );
}

/**
 * Type guard for MCP resource
 */
export function isMCPResource(obj: unknown): obj is MCPResource {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).uri === "string" &&
    typeof (obj as any).name === "string"
  );
}

/**
 * Type guard for MCP prompt
 */
export function isMCPPrompt(obj: unknown): obj is MCPPrompt {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any).name === "string" &&
    ((obj as any).arguments === undefined ||
      Array.isArray((obj as any).arguments))
  );
}

/**
 * Validate MCP client configuration
 */
export function validateMCPClientConfig(config: MCPClientConfig): {
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

  if (config.reconnection) {
    if (
      typeof config.reconnection.maxAttempts !== "number" ||
      config.reconnection.maxAttempts < 0
    ) {
      errors.push("reconnection.maxAttempts must be a non-negative number");
    }
    if (
      typeof config.reconnection.initialDelay !== "number" ||
      config.reconnection.initialDelay <= 0
    ) {
      errors.push("reconnection.initialDelay must be a positive number");
    }
    if (
      typeof config.reconnection.maxDelay !== "number" ||
      config.reconnection.maxDelay <= 0
    ) {
      errors.push("reconnection.maxDelay must be a positive number");
    }
    if (
      typeof config.reconnection.backoffMultiplier !== "number" ||
      config.reconnection.backoffMultiplier <= 1
    ) {
      errors.push("reconnection.backoffMultiplier must be greater than 1");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Deep partial type (recursive Partial)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required keys from type
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Optional keys from type
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Event handler type
 */
export type MCPEventHandler<T = unknown> = (
  event: MCPClientEvent & { data: T },
) => void;

/**
 * Request promise resolver
 */
export interface MCPRequestPromise<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

/**
 * Message handler type
 */
export type MCPMessageHandler = (
  message: JSONRPCRequest | JSONRPCNotification,
) => void;

// ============================================================================
// ERROR MANAGER INTEGRATION TYPES
// ============================================================================

/**
 * MCP-specific error categories that extend ErrorManager categories
 */
export enum MCPErrorCategory {
  // Inherit from ErrorManager
  NETWORK = "network",
  API = "api",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  PROCESSING = "processing",
  RESOURCE = "resource",
  CONFIGURATION = "configuration",
  UNKNOWN = "unknown",

  // MCP-specific categories
  PROTOCOL = "protocol",
  WEBSOCKET = "websocket",
  TOOL_EXECUTION = "tool_execution",
  RESOURCE_ACCESS = "resource_access",
  PROMPT_GENERATION = "prompt_generation",
  SERIALIZATION = "serialization",
  DESERIALIZATION = "deserialization",
  TIMEOUT = "timeout",
  RATE_LIMIT = "rate_limit",
  CIRCUIT_BREAKER = "circuit_breaker",
}

/**
 * MCP error severity levels
 */
export enum MCPErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * MCP error context information
 */
export interface MCPErrorContext {
  /** Component where error occurred */
  component: string;
  /** Operation being performed */
  operation: string;
  /** Error timestamp */
  timestamp: Date;
  /** Session ID */
  sessionId?: string;
  /** Request ID */
  requestId?: string;
  /** Connection ID */
  connectionId?: string;
  /** Tool name (if applicable) */
  toolName?: string;
  /** Resource URI (if applicable) */
  resourceUri?: string;
  /** Prompt name (if applicable) */
  promptName?: string;
  /** Attempt number */
  attempt?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * MCP-specific error information
 */
export interface MCPError {
  /** Unique error ID */
  id: string;
  /** Error message */
  message: string;
  /** Error category */
  category: MCPErrorCategory;
  /** Error severity */
  severity: MCPErrorSeverity;
  /** Error context */
  context: MCPErrorContext;
  /** Original error */
  cause?: Error;
  /** Stack trace */
  stack?: string;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Whether error is retryable */
  retryable: boolean;
  /** Whether human intervention is required */
  requiresHumanIntervention: boolean;
  /** Recovery strategy */
  recoveryStrategy?: MCPRecoveryStrategy;
  /** Error correlation ID */
  correlationId?: string;
}

/**
 * MCP recovery strategy
 */
export interface MCPRecoveryStrategy {
  /** Recovery action */
  action: MCPRecoveryAction;
  /** Delay before recovery (ms) */
  delay?: number;
  /** Maximum attempts */
  maxAttempts?: number;
  /** Fallback component */
  fallbackComponent?: string;
  /** Whether approval is required */
  requiresApproval?: boolean;
  /** Recovery callback */
  callback?: () => Promise<void>;
}

/**
 * MCP recovery actions
 */
export enum MCPRecoveryAction {
  RETRY = "retry",
  ROLLBACK = "rollback",
  SKIP = "skip",
  ESCALATE = "escalate",
  MANUAL = "manual",
  RECONNECT = "reconnect",
  RESET = "reset",
  FALLBACK = "fallback",
}

/**
 * Error mapping between MCP and ErrorManager
 */
export interface MCPErrorMapping {
  /** MCP error category */
  mcpCategory: MCPErrorCategory;
  /** ErrorManager category */
  errorManagerCategory: string;
  /** Default severity */
  defaultSeverity: MCPErrorSeverity;
  /** Default recoverable flag */
  defaultRecoverable: boolean;
  /** Default retryable flag */
  defaultRetryable: boolean;
}

/**
 * Error recovery configuration
 */
export interface MCPErrorRecoveryConfig {
  /** Enable automatic recovery */
  enabled: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Base delay for exponential backoff (ms) */
  baseDelay: number;
  /** Maximum delay (ms) */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Enable jitter */
  jitter: boolean;
  /** Circuit breaker threshold */
  circuitBreakerThreshold: number;
  /** Recovery timeout (ms) */
  recoveryTimeout: number;
}

/**
 * Error reporting configuration
 */
export interface MCPErrorReportingConfig {
  /** Enable error reporting */
  enabled: boolean;
  /** Report to external service */
  reportToService: boolean;
  /** Service endpoint */
  serviceEndpoint?: string;
  /** Include stack traces */
  includeStackTrace: boolean;
  /** Include context metadata */
  includeMetadata: boolean;
  /** Sanitize error messages */
  sanitizeMessages: boolean;
  /** Rate limiting */
  rateLimit?: {
    maxErrorsPerMinute: number;
    maxErrorsPerHour: number;
  };
}

/**
 * Error monitoring configuration
 */
export interface MCPErrorMonitoringConfig {
  /** Enable error monitoring */
  enabled: boolean;
  /** Collect metrics */
  collectMetrics: boolean;
  /** Track error patterns */
  trackPatterns: boolean;
  /** Generate alerts */
  generateAlerts: boolean;
  /** Alert thresholds */
  alertThresholds?: {
    errorsPerMinute: number;
    errorRatePercent: number;
    consecutiveErrors: number;
  };
}

/**
 * Error context builder
 */
export interface MCPErrorContextBuilder {
  /** Component name */
  component: string;
  /** Operation name */
  operation: string;
  /** Session ID */
  sessionId?: string;
  /** Request ID */
  requestId?: string;
  /** Connection ID */
  connectionId?: string;
  /** Tool name */
  toolName?: string;
  /** Resource URI */
  resourceUri?: string;
  /** Prompt name */
  promptName?: string;
  /** Attempt number */
  attempt?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error handler interface for MCP components
 */
export interface MCPErrorHandler {
  /** Handle error with context */
  handleError(error: Error, context: MCPErrorContext): Promise<MCPError>;
  /** Report error */
  reportError(mcpError: MCPError): Promise<void>;
  /** Get recovery strategy */
  getRecoveryStrategy(mcpError: MCPError): MCPRecoveryStrategy;
  /** Execute recovery */
  executeRecovery(mcpError: MCPError): Promise<boolean>;
}

/**
 * Error statistics
 */
export interface MCPErrorStatistics {
  /** Total errors */
  totalErrors: number;
  /** Errors by category */
  errorsByCategory: Record<MCPErrorCategory, number>;
  /** Errors by severity */
  errorsBySeverity: Record<MCPErrorSeverity, number>;
  /** Recovery success rate */
  recoverySuccessRate: number;
  /** Average recovery time */
  averageRecoveryTime: number;
  /** Circuit breaker activations */
  circuitBreakerActivations: number;
  /** Last error timestamp */
  lastError?: Date;
}

// ============================================================================
// ERROR MANAGER INTEGRATION UTILITIES
// ============================================================================

/**
 * Default error mappings between MCP and ErrorManager
 */
export const DEFAULT_MCP_ERROR_MAPPINGS: MCPErrorMapping[] = [
  {
    mcpCategory: MCPErrorCategory.NETWORK,
    errorManagerCategory: "network",
    defaultSeverity: MCPErrorSeverity.MEDIUM,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.API,
    errorManagerCategory: "api",
    defaultSeverity: MCPErrorSeverity.MEDIUM,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.AUTHENTICATION,
    errorManagerCategory: "authentication",
    defaultSeverity: MCPErrorSeverity.CRITICAL,
    defaultRecoverable: false,
    defaultRetryable: false,
  },
  {
    mcpCategory: MCPErrorCategory.VALIDATION,
    errorManagerCategory: "validation",
    defaultSeverity: MCPErrorSeverity.MEDIUM,
    defaultRecoverable: false,
    defaultRetryable: false,
  },
  {
    mcpCategory: MCPErrorCategory.PROTOCOL,
    errorManagerCategory: "processing",
    defaultSeverity: MCPErrorSeverity.HIGH,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.WEBSOCKET,
    errorManagerCategory: "network",
    defaultSeverity: MCPErrorSeverity.HIGH,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.TOOL_EXECUTION,
    errorManagerCategory: "processing",
    defaultSeverity: MCPErrorSeverity.MEDIUM,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.RESOURCE_ACCESS,
    errorManagerCategory: "resource",
    defaultSeverity: MCPErrorSeverity.MEDIUM,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.PROMPT_GENERATION,
    errorManagerCategory: "processing",
    defaultSeverity: MCPErrorSeverity.MEDIUM,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.TIMEOUT,
    errorManagerCategory: "network",
    defaultSeverity: MCPErrorSeverity.HIGH,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.RATE_LIMIT,
    errorManagerCategory: "api",
    defaultSeverity: MCPErrorSeverity.HIGH,
    defaultRecoverable: true,
    defaultRetryable: true,
  },
  {
    mcpCategory: MCPErrorCategory.CIRCUIT_BREAKER,
    errorManagerCategory: "processing",
    defaultSeverity: MCPErrorSeverity.CRITICAL,
    defaultRecoverable: false,
    defaultRetryable: false,
  },
];

/**
 * Default error recovery configuration
 */
export const DEFAULT_MCP_ERROR_RECOVERY_CONFIG: MCPErrorRecoveryConfig = {
  enabled: true,
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  circuitBreakerThreshold: 5,
  recoveryTimeout: 60000,
};

/**
 * Default error reporting configuration
 */
export const DEFAULT_MCP_ERROR_REPORTING_CONFIG: MCPErrorReportingConfig = {
  enabled: true,
  reportToService: false,
  includeStackTrace: true,
  includeMetadata: true,
  sanitizeMessages: true,
  rateLimit: {
    maxErrorsPerMinute: 10,
    maxErrorsPerHour: 100,
  },
};

/**
 * Default error monitoring configuration
 */
export const DEFAULT_MCP_ERROR_MONITORING_CONFIG: MCPErrorMonitoringConfig = {
  enabled: true,
  collectMetrics: true,
  trackPatterns: true,
  generateAlerts: true,
  alertThresholds: {
    errorsPerMinute: 5,
    errorRatePercent: 10,
    consecutiveErrors: 3,
  },
};

// ============================================================================
// ERROR MANAGER INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Create MCP error context
 */
export function createMCPErrorContext(
  builder: MCPErrorContextBuilder,
): MCPErrorContext {
  return {
    component: builder.component,
    operation: builder.operation,
    timestamp: new Date(),
    sessionId: builder.sessionId,
    requestId: builder.requestId,
    connectionId: builder.connectionId,
    toolName: builder.toolName,
    resourceUri: builder.resourceUri,
    promptName: builder.promptName,
    attempt: builder.attempt,
    metadata: builder.metadata,
  };
}

/**
 * Classify error into MCP category
 */
export function classifyMCPError(error: Error): MCPErrorCategory {
  const message = error.message.toLowerCase();

  // Network errors
  if (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("fetch") ||
    message.includes("websocket")
  ) {
    if (message.includes("websocket")) {
      return MCPErrorCategory.WEBSOCKET;
    }
    return MCPErrorCategory.NETWORK;
  }

  // Protocol errors
  if (
    message.includes("protocol") ||
    message.includes("json-rpc") ||
    message.includes("serialization") ||
    message.includes("deserialization")
  ) {
    if (message.includes("serialization")) {
      return MCPErrorCategory.SERIALIZATION;
    }
    if (message.includes("deserialization")) {
      return MCPErrorCategory.DESERIALIZATION;
    }
    return MCPErrorCategory.PROTOCOL;
  }

  // Timeout errors
  if (message.includes("timeout") || message.includes("timed out")) {
    return MCPErrorCategory.TIMEOUT;
  }

  // Rate limit errors
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return MCPErrorCategory.RATE_LIMIT;
  }

  // Authentication errors
  if (
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("authentication") ||
    message.includes("auth")
  ) {
    return MCPErrorCategory.AUTHENTICATION;
  }

  // Validation errors
  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return MCPErrorCategory.VALIDATION;
  }

  // Tool execution errors
  if (message.includes("tool") || message.includes("execution")) {
    return MCPErrorCategory.TOOL_EXECUTION;
  }

  // Resource access errors
  if (message.includes("resource") || message.includes("access")) {
    return MCPErrorCategory.RESOURCE_ACCESS;
  }

  // Prompt generation errors
  if (message.includes("prompt") || message.includes("generation")) {
    return MCPErrorCategory.PROMPT_GENERATION;
  }

  // Configuration errors
  if (message.includes("config") || message.includes("environment")) {
    return MCPErrorCategory.CONFIGURATION;
  }

  return MCPErrorCategory.UNKNOWN;
}

/**
 * Determine error severity
 */
export function determineMCPErrorSeverity(
  error: Error,
  category: MCPErrorCategory,
  attempt?: number,
): MCPErrorSeverity {
  // Critical categories
  if (
    category === MCPErrorCategory.AUTHENTICATION ||
    category === MCPErrorCategory.CIRCUIT_BREAKER ||
    category === MCPErrorCategory.CONFIGURATION
  ) {
    return MCPErrorSeverity.CRITICAL;
  }

  // High severity categories
  if (
    category === MCPErrorCategory.PROTOCOL ||
    category === MCPErrorCategory.WEBSOCKET ||
    category === MCPErrorCategory.TIMEOUT ||
    category === MCPErrorCategory.RATE_LIMIT
  ) {
    // Upgrade to critical after multiple attempts
    if (attempt && attempt > 2) {
      return MCPErrorSeverity.CRITICAL;
    }
    return MCPErrorSeverity.HIGH;
  }

  // Medium severity categories
  if (
    category === MCPErrorCategory.NETWORK ||
    category === MCPErrorCategory.API ||
    category === MCPErrorCategory.TOOL_EXECUTION ||
    category === MCPErrorCategory.RESOURCE_ACCESS ||
    category === MCPErrorCategory.PROMPT_GENERATION
  ) {
    // Upgrade to high after multiple attempts
    if (attempt && attempt > 3) {
      return MCPErrorSeverity.HIGH;
    }
    return MCPErrorSeverity.MEDIUM;
  }

  // Low severity for validation and unknown
  return MCPErrorSeverity.LOW;
}

/**
 * Generate unique error ID
 */
export function generateMCPErrorId(): string {
  return `mcp_err_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Generate correlation ID for error tracking
 */
export function generateMCPCorrelationId(): string {
  return `mcp_corr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Sanitize error message for logging
 */
export function sanitizeMCPErrorMessage(message: string): string {
  // Remove sensitive information
  return message
    .replace(/token[=\/][\w\-\.]+/gi, "token=REDACTED")
    .replace(/key[=\/][\w\-\.]+/gi, "key=REDACTED")
    .replace(/password[=\/][\w\-\.]+/gi, "password=REDACTED")
    .replace(/secret[=\/][\w\-\.]+/gi, "secret=REDACTED")
    .replace(/authorization[=:]\s*[^\s,}]+/gi, "authorization=REDACTED")
    .replace(/bearer\s+[^\s,}]+/gi, "bearer=REDACTED");
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./types";
