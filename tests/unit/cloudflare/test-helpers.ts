/**
 * Test helpers and utilities for Cloudflare image tools testing
 */

import { vi, expect } from 'vitest';

// Mock Cloudflare API responses
export const mockCloudflareResponses = {
  imageGeneration: {
    success: {
      result: {
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        width: 1024,
        height: 1024,
      },
      success: true,
      errors: [],
      messages: [],
    },
    error: {
      success: false,
      errors: [{ message: 'Invalid prompt' }],
      messages: [],
    },
  },

  imageTransformation: {
    success: {
      result: {
        image:
          'data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        width: 512,
        height: 512,
        format: 'webp',
      },
      success: true,
      errors: [],
      messages: [],
    },
    error: {
      success: false,
      errors: [{ message: 'Image processing failed' }],
      messages: [],
    },
  },

  models: {
    success: {
      result: [
        {
          id: '@cf/blackforestlabs/flux-1-schnell',
          name: 'Flux-1 Schnell',
          description: 'Fast image generation model',
        },
        {
          id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
          name: 'Stable Diffusion XL',
          description: 'High-quality image generation',
        },
      ],
      success: true,
      errors: [],
      messages: [],
    },
  },
};

// Mock environment variables
export const mockEnvVars = {
  CLOUDFLARE_API_TOKEN: 'test-cloudflare-token-12345',
  CLOUDFLARE_ACCOUNT_ID: 'test-account-abcdef123456',
};

// Test data generators
export const createMockImageRequest = (overrides = {}) => ({
  prompt: 'A beautiful sunset over mountains',
  width: 1024,
  height: 1024,
  model: '@cf/blackforestlabs/flux-1-schnell',
  ...overrides,
});

export const createMockTransformRequest = (overrides = {}) => ({
  image: 'data:image/png;base64,test-image-data',
  width: 512,
  height: 512,
  format: 'webp',
  quality: 85,
  ...overrides,
});

export const createMockRoutingConfig = (overrides = {}) => ({
  providers: [
    {
      name: 'cloudflare',
      costPerRequest: 0.001,
      maxRequestsPerMinute: 100,
      supportedFormats: ['png', 'jpg', 'webp'],
    },
    {
      name: 'openai',
      costPerRequest: 0.02,
      maxRequestsPerMinute: 50,
      supportedFormats: ['png', 'jpg'],
    },
  ],
  defaultProvider: 'cloudflare',
  ...overrides,
});

// Mock fetch implementation for Cloudflare API
export const mockCloudflareFetch = (
  input: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString();
  const method = options?.method || 'GET';
  const body = options?.body as string;
  const parsedBody = body ? JSON.parse(body) : {};

  // Mock image generation endpoint
  if (url.includes('/ai/run/@cf/blackforestlabs/flux-1-schnell') && method === 'POST') {
    if (parsedBody.prompt?.includes('error')) {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockCloudflareResponses.imageGeneration.error),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockCloudflareResponses.imageGeneration.success),
    } as Response);
  }

  // Mock models endpoint
  if (url.includes('/ai/models') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockCloudflareResponses.models.success),
    } as Response);
  }

  // Mock network error
  if (url.includes('network-error')) {
    return Promise.reject(new Error('Network error'));
  }

  // Mock timeout
  if (url.includes('timeout')) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 100);
    });
  }

  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Not found' }),
  } as Response);
};

// Setup function for test environment
export const setupTestEnvironment = () => {
  // Set environment variables
  process.env.CLOUDFLARE_API_TOKEN = mockEnvVars.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_ACCOUNT_ID = mockEnvVars.CLOUDFLARE_ACCOUNT_ID;

  // Mock fetch globally
  global.fetch = vi.fn(mockCloudflareFetch);

  // Mock AbortSignal.timeout if not available
  if (!AbortSignal.timeout) {
    (AbortSignal as any).timeout = vi.fn(ms => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    });
  }
};

// Cleanup function
export const cleanupTestEnvironment = () => {
  delete process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  vi.restoreAllMocks();
};

// Assertion helpers
export const expectImageResult = (result: any, expectedWidth = 1024, expectedHeight = 1024) => {
  expect(result).toHaveProperty('success', true);
  expect(result).toHaveProperty('result');
  expect(result.result).toHaveProperty('image');
  expect(result.result).toHaveProperty('width', expectedWidth);
  expect(result.result).toHaveProperty('height', expectedHeight);
  expect(result.result.image).toMatch(/^data:image\/(png|webp|jpg);base64,/);
};

export const expectErrorResult = (result: any, errorMessage: string) => {
  expect(result).toHaveProperty('success', false);
  expect(result).toHaveProperty('errors');
  expect(result.errors[0]).toHaveProperty('message', errorMessage);
};
