/**
 * MCP Client Factory - Factory for creating MCP clients
 * Supports multiple MCP providers including Cloudflare Workers AI
 */

import { envLoader } from './EnvironmentLoader.js';

export interface MCPClientConfig {
  name: string;
  type: 'remote' | 'local';
  url: string;
  headers: Record<string, string>;
  enabled: boolean;
  timeout: number;
  retry: {
    maxAttempts: number;
    interval: number;
  };
  accountId?: string;
  models?: Record<string, string>;
}

export interface MCPClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getTools(): MCPTools;
  getResources(): MCPResources;
}

export interface MCPTools {
  listTools(): Promise<Tool[]>;
  executeTool(name: string, params: any): Promise<any>;
}

export interface MCPResources {
  listResources(): Promise<Resource[]>;
  readResource(uri: string): Promise<any>;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Cloudflare Workers AI MCP Client
 */
class CloudflareMCPClient implements MCPClient {
  private config: MCPClientConfig;
  private connected = false;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Cloudflare MCP client is disabled');
    }

    // Validate required environment variables
    const token = envLoader.get('CLOUDFLARE_API_TOKEN');
    const accountId = envLoader.get('CLOUDFLARE_ACCOUNT_ID');

    if (!token || !accountId) {
      throw new Error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');
    }

    // Basic connectivity check
    try {
      const response = await fetch(`${this.config.url}/${accountId}/ai/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to Cloudflare Workers AI: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getTools(): MCPTools {
    return new CloudflareTools(this.config);
  }

  getResources(): MCPResources {
    return new CloudflareResources(this.config);
  }
}

/**
 * Cloudflare Tools implementation
 */
class CloudflareTools implements MCPTools {
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  async listTools(): Promise<Tool[]> {
    const token = envLoader.get('CLOUDFLARE_API_TOKEN');
    const accountId = envLoader.get('CLOUDFLARE_ACCOUNT_ID');

    if (!token || !accountId) {
      throw new Error('Cloudflare credentials not available');
    }

    // Cloudflare Workers AI tools
    return [
      {
        name: 'text_generation',
        description: 'Generate text using Cloudflare Workers AI models',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', enum: ['@cf/meta/llama-3.1-8b-instruct'] },
            prompt: { type: 'string' },
            max_tokens: { type: 'number', default: 1000 },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'image_generation',
        description: 'Generate images using Cloudflare Workers AI',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', enum: ['@cf/blackforestlabs/flux-1-schnell'] },
            prompt: { type: 'string' },
            width: { type: 'number', default: 1024 },
            height: { type: 'number', default: 1024 },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'text_embedding',
        description: 'Generate text embeddings using Cloudflare Workers AI',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', enum: ['@cf/baai/bge-large-en-v1.5'] },
            text: { type: 'string' },
          },
          required: ['text'],
        },
      },
    ];
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    const token = envLoader.get('CLOUDFLARE_API_TOKEN');
    const accountId = envLoader.get('CLOUDFLARE_ACCOUNT_ID');

    if (!token || !accountId) {
      throw new Error('Cloudflare credentials not available');
    }

    let model: string;
    let requestBody: any;

    switch (toolName) {
      case 'text_generation':
        model = parameters.model || '@cf/meta/llama-3.1-8b-instruct';
        requestBody = {
          messages: [{ role: 'user', content: parameters.prompt }],
          max_tokens: parameters.max_tokens || 1000,
        };
        break;

      case 'image_generation':
        model = parameters.model || '@cf/blackforestlabs/flux-1-schnell';
        requestBody = {
          prompt: parameters.prompt,
          width: parameters.width || 1024,
          height: parameters.height || 1024,
        };
        break;

      case 'text_embedding':
        model = parameters.model || '@cf/baai/bge-large-en-v1.5';
        requestBody = {
          text: parameters.text,
        };
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    const url = `${this.config.url}/${accountId}/ai/run/${model}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Tool execution failed: ${error}`);
    }
  }
}

/**
 * Cloudflare Resources implementation
 */
class CloudflareResources implements MCPResources {
  constructor(private config: MCPClientConfig) {}

  async listResources(): Promise<Resource[]> {
    // Cloudflare Workers AI doesn't have traditional resources
    // Return model information as resources
    return [
      {
        uri: 'cloudflare://models/text',
        name: 'Text Generation Models',
        description: 'Available text generation models',
        mimeType: 'application/json',
      },
      {
        uri: 'cloudflare://models/image',
        name: 'Image Generation Models',
        description: 'Available image generation models',
        mimeType: 'application/json',
      },
      {
        uri: 'cloudflare://models/embedding',
        name: 'Embedding Models',
        description: 'Available embedding models',
        mimeType: 'application/json',
      },
    ];
  }

  async readResource(uri: string): Promise<any> {
    const token = envLoader.get('CLOUDFLARE_API_TOKEN');
    const accountId = envLoader.get('CLOUDFLARE_ACCOUNT_ID');

    if (!token || !accountId) {
      throw new Error('Cloudflare credentials not available');
    }

    if (uri === 'cloudflare://models/text') {
      return {
        models: ['@cf/meta/llama-3.1-8b-instruct'],
        description: 'Text generation models optimized for free tier usage',
      };
    }

    if (uri === 'cloudflare://models/image') {
      return {
        models: ['@cf/blackforestlabs/flux-1-schnell'],
        description: 'Image generation models with fast inference',
      };
    }

    if (uri === 'cloudflare://models/embedding') {
      return {
        models: ['@cf/baai/bge-large-en-v1.5'],
        description: 'High-quality text embedding models',
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  }
}

/**
 * MCP Factory for creating MCP clients
 */
export class MCPFactory {
  private static clients: Map<string, MCPClient> = new Map();

  /**
   * Create Cloudflare Workers AI MCP client
   */
  static async createCloudflare(config?: Partial<MCPClientConfig>): Promise<MCPClient> {
    const defaultConfig: MCPClientConfig = {
      name: 'cloudflare',
      type: 'remote',
      url: 'https://api.cloudflare.com/client/v4/accounts',
      headers: {
        Authorization: `Bearer ${envLoader.get('CLOUDFLARE_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      enabled: true,
      timeout: 30000,
      retry: {
        maxAttempts: 5,
        interval: 2000,
      },
      accountId: envLoader.get('CLOUDFLARE_ACCOUNT_ID'),
      models: {
        text: '@cf/meta/llama-3.1-8b-instruct',
        image: '@cf/blackforestlabs/flux-1-schnell',
        embedding: '@cf/baai/bge-large-en-v1.5',
      },
      ...config,
    };

    const client = new CloudflareMCPClient(defaultConfig);
    await client.connect();
    this.clients.set('cloudflare', client);
    return client;
  }

  /**
   * Get available MCP clients
   */
  static getAvailableClients(): string[] {
    return ['cloudflare', 'context7', 'gemini', 'local-dev'];
  }

  /**
   * Get MCP client by name
   */
  static getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  /**
   * Disconnect all clients
   */
  static async disconnectAll(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.disconnect();
    }
    this.clients.clear();
  }
}
