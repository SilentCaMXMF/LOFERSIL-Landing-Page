/**
 * MCP HTTP Client Implementation
 *
 * HTTP-based MCP client for GitHub MCP server compatibility.
 * Uses POST requests with JSON-RPC 2.0 protocol and handles Server-Sent Events.
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
} from "./types";
import { ErrorManager } from "../ErrorManager";

// ============================================================================
// HTTP CLIENT TYPES
// ============================================================================

/**
 * HTTP client configuration
 */
export interface HTTPMCPClientConfig extends MCPClientConfig {
  /** HTTP request timeout */
  requestTimeout?: number;
  /** SSE connection timeout */
  sseTimeout?: number;
  /** Enable request/response logging */
  enableLogging?: boolean;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
}

/**
 * HTTP client state
 */
interface HTTPMCPClientState {
  connectionState: MCPConnectionState;
  serverCapabilities?: MCPCapabilities;
  availableTools: Map<string, MCPTool>;
  availableResources: Map<string, MCPResource>;
  availablePrompts: Map<string, MCPPrompt>;
  activeRequests: Map<string | number, AbortController>;
  sessionId?: string;
  sseConnection?: EventSource;
  lastRequestTime?: number;
}

/**
 * HTTP request configuration
 */
interface HTTPRequestConfig {
  method: string;
  params?: any;
  timeout?: number;
}

// ============================================================================
// HTTP MCP CLIENT CLASS
// ============================================================================

/**
 * HTTP-based MCP client for GitHub MCP server compatibility
 */
export class HTTPMCPClient {
  private config: HTTPMCPClientConfig;
  private errorHandler: ErrorManager;
  private state: HTTPMCPClientState;
  private eventListeners = new Map<MCPClientEventType, Set<MCPEventHandler>>();
  private requestId = 0;
  private activeRequests = new Map<string | number, AbortController>();

  constructor(config: HTTPMCPClientConfig, errorHandler: ErrorManager) {
    // Validate configuration
    const validation = validateMCPClientConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid MCP HTTP client config: ${validation.errors.join(", ")}`,
      );
    }

    this.config = config;
    this.errorHandler = errorHandler;

    // Initialize client state
    this.state = {
      connectionState: MCPConnectionState.DISCONNECTED,
      availableTools: new Map(),
      availableResources: new Map(),
      availablePrompts: new Map(),
      activeRequests: new Map(),
      sessionId: this.generateSessionId(),
    };

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Send JSON-RPC request via HTTP POST
   */
  private async sendRequest<T>(request: JSONRPCRequest): Promise<T> {
    const requestId = request.id.toString();
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const timeout = request.timeout || this.config.requestTimeout || 30000;

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.activeRequests.delete(requestId);
      this.errorHandler.handleError(
        new Error(`Request timeout after ${timeout}ms`),
        "HTTPMCPClient.sendRequest",
      );
    }, timeout);

    try {
      const response = await fetch(this.config.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.config.headers?.Authorization || "",
          ...(this.config.headers || {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.text();

      if (!responseData) {
        throw new Error("Empty response from server");
      }

      try {
        const parsed = JSON.parse(responseData);
        this.handleJSONRPCResponse(parsed);
        return parsed.result as T;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Default event listeners
    this.eventListeners.set(
      MCPClientEventType.CONNECTION_STATE_CHANGED,
      new Set(),
    );
    this.eventListeners.set(MCPClientEventType.TOOL_CALLED, new Set());
    this.eventListeners.set(MCPClientEventType.RESOURCE_ACCESSED, new Set());
    this.eventListeners.set(MCPClientEventType.PROMPT_GENERATED, new Set());
    this.eventListeners.set(MCPClientEventType.ERROR_OCCURRED, new Set());
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler,
  ): void {
    const listeners = this.eventListeners.get(eventType) || new Set();
    listeners.add(handler);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventType: MCPClientEventType,
    handler: MCPEventHandler,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: MCPClientEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const event = {
        type: eventType,
        data,
        timestamp: new Date(),
      };
      listeners.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          this.errorHandler.handleError(error, "HTTPMCPClient.emitEvent", {
            type: eventType,
            error: error.message,
          });
        }
      });
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to MCP server via HTTP POST + SSE
   */
  async connect(): Promise<void> {
    if (this.state.connectionState === MCPConnectionState.CONNECTED) {
      return;
    }

    if (this.state.connectionState === MCPConnectionState.CONNECTING) {
      throw new Error("Connection already in progress");
    }

    try {
      this.setState(MCPConnectionState.CONNECTING);

      // Initialize the connection with POST request
      await this.initializeConnection();

      // Establish SSE connection for streaming responses
      await this.establishSSEConnection();

      this.setState(MCPConnectionState.CONNECTED);
      this.errorHandler.recordSuccess("HTTPMCPClient");

      if (this.config.enableLogging) {
        console.log("✅ Connected to MCP server via HTTP + SSE");
      }
    } catch (error) {
      this.setState(MCPConnectionState.ERROR);
      this.errorHandler.handleError(error, "HTTPMCPClient.connect", {
        url: this.config.serverUrl,
        timestamp: new Date(),
      });
      throw error;
    }
  }

  /**
   * Initialize MCP connection
   */
  private async initializeConnection(): Promise<MCPCapabilities> {
    const initRequest: JSONRPCRequest = {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "initialize",
      params: {
        protocolVersion: MCP_VERSION,
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        clientInfo: {
          name: this.config.clientInfo?.name || "HTTP MCP Client",
          version: this.config.clientInfo?.version || "1.0.0",
        },
      },
    };

    return this.sendRequest(initRequest);
  }

  /**
   * Establish SSE connection for streaming responses
   */
  private async establishSSEConnection(): Promise<void> {
    const sseUrl = new URL(this.config.serverUrl);

    // Add session ID if available
    if (this.state.sessionId) {
      sseUrl.searchParams.set("sessionId", this.state.sessionId);
    }

    const eventSource = new EventSource(sseUrl.toString(), {
      withCredentials: true,
    });

    // Set up SSE event handlers
    eventSource.addEventListener("open", () => {
      if (this.config.enableLogging) {
        console.log("📡 SSE connection established");
      }
    });

    eventSource.addEventListener("message", (event) => {
      try {
        const data = event.data;
        if (typeof data === "string" && data.trim()) {
          this.handleSSEMessage(data);
        }
      } catch (error) {
        this.errorHandler.handleError(error, "HTTPMCPClient.handleSSEMessage", {
          message: data,
        });
      }
    });

    eventSource.addEventListener("error", (error) => {
      this.setState(MCPConnectionState.ERROR);
      this.errorHandler.handleError(
        new Error(`SSE connection error: ${error}`),
        "HTTPMCPClient.establishSSEConnection",
      );
    });

    eventSource.addEventListener("close", () => {
      this.setState(MCPConnectionState.DISCONNECTED);
      if (this.config.enableLogging) {
        console.log("📡 SSE connection closed");
      }
    });

    eventSource.onmessage = (event) => {
      try {
        const data = event.data;
        if (typeof data === "string" && data.trim()) {
          this.handleSSEMessage(data);
        }
      } catch (error) {
        this.errorHandler.handleError(error, "HTTPMCPClient.handleSSEMessage", {
          message: data,
        });
      }
    };

    eventSource.addEventListener("error", (error) => {
      this.setState(MCPConnectionState.ERROR);
      this.errorHandler.handleError(
        new Error(`SSE connection error: ${error}`),
        "HTTPMCPClient.establishSSEConnection",
      );
    });

    eventSource.onclose = () => {
      this.setState(MCPConnectionState.DISCONNECTED);
      if (this.config.enableLogging) {
        console.log("📡 SSE connection closed");
      }
    };

    this.state.sseConnection = eventSource;
  }

  /**
   * Handle SSE message
   */
  private handleSSEMessage(data: string): void {
    try {
      // Check if it's a JSON-RPC response
      if (data.startsWith("{")) {
        const response = JSON.parse(data);
        this.handleJSONRPCResponse(response);
      } else if (data.startsWith("event: message")) {
        // Handle SSE events
        if (this.config.enableLogging) {
          console.log("📡 SSE Event:", data);
        }
      }
    } catch (error) {
      this.errorHandler.handleError(error, "HTTPMCPClient.handleSSEMessage", {
        message: data,
      });
    }
  }

  /**
   * Handle JSON-RPC response
   */
  private handleJSONRPCResponse(response: any): void {
    if (response.id && this.activeRequests.has(response.id)) {
      const controller = this.activeRequests.get(response.id);

      if (response.result) {
        // Handle successful response
        if (response.id === 1) {
          // Initialize response
          this.state.serverCapabilities = response.result;
          this.extractToolsAndResources(response.result);
        }

        // Clean up request
        this.activeRequests.delete(response.id);

        // Resolve promise if exists
        if (controller) {
          // This would need to be integrated with a promise system
          this.emitEvent(MCPClientEventType.TOOL_CALLED, {
            tool: response.method || "unknown",
            result: response.result,
          });
        }
      } else if (response.error) {
        // Handle error response
        this.errorHandler.handleError(
          new Error(response.error.message || "Unknown MCP error"),
          "HTTPMCPClient.handleJSONRPCResponse",
          {
            code: response.error.code,
            method: response.method,
          },
        );

        // Clean up request
        this.activeRequests.delete(response.id);
      }
    } else {
      // Handle notification (no ID)
      if (response.method) {
        this.emitEvent(MCPClientEventType.TOOL_CALLED, {
          tool: response.method,
          notification: response.params,
        });
      }
    }
  }

  /**
   * Extract tools and resources from capabilities
   */
  private extractToolsAndResources(capabilities: MCPCapabilities): void {
    if (capabilities.tools) {
      // Tools should be discovered via separate call
      if (this.config.enableLogging) {
        console.log("🔧 Server capabilities available");
      }
    }
  }

  /**
   * Send JSON-RPC request via HTTP POST
   */
  private async sendRequest<T>(request: JSONRPCRequest): Promise<T> {
    const requestId = request.id.toString();
    const controller = new AbortController();
    this.activeRequests.set(requestId, controller);

    const timeout = request.timeout || this.config.requestTimeout || 30000;

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.activeRequests.delete(requestId);
      this.errorHandler.handleError(
        new Error(`Request timeout after ${timeout}ms`),
        "HTTPMCPClient.sendRequest",
      );
    }, timeout);

    try {
      const response = await fetch(this.config.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.config.headers?.Authorization || "",
          ...this.config.headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.text();

      if (!responseData) {
        throw new Error("Empty response from server");
      }

      try {
        const parsed = JSON.parse(responseData);
        this.handleJSONRPCResponse(parsed);
        return parsed.result as T;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  // ============================================================================
  // MCP PROTOCOL METHODS
  // ============================================================================

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    if (this.state.connectionState !== MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }

    const result = await this.sendRequest<{ tools: MCPTool[] }>({
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "tools/list",
      params: {},
    });

    if (result && result.tools) {
      this.state.availableTools.clear();
      result.tools.forEach((tool) => {
        this.state.availableTools.set(tool.name, tool);
      });
    }

    return result.tools || [];
  }

  /**
   * Call a specific tool
   */
  async callTool(name: string, args: any = {}): Promise<MCPToolResult> {
    if (this.state.connectionState !== MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }

    this.emitEvent(MCPClientEventType.TOOL_CALLED, {
      tool: name,
      args,
    });

    return this.sendRequest<MCPToolResult>({
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: `tools/call`,
      params: {
        name,
        arguments: args,
      },
    });
  }

  /**
   * List available resources
   */
  async listResources(): Promise<MCPResource[]> {
    if (this.state.connectionState !== MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }

    const result = await this.sendRequest<{ resources: MCPResource[] }>({
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "resources/list",
      params: {},
    });

    if (result && result.resources) {
      this.state.availableResources.clear();
      result.resources.forEach((resource) => {
        this.state.availableResources.set(resource.uri, resource);
      });
    }

    return result.resources || [];
  }

  /**
   * Read resource content
   */
  async readResource(uri: string): Promise<MCPResourceContent> {
    if (this.state.connectionState !== MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }

    return this.sendRequest<MCPResourceContent>({
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "resources/read",
      params: { uri },
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Set connection state
   */
  private setState(connectionState: MCPConnectionState): void {
    const oldState = this.state.connectionState;
    this.state.connectionState = connectionState;

    this.emitEvent(MCPClientEventType.CONNECTION_STATE_CHANGED, {
      oldState,
      newState: connectionState,
    });
  }

  /**
   * Get connection state
   */
  getConnectionState(): MCPConnectionState {
    return this.state.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.connectionState === MCPConnectionState.CONNECTED;
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.state.connectionState === MCPConnectionState.DISCONNECTED) {
      return;
    }

    // Close SSE connection
    if (this.state.sseConnection) {
      this.state.sseConnection.close();
      this.state.sseConnection = undefined;
    }

    // Abort all active requests
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();

    this.setState(MCPConnectionState.DISCONNECTED);

    if (this.config.enableLogging) {
      console.log("🔌 Disconnected from MCP server");
    }
  }

  /**
   * Get client status
   */
  getStatus(): MCPClientStatus {
    return {
      state: this.state.connectionState,
      connectionAttempts: 1, // HTTP doesn't track attempts like WebSocket
      activeRequests: this.activeRequests.size,
    };
  }

  /**
   * Get client metrics
   */
  getMetrics() {
    return {
      totalRequests: this.requestId,
      successfulRequests: this.state.serverCapabilities ? 1 : 0,
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
   * Perform health check
   */
  async performHealthCheck(): Promise<MCPOperationResult> {
    try {
      const isConnected = this.isConnected();
      const hasCapabilities = !!this.state.serverCapabilities;

      return {
        success: true,
        data: {
          timestamp: new Date(),
          connectionState: this.state.connectionState,
          connected: isConnected,
          hasCapabilities,
          availableTools: this.state.availableTools.size,
          availableResources: this.state.availableResources.size,
          url: this.config.serverUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Perform diagnostics
   */
  async performDiagnostics(): Promise<MCPOperationResult> {
    try {
      return {
        success: true,
        data: {
          timestamp: new Date(),
          config: this.config,
          state: this.state,
          supportedFeatures: ["HTTP", "SSE", "JSON-RPC-2.0"],
          recommendations: this.getDiagnosticsRecommendations(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get diagnostics recommendations
   */
  private getDiagnosticsRecommendations(): string[] {
    const recommendations = [];

    if (!this.config.serverUrl.startsWith("https://api.githubcopilot.com/")) {
      recommendations.push("Consider using official GitHub MCP server URL");
    }

    if (!this.config.headers || !this.config.headers.Authorization) {
      recommendations.push("Add Authorization header with Bearer token");
    }

    if (this.state.connectionState === MCPConnectionState.DISCONNECTED) {
      recommendations.push("Client is disconnected - call connect() method");
    }

    return recommendations;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy client and cleanup resources
   */
  async destroy(): Promise<void> {
    await this.disconnect();

    // Clear all data
    this.state.availableTools.clear();
    this.state.availableResources.clear();
    this.state.availablePrompts.clear();
    this.eventListeners.clear();

    if (this.config.enableLogging) {
      console.log("🗑️ HTTP MCP Client destroyed");
    }
  }
}
