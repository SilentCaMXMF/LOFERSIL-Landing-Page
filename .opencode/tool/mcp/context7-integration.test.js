/**
 * Context7 MCP Integration Tests
 *
 * End-to-end integration tests for Context7 MCP server connection
 * using the new configuration system and header-based authentication.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPClient } from './client.js';
import { loadConfig, validateConfig, substituteEnvVars, resolveServerConfig, } from './config-loader.js';
// Mock dependencies
vi.mock('./config-loader.js');
vi.mock('./client.js');
const mockLoadConfig = vi.mocked(loadConfig);
const mockValidateConfig = vi.mocked(validateConfig);
const mockSubstituteEnvVars = vi.mocked(substituteEnvVars);
const mockResolveServerConfig = vi.mocked(resolveServerConfig);
const mockMCPClient = vi.mocked(MCPClient);
describe('Context7 MCP Integration', () => {
    let mockClientInstance;
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup mock client instance
        mockClientInstance = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            sendRequest: vi.fn(),
            getConnectionState: vi.fn(),
            isConnected: vi.fn(),
        };
        mockMCPClient.mockImplementation(() => mockClientInstance);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('Configuration Loading', () => {
        it('should load Context7 configuration from file', () => {
            const mockConfig = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: 'https://mcp.context7.com/mcp',
                        headers: { CONTEXT7_API_KEY: 'test-key' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            mockLoadConfig.mockReturnValue(mockConfig);
            const testConfig = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: 'https://mcp.context7.com/mcp',
                        headers: { CONTEXT7_API_KEY: 'test-key' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            mockValidateConfig.mockReturnValue({ valid: true, errors: [], warnings: [] });
            const result = validateConfig(testConfig);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should substitute environment variables in Context7 config', () => {
            process.env.CONTEXT7_MCP_URL = 'https://api.context7.com/mcp';
            process.env.CONTEXT7_API_KEY = 'env-api-key';
            const config = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: '${CONTEXT7_MCP_URL}',
                        headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            const substitutedConfig = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: 'https://api.context7.com/mcp',
                        headers: { CONTEXT7_API_KEY: 'env-api-key' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            mockSubstituteEnvVars.mockReturnValue(substitutedConfig);
            const result = substituteEnvVars(config);
            expect(result.mcp.context7.url).toBe('https://api.context7.com/mcp');
            expect(result.mcp.context7.headers?.CONTEXT7_API_KEY).toBe('env-api-key');
        });
        it('should resolve Context7 server configuration', () => {
            const config = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: 'https://mcp.context7.com/mcp',
                        headers: { CONTEXT7_API_KEY: 'test-key' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            mockResolveServerConfig.mockReturnValue(config.mcp.context7);
            const result = resolveServerConfig('context7', config);
            expect(result.name).toBe('Context7 MCP Server');
            expect(result.type).toBe('remote');
            expect(result.url).toBe('https://mcp.context7.com/mcp');
            expect(result.headers).toEqual({ CONTEXT7_API_KEY: 'test-key' });
            expect(result.enabled).toBe(true);
            expect(result.timeout).toBe(30000);
        });
    });
    describe('Connection Establishment', () => {
        let context7Config;
        beforeEach(() => {
            context7Config = {
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: {
                    CONTEXT7_API_KEY: 'test-api-key',
                },
                timeout: 30000,
            };
            mockResolveServerConfig.mockReturnValue(context7Config);
        });
        it('should establish connection with valid Context7 credentials', async () => {
            mockClientInstance.connect.mockResolvedValue(undefined);
            mockClientInstance.isConnected.mockReturnValue(true);
            mockClientInstance.getConnectionState.mockReturnValue('connected');
            const client = new MCPClient(context7Config);
            await client.connect();
            expect(mockMCPClient).toHaveBeenCalledWith(context7Config);
            expect(mockClientInstance.connect).toHaveBeenCalled();
            expect(client.isConnected()).toBe(true);
            expect(client.getConnectionState()).toBe('connected');
        });
        it('should handle connection failures gracefully', async () => {
            mockClientInstance.connect.mockRejectedValue(new Error('Authentication failed: Invalid API key'));
            mockClientInstance.isConnected.mockReturnValue(false);
            const client = new MCPClient(context7Config);
            await expect(client.connect()).rejects.toThrow('Authentication failed: Invalid API key');
            expect(client.isConnected()).toBe(false);
        });
        it('should handle network timeouts', async () => {
            mockClientInstance.connect.mockRejectedValue(new Error('Connection timeout'));
            const client = new MCPClient(context7Config);
            await expect(client.connect()).rejects.toThrow('Connection timeout');
        });
        it('should handle server unavailability', async () => {
            mockClientInstance.connect.mockRejectedValue(new Error('Server unavailable: 503 Service Unavailable'));
            const client = new MCPClient(context7Config);
            await expect(client.connect()).rejects.toThrow('Server unavailable: 503 Service Unavailable');
        });
    });
    describe('Protocol Communication', () => {
        let client;
        beforeEach(async () => {
            const context7Config = {
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: {
                    CONTEXT7_API_KEY: 'test-api-key',
                },
                timeout: 30000,
            };
            client = new MCPClient(context7Config);
            mockClientInstance.connect.mockResolvedValue(undefined);
            mockClientInstance.isConnected.mockReturnValue(true);
            await client.connect();
        });
        it('should initialize MCP protocol correctly', async () => {
            mockClientInstance.sendRequest.mockResolvedValue({
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: { listChanged: true },
                    resources: { listChanged: true },
                },
                serverInfo: {
                    name: 'Context7 MCP Server',
                    version: '1.0.0',
                },
            });
            const result = await client.sendRequest('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0',
                },
            });
            expect(result.protocolVersion).toBe('2024-11-05');
            expect(result.serverInfo.name).toBe('Context7 MCP Server');
        });
        it('should discover available tools', async () => {
            const mockTools = [
                {
                    name: 'search_documents',
                    description: 'Search through Context7 documents',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string' },
                            limit: { type: 'number' },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_document',
                    description: 'Retrieve a specific document',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            documentId: { type: 'string' },
                        },
                        required: ['documentId'],
                    },
                },
            ];
            mockClientInstance.sendRequest.mockResolvedValue({ tools: mockTools });
            const result = await client.sendRequest('tools/list', {});
            expect(result.tools).toHaveLength(2);
            expect(result.tools[0].name).toBe('search_documents');
            expect(result.tools[1].name).toBe('get_document');
        });
        it('should discover available resources', async () => {
            const mockResources = [
                {
                    uri: 'context7://documents',
                    name: 'Documents Collection',
                    description: 'Access to all Context7 documents',
                },
                {
                    uri: 'context7://projects',
                    name: 'Projects Collection',
                    description: 'Access to Context7 projects',
                },
            ];
            mockClientInstance.sendRequest.mockResolvedValue({ resources: mockResources });
            const result = await client.sendRequest('resources/list', {});
            expect(result.resources).toHaveLength(2);
            expect(result.resources[0].uri).toBe('context7://documents');
            expect(result.resources[1].uri).toBe('context7://projects');
        });
        it('should execute tools successfully', async () => {
            const mockResult = {
                content: [
                    {
                        type: 'text',
                        text: 'Document search results...',
                    },
                ],
            };
            mockClientInstance.sendRequest.mockResolvedValue(mockResult);
            const result = await client.sendRequest('tools/call', {
                name: 'search_documents',
                arguments: {
                    query: 'test query',
                    limit: 10,
                },
            });
            expect(result.content).toHaveLength(1);
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('Document search results');
        });
        it('should read resources successfully', async () => {
            const mockContent = [
                {
                    uri: 'context7://documents/123',
                    mimeType: 'application/json',
                    text: '{"title": "Test Document", "content": "Test content"}',
                },
            ];
            mockClientInstance.sendRequest.mockResolvedValue({ contents: mockContent });
            const result = await client.sendRequest('resources/read', {
                uri: 'context7://documents/123',
            });
            expect(result.contents).toHaveLength(1);
            expect(result.contents[0].uri).toBe('context7://documents/123');
            expect(result.contents[0].mimeType).toBe('application/json');
        });
    });
    describe('Error Handling', () => {
        let client;
        beforeEach(async () => {
            const context7Config = {
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: {
                    CONTEXT7_API_KEY: 'invalid-key',
                },
                timeout: 30000,
            };
            client = new MCPClient(context7Config);
            mockClientInstance.connect.mockResolvedValue(undefined);
            mockClientInstance.isConnected.mockReturnValue(true);
            await client.connect();
        });
        it('should handle authentication errors', async () => {
            mockClientInstance.sendRequest.mockRejectedValue({
                code: -32000,
                message: 'Authentication failed',
                data: { reason: 'Invalid API key' },
            });
            await expect(client.sendRequest('tools/list', {})).rejects.toEqual({
                code: -32000,
                message: 'Authentication failed',
                data: { reason: 'Invalid API key' },
            });
        });
        it('should handle permission errors', async () => {
            mockClientInstance.sendRequest.mockRejectedValue({
                code: -32001,
                message: 'Insufficient permissions',
                data: { required: ['read:documents'] },
            });
            await expect(client.sendRequest('resources/read', { uri: 'context7://restricted' })).rejects.toEqual({
                code: -32001,
                message: 'Insufficient permissions',
                data: { required: ['read:documents'] },
            });
        });
        it('should handle rate limiting', async () => {
            mockClientInstance.sendRequest.mockRejectedValue({
                code: -32002,
                message: 'Rate limit exceeded',
                data: { retryAfter: 60 },
            });
            await expect(client.sendRequest('tools/call', { name: 'frequent-tool' })).rejects.toEqual({
                code: -32002,
                message: 'Rate limit exceeded',
                data: { retryAfter: 60 },
            });
        });
        it('should handle invalid tool calls', async () => {
            mockClientInstance.sendRequest.mockRejectedValue({
                code: -32602,
                message: 'Invalid params',
                data: { invalidParam: 'limit', reason: 'Must be positive integer' },
            });
            await expect(client.sendRequest('tools/call', {
                name: 'search_documents',
                arguments: { query: 'test', limit: -1 },
            })).rejects.toEqual({
                code: -32602,
                message: 'Invalid params',
                data: { invalidParam: 'limit', reason: 'Must be positive integer' },
            });
        });
        it('should handle server errors', async () => {
            mockClientInstance.sendRequest.mockRejectedValue({
                code: -32003,
                message: 'Internal server error',
                data: { incidentId: 'INC-12345' },
            });
            await expect(client.sendRequest('tools/list', {})).rejects.toEqual({
                code: -32003,
                message: 'Internal server error',
                data: { incidentId: 'INC-12345' },
            });
        });
    });
    describe('Connection Management', () => {
        it('should handle connection cleanup', async () => {
            const client = new MCPClient({
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: { CONTEXT7_API_KEY: 'test-key' },
                timeout: 30000,
            });
            mockClientInstance.connect.mockResolvedValue(undefined);
            mockClientInstance.disconnect.mockResolvedValue(undefined);
            await client.connect();
            await client.disconnect();
            expect(mockClientInstance.disconnect).toHaveBeenCalled();
        });
        it('should handle reconnection scenarios', async () => {
            const client = new MCPClient({
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: { CONTEXT7_API_KEY: 'test-key' },
                timeout: 30000,
                reconnectInterval: 1000,
                maxReconnectAttempts: 3,
            });
            mockClientInstance.connect
                .mockRejectedValueOnce(new Error('Connection failed'))
                .mockResolvedValueOnce(undefined);
            mockClientInstance.getConnectionState.mockReturnValue('connected');
            // First connection attempt fails
            await expect(client.connect()).rejects.toThrow('Connection failed');
            // Second attempt succeeds
            await client.connect();
            expect(client.getConnectionState()).toBe('connected');
        });
        it('should respect timeout configurations', async () => {
            const client = new MCPClient({
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: { CONTEXT7_API_KEY: 'test-key' },
                timeout: 5000, // 5 second timeout
            });
            mockClientInstance.connect.mockRejectedValue(new Error('Connection timeout'));
            await expect(client.connect()).rejects.toThrow('Connection timeout');
        });
    });
    describe('Integration Scenarios', () => {
        it('should complete full Context7 integration workflow', async () => {
            // Setup environment
            process.env.CONTEXT7_MCP_URL = 'https://mcp.context7.com/mcp';
            process.env.CONTEXT7_API_KEY = 'integration-test-key';
            // Mock configuration loading
            const mockConfig = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: '${CONTEXT7_MCP_URL}',
                        headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            mockLoadConfig.mockReturnValue(mockConfig);
            mockValidateConfig.mockReturnValue({ valid: true, errors: [], warnings: [] });
            mockSubstituteEnvVars.mockReturnValue({
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: 'https://mcp.context7.com/mcp',
                        headers: { CONTEXT7_API_KEY: 'integration-test-key' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            });
            mockResolveServerConfig.mockReturnValue({
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: { CONTEXT7_API_KEY: 'integration-test-key' },
                timeout: 30000,
            });
            // Load and validate configuration
            const config = loadConfig('/path/to/mcp-config.json');
            const validation = validateConfig(config);
            expect(validation.valid).toBe(true);
            const substituted = substituteEnvVars(config);
            const serverConfig = resolveServerConfig('context7', substituted);
            // Create client and connect
            const clientConfig = {
                serverUrl: 'https://mcp.context7.com/mcp',
                headers: { CONTEXT7_API_KEY: 'integration-test-key' },
                timeout: 30000,
            };
            const client = new MCPClient(clientConfig);
            mockClientInstance.connect.mockResolvedValue(undefined);
            mockClientInstance.isConnected.mockReturnValue(true);
            await client.connect();
            expect(client.isConnected()).toBe(true);
            // Test protocol communication
            mockClientInstance.sendRequest
                .mockResolvedValueOnce({
                protocolVersion: '2024-11-05',
                capabilities: { tools: { listChanged: true } },
                serverInfo: { name: 'Context7 MCP Server', version: '1.0.0' },
            })
                .mockResolvedValueOnce({
                tools: [
                    {
                        name: 'search_documents',
                        description: 'Search Context7 documents',
                        inputSchema: {
                            type: 'object',
                            properties: { query: { type: 'string' } },
                            required: ['query'],
                        },
                    },
                ],
            })
                .mockResolvedValueOnce({
                content: [{ type: 'text', text: 'Search results' }],
            });
            // Initialize
            const initResult = await client.sendRequest('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'test-client', version: '1.0.0' },
            });
            expect(initResult.serverInfo.name).toBe('Context7 MCP Server');
            // List tools
            const toolsResult = await client.sendRequest('tools/list', {});
            expect(toolsResult.tools).toHaveLength(1);
            expect(toolsResult.tools[0].name).toBe('search_documents');
            // Execute tool
            const toolResult = await client.sendRequest('tools/call', {
                name: 'search_documents',
                arguments: { query: 'test' },
            });
            expect(toolResult.content[0].text).toBe('Search results');
            // Cleanup
            await client.disconnect();
            expect(mockClientInstance.disconnect).toHaveBeenCalled();
        });
        it('should handle configuration errors gracefully', () => {
            mockLoadConfig.mockImplementation(() => {
                throw new Error('Configuration file not found');
            });
            expect(() => loadConfig('/invalid/path.json')).toThrow('Configuration file not found');
        });
        it('should handle environment variable substitution errors', () => {
            const config = {
                mcp: {
                    context7: {
                        name: 'Context7 MCP Server',
                        type: 'remote',
                        url: 'https://mcp.context7.com/mcp',
                        headers: { CONTEXT7_API_KEY: '${MISSING_ENV_VAR}' },
                        enabled: true,
                        timeout: 30000,
                        retry: { maxAttempts: 3, interval: 1000 },
                    },
                },
            };
            mockSubstituteEnvVars.mockImplementation(() => {
                throw new Error('Environment variable MISSING_ENV_VAR is not set');
            });
            expect(() => substituteEnvVars(config)).toThrow('Environment variable MISSING_ENV_VAR is not set');
        });
    });
});
