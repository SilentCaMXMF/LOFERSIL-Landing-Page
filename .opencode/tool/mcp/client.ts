/**
 * MCP Client Implementation
 *
 * Handles WebSocket/SSE connections to MCP servers with JSON-RPC 2.0 protocol.
 */

import type { MCPMessage, MCPError } from './types.js';
import { MCPClientConfig, MCPConnectionState } from './types.js';

export class MCPClient {
  private config: MCPClientConfig;
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private connectionState: MCPConnectionState = MCPConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private messageHandlers: Map<string, (message: MCPMessage) => void> = new Map();
  private pendingRequests: Map<
    string | number,
    {
      resolve: (value: any) => void;
      reject: (error: MCPError) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();

  constructor(config: MCPClientConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  private maskHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      masked[key] =
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth')
          ? `${value.substring(0, 4)}****`
          : value;
    }
    return masked;
  }

  async connect(): Promise<void> {
    if (this.connectionState === MCPConnectionState.CONNECTED) {
      return;
    }

    this.connectionState = MCPConnectionState.CONNECTING;

    try {
      if (this.config.headers) {
        // Use HTTP-based connection with headers
        await this.connectHTTP();
      } else {
        // Try WebSocket first, fallback to SSE
        await this.connectWebSocket();
      }
    } catch (error) {
      if (!this.config.headers) {
        console.warn('WebSocket connection failed, trying SSE:', error);
        try {
          await this.connectSSE();
        } catch (sseError) {
          this.connectionState = MCPConnectionState.ERROR;
          throw new Error(`Failed to connect to MCP server: ${sseError}`);
        }
      } else {
        this.connectionState = MCPConnectionState.ERROR;
        throw new Error(`Failed to connect to MCP server: ${error}`);
      }
    }
  }

  private async connectWebSocket(): Promise<void> {
    // If headers are present, perform HTTP initialization first for authentication
    if (this.config.headers) {
      try {
        const initMessage = {
          jsonrpc: '2.0',
          id: 'init',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'mcp-client',
              version: '1.0.0',
            },
          },
        };

        console.log(
          'Initializing MCP WebSocket connection with headers:',
          this.maskHeaders(this.config.headers)
        );

        const response = await fetch(this.config.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify(initMessage),
          signal: AbortSignal.timeout(this.config.timeout || 10000),
        });

        if (!response.ok) {
          throw new Error(
            `WebSocket initialization failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(`MCP WebSocket initialization error: ${result.error.message}`);
        }

        console.log('MCP WebSocket initialized successfully');
      } catch (error) {
        throw new Error(`WebSocket initialization failed: ${error}`);
      }
    }

    return new Promise((resolve, reject) => {
      const wsUrl = this.config.serverUrl.replace(/^http/, 'ws');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connectionState = MCPConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        console.log('MCP WebSocket connected');
        resolve();
      };

      this.ws.onmessage = event => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse MCP message:', error);
        }
      };

      this.ws.onclose = () => {
        this.connectionState = MCPConnectionState.DISCONNECTED;
        console.log('MCP WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = error => {
        console.error('MCP WebSocket error:', error);
        reject(error);
      };

      // Timeout after config timeout or 10 seconds
      setTimeout(() => {
        if (this.connectionState !== MCPConnectionState.CONNECTED) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, this.config.timeout || 10000);
    });
  }

  private async connectSSE(): Promise<void> {
    // If headers are present, perform HTTP initialization first
    if (this.config.headers) {
      try {
        const initMessage = {
          jsonrpc: '2.0',
          id: 'init',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'mcp-client',
              version: '1.0.0',
            },
          },
        };

        console.log(
          'Initializing MCP SSE connection with headers:',
          this.maskHeaders(this.config.headers)
        );

        const response = await fetch(this.config.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify(initMessage),
          signal: AbortSignal.timeout(this.config.timeout || 10000),
        });

        if (!response.ok) {
          throw new Error(`SSE initialization failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(`MCP SSE initialization error: ${result.error.message}`);
        }

        console.log('MCP SSE initialized successfully');
      } catch (error) {
        throw new Error(`SSE initialization failed: ${error}`);
      }
    }

    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.config.serverUrl);

      this.eventSource.onopen = () => {
        this.connectionState = MCPConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        console.log('MCP SSE connected');
        resolve();
      };

      this.eventSource.onmessage = event => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse MCP message:', error);
        }
      };

      this.eventSource.onerror = error => {
        this.connectionState = MCPConnectionState.ERROR;
        console.error('MCP SSE error:', error);
        reject(error);
      };

      // Timeout after config timeout or 10 seconds
      setTimeout(() => {
        if (this.connectionState !== MCPConnectionState.CONNECTED) {
          reject(new Error('SSE connection timeout'));
        }
      }, this.config.timeout || 10000);
    });
  }

  private async connectHTTP(): Promise<void> {
    // For HTTP-based MCP, perform initialization with headers
    try {
      const initMessage = {
        jsonrpc: '2.0',
        id: 'init',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'mcp-client',
            version: '1.0.0',
          },
        },
      };

      console.log(
        'Initializing MCP connection with headers:',
        this.maskHeaders(this.config.headers)
      );

      const response = await fetch(this.config.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(initMessage),
        signal: AbortSignal.timeout(this.config.timeout || 10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP initialization failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(`MCP initialization error: ${result.error.message}`);
      }

      this.connectionState = MCPConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log('MCP HTTP initialized successfully');
    } catch (error) {
      this.connectionState = MCPConnectionState.ERROR;
      throw error;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.connectionState = MCPConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`
      );
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval || 5000);
  }

  async disconnect(): Promise<void> {
    this.connectionState = MCPConnectionState.DISCONNECTED;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Clear pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject({
        code: -32000,
        message: 'Connection closed',
      });
    }
    this.pendingRequests.clear();
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    if (this.connectionState !== MCPConnectionState.CONNECTED) {
      throw new Error('MCP client is not connected');
    }

    const id = Math.random().toString(36).substring(7);
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    if (this.config.headers) {
      // Use HTTP POST for requests when headers are required
      try {
        const response = await fetch(this.config.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify(message),
          signal: AbortSignal.timeout(this.config.timeout || 30000),
        });

        if (!response.ok) {
          throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (result.error) {
          throw result.error;
        }
        return result.result;
      } catch (error) {
        throw {
          code: -32002,
          message: 'HTTP request failed',
          data: error,
        };
      }
    } else {
      // Use WebSocket or SSE for requests
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(id);
          reject({
            code: -32001,
            message: 'Request timeout',
          });
        }, this.config.timeout || 30000);

        this.pendingRequests.set(id, { resolve, reject, timeout });

        const messageStr = JSON.stringify(message);
        if (this.ws) {
          this.ws.send(messageStr);
        } else if (this.eventSource) {
          // For SSE, we might need to use a different approach
          // This is a simplified implementation
          console.warn('SSE request sending not fully implemented');
        }
      });
    }
  }

  private handleMessage(message: MCPMessage): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!;
      clearTimeout(request.timeout);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        request.reject(message.error);
      } else {
        request.resolve(message.result);
      }
    }

    // Handle notifications and other messages
    if (message.method && this.messageHandlers.has(message.method)) {
      this.messageHandlers.get(message.method)!(message);
    }
  }

  on(method: string, handler: (message: MCPMessage) => void): void {
    this.messageHandlers.set(method, handler);
  }

  off(method: string): void {
    this.messageHandlers.delete(method);
  }

  getConnectionState(): MCPConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === MCPConnectionState.CONNECTED;
  }
}
