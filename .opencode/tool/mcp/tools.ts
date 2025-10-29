/**
 * MCP Tools Management
 *
 * Handles tool discovery, validation, and execution through MCP protocol.
 */

import { MCPClient } from './client.js';
import type { MCPTool, MCPToolCall, MCPToolResult } from './types.js';

export class MCPTools {
  private client: MCPClient;
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
      console.error('Failed to list MCP tools:', error);
      // Return cached tools if available, even if expired
      if (this.cachedTools.length > 0) {
        return this.cachedTools;
      }
      throw error;
    }
  }

  async callTool(name: string, parameters: Record<string, any> = {}): Promise<any> {
    // Validate tool exists and parameters
    const tools = await this.listTools();
    const tool = tools.find(t => t.name === name);

    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    // Basic parameter validation
    this.validateParameters(tool, parameters);

    try {
      const response = await this.client.sendRequest('tools/call', {
        name,
        arguments: parameters,
      });

      return response.content;
    } catch (error) {
      console.error(`Failed to call tool '${name}':`, error);
      throw error;
    }
  }

  async callTools(calls: MCPToolCall[]): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = [];

    for (const call of calls) {
      try {
        const result = await this.callTool(call.tool, call.parameters);
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

    return results;
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
        console.warn(`Unknown parameter: ${param}`);
        continue;
      }

      // Simple type validation
      if (paramSchema.type && typeof value !== paramSchema.type) {
        throw new Error(
          `Parameter '${param}' should be of type ${paramSchema.type}, got ${typeof value}`
        );
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
