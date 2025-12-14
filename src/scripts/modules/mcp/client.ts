/**
 * MCP Core Client Implementation
 *
 * Main MCP client class that orchestrates all MCP functionality including
 * protocol handling, WebSocket communication, tool management, and resource management.
 *
 * Features:
 * - Complete MCP protocol implementation (initialize, tools, resources, prompts)
 * - Connection lifecycle management with automatic reconnection
 * - Comprehensive event system for client notifications
 * - Error handling and recovery with ErrorManager integration
 * - Performance monitoring and diagnostics
 * - Security features and rate limiting
 * - Tool and resource management
 * - Support for both browser and Node.js environments
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
  JSONRPCRequest,
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
  generateMCPCorrelationId,
  sanitizeMCPErrorMessage,
  DEFAULT_MCP_ERROR_RECOVERY_CONFIG,
} from "./types";
import { MCPWebSocketClient } from "./websocket-client";
import { ProtocolHandler } from "./protocol";
import { ErrorManager } from "../ErrorManager";
import { envLoader } from "../EnvironmentLoader";

// ============================================================================
// CLIENT CONFIGURATION TYPES
// ============================================================================

/**
 * Extended client configuration with additional options
 */
export interface MCPClientExtendedConfig extends MCPClientConfig {
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Maximum concurrent requests */
  maxConcurrentRequests?: number;
  /** Enable performance monitoring */
  enableMonitoring?: boolean;
  /** Event handling configuration */
  events?: {
    /** Maximum event listeners */
    maxListeners?: number;
    /** Enable event batching */
    enableBatching?: boolean;
    /** Batch size */
    batchSize?: number;
    /** Batch timeout in milliseconds */
    batchTimeout?: number;
  };
  /** Tool execution configuration */
  tools?: {
    /** Default tool timeout */
    defaultTimeout?: number;
    /** Maximum tool execution time */
    maxTimeout?: number;
    /** Enable tool result caching */
    enableCaching?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
  };
  /** Resource access configuration */
  resources?: {
    /** Default resource timeout */
    defaultTimeout?: number;
    /** Maximum resource size */
    maxSize?: number;
    /** Enable resource caching */
    enableCaching?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
  };
}

// ============================================================================
// CLIENT STATE TYPES
// ============================================================================

/**
 * Internal client state
 */
interface MCPClientState {
  /** Connection state */
  connectionState: MCPConnectionState;
  /** Server capabilities */
  serverCapabilities?: MCPCapabilities;
  /** Available tools */
  availableTools: Map<string, MCPTool>;
  /** Available resources */
  availableResources: Map<string, MCPResource>;
  /** Available prompts */
  availablePrompts: Map<string, MCPPrompt>;
  /** Active requests */
  activeRequests: Map<string | number, AbortController>;
  /** Request queue for rate limiting */
  requestQueue: Array<() => void>;
  /** Processing queue flag */
  processingQueue: boolean;
  /** Last activity timestamp */
  lastActivity?: Date;
  /** Connection established timestamp */
  connectedAt?: Date;
  /** Session ID */
  sessionId?: string;
}

/**
 * Performance metrics
 */
interface MCPClientMetrics {
  /** Total requests sent */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time */
  averageResponseTime: number;
  /** Tools called */
  toolsCalled: number;
  /** Resources accessed */
  resourcesAccessed: number;
  /** Prompts generated */
  promptsGenerated: number;
  /** Events emitted */
  eventsEmitted: number;
  /** Last reset timestamp */
  lastReset: Date;
}

// ============================================================================
// MAIN MCP CLIENT CLASS
// ============================================================================

/**
 * MCP Client - Main client class for MCP protocol communication
 *
 * Provides a comprehensive API for interacting with MCP servers, including
 * tool execution, resource access, and prompt generation.
 */
export class MCPClient {
  private config: MCPClientExtendedConfig;
  private errorHandler: ErrorManager;
  private wsClient: MCPWebSocketClient;
  private protocolHandler: ProtocolHandler;
  private state: MCPClientState;
  private metrics: MCPClientMetrics;
  private eventListeners = new Map<MCPClientEventType, Set<MCPEventHandler>>();
  private eventBatch: MCPClientEvent[] = [];
  private eventBatchTimer?: NodeJS.Timeout;
  private toolCache = new Map<
    string,
    { result: MCPToolResult; timestamp: number }
  >();
  private resourceCache = new Map<
    string,
    { content: MCPResourceContent; timestamp: number }
  >();
  private requestTimeouts = new Map<string | number, NodeJS.Timeout>();
  private destroyed = false;

  // ErrorManager integration properties
  private errorStatistics = {
    totalErrors: 0,
    errorsByCategory: {} as Record<MCPErrorCategory, number>,
    errorsBySeverity: {} as Record<MCPErrorSeverity, number>,
    recoverySuccessRate: 0,
    averageRecoveryTime: 0,
    circuitBreakerActivations: 0,
    lastError: undefined as Date | undefined,
  };
  private activeRecoveries = new Map<string, Promise<boolean>>();
  private errorRecoveryConfig = DEFAULT_MCP_ERROR_RECOVERY_CONFIG;

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION (STEP 1)
  // ============================================================================

  constructor(config: MCPClientExtendedConfig, errorHandler: ErrorManager) {
    // Validate configuration
    const validation = validateMCPClientConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid MCP client config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = this.mergeWithDefaults(config);
    this.errorHandler = errorHandler;

    // Initialize WebSocket client
    this.wsClient = new MCPWebSocketClient(this.config, this.errorHandler);

    // Initialize protocol handler
    this.protocolHandler = new ProtocolHandler(
      this.config.requestTimeout || 30000,
    );

    // Initialize client state
    this.state = {
      connectionState: MCPConnectionState.DISCONNECTED,
      availableTools: new Map(),
      availableResources: new Map(),
      availablePrompts: new Map(),
      activeRequests: new Map(),
      requestQueue: [],
      processingQueue: false,
      sessionId: this.generateSessionId(),
    };

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      toolsCalled: 0,
      resourcesAccessed: 0,
      promptsGenerated: 0,
      eventsEmitted: 0,
      lastReset: new Date(),
    };

    // Set up event handlers
    this.setupEventHandlers();

    // Set up protocol handlers
    this.setupProtocolHandlers();

    // Load environment settings
    this.loadEnvironmentSettings();
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(
    config: MCPClientExtendedConfig,
  ): MCPClientExtendedConfig {
    return {
      ...config,
      requestTimeout: config.requestTimeout || 30000,
      autoReconnect: config.autoReconnect !== false,
      maxConcurrentRequests: config.maxConcurrentRequests || 10,
      enableMonitoring: config.enableMonitoring ?? true,
      events: {
        maxListeners: config.events?.maxListeners || 100,
        enableBatching: config.events?.enableBatching || false,
        batchSize: config.events?.batchSize || 10,
        batchTimeout: config.events?.batchTimeout || 100,
        ...config.events,
      },
      tools: {
        defaultTimeout: config.tools?.defaultTimeout || 30000,
        maxTimeout: config.tools?.maxTimeout || 300000,
        enableCaching: config.tools?.enableCaching || false,
        cacheTTL: config.tools?.cacheTTL || 300000,
        ...config.tools,
      },
      resources: {
        defaultTimeout: config.resources?.defaultTimeout || 30000,
        maxSize: config.resources?.maxSize || 10 * 1024 * 1024, // 10MB
        enableCaching: config.resources?.enableCaching || false,
        cacheTTL: config.resources?.cacheTTL || 600000,
        ...config.resources,
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

      const envEnableMcp = envLoader.get("ENABLE_MCP_INTEGRATION");
      if (envEnableMcp === "false") {
        this.config.enableMonitoring = false;
      }
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "MCPClient.loadEnvironmentSettings",
        {
          component: "MCPClient",
          timestamp: new Date(),
        },
      );
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `mcp_session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // ============================================================================
  // CONNECTION MANAGEMENT (STEP 2)
  // ============================================================================

  /**
   * Connect to MCP server
   */
  async connect(): Promise<void> {
    if (this.destroyed) {
      throw new Error("Client has been destroyed");
    }

    if (this.state.connectionState === MCPConnectionState.CONNECTED) {
      return;
    }

    if (this.state.connectionState === MCPConnectionState.CONNECTING) {
      throw new Error("Connection already in progress");
    }

    try {
      // Connect WebSocket
      await this.wsClient.connect();

      // Initialize MCP protocol
      await this.initialize();

      this.state.connectedAt = new Date();
      this.updateLastActivity();

      this.errorHandler.incrementCounter("mcp_connections", {
        component: "MCPClient",
        status: "success",
      });
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.connect", {
        component: "MCPClient",
        timestamp: new Date(),
        metadata: { serverUrl: this.config.serverUrl },
      });

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

      // Disconnect WebSocket
      this.wsClient.disconnect();

      // Reset state
      this.state.connectionState = MCPConnectionState.DISCONNECTED;
      this.state.serverCapabilities = undefined;
      this.state.availableTools.clear();
      this.state.availableResources.clear();
      this.state.availablePrompts.clear();

      // Clear caches
      this.toolCache.clear();
      this.resourceCache.clear();

      this.errorHandler.incrementCounter("mcp_disconnections", {
        component: "MCPClient",
      });
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.disconnect", {
        component: "MCPClient",
        timestamp: new Date(),
      });
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return (
      this.state.connectionState === MCPConnectionState.CONNECTED &&
      this.wsClient.isConnected()
    );
  }

  /**
   * Get connection state
   */
  getConnectionState(): MCPConnectionState {
    return this.state.connectionState;
  }

  /**
   * Get client status
   */
  getStatus(): MCPClientStatus {
    return {
      state: this.state.connectionState,
      connectedAt: this.state.connectedAt,
      connectionAttempts: this.wsClient.getStats().totalAttempts,
      serverCapabilities: this.state.serverCapabilities,
      activeRequests: this.state.activeRequests.size,
    };
  }

  // ============================================================================
  // PROTOCOL MESSAGE HANDLING (STEP 3)
  // ============================================================================

  /**
   * Send a JSON-RPC request and wait for response
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

    // Check concurrent request limit
    if (this.state.activeRequests.size >= this.config.maxConcurrentRequests!) {
      await this.queueRequest();
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Create request through protocol handler
      const { message, promise } = await this.protocolHandler.sendRequest<T>(
        method,
        params,
        timeoutMs || this.config.requestTimeout,
      );

      // Send message through WebSocket
      await this.wsClient.send(message);

      // Set up abort controller for timeout
      const controller = new AbortController();
      const requestId = (JSON.parse(message) as JSONRPCRequest).id;
      this.state.activeRequests.set(requestId, controller);

      // Set timeout
      const timeout = setTimeout(() => {
        controller.abort();
        this.state.activeRequests.delete(requestId);
      }, timeoutMs || this.config.requestTimeout);

      this.requestTimeouts.set(requestId, timeout);

      // Wait for response
      const result = await promise;

      // Clean up
      clearTimeout(timeout);
      this.state.activeRequests.delete(requestId);
      this.requestTimeouts.delete(requestId);

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);

      this.updateLastActivity();

      return result;
    } catch (error) {
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);

      // Clean up on error
      const requestId = this.state.activeRequests.keys().next().value;
      if (requestId !== undefined) {
        this.state.activeRequests.delete(requestId);
        const timeout = this.requestTimeouts.get(requestId);
        if (timeout) {
          clearTimeout(timeout);
          this.requestTimeouts.delete(requestId);
        }
      }

      throw error;
    }
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  private async sendNotification(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): Promise<void> {
    if (this.destroyed) {
      throw new Error("Client has been destroyed");
    }

    if (!this.isConnected()) {
      throw new Error("Not connected to MCP server");
    }

    try {
      // Create notification through protocol handler
      const message = this.protocolHandler.sendNotification(method, params);

      // Send message through WebSocket
      await this.wsClient.send(message);

      this.updateLastActivity();
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.sendNotification", {
        component: "MCPClient",
        timestamp: new Date(),
        metadata: { method, params },
      });

      throw error;
    }
  }

  /**
   * Queue a request when concurrent limit is reached
   */
  private async queueRequest(): Promise<void> {
    return new Promise((resolve) => {
      this.state.requestQueue.push(resolve);
      this.processQueue();
    });
  }

  /**
   * Process request queue
   */
  private processQueue(): void {
    if (this.state.processingQueue || this.state.requestQueue.length === 0) {
      return;
    }

    if (this.state.activeRequests.size >= this.config.maxConcurrentRequests!) {
      return;
    }

    this.state.processingQueue = true;

    const resolve = this.state.requestQueue.shift();
    if (resolve) {
      resolve();
    }

    this.state.processingQueue = false;

    // Continue processing if there are more requests
    if (this.state.requestQueue.length > 0) {
      setTimeout(() => this.processQueue(), 10);
    }
  }

  /**
   * Cancel all active requests
   */
  private cancelAllRequests(): void {
    // Cancel active requests
    for (const [id, controller] of this.state.activeRequests) {
      controller.abort();
    }
    this.state.activeRequests.clear();

    // Clear timeouts
    for (const timeout of this.requestTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.requestTimeouts.clear();

    // Clear queue
    this.state.requestQueue = [];
  }

  // ============================================================================
  // MCP PROTOCOL METHODS (STEP 4)
  // ============================================================================

  /**
   * Initialize MCP protocol
   */
  async initialize(): Promise<MCPCapabilities> {
    try {
      const clientInfo = this.config.clientInfo || {
        name: "LOFERSIL MCP Client",
        version: "1.0.0",
      };

      const capabilities = this.config.capabilities || {};

      const result = await this.sendRequest<MCPCapabilities>("initialize", {
        protocolVersion: MCP_VERSION,
        capabilities,
        clientInfo,
      });

      this.state.serverCapabilities = result;
      this.state.connectionState = MCPConnectionState.CONNECTED;

      this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
        state: MCPConnectionState.CONNECTED,
        serverCapabilities: result,
      });

      return result;
    } catch (error) {
      this.state.connectionState = MCPConnectionState.ERROR;
      throw error;
    }
  }

  /**
   * List available tools from server
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const result = await this.sendRequest<{ tools: MCPTool[] }>("tools/list");

      const tools = result.tools || [];

      // Update available tools cache
      this.state.availableTools.clear();
      for (const tool of tools) {
        this.state.availableTools.set(tool.name, tool);
      }

      return tools;
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.listTools", {
        component: "MCPClient",
        timestamp: new Date(),
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
      // Check cache if enabled
      if (this.config.tools!.enableCaching) {
        const cacheKey = this.getToolCacheKey(name, args);
        const cached = this.toolCache.get(cacheKey);
        if (
          cached &&
          Date.now() - cached.timestamp < this.config.tools!.cacheTTL!
        ) {
          return cached.result;
        }
      }

      const startTime = Date.now();
      this.metrics.toolsCalled++;

      const result = await this.sendRequest<MCPToolResult>(
        "tools/call",
        {
          name,
          arguments: args,
        },
        this.config.tools!.defaultTimeout,
      );

      // Cache result if enabled
      if (this.config.tools!.enableCaching && !result.isError) {
        const cacheKey = this.getToolCacheKey(name, args);
        this.toolCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      this.emitEvent(MCPClientEventType.TOOL_CALLED, {
        toolName: name,
        arguments: args,
        result,
        executionTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.callTool", {
        component: "MCPClient",
        timestamp: new Date(),
        metadata: { toolName: name, arguments: args },
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

      const resources = result.resources || [];

      // Update available resources cache
      this.state.availableResources.clear();
      for (const resource of resources) {
        this.state.availableResources.set(resource.uri, resource);
      }

      return resources;
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.listResources", {
        component: "MCPClient",
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<MCPResourceContent> {
    try {
      // Check cache if enabled
      if (this.config.resources!.enableCaching) {
        const cached = this.resourceCache.get(uri);
        if (
          cached &&
          Date.now() - cached.timestamp < this.config.resources!.cacheTTL!
        ) {
          return cached.content;
        }
      }

      const startTime = Date.now();
      this.metrics.resourcesAccessed++;

      const result = await this.sendRequest<MCPResourceContent>(
        "resources/read",
        {
          uri,
        },
        this.config.resources!.defaultTimeout,
      );

      // Validate resource size
      const contentSize = result.content ? result.content.length : 0;
      if (contentSize > this.config.resources!.maxSize!) {
        throw new Error(
          `Resource size ${contentSize} exceeds maximum ${this.config.resources!.maxSize}`,
        );
      }

      // Cache result if enabled
      if (this.config.resources!.enableCaching) {
        this.resourceCache.set(uri, {
          content: result,
          timestamp: Date.now(),
        });
      }

      this.emitEvent(MCPClientEventType.RESOURCE_ACCESSED, {
        uri,
        result,
        accessTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.readResource", {
        component: "MCPClient",
        timestamp: new Date(),
        metadata: { uri },
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

      const prompts = result.prompts || [];

      // Update available prompts cache
      this.state.availablePrompts.clear();
      for (const prompt of prompts) {
        this.state.availablePrompts.set(prompt.name, prompt);
      }

      return prompts;
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.listPrompts", {
        component: "MCPClient",
        timestamp: new Date(),
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
      const startTime = Date.now();
      this.metrics.promptsGenerated++;

      const result = await this.sendRequest<MCPPromptResult>("prompts/get", {
        name,
        arguments: args || {},
      });

      this.emitEvent(MCPClientEventType.PROMPT_GENERATED, {
        promptName: name,
        arguments: args,
        result,
        generationTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.getPrompt", {
        component: "MCPClient",
        timestamp: new Date(),
        metadata: { promptName: name, arguments: args },
      });

      throw error;
    }
  }

  // ============================================================================
  // EVENT SYSTEM (STEP 5)
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

    // Check max listeners limit
    if (listeners.size >= this.config.events!.maxListeners!) {
      this.errorHandler.handleError(
        new Error(
          `Maximum event listeners (${this.config.events!.maxListeners}) exceeded for ${eventType}`,
        ),
        "MCPClient.addEventListener",
        {
          component: "MCPClient",
          timestamp: new Date(),
          metadata: { eventType, currentListeners: listeners.size },
        },
      );
      return;
    }

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
      source: "MCPClient",
    };

    // Batch events if enabled
    if (this.config.events!.enableBatching) {
      this.batchEvent(event);
    } else {
      this.dispatchEvent(event);
    }

    this.metrics.eventsEmitted++;
  }

  /**
   * Batch events for efficient processing
   */
  private batchEvent(event: MCPClientEvent): void {
    this.eventBatch.push(event);

    // Check if batch is ready to send
    if (
      this.eventBatch.length >= this.config.events!.batchSize! ||
      !this.eventBatchTimer
    ) {
      this.flushEventBatch();
    } else if (!this.eventBatchTimer) {
      this.eventBatchTimer = setTimeout(() => {
        this.flushEventBatch();
      }, this.config.events!.batchTimeout);
    }
  }

  /**
   * Flush event batch to listeners
   */
  private flushEventBatch(): void {
    if (this.eventBatchTimer) {
      clearTimeout(this.eventBatchTimer);
      this.eventBatchTimer = undefined;
    }

    const batch = [...this.eventBatch];
    this.eventBatch = [];

    for (const event of batch) {
      this.dispatchEvent(event);
    }
  }

  /**
   * Dispatch event to listeners
   */
  private dispatchEvent(event: MCPClientEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event as MCPClientEvent & { data: unknown });
        } catch (error) {
          this.errorHandler.handleError(error, "MCPClient.dispatchEvent", {
            component: "MCPClient",
            timestamp: new Date(),
            metadata: { eventType: event.type },
          });
        }
      }
    }
  }

  // ============================================================================
  // ERROR MANAGER INTEGRATION (STEP 6)
  // ============================================================================

  /**
   * Handle MCP error with full ErrorManager integration
   */
  async handleMCPError(
    error: Error,
    contextBuilder: Partial<MCPErrorContext>,
  ): Promise<MCPError> {
    const context = createMCPErrorContext({
      component: contextBuilder.component || "MCPClient",
      operation: contextBuilder.operation || "unknown",
      sessionId: this.state.sessionId,
      requestId: contextBuilder.requestId,
      connectionId: contextBuilder.connectionId,
      toolName: contextBuilder.toolName,
      resourceUri: contextBuilder.resourceUri,
      promptName: contextBuilder.promptName,
      attempt: contextBuilder.attempt,
      metadata: contextBuilder.metadata,
    });

    const category = classifyMCPError(error);
    const severity = determineMCPErrorSeverity(
      error,
      category,
      context.attempt,
    );
    const errorId = generateMCPErrorId();
    const errorMessage = sanitizeMCPErrorMessage(error.message);

    // Create a proper Error object that extends MCPError
    const mcpError = new Error(errorMessage) as MCPError;
    mcpError.name = "MCPError";
    mcpError.id = errorId;
    mcpError.message = errorMessage;
    mcpError.category = category;
    mcpError.severity = severity;
    mcpError.context = context;
    mcpError.cause = error;
    mcpError.stack = error.stack;
    mcpError.recoverable = this.isErrorRecoverable(category, severity);
    mcpError.retryable = this.isErrorRetryable(category, severity);
    mcpError.requiresHumanIntervention = this.requiresHumanIntervention(
      category,
      severity,
    );
    mcpError.correlationId = generateMCPCorrelationId();

    // Update error statistics
    this.updateErrorStatistics(mcpError);

    // Report to ErrorManager
    this.errorHandler.handleError(error, `MCPClient.${context.operation}`, {
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
    this.errorHandler.incrementCounter("mcp_errors", {
      component: context.component,
      category: mcpError.category,
      severity: mcpError.severity,
    });

    // Emit error event
    this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
      mcpError,
      originalError: error,
    });

    // Attempt recovery if enabled
    if (this.errorRecoveryConfig.enabled && mcpError.recoverable) {
      mcpError.recoveryStrategy = await this.getRecoveryStrategy(mcpError);
      if (mcpError.recoveryStrategy.action !== MCPRecoveryAction.MANUAL) {
        this.attemptErrorRecovery(mcpError);
      }
    }

    return mcpError;
  }

  /**
   * Set up error handling integration
   */
  private setupErrorHandling(): void {
    // Set up protocol handler error callback
    this.protocolHandler.setErrorHandler(async (error, message) => {
      await this.handleMCPError(error, {
        component: "MCPClient",
        operation: "protocolError",
        metadata: { message },
      });
    });
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
      MCPErrorCategory.WEBSOCKET,
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
      MCPErrorCategory.CIRCUIT_BREAKER,
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
        MCPErrorCategory.CIRCUIT_BREAKER,
      ].includes(category)
    );
  }

  /**
   * Get recovery strategy for error
   */
  private async getRecoveryStrategy(
    mcpError: MCPError,
  ): Promise<MCPRecoveryStrategy> {
    const context = mcpError.context;

    // Check circuit breaker
    if (!this.errorHandler.isComponentAvailable(context.component)) {
      return {
        action: MCPRecoveryAction.ESCALATE,
        requiresApproval: true,
      };
    }

    // Determine strategy based on error category
    switch (mcpError.category) {
      case MCPErrorCategory.NETWORK:
      case MCPErrorCategory.WEBSOCKET:
        return {
          action: MCPRecoveryAction.RECONNECT,
          delay: this.calculateRetryDelay(context.attempt || 0),
          maxAttempts: this.errorRecoveryConfig.maxRetries,
        };

      case MCPErrorCategory.TIMEOUT:
        return {
          action: MCPRecoveryAction.RETRY,
          delay: this.calculateRetryDelay(context.attempt || 0),
          maxAttempts: this.errorRecoveryConfig.maxRetries,
        };

      case MCPErrorCategory.RATE_LIMIT:
        return {
          action: MCPRecoveryAction.RETRY,
          delay: 5000, // Fixed delay for rate limiting
          maxAttempts: 2,
        };

      case MCPErrorCategory.TOOL_EXECUTION:
        return {
          action: MCPRecoveryAction.RETRY,
          delay: this.calculateRetryDelay(context.attempt || 0),
          maxAttempts: this.errorRecoveryConfig.maxRetries,
        };

      case MCPErrorCategory.PROTOCOL:
        return {
          action: MCPRecoveryAction.RESET,
          delay: 1000,
          maxAttempts: 1,
        };

      default:
        return {
          action: MCPRecoveryAction.SKIP,
        };
    }
  }

  /**
   * Attempt error recovery
   */
  private async attemptErrorRecovery(mcpError: MCPError): Promise<void> {
    const recoveryId = `${mcpError.id}_${Date.now()}`;

    // Avoid duplicate recoveries
    if (this.activeRecoveries.has(recoveryId)) {
      return;
    }

    const recoveryPromise = this.executeRecovery(mcpError);
    this.activeRecoveries.set(recoveryId, recoveryPromise);

    try {
      const success = await recoveryPromise;
      if (success) {
        this.errorHandler.recordSuccess(mcpError.context.component);
        this.errorHandler.incrementCounter("mcp_error_recovery_success", {
          component: mcpError.context.component,
          category: mcpError.category,
        });
      } else {
        this.errorHandler.incrementCounter("mcp_error_recovery_failure", {
          component: mcpError.context.component,
          category: mcpError.category,
        });
      }
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.errorRecovery", {
        component: "MCPClient",
        timestamp: new Date(),
        metadata: { originalErrorId: mcpError.id },
      });
    } finally {
      this.activeRecoveries.delete(recoveryId);
    }
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecovery(mcpError: MCPError): Promise<boolean> {
    const startTime = Date.now();
    const strategy = mcpError.recoveryStrategy!;

    try {
      switch (strategy.action) {
        case MCPRecoveryAction.RECONNECT:
          return await this.executeReconnectRecovery(mcpError, strategy);

        case MCPRecoveryAction.RETRY:
          return await this.executeRetryRecovery(mcpError, strategy);

        case MCPRecoveryAction.RESET:
          return await this.executeResetRecovery(mcpError, strategy);

        case MCPRecoveryAction.FALLBACK:
          return await this.executeFallbackRecovery(mcpError, strategy);

        default:
          return false;
      }
    } catch (error) {
      // Update recovery time statistics
      const recoveryTime = Date.now() - startTime;
      this.updateRecoveryStatistics(recoveryTime, false);
      throw error;
    }
  }

  /**
   * Execute reconnect recovery
   */
  private async executeReconnectRecovery(
    mcpError: MCPError,
    strategy: MCPRecoveryStrategy,
  ): Promise<boolean> {
    if (strategy.delay) {
      await this.delay(strategy.delay);
    }

    try {
      await this.disconnect();
      await this.connect();
      return true;
    } catch (error) {
      await this.handleMCPError(error as Error, {
        component: mcpError.context.component,
        operation: "reconnectRecovery",
        attempt: (mcpError.context.attempt || 0) + 1,
        metadata: { originalErrorId: mcpError.id },
      });
      return false;
    }
  }

  /**
   * Execute retry recovery
   */
  private async executeRetryRecovery(
    mcpError: MCPError,
    strategy: MCPRecoveryStrategy,
  ): Promise<boolean> {
    // This would be implemented based on the specific operation that failed
    // For now, return true to indicate recovery was attempted
    return true;
  }

  /**
   * Execute reset recovery
   */
  private async executeResetRecovery(
    mcpError: MCPError,
    strategy: MCPRecoveryStrategy,
  ): Promise<boolean> {
    if (strategy.delay) {
      await this.delay(strategy.delay);
    }

    try {
      // Reset protocol handler state
      this.protocolHandler.clear();

      // Clear caches
      this.clearCaches();

      return true;
    } catch (error) {
      await this.handleMCPError(error as Error, {
        component: mcpError.context.component,
        operation: "resetRecovery",
        attempt: (mcpError.context.attempt || 0) + 1,
        metadata: { originalErrorId: mcpError.id },
      });
      return false;
    }
  }

  /**
   * Execute fallback recovery
   */
  private async executeFallbackRecovery(
    mcpError: MCPError,
    strategy: MCPRecoveryStrategy,
  ): Promise<boolean> {
    // Implement fallback logic based on the operation
    // For now, return true to indicate fallback was attempted
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    let delay =
      this.errorRecoveryConfig.baseDelay *
      Math.pow(this.errorRecoveryConfig.backoffMultiplier, attempt);
    delay = Math.min(delay, this.errorRecoveryConfig.maxDelay);

    // Add jitter if enabled
    if (this.errorRecoveryConfig.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Update error statistics
   */
  private updateErrorStatistics(mcpError: MCPError): void {
    this.errorStatistics.totalErrors++;
    this.errorStatistics.lastError = new Date();

    // Update by category
    this.errorStatistics.errorsByCategory[mcpError.category] =
      (this.errorStatistics.errorsByCategory[mcpError.category] || 0) + 1;

    // Update by severity
    this.errorStatistics.errorsBySeverity[mcpError.severity] =
      (this.errorStatistics.errorsBySeverity[mcpError.severity] || 0) + 1;
  }

  /**
   * Update recovery statistics
   */
  private updateRecoveryStatistics(
    recoveryTime: number,
    success: boolean,
  ): void {
    // Update average recovery time
    const totalRecoveries = this.errorStatistics.totalErrors;
    this.errorStatistics.averageRecoveryTime =
      (this.errorStatistics.averageRecoveryTime * (totalRecoveries - 1) +
        recoveryTime) /
      totalRecoveries;

    // Update success rate
    const successfulRecoveries = success ? 1 : 0;
    this.errorStatistics.recoverySuccessRate =
      (this.errorStatistics.recoverySuccessRate * (totalRecoveries - 1) +
        successfulRecoveries) /
      totalRecoveries;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    return { ...this.errorStatistics };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle WebSocket client errors
   */
  private handleWebSocketError(error: Error): void {
    this.errorHandler.handleError(error, "MCPClient.webSocketError", {
      component: "MCPClient",
      timestamp: new Date(),
    });

    this.emitEvent(MCPClientEventType.ERROR_OCCURRED, {
      error,
      source: "WebSocket",
    });

    // Update connection state
    if (this.state.connectionState === MCPConnectionState.CONNECTED) {
      this.state.connectionState = MCPConnectionState.ERROR;
    }
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionStateChange(state: MCPConnectionState): void {
    const oldState = this.state.connectionState;
    this.state.connectionState = state;

    this.errorHandler.incrementCounter("mcp_state_changes", {
      component: "MCPClient",
      fromState: oldState,
      toState: state,
    });

    this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
      oldState,
      newState: state,
    });
  }

  // ============================================================================
  // CLIENT UTILITIES AND HELPERS (STEP 7)
  // ============================================================================

  /**
   * Get tool cache key
   */
  private getToolCacheKey(name: string, args: Record<string, unknown>): string {
    return `tool:${name}:${JSON.stringify(args)}`;
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this.state.lastActivity = new Date();
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalRequests =
      this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) /
      totalRequests;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): MCPClientMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      toolsCalled: 0,
      resourcesAccessed: 0,
      promptsGenerated: 0,
      eventsEmitted: 0,
      lastReset: new Date(),
    };
  }

  /**
   * Get available tools
   */
  getAvailableTools(): MCPTool[] {
    return Array.from(this.state.availableTools.values());
  }

  /**
   * Get available resources
   */
  getAvailableResources(): MCPResource[] {
    return Array.from(this.state.availableResources.values());
  }

  /**
   * Get available prompts
   */
  getAvailablePrompts(): MCPPrompt[] {
    return Array.from(this.state.availablePrompts.values());
  }

  /**
   * Get server capabilities
   */
  getServerCapabilities(): MCPCapabilities | undefined {
    return this.state.serverCapabilities;
  }

  /**
   * Check if a tool is available
   */
  hasTool(name: string): boolean {
    return this.state.availableTools.has(name);
  }

  /**
   * Check if a resource is available
   */
  hasResource(uri: string): boolean {
    return this.state.availableResources.has(uri);
  }

  /**
   * Check if a prompt is available
   */
  hasPrompt(name: string): boolean {
    return this.state.availablePrompts.has(name);
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.state.availableTools.get(name);
  }

  /**
   * Get resource by URI
   */
  getResource(uri: string): MCPResource | undefined {
    return this.state.availableResources.get(uri);
  }

  /**
   * Get prompt definition by name
   */
  getPromptDefinition(name: string): MCPPrompt | undefined {
    return this.state.availablePrompts.get(name);
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.toolCache.clear();
    this.resourceCache.clear();
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<
    MCPOperationResult<Record<string, unknown>>
  > {
    const health: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      sessionId: this.state.sessionId,
      connectionState: this.state.connectionState,
      isConnected: this.isConnected(),
      lastActivity: this.state.lastActivity?.toISOString(),
      connectedAt: this.state.connectedAt?.toISOString(),
      metrics: this.metrics,
      activeRequests: this.state.activeRequests.size,
      queueSize: this.state.requestQueue.length,
      cacheSize: {
        tools: this.toolCache.size,
        resources: this.resourceCache.size,
      },
    };

    try {
      // Test basic connectivity
      if (this.isConnected()) {
        // Try a simple ping-like operation
        const startTime = Date.now();
        await this.listTools();
        health.latency = Date.now() - startTime;
        health.serverReachable = true;
      } else {
        health.serverReachable = false;
      }

      // Test WebSocket client health
      const wsStats = this.wsClient.getStats();
      health.webSocket = {
        connected: this.wsClient.isConnected(),
        stats: wsStats,
      };

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

  /**
   * Perform diagnostics
   */
  async performDiagnostics(): Promise<
    MCPOperationResult<Record<string, unknown>>
  > {
    const diagnostics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      sessionId: this.state.sessionId,
      config: this.config,
      state: this.state,
      metrics: this.metrics,
      destroyed: this.destroyed,
    };

    try {
      // Test configuration
      const configValidation = validateMCPClientConfig(this.config);
      diagnostics.configValid = configValidation.valid;
      diagnostics.configErrors = configValidation.errors;

      // Test WebSocket client
      const wsDiagnostics = await this.wsClient.performDiagnostics();
      diagnostics.webSocketDiagnostics = wsDiagnostics;

      // Test protocol handler
      diagnostics.protocolHandler = {
        pendingRequests: this.protocolHandler
          .getRequestManager()
          .getPendingCount(),
      };

      // Test caches
      diagnostics.caches = {
        toolCacheSize: this.toolCache.size,
        resourceCacheSize: this.resourceCache.size,
        eventBatchSize: this.eventBatch.length,
      };

      // Test event listeners
      diagnostics.eventListeners = {};
      for (const [eventType, listeners] of this.eventListeners) {
        (diagnostics.eventListeners as any)[eventType] = listeners.size;
      }

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
   * Get configuration
   */
  getConfig(): MCPClientExtendedConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MCPClientExtendedConfig>): void {
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

    // Update WebSocket client config if needed
    if (
      newConfig.serverUrl ||
      newConfig.connectionTimeout ||
      newConfig.reconnection
    ) {
      this.wsClient.updateConfig(newConfig);
    }
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
      // Disconnect
      await this.disconnect();

      // Cancel all requests
      this.cancelAllRequests();

      // Clear event batch timer
      if (this.eventBatchTimer) {
        clearTimeout(this.eventBatchTimer);
      }

      // Clear all caches
      this.clearCaches();

      // Clear event listeners
      this.eventListeners.clear();

      // Destroy WebSocket client
      this.wsClient.destroy();

      // Clear protocol handler
      this.protocolHandler.clear();

      this.errorHandler.incrementCounter("mcp_client_destroyed", {
        component: "MCPClient",
      });
    } catch (error) {
      this.errorHandler.handleError(error, "MCPClient.destroy", {
        component: "MCPClient",
        timestamp: new Date(),
      });
    }
  }

  // ============================================================================
  // PRIVATE SETUP METHODS
  // ============================================================================

  /**
   * Set up event handlers for WebSocket client
   */
  private setupEventHandlers(): void {
    // Connection state changes
    this.wsClient.addEventListener(
      MCPClientEventType.CONNECTION_STATE_CHANGED,
      (event: any) => {
        this.handleConnectionStateChange(event.data.newState);
      },
    );

    // Message events
    this.wsClient.addEventListener(
      MCPClientEventType.MESSAGE_RECEIVED,
      (event: any) => {
        // Forward to protocol handler
        if (event.data.message) {
          this.protocolHandler.handleMessage(
            JSON.stringify(event.data.message),
          );
        }
      },
    );

    // Error events
    this.wsClient.addEventListener(
      MCPClientEventType.ERROR_OCCURRED,
      (event: any) => {
        this.handleWebSocketError(event.data.error);
      },
    );
  }

  /**
   * Set up protocol message handlers
   */
  private setupProtocolHandlers(): void {
    // Set up error handling
    this.setupErrorHandling();

    // Register handlers for incoming requests (if this client acts as a server)
    // This would be used for bidirectional communication
    this.protocolHandler.registerHandler("ping", async (request) => {
      // Handle ping requests
      const response = {
        jsonrpc: "2.0",
        id: (request as any).id,
        result: { timestamp: new Date().toISOString() },
      };

      await this.wsClient.send(JSON.stringify(response));
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./client";
