/**
 * MCP Client Header Functionality Tests
 *
 * Tests for header-based authentication and custom headers in MCP client
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPClient } from './client.js';
import type { MCPClientConfig } from './types.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('MCP Client Header Functionality', () => {
  let client: MCPClient;
  let config: MCPClientConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      serverUrl: 'https://mcp.context7.com/mcp',
      headers: {
        CONTEXT7_API_KEY: 'test-api-key',
        'X-Custom-Header': 'custom-value',
      },
      timeout: 10000,
    };

    client = new MCPClient(config);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Header Masking', () => {
    it('should mask sensitive headers in logs', () => {
      const headers = {
        Authorization: 'Bearer secret-token',
        'API-Key': 'sensitive-key',
        'X-API-Token': 'another-secret',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Test the private maskHeaders method indirectly through connection
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // This should trigger header masking in the connectHTTP method
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ result: {} }),
      });

      client.connect();

      // Verify that sensitive headers are masked in console output
      expect(consoleSpy).toHaveBeenCalledWith(
        'Initializing MCP connection with headers:',
        expect.objectContaining({
          CONTEXT7_API_KEY: 'test****',
          'X-Custom-Header': 'custom-value',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not mask non-sensitive headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'test-client',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      config.headers = headers;
      client = new MCPClient(config);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ result: {} }),
      });

      client.connect();

      // Verify that non-sensitive headers are not masked
      expect(consoleSpy).toHaveBeenCalledWith(
        'Initializing MCP connection with headers:',
        expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'test-client',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('HTTP-based Connection with Headers', () => {
    it('should use headers in HTTP initialization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            CONTEXT7_API_KEY: 'test-api-key',
            'X-Custom-Header': 'custom-value',
          }),
          body: expect.any(String),
        })
      );

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
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
      });
    });

    it('should handle HTTP connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.connect()).rejects.toThrow('Network error');
    });

    it('should handle HTTP response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.connect()).rejects.toThrow(
        'HTTP initialization failed: 401 Unauthorized'
      );
    });

    it('should handle MCP protocol errors in HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          error: {
            code: -32000,
            message: 'Authentication failed',
          },
        }),
      });

      await expect(client.connect()).rejects.toThrow(
        'MCP initialization error: Authentication failed'
      );
    });
  });

  describe('Request Sending with Headers', () => {
    beforeEach(async () => {
      // Setup successful connection first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();
      mockFetch.mockClear();
    });

    it('should include headers in tool execution requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: expect.any(String),
          result: { success: true },
        }),
      });

      await client.sendRequest('tools/call', {
        name: 'test-tool',
        arguments: { param: 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            CONTEXT7_API_KEY: 'test-api-key',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should handle request timeouts', async () => {
      config.timeout = 1000;
      client = new MCPClient(config);

      // Setup for connect
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();
      mockFetch.mockClear();

      // Setup for sendRequest timeout
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(client.sendRequest('tools/call', { name: 'test-tool' })).rejects.toMatchObject({
        code: -32002,
        message: 'HTTP request failed',
      });
    });

    it('should handle HTTP request errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.sendRequest('tools/call', { name: 'test-tool' })).rejects.toMatchObject({
        code: -32002,
        message: 'HTTP request failed',
      });
    });

    it('should handle MCP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: expect.any(String),
          error: {
            code: -32601,
            message: 'Method not found',
          },
        }),
      });

      await expect(client.sendRequest('invalid/method', {})).rejects.toMatchObject({
        code: -32002,
        message: 'HTTP request failed',
        data: {
          code: -32601,
          message: 'Method not found',
        },
      });
    });
  });

  describe('Environment Variable Integration', () => {
    it('should work with environment variable substituted headers', async () => {
      // Simulate environment variable substitution
      vi.stubEnv('CONTEXT7_API_KEY', 'env-api-key');

      const envConfig: MCPClientConfig = {
        serverUrl: 'https://mcp.context7.com/mcp',
        headers: {
          CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || 'default-key',
          'X-Environment': 'test',
        },
        timeout: 10000,
      };

      client = new MCPClient(envConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            CONTEXT7_API_KEY: 'env-api-key',
            'X-Environment': 'test',
          }),
        })
      );

      vi.unstubAllEnvs();
    });

    it('should handle missing environment variables gracefully', async () => {
      const envConfig: MCPClientConfig = {
        serverUrl: 'https://mcp.context7.com/mcp',
        headers: {
          'X-Optional-Header': process.env.MISSING_VAR || 'default-value',
        },
        timeout: 10000,
      };

      client = new MCPClient(envConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Optional-Header': 'default-value',
          }),
        })
      );
    });
  });

  describe('Header Security', () => {
    it('should not log sensitive header values in plain text', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const secureConfig: MCPClientConfig = {
        serverUrl: 'https://mcp.context7.com/mcp',
        headers: {
          Authorization: 'Bearer very-secret-token-12345',
          'API-Key': 'super-sensitive-api-key-67890',
          'X-Auth-Token': 'another-secret-value',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      };

      client = new MCPClient(secureConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();

      // Check that logs contain masked versions
      expect(consoleSpy).toHaveBeenCalledWith(
        'Initializing MCP connection with headers:',
        expect.objectContaining({
          Authorization: 'Bear****',
          'API-Key': 'supe****',
          'X-Auth-Token': 'anot****',
          'Content-Type': 'application/json',
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith('MCP HTTP initialized successfully');

      consoleSpy.mockRestore();
    });

    it('should handle empty headers object', async () => {
      const emptyHeadersConfig: MCPClientConfig = {
        serverUrl: 'https://mcp.context7.com/mcp',
        headers: {},
        timeout: 10000,
      };

      client = new MCPClient(emptyHeadersConfig);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 'init',
          result: { capabilities: {} },
        }),
      });

      await client.connect();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});
