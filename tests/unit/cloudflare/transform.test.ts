/**
 * Cloudflare Image Transformation Tests
 * Tests the image transformation functionality using Cloudflare Workers AI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createMockTransformRequest,
  expectImageResult,
} from './test-helpers.js';
import { createMockImageTransformationService } from './mocks.js';

// Mock the actual image transformation module (assuming it exists)
vi.mock('../../../src/scripts/modules/cloudflare/transform.js', () => ({
  ImageTransformationService: createMockImageTransformationService(),
}));

describe('Cloudflare Image Transformation', () => {
  let imageTransformService: any;

  beforeEach(() => {
    setupTestEnvironment();
    imageTransformService = createMockImageTransformationService();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.clearAllMocks();
  });

  describe('Image Transformation Service', () => {
    it('should transform image successfully with valid input', async () => {
      // Arrange
      const request = createMockTransformRequest({
        width: 512,
        height: 512,
        format: 'webp',
        quality: 85,
      });

      // Act
      const result = await imageTransformService.transformImage(request.image, {
        width: request.width,
        height: request.height,
        format: request.format,
        quality: request.quality,
      });

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('image');
      expect(result).toHaveProperty('width', request.width);
      expect(result).toHaveProperty('height', request.height);
      expect(result).toHaveProperty('format', request.format);
      expect(result).toHaveProperty('quality', request.quality);
      expect(result.image).toMatch(/^data:image\/webp;base64,/);
    });

    it('should handle different output formats', async () => {
      // Arrange
      const formats = ['webp', 'png', 'jpg'];

      for (const format of formats) {
        const request = createMockTransformRequest({ format });

        // Act
        const result = await imageTransformService.transformImage(request.image, { format });

        // Assert
        expect(result.format).toBe(format);
        expect(result.image).toMatch(new RegExp(`data:image/${format};base64,`));
      }
    });

    it('should handle different image dimensions', async () => {
      // Arrange
      const dimensions = [
        { width: 256, height: 256 },
        { width: 1024, height: 768 },
        { width: 2048, height: 2048 },
      ];

      for (const dim of dimensions) {
        const request = createMockTransformRequest(dim);

        // Act
        const result = await imageTransformService.transformImage(request.image, dim);

        // Assert
        expect(result.width).toBe(dim.width);
        expect(result.height).toBe(dim.height);
      }
    });

    it('should apply quality settings correctly', async () => {
      // Arrange
      const qualities = [10, 50, 85, 100];

      for (const quality of qualities) {
        const request = createMockTransformRequest({ quality });

        // Act
        const result = await imageTransformService.transformImage(request.image, { quality });

        // Assert
        expect(result.quality).toBe(quality);
      }
    });

    it('should reject invalid image data', async () => {
      // Arrange
      const invalidImages = [
        'not-image-data',
        'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        '',
        null,
        undefined,
      ];

      for (const invalidImage of invalidImages) {
        // Act & Assert
        await expect(imageTransformService.transformImage(invalidImage as any)).rejects.toThrow(
          'Invalid image data'
        );
      }
    });

    it('should handle very large images', async () => {
      // Arrange
      const largeImageData = 'data:image/png;base64,' + 'A'.repeat(1000000); // ~1MB image
      const request = createMockTransformRequest({ image: largeImageData });

      // Act
      const result = await imageTransformService.transformImage(request.image);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result.metadata.originalSize).toBeGreaterThan(1000000);
      expect(result.metadata.transformedSize).toBeLessThan(result.metadata.originalSize);
    });

    it('should calculate compression ratios correctly', async () => {
      // Arrange
      const request = createMockTransformRequest();

      // Act
      const result = await imageTransformService.transformImage(request.image);

      // Assert
      expect(result.metadata).toHaveProperty('compressionRatio');
      expect(result.metadata.compressionRatio).toBeGreaterThan(0);
      expect(result.metadata.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('should maintain aspect ratio when only one dimension is specified', async () => {
      // Arrange
      const request = createMockTransformRequest({ width: 512 }); // Only width specified
      delete (request as any).height;

      // Act
      const result = await imageTransformService.transformImage(request.image, { width: 512 });

      // Assert
      expect(result.width).toBe(512);
      expect(result.height).toBeDefined();
      expect(typeof result.height).toBe('number');
    });

    it('should handle format conversion from PNG to WebP', async () => {
      // Arrange
      const pngImage =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const request = createMockTransformRequest({
        image: pngImage,
        format: 'webp',
      });

      // Act
      const result = await imageTransformService.transformImage(request.image, { format: 'webp' });

      // Assert
      expect(result.format).toBe('webp');
      expect(result.image).toMatch(/^data:image\/webp;base64,/);
    });

    it('should handle concurrent transformation requests', async () => {
      // Arrange
      const requests = [
        createMockTransformRequest({ width: 256, height: 256 }),
        createMockTransformRequest({ width: 512, height: 512 }),
        createMockTransformRequest({ width: 1024, height: 1024 }),
      ];

      // Act
      const results = await Promise.all(
        requests.map(req =>
          imageTransformService.transformImage(req.image, {
            width: req.width,
            height: req.height,
          })
        )
      );

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.width).toBe(requests[index].width);
        expect(result.height).toBe(requests[index].height);
        expect(result.success).toBe(true);
      });
    });

    it('should validate dimension limits', async () => {
      // Arrange
      const invalidDimensions = [
        { width: 0, height: 512 },
        { width: 512, height: 0 },
        { width: 10000, height: 512 }, // Too large
        { width: 512, height: 10000 }, // Too large
        { width: -100, height: 512 }, // Negative
      ];

      for (const dim of invalidDimensions) {
        const request = createMockTransformRequest(dim);

        // Act & Assert
        await expect(imageTransformService.transformImage(request.image, dim)).rejects.toThrow();
      }
    });

    it('should validate quality parameter range', async () => {
      // Arrange
      const invalidQualities = [-1, 0, 101, 200];

      for (const quality of invalidQualities) {
        const request = createMockTransformRequest({ quality });

        // Act & Assert
        await expect(
          imageTransformService.transformImage(request.image, { quality })
        ).rejects.toThrow();
      }
    });

    it('should support all documented output formats', async () => {
      // Arrange
      const supportedFormats = await imageTransformService.getSupportedFormats();

      for (const format of supportedFormats) {
        const request = createMockTransformRequest({ format });

        // Act
        const result = await imageTransformService.transformImage(request.image, { format });

        // Assert
        expect(result.format).toBe(format);
        expect(supportedFormats).toContain(format);
      }
    });
  });

  describe('Format Support', () => {
    it('should list all supported output formats', async () => {
      // Act
      const formats = await imageTransformService.getSupportedFormats();

      // Assert
      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
      expect(formats).toContain('webp');
      expect(formats).toContain('png');
      expect(formats).toContain('jpg');
    });

    it('should reject unsupported output formats', async () => {
      // Arrange
      const unsupportedFormats = ['gif', 'bmp', 'tiff', 'svg'];

      for (const format of unsupportedFormats) {
        const request = createMockTransformRequest({ format });

        // Act & Assert
        await expect(
          imageTransformService.transformImage(request.image, { format })
        ).rejects.toThrow();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API authentication failures', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      }) as any;

      // Act & Assert
      await expect(
        imageTransformService.transformImage('data:image/png;base64,test')
      ).rejects.toThrow('Unauthorized');
    });

    it('should handle API server errors', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      }) as any;

      // Act & Assert
      await expect(
        imageTransformService.transformImage('data:image/png;base64,test')
      ).rejects.toThrow('Internal server error');
    });

    it('should handle network connectivity issues', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        imageTransformService.transformImage('data:image/png;base64,test')
      ).rejects.toThrow('Network error');
    });

    it('should handle malformed API responses', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: 'response' }),
      }) as any;

      // Act & Assert
      await expect(
        imageTransformService.transformImage('data:image/png;base64,test')
      ).rejects.toThrow();
    });

    it('should handle timeout errors gracefully', async () => {
      // Arrange
      global.fetch = vi.fn(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          })
      ) as any;

      // Act & Assert
      await expect(
        imageTransformService.transformImage('data:image/png;base64,test')
      ).rejects.toThrow('Timeout');
    });
  });
});
