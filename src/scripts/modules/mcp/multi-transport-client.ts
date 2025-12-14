/**
 * MCP Multi-Transport Client
 *
 * Enhanced MCP client that supports both WebSocket and HTTP transports with
 * automatic fallback, transport selection, and unified API interface.
 *
 * Features:
 * - Multi-transport support (WebSocket + HTTP)
 * - HTTP-first strategy for Context7 compatibility
 * - Automatic transport fallback and recovery
 * - Transport factory pattern for flexible creation
 * - Comprehensive error handling with transport-specific logic
 * - Performance monitoring per transport
 * - Connection management for multiple transports
 * - Backward compatibility with existing WebSocket servers
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
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContent,
  MCPPrompt,
  MCPPromptResult,
  MCPCapabilities,
  MCPHTTPClientConfig,
  MCPEventHandler,
  validateMCPClientConfig,
  MCP_VERSION,
  MCPError,
  MCPErrorCategory,
  MCPErrorSeverity,
  MCPErrorContext,
  MCPRecoveryStrategy,
  MCPRecoveryAction,
  createMCPErrorContext,
  classifyMCPError,
  determineMCPErrorSeverity,
  generateMCPErrorId,
  sanitizeMCPErrorMessage,
  DEFAULT_MCP_ERROR_RECOVERY_CONFIG,
  MCPHTTPTransportConfig,
  Context7Config,
  DEFAULT_CONTEXT7_CONFIG,
} from "./types";
import {
  MCPTransport,
  TransportConfig,
  TransportStats,
  TransportEventData,
} from "./transport-interface";
import {
  MCPTransportFactory,
  createTransportFactory,
} from "./transport-factory";
import { ProtocolHandler } from "./protocol";
import { ErrorManager } from "../ErrorManager";
import { envLoader } from "../EnvironmentLoader";

// ============================================================================
// MULTI-TRANSPORT CLIENT CONFIGURATION
// ============================================================================

/**
 * Multi-transport client configuration
 */
export interface MCPMultiTransportClientConfig extends MCPHTTPClientConfig {
  /** Transport selection strategy */
  transportStrategy?:
    | "auto"
    | "http-first"
    | "websocket-first"
    | "http-only"
    | "websocket-only";
  /** Enable automatic fallback between transports */
  enableFallback?: boolean;
  /** Fallback transport order */
  fallbackOrder?: ("http" | "websocket")[];
  /** Transport health check interval in milliseconds */
  healthCheckInterval?: number;
  /** Enable transport-specific metrics */
  enableTransportMetrics?: boolean;
  /** Connection pool configuration */
  connectionPool?: {
    /** Maximum concurrent connections per transport type */
    maxConnectionsPerType: number;
    /** Connection timeout in milliseconds */
    connectionTimeout: number;
    /** Idle connection timeout in milliseconds */
    idleTimeout: number;
  };
  /** Retry configuration */
  retry?: {
    /** Maximum retry attempts per transport */
    maxAttemptsPerTransport: number;
    /** Base delay for exponential backoff */
    baseDelay: number;
    /** Maximum delay */
    maxDelay: number;
    /** Enable jitter */
    jitter: boolean;
  };
  /** Transport factory instance (optional) */
  transportFactory?: MCPTransportFactory;
}

/**
 * Transport connection status
 */
export interface TransportConnectionStatus {
  /** Transport type */
  type: "http" | "websocket";
  /** Connection state */
  state: MCPConnectionState;
  /** Connected timestamp */
  connectedAt?: Date;
  /** Last activity timestamp */
  lastActivity?: Date;
  /** Connection statistics */
  stats: TransportStats;
  /** Health status */
  healthy: boolean;
  /** Error count */
  errorCount: number;
  /** Last error */
  lastError?: Error;
}

/**
 * Multi-transport client statistics
 */
export interface MultiTransportClientStats {
  /** Primary transport type */
  primaryTransport: "http" | "websocket";
  /** Active transport type */
  activeTransport: "http" | "websocket";
  /** Transport status */
  transportStatus: Record<string, TransportConnectionStatus>;
  /** Total requests sent */
  totalRequests: number;
  /** Requests per transport */
  requestsByTransport: Record<string, number>;
  /** Fallback activations */
  fallbackActivations: number;
  /** Transport switches */
  transportSwitches: number;
  /** Average response time per transport */
  averageResponseTime: Record<string, number>;
  /** Error rate per transport */
  errorRate: Record<string, number>;
}

// ============================================================================
// MAIN MULTI-TRANSPORT CLIENT CLASS
// ============================================================================

/**
 * MCP Multi-Transport Client
 *
 * Enhanced MCP client that supports multiple transport types with automatic
 * fallback and transport selection based on configuration and performance.
 */
export class MCPMultiTransportClient {
  private config: MCPMultiTransportClientConfig;
  private errorHandler: ErrorManager;
  private transportFactory: MCPTransportFactory;
  private protocolHandler: ProtocolHandler;

  // Transport management
  private primaryTransport: MCPTransport;
  private activeTransport: MCPTransport;
  private fallbackTransport?: MCPTransport;
  private transportConnections = new Map<string, MCPTransport>();

  // State management
  private connectionState: MCPConnectionState = MCPConnectionState.DISCONNECTED;
  private serverCapabilities?: MCPCapabilities;
  private sessionId: string;
  private destroyed = false;

  // Statistics and monitoring
  private stats: MultiTransportClientStats;
  private healthCheckTimer?: NodeJS.Timeout;

  // Event handling
  private eventListeners = new Map<MCPClientEventType, Set<MCPEventHandler>>();

  // Request management
  private activeRequests = new Map<string | number, AbortController>();
  private requestTimeouts = new Map<string | number, NodeJS.Timeout>();

  // Default configuration
  private static readonly DEFAULT_CONFIG: Partial<MCPMultiTransportClientConfig> =
    {
      transportStrategy: "http-first", // Context7 optimized
      enableFallback: true,
      fallbackOrder: ["http", "websocket"],
      healthCheckInterval: 60000,
      enableTransportMetrics: true,
      connectionPool: {
        maxConnectionsPerType: 3,
        connectionTimeout: 30000,
        idleTimeout: 300000,
      },
      retry: {
        maxAttemptsPerTransport: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        jitter: true,
      },
    };

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ============================================================================

  constructor(
    config: MCPMultiTransportClientConfig,
    errorHandler: ErrorManager,
  ) {
    // Validate configuration
    const validation = validateMCPClientConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid MCP client config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = { ...MCPMultiTransportClient.DEFAULT_CONFIG, ...config };
    this.errorHandler = errorHandler;
    this.sessionId = this.generateSessionId();

    // Initialize transport factory
    this.transportFactory =
      config.transportFactory || createTransportFactory(errorHandler);

    // Initialize protocol handler
    this.protocolHandler = new ProtocolHandler(
      this.config.connectionTimeout || 30000,
    );

    // Initialize statistics
    this.stats = this.initializeStats();

    // Create primary transport
    this.primaryTransport = this.createPrimaryTransport();
    this.activeTransport = this.primaryTransport;

    // Set up event handlers
    this.setupEventHandlers();

    // Set up protocol handlers
    this.setupProtocolHandlers();

    // Start health checking if enabled
    if (this.config.healthCheckInterval) {
      this.startHealthChecking();
    }

    this.errorHandler.incrementCounter("mcp_multi_transport_client_created", {
      component: "MCPMultiTransportClient",
      transportStrategy: this.config.transportStrategy || "http-first",
      primaryTransport: this.primaryTransport.getTransportType(),
    });
  }

  /**
   * Initialize client statistics
   */
  private initializeStats(): MultiTransportClientStats {
    return {
      primaryTransport:
        (this.config.transportType as "http" | "websocket") || "http",
      activeTransport:
        (this.config.transportType as "http" | "websocket") || "http",
      transportStatus: {},
      totalRequests: 0,
      requestsByTransport: {},
      fallbackActivations: 0,
      transportSwitches: 0,
      averageResponseTime: {},
      errorRate: {},
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `mcp_multi_session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Create primary transport based on configuration
   */
  private createPrimaryTransport(): MCPTransport {
    const transportConfig = this.buildTransportConfig();
    const preferredType = this.determinePreferredTransportType();

    return this.transportFactory.createTransport(transportConfig, {
      preferredType,
      enableFallback: this.config.enableFallback,
    });
  }

  /**
   * Determine preferred transport type based on strategy
   */
  private determinePreferredTransportType(): "http" | "websocket" {
    switch (this.config.transportStrategy) {
      case "http-first":
      case "http-only":
        return "http";

      case "websocket-first":
      case "websocket-only":
        return "websocket";

      case "auto":
      default:
        // Auto-detect based on URL and configuration
        if (
          this.config.serverUrl.includes("context7.com") ||
          this.config.httpTransport?.context7
        ) {
          return "http";
        }
        if (
          this.config.serverUrl.startsWith("ws://") ||
          this.config.serverUrl.startsWith("wss://")
        ) {
          return "websocket";
        }
        return "http"; // Default to HTTP for Context7 compatibility
    }
  }

  /**
   * Build transport configuration from client config
   */
  private buildTransportConfig(): TransportConfig {
    const baseConfig: TransportConfig = {
      serverUrl: this.config.serverUrl,
      apiKey: this.config.apiKey,
      connectionTimeout: this.config.connectionTimeout,
      requestTimeout: this.config.connectionTimeout,
      debug: this.config.debug,
    };

    // Add HTTP transport specific configuration
    if (this.config.httpTransport) {
      baseConfig.transportSpecific = {
        ...baseConfig.transportSpecific,
        httpTransport: this.config.httpTransport,
        context7: this.config.httpTransport.context7,
      };
    }

    return baseConfig;
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to MCP server using multi-transport strategy
   */
  async connect(): Promise<void> {
    if (this.destroyed) {
      throw new Error("Client has been destroyed");
    }

    if (this.connectionState === MCPConnectionState.CONNECTED) {
      return;
    }

    if (this.connectionState === MCPConnectionState.CONNECTING) {
      throw new Error("Connection already in progress");
    }

    this.connectionState = MCPConnectionState.CONNECTING;

    try {
      // Connect primary transport
      await this.connectWithFallback(this.primaryTransport);

      // Initialize MCP protocol
      await this.initialize();

      this.connectionState = MCPConnectionState.CONNECTED;
      this.updateTransportStatus(
        this.primaryTransport,
        MCPConnectionState.CONNECTED,
      );

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        newState: MCPConnectionState.CONNECTED,
        transportType: this.activeTransport.getTransportType(),
      });

      this.errorHandler.incrementCounter("mcp_multi_transport_connected", {
        component: "MCPMultiTransportClient",
        transportType: this.activeTransport.getTransportType(),
        strategy: this.config.transportStrategy || "http-first",
      });
    } catch (error) {
      this.connectionState = MCPConnectionState.ERROR;

      const mcpError = await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "connect",
        transportType: this.activeTransport.getTransportType(),
      });

      throw mcpError;
    }
  }

  /**
   * Connect with fallback strategy
   */
  private async connectWithFallback(transport: MCPTransport): Promise<void> {
    const maxAttempts = this.config.retry?.maxAttemptsPerTransport || 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await transport.connect();
        return;
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          // Last attempt failed, try fallback if enabled
          if (
            this.config.enableFallback &&
            this.config.fallbackOrder &&
            this.config.fallbackOrder.length > 1
          ) {
            await this.tryFallbackConnection(transport);
            return;
          }
          throw error;
        }

        // Wait before retry
        const delay = this.calculateRetryDelay(attempt);
        await this.delay(delay);
      }
    }
  }

  /**
   * Try fallback transport connection
   */
  private async tryFallbackConnection(
    failedTransport: MCPTransport,
  ): Promise<void> {
    if (!this.config.enableFallback || !this.config.fallbackOrder) {
      throw new Error("Fallback not enabled or configured");
    }

    const currentType = failedTransport.getTransportType();
    const fallbackType = this.config.fallbackOrder.find(
      (type) => type !== currentType,
    );

    if (!fallbackType) {
      throw new Error("No fallback transport available");
    }

    try {
      this.stats.fallbackActivations++;

      // Create fallback transport
      const transportConfig = this.buildTransportConfig();
      this.fallbackTransport = this.transportFactory.createTransport(
        transportConfig,
        {
          forceType: fallbackType as "http" | "websocket",
          enableFallback: false, // Prevent infinite fallback loops
        },
      );

      // Connect fallback transport
      await this.fallbackTransport.connect();

      // Switch to fallback transport
      await this.switchTransport(this.fallbackTransport);

      this.errorHandler.incrementCounter("mcp_fallback_activated", {
        component: "MCPMultiTransportClient",
        fromTransport: currentType,
        toTransport: fallbackType,
      });
    } catch (fallbackError) {
      this.errorHandler.handleError(
        fallbackError,
        "MCPMultiTransportClient.fallbackConnection",
        {
          component: "MCPMultiTransportClient",
          timestamp: new Date(),
          metadata: {
            failedTransportType: currentType,
            fallbackTransportType: fallbackType,
          },
        },
      );

      throw fallbackError;
    }
  }

  /**
   * Switch active transport
   */
  private async switchTransport(newTransport: MCPTransport): Promise<void> {
    const oldTransport = this.activeTransport;
    const oldType = oldTransport.getTransportType();
    const newType = newTransport.getTransportType();

    try {
      // Disconnect old transport
      if (oldTransport.isConnected()) {
        await oldTransport.disconnect();
      }

      // Switch active transport
      this.activeTransport = newTransport;
      this.updateTransportStatus(newTransport, MCPConnectionState.CONNECTED);

      // Update statistics
      this.stats.transportSwitches++;
      this.stats.activeTransport = newType as "http" | "websocket";

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        newState: this.connectionState,
        oldTransportType: oldType,
        newTransportType: newType,
        switchReason: "fallback",
      });

      this.errorHandler.incrementCounter("mcp_transport_switched", {
        component: "MCPMultiTransportClient",
        fromTransport: oldType,
        toTransport: newType,
      });
    } catch (error) {
      // Revert to old transport if switch failed
      this.activeTransport = oldTransport;

      this.errorHandler.handleError(
        error,
        "MCPMultiTransportClient.switchTransport",
        {
          component: "MCPMultiTransportClient",
          timestamp: new Date(),
          metadata: {
            fromTransport: oldType,
            toTransport: newType,
          },
        },
      );

      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    try {
      // Cancel all active requests
      this.cancelAllRequests();

      // Disconnect all transports
      for (const transport of this.transportConnections.values()) {
        try {
          await transport.disconnect();
        } catch (error) {
          this.errorHandler.handleError(
            error,
            "MCPMultiTransportClient.disconnect",
            {
              component: "MCPMultiTransportClient",
              timestamp: new Date(),
            },
          );
        }
      }

      // Reset state
      this.connectionState = MCPConnectionState.DISCONNECTED;
      this.serverCapabilities = undefined;

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        newState: MCPConnectionState.DISCONNECTED,
      });

      this.errorHandler.incrementCounter("mcp_multi_transport_disconnected", {
        component: "MCPMultiTransportClient",
      });
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "MCPMultiTransportClient.disconnect",
        {
          component: "MCPMultiTransportClient",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return (
      this.connectionState === MCPConnectionState.CONNECTED &&
      this.activeTransport.isConnected()
    );
  }

  /**
   * Get connection state
   */
  getConnectionState(): MCPConnectionState {
    return this.connectionState;
  }

  /**
   * Get client status
   */
  getStatus(): MCPClientStatus {
    return {
      state: this.connectionState,
      connectedAt:
        this.stats.transportStatus[this.activeTransport.getTransportType()]
          ?.connectedAt,
      connectionAttempts: this.stats.totalRequests,
      serverCapabilities: this.serverCapabilities,
      activeRequests: this.activeRequests.size,
    };
  }

  // ============================================================================
  // MCP PROTOCOL METHODS
  // ============================================================================

  /**
   * Initialize MCP protocol
   */
  async initialize(): Promise<MCPCapabilities> {
    try {
      const clientInfo = this.config.clientInfo || {
        name: "LOFERSIL MCP Multi-Transport Client",
        version: "1.0.0",
      };

      const capabilities = this.config.capabilities || {};

      const result = await this.sendRequest<MCPCapabilities>("initialize", {
        protocolVersion: MCP_VERSION,
        capabilities,
        clientInfo: {
          ...clientInfo,
          transportType: this.activeTransport.getTransportType(),
        },
      });

      this.serverCapabilities = result;

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        newState: MCPConnectionState.CONNECTED,
        serverCapabilities: result,
      });

      return result;
    } catch (error) {
      this.connectionState = MCPConnectionState.ERROR;
      throw error;
    }
  }

  /**
   * Send a JSON-RPC request using the active transport
   */
  private async sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown> | unknown[],
    timeoutMs?: number,
  ): Promise<T> {
    if (this.destroyed) {
      throw new Error("Client has been destroyed");
    }

    if (!this.isConnected()) {
      throw new Error("Not connected to MCP server");
    }

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const result = await this.activeTransport.sendRequest<T>(
        method,
        params,
        timeoutMs,
      );

      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateRequestStatistics(
        this.activeTransport.getTransportType(),
        responseTime,
        true,
      );

      this.emitEvent(MCPClientEventType.MESSAGE_SENT, {
        method,
        params,
        transportType: this.activeTransport.getTransportType(),
        responseTime,
      });

      return result;
    } catch (error) {
      // Update statistics
      const responseTime = Date.now() - startTime;
      this.updateRequestStatistics(
        this.activeTransport.getTransportType(),
        responseTime,
        false,
      );

      // Handle transport-specific errors and fallback
      if (this.config.enableFallback) {
        const shouldFallback = await this.shouldTriggerFallback(error);
        if (shouldFallback) {
          return await this.handleRequestWithFallback(
            method,
            params,
            timeoutMs,
          );
        }
      }

      throw error;
    }
  }

  /**
   * Determine if request should trigger fallback
   */
  private async shouldTriggerFallback(error: unknown): Promise<boolean> {
    // Don't fallback if already using fallback transport
    if (this.activeTransport === this.fallbackTransport) {
      return false;
    }

    // Check error type and configuration
    if (error && typeof error === "object") {
      const transportError = error as any;

      // Fallback on connection errors, timeouts, and server errors
      const fallbackErrorTypes = [
        "connection_failed",
        "connection_timeout",
        "network_error",
        "request_timeout",
        "server_error",
      ];

      return fallbackErrorTypes.includes(transportError.type);
    }

    return false;
  }

  /**
   * Handle request with fallback transport
   */
  private async handleRequestWithFallback<T>(
    method: string,
    params?: Record<string, unknown> | unknown[],
    timeoutMs?: number,
  ): Promise<T> {
    try {
      // Trigger fallback connection if not already established
      if (!this.fallbackTransport || !this.fallbackTransport.isConnected()) {
        await this.tryFallbackConnection(this.activeTransport);
      }

      // Retry request with fallback transport
      const result = await this.fallbackTransport!.sendRequest<T>(
        method,
        params,
        timeoutMs,
      );

      this.emitEvent(MCPClientEventType.MESSAGE_SENT, {
        method,
        params,
        transportType: this.fallbackTransport!.getTransportType(),
        fallbackUsed: true,
      });

      return result;
    } catch (fallbackError) {
      // If fallback also fails, throw the original error
      throw fallbackError;
    }
  }

  /**
   * List available tools from server
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const result = await this.sendRequest<{ tools: MCPTool[] }>("tools/list");
      return result.tools || [];
    } catch (error) {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "listTools",
        transportType: this.activeTransport.getTransportType(),
      });
      throw error;
    }
  }

  /**
   * Call a tool with arguments
   */
  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<MCPToolResult> {
    try {
      const result = await this.sendRequest<MCPToolResult>("tools/call", {
        name,
        arguments: args,
      });

      this.emitEvent(MCPClientEventType.TOOL_CALLED, {
        toolName: name,
        arguments: args,
        result,
        transportType: this.activeTransport.getTransportType(),
      });

      return result;
    } catch (error) {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "callTool",
        transportType: this.activeTransport.getTransportType(),
        toolName: name,
        metadata: { arguments: args },
      });
      throw error;
    }
  }

  /**
   * List available resources from server
   */
  async listResources(): Promise<MCPResource[]> {
    try {
      const result = await this.sendRequest<{ resources: MCPResource[] }>(
        "resources/list",
      );
      return result.resources || [];
    } catch (error) {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "listResources",
        transportType: this.activeTransport.getTransportType(),
      });
      throw error;
    }
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<MCPResourceContent> {
    try {
      const result = await this.sendRequest<MCPResourceContent>(
        "resources/read",
        {
          uri,
        },
      );

      this.emitEvent(MCPClientEventType.RESOURCE_ACCESSED, {
        uri,
        result,
        transportType: this.activeTransport.getTransportType(),
      });

      return result;
    } catch (error) {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "readResource",
        transportType: this.activeTransport.getTransportType(),
        resourceUri: uri,
      });
      throw error;
    }
  }

  /**
   * List available prompts from server
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    try {
      const result = await this.sendRequest<{ prompts: MCPPrompt[] }>(
        "prompts/list",
      );
      return result.prompts || [];
    } catch (error) {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "listPrompts",
        transportType: this.activeTransport.getTransportType(),
      });
      throw error;
    }
  }

  /**
   * Get a prompt by name with arguments
   */
  async getPrompt(
    name: string,
    args?: Record<string, unknown>,
  ): Promise<MCPPromptResult> {
    try {
      const result = await this.sendRequest<MCPPromptResult>("prompts/get", {
        name,
        arguments: args || {},
      });

      this.emitEvent(MCPClientEventType.PROMPT_GENERATED, {
        promptName: name,
        arguments: args,
        result,
        transportType: this.activeTransport.getTransportType(),
      });

      return result;
    } catch (error) {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "getPrompt",
        transportType: this.activeTransport.getTransportType(),
        promptName: name,
        metadata: { arguments: args },
      });
      throw error;
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  /**
   * Add event listener
   */
  addEventListener<T = unknown>(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<T>,
  ): void {
    if (this.destroyed) {
      return;
    }

    const listeners = this.eventListeners.get(eventType) || new Set();
    listeners.add(handler as MCPEventHandler);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener<T = unknown>(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<T>,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler as MCPEventHandler);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: MCPClientEventType, data?: unknown): void {
    if (this.destroyed) {
      return;
    }

    const event: MCPClientEvent = {
      type: eventType,
      timestamp: new Date(),
      data,
      source: "MCPMultiTransportClient",
    };

    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event as any);
        } catch (error) {
          this.errorHandler.handleError(
            error,
            "MCPMultiTransportClient.emitEvent",
            {
              component: "MCPMultiTransportClient",
              timestamp: new Date(),
              metadata: { eventType },
            },
          );
        }
      }
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Handle MCP error with multi-transport context
   */
  private async handleMCPError(
    error: unknown,
    context: Partial<MCPErrorContext>,
  ): Promise<MCPError> {
    const mcpContext = createMCPErrorContext({
      component: context.component || "MCPMultiTransportClient",
      operation: context.operation || "unknown",
      sessionId: this.sessionId,
      connectionId: this.activeTransport.getTransportType(),
      toolName: context.toolName,
      resourceUri: context.resourceUri,
      promptName: context.promptName,
      metadata: {
        ...context.metadata,
        transportType: this.activeTransport.getTransportType(),
        transportStrategy: this.config.transportStrategy,
        fallbackEnabled: this.config.enableFallback,
        sessionId: this.sessionId,
      },
    });

    const category = classifyMCPError(error as Error);
    const severity = determineMCPErrorSeverity(error as Error, category);

    const errorId = generateMCPErrorId();
    const errorMessage = sanitizeMCPErrorMessage(
      (error as Error).message || String(error),
    );

    // Create a proper Error object that extends MCPError
    const mcpError = new Error(errorMessage) as MCPError;
    mcpError.name = "MCPError";
    mcpError.id = errorId;
    mcpError.message = errorMessage;
    mcpError.category = category;
    mcpError.severity = severity;
    mcpError.context = mcpContext;
    mcpError.cause = error as Error;
    mcpError.stack = (error as Error).stack;
    mcpError.recoverable = this.isErrorRecoverable(category, severity);
    mcpError.retryable = this.isErrorRetryable(category, severity);
    mcpError.requiresHumanIntervention = this.requiresHumanIntervention(
      category,
      severity,
    );
    mcpError.recoveryStrategy = {
      action: this.getRecoveryAction(category, severity),
    };

    // Update transport error statistics
    this.updateTransportErrorStatistics(
      this.activeTransport.getTransportType(),
    );

    // Report to ErrorManager
    this.errorHandler.handleError(
      error as Error,
      `MCPMultiTransportClient.${context.operation}`,
      {
        component: mcpContext.component,
        timestamp: mcpContext.timestamp,
        metadata: {
          mcpErrorId: mcpError.id,
          category: mcpError.category,
          severity: mcpError.severity,
          transportType: this.activeTransport.getTransportType(),
          ...mcpContext.metadata,
        },
      },
    );

    // Emit error event
    this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
      mcpError,
      originalError: error,
    });

    return mcpError;
  }

  /**
   * Check if error is recoverable
   */
  private isErrorRecoverable(
    category: MCPErrorCategory,
    severity: MCPErrorSeverity,
  ): boolean {
    if (severity === MCPErrorSeverity.CRITICAL) {
      return false;
    }

    const recoverableCategories = [
      MCPErrorCategory.NETWORK,
      MCPErrorCategory.TIMEOUT,
      MCPErrorCategory.RATE_LIMIT,
      MCPErrorCategory.TOOL_EXECUTION,
      MCPErrorCategory.RESOURCE_ACCESS,
      MCPErrorCategory.PROMPT_GENERATION,
    ];

    return recoverableCategories.includes(category);
  }

  /**
   * Check if error is retryable
   */
  private isErrorRetryable(
    category: MCPErrorCategory,
    severity: MCPErrorSeverity,
  ): boolean {
    if (severity === MCPErrorSeverity.CRITICAL) {
      return false;
    }

    const nonRetryableCategories = [
      MCPErrorCategory.AUTHENTICATION,
      MCPErrorCategory.VALIDATION,
      MCPErrorCategory.CONFIGURATION,
    ];

    return !nonRetryableCategories.includes(category);
  }

  /**
   * Check if error requires human intervention
   */
  private requiresHumanIntervention(
    category: MCPErrorCategory,
    severity: MCPErrorSeverity,
  ): boolean {
    return (
      severity === MCPErrorSeverity.CRITICAL ||
      [
        MCPErrorCategory.AUTHENTICATION,
        MCPErrorCategory.CONFIGURATION,
      ].includes(category)
    );
  }

  /**
   * Get recovery action for error
   */
  private getRecoveryAction(
    category: MCPErrorCategory,
    severity: MCPErrorSeverity,
  ): MCPRecoveryAction {
    switch (category) {
      case MCPErrorCategory.NETWORK:
      case MCPErrorCategory.TIMEOUT:
        return this.config.enableFallback
          ? MCPRecoveryAction.FALLBACK
          : MCPRecoveryAction.RETRY;

      case MCPErrorCategory.RATE_LIMIT:
        return MCPRecoveryAction.RETRY;

      case MCPErrorCategory.TOOL_EXECUTION:
      case MCPErrorCategory.RESOURCE_ACCESS:
      case MCPErrorCategory.PROMPT_GENERATION:
        return MCPRecoveryAction.RETRY;

      default:
        return MCPRecoveryAction.MANUAL;
    }
  }

  // ============================================================================
  // STATISTICS AND MONITORING
  // ============================================================================

  /**
   * Update request statistics
   */
  private updateRequestStatistics(
    transportType: string,
    responseTime: number,
    success: boolean,
  ): void {
    // Update requests by transport
    if (!this.stats.requestsByTransport[transportType]) {
      this.stats.requestsByTransport[transportType] = 0;
    }
    this.stats.requestsByTransport[transportType]++;

    // Update average response time
    if (!this.stats.averageResponseTime[transportType]) {
      this.stats.averageResponseTime[transportType] = 0;
    }

    const totalRequests = this.stats.requestsByTransport[transportType];
    this.stats.averageResponseTime[transportType] =
      (this.stats.averageResponseTime[transportType] * (totalRequests - 1) +
        responseTime) /
      totalRequests;

    // Update error rate
    if (!this.stats.errorRate[transportType]) {
      this.stats.errorRate[transportType] = 0;
    }

    const errorCount = success ? 0 : 1;
    this.stats.errorRate[transportType] =
      (this.stats.errorRate[transportType] * (totalRequests - 1) + errorCount) /
      totalRequests;
  }

  /**
   * Update transport status
   */
  private updateTransportStatus(
    transport: MCPTransport,
    state: MCPConnectionState,
  ): void {
    const transportType = transport.getTransportType();

    if (!this.stats.transportStatus[transportType]) {
      this.stats.transportStatus[transportType] = {
        type: transportType as "http" | "websocket",
        state,
        stats: transport.getStats(),
        healthy: true,
        errorCount: 0,
      };
    }

    const status = this.stats.transportStatus[transportType];
    status.state = state;
    status.stats = transport.getStats();

    if (state === MCPConnectionState.CONNECTED) {
      status.connectedAt = new Date();
      status.lastActivity = new Date();
      status.healthy = true;
    } else if (state === MCPConnectionState.ERROR) {
      status.errorCount++;
      status.healthy = false;
    }
  }

  /**
   * Update transport error statistics
   */
  private updateTransportErrorStatistics(transportType: string): void {
    if (this.stats.transportStatus[transportType]) {
      this.stats.transportStatus[transportType].errorCount++;
      this.stats.transportStatus[transportType].healthy = false;
    }
  }

  /**
   * Start health checking for transports
   */
  private startHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performTransportHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all transports
   */
  private async performTransportHealthCheck(): Promise<void> {
    const transports = [this.primaryTransport];
    if (this.fallbackTransport) {
      transports.push(this.fallbackTransport);
    }

    for (const transport of transports) {
      try {
        const health = await transport.healthCheck();
        this.updateTransportStatus(
          transport,
          health.healthy
            ? MCPConnectionState.CONNECTED
            : MCPConnectionState.ERROR,
        );
      } catch (error) {
        this.updateTransportStatus(transport, MCPConnectionState.ERROR);
        this.errorHandler.handleError(
          error,
          "MCPMultiTransportClient.healthCheck",
          {
            component: "MCPMultiTransportClient",
            timestamp: new Date(),
            metadata: { transportType: transport.getTransportType() },
          },
        );
      }
    }
  }

  /**
   * Get multi-transport client statistics
   */
  getStats(): MultiTransportClientStats {
    return { ...this.stats };
  }

  /**
   * Get transport statistics
   */
  getTransportStats(): Record<string, TransportStats> {
    const stats: Record<string, TransportStats> = {};

    if (this.primaryTransport) {
      stats[this.primaryTransport.getTransportType()] =
        this.primaryTransport.getStats();
    }

    if (this.fallbackTransport) {
      stats[this.fallbackTransport.getTransportType()] =
        this.fallbackTransport.getStats();
    }

    return stats;
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<
    MCPOperationResult<Record<string, unknown>>
  > {
    const health: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      connectionState: this.connectionState,
      isConnected: this.isConnected(),
      activeTransport: this.activeTransport.getTransportType(),
      primaryTransport: this.primaryTransport.getTransportType(),
      fallbackTransport: this.fallbackTransport?.getTransportType(),
      stats: this.getStats(),
      transportStats: this.getTransportStats(),
    };

    try {
      // Test active transport connectivity
      if (this.isConnected()) {
        const startTime = Date.now();
        await this.listTools();
        health.latency = Date.now() - startTime;
        health.activeTransportHealthy = true;
      } else {
        health.activeTransportHealthy = false;
      }

      return {
        success: true,
        data: health,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: health,
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retry?.baseDelay || 1000;
    const maxDelay = this.config.retry?.maxDelay || 30000;
    const multiplier = this.config.retry?.jitter ? 2 : 1;

    let delay = baseDelay * Math.pow(multiplier, attempt);
    delay = Math.min(delay, maxDelay);

    // Add jitter if enabled
    if (this.config.retry?.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel all active requests
   */
  private cancelAllRequests(): void {
    // Cancel active requests
    for (const [id, controller] of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();

    // Clear timeouts
    for (const timeout of this.requestTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.requestTimeouts.clear();
  }

  // ============================================================================
  // SETUP METHODS
  // ============================================================================

  /**
   * Set up event handlers for transports
   */
  private setupEventHandlers(): void {
    // Primary transport events
    this.primaryTransport.addEventListener(
      MCPClientEventType.CONNECTION_STATE_CHANGED,
      (event) => {
        this.handleTransportStateChange(this.primaryTransport, event.data);
      },
    );

    this.primaryTransport.addEventListener(
      MCPClientEventType.ERROR_OCCURRED,
      (event) => {
        this.handleTransportError(this.primaryTransport, event.data);
      },
    );

    // Fallback transport events if exists
    if (this.fallbackTransport) {
      this.fallbackTransport.addEventListener(
        MCPClientEventType.CONNECTION_STATE_CHANGED,
        (event) => {
          this.handleTransportStateChange(this.fallbackTransport!, event.data);
        },
      );

      this.fallbackTransport.addEventListener(
        MCPClientEventType.ERROR_OCCURRED,
        (event) => {
          this.handleTransportError(this.fallbackTransport!, event.data);
        },
      );
    }
  }

  /**
   * Handle transport state changes
   */
  private handleTransportStateChange(transport: MCPTransport, data: any): void {
    this.updateTransportStatus(transport, data.newState);

    this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
      transportType: transport.getTransportType(),
      ...data,
    });
  }

  /**
   * Handle transport errors
   */
  private async handleTransportError(
    transport: MCPTransport,
    data: any,
  ): Promise<void> {
    this.updateTransportErrorStatistics(transport.getTransportType());

    await this.handleMCPError(data.error, {
      component: "MCPMultiTransportClient",
      operation: "transportError",
      transportType: transport.getTransportType(),
    });

    this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
      transportType: transport.getTransportType(),
      ...data,
    });
  }

  /**
   * Set up protocol message handlers
   */
  private setupProtocolHandlers(): void {
    // Set up protocol handler error callback
    this.protocolHandler.setErrorHandler(async (error, message) => {
      await this.handleMCPError(error, {
        component: "MCPMultiTransportClient",
        operation: "protocolError",
        transportType: this.activeTransport.getTransportType(),
        metadata: { message },
      });
    });
  }

  /**
   * Destroy client and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    try {
      // Stop health checking
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = undefined;
      }

      // Disconnect all transports
      await this.disconnect();

      // Cancel all requests
      this.cancelAllRequests();

      // Clear event listeners
      this.eventListeners.clear();

      // Destroy transport factory
      if (this.config.transportFactory) {
        await this.config.transportFactory.destroy();
      }

      // Clear protocol handler
      this.protocolHandler.clear();

      this.errorHandler.incrementCounter(
        "mcp_multi_transport_client_destroyed",
        {
          component: "MCPMultiTransportClient",
        },
      );
    } catch (error) {
      this.errorHandler.handleError(error, "MCPMultiTransportClient.destroy", {
        component: "MCPMultiTransportClient",
        timestamp: new Date(),
      });
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create multi-transport client with Context7 HTTP-first configuration
 */
export function createMultiTransportClient(
  config: MCPMultiTransportClientConfig,
  errorHandler: ErrorManager,
): MCPMultiTransportClient {
  // Set Context7-optimized defaults if not specified
  const context7Config: MCPMultiTransportClientConfig = {
    transportStrategy: "http-first",
    enableFallback: true,
    fallbackOrder: ["http", "websocket"],
    healthCheckInterval: 60000,
    enableTransportMetrics: true,
    httpTransport: {
      requestTimeout: 30000,
      maxRetries: 3,
      enableCompression: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
      },
    },
    ...config,
  };

  return new MCPMultiTransportClient(context7Config, errorHandler);
}

/**
 * Create Context7-specific multi-transport client
 */
export function createContext7Client(
  apiKey: string,
  errorHandler: ErrorManager,
  additionalConfig?: Partial<MCPMultiTransportClientConfig>,
): MCPMultiTransportClient {
  const config: MCPMultiTransportClientConfig = {
    serverUrl: "https://mcp.context7.com/mcp",
    transportType: "http",
    transportStrategy: "http-first",
    enableFallback: true,
    fallbackOrder: ["http", "websocket"],
    httpTransport: {
      context7: {
        apiKey,
        mcpEndpoint: "https://mcp.context7.com/mcp",
        apiVersion: "v1",
      },
      requestTimeout: 30000,
      maxRetries: 3,
      enableCompression: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
      },
    },
    ...additionalConfig,
  };

  return new MCPMultiTransportClient(config, errorHandler);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export factory and types for external use
export {
  MCPTransportFactory,
  createTransportFactory,
} from "./transport-factory";
export type {
  MCPTransportFactoryConfig,
  TransportCreationOptions,
  TransportHealthStatus,
  TransportFactoryStats,
} from "./transport-factory";
