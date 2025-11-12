/**
 * MCP (Model Context Protocol) Tool
 *
 * This module provides integration with Model Context Protocol servers,
 * enabling communication with MCP-compatible AI assistants and tools.
 */
import { loadConfig, validateConfig, substituteEnvVars } from './config-loader.js';
export { MCPClient } from './client.js';
export { GeminiMCPClient } from './gemini-client.js';
export { MCPServer } from './server.js';
export { MCPTools } from './tools.js';
export { MCPResources } from './resources.js';
export { MCPLogger, LogLevel } from './logger.js';
export { MCPHealthMonitor } from './health-monitor.js';
// Main MCP instance for easy access
import { MCPClient } from './client.js';
import { GeminiMCPClient } from './gemini-client.js';
import { MCPTools } from './tools.js';
import { MCPResources } from './resources.js';
import { MCPHealthMonitor } from './health-monitor.js';
export class MCP {
    client;
    tools;
    resources;
    healthMonitor;
    constructor(configOrClient) {
        if (configOrClient instanceof MCPClient) {
            this.client = configOrClient;
        }
        else {
            this.client = new MCPClient(configOrClient);
        }
        this.tools = new MCPTools(this.client);
        this.resources = new MCPResources(this.client);
        this.healthMonitor = new MCPHealthMonitor(this.client);
    }
    async connect() {
        await this.client.connect();
        // Start health monitoring automatically
        this.healthMonitor.startMonitoring();
    }
    async disconnect() {
        // Stop health monitoring
        this.healthMonitor.stopMonitoring();
        await this.client.disconnect();
    }
    getTools() {
        return this.tools;
    }
    getResources() {
        return this.resources;
    }
    getClient() {
        return this.client;
    }
    getHealthMonitor() {
        return this.healthMonitor;
    }
}
/**
 * Factory class for creating MCP instances from configuration files
 */
export class MCPFactory {
    static configCache = new Map();
    /**
     * Creates MCP instances from a configuration file
     * @param configPath Path to the JSON configuration file
     * @returns Array of MCP instances
     */
    static async createFromConfig(configPath) {
        const config = await this.loadConfig(configPath);
        return this.createFromConfigObject(config);
    }
    /**
     * Creates MCP instances from a configuration object
     * @param config The MCP configuration object
     * @returns Array of MCP instances
     */
    static async createFromConfigObject(config) {
        const mcps = [];
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
    static async createContext7() {
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
     * Creates an MCP instance specifically for Gemini
     * @returns MCP instance configured for Gemini
     */
    static async createGemini() {
        const serverUrl = process.env.GEMINI_MCP_URL || 'https://generativelanguage.googleapis.com/v1beta';
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
     * Loads and caches configuration from file
     * @param configPath Path to the configuration file
     * @returns Parsed and validated configuration
     */
    static async loadConfig(configPath) {
        if (this.configCache.has(configPath)) {
            return this.configCache.get(configPath);
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
    static resolveClientConfig(serverConfig) {
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
