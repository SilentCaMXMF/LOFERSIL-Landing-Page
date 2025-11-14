/**
 * Mock implementations for Cloudflare image tools testing
 */

import { vi } from 'vitest';
import type {
  MCPClient,
  MCPTools,
  MCPResources,
  Tool,
  Resource,
} from '../../../src/scripts/modules/MCPFactory.js';

// Mock Cloudflare MCP Client
export class MockCloudflareMCPClient implements MCPClient {
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getTools(): MCPTools {
    return new MockCloudflareTools();
  }

  getResources(): MCPResources {
    return new MockCloudflareResources();
  }
}

// Mock Cloudflare Tools
export class MockCloudflareTools implements MCPTools {
  async listTools(): Promise<Tool[]> {
    return [
      {
        name: 'image_generation',
        description: 'Generate images using Cloudflare Workers AI',
        inputSchema: {
          type: 'object',
          properties: {
            model: { type: 'string', enum: ['@cf/blackforestlabs/flux-1-schnell'] },
            prompt: { type: 'string' },
            width: { type: 'number', default: 1024 },
            height: { type: 'number', default: 1024 },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'image_transformation',
        description: 'Transform images using Cloudflare Workers AI',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
            format: { type: 'string', enum: ['webp', 'png', 'jpg'] },
            quality: { type: 'number', default: 85 },
          },
          required: ['image'],
        },
      },
    ];
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case 'image_generation':
        return {
          result: {
            image: 'data:image/png;base64,mock-image-data',
            width: parameters.width || 1024,
            height: parameters.height || 1024,
          },
          success: true,
          errors: [],
          messages: [],
        };

      case 'image_transformation':
        return {
          result: {
            image: 'data:image/webp;base64,mock-transformed-image',
            width: parameters.width || 512,
            height: parameters.height || 512,
            format: parameters.format || 'webp',
          },
          success: true,
          errors: [],
          messages: [],
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

// Mock Cloudflare Resources
export class MockCloudflareResources implements MCPResources {
  async listResources(): Promise<Resource[]> {
    return [
      {
        uri: 'cloudflare://models/image',
        name: 'Image Generation Models',
        description: 'Available image generation models',
        mimeType: 'application/json',
      },
    ];
  }

  async readResource(uri: string): Promise<any> {
    if (uri === 'cloudflare://models/image') {
      return {
        models: ['@cf/blackforestlabs/flux-1-schnell'],
        description: 'Fast image generation models',
      };
    }
    throw new Error(`Unknown resource: ${uri}`);
  }
}

// Mock Image Generation Service
export class MockImageGenerationService {
  async generateImage(prompt: string, options: any = {}) {
    // Handle error conditions
    if (prompt === '') {
      throw new Error('Invalid prompt');
    }
    if (prompt.includes('inappropriate')) {
      throw new Error('Invalid prompt');
    }
    if (prompt.includes('timeout')) {
      throw new Error('Timeout');
    }
    if (prompt.includes('network-error')) {
      throw new Error('Network error');
    }
    if (prompt.includes('rate-limit')) {
      throw new Error('Rate limited');
    }
    if (prompt.includes('auth-error')) {
      throw new Error('Unauthorized');
    }
    if (prompt.includes('server-error')) {
      throw new Error('Internal server error');
    }
    if (prompt.includes('malformed')) {
      throw new Error('Invalid response');
    }
    if (options.width && (options.width <= 0 || options.width > 10000)) {
      throw new Error('Invalid dimensions');
    }
    if (options.height && (options.height <= 0 || options.height > 10000)) {
      throw new Error('Invalid dimensions');
    }

    const format = options.format || 'png';

    return {
      result: {
        image: `data:image/${format};base64,mock-generated-image`,
        width: options.width || 1024,
        height: options.height || 1024,
      },
      success: true,
      errors: [],
      messages: [],
      metadata: {
        model: options.model || '@cf/blackforestlabs/flux-1-schnell',
        prompt,
        generationTime: 2.5,
      },
    };
  }

  async getModels() {
    return [
      {
        id: '@cf/blackforestlabs/flux-1-schnell',
        name: 'Flux-1 Schnell',
        description: 'Fast image generation',
        cost: 0.001,
      },
      {
        id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        description: 'High-quality image generation',
        cost: 0.005,
      },
    ];
  }
}

// Mock Image Transformation Service
export class MockImageTransformationService {
  async transformImage(imageData: string, options: any = {}) {
    if (!imageData.startsWith('data:image/')) {
      throw new Error('Invalid image data');
    }

    return {
      result: {
        image: 'data:image/webp;base64,mock-transformed-image',
        width: options.width || 512,
        height: options.height || 512,
        format: options.format || 'webp',
      },
      success: true,
      errors: [],
      messages: [],
      quality: options.quality || 85,
      metadata: {
        originalSize: 2048000,
        transformedSize: 512000,
        compressionRatio: 0.25,
      },
    };
  }

  async getSupportedFormats() {
    return ['webp', 'png', 'jpg', 'avif'];
  }
}

// Mock Cost-Aware Router
export class MockCostAwareRouter {
  public providers = [
    {
      name: 'cloudflare',
      costPerRequest: 0.001,
      maxRequestsPerMinute: 100,
      supportedFormats: ['png', 'jpg', 'webp'],
      reliability: 0.99,
    },
    {
      name: 'openai',
      costPerRequest: 0.02,
      maxRequestsPerMinute: 50,
      supportedFormats: ['png', 'jpg'],
      reliability: 0.95,
    },
  ];

  async routeRequest(operation: string, requirements: any = {}) {
    const { format, maxCost, priority = 'cost' } = requirements;

    // Filter providers that support the required format
    let availableProviders = this.providers;
    if (format) {
      availableProviders = this.providers.filter(p => p.supportedFormats.includes(format));
    }

    if (availableProviders.length === 0) {
      throw new Error(`No providers support format: ${format}`);
    }

    // Sort by priority
    if (priority === 'cost') {
      availableProviders.sort((a, b) => a.costPerRequest - b.costPerRequest);
    } else if (priority === 'speed') {
      availableProviders.sort((a, b) => b.maxRequestsPerMinute - a.maxRequestsPerMinute);
    } else if (priority === 'reliability') {
      availableProviders.sort((a, b) => b.reliability - a.reliability);
    }

    // Filter by max cost if specified
    if (maxCost) {
      availableProviders = availableProviders.filter(p => p.costPerRequest <= maxCost);
    }

    if (availableProviders.length === 0) {
      throw new Error(`No providers within cost limit: ${maxCost}`);
    }

    return {
      provider: availableProviders[0].name,
      cost: availableProviders[0].costPerRequest,
      estimatedTime: priority === 'speed' ? 1 : 3,
      confidence: availableProviders[0].reliability,
    };
  }

  async getProviderStats() {
    return this.providers.map(provider => ({
      name: provider.name,
      currentLoad: Math.random() * 100,
      averageResponseTime: Math.random() * 5 + 1,
      errorRate: Math.random() * 0.1,
    }));
  }
}

// Mock Environment Loader
export class MockEnvironmentLoader {
  private env: Record<string, string> = {};

  set(key: string, value: string) {
    this.env[key] = value;
  }

  get(key: string): string | undefined {
    return this.env[key];
  }

  getRequired(key: string): string {
    const value = this.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
}

// Factory function to create mocked instances
export const createMockCloudflareClient = () => new MockCloudflareMCPClient();
export const createMockImageGenerationService = () => new MockImageGenerationService();
export const createMockImageTransformationService = () => new MockImageTransformationService();
export const createMockCostAwareRouter = () => new MockCostAwareRouter();
export const createMockEnvironmentLoader = () => new MockEnvironmentLoader();

// Setup function for comprehensive mocking
export const setupMocks = () => {
  const mockEnvLoader = createMockEnvironmentLoader();
  mockEnvLoader.set('CLOUDFLARE_API_TOKEN', 'test-token');
  mockEnvLoader.set('CLOUDFLARE_ACCOUNT_ID', 'test-account');

  return {
    client: createMockCloudflareClient(),
    imageGen: createMockImageGenerationService(),
    imageTransform: createMockImageTransformationService(),
    router: createMockCostAwareRouter(),
    envLoader: mockEnvLoader,
  };
};
