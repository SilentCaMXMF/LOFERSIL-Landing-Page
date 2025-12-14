/**
 * MCP Error Handler and Reconnection Logic
 *
 * Comprehensive error handling and reconnection system for MCP operations.
 * Integrates seamlessly with the existing ErrorManager system while providing
 * MCP-specific error classification, recovery strategies, and circuit breaker patterns.
 *
 * Features:
 * - MCP-specific error classification and routing
 * - Intelligent reconnection with exponential backoff and jitter
 * - Circuit breaker pattern for fault tolerance
 * - Error recovery strategies and automatic retry mechanisms
 * - Integration with existing ErrorManager system
 * - Performance monitoring and error analytics
 * - Security-focused error handling
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  MCPConnectionState,
  MCPClientEvent,
  MCPClientEventType,
  MCPOperationResult,
  JSONRPCErrorCode,
  MCPClientConfig,
} from "./types";
import {
  ErrorManager,
  ErrorSeverity,
  ErrorCategory,
  RecoveryAction,
  CircuitBreakerState,
  type ErrorContext,
  type RecoveryStrategy,
} from "../ErrorManager";
import { envLoader } from "../EnvironmentLoader";

// ============================================================================
// MCP ERROR TYPES AND CLASSIFICATION
// ============================================================================

/**
 * MCP-specific error categories
 */
export enum MCPErrorCategory {
  CONNECTION = "connection",
  PROTOCOL = "protocol",
  TOOL_EXECUTION = "tool_execution",
  RESOURCE_ACCESS = "resource_access",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  RATE_LIMITING = "rate_limiting",
  TIMEOUT = "timeout",
  SYSTEM = "system",
  SECURITY = "security",
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
 * MCP-specific error types
 */
export enum MCPErrorType {
  // Connection Errors
  WEBSOCKET_CONNECTION_FAILED = "websocket_connection_failed",
  WEBSOCKET_CONNECTION_TIMEOUT = "websocket_connection_timeout",
  WEBSOCKET_CONNECTION_LOST = "websocket_connection_lost",
  SERVER_UNAVAILABLE = "server_unavailable",
  NETWORK_UNREACHABLE = "network_unreachable",
  SSL_CERTIFICATE_ERROR = "ssl_certificate_error",

  // Protocol Errors
  INVALID_JSON_RPC = "invalid_json_rpc",
  MALFORMED_MESSAGE = "malformed_message",
  PROTOCOL_VERSION_MISMATCH = "protocol_version_mismatch",
  REQUEST_RESPONSE_MISMATCH = "request_response_mismatch",
  MISSING_REQUIRED_FIELD = "missing_required_field",

  // Tool Execution Errors
  TOOL_NOT_FOUND = "tool_not_found",
  INVALID_TOOL_PARAMETERS = "invalid_tool_parameters",
  TOOL_EXECUTION_TIMEOUT = "tool_execution_timeout",
  TOOL_RUNTIME_ERROR = "tool_runtime_error",
  TOOL_PERMISSION_DENIED = "tool_permission_denied",

  // Resource Access Errors
  RESOURCE_NOT_FOUND = "resource_not_found",
  RESOURCE_ACCESS_DENIED = "resource_access_denied",
  INVALID_RESOURCE_URI = "invalid_resource_uri",
  RESOURCE_LOADING_FAILED = "resource_loading_failed",
  RESOURCE_TOO_LARGE = "resource_too_large",

  // Rate Limiting Errors
  RATE_LIMITING = "rate_limiting",

  // Authentication Errors
  AUTHENTICATION_FAILED = "authentication_failed",
  AUTHORIZATION_FAILED = "authorization_failed",
  INVALID_API_KEY = "invalid_api_key",
  TOKEN_EXPIRED = "token_expired",
  INSUFFICIENT_PERMISSIONS = "insufficient_permissions",

  // System Errors
  MEMORY_ALLOCATION_FAILED = "memory_allocation_failed",
  CONFIGURATION_ERROR = "configuration_error",
  DEPENDENCY_FAILURE = "dependency_failure",
  RESOURCE_EXHAUSTION = "resource_exhaustion",
  INTERNAL_SERVER_ERROR = "internal_server_error",
}

/**
 * MCP-specific error interface
 */
export interface MCPError extends Error {
  /** MCP error type */
  type: MCPErrorType;
  /** MCP error category */
  category: MCPErrorCategory;
  /** MCP error severity */
  severity: MCPErrorSeverity;
  /** Whether error is recoverable */
  recoverable: boolean;
  /** Whether error is retryable */
  retryable: boolean;
  /** Whether error requires human intervention */
  requiresHumanIntervention: boolean;
  /** Error context */
  context?: MCPErrorContext;
  /** Original error cause */
  cause?: Error;
  /** Error metadata */
  metadata?: Record<string, unknown>;
  /** Error timestamp */
  timestamp: Date;
  /** Error ID for tracking */
  id: string;
}

/**
 * MCP error context
 */
export interface MCPErrorContext extends ErrorContext {
  /** MCP operation being performed */
  operation?: string;
  /** MCP tool name (if applicable) */
  toolName?: string;
  /** MCP resource URI (if applicable) */
  resourceUri?: string;
  /** Connection attempt number */
  connectionAttempt?: number;
  /** Request ID */
  requestId?: string;
  /** Server URL */
  serverUrl?: string;
  /** Protocol version */
  protocolVersion?: string;
  /** Additional MCP-specific metadata */
  mcpMetadata?: Record<string, unknown>;
}

// ============================================================================
// RECONNECTION CONFIGURATION
// ============================================================================

/**
 * Reconnection configuration
 */
export interface MCPReconnectionConfig {
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
  /** Jitter range (0-1) */
  jitterRange: number;
  /** Immediate reconnect for specific error types */
  immediateReconnectErrors: MCPErrorType[];
  /** Excluded error types (no reconnection) */
  excludedErrors: MCPErrorType[];
  /** Connection timeout per attempt */
  connectionTimeout: number;
  /** Health check before reconnection */
  healthCheckBeforeReconnect: boolean;
  /** Backoff strategy */
  backoffStrategy: "exponential" | "linear" | "fixed";
}

/**
 * Circuit breaker configuration
 */
export interface MCPCircuitBreakerConfig {
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Success threshold to close circuit */
  successThreshold: number;
  /** Timeout before attempting to close circuit */
  recoveryTimeout: number;
  /** Monitoring period for failure counting */
  monitoringPeriod: number;
  /** Half-open state max calls */
  halfOpenMaxCalls: number;
  /** Enable circuit breaker */
  enabled: boolean;
}

/**
 * Error recovery configuration
 */
export interface MCPErrorRecoveryConfig {
  /** Enable automatic recovery */
  enabled: boolean;
  /** Maximum recovery attempts */
  maxAttempts: number;
  /** Recovery delay in milliseconds */
  delay: number;
  /** Recovery strategies by error type */
  strategies: Map<MCPErrorType, RecoveryStrategy>;
  /** Fallback recovery strategy */
  fallbackStrategy: RecoveryStrategy;
  /** Enable graceful degradation */
  gracefulDegradation: boolean;
}

// ============================================================================
// RECONNECTION MANAGER
// ============================================================================

/**
 * MCP Reconnection Manager
 *
 * Handles intelligent reconnection logic with exponential backoff,
 * jitter, health checks, and connection state management.
 */
export class MCPReconnectionManager {
  private config: MCPReconnectionConfig;
  private errorManager: ErrorManager;
  private reconnectionStates = new Map<string, MCPReconnectionState>();
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();
  private reconnectPromises = new Map<string, Promise<void>>();

  constructor(config: MCPReconnectionConfig, errorManager: ErrorManager) {
    this.config = config;
    this.errorManager = errorManager;
  }

  /**
   * Initiate reconnection for a component
   */
  async reconnect(
    component: string,
    reconnectFn: () => Promise<void>,
    errorType?: MCPErrorType,
  ): Promise<void> {
    // Check if already reconnecting
    const existingPromise = this.reconnectPromises.get(component);
    if (existingPromise) {
      return existingPromise;
    }

    const state = this.getReconnectionState(component);

    // Check if we've exceeded max attempts
    if (state.attempt >= this.config.maxAttempts) {
      throw new Error(
        `Reconnection failed for ${component} after ${this.config.maxAttempts} attempts`,
      );
    }

    // Create reconnection promise
    const reconnectionPromise = this.performReconnection(
      component,
      reconnectFn,
      errorType,
    );

    this.reconnectPromises.set(component, reconnectionPromise);

    try {
      await reconnectionPromise;
    } finally {
      this.reconnectPromises.delete(component);
    }
  }

  /**
   * Perform actual reconnection with backoff
   */
  private async performReconnection(
    component: string,
    reconnectFn: () => Promise<void>,
    errorType?: MCPErrorType,
  ): Promise<void> {
    const state = this.getReconnectionState(component);
    state.isReconnecting = true;

    try {
      for (
        let attempt = state.attempt + 1;
        attempt <= this.config.maxAttempts;
        attempt++
      ) {
        state.attempt = attempt;
        state.lastAttemptTime = new Date();

        try {
          // Calculate delay
          const delay = this.calculateReconnectionDelay(attempt, errorType);

          if (attempt > 1) {
            this.errorManager.showInfoMessage(
              `Attempting reconnection ${attempt}/${this.config.maxAttempts} for ${component} in ${Math.round(delay)}ms`,
            );
            await this.delay(delay);
          }

          // Perform health check before reconnecting if enabled
          if (this.config.healthCheckBeforeReconnect && attempt > 1) {
            const isHealthy = await this.performHealthCheck(component);
            if (!isHealthy) {
              continue; // Skip this attempt if health check fails
            }
          }

          // Attempt reconnection
          this.errorManager.showInfoMessage(
            `Reconnecting ${component} (attempt ${attempt}/${this.config.maxAttempts})`,
          );

          await reconnectFn();

          // Success - update state and start health monitoring
          state.successfulReconnections++;
          state.attempt = 0;
          state.isReconnecting = false;
          state.lastAttemptTime = new Date();
          state.nextAttemptTime = undefined;

          this.errorManager.showSuccessMessage(
            `Successfully reconnected ${component}`,
          );

          this.errorManager.incrementCounter("mcp_reconnections_success", {
            component,
            attempt: attempt.toString(),
          });

          // Start health monitoring
          this.startHealthMonitoring(component, reconnectFn);

          return;
        } catch (error) {
          state.failedReconnections++;

          this.errorManager.handleError(
            error,
            `MCPReconnectionManager.reconnect.${component}`,
            {
              component: "MCPReconnectionManager",
              timestamp: new Date(),
              metadata: {
                targetComponent: component,
                attempt,
                errorType,
              },
            },
          );

          if (attempt === this.config.maxAttempts) {
            this.errorManager.showErrorMessage(
              `Failed to reconnect ${component} after ${this.config.maxAttempts} attempts`,
              10000,
            );
            throw error;
          }
        }
      }
    } finally {
      state.isReconnecting = false;
    }
  }

  /**
   * Calculate reconnection delay with backoff and jitter
   */
  private calculateReconnectionDelay(
    attempt: number,
    errorType?: MCPErrorType,
  ): number {
    let delay: number;

    switch (this.config.backoffStrategy) {
      case "linear":
        delay = this.config.initialDelay * attempt;
        break;
      case "fixed":
        delay = this.config.initialDelay;
        break;
      case "exponential":
      default:
        delay =
          this.config.initialDelay *
          Math.pow(this.config.backoffMultiplier, attempt - 1);
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterAmount = delay * this.config.jitterRange;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    // Immediate reconnect for specific errors
    if (errorType && this.config.immediateReconnectErrors.includes(errorType)) {
      delay = 100; // Small delay for immediate reconnect
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Perform health check before reconnection
   */
  private async performHealthCheck(component: string): Promise<boolean> {
    try {
      // Simple health check - in a real implementation, this might ping the server
      // or check network connectivity
      await this.delay(1000); // Simulate health check
      return true;
    } catch (error) {
      this.errorManager.handleError(
        error,
        `MCPReconnectionManager.healthCheck.${component}`,
        {
          component: "MCPReconnectionManager",
          timestamp: new Date(),
        },
      );
      return false;
    }
  }

  /**
   * Start health monitoring for a connected component
   */
  private startHealthMonitoring(
    component: string,
    reconnectFn: () => Promise<void>,
  ): void {
    // Stop existing health monitoring
    this.stopHealthMonitoring(component);

    const interval = setInterval(async () => {
      try {
        const isHealthy = await this.performHealthCheck(component);
        if (!isHealthy) {
          this.errorManager.showInfoMessage(
            `Health check failed for ${component}, attempting reconnection`,
          );

          // Stop health monitoring and attempt reconnection
          this.stopHealthMonitoring(component);
          await this.reconnect(component, reconnectFn);
        }
      } catch (error) {
        this.errorManager.handleError(
          error,
          `MCPReconnectionManager.healthMonitoring.${component}`,
          {
            component: "MCPReconnectionManager",
            timestamp: new Date(),
          },
        );
      }
    }, this.config.connectionTimeout || 30000);

    this.healthCheckIntervals.set(component, interval);
  }

  /**
   * Stop health monitoring for a component
   */
  stopHealthMonitoring(component: string): void {
    const interval = this.healthCheckIntervals.get(component);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(component);
    }
  }

  /**
   * Get reconnection state for a component
   */
  getReconnectionState(component: string): MCPReconnectionState {
    let state = this.reconnectionStates.get(component);

    if (!state) {
      state = {
        attempt: 0,
        lastAttemptTime: undefined,
        nextAttemptTime: undefined,
        isReconnecting: false,
        totalAttempts: 0,
        successfulReconnections: 0,
        failedReconnections: 0,
      };
      this.reconnectionStates.set(component, state);
    }

    return state;
  }

  /**
   * Reset reconnection state for a component
   */
  resetReconnectionState(component: string): void {
    this.stopHealthMonitoring(component);
    this.reconnectionStates.delete(component);
    this.reconnectPromises.delete(component);
  }

  /**
   * Check if component is currently reconnecting
   */
  isReconnecting(component: string): boolean {
    const state = this.reconnectionStates.get(component);
    return state?.isReconnecting || false;
  }

  /**
   * Get time until next reconnection attempt
   */
  getTimeUntilNextAttempt(component: string): number | null {
    const state = this.reconnectionStates.get(component);
    if (!state?.nextAttemptTime) {
      return null;
    }

    return Math.max(0, state.nextAttemptTime.getTime() - Date.now());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MCPReconnectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get all reconnection states
   */
  getAllReconnectionStates(): Record<string, MCPReconnectionState> {
    return Object.fromEntries(this.reconnectionStates);
  }

  /**
   * Destroy reconnection manager and clean up resources
   */
  destroy(): void {
    // Stop all health monitoring
    for (const component of this.healthCheckIntervals.keys()) {
      this.stopHealthMonitoring(component);
    }

    // Clear all states
    this.reconnectionStates.clear();
    this.reconnectPromises.clear();
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MAIN MCP ERROR HANDLER CLASS
// ============================================================================

/**
 * MCP Error Handler
 *
 * Comprehensive error handling system for MCP operations with intelligent
 * reconnection logic, circuit breaker pattern, and recovery strategies.
 */
export class MCPErrorHandler {
  private errorManager: ErrorManager;
  private reconnectionConfig: MCPReconnectionConfig;
  private circuitBreakerConfig: MCPCircuitBreakerConfig;
  private recoveryConfig: MCPErrorRecoveryConfig;
  private reconnectionManager: MCPReconnectionManager;

  // Circuit breaker state
  private circuitBreakers = new Map<string, MCPCircuitBreakerState>();

  // Reconnection state (kept for backward compatibility)
  private reconnectionState = new Map<string, MCPReconnectionState>();

  // Error statistics
  private errorStats = new Map<MCPErrorType, MCPErrorStatistics>();

  // Event listeners
  private eventListeners = new Map<string, Set<Function>>();

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ============================================================================

  constructor(
    errorManager: ErrorManager,
    config: {
      reconnection?: Partial<MCPReconnectionConfig>;
      circuitBreaker?: Partial<MCPCircuitBreakerConfig>;
      recovery?: Partial<MCPErrorRecoveryConfig>;
    } = {},
  ) {
    this.errorManager = errorManager;

    // Initialize configurations with defaults
    this.reconnectionConfig = {
      maxAttempts: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      jitterRange: 0.1,
      immediateReconnectErrors: [
        MCPErrorType.WEBSOCKET_CONNECTION_LOST,
        MCPErrorType.NETWORK_UNREACHABLE,
      ],
      excludedErrors: [
        MCPErrorType.AUTHENTICATION_FAILED,
        MCPErrorType.INVALID_API_KEY,
        MCPErrorType.SSL_CERTIFICATE_ERROR,
      ],
      connectionTimeout: 10000,
      healthCheckBeforeReconnect: true,
      backoffStrategy: "exponential",
      ...config.reconnection,
    };

    this.circuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 3,
      recoveryTimeout: 60000,
      monitoringPeriod: 300000,
      halfOpenMaxCalls: 3,
      enabled: true,
      ...config.circuitBreaker,
    };

    this.recoveryConfig = {
      enabled: true,
      maxAttempts: 3,
      delay: 1000,
      strategies: new Map(),
      fallbackStrategy: {
        action: RecoveryAction.ESCALATE,
        requiresApproval: true,
      },
      gracefulDegradation: true,
      ...config.recovery,
    };

    // Initialize default recovery strategies
    this.initializeDefaultRecoveryStrategies();

    // Initialize reconnection manager
    this.reconnectionManager = new MCPReconnectionManager(
      this.reconnectionConfig,
      this.errorManager,
    );

    // Load environment settings
    this.loadEnvironmentSettings();
  }

  /**
   * Load environment-specific settings
   */
  private loadEnvironmentSettings(): void {
    try {
      // Override config with environment variables
      const envMaxAttempts = envLoader.get("MCP_RECONNECTION_MAX_ATTEMPTS");
      if (envMaxAttempts) {
        this.reconnectionConfig.maxAttempts = parseInt(envMaxAttempts, 10);
      }

      const envInitialDelay = envLoader.get("MCP_RECONNECTION_INITIAL_DELAY");
      if (envInitialDelay) {
        this.reconnectionConfig.initialDelay = parseInt(envInitialDelay, 10);
      }

      const envMaxDelay = envLoader.get("MCP_RECONNECTION_MAX_DELAY");
      if (envMaxDelay) {
        this.reconnectionConfig.maxDelay = parseInt(envMaxDelay, 10);
      }

      const envEnableCircuitBreaker = envLoader.get(
        "MCP_CIRCUIT_BREAKER_ENABLED",
      );
      if (envEnableCircuitBreaker) {
        this.circuitBreakerConfig.enabled = envEnableCircuitBreaker === "true";
      }
    } catch (error) {
      this.errorManager.handleError(
        error,
        "MCPErrorHandler.loadEnvironmentSettings",
        {
          component: "MCPErrorHandler",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Initialize default recovery strategies for different error types
   */
  private initializeDefaultRecoveryStrategies(): void {
    // Connection errors - retry with reconnection
    this.recoveryConfig.strategies.set(
      MCPErrorType.WEBSOCKET_CONNECTION_FAILED,
      {
        action: RecoveryAction.RETRY,
        delay: this.reconnectionConfig.initialDelay,
        maxAttempts: this.reconnectionConfig.maxAttempts,
      },
    );

    this.recoveryConfig.strategies.set(
      MCPErrorType.WEBSOCKET_CONNECTION_TIMEOUT,
      {
        action: RecoveryAction.RETRY,
        delay: this.reconnectionConfig.initialDelay * 2,
        maxAttempts: Math.floor(this.reconnectionConfig.maxAttempts / 2),
      },
    );

    // Protocol errors - skip or escalate based on severity
    this.recoveryConfig.strategies.set(MCPErrorType.INVALID_JSON_RPC, {
      action: RecoveryAction.SKIP,
    });

    this.recoveryConfig.strategies.set(MCPErrorType.PROTOCOL_VERSION_MISMATCH, {
      action: RecoveryAction.ESCALATE,
      requiresApproval: true,
    });

    // Tool execution errors - retry for timeouts, skip for invalid parameters
    this.recoveryConfig.strategies.set(MCPErrorType.TOOL_EXECUTION_TIMEOUT, {
      action: RecoveryAction.RETRY,
      delay: 5000,
      maxAttempts: 2,
    });

    this.recoveryConfig.strategies.set(MCPErrorType.INVALID_TOOL_PARAMETERS, {
      action: RecoveryAction.SKIP,
    });

    // Authentication errors - manual intervention required
    this.recoveryConfig.strategies.set(MCPErrorType.AUTHENTICATION_FAILED, {
      action: RecoveryAction.MANUAL,
      requiresApproval: true,
    });

    // Rate limiting - retry with exponential backoff
    this.recoveryConfig.strategies.set(MCPErrorType.RATE_LIMITING, {
      action: RecoveryAction.RETRY,
      delay: 10000,
      maxAttempts: 3,
    });
  }

  // ============================================================================
  // ERROR CLASSIFICATION AND HANDLING
  // ============================================================================

  /**
   * Handle an MCP error with classification and recovery
   */
  async handleError(
    error: unknown,
    context?: MCPErrorContext,
  ): Promise<{
    mcpError: MCPError;
    recoveryStrategy: RecoveryStrategy;
    shouldReconnect: boolean;
    circuitBreakerState: MCPCircuitBreakerState;
  }> {
    // Classify the error
    const mcpError = this.classifyError(error, context);

    // Update error statistics
    this.updateErrorStatistics(mcpError);

    // Log error through ErrorManager
    this.logError(mcpError);

    // Check circuit breaker
    const circuitBreakerState = this.checkCircuitBreaker(mcpError);

    // Determine recovery strategy
    const recoveryStrategy = this.determineRecoveryStrategy(mcpError);

    // Determine if reconnection is needed
    const shouldReconnect = this.shouldReconnect(mcpError, recoveryStrategy);

    // Emit error event
    this.emitEvent("mcp_error", {
      error: mcpError,
      recoveryStrategy,
      circuitBreakerState,
      shouldReconnect,
    });

    return {
      mcpError,
      recoveryStrategy,
      shouldReconnect,
      circuitBreakerState,
    };
  }

  /**
   * Classify an unknown error into MCP error format
   */
  private classifyError(error: unknown, context?: MCPErrorContext): MCPError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Determine error type and category
    const {
      type,
      category,
      severity,
      recoverable,
      retryable,
      requiresHumanIntervention,
    } = this.determineErrorClassification(errorMessage, error);

    const mcpError: MCPError = {
      name: "MCPError",
      message: errorMessage,
      type,
      category,
      severity,
      recoverable,
      retryable,
      requiresHumanIntervention,
      context,
      cause: error instanceof Error ? error : undefined,
      stack: errorStack,
      metadata: {
        originalError: error,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      id: this.generateErrorId(),
    };

    return mcpError;
  }

  /**
   * Determine error classification based on message and type
   */
  private determineErrorClassification(
    message: string,
    originalError: unknown,
  ): {
    type: MCPErrorType;
    category: MCPErrorCategory;
    severity: MCPErrorSeverity;
    recoverable: boolean;
    retryable: boolean;
    requiresHumanIntervention: boolean;
  } {
    const lowerMessage = message.toLowerCase();

    // Connection errors
    if (
      lowerMessage.includes("websocket") ||
      lowerMessage.includes("connection") ||
      lowerMessage.includes("network")
    ) {
      if (lowerMessage.includes("failed") || lowerMessage.includes("refused")) {
        return {
          type: MCPErrorType.WEBSOCKET_CONNECTION_FAILED,
          category: MCPErrorCategory.CONNECTION,
          severity: MCPErrorSeverity.HIGH,
          recoverable: true,
          retryable: true,
          requiresHumanIntervention: false,
        };
      }
      if (lowerMessage.includes("timeout")) {
        return {
          type: MCPErrorType.WEBSOCKET_CONNECTION_TIMEOUT,
          category: MCPErrorCategory.TIMEOUT,
          severity: MCPErrorSeverity.MEDIUM,
          recoverable: true,
          retryable: true,
          requiresHumanIntervention: false,
        };
      }
      if (lowerMessage.includes("lost") || lowerMessage.includes("closed")) {
        return {
          type: MCPErrorType.WEBSOCKET_CONNECTION_LOST,
          category: MCPErrorCategory.CONNECTION,
          severity: MCPErrorSeverity.HIGH,
          recoverable: true,
          retryable: true,
          requiresHumanIntervention: false,
        };
      }
    }

    // SSL/TLS errors
    if (
      lowerMessage.includes("ssl") ||
      lowerMessage.includes("tls") ||
      lowerMessage.includes("certificate")
    ) {
      return {
        type: MCPErrorType.SSL_CERTIFICATE_ERROR,
        category: MCPErrorCategory.SECURITY,
        severity: MCPErrorSeverity.CRITICAL,
        recoverable: false,
        retryable: false,
        requiresHumanIntervention: true,
      };
    }

    // Protocol errors
    if (lowerMessage.includes("json") || lowerMessage.includes("parse")) {
      return {
        type: MCPErrorType.INVALID_JSON_RPC,
        category: MCPErrorCategory.PROTOCOL,
        severity: MCPErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: false,
        requiresHumanIntervention: false,
      };
    }

    // Authentication errors
    if (
      lowerMessage.includes("unauthorized") ||
      lowerMessage.includes("401") ||
      lowerMessage.includes("authentication")
    ) {
      return {
        type: MCPErrorType.AUTHENTICATION_FAILED,
        category: MCPErrorCategory.AUTHENTICATION,
        severity: MCPErrorSeverity.CRITICAL,
        recoverable: false,
        retryable: false,
        requiresHumanIntervention: true,
      };
    }

    // Authorization errors
    if (
      lowerMessage.includes("forbidden") ||
      lowerMessage.includes("403") ||
      lowerMessage.includes("permission")
    ) {
      return {
        type: MCPErrorType.AUTHORIZATION_FAILED,
        category: MCPErrorCategory.AUTHENTICATION,
        severity: MCPErrorSeverity.HIGH,
        recoverable: false,
        retryable: false,
        requiresHumanIntervention: true,
      };
    }

    // Rate limiting
    if (
      lowerMessage.includes("rate limit") ||
      lowerMessage.includes("429") ||
      lowerMessage.includes("too many requests")
    ) {
      return {
        type: MCPErrorType.RATE_LIMITING,
        category: MCPErrorCategory.RATE_LIMITING,
        severity: MCPErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        requiresHumanIntervention: false,
      };
    }

    // Timeout errors
    if (lowerMessage.includes("timeout")) {
      return {
        type: MCPErrorType.TOOL_EXECUTION_TIMEOUT,
        category: MCPErrorCategory.TIMEOUT,
        severity: MCPErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        requiresHumanIntervention: false,
      };
    }

    // Tool errors
    if (lowerMessage.includes("tool") || lowerMessage.includes("method")) {
      if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
        return {
          type: MCPErrorType.TOOL_NOT_FOUND,
          category: MCPErrorCategory.TOOL_EXECUTION,
          severity: MCPErrorSeverity.MEDIUM,
          recoverable: false,
          retryable: false,
          requiresHumanIntervention: false,
        };
      }
      if (
        lowerMessage.includes("parameter") ||
        lowerMessage.includes("argument")
      ) {
        return {
          type: MCPErrorType.INVALID_TOOL_PARAMETERS,
          category: MCPErrorCategory.VALIDATION,
          severity: MCPErrorSeverity.MEDIUM,
          recoverable: false,
          retryable: false,
          requiresHumanIntervention: false,
        };
      }
    }

    // Resource errors
    if (lowerMessage.includes("resource")) {
      if (lowerMessage.includes("not found") || lowerMessage.includes("404")) {
        return {
          type: MCPErrorType.RESOURCE_NOT_FOUND,
          category: MCPErrorCategory.RESOURCE_ACCESS,
          severity: MCPErrorSeverity.MEDIUM,
          recoverable: false,
          retryable: false,
          requiresHumanIntervention: false,
        };
      }
    }

    // Server errors
    if (
      lowerMessage.includes("500") ||
      lowerMessage.includes("502") ||
      lowerMessage.includes("503") ||
      lowerMessage.includes("504")
    ) {
      return {
        type: MCPErrorType.INTERNAL_SERVER_ERROR,
        category: MCPErrorCategory.SYSTEM,
        severity: MCPErrorSeverity.HIGH,
        recoverable: true,
        retryable: true,
        requiresHumanIntervention: false,
      };
    }

    // Default classification
    return {
      type: MCPErrorType.INTERNAL_SERVER_ERROR,
      category: MCPErrorCategory.SYSTEM,
      severity: MCPErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      requiresHumanIntervention: false,
    };
  }

  // ============================================================================
  // CIRCUIT BREAKER IMPLEMENTATION
  // ============================================================================

  /**
   * Check and update circuit breaker state
   */
  private checkCircuitBreaker(error: MCPError): MCPCircuitBreakerState {
    if (!this.circuitBreakerConfig.enabled) {
      return {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: undefined,
        lastSuccessTime: new Date(),
        halfOpenCalls: 0,
      };
    }

    const component = error.context?.component || "default";
    let circuitBreaker = this.circuitBreakers.get(component);

    if (!circuitBreaker) {
      circuitBreaker = {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: undefined,
        lastSuccessTime: new Date(),
        halfOpenCalls: 0,
      };
      this.circuitBreakers.set(component, circuitBreaker);
    }

    // Update circuit breaker based on error
    if (error.severity >= MCPErrorSeverity.HIGH) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = new Date();

      // Check if circuit should open
      if (
        circuitBreaker.failureCount >=
        this.circuitBreakerConfig.failureThreshold
      ) {
        circuitBreaker.state = CircuitBreakerState.OPEN;
        this.errorManager.incrementCounter("mcp_circuit_breaker_opened", {
          component,
          errorType: error.type,
        });
      }
    }

    return circuitBreaker;
  }

  /**
   * Record success for circuit breaker
   */
  recordSuccess(component: string = "default"): void {
    if (!this.circuitBreakerConfig.enabled) {
      return;
    }

    const circuitBreaker = this.circuitBreakers.get(component);
    if (!circuitBreaker) {
      return;
    }

    circuitBreaker.successCount++;
    circuitBreaker.lastSuccessTime = new Date();

    // Check if circuit should close
    if (
      circuitBreaker.state === CircuitBreakerState.HALF_OPEN &&
      circuitBreaker.successCount >= this.circuitBreakerConfig.successThreshold
    ) {
      circuitBreaker.state = CircuitBreakerState.CLOSED;
      circuitBreaker.failureCount = 0;
      circuitBreaker.successCount = 0;
      circuitBreaker.halfOpenCalls = 0;

      this.errorManager.incrementCounter("mcp_circuit_breaker_closed", {
        component,
      });
    }
  }

  /**
   * Attempt to reset circuit breaker
   */
  attemptCircuitBreakerReset(component: string = "default"): boolean {
    if (!this.circuitBreakerConfig.enabled) {
      return true;
    }

    const circuitBreaker = this.circuitBreakers.get(component);
    if (!circuitBreaker || circuitBreaker.state !== CircuitBreakerState.OPEN) {
      return true;
    }

    const timeSinceFailure =
      Date.now() - (circuitBreaker.lastFailureTime?.getTime() || 0);
    if (timeSinceFailure >= this.circuitBreakerConfig.recoveryTimeout) {
      circuitBreaker.state = CircuitBreakerState.HALF_OPEN;
      circuitBreaker.halfOpenCalls = 0;
      return true;
    }

    return false;
  }

  // ============================================================================
  // RECONNECTION LOGIC
  // ============================================================================

  /**
   * Calculate reconnection delay with backoff and jitter
   */
  calculateReconnectionDelay(
    attempt: number,
    errorType?: MCPErrorType,
  ): number {
    let delay: number;

    switch (this.reconnectionConfig.backoffStrategy) {
      case "linear":
        delay = this.reconnectionConfig.initialDelay * attempt;
        break;
      case "fixed":
        delay = this.reconnectionConfig.initialDelay;
        break;
      case "exponential":
      default:
        delay =
          this.reconnectionConfig.initialDelay *
          Math.pow(this.reconnectionConfig.backoffMultiplier, attempt - 1);
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, this.reconnectionConfig.maxDelay);

    // Add jitter if enabled
    if (this.reconnectionConfig.jitter) {
      const jitterAmount = delay * this.reconnectionConfig.jitterRange;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    // Immediate reconnect for specific errors
    if (
      errorType &&
      this.reconnectionConfig.immediateReconnectErrors.includes(errorType)
    ) {
      delay = 100; // Small delay for immediate reconnect
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Check if error should trigger reconnection
   */
  shouldReconnect(
    error: MCPError,
    recoveryStrategy: RecoveryStrategy,
  ): boolean {
    // Don't reconnect if circuit breaker is open
    const component = error.context?.component || "default";
    const circuitBreaker = this.circuitBreakers.get(component);
    if (circuitBreaker?.state === CircuitBreakerState.OPEN) {
      return false;
    }

    // Don't reconnect for excluded error types
    if (this.reconnectionConfig.excludedErrors.includes(error.type)) {
      return false;
    }

    // Don't reconnect if error is not recoverable
    if (!error.recoverable || !error.retryable) {
      return false;
    }

    // Check recovery strategy
    if (recoveryStrategy.action === RecoveryAction.RETRY) {
      return true;
    }

    // Connection errors typically require reconnection
    if (error.category === MCPErrorCategory.CONNECTION) {
      return true;
    }

    return false;
  }

  /**
   * Get reconnection state for a component
   */
  getReconnectionState(component: string = "default"): MCPReconnectionState {
    let state = this.reconnectionState.get(component);

    if (!state) {
      state = {
        attempt: 0,
        lastAttemptTime: undefined,
        nextAttemptTime: undefined,
        isReconnecting: false,
        totalAttempts: 0,
        successfulReconnections: 0,
        failedReconnections: 0,
      };
      this.reconnectionState.set(component, state);
    }

    return state;
  }

  /**
   * Update reconnection state
   */
  updateReconnectionState(
    component: string,
    success: boolean,
    attempt?: number,
  ): void {
    const state = this.getReconnectionState(component);

    if (success) {
      state.attempt = 0;
      state.isReconnecting = false;
      state.successfulReconnections++;
      state.lastAttemptTime = new Date();
      state.nextAttemptTime = undefined;
    } else {
      state.attempt = attempt || state.attempt + 1;
      state.failedReconnections++;
      state.lastAttemptTime = new Date();
      state.nextAttemptTime = new Date(
        Date.now() + this.calculateReconnectionDelay(state.attempt),
      );
    }

    state.totalAttempts++;
  }

  // ============================================================================
  // RECOVERY STRATEGIES
  // ============================================================================

  /**
   * Determine recovery strategy for an error
   */
  private determineRecoveryStrategy(error: MCPError): RecoveryStrategy {
    // Check for specific strategy
    const specificStrategy = this.recoveryConfig.strategies.get(error.type);
    if (specificStrategy) {
      return specificStrategy;
    }

    // Check circuit breaker state
    const component = error.context?.component || "default";
    const circuitBreaker = this.circuitBreakers.get(component);
    if (circuitBreaker?.state === CircuitBreakerState.OPEN) {
      return {
        action: RecoveryAction.ESCALATE,
        requiresApproval: true,
      };
    }

    // Check if error requires human intervention
    if (error.requiresHumanIntervention) {
      return {
        action: RecoveryAction.MANUAL,
        requiresApproval: true,
      };
    }

    // Check if error is retryable
    if (error.retryable && error.recoverable) {
      return {
        action: RecoveryAction.RETRY,
        delay: this.calculateReconnectionDelay(1, error.type),
        maxAttempts: this.recoveryConfig.maxAttempts,
      };
    }

    // Default to skip for low severity errors
    if (error.severity === MCPErrorSeverity.LOW) {
      return {
        action: RecoveryAction.SKIP,
      };
    }

    // Default fallback strategy
    return this.recoveryConfig.fallbackStrategy;
  }

  /**
   * Execute recovery strategy
   */
  async executeRecoveryStrategy(
    error: MCPError,
    strategy: RecoveryStrategy,
  ): Promise<MCPOperationResult<void>> {
    try {
      switch (strategy.action) {
        case RecoveryAction.RETRY:
          return await this.executeRetryStrategy(error, strategy);

        case RecoveryAction.SKIP:
          return await this.executeSkipStrategy(error, strategy);

        case RecoveryAction.ROLLBACK:
          return await this.executeRollbackStrategy(error, strategy);

        case RecoveryAction.ESCALATE:
          return await this.executeEscalateStrategy(error, strategy);

        case RecoveryAction.MANUAL:
          return await this.executeManualStrategy(error, strategy);

        default:
          throw new Error(`Unknown recovery strategy: ${strategy.action}`);
      }
    } catch (recoveryError) {
      return {
        success: false,
        error:
          recoveryError instanceof Error
            ? recoveryError
            : new Error(String(recoveryError)),
      };
    }
  }

  /**
   * Execute retry strategy
   */
  private async executeRetryStrategy(
    error: MCPError,
    strategy: RecoveryStrategy,
  ): Promise<MCPOperationResult<void>> {
    const maxAttempts = strategy.maxAttempts || this.recoveryConfig.maxAttempts;
    const delay = strategy.delay || this.recoveryConfig.delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wait before retry
        if (attempt > 1) {
          await this.delay(delay * Math.pow(2, attempt - 1));
        }

        // Emit retry event
        this.emitEvent("mcp_retry_attempt", {
          error,
          attempt,
          maxAttempts,
        });

        // The actual retry would be handled by the calling code
        // This method just sets up the retry logic
        return {
          success: true,
          metadata: {
            retryAttempt: attempt,
            maxAttempts,
          },
        };
      } catch (retryError) {
        if (attempt === maxAttempts) {
          throw retryError;
        }
      }
    }

    return {
      success: false,
      error: new Error(`Retry failed after ${maxAttempts} attempts`),
    };
  }

  /**
   * Execute skip strategy
   */
  private async executeSkipStrategy(
    error: MCPError,
    strategy: RecoveryStrategy,
  ): Promise<MCPOperationResult<void>> {
    this.emitEvent("mcp_operation_skipped", {
      error,
      strategy,
    });

    return {
      success: true,
      metadata: {
        skipped: true,
        reason: "Recovery strategy: SKIP",
      },
    };
  }

  /**
   * Execute rollback strategy
   */
  private async executeRollbackStrategy(
    error: MCPError,
    strategy: RecoveryStrategy,
  ): Promise<MCPOperationResult<void>> {
    this.emitEvent("mcp_rollback_initiated", {
      error,
      strategy,
    });

    // Implementation would depend on specific rollback requirements
    return {
      success: true,
      metadata: {
        rolledBack: true,
      },
    };
  }

  /**
   * Execute escalate strategy
   */
  private async executeEscalateStrategy(
    error: MCPError,
    strategy: RecoveryStrategy,
  ): Promise<MCPOperationResult<void>> {
    this.emitEvent("mcp_error_escalated", {
      error,
      strategy,
    });

    // Log escalation through ErrorManager
    this.errorManager.handleError(error, `MCP Error: ${error.type}`, {
      ...error.context,
      component: error.context?.component || "MCPErrorHandler",
      timestamp: error.context?.timestamp || new Date(),
      metadata: {
        ...error.context?.metadata,
        mcpErrorType: error.type,
        mcpErrorCategory: error.category,
        mcpErrorSeverity: error.severity,
        mcpErrorId: error.id,
      },
    });

    return {
      success: false,
      error,
      metadata: {
        escalated: true,
        requiresApproval: strategy.requiresApproval,
      },
    };
  }

  /**
   * Execute manual strategy
   */
  private async executeManualStrategy(
    error: MCPError,
    strategy: RecoveryStrategy,
  ): Promise<MCPOperationResult<void>> {
    this.emitEvent("mcp_manual_intervention_required", {
      error,
      strategy,
    });

    // Show user notification for manual intervention
    this.errorManager.showErrorMessage(
      `Manual intervention required for MCP error: ${error.message}`,
      10000,
    );

    return {
      success: false,
      error,
      metadata: {
        manualInterventionRequired: true,
        requiresApproval: strategy.requiresApproval,
      },
    };
  }

  // ============================================================================
  // ERROR STATISTICS AND MONITORING
  // ============================================================================

  /**
   * Update error statistics
   */
  private updateErrorStatistics(error: MCPError): void {
    let stats = this.errorStats.get(error.type);

    if (!stats) {
      stats = {
        count: 0,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        totalRecoveryAttempts: 0,
        successfulRecoveries: 0,
      };
      this.errorStats.set(error.type, stats);
    }

    stats.count++;
    stats.lastOccurrence = new Date();

    // Update ErrorManager metrics
    this.errorManager.incrementCounter("mcp_errors_total", {
      errorType: error.type,
      category: error.category,
      severity: error.severity,
    });
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): Record<string, MCPErrorStatistics> {
    return Object.fromEntries(this.errorStats);
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(
    component?: string,
  ): Record<string, MCPCircuitBreakerState> {
    if (component) {
      const status = this.circuitBreakers.get(component);
      return status ? { [component]: status } : {};
    }

    return Object.fromEntries(this.circuitBreakers);
  }

  /**
   * Get reconnection status
   */
  getReconnectionStatus(
    component?: string,
  ): Record<string, MCPReconnectionState> {
    if (component) {
      const status = this.reconnectionState.get(component);
      return status ? { [component]: status } : {};
    }

    return Object.fromEntries(this.reconnectionState);
  }

  // ============================================================================
  // RECONNECTION MANAGER INTEGRATION
  // ============================================================================

  /**
   * Get reconnection manager instance
   */
  getReconnectionManager(): MCPReconnectionManager {
    return this.reconnectionManager;
  }

  /**
   * Initiate reconnection through reconnection manager
   */
  async initiateReconnection(
    component: string,
    reconnectFn: () => Promise<void>,
    errorType?: MCPErrorType,
  ): Promise<void> {
    return this.reconnectionManager.reconnect(
      component,
      reconnectFn,
      errorType,
    );
  }

  /**
   * Check if component is currently reconnecting
   */
  isComponentReconnecting(component: string): boolean {
    return this.reconnectionManager.isReconnecting(component);
  }

  /**
   * Get reconnection state for a component
   */
  getComponentReconnectionState(component: string): MCPReconnectionState {
    return this.reconnectionManager.getReconnectionState(component);
  }

  /**
   * Reset reconnection state for a component
   */
  resetComponentReconnection(component: string): void {
    this.reconnectionManager.resetReconnectionState(component);
  }

  /**
   * Stop health monitoring for a component
   */
  stopComponentHealthMonitoring(component: string): void {
    this.reconnectionManager.stopHealthMonitoring(component);
  }

  /**
   * Update reconnection configuration
   */
  updateReconnectionConfig(newConfig: Partial<MCPReconnectionConfig>): void {
    this.reconnectionConfig = { ...this.reconnectionConfig, ...newConfig };
    this.reconnectionManager.updateConfig(this.reconnectionConfig);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Log error through ErrorManager
   */
  private logError(error: MCPError): void {
    // Map MCP severity to ErrorManager severity
    const severityMap = {
      [MCPErrorSeverity.LOW]: ErrorSeverity.LOW,
      [MCPErrorSeverity.MEDIUM]: ErrorSeverity.MEDIUM,
      [MCPErrorSeverity.HIGH]: ErrorSeverity.HIGH,
      [MCPErrorSeverity.CRITICAL]: ErrorSeverity.CRITICAL,
    };

    // Map MCP category to ErrorManager category
    const categoryMap = {
      [MCPErrorCategory.CONNECTION]: ErrorCategory.NETWORK,
      [MCPErrorCategory.PROTOCOL]: ErrorCategory.PROCESSING,
      [MCPErrorCategory.TOOL_EXECUTION]: ErrorCategory.PROCESSING,
      [MCPErrorCategory.RESOURCE_ACCESS]: ErrorCategory.RESOURCE,
      [MCPErrorCategory.AUTHENTICATION]: ErrorCategory.AUTHENTICATION,
      [MCPErrorCategory.VALIDATION]: ErrorCategory.VALIDATION,
      [MCPErrorCategory.RATE_LIMITING]: ErrorCategory.API,
      [MCPErrorCategory.TIMEOUT]: ErrorCategory.NETWORK,
      [MCPErrorCategory.SYSTEM]: ErrorCategory.CONFIGURATION,
      [MCPErrorCategory.SECURITY]: ErrorCategory.AUTHENTICATION,
    };

    this.errorManager.handleError(error, `MCP Error: ${error.type}`, {
      component: error.context?.component || "MCPErrorHandler",
      operation: error.context?.operation,
      issueId: error.context?.issueId,
      attempt: error.context?.attempt,
      timestamp: error.context?.timestamp || new Date(),
      metadata: {
        ...error.context?.metadata,
        mcpErrorType: error.type,
        mcpErrorCategory: error.category,
        mcpErrorSeverity: error.severity,
        mcpErrorId: error.id,
      },
    });
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `mcp_err_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data: unknown): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          this.errorManager.handleError(error, "MCPErrorHandler.emitEvent", {
            component: "MCPErrorHandler",
            timestamp: new Date(),
            metadata: { eventType },
          });
        }
      }
    }
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || new Set();
    listeners.add(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Reset all statistics and circuit breakers
   */
  reset(): void {
    this.errorStats.clear();
    this.circuitBreakers.clear();
    this.reconnectionState.clear();

    this.errorManager.incrementCounter("mcp_error_handler_reset", {
      component: "MCPErrorHandler",
    });
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus(): MCPOperationResult<{
    circuitBreakers: Record<string, MCPCircuitBreakerState>;
    reconnectionStates: Record<string, MCPReconnectionState>;
    errorStatistics: Record<MCPErrorType, MCPErrorStatistics>;
    configuration: {
      reconnection: MCPReconnectionConfig;
      circuitBreaker: MCPCircuitBreakerConfig;
      recovery: MCPErrorRecoveryConfig;
    };
  }> {
    try {
      return {
        success: true,
        data: {
          circuitBreakers: this.getCircuitBreakerStatus(),
          reconnectionStates: this.getReconnectionStatus(),
          errorStatistics: this.getErrorStatistics(),
          configuration: {
            reconnection: this.reconnectionConfig,
            circuitBreaker: this.circuitBreakerConfig,
            recovery: this.recoveryConfig,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

// ============================================================================
// TYPE DEFINITIONS FOR INTERNAL STATE
// ============================================================================

/**
 * Circuit breaker state
 */
interface MCPCircuitBreakerState {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime: Date;
  halfOpenCalls: number;
}

/**
 * Reconnection state
 */
interface MCPReconnectionState {
  attempt: number;
  lastAttemptTime?: Date;
  nextAttemptTime?: Date;
  isReconnecting: boolean;
  totalAttempts: number;
  successfulReconnections: number;
  failedReconnections: number;
}

/**
 * Error statistics
 */
interface MCPErrorStatistics {
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  totalRecoveryAttempts: number;
  successfulRecoveries: number;
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./error-handler";
