"use strict";
/**
 * MCP HTTP Client Implementation
 *
 * HTTP-based MCP client for GitHub MCP server compatibility.
 * Uses POST requests with JSON-RPC 2.0 protocol and handles Server-Sent Events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPMCPClient = void 0;
const types_1 = require("./types");
// ============================================================================
// HTTP MCP CLIENT CLASS
// ============================================================================
/**
 * HTTP-based MCP client for GitHub MCP server compatibility
 */
class HTTPMCPClient {
  constructor(config, errorHandler) {
    this.eventListeners = new Map();
    this.requestId = 0;
    this.activeRequests = new Map();
    // Validate configuration
    const validation = (0, types_1.validateMCPClientConfig)(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid MCP HTTP client config: ${validation.errors.join(", ")}`,
      );
    }
    this.config = config;
    this.errorHandler = errorHandler;
    // Initialize client state
    this.state = {
      connectionState: types_1.MCPConnectionState.DISCONNECTED,
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
  async sendRequest(request) {
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
          Accept: "application/json, text/event-stream",
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
        return parsed.result;
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
  setupEventHandlers() {
    // Default event listeners
    this.eventListeners.set(
      types_1.MCPClientEventType.CONNECTION_STATE_CHANGED,
      new Set(),
    );
    this.eventListeners.set(types_1.MCPClientEventType.TOOL_CALLED, new Set());
    this.eventListeners.set(
      types_1.MCPClientEventType.RESOURCE_ACCESSED,
      new Set(),
    );
    this.eventListeners.set(
      types_1.MCPClientEventType.PROMPT_GENERATED,
      new Set(),
    );
    this.eventListeners.set(
      types_1.MCPClientEventType.ERROR_OCCURRED,
      new Set(),
    );
  }
  /**
   * Add event listener
   */
  addEventListener(eventType, handler) {
    const listeners = this.eventListeners.get(eventType) || new Set();
    listeners.add(handler);
    this.eventListeners.set(eventType, listeners);
  }
  /**
   * Remove event listener
   */
  removeEventListener(eventType, handler) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler);
    }
  }
  /**
   * Emit event to listeners
   */
  emitEvent(eventType, data) {
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
  async connect() {
    if (this.state.connectionState === types_1.MCPConnectionState.CONNECTED) {
      return;
    }
    if (this.state.connectionState === types_1.MCPConnectionState.CONNECTING) {
      throw new Error("Connection already in progress");
    }
    try {
      this.setState(types_1.MCPConnectionState.CONNECTING);
      // Initialize the connection with POST request
      await this.initializeConnection();
      // Establish SSE connection for streaming responses
      await this.establishSSEConnection();
      this.setState(types_1.MCPConnectionState.CONNECTED);
      this.errorHandler.recordSuccess("HTTPMCPClient");
      if (this.config.enableLogging) {
        console.log("✅ Connected to MCP server via HTTP + SSE");
      }
    } catch (error) {
      this.setState(types_1.MCPConnectionState.ERROR);
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
  async initializeConnection() {
    const initRequest = {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "initialize",
      params: {
        protocolVersion: types_1.MCP_VERSION,
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
  async establishSSEConnection() {
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
          message: event.data,
        });
      }
    });
    eventSource.addEventListener("error", (error) => {
      this.setState(types_1.MCPConnectionState.ERROR);
      this.errorHandler.handleError(
        new Error(`SSE connection error: ${error}`),
        "HTTPMCPClient.establishSSEConnection",
      );
    });
    eventSource.addEventListener("close", () => {
      this.setState(types_1.MCPConnectionState.DISCONNECTED);
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
          message: event.data,
        });
      }
    };
    this.state.sseConnection = eventSource;
  }
  /**
   * Handle SSE message
   */
  handleSSEMessage(data) {
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
  handleJSONRPCResponse(response) {
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
          this.emitEvent(types_1.MCPClientEventType.TOOL_CALLED, {
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
        this.emitEvent(types_1.MCPClientEventType.TOOL_CALLED, {
          tool: response.method,
          notification: response.params,
        });
      }
    }
  }
  /**
   * Extract tools and resources from capabilities
   */
  extractToolsAndResources(capabilities) {
    if (capabilities.tools) {
      // Tools should be discovered via separate call
      if (this.config.enableLogging) {
        console.log("🔧 Server capabilities available");
      }
    }
  }

  // ============================================================================
  // MCP PROTOCOL METHODS
  // ============================================================================
  /**
   * List available tools
   */
  async listTools() {
    if (this.state.connectionState !== types_1.MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }
    const result = await this.sendRequest({
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
  async callTool(name, args = {}) {
    if (this.state.connectionState !== types_1.MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }
    this.emitEvent(types_1.MCPClientEventType.TOOL_CALLED, {
      tool: name,
      args,
    });
    return this.sendRequest({
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
  async listResources() {
    if (this.state.connectionState !== types_1.MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }
    const result = await this.sendRequest({
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
  async readResource(uri) {
    if (this.state.connectionState !== types_1.MCPConnectionState.CONNECTED) {
      throw new Error("Not connected to MCP server");
    }
    return this.sendRequest({
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
  setState(connectionState) {
    const oldState = this.state.connectionState;
    this.state.connectionState = connectionState;
    this.emitEvent(types_1.MCPClientEventType.CONNECTION_STATE_CHANGED, {
      oldState,
      newState: connectionState,
    });
  }
  /**
   * Get connection state
   */
  getConnectionState() {
    return this.state.connectionState;
  }
  /**
   * Check if connected
   */
  isConnected() {
    return this.state.connectionState === types_1.MCPConnectionState.CONNECTED;
  }
  /**
   * Disconnect from MCP server
   */
  async disconnect() {
    if (
      this.state.connectionState === types_1.MCPConnectionState.DISCONNECTED
    ) {
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
    this.setState(types_1.MCPConnectionState.DISCONNECTED);
    if (this.config.enableLogging) {
      console.log("🔌 Disconnected from MCP server");
    }
  }
  /**
   * Get client status
   */
  getStatus() {
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
  async performHealthCheck() {
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
  async performDiagnostics() {
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
  getDiagnosticsRecommendations() {
    const recommendations = [];
    if (!this.config.serverUrl.startsWith("https://api.githubcopilot.com/")) {
      recommendations.push("Consider using official GitHub MCP server URL");
    }
    if (!this.config.headers || !this.config.headers.Authorization) {
      recommendations.push("Add Authorization header with Bearer token");
    }
    if (
      this.state.connectionState === types_1.MCPConnectionState.DISCONNECTED
    ) {
      recommendations.push("Client is disconnected - call connect() method");
    }
    return recommendations;
  }
  /**
   * Generate session ID
   */
  generateSessionId() {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Destroy client and cleanup resources
   */
  async destroy() {
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
exports.HTTPMCPClient = HTTPMCPClient;
