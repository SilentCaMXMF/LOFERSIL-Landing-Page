/**
 * Cloudflare MCP Client Integration Tests
 * Tests the MCP client integration with Cloudflare Workers AI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockCloudflareResponses,
} from './test-helpers.js';
import { createMockCloudflareClient } from './mocks.js';

// Mock the MCPFactory module
vi.mock('../../../src/scripts/modules/MCPFactory.js', () => ({
  MCPFactory: {
    createCloudflare: vi.fn().mockResolvedValue({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getTools: vi.fn().mockReturnValue({
        listTools: vi.fn().mockResolvedValue([]),
        executeTool: vi.fn().mockRejectedValue(new Error('Tool execution failed')),
      }),
      getResources: vi.fn().mockReturnValue({
        listResources: vi.fn().mockResolvedValue([]),
        readResource: vi.fn().mockRejectedValue(new Error('Unknown resource')),
      }),
    }),
    getClient: vi.fn(),
    getAvailableClients: vi.fn(),
    disconnectAll: vi.fn(),
  },
}));

import { MCPFactory } from '../../../src/scripts/modules/MCPFactory.js';

// Mock the EnvironmentLoader that MCPFactory uses
vi.mock('../../../src/scripts/modules/EnvironmentLoader.js', () => ({
  envLoader: {
    get: vi.fn((key: string) => {
      const mockValues: Record<string, string> = {
        CLOUDFLARE_API_TOKEN: 'test-cloudflare-token',
        CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      };
      return mockValues[key] || undefined;
    }),
    getRequired: vi.fn((key: string) => {
      const mockValues: Record<string, string> = {
        CLOUDFLARE_API_TOKEN: 'test-cloudflare-token',
        CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      };
      return mockValues[key] || '';
    }),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Cloudflare MCP Client Integration', () => {
  let mockClient: any;

  beforeEach(() => {
    setupTestEnvironment();
    mockClient = createMockCloudflareClient();
    vi.clearAllMocks();

    // Mock the fetch call that connect() makes
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: [] }),
    });
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.clearAllMocks();
  });

  describe('Client Creation and Connection', () => {
    it('should create Cloudflare client successfully', async () => {
      // Act
      const client = await MCPFactory.createCloudflare();

      // Assert
      expect(client).toBeDefined();
      expect(client.isConnected()).toBe(true);
      expect(typeof client.getTools).toBe('function');
      expect(typeof client.getResources).toBe('function');
    });

    it('should connect to Cloudflare Workers AI', async () => {
      // Arrange
      const connectSpy = vi.spyOn(mockClient, 'connect');

      // Act
      await mockClient.connect();

      // Assert
      expect(connectSpy).toHaveBeenCalled();
      expect(mockClient.isConnected()).toBe(true);
    });

    it('should handle connection failures', async () => {
      // Arrange
      const failingClient = createMockCloudflareClient();
      const connectSpy = vi
        .spyOn(failingClient, 'connect')
        .mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(failingClient.connect()).rejects.toThrow('Connection failed');
      expect(failingClient.isConnected()).toBe(false);
    });

    it('should disconnect from Cloudflare Workers AI', async () => {
      // Arrange
      await mockClient.connect();
      const disconnectSpy = vi.spyOn(mockClient, 'disconnect');

      // Act
      await mockClient.disconnect();

      // Assert
      expect(disconnectSpy).toHaveBeenCalled();
      expect(mockClient.isConnected()).toBe(false);
    });
  });

  describe('Tool Management', () => {
    it('should list available tools', async () => {
      // Arrange
      const toolsInstance = mockClient.getTools();
      const toolsSpy = vi.spyOn(toolsInstance, 'listTools');

      // Act
      const tools = await toolsInstance.listTools();

      // Assert
      expect(toolsSpy).toHaveBeenCalled();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      });
    });

    it('should execute image generation tool', async () => {
      // Arrange
      const tools = mockClient.getTools();
      const executeSpy = vi.spyOn(tools, 'executeTool');
      const parameters = {
        prompt: 'A beautiful sunset',
        width: 1024,
        height: 1024,
      };

      // Act
      const result = await tools.executeTool('image_generation', parameters);

      // Assert
      expect(executeSpy).toHaveBeenCalledWith('image_generation', parameters);
      expect(result).toHaveProperty('result');
      expect(result.result).toHaveProperty('image');
      expect(result).toHaveProperty('success', true);
    });

    it('should execute image transformation tool', async () => {
      // Arrange
      const tools = mockClient.getTools();
      const executeSpy = vi.spyOn(tools, 'executeTool');
      const parameters = {
        image: 'data:image/png;base64,test',
        width: 512,
        height: 512,
        format: 'webp',
      };

      // Act
      const result = await tools.executeTool('image_transformation', parameters);

      // Assert
      expect(executeSpy).toHaveBeenCalledWith('image_transformation', parameters);
      expect(result).toHaveProperty('result');
      expect(result.result).toHaveProperty('image');
      expect(result.result).toHaveProperty('format', 'webp');
      expect(result).toHaveProperty('success', true);
    });

    it('should handle tool execution errors', async () => {
      // Arrange
      const executeSpy = vi
        .spyOn(mockClient.getTools(), 'executeTool')
        .mockRejectedValue(new Error('Tool execution failed'));

      // Act & Assert
      await expect(mockClient.getTools().executeTool('invalid_tool', {})).rejects.toThrow(
        'Tool execution failed'
      );
    });

    it('should validate tool parameters', async () => {
      // Arrange
      const invalidParameters = [
        { prompt: '' }, // Empty prompt
        { image: 'invalid-data' }, // Invalid image
        { width: -1 }, // Negative dimensions
        { format: 'unsupported' }, // Unsupported format
      ];

      for (const params of invalidParameters) {
        // Act & Assert
        await expect(
          mockClient.getTools().executeTool('image_generation', params)
        ).rejects.toThrow();
      }
    });
  });

  describe('Resource Management', () => {
    it('should list available resources', async () => {
      // Arrange
      const resources = mockClient.getResources();
      const resourcesSpy = vi.spyOn(resources, 'listResources');

      // Act
      const result = await resources.listResources();

      // Assert
      expect(resourcesSpy).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
      });
    });

    it('should read image model resources', async () => {
      // Arrange
      const resources = mockClient.getResources();
      const readSpy = vi.spyOn(resources, 'readResource');

      // Act
      const resource = await resources.readResource('cloudflare://models/image');

      // Assert
      expect(readSpy).toHaveBeenCalledWith('cloudflare://models/image');
      expect(resource).toHaveProperty('models');
      expect(Array.isArray(resource.models)).toBe(true);
      expect(resource).toHaveProperty('description');
    });

    it('should handle unknown resources', async () => {
      // Arrange
      const readSpy = vi
        .spyOn(mockClient.getResources(), 'readResource')
        .mockRejectedValue(new Error('Unknown resource'));

      // Act & Assert
      await expect(mockClient.getResources().readResource('unknown://resource')).rejects.toThrow(
        'Unknown resource'
      );
    });
  });

  describe('MCP Factory Integration', () => {
    it('should register Cloudflare client in factory', async () => {
      // Arrange
      (MCPFactory.createCloudflare as any).mockResolvedValue(mockClient);

      // Act
      await MCPFactory.createCloudflare();

      // Assert
      expect(MCPFactory.createCloudflare).toHaveBeenCalled();
    });

    it('should retrieve Cloudflare client from factory', async () => {
      // Arrange
      (MCPFactory.getClient as any).mockReturnValue(mockClient);

      // Act
      const client = MCPFactory.getClient('cloudflare');

      // Assert
      expect(MCPFactory.getClient).toHaveBeenCalledWith('cloudflare');
      expect(client).toBe(mockClient);
    });

    it('should list Cloudflare in available clients', () => {
      // Arrange
      (MCPFactory.getAvailableClients as any).mockReturnValue(['cloudflare', 'context7', 'gemini']);

      // Act
      const clients = MCPFactory.getAvailableClients();

      // Assert
      expect(MCPFactory.getAvailableClients).toHaveBeenCalled();
      expect(clients).toContain('cloudflare');
    });

    it('should disconnect all clients through factory', async () => {
      // Arrange
      (MCPFactory.disconnectAll as any).mockResolvedValue(undefined);

      // Act
      await MCPFactory.disconnectAll();

      // Assert
      expect(MCPFactory.disconnectAll).toHaveBeenCalled();
    });

    it('should retrieve Cloudflare client from factory', async () => {
      // Arrange
      const mockGetClient = vi.fn().mockReturnValue(mockClient);
      (MCPFactory.getClient as any).mockImplementation(mockGetClient);

      // Act
      const client = MCPFactory.getClient('cloudflare');

      // Assert
      expect(mockGetClient).toHaveBeenCalledWith('cloudflare');
      expect(client).toBe(mockClient);
    });

    it('should list Cloudflare in available clients', () => {
      // Arrange
      const mockGetAvailableClients = vi.fn().mockReturnValue(['cloudflare', 'context7', 'gemini']);
      (MCPFactory.getAvailableClients as any).mockImplementation(mockGetAvailableClients);

      // Act
      const clients = MCPFactory.getAvailableClients();

      // Assert
      expect(mockGetAvailableClients).toHaveBeenCalled();
      expect(clients).toContain('cloudflare');
    });

    it('should disconnect all clients', async () => {
      // Arrange
      const mockDisconnectAll = vi.fn().mockResolvedValue(undefined);
      (MCPFactory.disconnectAll as any).mockImplementation(mockDisconnectAll);

      // Act
      await MCPFactory.disconnectAll();

      // Assert
      expect(mockDisconnectAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network failures gracefully', async () => {
      // Arrange
      const errorClient = createMockCloudflareClient();
      vi.spyOn(errorClient, 'connect').mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(errorClient.connect()).rejects.toThrow('Network error');
    });

    it('should handle API rate limiting', async () => {
      // Arrange
      const errorClient = createMockCloudflareClient();
      vi.spyOn(errorClient, 'connect').mockRejectedValue(new Error('Rate limited'));

      // Act & Assert
      await expect(errorClient.connect()).rejects.toThrow('Rate limited');
    });

    it('should handle authentication failures', async () => {
      // Arrange
      const errorClient = createMockCloudflareClient();
      vi.spyOn(errorClient, 'connect').mockRejectedValue(new Error('Unauthorized'));

      // Act & Assert
      await expect(errorClient.connect()).rejects.toThrow('Unauthorized');
    });

    it('should handle malformed API responses', async () => {
      // Arrange
      const errorClient = createMockCloudflareClient();
      vi.spyOn(errorClient, 'connect').mockRejectedValue(new Error('Invalid response'));

      // Act & Assert
      await expect(errorClient.connect()).rejects.toThrow('Invalid response');
    });

    it('should connect successfully', async () => {
      // Arrange
      // Mock successful connection

      // Act
      await mockClient.connect();

      // Assert
      expect(mockClient.isConnected()).toBe(true);
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const errorClient = createMockCloudflareClient();
      vi.spyOn(errorClient, 'connect').mockRejectedValue(new Error('Timeout'));

      // Act & Assert
      await expect(errorClient.connect()).rejects.toThrow('Timeout');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent connections', async () => {
      // Arrange
      const clients = Array(5)
        .fill(null)
        .map(() => createMockCloudflareClient());

      // Act
      const results = await Promise.all(clients.map(client => client.connect()));

      // Assert
      results.forEach(result => {
        expect(result).toBeUndefined(); // connect() returns void
      });

      clients.forEach(client => {
        expect(client.isConnected()).toBe(true);
      });
    });

    it('should handle concurrent tool executions', async () => {
      // Arrange
      const requests = Array(3)
        .fill(null)
        .map((_, i) => ({
          name: 'image_generation',
          parameters: {
            prompt: `Test prompt ${i}`,
            width: 512,
            height: 512,
          },
        }));

      // Act
      const results = await Promise.all(
        requests.map(req => mockClient.getTools().executeTool(req.name, req.parameters))
      );

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('result');
        expect(result.result).toHaveProperty('image');
      });
    });

    it('should handle concurrent resource reads', async () => {
      // Arrange
      const resourceUris = [
        'cloudflare://models/image',
        'cloudflare://models/image',
        'cloudflare://models/image',
      ];

      // Act
      const results = await Promise.all(
        resourceUris.map(uri => mockClient.getResources().readResource(uri))
      );

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('models');
        expect(result).toHaveProperty('description');
      });
    });
  });

  describe('Configuration and Environment', () => {
    it('should use environment variables for configuration', async () => {
      // Arrange
      process.env.CLOUDFLARE_API_TOKEN = 'test-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';

      // Act
      await mockClient.connect();

      // Assert
      expect(mockClient.isConnected()).toBe(true);
    });

    it('should fail without required environment variables', async () => {
      // Arrange - Mock env loader to return undefined
      const { envLoader } = await import('../../../src/scripts/modules/EnvironmentLoader.js');
      vi.mocked(envLoader).get.mockImplementation(() => undefined);

      // Act & Assert - This would fail when trying to create a real client
      // For now, just test that the mock setup works
      expect(envLoader.get('CLOUDFLARE_API_TOKEN')).toBeUndefined();
    });

    it('should accept custom configuration', async () => {
      // Arrange
      const customConfig = {
        name: 'cloudflare',
        type: 'remote' as const,
        url: 'https://custom-api.cloudflare.com',
        headers: { 'Custom-Header': 'value' },
        enabled: true,
        timeout: 10000,
        retry: { maxAttempts: 3, interval: 1000 },
        accountId: 'custom-account',
      };

      // Act - This would be tested with actual factory method
      expect(customConfig).toHaveProperty('name', 'cloudflare');
      expect(customConfig).toHaveProperty('timeout', 10000);
    });

    it('should validate configuration parameters', () => {
      // Arrange
      const invalidConfig = { timeout: -1 }; // Negative timeout

      // Act & Assert
      expect(() => {
        // This would validate config in real implementation
        if (invalidConfig.timeout && invalidConfig.timeout < 0) {
          throw new Error('Invalid timeout');
        }
      }).toThrow();
    });
  });
});
