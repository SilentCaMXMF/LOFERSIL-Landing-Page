/**
 * MCP (Model Context Protocol) Tool
 *
 * This module provides integration with Model Context Protocol servers,
 * enabling communication with MCP-compatible AI assistants and tools.
 */

import { loadConfig, validateConfig, substituteEnvVars } from './config-loader.js';

export { MCPClient } from './client.js';
export { MCPServer } from './server.js';
export { MCPTools } from './tools.js';
export { MCPResources } from './resources.js';

// Re-export types
export type {
  MCPMessage,
  MCPTool,
  MCPResource,
  MCPClientConfig,
  MCPServerConfig,
  MCPConfig,
  MCPConfigFile,
} from './types.js';

// Main MCP instance for easy access
import { MCPClient } from './client.js';
import { MCPTools } from './tools.js';
import { MCPResources } from './resources.js';
import type { MCPClientConfig, MCPConfig, MCPConfigFile } from './types.js';

export class MCP {
  private client: MCPClient;
  private tools: MCPTools;
  private resources: MCPResources;

  constructor(config: MCPClientConfig) {
    this.client = new MCPClient(config);
    this.tools = new MCPTools(this.client);
    this.resources = new MCPResources(this.client);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  getTools(): MCPTools {
    return this.tools;
  }

  getResources(): MCPResources {
    return this.resources;
  }

  getClient(): MCPClient {
    return this.client;
  }
}

/**
 * Factory class for creating MCP instances from configuration files
 */
export class MCPFactory {
  private static configCache = new Map<string, MCPConfigFile>();

  /**
   * Creates MCP instances from a configuration file
   * @param configPath Path to the JSON configuration file
   * @returns Array of MCP instances
   */
  static async createFromConfig(configPath: string): Promise<MCP[]> {
    const config = await this.loadConfig(configPath);
    return this.createFromConfigObject(config);
  }

  /**
   * Creates MCP instances from a configuration object
   * @param config The MCP configuration object
   * @returns Array of MCP instances
   */
  static async createFromConfigObject(config: MCPConfigFile): Promise<MCP[]> {
    const mcps: MCP[] = [];

    for (const [name, serverConfig] of Object.entries(config.mcp)) {
      if (serverConfig.enabled) {
        const clientConfig = this.resolveClientConfig(serverConfig);
        const mcp = new MCP(clientConfig);
        mcps.push(mcp);
      }
    }

    return mcps;
  }

  /**
   * Creates an MCP instance specifically for Context7
   * @returns MCP instance configured for Context7
   */
  static async createContext7(): Promise<MCP> {
    const serverUrl = process.env.CONTEXT7_MCP_URL;
    const apiKey = process.env.CONTEXT7_API_KEY;
    const timeout = parseInt(process.env.CONTEXT7_API_TIMEOUT || '60000');

    if (!serverUrl || !apiKey) {
      throw new Error('CONTEXT7_MCP_URL and CONTEXT7_API_KEY environment variables must be set');
    }

    return new MCP({
      serverUrl,
      headers: {
        CONTEXT7_API_KEY: apiKey,
      },
      timeout,
    });
  }

  /**
   * Loads and caches configuration from file
   * @param configPath Path to the configuration file
   * @returns Parsed and validated configuration
   */
  private static async loadConfig(configPath: string): Promise<MCPConfigFile> {
    if (this.configCache.has(configPath)) {
      return this.configCache.get(configPath)!;
    }

    const rawConfig = loadConfig(configPath);
    const substitutedConfig = substituteEnvVars(rawConfig);
    const validation = validateConfig(substitutedConfig);

    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.configCache.set(configPath, substitutedConfig);
    return substitutedConfig;
  }

  /**
   * Converts server configuration to client configuration
   * @param serverConfig Server configuration from config file
   * @returns Client configuration for MCP constructor
   */
  private static resolveClientConfig(serverConfig: MCPConfig): MCPClientConfig {
    return {
      serverUrl: serverConfig.url,
      headers: serverConfig.headers,
      timeout: serverConfig.timeout,
      reconnectInterval: serverConfig.retry.interval,
      maxReconnectAttempts: serverConfig.retry.maxAttempts,
    };
  }
}

// Default export
export default MCP;
