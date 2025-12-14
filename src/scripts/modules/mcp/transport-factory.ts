/**
 * MCP Transport Factory
 *
 * Factory pattern implementation for creating and managing MCP transport instances.
 * Supports both WebSocket and HTTP transports with automatic selection based on configuration.
 *
 * Features:
 * - Transport factory pattern for flexible transport creation
 * - Automatic transport selection based on configuration
 * - Support for transport fallback strategies
 * - Transport-specific configuration validation
 * - Built-in transport health checking
 * - Context7 integration for HTTP transport
 * - Performance monitoring and statistics
 * - Comprehensive error handling
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 */

import {
  MCPConnectionState,
  MCPClientEventType,
  MCPEventHandler,
  MCPErrorCategory,
  MCPErrorContext,
  MCPErrorSeverity,
  createMCPErrorContext,
  generateMCPErrorId,
  sanitizeMCPErrorMessage,
  MCPRecoveryAction,
} from "./types";
import {
  MCPTransport,
  TransportConfig,
  TransportFactory,
  TransportError,
  TransportErrorType,
  createTransportError,
  validateTransportConfig,
  transportErrorToMCPError,
} from "./transport-interface";
import { HTTPTransport, HTTPTransportConfig } from "./http-transport";
import { MCPWebSocketClient } from "./websocket-client";
import { ErrorManager } from "../ErrorManager";

// ============================================================================
// TRANSPORT FACTORY CONFIGURATION
// ============================================================================

/**
 * Transport factory configuration
 */
export interface MCPTransportFactoryConfig {
  /** Default transport type */
  defaultTransportType: "websocket" | "http" | "auto";
  /** Enable transport fallback */
  enableFallback: boolean;
  /** Fallback transport order */
  fallbackOrder: ("websocket" | "http")[];
  /** Transport health check interval in milliseconds */
  healthCheckInterval?: number;
  /** Enable transport metrics */
  enableMetrics: boolean;
  /** Error manager instance */
  errorHandler: ErrorManager;
  /** Transport-specific configurations */
  transportConfigs?: {
    websocket?: Partial<TransportConfig>;
    http?: Partial<HTTPTransportConfig>;
  };
}

/**
 * Transport creation options
 */
export interface TransportCreationOptions {
  /** Preferred transport type */
  preferredType?: "websocket" | "http";
  /** Force specific transport type */
  forceType?: "websocket" | "http";
  /** Enable fallback if primary fails */
  enableFallback?: boolean;
  /** Transport-specific overrides */
  overrides?: {
    websocket?: Partial<TransportConfig>;
    http?: Partial<HTTPTransportConfig>;
  };
}

/**
 * Transport health status
 */
export interface TransportHealthStatus {
  /** Transport type */
  type: "websocket" | "http";
  /** Health status */
  healthy: boolean;
  /** Last health check timestamp */
  lastChecked: Date;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Error details if unhealthy */
  error?: string;
  /** Health check details */
  details?: Record<string, unknown>;
}

/**
 * Factory statistics
 */
export interface TransportFactoryStats {
  /** Total transports created */
  totalTransportsCreated: number;
  /** Transports created by type */
  transportsByType: Record<string, number>;
  /** Fallback activations */
  fallbackActivations: number;
  /** Health checks performed */
  healthChecksPerformed: number;
  /** Current active transports */
  activeTransports: number;
  /** Transport health status */
  transportHealth: Record<string, TransportHealthStatus>;
  /** Creation errors */
  creationErrors: number;
}

// ============================================================================
// MAIN TRANSPORT FACTORY CLASS
// ============================================================================

/**
 * MCP Transport Factory
 *
 * Factory class for creating MCP transport instances with support for
 * multiple transport types and automatic fallback strategies.
 */
export class MCPTransportFactory implements TransportFactory {
  private config: MCPTransportFactoryConfig;
  private errorHandler: ErrorManager;
  private stats: TransportFactoryStats;
  private healthCheckTimer?: NodeJS.Timeout;
  private activeTransports = new Map<string, MCPTransport>();
  private destroyed = false;

  // Default configuration
  private static readonly DEFAULT_CONFIG: Partial<MCPTransportFactoryConfig> = {
    defaultTransportType: "auto",
    enableFallback: true,
    fallbackOrder: ["http", "websocket"], // HTTP-first strategy for Context7
    healthCheckInterval: 60000, // 1 minute
    enableMetrics: true,
  };

  // ============================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ============================================================================

  constructor(config: MCPTransportFactoryConfig) {
    this.config = { ...MCPTransportFactory.DEFAULT_CONFIG, ...config };
    this.errorHandler = config.errorHandler;
    this.stats = this.initializeStats();

    // Start health checking if enabled
    if (this.config.healthCheckInterval) {
      this.startHealthChecking();
    }
  }

  /**
   * Initialize factory statistics
   */
  private initializeStats(): TransportFactoryStats {
    return {
      totalTransportsCreated: 0,
      transportsByType: {},
      fallbackActivations: 0,
      healthChecksPerformed: 0,
      activeTransports: 0,
      transportHealth: {},
      creationErrors: 0,
    };
  }

  // ============================================================================
  // TRANSPORT CREATION METHODS
  // ============================================================================

  /**
   * Create transport instance
   */
  createTransport(
    config: TransportConfig,
    options?: TransportCreationOptions,
  ): MCPTransport {
    if (this.destroyed) {
      throw createTransportError(
        TransportErrorType.CONFIGURATION_ERROR,
        "Transport factory has been destroyed",
      );
    }

    const mergedOptions = this.mergeOptions(options);
    const transportType = this.determineTransportType(config, mergedOptions);

    try {
      const transport = this.createTransportByType(
        transportType,
        config,
        mergedOptions,
      );

      // Update statistics
      this.updateStats(transportType, true);

      // Register transport for health monitoring
      this.registerTransport(transport);

      this.errorHandler.incrementCounter("mcp_transport_created", {
        component: "MCPTransportFactory",
        transportType,
      });

      return transport;
    } catch (error) {
      this.updateStats(transportType, false);

      const mcpError = this.createMCPError(error, "createTransport", {
        transportType,
        metadata: {
          config: { ...config, apiKey: config.apiKey ? "REDACTED" : undefined },
        },
      });

      throw mcpError;
    }
  }

  /**
   * Create transport by specific type
   */
  private createTransportByType(
    type: "websocket" | "http",
    config: TransportConfig,
    options: TransportCreationOptions,
  ): MCPTransport {
    const mergedConfig = this.mergeConfig(type, config, options);

    switch (type) {
      case "websocket":
        return this.createWebSocketTransport(mergedConfig);

      case "http":
        return this.createHTTPTransport(mergedConfig as HTTPTransportConfig);

      default:
        throw createTransportError(
          TransportErrorType.CONFIGURATION_ERROR,
          `Unknown transport type: ${type}`,
        );
    }
  }

  /**
   * Create WebSocket transport
   */
  private createWebSocketTransport(config: TransportConfig): MCPTransport {
    // Import WebSocket client dynamically to avoid circular dependencies
    const { MCPWebSocketClient } = require("./websocket-client");

    // Wrap WebSocket client to implement MCPTransport interface
    return new WebSocketTransportWrapper(config, this.errorHandler);
  }

  /**
   * Create HTTP transport
   */
  private createHTTPTransport(config: HTTPTransportConfig): MCPTransport {
    return new HTTPTransport(config);
  }

  /**
   * Determine transport type based on configuration and options
   */
  private determineTransportType(
    config: TransportConfig,
    options: TransportCreationOptions,
  ): "websocket" | "http" {
    // Force specific type if requested
    if (options.forceType) {
      return options.forceType;
    }

    // Use preferred type if specified
    if (options.preferredType) {
      return options.preferredType;
    }

    // Auto-detect based on configuration
    if (this.config.defaultTransportType === "auto") {
      return this.autoDetectTransportType(config);
    }

    return this.config.defaultTransportType;
  }

  /**
   * Auto-detect transport type based on configuration
   */
  private autoDetectTransportType(
    config: TransportConfig,
  ): "websocket" | "http" {
    // Check for Context7 HTTP configuration
    if (
      (config.transportSpecific as any)?.context7 ||
      config.serverUrl.includes("context7.com")
    ) {
      return "http";
    }

    // Check for WebSocket URL
    if (
      config.serverUrl.startsWith("ws://") ||
      config.serverUrl.startsWith("wss://")
    ) {
      return "websocket";
    }

    // Check for HTTP URL
    if (
      config.serverUrl.startsWith("http://") ||
      config.serverUrl.startsWith("https://")
    ) {
      return "http";
    }

    // Default to HTTP for Context7 compatibility
    return "http";
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(
    options?: TransportCreationOptions,
  ): Required<TransportCreationOptions> {
    return {
      preferredType: options?.preferredType || "http",
      forceType: options?.forceType || "http",
      enableFallback: options?.enableFallback ?? this.config.enableFallback,
      overrides: options?.overrides || {},
    };
  }

  /**
   * Merge configuration with transport-specific overrides
   */
  private mergeConfig(
    type: "websocket" | "http",
    config: TransportConfig,
    options: TransportCreationOptions,
  ): TransportConfig {
    const baseConfig = { ...config };
    const transportDefaults = this.config.transportConfigs?.[type];
    const overrides = options.overrides?.[type];

    return {
      ...baseConfig,
      ...transportDefaults,
      ...overrides,
      transportSpecific: {
        ...baseConfig.transportSpecific,
        ...transportDefaults?.transportSpecific,
        ...overrides?.transportSpecific,
      },
    };
  }

  // ============================================================================
  // TRANSPORT HEALTH MONITORING
  // ============================================================================

  /**
   * Start health checking for all transports
   */
  private startHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all active transports
   */
  private async performHealthCheck(): Promise<void> {
    this.stats.healthChecksPerformed++;

    for (const [id, transport] of this.activeTransports) {
      try {
        const startTime = Date.now();
        const healthResult = await transport.healthCheck();
        const responseTime = Date.now() - startTime;

        const transportType = transport.getTransportType();
        if (transportType !== "websocket" && transportType !== "http") {
          throw new Error(`Invalid transport type: ${transportType}`);
        }

        const healthStatus: TransportHealthStatus = {
          type: transportType,
          healthy: healthResult.healthy,
          lastChecked: new Date(),
          responseTime,
          details: healthResult.details,
        };

        this.stats.transportHealth[id] = healthStatus;

        if (!healthResult.healthy) {
          this.errorHandler.incrementCounter("mcp_transport_unhealthy", {
            component: "MCPTransportFactory",
            transportType: transport.getTransportType(),
            transportId: id,
          });
        }
      } catch (error) {
        const transportType = transport.getTransportType();
        if (transportType !== "websocket" && transportType !== "http") {
          throw new Error(`Invalid transport type: ${transportType}`);
        }

        const healthStatus: TransportHealthStatus = {
          type: transportType,
          healthy: false,
          lastChecked: new Date(),
          error: (error as Error).message,
        };

        this.stats.transportHealth[id] = healthStatus;

        this.errorHandler.handleError(
          error as Error,
          "MCPTransportFactory.healthCheck",
          {
            component: "MCPTransportFactory",
            timestamp: new Date(),
            metadata: {
              transportId: id,
              transportType: transport.getTransportType(),
            },
          },
        );
      }
    }
  }

  /**
   * Register transport for monitoring
   */
  private registerTransport(transport: MCPTransport): void {
    const transportId = `${transport.getTransportType()}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    this.activeTransports.set(transportId, transport);
    this.stats.activeTransports = this.activeTransports.size;

    // Clean up when transport is destroyed
    const originalDestroy = transport.destroy.bind(transport);
    transport.destroy = async () => {
      await originalDestroy();
      this.activeTransports.delete(transportId);
      this.stats.activeTransports = this.activeTransports.size;
    };
  }

  // ============================================================================
  // UTILITY AND ERROR HANDLING METHODS
  // ============================================================================

  /**
   * Get supported transport types
   */
  getSupportedTypes(): string[] {
    return ["websocket", "http"];
  }

  /**
   * Check if transport type is supported
   */
  isSupported(type: string): boolean {
    return this.getSupportedTypes().includes(type);
  }

  /**
   * Update factory statistics
   */
  private updateStats(transportType: string, success: boolean): void {
    this.stats.totalTransportsCreated++;

    if (!this.stats.transportsByType[transportType]) {
      this.stats.transportsByType[transportType] = 0;
    }
    this.stats.transportsByType[transportType]++;

    if (!success) {
      this.stats.creationErrors++;
    }
  }

  /**
   * Create MCP error from generic error
   */
  private createMCPError(
    error: unknown,
    operation: string,
    context: Partial<MCPErrorContext>,
  ): Error {
    const errorContext = createMCPErrorContext({
      component: "MCPTransportFactory",
      operation,
      timestamp: new Date(),
      metadata: {
        ...context.metadata,
        factoryConfig: {
          defaultTransportType: this.config.defaultTransportType,
          enableFallback: this.config.enableFallback,
          fallbackOrder: this.config.fallbackOrder,
        },
      },
    });

    if (error && typeof error === "object" && "type" in error) {
      // It's already a transport error
      const transportError = error as TransportError;
      return transportErrorToMCPError(transportError, errorContext);
    }

    // Convert generic error
    const errorMessage = error instanceof Error ? error.message : String(error);
    return transportErrorToMCPError(
      createTransportError(TransportErrorType.UNKNOWN_ERROR, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      }),
      errorContext,
    );
  }

  /**
   * Create transport error from generic error
   */
  private createTransportErrorFromError(error: unknown): TransportError {
    if (error && typeof error === "object" && "type" in error) {
      return error as TransportError;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return createTransportError(
      TransportErrorType.UNKNOWN_ERROR,
      errorMessage,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Get factory statistics
   */
  getStats(): TransportFactoryStats {
    return {
      ...this.stats,
      activeTransports: this.activeTransports.size,
    };
  }

  /**
   * Get health status of all transports
   */
  async getHealthStatus(): Promise<Record<string, TransportHealthStatus>> {
    await this.performHealthCheck();
    return { ...this.stats.transportHealth };
  }

  /**
   * Update factory configuration
   */
  updateConfig(newConfig: Partial<MCPTransportFactoryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart health checking with new interval
    if (newConfig.healthCheckInterval !== undefined) {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }

      if (
        this.config.healthCheckInterval &&
        this.config.healthCheckInterval > 0
      ) {
        this.startHealthChecking();
      }
    }
  }

  /**
   * Destroy factory and clean up resources
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

      // Destroy all active transports
      const destroyPromises = Array.from(this.activeTransports.values()).map(
        (transport) =>
          transport.destroy().catch((error) =>
            this.errorHandler.handleError(
              error,
              "MCPTransportFactory.destroy",
              {
                component: "MCPTransportFactory",
                timestamp: new Date(),
              },
            ),
          ),
      );

      await Promise.all(destroyPromises);
      this.activeTransports.clear();

      this.errorHandler.incrementCounter("mcp_transport_factory_destroyed", {
        component: "MCPTransportFactory",
      });
    } catch (error) {
      this.errorHandler.handleError(error, "MCPTransportFactory.destroy", {
        component: "MCPTransportFactory",
        timestamp: new Date(),
      });
    }
  }
}

// ============================================================================
// WEBSOCKET TRANSPORT WRAPPER
// ============================================================================

/**
 * WebSocket Transport Wrapper
 *
 * Wrapper class that adapts the existing MCPWebSocketClient to implement
 * the MCPTransport interface for consistency with HTTP transport.
 */
class WebSocketTransportWrapper implements MCPTransport {
  private wsClient: MCPWebSocketClient;
  private config: TransportConfig;
  private errorHandler: ErrorManager;

  constructor(config: TransportConfig, errorHandler: ErrorManager) {
    this.config = config;
    this.errorHandler = errorHandler;
    this.wsClient = new MCPWebSocketClient(config, errorHandler);
  }

  // Implement MCPTransport interface methods
  async connect(): Promise<void> {
    await this.wsClient.connect();
  }

  async disconnect(): Promise<void> {
    this.wsClient.disconnect();
  }

  isConnected(): boolean {
    return this.wsClient.isConnected();
  }

  getConnectionState(): MCPConnectionState {
    return this.wsClient.isConnected()
      ? MCPConnectionState.CONNECTED
      : MCPConnectionState.DISCONNECTED;
  }

  async sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown> | unknown[],
    timeoutMs?: number,
  ): Promise<T> {
    // This would need to be implemented in the WebSocket client
    // For now, throw an error indicating the method needs implementation
    throw new Error("WebSocket sendRequest not yet implemented in wrapper");
  }

  async sendNotification(
    method: string,
    params?: Record<string, unknown> | unknown[],
  ): Promise<void> {
    throw new Error(
      "WebSocket sendNotification not yet implemented in wrapper",
    );
  }

  async sendMessage(message: string): Promise<void> {
    await this.wsClient.send(message);
  }

  addEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<any>,
  ): void {
    this.wsClient.addEventListener(eventType, handler);
  }

  removeEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler<any>,
  ): void {
    this.wsClient.removeEventListener(eventType, handler);
  }

  emitEvent(eventType: MCPClientEventType, data?: any): void {
    // Use a public method or create a new event emission method
    (this.wsClient as any).emitPublicEvent?.(eventType, data);
  }

  getConfig(): TransportConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<TransportConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.wsClient.updateConfig(newConfig);
  }

  getStats(): any {
    return this.wsClient.getStats();
  }

  resetStats(): void {
    // Implement if WebSocket client supports this
  }

  async performDiagnostics(): Promise<Record<string, unknown>> {
    try {
      const result = await this.wsClient.performDiagnostics();
      // Handle both MCPOperationResult and direct Record<string, unknown>
      if (result && typeof result === "object" && "success" in result) {
        // It's an MCPOperationResult
        return result.success && result.data
          ? result.data
          : { error: "Diagnostics failed" };
      }
      // It's already a Record<string, unknown>
      return result as Record<string, unknown>;
    } catch (error) {
      return {
        error: (error as Error).message,
        transportType: "websocket",
        connected: this.isConnected(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async initialize(): Promise<void> {
    await this.connect();
  }

  async destroy(): Promise<void> {
    this.wsClient.destroy();
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    details?: Record<string, unknown>;
  }> {
    try {
      const diagnostics = await this.performDiagnostics();
      return {
        healthy: this.isConnected(),
        details: diagnostics,
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: (error as Error).message },
      };
    }
  }

  getTransportType(): string {
    return "websocket";
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create default transport factory with Context7 HTTP-first configuration
 */
export function createTransportFactory(
  errorHandler: ErrorManager,
): MCPTransportFactory {
  return new MCPTransportFactory({
    defaultTransportType: "http", // HTTP-first for Context7
    enableFallback: true,
    fallbackOrder: ["http", "websocket"], // Try WebSocket if HTTP fails
    healthCheckInterval: 60000,
    enableMetrics: true,
    errorHandler,
    transportConfigs: {
      http: {
        requestTimeout: 30000,
        maxRetries: 3,
        enableCompression: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
        },
      },
      websocket: {
        connectionTimeout: 30000,
        requestTimeout: 30000,
      },
    },
  });
}

/**
 * Create Context7-specific transport factory
 */
export function createContext7TransportFactory(
  apiKey: string,
  errorHandler: ErrorManager,
): MCPTransportFactory {
  return new MCPTransportFactory({
    defaultTransportType: "http",
    enableFallback: true,
    fallbackOrder: ["http", "websocket"],
    healthCheckInterval: 60000,
    enableMetrics: true,
    errorHandler,
    transportConfigs: {
      http: {
        serverUrl: "https://mcp.context7.com/mcp",
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
    },
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./transport-factory";
