/**
 * MCP (Model Context Protocol) Tool
 *
 * This module provides integration with Model Context Protocol servers,
 * enabling communication with MCP-compatible AI assistants and tools.
 */

import { loadConfig, validateConfig, substituteEnvVars } from './config-loader.js';

export { MCPClient } from './client.js';
export { GeminiMCPClient } from './gemini-client.js';
export {
  CloudflareWorkersAIMCPClient,
  createCloudflareWorkersAIClient,
} from './cloudflare-client.js';
export { MCPServer } from './server.js';
export { MCPTools } from './tools.js';
export { MCPResources } from './resources.js';
export { MCPLogger, LogLevel } from './logger.js';
export { MCPHealthMonitor, HealthMetrics } from './health-monitor.js';

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
import { GeminiMCPClient } from './gemini-client.js';
import { CloudflareWorkersAIMCPClient } from './cloudflare-client.js';
import { MCPTools } from './tools.js';
import { MCPResources } from './resources.js';
import { MCPHealthMonitor } from './health-monitor.js';
import type { MCPClientConfig, MCPConfig, MCPConfigFile } from './types.js';

export class MCP {
  private client: MCPClient;
  private tools: MCPTools;
  private resources: MCPResources;
  private healthMonitor: MCPHealthMonitor;

  constructor(configOrClient: MCPClientConfig | MCPClient) {
    if (configOrClient instanceof MCPClient) {
      this.client = configOrClient;
    } else {
      this.client = new MCPClient(configOrClient);
    }
    this.tools = new MCPTools(this.client);
    this.resources = new MCPResources(this.client);
    this.healthMonitor = new MCPHealthMonitor(this.client);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    // Start health monitoring automatically
    this.healthMonitor.startMonitoring();
  }

  async disconnect(): Promise<void> {
    // Stop health monitoring
    this.healthMonitor.stopMonitoring();
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

  getHealthMonitor(): MCPHealthMonitor {
    return this.healthMonitor;
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
        Authorization: `Bearer ${apiKey}`,
      },
      timeout,
    });
  }

  /**
   * Creates an MCP instance specifically for Gemini
   * @returns MCP instance configured for Gemini
   */
  static async createGemini(): Promise<MCP> {
    const serverUrl =
      process.env.GEMINI_MCP_URL || 'https://generativelanguage.googleapis.com/v1beta';
    const apiKey = process.env.GEMINI_API_KEY;
    const timeout = parseInt(process.env.GEMINI_API_TIMEOUT || '60000');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable must be set');
    }

    // Use GeminiMCPClient for specialized Gemini functionality
    const geminiClient = new GeminiMCPClient({
      serverUrl,
      headers: {
        GEMINI_API_KEY: apiKey,
      },
      timeout,
      geminiApiKey: apiKey,
    });

    return new MCP(geminiClient);
  }

  /**
   * Creates an MCP instance specifically for Cloudflare Workers AI
   * @returns MCP instance configured for Cloudflare Workers AI
   */
  static async createCloudflareWorkersAI(): Promise<MCP> {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const baseUrl = process.env.CLOUDFLARE_BASE_URL || 'https://api.cloudflare.com/client/v4';
    const timeout = parseInt(process.env.CLOUDFLARE_API_TIMEOUT || '60000');

    if (!apiToken) {
      throw new Error('CLOUDFLARE_API_TOKEN environment variable must be set');
    }
    if (!accountId) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable must be set');
    }

    // Use CloudflareWorkersAIMCPClient for specialized Cloudflare functionality
    const cloudflareClient = new CloudflareWorkersAIMCPClient({
      serverUrl: baseUrl,
      timeout,
      apiToken,
      accountId,
      baseUrl,
    });

    return new MCP(cloudflareClient);
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
