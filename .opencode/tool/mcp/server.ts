/**
 * MCP Server Implementation
 *
 * Provides MCP server functionality for handling client connections and tool execution.
 */

import type { MCPMessage, MCPServerConfig, MCPTool, MCPResource, MCPError } from './types.js';

export class MCPServer {
  private config: MCPServerConfig;
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private connections: Set<WebSocket> = new Set();
  private httpServer: any = null; // Would be a real HTTP server in production

  constructor(config: MCPServerConfig = {}) {
    this.config = {
      port: 3000,
      host: 'localhost',
      tools: [],
      resources: [],
      ...config,
    };

    // Register default tools and resources
    this.registerDefaultTools();
    this.registerDefaultResources();
  }

  private registerDefaultTools(): void {
    // Tool for listing available tools
    this.registerTool({
      name: 'list_tools',
      description: 'List all available MCP tools',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    });

    // Tool for listing available resources
    this.registerTool({
      name: 'list_resources',
      description: 'List all available MCP resources',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    });

    // Tool for reading resources
    this.registerTool({
      name: 'read_resource',
      description: 'Read the content of a specific resource',
      inputSchema: {
        type: 'object',
        properties: {
          uri: {
            type: 'string',
            description: 'The URI of the resource to read',
          },
        },
        required: ['uri'],
      },
    });
  }

  private registerDefaultResources(): void {
    // Add some default resources
    this.registerResource({
      uri: 'mcp://system/info',
      name: 'System Information',
      description: 'Basic system information and capabilities',
      mimeType: 'application/json',
    });
  }

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
  }

  unregisterResource(uri: string): void {
    this.resources.delete(uri);
  }

  async start(): Promise<void> {
    // In a real implementation, this would start an HTTP/WebSocket server
    // For now, this is a placeholder
    console.log(`MCP Server starting on ${this.config.host}:${this.config.port}`);

    // Simulate server startup
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('MCP Server started successfully');
        resolve();
      }, 100);
    });
  }

  async stop(): Promise<void> {
    console.log('MCP Server stopping');

    // Close all connections
    for (const connection of this.connections) {
      connection.close();
    }
    this.connections.clear();

    // Stop HTTP server if it exists
    if (this.httpServer) {
      // this.httpServer.close();
      this.httpServer = null;
    }

    console.log('MCP Server stopped');
  }

  async handleMessage(connection: WebSocket, message: MCPMessage): Promise<void> {
    try {
      let response: MCPMessage;

      switch (message.method) {
        case 'initialize':
          response = await this.handleInitialize(message);
          break;

        case 'tools/list':
          response = await this.handleListTools(message);
          break;

        case 'tools/call':
          response = await this.handleToolCall(message);
          break;

        case 'resources/list':
          response = await this.handleListResources(message);
          break;

        case 'resources/read':
          response = await this.handleReadResource(message);
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Method '${message.method}' not found`,
            },
          };
      }

      connection.send(JSON.stringify(response));
    } catch (error) {
      const errorResponse: MCPMessage = {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      };
      connection.send(JSON.stringify(errorResponse));
    }
  }

  private async handleInitialize(message: MCPMessage): Promise<MCPMessage> {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: { listChanged: true },
        },
        serverInfo: {
          name: 'OpenCode MCP Server',
          version: '1.0.0',
        },
      },
    };
  }

  private async handleListTools(message: MCPMessage): Promise<MCPMessage> {
    const tools = Array.from(this.tools.values());
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { tools },
    };
  }

  private async handleToolCall(message: MCPMessage): Promise<MCPMessage> {
    const { name, arguments: args } = message.params || {};

    if (!name || !this.tools.has(name)) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: `Tool '${name}' not found`,
        },
      };
    }

    try {
      const result = await this.executeTool(name, args || {});
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: { content: result },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Tool execution failed',
        },
      };
    }
  }

  private async handleListResources(message: MCPMessage): Promise<MCPMessage> {
    const resources = Array.from(this.resources.values());
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { resources },
    };
  }

  private async handleReadResource(message: MCPMessage): Promise<MCPMessage> {
    const { uri } = message.params || {};

    if (!uri || !this.resources.has(uri)) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: `Resource '${uri}' not found`,
        },
      };
    }

    try {
      const content = await this.readResource(uri);
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: { contents: [content] },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Resource read failed',
        },
      };
    }
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'list_tools':
        return { tools: Array.from(this.tools.values()) };

      case 'list_resources':
        return { resources: Array.from(this.resources.values()) };

      case 'read_resource':
        return await this.readResource(args.uri);

      default:
        throw new Error(`Tool '${name}' not implemented`);
    }
  }

  private async readResource(uri: string): Promise<any> {
    switch (uri) {
      case 'mcp://system/info':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              server: 'OpenCode MCP Server',
              version: '1.0.0',
              tools: this.tools.size,
              resources: this.resources.size,
              connections: this.connections.size,
            },
            null,
            2
          ),
        };

      default:
        throw new Error(`Resource '${uri}' not found`);
    }
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }
}
