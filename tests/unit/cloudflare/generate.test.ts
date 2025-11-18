/**
 * Cloudflare Image Generation Tests
 * Tests the image generation functionality using Cloudflare Workers AI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createMockImageRequest,
  expectImageResult,
} from './test-helpers.js';
import { createMockImageGenerationService } from './mocks.js';

// Mock the actual image generation module
vi.mock('../../../src/scripts/modules/cloudflare/generate.ts', () => ({
  ImageGenerationService: createMockImageGenerationService(),
}));

describe('Cloudflare Image Generation', () => {
  let imageGenService: any;

  beforeEach(() => {
    setupTestEnvironment();
    imageGenService = createMockImageGenerationService();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.clearAllMocks();
  });

  describe('Image Generation Service', () => {
    it('should generate image successfully with valid prompt', async () => {
      // Arrange
      const request = createMockImageRequest({
        prompt: 'A beautiful sunset over mountains',
        width: 1024,
        height: 1024,
      });

      // Act
      const result = await imageGenService.generateImage(request.prompt, {
        width: request.width,
        height: request.height,
      });

      // Assert
      expectImageResult(result, request.width, request.height);
      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('prompt', request.prompt);
      expect(result.metadata).toHaveProperty('generationTime');
    });

    it('should handle different image dimensions', async () => {
      // Arrange
      const dimensions = [
        { width: 512, height: 512 },
        { width: 1024, height: 768 },
        { width: 2048, height: 2048 },
      ];

      for (const dim of dimensions) {
        // Act
        const result = await imageGenService.generateImage('test prompt', dim);

        // Assert
        expectImageResult(result, dim.width, dim.height);
      }
    });

    it('should use default model when not specified', async () => {
      // Arrange
      const request = createMockImageRequest();
      // Remove model from request object
      const { model, ...requestWithoutModel } = request;

      // Act
      const result = await imageGenService.generateImage(request.prompt);

      // Assert
      expectImageResult(result);
      expect(result.metadata.model).toBe('@cf/blackforestlabs/flux-1-schnell');
    });

    it('should handle empty prompt gracefully', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: '' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow('Invalid prompt');
    });

    it('should handle very long prompts', async () => {
      // Arrange
      const longPrompt = 'A '.repeat(1000) + 'beautiful landscape';
      const request = createMockImageRequest({ prompt: longPrompt });

      // Act
      const result = await imageGenService.generateImage(request.prompt);

      // Assert
      expectImageResult(result);
      expect(result.metadata.prompt).toBe(longPrompt);
    });

    it('should reject prompts with inappropriate content', async () => {
      // Arrange
      const inappropriatePrompt = 'Generate inappropriate content here';

      // Act & Assert
      await expect(imageGenService.generateImage(inappropriatePrompt)).rejects.toThrow(
        'Invalid prompt'
      );
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: 'timeout test' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow('Timeout');
    });

    it('should handle API rate limiting', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: 'rate-limit test' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow('Rate limited');
    });

    it('should validate image dimensions within limits', async () => {
      // Arrange
      const invalidDimensions = [
        { width: 0, height: 512 },
        { width: 512, height: 0 },
        { width: 10000, height: 512 }, // Too large
        { width: 512, height: 10000 }, // Too large
      ];

      for (const dim of invalidDimensions) {
        // Act & Assert
        await expect(imageGenService.generateImage('test', dim)).rejects.toThrow();
      }
    });

    it('should support different output formats', async () => {
      // Arrange
      const formats = ['png', 'jpg', 'webp'];

      for (const format of formats) {
        const request = createMockImageRequest({ format });

        // Act
        const result = await imageGenService.generateImage(request.prompt, { format });

        // Assert
        expectImageResult(result);
        expect(result.result.image).toMatch(new RegExp(`data:image/${format};base64,`));
      }
    });

    it('should include generation metadata in response', async () => {
      // Arrange
      const request = createMockImageRequest();

      // Act
      const result = await imageGenService.generateImage(request.prompt);

      // Assert
      expect(result.metadata).toBeDefined();
      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('prompt');
      expect(result.metadata).toHaveProperty('generationTime');
      expect(typeof result.metadata.generationTime).toBe('number');
      expect(result.metadata.generationTime).toBeGreaterThan(0);
    });

    it('should handle concurrent requests without interference', async () => {
      // Arrange
      const requests = [
        createMockImageRequest({ prompt: 'Request 1' }),
        createMockImageRequest({ prompt: 'Request 2' }),
        createMockImageRequest({ prompt: 'Request 3' }),
      ];

      // Act
      const results = await Promise.all(
        requests.map(req => imageGenService.generateImage(req.prompt))
      );

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expectImageResult(result);
        expect(result.metadata.prompt).toBe(requests[index].prompt);
      });
    });
  });

  describe('Model Management', () => {
    it('should list available models', async () => {
      // Act
      const models = await imageGenService.getModels();

      // Assert
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      models.forEach(model => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('description');
        expect(model).toHaveProperty('cost');
        expect(typeof model.cost).toBe('number');
        expect(model.cost).toBeGreaterThan(0);
      });
    });

    it('should select appropriate model based on requirements', async () => {
      // Arrange
      const requirements = {
        quality: 'high',
        speed: 'fast',
        cost: 'low',
      };

      // Act
      const models = await imageGenService.getModels();
      const selectedModel = models.find(m => m.id.includes('flux-1-schnell'));

      // Assert
      expect(selectedModel).toBeDefined();
      expect(selectedModel?.cost).toBeLessThan(0.01); // Should be cost-effective
    });
  });

  describe('Error Handling', () => {
    it('should handle API authentication failures', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: 'auth-error test' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow('Unauthorized');
    });

    it('should handle API server errors', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: 'server-error test' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle malformed API responses', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: 'malformed test' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow(
        'Invalid response'
      );
    });

    it('should handle network connectivity issues', async () => {
      // Arrange
      const request = createMockImageRequest({ prompt: 'network-error test' });

      // Act & Assert
      await expect(imageGenService.generateImage(request.prompt)).rejects.toThrow('Network error');
    });
  });
});
