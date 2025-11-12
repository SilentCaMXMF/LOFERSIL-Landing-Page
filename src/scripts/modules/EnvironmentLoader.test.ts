/**
 * EnvironmentLoader Tests
 * Test suite for the EnvironmentLoader module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnvironmentLoader } from './EnvironmentLoader.js';

// Mock window.ENV
const mockEnv = {
  OPENAI_API_KEY: 'test-openai-key',
  NODE_ENV: 'test',
  GOOGLE_ANALYTICS_ID: 'GA-TEST',
  MCP_API_KEY: 'test-mcp-key',
  MCP_SERVER_URL: 'ws://test-server:3000',
  ENABLE_MCP_INTEGRATION: 'true',
  EMAILJS_SERVICE_ID: 'test-service-id',
  EMAILJS_TEMPLATE_ID: 'test-template-id',
  EMAILJS_PUBLIC_KEY: 'test-public-key',
};

describe('EnvironmentLoader', () => {
  let envLoader: EnvironmentLoader;
  let originalWindow: any;
  let originalProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Store originals
    originalWindow = global.window;
    originalProcess = global.process;

    // Mock window.ENV
    global.window = { ENV: { ...mockEnv } } as any;
    // Clear process.env to avoid interference
    global.process = { env: {} } as any;

    envLoader = new EnvironmentLoader();
  });

  afterEach(() => {
    // Restore originals
    global.window = originalWindow;
    global.process = originalProcess;
  });

  describe('Initialization', () => {
    it('should initialize with environment variables from window.ENV', () => {
      expect(envLoader).toBeDefined();
      expect(envLoader.isLoaded()).toBe(true);
    });

    it('should load default values when not provided', () => {
      // Temporarily modify window.ENV
      const originalEnv = (global.window as any).ENV;
      (global.window as any).ENV = { OPENAI_API_KEY: 'test-key' };

      const newLoader = new EnvironmentLoader();
      expect(newLoader.get('NODE_ENV')).toBe('development');
      expect(newLoader.get('ENABLE_MCP_INTEGRATION')).toBe('false');
      expect(newLoader.get('MCP_SERVER_URL')).toBe('ws://localhost:3000');

      // Restore
      (global.window as any).ENV = originalEnv;
    });
  });

  describe('Getting Environment Variables', () => {
    it('should get environment variable value', () => {
      expect(envLoader.get('OPENAI_API_KEY')).toBe('test-openai-key');
      expect(envLoader.get('NODE_ENV')).toBe('test');
      expect(envLoader.get('GOOGLE_ANALYTICS_ID')).toBe('GA-TEST');
    });

    it('should return undefined for non-existent variables', () => {
      expect(envLoader.get('NON_EXISTENT_VAR')).toBeUndefined();
    });

    it('should get value with fallback', () => {
      expect(envLoader.getWithFallback('OPENAI_API_KEY', 'fallback')).toBe('test-openai-key');
      expect(envLoader.getWithFallback('NON_EXISTENT_VAR', 'fallback')).toBe('fallback');
    });

    it('should get required variable successfully', () => {
      expect(envLoader.getRequired('OPENAI_API_KEY')).toBe('test-openai-key');
    });

    it('should throw error for missing required variable', () => {
      expect(() => envLoader.getRequired('NON_EXISTENT_VAR')).toThrow(
        'Required environment variable NON_EXISTENT_VAR is not set'
      );
    });
  });

  describe('Environment Checks', () => {
    it('should detect development environment', () => {
      expect(envLoader.isDevelopment()).toBe(true);
      expect(envLoader.isProduction()).toBe(false);
    });

    it('should detect production environment', () => {
      const originalEnv = (global.window as any).ENV;
      (global.window as any).ENV = { ...originalEnv, NODE_ENV: 'production' };

      const prodLoader = new EnvironmentLoader();
      expect(prodLoader.isDevelopment()).toBe(false);
      expect(prodLoader.isProduction()).toBe(true);

      // Restore
      (global.window as any).ENV = originalEnv;
    });
  });

  describe('Validation', () => {
    it('should validate required environment variables successfully', () => {
      const validation = envLoader.validateRequired();
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
    });

    it('should fail validation when required variable is missing', () => {
      const originalEnv = (global.window as any).ENV;
      (global.window as any).ENV = { ...originalEnv };
      delete (global.window as any).ENV.OPENAI_API_KEY;

      const invalidLoader = new EnvironmentLoader();
      const validation = invalidLoader.validateRequired();
      expect(validation.valid).toBe(false);
      expect(validation.missing).toEqual(['OPENAI_API_KEY']);

      // Restore
      (global.window as any).ENV = originalEnv;
    });
  });

  describe('Get All Configuration', () => {
    it('should return all configuration', () => {
      const allConfig = envLoader.getAll();
      expect(allConfig).toHaveProperty('OPENAI_API_KEY', 'test-openai-key');
      expect(allConfig).toHaveProperty('NODE_ENV', 'test');
      expect(allConfig).toHaveProperty('GOOGLE_ANALYTICS_ID', 'GA-TEST');
      expect(allConfig).toHaveProperty('MCP_API_KEY', 'test-mcp-key');
      expect(allConfig).toHaveProperty('MCP_SERVER_URL', 'ws://test-server:3000');
      expect(allConfig).toHaveProperty('ENABLE_MCP_INTEGRATION', 'true');
      expect(allConfig).toHaveProperty('EMAILJS_SERVICE_ID', 'test-service-id');
      expect(allConfig).toHaveProperty('EMAILJS_TEMPLATE_ID', 'test-template-id');
      expect(allConfig).toHaveProperty('EMAILJS_PUBLIC_KEY', 'test-public-key');
    });
  });

  describe('Node.js Environment Fallback', () => {
    it('should load from process.env when window.ENV is not available', () => {
      const originalWindow = global.window;
      const originalProcess = global.process;

      // Mock Node.js environment
      (global as any).window = undefined;
      (global as any).process = {
        env: {
          OPENAI_API_KEY: 'node-env-key',
          NODE_ENV: 'production',
        },
      };

      const nodeLoader = new EnvironmentLoader();
      expect(nodeLoader.get('OPENAI_API_KEY')).toBe('node-env-key');
      expect(nodeLoader.get('NODE_ENV')).toBe('production');

      // Restore
      global.window = originalWindow;
      global.process = originalProcess;
    });
  });
});
