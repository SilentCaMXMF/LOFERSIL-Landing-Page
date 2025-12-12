/**
 * MCP Module - Main Exports
 *
 * Comprehensive Model Context Protocol (MCP) implementation for the LOFERSIL Landing Page.
 * This module provides a complete client-server communication system with WebSocket support,
 * JSON-RPC 2.0 protocol implementation, and comprehensive error handling.
 *
 * Main Components:
 * - MCPClient: Core client for MCP protocol communication
 * - MCPWebSocketClient: WebSocket client with reconnection logic
 * - ProtocolHandler: JSON-RPC 2.0 protocol implementation
 * - Type definitions: Complete TypeScript interfaces and types
 *
 * Features:
 * - Tool execution and management
 * - Resource access and caching
 * - Prompt generation and management
 * - Automatic reconnection with exponential backoff
 * - Performance monitoring and metrics
 * - Comprehensive error handling and recovery
 * - Security features and rate limiting
 * - Event-driven architecture
 * - Support for both browser and Node.js environments
 *
 * Usage Example:
 * ```typescript
 * import { MCPClient } from './modules/mcp';
 * import { ErrorManager } from './modules/ErrorManager';
 *
 * const errorHandler = new ErrorManager();
 * const client = new MCPClient({
 *   serverUrl: 'ws://localhost:3000',
 *   clientInfo: { name: 'MyApp', version: '1.0.0' }
 * }, errorHandler);
 *
 * await client.connect();
 * const tools = await client.listTools();
 * const result = await client.callTool('example_tool', { param: 'value' });
 * ```
 *
 * @author MCP Implementation Team
 * @version 1.0.0
 * @since 2024-11-05
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { MCPClient, type MCPClientExtendedConfig } from "./client";
import {
  MCPWebSocketClient,
  type WebSocketClientConfig,
  type ConnectionStats,
  WebSocketError,
  WebSocketErrorType,
} from "./websocket-client";
import {
  MessageFactory,
  MessageSerializer,
  RequestManager,
  ProtocolHandler,
  MCPProtocol,
} from "./protocol";
import { HTTPTransport, type HTTPTransportConfig } from "./http-transport";
import {
  MCPTransport,
  type TransportConfig,
  type TransportStats,
  type TransportEventData,
  TransportError,
  TransportErrorType,
  createTransportError,
  validateTransportConfig,
} from "./transport-interface";

import {
  MCPTransportFactory,
  createTransportFactory,
  createContext7TransportFactory,
} from "./transport-factory";
import type {
  MCPTransportFactoryConfig,
  TransportCreationOptions,
  TransportHealthStatus,
  TransportFactoryStats,
} from "./transport-factory";

import {
  MCPMultiTransportClient,
  createMultiTransportClient,
  createContext7Client,
} from "./multi-transport-client";
import type {
  MCPMultiTransportClientConfig,
  TransportConnectionStatus,
  MultiTransportClientStats,
} from "./multi-transport-client";

import {
  // Core MCP Types
  MCPCapabilities,
  MCPClientConfig,
  MCPConnectionState,
  MCPBaseMessage,

  // JSON-RPC Types
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  JSONRPCError,
  JSONRPCErrorCode,

  // MCP-Specific Types
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContent,
  MCPPrompt,
  MCPPromptResult,
  MCPPromptArgument,
  MCPPromptMessage,
  MCPContent,
  MCPTextContent,
  MCPImageContent,

  // Client State Types
  MCPClientStatus,
  MCPOperationResult,
  MCPClientEvent,
  MCPClientEventType,

  // Security Types
  MCPAuthenticationMethod,
  MCPAuthenticationCredentials,
  MCPPermission,
  MCPSecurityContext,

  // Monitoring Types
  MCPPerformanceMetrics,
  MCPHealthCheck,

  // HTTP Transport Types
  MCPHTTPTransportConfig,
  MCPHTTPClientConfig,
  Context7Config,
  HTTPTransportErrorCategory,
  DEFAULT_CONTEXT7_CONFIG,

  // Utility Types
  MCPEventHandler,
  MCPRequestPromise,
  MCPMessageHandler,
  DeepPartial,
  RequiredKeys,
  OptionalKeys,

  // Constants
  MCP_VERSION,

  // Type Guards
  isJSONRPCRequest,
  isJSONRPCResponse,
  isJSONRPCNotification,
  isMCPTool,
  isMCPResource,
  isMCPPrompt,
  validateMCPClientConfig,
  validateHTTPTransportConfig,
  createHTTPTransportConfig,
  mergeContext7Config,
} from "./types";

import { ErrorManager } from "../ErrorManager";
import { envLoader } from "../EnvironmentLoader";

// ============================================================================
// MAIN CLIENT EXPORTS
// ============================================================================

export { MCPClient };
export type { MCPClientExtendedConfig };

// ============================================================================
// TRANSPORT LAYER EXPORTS
// ============================================================================

export { HTTPTransport };
export type { HTTPTransportConfig };

export { createTransportError, validateTransportConfig };
export type { MCPTransport };

export type {
  TransportConfig,
  TransportStats,
  TransportEventData,
  TransportError,
  TransportErrorType,
};

// MULTI-TRANSPORT EXPORTS
// ============================================================================

export {
  MCPTransportFactory,
  createTransportFactory,
  createContext7TransportFactory,
};
export type {
  MCPTransportFactoryConfig,
  TransportCreationOptions,
  TransportHealthStatus,
  TransportFactoryStats,
};

export {
  MCPMultiTransportClient,
  createMultiTransportClient,
  createContext7Client,
};
export type {
  MCPMultiTransportClientConfig,
  TransportConnectionStatus,
  MultiTransportClientStats,
};

// WEBSOCKET CLIENT EXPORTS
// ============================================================================

export { MCPWebSocketClient };
export type { WebSocketClientConfig, ConnectionStats };
export { WebSocketError, WebSocketErrorType };

// ============================================================================
// PROTOCOL LAYER EXPORTS
// ============================================================================

export {
  MessageFactory,
  MessageSerializer,
  RequestManager,
  ProtocolHandler,
  MCPProtocol,
};

// ============================================================================
// TYPE DEFINITIONS EXPORTS
// ============================================================================

export type {
  // Core MCP Types
  MCPCapabilities,
  MCPClientConfig,
  MCPConnectionState,
  MCPBaseMessage,

  // JSON-RPC Types
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
  JSONRPCError,
  JSONRPCErrorCode,

  // MCP-Specific Types
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPResourceContent,
  MCPPrompt,
  MCPPromptResult,
  MCPPromptArgument,
  MCPPromptMessage,
  MCPContent,
  MCPTextContent,
  MCPImageContent,

  // Client State Types
  MCPClientStatus,
  MCPOperationResult,
  MCPClientEvent,
  MCPClientEventType,

  // Security Types
  MCPAuthenticationMethod,
  MCPAuthenticationCredentials,
  MCPPermission,
  MCPSecurityContext,

  // Monitoring Types
  MCPPerformanceMetrics,
  MCPHealthCheck,

  // HTTP Transport Types
  MCPHTTPTransportConfig,
  MCPHTTPClientConfig,
  Context7Config,

  // Utility Types
  MCPEventHandler,
  MCPRequestPromise,
  MCPMessageHandler,
  DeepPartial,
  RequiredKeys,
  OptionalKeys,
};

// ============================================================================
// CONSTANTS EXPORTS
// ============================================================================

export { MCP_VERSION };

// ============================================================================
// TYPE GUARDS EXPORTS
// ============================================================================

export {
  isJSONRPCRequest,
  isJSONRPCResponse,
  isJSONRPCNotification,
  isMCPTool,
  isMCPResource,
  isMCPPrompt,
  validateMCPClientConfig,
  validateHTTPTransportConfig,
  createHTTPTransportConfig,
  mergeContext7Config,
  HTTPTransportErrorCategory,
  DEFAULT_CONTEXT7_CONFIG,
};

// ============================================================================
// MODULE INFORMATION
// ============================================================================

/**
 * MCP Module Information
 */
export const MCP_MODULE_INFO = {
  name: "LOFERSIL MCP Module",
  version: "1.0.0",
  description: "Comprehensive Model Context Protocol implementation",
  author: "MCP Implementation Team",
  protocolVersion: "2024-11-05",
  features: [
    "WebSocket communication with automatic reconnection",
    "JSON-RPC 2.0 protocol implementation",
    "Tool execution and management",
    "Resource access and caching",
    "Prompt generation and management",
    "Performance monitoring and metrics",
    "Comprehensive error handling and recovery",
    "Security features and rate limiting",
    "Event-driven architecture",
    "TypeScript strict mode support",
    "Browser and Node.js compatibility",
  ],
  dependencies: ["ErrorManager", "EnvironmentLoader", "WebSocket API"],
} as const;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a configured MCP client with default settings
 */
export function createMCPClient(
  config: MCPClientConfig,
  errorHandler: ErrorManager,
): MCPClient {
  return new MCPClient(config, errorHandler);
}

/**
 * Create a WebSocket client with default settings
 */
export function createWebSocketClient(
  config: MCPClientConfig,
  errorHandler: ErrorManager,
): MCPWebSocketClient {
  return new MCPWebSocketClient(config, errorHandler);
}

/**
 * Create an HTTP transport client with default settings
 */
export function createHTTPTransport(
  config: HTTPTransportConfig,
): HTTPTransport {
  return new HTTPTransport(config);
}

/**
 * Create an HTTP transport client for Context7
 */
export function createContext7Transport(
  apiKey: string,
  mcpEndpoint?: string,
): HTTPTransport {
  const config: HTTPTransportConfig = {
    serverUrl: mcpEndpoint || "https://mcp.context7.com/mcp",
    context7: {
      apiKey,
      mcpEndpoint: mcpEndpoint || "https://mcp.context7.com/mcp",
      apiVersion: "v1",
    },
    requestTimeout: 30000,
    maxRetries: 3,
    enableCaching: false,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
    },
  };

  return new HTTPTransport(config);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if MCP integration is enabled in environment
 */
export function isMCPEnabled(): boolean {
  try {
    return (
      process?.env?.ENABLE_MCP_INTEGRATION === "true" ||
      (typeof window !== "undefined" &&
        (window as any).__MCP_ENABLED__ === true)
    );
  } catch {
    return false;
  }
}

/**
 * Get MCP server URL from environment or config
 */
export function getMCPServerUrl(fallback?: string): string {
  try {
    if (typeof window !== "undefined") {
      return (
        (window as any).__MCP_SERVER_URL__ || fallback || "ws://localhost:3000"
      );
    }
    return process?.env?.MCP_SERVER_URL || fallback || "ws://localhost:3000";
  } catch {
    return fallback || "ws://localhost:3000";
  }
}

/**
 * Validate MCP configuration
 */
export function validateMCPConfig(config: MCPClientConfig): {
  valid: boolean;
  errors: string[];
} {
  return validateMCPClientConfig(config);
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default MCP client configuration
 */
export const DEFAULT_MCP_CONFIG: Partial<MCPClientConfig> = {
  connectionTimeout: 30000,
  reconnection: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
  capabilities: {
    experimental: {},
  },
  clientInfo: {
    name: "LOFERSIL MCP Client",
    version: "1.0.0",
  },
  debug: false,
};

/**
 * Development MCP configuration
 */
export const DEVELOPMENT_MCP_CONFIG: Partial<MCPClientConfig> = {
  ...DEFAULT_MCP_CONFIG,
  debug: true,
  connectionTimeout: 10000,
  reconnection: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
  },
};

/**
 * Production MCP configuration
 */
export const PRODUCTION_MCP_CONFIG: Partial<MCPClientConfig> = {
  ...DEFAULT_MCP_CONFIG,
  debug: false,
  connectionTimeout: 60000,
  reconnection: {
    maxAttempts: 20,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
  },
};

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

// Re-export ErrorManager for convenience
export { ErrorManager } from "../ErrorManager";

// Re-export EnvironmentLoader for convenience
export { envLoader } from "../EnvironmentLoader";

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

/**
 * Initialize MCP module with environment settings
 */
export function initializeMCPModule(): {
  enabled: boolean;
  serverUrl: string;
  config: Partial<MCPClientConfig>;
} {
  const enabled = isMCPEnabled();
  const serverUrl = getMCPServerUrl();

  let config: Partial<MCPClientConfig> = DEFAULT_MCP_CONFIG;

  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    config = DEVELOPMENT_MCP_CONFIG;
  } else if (typeof window !== "undefined") {
    config = PRODUCTION_MCP_CONFIG;
  }

  return {
    enabled,
    serverUrl,
    config,
  };
}

// ============================================================================
// VERSION COMPATIBILITY
// ============================================================================

/**
 * Check MCP protocol version compatibility
 */
export function isProtocolVersionCompatible(
  version: string,
  requiredVersion: string = MCP_VERSION,
): boolean {
  // Simple version comparison - can be enhanced for more complex versioning
  return version === requiredVersion;
}

/**
 * Get supported MCP protocol features
 */
export function getSupportedFeatures(): string[] {
  return [
    "tools/list",
    "tools/call",
    "resources/list",
    "resources/read",
    "prompts/list",
    "prompts/get",
    "initialize",
    "ping",
  ];
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Create standardized MCP error
 */
export function createMCPError(
  message: string,
  code: number = -32000,
  data?: unknown,
): Error & { code: number; data?: unknown } {
  const error = new Error(message) as Error & { code: number; data?: unknown };
  error.code = code;
  error.data = data;
  return error;
}

/**
 * Check if error is MCP-related
 */
export function isMCPError(error: unknown): error is Error & { code?: number } {
  return error instanceof Error && typeof (error as any).code === "number";
}

// ============================================================================
// PERFORMANCE HELPERS
// ============================================================================

/**
 * Measure MCP operation performance
 */
export async function measureMCPPerformance<T>(
  operation: () => Promise<T>,
  label: string,
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await operation();
  const duration = performance.now() - startTime;

  if (typeof window !== "undefined" && window.console) {
    console.debug(`[MCP Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Create MCP performance monitor
 */
export function createMCPPerformanceMonitor() {
  const metrics = new Map<
    string,
    { count: number; totalTime: number; minTime: number; maxTime: number }
  >();

  return {
    record(label: string, duration: number): void {
      const existing = metrics.get(label) || {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
      };
      metrics.set(label, {
        count: existing.count + 1,
        totalTime: existing.totalTime + duration,
        minTime: Math.min(existing.minTime, duration),
        maxTime: Math.max(existing.maxTime, duration),
      });
    },

    getMetrics(): Record<
      string,
      { count: number; averageTime: number; minTime: number; maxTime: number }
    > {
      const result: Record<
        string,
        { count: number; averageTime: number; minTime: number; maxTime: number }
      > = {};

      for (const [label, data] of metrics) {
        result[label] = {
          count: data.count,
          averageTime: data.totalTime / data.count,
          minTime: data.minTime,
          maxTime: data.maxTime,
        };
      }

      return result;
    },

    reset(): void {
      metrics.clear();
    },
  };
}

// ============================================================================
// MODULE EXPORTS SUMMARY
// ============================================================================

/**
 * Complete MCP module exports summary:
 *
 * Core Classes:
 * - MCPClient: Main client implementation
 * - MCPWebSocketClient: WebSocket communication
 * - ProtocolHandler: JSON-RPC protocol handling
 *
 * Types and Interfaces:
 * - Complete TypeScript definitions for all MCP entities
 * - Configuration interfaces
 * - Event types and handlers
 *
 * Utilities:
 * - Factory functions for easy client creation
 * - Configuration validation
 * - Performance monitoring tools
 * - Error handling helpers
 *
 * Constants:
 * - Default configurations
 * - Protocol version
 * - Module information
 *
 * This provides a complete, production-ready MCP implementation
 * with comprehensive TypeScript support and extensive documentation.
 */
