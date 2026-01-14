/**
 * MCP Tools Management
 *
 * Handles tool discovery, validation, and execution through MCP protocol.
 */

import { MCPClient } from './client.js';
import { MCPLogger } from './logger.js';
import type { MCPTool, MCPToolCall, MCPToolResult } from './types.js';

export class MCPTools {
  private client: MCPClient;
  private logger = MCPLogger.getInstance();
  private cachedTools: MCPTool[] = [];
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(client: MCPClient) {
    this.client = client;
  }

  async listTools(forceRefresh: boolean = false): Promise<MCPTool[]> {
    if (!forceRefresh && this.isCacheValid()) {
      return this.cachedTools;
    }

    try {
      const response = await this.client.sendRequest('tools/list');
      this.cachedTools = response.tools || [];
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      return this.cachedTools;
    } catch (error) {
      this.logger.error('MCPTools', 'Failed to list MCP tools', error as Error);
      // Return cached tools if available, even if expired
      if (this.cachedTools.length > 0) {
        return this.cachedTools;
      }
      throw error;
    }
  }

  async callTool(
    name: string,
    parameters: Record<string, any> = {},
    options: {
      timeout?: number;
      onProgress?: (progress: { completed: number; total: number; message: string }) => void;
    } = {}
  ): Promise<any> {
    // Validate tool exists and parameters
    const tools = await this.listTools();
    const tool = tools.find(t => t.name === name);

    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    // Basic parameter validation
    this.validateParameters(tool, parameters);

    // Setup timeout if specified
    const timeoutPromise = options.timeout
      ? new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(new Error(`Tool '${name}' execution timed out after ${options.timeout}ms`)),
            options.timeout
          );
        })
      : null;

    // Progress tracking setup
    if (options.onProgress) {
      options.onProgress({
        completed: 0,
        total: 100,
        message: `Starting execution of tool '${name}'`,
      });
    }

    try {
      const executionPromise = this.client.sendRequest('tools/call', {
        name,
        arguments: parameters,
      });

      if (options.onProgress) {
        options.onProgress({ completed: 50, total: 100, message: `Executing tool '${name}'` });
      }

      const response = timeoutPromise
        ? await Promise.race([executionPromise, timeoutPromise])
        : await executionPromise;

      if (options.onProgress) {
        options.onProgress({
          completed: 100,
          total: 100,
          message: `Completed execution of tool '${name}'`,
        });
      }

      return response.content;
    } catch (error) {
      this.logger.error('MCPTools', `Failed to call tool '${name}'`, error as Error);
      if (options.onProgress) {
        options.onProgress({
          completed: 0,
          total: 100,
          message: `Failed execution of tool '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      throw error;
    }
  }

  async callTools(
    calls: MCPToolCall[],
    options: {
      timeout?: number;
      onProgress?: (progress: { completed: number; total: number; message: string }) => void;
    } = {}
  ): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = [];
    const totalCalls = calls.length;

    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];

      if (options.onProgress) {
        options.onProgress({
          completed: i,
          total: totalCalls,
          message: `Executing tool ${i + 1}/${totalCalls}: ${call.tool}`,
        });
      }

      try {
        const result = await this.callTool(call.tool, call.parameters, {
          timeout: options.timeout,
        });
        results.push({
          id: call.id,
          result,
        });
      } catch (error) {
        results.push({
          id: call.id,
          result: null,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : 'Tool execution failed',
          },
        });
      }
    }

    if (options.onProgress) {
      options.onProgress({
        completed: totalCalls,
        total: totalCalls,
        message: `Completed batch execution of ${totalCalls} tools`,
      });
    }

    return results;
  }

  /**
   * Execute a single tool (documented interface)
   * @param toolName Name of the tool to execute
   * @param parameters Tool parameters
   * @param options Additional options for timeout and progress tracking
   * @returns Tool execution result
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, any> = {},
    options: {
      timeout?: number;
      onProgress?: (progress: { completed: number; total: number; message: string }) => void;
    } = {}
  ): Promise<any> {
    return this.callTool(toolName, parameters, options);
  }

  private validateParameters(tool: MCPTool, parameters: Record<string, any>): void {
    const schema = tool.inputSchema;

    if (!schema || !schema.properties) {
      return; // No validation schema provided
    }

    const required = schema.required || [];

    // Check required parameters
    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    // Basic type checking for provided parameters
    for (const [param, value] of Object.entries(parameters)) {
      const paramSchema = schema.properties[param];
      if (!paramSchema) {
        this.logger.warn('MCPTools', `Unknown parameter: ${param}`);
        continue;
      }

      // Simple type validation
      if (paramSchema.type) {
        if (paramSchema.type === 'integer' && typeof value === 'number') {
          // JavaScript numbers are fine for integer types, just check if they're integers
          if (!Number.isInteger(value)) {
            throw new Error(`Parameter '${param}' should be an integer, got ${value}`);
          }
        } else if (typeof value !== paramSchema.type) {
          throw new Error(
            `Parameter '${param}' should be of type ${paramSchema.type}, got ${typeof value}`
          );
        }
      }
    }
  }

  private isCacheValid(): boolean {
    return this.cacheExpiry > Date.now();
  }

  clearCache(): void {
    this.cachedTools = [];
    this.cacheExpiry = 0;
  }

  getCachedTools(): MCPTool[] {
    return this.cachedTools;
  }

  // Utility methods for common tool operations
  async findToolByName(name: string): Promise<MCPTool | null> {
    const tools = await this.listTools();
    return tools.find(t => t.name === name) || null;
  }

  async getToolNames(): Promise<string[]> {
    const tools = await this.listTools();
    return tools.map(t => t.name);
  }

  async getToolsByPattern(pattern: RegExp): Promise<MCPTool[]> {
    const tools = await this.listTools();
    return tools.filter(t => pattern.test(t.name) || pattern.test(t.description));
  }
}
