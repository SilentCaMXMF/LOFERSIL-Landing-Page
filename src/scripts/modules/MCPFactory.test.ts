/**
 * MCPFactory Tests
 * Test suite for the MCPFactory module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPFactory } from './MCPFactory.js';

// Mock fetch
global.fetch = vi.fn();

describe('MCPFactory', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = global.fetch as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cloudflare Client Creation', () => {
    it('should create Cloudflare client successfully', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      // Set required environment variables
      process.env.CLOUDFLARE_API_TOKEN = 'test-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';

      const client = await MCPFactory.createCloudflare();
      expect(client).toBeDefined();
      expect(client.isConnected()).toBe(true);
    });

    it('should throw error when Cloudflare credentials are missing', async () => {
      // Clear environment variables
      delete process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.CLOUDFLARE_ACCOUNT_ID;

      await expect(MCPFactory.createCloudflare()).rejects.toThrow(
        'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required'
      );
    });

    it('should throw error when API connection fails', async () => {
      // Mock failed API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      process.env.CLOUDFLARE_API_TOKEN = 'test-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';

      await expect(MCPFactory.createCloudflare()).rejects.toThrow(
        'Failed to connect to Cloudflare Workers AI'
      );
    });
  });

  describe('Available Clients', () => {
    it('should return list of available MCP clients', () => {
      const clients = MCPFactory.getAvailableClients();
      expect(clients).toContain('cloudflare');
      expect(clients).toContain('context7');
      expect(clients).toContain('gemini');
      expect(clients).toContain('local-dev');
    });
  });

  describe('Client Management', () => {
    it('should get client by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      process.env.CLOUDFLARE_API_TOKEN = 'test-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';

      await MCPFactory.createCloudflare();
      const client = MCPFactory.getClient('cloudflare');
      expect(client).toBeDefined();
      expect(client?.isConnected()).toBe(true);
    });

    it('should return undefined for non-existent client', () => {
      const client = MCPFactory.getClient('non-existent');
      expect(client).toBeUndefined();
    });

    it('should disconnect all clients', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      process.env.CLOUDFLARE_API_TOKEN = 'test-token';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';

      const client = await MCPFactory.createCloudflare();
      expect(client.isConnected()).toBe(true);

      await MCPFactory.disconnectAll();
      expect(client.isConnected()).toBe(false);
    });
  });
});
