/**
 * MCP (Model Context Protocol) Type Definitions
 */

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * Configuration for MCP client connections
 * @example
 * ```typescript
 * const config: MCPClientConfig = {
 *   serverUrl: 'https://api.example.com/mcp',
 *   apiKey: 'your-api-key', // Optional when using headers
 *   headers: { 'Authorization': 'Bearer token' }, // NEW: Custom headers
 *   timeout: 5000 // NEW: Request timeout in milliseconds
 * };
 * ```
 */
export interface MCPClientConfig {
  serverUrl: string;
  apiKey?: string; // Made optional when using headers
  clientId?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  headers?: Record<string, string>; // NEW: Custom headers for authentication
  timeout?: number; // NEW: Request timeout in milliseconds
}

export interface MCPServerConfig {
  port?: number;
  host?: string;
  tools?: MCPTool[];
  resources?: MCPResource[];
}

export interface MCPToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
}

export interface MCPToolResult {
  id: string;
  result: any;
  error?: MCPError;
}

export enum MCPConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Configuration for an individual MCP server in the config file
 * @example
 * ```typescript
 * const context7Config: MCPConfig = {
 *   name: 'Context7 MCP Server',
 *   type: 'remote',
 *   url: 'https://mcp.context7.com/mcp',
 *   headers: { 'CONTEXT7_API_KEY': 'your-key' },
 *   enabled: true,
 *   timeout: 10000,
 *   retry: { maxAttempts: 3, interval: 1000 }
 * };
 * ```
 */
export interface MCPConfig {
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
}

/**
 * Root structure for MCP configuration file
 * @example
 * ```json
 * {
 *   "mcp": {
 *     "context7": {
 *       "name": "Context7 MCP Server",
 *       "type": "remote",
 *       "url": "https://mcp.context7.com/mcp",
 *       "headers": { "CONTEXT7_API_KEY": "YOUR_API_KEY" },
 *       "enabled": true,
 *       "timeout": 10000,
 *       "retry": { "maxAttempts": 3, "interval": 1000 }
 *     }
 *   }
 * }
 * ```
 */
export interface MCPConfigFile {
  mcp: Record<string, MCPConfig>;
}

/**
 * Result of configuration validation
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   valid: false,
 *   errors: ['Missing required field: url'],
 *   warnings: ['Timeout is very low, consider increasing']
 * };
 * ```
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
