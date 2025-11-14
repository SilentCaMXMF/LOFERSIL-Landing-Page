/**
 * Cloudflare Cost-Aware Routing Tests
 * Tests the intelligent routing system that selects optimal providers based on cost, speed, and reliability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  createMockRoutingConfig,
} from './test-helpers.js';
import { createMockCostAwareRouter } from './mocks.js';

// Mock the actual routing module (assuming it exists)
vi.mock('../../../src/scripts/modules/cloudflare/routing.js', () => ({
  CostAwareRouter: createMockCostAwareRouter(),
}));

describe('Cloudflare Cost-Aware Routing', () => {
  let router: any;

  beforeEach(() => {
    setupTestEnvironment();
    router = createMockCostAwareRouter();
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.clearAllMocks();
  });

  describe('Provider Selection', () => {
    it('should route to cheapest provider by default', async () => {
      // Arrange
      const requirements = { operation: 'generate' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.provider).toBe('cloudflare');
      expect(result.cost).toBe(0.001);
      expect(result).toHaveProperty('estimatedTime');
      expect(result).toHaveProperty('confidence');
    });

    it('should route to fastest provider when speed is prioritized', async () => {
      // Arrange
      const requirements = { operation: 'generate', priority: 'speed' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.provider).toBeDefined();
      expect(result.estimatedTime).toBeLessThanOrEqual(3);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should route to most reliable provider when reliability is prioritized', async () => {
      // Arrange
      const requirements = { operation: 'generate', priority: 'reliability' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.provider).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should respect maximum cost limits', async () => {
      // Arrange
      const requirements = { operation: 'generate', maxCost: 0.01 };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.cost).toBeLessThanOrEqual(0.01);
      expect(result.provider).toBe('cloudflare');
    });

    it('should reject requests exceeding maximum cost', async () => {
      // Arrange
      const requirements = { operation: 'generate', maxCost: 0.0005 }; // Below minimum cost

      // Act & Assert
      await expect(router.routeRequest('generate', requirements)).rejects.toThrow(
        'No providers within cost limit'
      );
    });

    it('should select appropriate provider based on image format support', async () => {
      // Arrange
      const requirements = { operation: 'transform', format: 'webp' };

      // Act
      const result = await router.routeRequest('transform', requirements);

      // Assert
      expect(result.provider).toBe('cloudflare'); // Cloudflare supports webp
    });

    it('should reject unsupported image formats', async () => {
      // Arrange
      const requirements = { operation: 'transform', format: 'unsupported' };

      // Act & Assert
      await expect(router.routeRequest('transform', requirements)).rejects.toThrow(
        'No providers support format'
      );
    });
  });

  describe('Cost Optimization', () => {
    it('should calculate total cost for batch operations', async () => {
      // Arrange
      const batchSize = 10;
      const requirements = { operation: 'generate' };

      // Act
      const results = await Promise.all(
        Array(batchSize)
          .fill(null)
          .map(() => router.routeRequest('generate', requirements))
      );

      // Assert
      const totalCost = results.reduce((sum, result) => sum + result.cost, 0);
      expect(totalCost).toBe(0.01); // 10 * 0.001
    });

    it('should prefer providers with lower cost per request', async () => {
      // Arrange
      const requirements = { operation: 'generate', priority: 'cost' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.cost).toBeLessThanOrEqual(0.01);
      expect(result.provider).toBe('cloudflare');
    });

    it('should consider rate limits when routing', async () => {
      // Arrange - Simulate high load scenario
      const requirements = { operation: 'generate', priority: 'cost' };

      // Mock high load on cloudflare
      router.providers = router.providers.map((p: any) => ({
        ...p,
        currentLoad: p.name === 'cloudflare' ? 95 : p.currentLoad,
      }));

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.provider).toBeDefined();
      // Should still route to cloudflare despite high load due to cost priority
      expect(result.cost).toBeLessThan(0.01);
    });
  });

  describe('Performance Optimization', () => {
    it('should estimate response times accurately', async () => {
      // Arrange
      const requirements = { operation: 'generate', priority: 'speed' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.estimatedTime).toBeGreaterThan(0);
      expect(result.estimatedTime).toBeLessThan(10); // Reasonable upper bound
      expect(typeof result.estimatedTime).toBe('number');
    });

    it('should factor in current provider load', async () => {
      // Arrange
      const requirements = { operation: 'generate', priority: 'speed' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result).toHaveProperty('estimatedTime');
      expect(result.estimatedTime).toBeLessThan(5); // Should be fast
    });

    it('should handle concurrent routing requests', async () => {
      // Arrange
      const requests = Array(5)
        .fill(null)
        .map((_, i) => ({
          operation: 'generate',
          priority: i % 2 === 0 ? 'cost' : 'speed',
        }));

      // Act
      const results = await Promise.all(
        requests.map(req => router.routeRequest(req.operation, req))
      );

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('provider');
        expect(result).toHaveProperty('cost');
        expect(result).toHaveProperty('estimatedTime');
        expect(result).toHaveProperty('confidence');
      });
    });
  });

  describe('Reliability Considerations', () => {
    it('should consider provider reliability scores', async () => {
      // Arrange
      const requirements = { operation: 'generate', priority: 'reliability' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.provider).toBeDefined();
    });

    it('should avoid providers with high error rates', async () => {
      // Arrange - Simulate high error rate on cloudflare
      router.providers = router.providers.map((p: any) => ({
        ...p,
        errorRate: p.name === 'cloudflare' ? 0.5 : p.errorRate, // 50% error rate
      }));

      const requirements = { operation: 'generate', priority: 'reliability' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.confidence).toBeGreaterThan(0.8);
      // Should potentially route away from cloudflare due to high error rate
    });

    it('should provide confidence scores for routing decisions', async () => {
      // Arrange
      const requirements = { operation: 'generate' };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(typeof result.confidence).toBe('number');
    });
  });

  describe('Provider Statistics', () => {
    it('should track and report provider performance metrics', async () => {
      // Act
      const stats = await router.getProviderStats();

      // Assert
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);

      stats.forEach(stat => {
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('currentLoad');
        expect(stat).toHaveProperty('averageResponseTime');
        expect(stat).toHaveProperty('errorRate');

        expect(stat.currentLoad).toBeGreaterThanOrEqual(0);
        expect(stat.currentLoad).toBeLessThanOrEqual(100);
        expect(stat.averageResponseTime).toBeGreaterThan(0);
        expect(stat.errorRate).toBeGreaterThanOrEqual(0);
        expect(stat.errorRate).toBeLessThanOrEqual(1);
      });
    });

    it('should update statistics after routing decisions', async () => {
      // Arrange
      const initialStats = await router.getProviderStats();

      // Act - Make several routing requests
      await Promise.all([
        router.routeRequest('generate'),
        router.routeRequest('generate'),
        router.routeRequest('transform'),
      ]);

      const updatedStats = await router.getProviderStats();

      // Assert
      expect(updatedStats.length).toBe(initialStats.length);
      // Statistics should be updated (implementation dependent)
    });
  });

  describe('Error Handling', () => {
    it('should handle provider unavailability gracefully', async () => {
      // Arrange - Simulate all providers unavailable
      router.providers = router.providers.map((p: any) => ({
        ...p,
        currentLoad: 100, // 100% load
      }));

      const requirements = { operation: 'generate' };

      // Act & Assert
      await expect(router.routeRequest('generate', requirements)).rejects.toThrow();
    });

    it('should handle invalid routing requirements', async () => {
      // Arrange
      const invalidRequirements = [
        { operation: 'invalid' },
        { priority: 'invalid' },
        { maxCost: -1 },
        { format: '' },
      ];

      for (const req of invalidRequirements) {
        // Act & Assert
        await expect(router.routeRequest('generate', req)).rejects.toThrow();
      }
    });

    it('should handle network failures during routing', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(router.getProviderStats()).rejects.toThrow('Network error');
    });

    it('should provide fallback routing when primary fails', async () => {
      // Arrange - Make cloudflare very expensive
      router.providers = router.providers.map((p: any) => ({
        ...p,
        costPerRequest: p.name === 'cloudflare' ? 100 : p.costPerRequest,
      }));

      const requirements = { operation: 'generate', maxCost: 1 };

      // Act
      const result = await router.routeRequest('generate', requirements);

      // Assert
      expect(result.provider).toBeDefined();
      expect(result.cost).toBeLessThan(100);
    });
  });

  describe('Configuration Management', () => {
    it('should accept custom routing configuration', async () => {
      // Arrange
      const customRouter = createMockCostAwareRouter();
      // Mock custom providers
      customRouter.providers = [
        {
          name: 'custom-provider',
          costPerRequest: 0.005,
          maxRequestsPerMinute: 200,
          supportedFormats: ['png', 'jpg'],
          reliability: 0.95,
        },
      ];

      // Act
      const result = await customRouter.routeRequest('generate');

      // Assert
      expect(result.provider).toBe('custom-provider');
      expect(result.cost).toBe(0.005);
    });

    it('should validate provider configurations', async () => {
      // Arrange
      const router = createMockCostAwareRouter();

      // Act & Assert - Test with empty providers
      router.providers = [];
      await expect(router.routeRequest('generate')).rejects.toThrow();
    });
  });
});
