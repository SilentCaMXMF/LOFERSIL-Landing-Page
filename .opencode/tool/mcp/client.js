/**
 * MCP Client Implementation with Security and Performance Optimizations
 *
 * Handles WebSocket/SSE connections to MCP servers with JSON-RPC 2.0 protocol.
 * Includes input validation, rate limiting, proper error handling, and memory leak prevention.
 */
import { MCPConnectionState } from './types.js';
import { MCPLogger } from './logger.js';
export class MCPClient {
    config;
    ws = null;
    eventSource = null;
    connectionState = MCPConnectionState.DISCONNECTED;
    reconnectAttempts = 0;
    lastReconnectTime = 0;
    connectionPromise = null;
    messageHandlers = new Map();
    pendingRequests = new Map();
    rateLimitRequests = [];
    RATE_LIMIT_WINDOW = 60000; // 1 minute
    MAX_REQUESTS_PER_WINDOW = 100;
    MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
    MAX_STRING_LENGTH = 10000; // 10KB per string
    // Circuit breaker properties
    circuitState = 'closed';
    circuitFailureCount = 0;
    circuitLastFailureTime;
    circuitSuccessCount = 0;
    CIRCUIT_FAILURE_THRESHOLD = 5;
    CIRCUIT_TIMEOUT = 60000; // 1 minute
    CIRCUIT_SUCCESS_THRESHOLD = 3;
    // Logger instance
    logger = MCPLogger.getInstance();
    constructor(config) {
        this.config = {
            reconnectInterval: 5000,
            maxReconnectAttempts: 5,
            timeout: 30000,
            ...config,
        };
    }
    maskHeaders(headers) {
        if (!headers)
            return undefined;
        const masked = {};
        for (const [key, value] of Object.entries(headers)) {
            masked[key] =
                key.toLowerCase().includes('key') ||
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('auth')
                    ? `${value.substring(0, 4)}****`
                    : value;
        }
        return masked;
    }
    async connect() {
        if (this.connectionState === MCPConnectionState.CONNECTED) {
            return;
        }
        // Check circuit breaker
        if (this.circuitState === 'open') {
            if (Date.now() - (this.circuitLastFailureTime?.getTime() || 0) < this.CIRCUIT_TIMEOUT) {
                throw new Error('Circuit breaker is open - too many recent failures');
            }
            else {
                this.circuitState = 'half_open';
                this.circuitSuccessCount = 0;
            }
        }
        // Prevent concurrent connection attempts
        if (this.connectionPromise) {
            return this.connectionPromise;
        }
        this.connectionPromise = this.performConnect();
        try {
            await this.connectionPromise;
            this.onCircuitSuccess();
        }
        catch (error) {
            this.onCircuitFailure();
            throw error;
        }
        finally {
            this.connectionPromise = null;
        }
    }
    async performConnect() {
        if (this.connectionState === MCPConnectionState.CONNECTED) {
            return;
        }
        this.connectionState = MCPConnectionState.CONNECTING;
        try {
            if (this.config.headers) {
                // Use HTTP-based connection with headers
                await this.connectHTTP();
            }
            else {
                // Try WebSocket first, fallback to SSE
                await this.connectWebSocket();
            }
        }
        catch (error) {
            if (!this.config.headers) {
                this.logger.warn('MCPClient', 'WebSocket connection failed, trying SSE', {
                    error: error.message,
                });
                try {
                    await this.connectSSE();
                }
                catch (sseError) {
                    this.connectionState = MCPConnectionState.ERROR;
                    throw new Error(`Failed to connect to MCP server: ${sseError}`);
                }
            }
            else {
                this.connectionState = MCPConnectionState.ERROR;
                throw error; // Re-throw original error for HTTP connections
            }
        }
    }
    async initializeConnection() {
        if (!this.config.headers)
            return;
        const initMessage = {
            jsonrpc: '2.0',
            id: 'init',
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'mcp-client',
                    version: '1.0.0',
                },
            },
        };
        this.logger.info('MCPClient', 'Initializing MCP connection with headers', {
            headers: this.maskHeaders(this.config.headers),
        });
        const response = await fetch(this.config.serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
            body: JSON.stringify(initMessage),
            signal: AbortSignal.timeout(this.config.timeout || 10000),
        });
        if (!response.ok) {
            throw new Error(`HTTP initialization failed: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        if (result.error) {
            throw new Error(`MCP initialization error: ${result.error.message}`);
        }
        this.logger.info('MCPClient', 'MCP HTTP initialized successfully');
    }
    async connectWebSocket() {
        // Perform initialization if headers are present
        await this.initializeConnection();
        return new Promise((resolve, reject) => {
            const wsUrl = this.config.serverUrl.replace(/^http/, 'ws');
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                this.connectionState = MCPConnectionState.CONNECTED;
                this.reconnectAttempts = 0;
                this.logger.info('MCPClient', 'MCP WebSocket connected');
                resolve();
            };
            this.ws.onmessage = event => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                }
                catch (error) {
                    this.logger.error('MCPClient', 'Failed to parse MCP message', error);
                }
            };
            this.ws.onclose = () => {
                this.connectionState = MCPConnectionState.DISCONNECTED;
                this.logger.info('MCPClient', 'MCP WebSocket disconnected');
                this.scheduleReconnect();
            };
            this.ws.onerror = error => {
                this.logger.error('MCPClient', 'MCP WebSocket error', new Error(String(error)));
                reject(error);
            };
            // Timeout after config timeout or 10 seconds
            setTimeout(() => {
                if (this.connectionState !== MCPConnectionState.CONNECTED) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, this.config.timeout || 10000);
        });
    }
    async connectSSE() {
        // Perform initialization if headers are present
        await this.initializeConnection();
        return new Promise((resolve, reject) => {
            this.eventSource = new EventSource(this.config.serverUrl);
            this.eventSource.onopen = () => {
                this.connectionState = MCPConnectionState.CONNECTED;
                this.reconnectAttempts = 0;
                this.logger.info('MCPClient', 'MCP SSE connected');
                resolve();
            };
            this.eventSource.onmessage = event => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                }
                catch (error) {
                    this.logger.error('MCPClient', 'Failed to parse MCP message', error);
                }
            };
            this.eventSource.onerror = error => {
                this.connectionState = MCPConnectionState.ERROR;
                this.logger.error('MCPClient', 'MCP SSE error', new Error(String(error)));
                reject(error);
            };
            // Timeout after config timeout or 10 seconds
            setTimeout(() => {
                if (this.connectionState !== MCPConnectionState.CONNECTED) {
                    reject(new Error('SSE connection timeout'));
                }
            }, this.config.timeout || 10000);
        });
    }
    async connectHTTP() {
        // For HTTP-based MCP, perform initialization with headers
        await this.initializeConnection();
        this.connectionState = MCPConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        this.logger.info('MCPClient', 'MCP HTTP connected successfully');
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
            this.logger.error('MCPClient', 'Max reconnection attempts reached');
            this.onCircuitFailure(); // Trigger circuit breaker on max reconnection attempts
            return;
        }
        this.connectionState = MCPConnectionState.RECONNECTING;
        this.reconnectAttempts++;
        // Exponential backoff with jitter
        const baseDelay = this.config.reconnectInterval || 5000;
        const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const delay = Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
        this.logger.info('MCPClient', 'Scheduling reconnection attempt', {
            attempt: this.reconnectAttempts,
            maxAttempts: this.config.maxReconnectAttempts,
            delay: Math.round(delay),
        });
        setTimeout(() => {
            this.logger.info('MCPClient', 'Attempting to reconnect', {
                attempt: this.reconnectAttempts,
                maxAttempts: this.config.maxReconnectAttempts,
            });
            this.connect().catch(error => {
                this.logger.error('MCPClient', 'Reconnection failed', error);
                this.onCircuitFailure(); // Trigger circuit breaker on reconnection failure
            });
        }, delay);
    }
    async disconnect() {
        this.connectionState = MCPConnectionState.DISCONNECTED;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        // Clear pending requests to prevent memory leaks
        for (const [id, request] of this.pendingRequests) {
            clearTimeout(request.timeout);
            const error = {
                code: -32000,
                message: 'Connection closed',
            };
            request.reject(error);
        }
        this.pendingRequests.clear();
    }
    async sendRequest(method, params) {
        if (this.connectionState !== MCPConnectionState.CONNECTED) {
            const error = {
                code: -32003,
                message: 'MCP client is not connected',
            };
            throw error;
        }
        // Input validation and sanitization
        this.validateRequestInput(method, params);
        // Rate limiting
        if (!this.checkRateLimit()) {
            const error = {
                code: -32006,
                message: 'Rate limit exceeded',
            };
            throw error;
        }
        const id = Math.random().toString(36).substring(7);
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        if (this.config.headers) {
            // Use HTTP POST for requests when headers are required
            try {
                const response = await fetch(this.config.serverUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers,
                    },
                    body: JSON.stringify(message),
                    signal: AbortSignal.timeout(this.config.timeout || 30000),
                });
                if (!response.ok) {
                    const error = {
                        code: -32002,
                        message: 'HTTP request failed',
                    };
                    throw error;
                }
                const result = await response.json();
                if (result.error) {
                    const error = {
                        code: -32002,
                        message: 'HTTP request failed',
                        data: result.error,
                    };
                    throw error;
                }
                return result.result;
            }
            catch (error) {
                if (error && typeof error === 'object' && 'code' in error) {
                    throw error; // Already an MCPError
                }
                const mcpError = {
                    code: -32002,
                    message: 'HTTP request failed',
                    data: error instanceof Error ? error.message : String(error),
                };
                throw mcpError;
            }
        }
        else {
            // Use WebSocket or SSE for requests
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pendingRequests.delete(id);
                    const error = {
                        code: -32001,
                        message: 'Request timeout',
                    };
                    reject(error);
                }, this.config.timeout || 30000);
                this.pendingRequests.set(id, { resolve, reject, timeout });
                const messageStr = JSON.stringify(message);
                if (this.ws) {
                    this.ws.send(messageStr);
                }
                else if (this.eventSource) {
                    // For SSE-based MCP servers, send requests via HTTP POST
                    // while using SSE for receiving responses
                    this.sendSSECompatibleRequest(message, id, resolve, reject, timeout);
                }
            });
        }
    }
    handleMessage(message) {
        if (message.id && this.pendingRequests.has(message.id)) {
            const request = this.pendingRequests.get(message.id);
            clearTimeout(request.timeout);
            this.pendingRequests.delete(message.id);
            if (message.error) {
                request.reject(message.error);
            }
            else {
                request.resolve(message.result);
            }
        }
        // Handle notifications and other messages
        if (message.method && this.messageHandlers.has(message.method)) {
            this.messageHandlers.get(message.method)(message);
        }
    }
    on(method, handler) {
        this.messageHandlers.set(method, handler);
    }
    off(method) {
        this.messageHandlers.delete(method);
    }
    getConnectionState() {
        return this.connectionState;
    }
    isConnected() {
        return this.connectionState === MCPConnectionState.CONNECTED;
    }
    validateRequestInput(method, params) {
        // Validate method name
        if (typeof method !== 'string' || method.length === 0 || method.length > 100) {
            throw new Error('Invalid method name: must be a non-empty string with max 100 characters');
        }
        // Validate method name format (alphanumeric, dots, underscores, hyphens, forward slashes)
        if (!/^[a-zA-Z0-9._/-]+$/.test(method)) {
            throw new Error('Invalid method name: only alphanumeric characters, dots, underscores, hyphens, and forward slashes allowed');
        }
        // Validate params size
        if (params !== undefined) {
            const paramsStr = JSON.stringify(params);
            if (paramsStr.length > this.MAX_REQUEST_SIZE) {
                throw new Error(`Request parameters too large: ${paramsStr.length} bytes (max ${this.MAX_REQUEST_SIZE})`);
            }
            // Validate string lengths in params
            this.validateParamStrings(params);
        }
    }
    validateParamStrings(obj, path = 'params') {
        if (typeof obj === 'string' && obj.length > this.MAX_STRING_LENGTH) {
            throw new Error(`String parameter too long at ${path}: ${obj.length} characters (max ${this.MAX_STRING_LENGTH})`);
        }
        if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = `${path}.${key}`;
                this.validateParamStrings(value, currentPath);
            }
        }
    }
    checkRateLimit() {
        const now = Date.now();
        // Remove old requests outside the window
        this.rateLimitRequests = this.rateLimitRequests.filter(timestamp => now - timestamp < this.RATE_LIMIT_WINDOW);
        // Check if under limit
        if (this.rateLimitRequests.length >= this.MAX_REQUESTS_PER_WINDOW) {
            return false;
        }
        // Add current request
        this.rateLimitRequests.push(now);
        return true;
    }
    /**
     * Handle circuit breaker success
     */
    onCircuitSuccess() {
        if (this.circuitState === 'half_open') {
            this.circuitSuccessCount++;
            if (this.circuitSuccessCount >= this.CIRCUIT_SUCCESS_THRESHOLD) {
                this.circuitState = 'closed';
                this.circuitFailureCount = 0;
                this.logger.info('MCPClient', 'Circuit breaker closed - service recovered');
            }
        }
    }
    /**
     * Handle circuit breaker failure
     */
    onCircuitFailure() {
        this.circuitFailureCount++;
        this.circuitLastFailureTime = new Date();
        if (this.circuitFailureCount >= this.CIRCUIT_FAILURE_THRESHOLD) {
            this.circuitState = 'open';
            this.logger.warn('MCPClient', `Circuit breaker opened after ${this.circuitFailureCount} failures`);
        }
    }
    /**
     * Get current circuit breaker state
     */
    getCircuitState() {
        return this.circuitState;
    }
    /**
     * Manually reset circuit breaker
     */
    resetCircuitBreaker() {
        this.circuitState = 'closed';
        this.circuitFailureCount = 0;
        this.circuitSuccessCount = 0;
        this.circuitLastFailureTime = undefined;
        this.logger.info('MCPClient', 'Circuit breaker manually reset');
    }
    /**
     * Send requests via HTTP POST for SSE-based MCP servers
     * SSE is used for receiving responses, HTTP POST for sending requests
     */
    async sendSSECompatibleRequest(message, id, resolve, reject, timeout) {
        try {
            // Convert WebSocket URL to HTTP URL for POST requests
            const httpUrl = this.config.serverUrl.replace(/^ws/, 'http');
            const response = await fetch(httpUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers,
                },
                body: JSON.stringify(message),
                signal: AbortSignal.timeout(this.config.timeout || 30000),
            });
            if (!response.ok) {
                const error = {
                    code: -32002,
                    message: 'HTTP request failed',
                };
                clearTimeout(timeout);
                this.pendingRequests.delete(id);
                reject(error);
                return;
            }
            const result = await response.json();
            if (result.error) {
                const error = {
                    code: -32002,
                    message: 'HTTP request failed',
                    data: result.error,
                };
                clearTimeout(timeout);
                this.pendingRequests.delete(id);
                reject(error);
            }
            else {
                clearTimeout(timeout);
                this.pendingRequests.delete(id);
                resolve(result.result);
            }
        }
        catch (error) {
            const mcpError = {
                code: -32002,
                message: 'HTTP request failed',
                data: error instanceof Error ? error.message : String(error),
            };
            clearTimeout(timeout);
            this.pendingRequests.delete(id);
            reject(mcpError);
        }
    }
}
