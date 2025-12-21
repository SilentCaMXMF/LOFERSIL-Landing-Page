"use strict";
/**
 * MCP (Model Context Protocol) Type Definitions
 *
 * Comprehensive TypeScript interfaces and types for the MCP implementation.
 * Provides type safety and clear contracts for all MCP components.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MCP_ERROR_MONITORING_CONFIG = exports.DEFAULT_MCP_ERROR_REPORTING_CONFIG = exports.DEFAULT_MCP_ERROR_RECOVERY_CONFIG = exports.DEFAULT_MCP_ERROR_MAPPINGS = exports.MCPRecoveryAction = exports.MCPErrorSeverity = exports.MCPErrorCategory = exports.MCPAuthenticationMethod = exports.MCPClientEventType = exports.JSONRPCErrorCode = exports.MCPConnectionState = exports.MCP_VERSION = void 0;
exports.isJSONRPCRequest = isJSONRPCRequest;
exports.isJSONRPCResponse = isJSONRPCResponse;
exports.isJSONRPCNotification = isJSONRPCNotification;
exports.isMCPTool = isMCPTool;
exports.isMCPResource = isMCPResource;
exports.isMCPPrompt = isMCPPrompt;
exports.validateMCPClientConfig = validateMCPClientConfig;
exports.createMCPErrorContext = createMCPErrorContext;
exports.classifyMCPError = classifyMCPError;
exports.determineMCPErrorSeverity = determineMCPErrorSeverity;
exports.generateMCPErrorId = generateMCPErrorId;
exports.generateMCPCorrelationId = generateMCPCorrelationId;
exports.sanitizeMCPErrorMessage = sanitizeMCPErrorMessage;
// ============================================================================
// CORE MCP TYPES
// ============================================================================
/**
 * MCP protocol version
 */
exports.MCP_VERSION = "2024-11-05";
/**
 * MCP connection state
 */
var MCPConnectionState;
(function (MCPConnectionState) {
    MCPConnectionState["DISCONNECTED"] = "disconnected";
    MCPConnectionState["CONNECTING"] = "connecting";
    MCPConnectionState["CONNECTED"] = "connected";
    MCPConnectionState["RECONNECTING"] = "reconnecting";
    MCPConnectionState["ERROR"] = "error";
})(MCPConnectionState || (exports.MCPConnectionState = MCPConnectionState = {}));
/**
 * JSON-RPC 2.0 error codes
 */
var JSONRPCErrorCode;
(function (JSONRPCErrorCode) {
    // Standard JSON-RPC errors
    JSONRPCErrorCode[JSONRPCErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    JSONRPCErrorCode[JSONRPCErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    JSONRPCErrorCode[JSONRPCErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    // MCP-specific errors
    JSONRPCErrorCode[JSONRPCErrorCode["SERVER_ERROR_START"] = -32000] = "SERVER_ERROR_START";
    JSONRPCErrorCode[JSONRPCErrorCode["SERVER_ERROR_END"] = -32099] = "SERVER_ERROR_END";
    // MCP application errors
    JSONRPCErrorCode[JSONRPCErrorCode["UNAUTHORIZED"] = -32001] = "UNAUTHORIZED";
    JSONRPCErrorCode[JSONRPCErrorCode["FORBIDDEN"] = -32002] = "FORBIDDEN";
    JSONRPCErrorCode[JSONRPCErrorCode["NOT_FOUND"] = -32003] = "NOT_FOUND";
    JSONRPCErrorCode[JSONRPCErrorCode["CONFLICT"] = -32004] = "CONFLICT";
    JSONRPCErrorCode[JSONRPCErrorCode["VALIDATION_ERROR"] = -32005] = "VALIDATION_ERROR";
    JSONRPCErrorCode[JSONRPCErrorCode["RATE_LIMITED"] = -32006] = "RATE_LIMITED";
})(JSONRPCErrorCode || (exports.JSONRPCErrorCode = JSONRPCErrorCode = {}));
/**
 * Client event types
 */
var MCPClientEventType;
(function (MCPClientEventType) {
    MCPClientEventType["CONNECTION_STATE_CHANGED"] = "connection_state_changed";
    MCPClientEventType["MESSAGE_RECEIVED"] = "message_received";
    MCPClientEventType["MESSAGE_SENT"] = "message_sent";
    MCPClientEventType["ERROR_OCCURRED"] = "error_occurred";
    MCPClientEventType["TOOL_CALLED"] = "tool_called";
    MCPClientEventType["RESOURCE_ACCESSED"] = "resource_accessed";
    MCPClientEventType["PROMPT_GENERATED"] = "prompt_generated";
})(MCPClientEventType || (exports.MCPClientEventType = MCPClientEventType = {}));
// ============================================================================
// SECURITY TYPES
// ============================================================================
/**
 * Authentication methods
 */
var MCPAuthenticationMethod;
(function (MCPAuthenticationMethod) {
    MCPAuthenticationMethod["NONE"] = "none";
    MCPAuthenticationMethod["TOKEN"] = "token";
    MCPAuthenticationMethod["CERTIFICATE"] = "certificate";
    MCPAuthenticationMethod["API_KEY"] = "api_key";
})(MCPAuthenticationMethod || (exports.MCPAuthenticationMethod = MCPAuthenticationMethod = {}));
// ============================================================================
// TYPE GUARDS AND VALIDATION
// ============================================================================
/**
 * Type guard for JSON-RPC request
 */
function isJSONRPCRequest(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        obj.jsonrpc === "2.0" &&
        (typeof obj.id === "string" ||
            typeof obj.id === "number") &&
        typeof obj.method === "string");
}
/**
 * Type guard for JSON-RPC response
 */
function isJSONRPCResponse(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        obj.jsonrpc === "2.0" &&
        (typeof obj.id === "string" ||
            typeof obj.id === "number") &&
        (obj.result !== undefined || obj.error !== undefined));
}
/**
 * Type guard for JSON-RPC notification
 */
function isJSONRPCNotification(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        obj.jsonrpc === "2.0" &&
        typeof obj.method === "string" &&
        obj.id === undefined);
}
/**
 * Type guard for MCP tool
 */
function isMCPTool(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        typeof obj.name === "string" &&
        typeof obj.description === "string" &&
        typeof obj.inputSchema === "object" &&
        obj.inputSchema.type === "object");
}
/**
 * Type guard for MCP resource
 */
function isMCPResource(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        typeof obj.uri === "string" &&
        typeof obj.name === "string");
}
/**
 * Type guard for MCP prompt
 */
function isMCPPrompt(obj) {
    return (typeof obj === "object" &&
        obj !== null &&
        typeof obj.name === "string" &&
        (obj.arguments === undefined ||
            Array.isArray(obj.arguments)));
}
/**
 * Validate MCP client configuration
 */
function validateMCPClientConfig(config) {
    const errors = [];
    if (!config.serverUrl || typeof config.serverUrl !== "string") {
        errors.push("serverUrl is required and must be a string");
    }
    if (config.connectionTimeout !== undefined) {
        if (typeof config.connectionTimeout !== "number" ||
            config.connectionTimeout <= 0) {
            errors.push("connectionTimeout must be a positive number");
        }
    }
    if (config.reconnection) {
        if (typeof config.reconnection.maxAttempts !== "number" ||
            config.reconnection.maxAttempts < 0) {
            errors.push("reconnection.maxAttempts must be a non-negative number");
        }
        if (typeof config.reconnection.initialDelay !== "number" ||
            config.reconnection.initialDelay <= 0) {
            errors.push("reconnection.initialDelay must be a positive number");
        }
        if (typeof config.reconnection.maxDelay !== "number" ||
            config.reconnection.maxDelay <= 0) {
            errors.push("reconnection.maxDelay must be a positive number");
        }
        if (typeof config.reconnection.backoffMultiplier !== "number" ||
            config.reconnection.backoffMultiplier <= 1) {
            errors.push("reconnection.backoffMultiplier must be greater than 1");
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
// ============================================================================
// ERROR MANAGER INTEGRATION TYPES
// ============================================================================
/**
 * MCP-specific error categories that extend ErrorManager categories
 */
var MCPErrorCategory;
(function (MCPErrorCategory) {
    // Inherit from ErrorManager
    MCPErrorCategory["NETWORK"] = "network";
    MCPErrorCategory["API"] = "api";
    MCPErrorCategory["AUTHENTICATION"] = "authentication";
    MCPErrorCategory["VALIDATION"] = "validation";
    MCPErrorCategory["PROCESSING"] = "processing";
    MCPErrorCategory["RESOURCE"] = "resource";
    MCPErrorCategory["CONFIGURATION"] = "configuration";
    MCPErrorCategory["UNKNOWN"] = "unknown";
    // MCP-specific categories
    MCPErrorCategory["PROTOCOL"] = "protocol";
    MCPErrorCategory["WEBSOCKET"] = "websocket";
    MCPErrorCategory["TOOL_EXECUTION"] = "tool_execution";
    MCPErrorCategory["RESOURCE_ACCESS"] = "resource_access";
    MCPErrorCategory["PROMPT_GENERATION"] = "prompt_generation";
    MCPErrorCategory["SERIALIZATION"] = "serialization";
    MCPErrorCategory["DESERIALIZATION"] = "deserialization";
    MCPErrorCategory["TIMEOUT"] = "timeout";
    MCPErrorCategory["RATE_LIMIT"] = "rate_limit";
    MCPErrorCategory["CIRCUIT_BREAKER"] = "circuit_breaker";
})(MCPErrorCategory || (exports.MCPErrorCategory = MCPErrorCategory = {}));
/**
 * MCP error severity levels
 */
var MCPErrorSeverity;
(function (MCPErrorSeverity) {
    MCPErrorSeverity["LOW"] = "low";
    MCPErrorSeverity["MEDIUM"] = "medium";
    MCPErrorSeverity["HIGH"] = "high";
    MCPErrorSeverity["CRITICAL"] = "critical";
})(MCPErrorSeverity || (exports.MCPErrorSeverity = MCPErrorSeverity = {}));
/**
 * MCP recovery actions
 */
var MCPRecoveryAction;
(function (MCPRecoveryAction) {
    MCPRecoveryAction["RETRY"] = "retry";
    MCPRecoveryAction["ROLLBACK"] = "rollback";
    MCPRecoveryAction["SKIP"] = "skip";
    MCPRecoveryAction["ESCALATE"] = "escalate";
    MCPRecoveryAction["MANUAL"] = "manual";
    MCPRecoveryAction["RECONNECT"] = "reconnect";
    MCPRecoveryAction["RESET"] = "reset";
    MCPRecoveryAction["FALLBACK"] = "fallback";
})(MCPRecoveryAction || (exports.MCPRecoveryAction = MCPRecoveryAction = {}));
// ============================================================================
// ERROR MANAGER INTEGRATION UTILITIES
// ============================================================================
/**
 * Default error mappings between MCP and ErrorManager
 */
exports.DEFAULT_MCP_ERROR_MAPPINGS = [
    {
        mcpCategory: MCPErrorCategory.NETWORK,
        errorManagerCategory: "network",
        defaultSeverity: MCPErrorSeverity.MEDIUM,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.API,
        errorManagerCategory: "api",
        defaultSeverity: MCPErrorSeverity.MEDIUM,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.AUTHENTICATION,
        errorManagerCategory: "authentication",
        defaultSeverity: MCPErrorSeverity.CRITICAL,
        defaultRecoverable: false,
        defaultRetryable: false,
    },
    {
        mcpCategory: MCPErrorCategory.VALIDATION,
        errorManagerCategory: "validation",
        defaultSeverity: MCPErrorSeverity.MEDIUM,
        defaultRecoverable: false,
        defaultRetryable: false,
    },
    {
        mcpCategory: MCPErrorCategory.PROTOCOL,
        errorManagerCategory: "processing",
        defaultSeverity: MCPErrorSeverity.HIGH,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.WEBSOCKET,
        errorManagerCategory: "network",
        defaultSeverity: MCPErrorSeverity.HIGH,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.TOOL_EXECUTION,
        errorManagerCategory: "processing",
        defaultSeverity: MCPErrorSeverity.MEDIUM,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.RESOURCE_ACCESS,
        errorManagerCategory: "resource",
        defaultSeverity: MCPErrorSeverity.MEDIUM,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.PROMPT_GENERATION,
        errorManagerCategory: "processing",
        defaultSeverity: MCPErrorSeverity.MEDIUM,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.TIMEOUT,
        errorManagerCategory: "network",
        defaultSeverity: MCPErrorSeverity.HIGH,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.RATE_LIMIT,
        errorManagerCategory: "api",
        defaultSeverity: MCPErrorSeverity.HIGH,
        defaultRecoverable: true,
        defaultRetryable: true,
    },
    {
        mcpCategory: MCPErrorCategory.CIRCUIT_BREAKER,
        errorManagerCategory: "processing",
        defaultSeverity: MCPErrorSeverity.CRITICAL,
        defaultRecoverable: false,
        defaultRetryable: false,
    },
];
/**
 * Default error recovery configuration
 */
exports.DEFAULT_MCP_ERROR_RECOVERY_CONFIG = {
    enabled: true,
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    circuitBreakerThreshold: 5,
    recoveryTimeout: 60000,
};
/**
 * Default error reporting configuration
 */
exports.DEFAULT_MCP_ERROR_REPORTING_CONFIG = {
    enabled: true,
    reportToService: false,
    includeStackTrace: true,
    includeMetadata: true,
    sanitizeMessages: true,
    rateLimit: {
        maxErrorsPerMinute: 10,
        maxErrorsPerHour: 100,
    },
};
/**
 * Default error monitoring configuration
 */
exports.DEFAULT_MCP_ERROR_MONITORING_CONFIG = {
    enabled: true,
    collectMetrics: true,
    trackPatterns: true,
    generateAlerts: true,
    alertThresholds: {
        errorsPerMinute: 5,
        errorRatePercent: 10,
        consecutiveErrors: 3,
    },
};
// ============================================================================
// ERROR MANAGER INTEGRATION FUNCTIONS
// ============================================================================
/**
 * Create MCP error context
 */
function createMCPErrorContext(builder) {
    return {
        component: builder.component,
        operation: builder.operation,
        timestamp: new Date(),
        sessionId: builder.sessionId,
        requestId: builder.requestId,
        connectionId: builder.connectionId,
        toolName: builder.toolName,
        resourceUri: builder.resourceUri,
        promptName: builder.promptName,
        attempt: builder.attempt,
        metadata: builder.metadata,
    };
}
/**
 * Classify error into MCP category
 */
function classifyMCPError(error) {
    const message = error.message.toLowerCase();
    // Network errors
    if (message.includes("network") ||
        message.includes("connection") ||
        message.includes("fetch") ||
        message.includes("websocket")) {
        if (message.includes("websocket")) {
            return MCPErrorCategory.WEBSOCKET;
        }
        return MCPErrorCategory.NETWORK;
    }
    // Protocol errors
    if (message.includes("protocol") ||
        message.includes("json-rpc") ||
        message.includes("serialization") ||
        message.includes("deserialization")) {
        if (message.includes("serialization")) {
            return MCPErrorCategory.SERIALIZATION;
        }
        if (message.includes("deserialization")) {
            return MCPErrorCategory.DESERIALIZATION;
        }
        return MCPErrorCategory.PROTOCOL;
    }
    // Timeout errors
    if (message.includes("timeout") || message.includes("timed out")) {
        return MCPErrorCategory.TIMEOUT;
    }
    // Rate limit errors
    if (message.includes("rate limit") || message.includes("too many requests")) {
        return MCPErrorCategory.RATE_LIMIT;
    }
    // Authentication errors
    if (message.includes("unauthorized") ||
        message.includes("forbidden") ||
        message.includes("authentication") ||
        message.includes("auth")) {
        return MCPErrorCategory.AUTHENTICATION;
    }
    // Validation errors
    if (message.includes("validation") ||
        message.includes("invalid") ||
        message.includes("required")) {
        return MCPErrorCategory.VALIDATION;
    }
    // Tool execution errors
    if (message.includes("tool") || message.includes("execution")) {
        return MCPErrorCategory.TOOL_EXECUTION;
    }
    // Resource access errors
    if (message.includes("resource") || message.includes("access")) {
        return MCPErrorCategory.RESOURCE_ACCESS;
    }
    // Prompt generation errors
    if (message.includes("prompt") || message.includes("generation")) {
        return MCPErrorCategory.PROMPT_GENERATION;
    }
    // Configuration errors
    if (message.includes("config") || message.includes("environment")) {
        return MCPErrorCategory.CONFIGURATION;
    }
    return MCPErrorCategory.UNKNOWN;
}
/**
 * Determine error severity
 */
function determineMCPErrorSeverity(error, category, attempt) {
    // Critical categories
    if (category === MCPErrorCategory.AUTHENTICATION ||
        category === MCPErrorCategory.CIRCUIT_BREAKER ||
        category === MCPErrorCategory.CONFIGURATION) {
        return MCPErrorSeverity.CRITICAL;
    }
    // High severity categories
    if (category === MCPErrorCategory.PROTOCOL ||
        category === MCPErrorCategory.WEBSOCKET ||
        category === MCPErrorCategory.TIMEOUT ||
        category === MCPErrorCategory.RATE_LIMIT) {
        // Upgrade to critical after multiple attempts
        if (attempt && attempt > 2) {
            return MCPErrorSeverity.CRITICAL;
        }
        return MCPErrorSeverity.HIGH;
    }
    // Medium severity categories
    if (category === MCPErrorCategory.NETWORK ||
        category === MCPErrorCategory.API ||
        category === MCPErrorCategory.TOOL_EXECUTION ||
        category === MCPErrorCategory.RESOURCE_ACCESS ||
        category === MCPErrorCategory.PROMPT_GENERATION) {
        // Upgrade to high after multiple attempts
        if (attempt && attempt > 3) {
            return MCPErrorSeverity.HIGH;
        }
        return MCPErrorSeverity.MEDIUM;
    }
    // Low severity for validation and unknown
    return MCPErrorSeverity.LOW;
}
/**
 * Generate unique error ID
 */
function generateMCPErrorId() {
    return `mcp_err_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
/**
 * Generate correlation ID for error tracking
 */
function generateMCPCorrelationId() {
    return `mcp_corr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
/**
 * Sanitize error message for logging
 */
function sanitizeMCPErrorMessage(message) {
    // Remove sensitive information
    return message
        .replace(/token[=\/][\w\-\.]+/gi, "token=REDACTED")
        .replace(/key[=\/][\w\-\.]+/gi, "key=REDACTED")
        .replace(/password[=\/][\w\-\.]+/gi, "password=REDACTED")
        .replace(/secret[=\/][\w\-\.]+/gi, "secret=REDACTED")
        .replace(/authorization[=:]\s*[^\s,}]+/gi, "authorization=REDACTED")
        .replace(/bearer\s+[^\s,}]+/gi, "bearer=REDACTED");
}
// ============================================================================
// EXPORTS
// ============================================================================
__exportStar(require("./types"), exports);
