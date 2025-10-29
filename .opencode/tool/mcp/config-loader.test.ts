/**
 * MCP Configuration Loader Tests
 *
 * Tests for loading, validating, and processing MCP configuration files
 * with environment variable substitution and header-based authentication.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import {
  loadConfig,
  validateConfig,
  substituteEnvVars,
  resolveServerConfig,
  MCPConfigFile,
  ValidationResult,
} from './config-loader.js';
import type { MCPConfig } from './types.js';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

// Mock process.env
const originalEnv = process.env;

describe('MCP Configuration Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load and parse valid JSON configuration', () => {
      const mockConfig: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      (readFileSync as any).mockReturnValue(JSON.stringify(mockConfig));

      const result = loadConfig('/path/to/config.json');

      expect(result).toEqual(mockConfig);
      expect(readFileSync).toHaveBeenCalledWith('/path/to/config.json', 'utf-8');
    });

    it('should throw error for invalid JSON', () => {
      (readFileSync as any).mockReturnValue('invalid json');

      expect(() => loadConfig('/path/to/config.json')).toThrow(
        'Failed to load config from /path/to/config.json'
      );
    });

    it('should throw error when file does not exist', () => {
      (readFileSync as any).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => loadConfig('/path/to/config.json')).toThrow(
        'Failed to load config from /path/to/config.json: File not found'
      );
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without mcp section', () => {
      const config = {} as MCPConfigFile;

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "mcp" section');
    });

    it('should reject server without type', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: '' as any,
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server "context7": missing or invalid "type"');
    });

    it('should reject server without url', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: '',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server "context7": missing or invalid "url"');
    });

    it('should reject server with invalid enabled flag', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: 'true' as any,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server "context7": missing or invalid "enabled"');
    });

    it('should reject server with invalid headers', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: 'invalid' as any,
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server "context7": invalid "headers"');
    });

    it('should reject server with invalid timeout', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: '10000' as any,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server "context7": invalid "timeout"');
    });

    it('should reject server with invalid retry configuration', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: 'invalid' as any,
          } as MCPConfig,
        },
      };

      const result: ValidationResult = validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Server "context7": invalid "retry"');
    });
  });

  describe('substituteEnvVars', () => {
    it('should substitute environment variables in strings', () => {
      process.env.CONTEXT7_API_KEY = 'secret-key';
      process.env.CONTEXT7_URL = 'https://api.context7.com';

      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: '${CONTEXT7_URL}/mcp',
            headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result = substituteEnvVars(config);

      expect(result.mcp.context7.url).toBe('https://api.context7.com/mcp');
      expect(result.mcp.context7.headers?.CONTEXT7_API_KEY).toBe('secret-key');
    });

    it('should substitute environment variables in nested objects', () => {
      process.env.MAX_ATTEMPTS = '5';
      process.env.RETRY_INTERVAL = '2000';

      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: {
              maxAttempts: '${MAX_ATTEMPTS}' as any,
              interval: '${RETRY_INTERVAL}' as any,
            },
          } as MCPConfig,
        },
      };

      const result = substituteEnvVars(config);

      expect(result.mcp.context7.retry?.maxAttempts).toBe('5');
      expect(result.mcp.context7.retry?.interval).toBe('2000');
    });

    it('should substitute environment variables in arrays', () => {
      process.env.HEADER_VALUE = 'header-value';

      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { 'X-Custom': '${HEADER_VALUE}' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result = substituteEnvVars(config);

      expect(result.mcp.context7.headers?.['X-Custom']).toBe('header-value');
    });

    it('should throw error for undefined environment variables', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: '${UNDEFINED_VAR}' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      expect(() => substituteEnvVars(config)).toThrow(
        'Environment variable UNDEFINED_VAR is not set'
      );
    });

    it('should handle non-string values without substitution', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result = substituteEnvVars(config);

      expect(result.mcp.context7.enabled).toBe(true);
      expect(result.mcp.context7.timeout).toBe(10000);
      expect(result.mcp.context7.retry?.maxAttempts).toBe(3);
    });
  });

  describe('resolveServerConfig', () => {
    it('should return server configuration for valid server', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      const result = resolveServerConfig('context7', config);

      expect(result).toEqual({
        name: 'Context7 MCP Server',
        type: 'remote',
        url: 'https://mcp.context7.com/mcp',
        headers: { CONTEXT7_API_KEY: 'test-key' },
        enabled: true,
        timeout: 10000,
        retry: { maxAttempts: 3, interval: 1000 },
      } as MCPConfig);
    });

    it('should throw error for non-existent server', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      expect(() => resolveServerConfig('nonexistent', config)).toThrow(
        'Server "nonexistent" not found in configuration'
      );
    });

    it('should throw error for disabled server', () => {
      const config: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: 'https://mcp.context7.com/mcp',
            headers: { CONTEXT7_API_KEY: 'test-key' },
            enabled: false,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      expect(() => resolveServerConfig('context7', config)).toThrow(
        'Server "context7" is disabled'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete configuration loading workflow', () => {
      process.env.CONTEXT7_MCP_URL = 'https://mcp.context7.com/mcp';
      process.env.CONTEXT7_API_KEY = 'test-api-key';

      const mockConfig: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: '${CONTEXT7_MCP_URL}',
            headers: { CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}' },
            enabled: true,
            timeout: 30000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
        },
      };

      (readFileSync as any).mockReturnValue(JSON.stringify(mockConfig));

      // Load config
      const loadedConfig = loadConfig('/path/to/config.json');

      // Validate config
      const validation = validateConfig(loadedConfig);
      expect(validation.isValid).toBe(true);

      // Substitute environment variables
      const substitutedConfig = substituteEnvVars(loadedConfig);

      // Resolve server config
      const serverConfig = resolveServerConfig('context7', substitutedConfig);

      expect(serverConfig.url).toBe('https://mcp.context7.com/mcp');
      expect(serverConfig.headers?.CONTEXT7_API_KEY).toBe('test-api-key');
      expect(serverConfig.enabled).toBe(true);
      expect(serverConfig.timeout).toBe(30000);
    });

    it('should handle multiple servers in configuration', () => {
      process.env.CONTEXT7_URL = 'https://mcp.context7.com';
      process.env.CONTEXT7_KEY = 'context7-key';
      process.env.OTHER_URL = 'https://other-mcp.com';
      process.env.OTHER_KEY = 'other-key';

      const mockConfig: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: '${CONTEXT7_URL}/mcp',
            headers: { 'X-API-Key': '${CONTEXT7_KEY}' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          } as MCPConfig,
          other: {
            name: 'Other MCP Server',
            type: 'remote',
            url: '${OTHER_URL}/api',
            headers: { 'Authorization': 'Bearer ${OTHER_KEY}' },
            enabled: true,
            timeout: 5000,
            retry: { maxAttempts: 2, interval: 2000 },
          } as MCPConfig,
        },
      };

      (readFileSync as any).mockReturnValue(JSON.stringify(mockConfig));

      const loadedConfig = loadConfig('/path/to/config.json');
      const validation = validateConfig(loadedConfig);
      expect(validation.isValid).toBe(true);

      const substitutedConfig = substituteEnvVars(loadedConfig);

      const context7Config = resolveServerConfig('context7', substitutedConfig);
      const otherConfig = resolveServerConfig('other', substitutedConfig);

      expect(context7Config.url).toBe('https://mcp.context7.com/mcp');
      expect(context7Config.headers?.['X-API-Key']).toBe('context7-key');

      expect(otherConfig.url).toBe('https://other-mcp.com/api');
      expect(otherConfig.headers?.['Authorization']).toBe('Bearer other-key');
    });
  });

    it('should handle multiple servers in configuration', () => {
      process.env.CONTEXT7_URL = 'https://mcp.context7.com';
      process.env.CONTEXT7_KEY = 'context7-key';
      process.env.OTHER_URL = 'https://other-mcp.com';
      process.env.OTHER_KEY = 'other-key';

      const mockConfig: MCPConfigFile = {
        mcp: {
          context7: {
            name: 'Context7 MCP Server',
            type: 'remote',
            url: '${CONTEXT7_URL}/mcp',
            headers: { 'X-API-Key': '${CONTEXT7_KEY}' },
            enabled: true,
            timeout: 10000,
            retry: { maxAttempts: 3, interval: 1000 },
          },
          other: {
            name: 'Other MCP Server',
            type: 'remote',
            url: '${OTHER_URL}/api',
            headers: { Authorization: 'Bearer ${OTHER_KEY}' },
            enabled: true,
            timeout: 5000,
            retry: { maxAttempts: 2, interval: 2000 },
          },
        },
      };

      (readFileSync as any).mockReturnValue(JSON.stringify(mockConfig));

      const loadedConfig = loadConfig('/path/to/config.json');
      const validation = validateConfig(loadedConfig);
      expect(validation.isValid).toBe(true);

      const substitutedConfig = substituteEnvVars(loadedConfig);

      const context7Config = resolveServerConfig('context7', substitutedConfig);
      const otherConfig = resolveServerConfig('other', substitutedConfig);

      expect(context7Config.url).toBe('https://mcp.context7.com/mcp');
      expect(context7Config.headers?.['X-API-Key']).toBe('context7-key');

      expect(otherConfig.url).toBe('https://other-mcp.com/api');
      expect(otherConfig.headers?.['Authorization']).toBe('Bearer other-key');
    });
  });
});
