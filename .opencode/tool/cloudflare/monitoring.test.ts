/**
 * Tests for Cloudflare Monitoring System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CloudflareMonitoring, getMonitor } from "./monitoring.js";

// Mock file system operations
vi.mock("fs/promises", () => ({
  default: {},
  writeFile: vi.fn(),
  readFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {},
  constants: { F_OK: 0 },
}));

vi.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
  dirname: (path: string) => path.split("/").slice(0, -1).join("/"),
}));

describe("CloudflareMonitoring", () => {
  let monitor: CloudflareMonitoring;

  beforeEach(() => {
    monitor = new CloudflareMonitoring({
      enabled: true,
      retentionDays: 7,
      dataDirectory: "/tmp/monitoring",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("recordMetric", () => {
    it("should record a successful metric", async () => {
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T10:00:05Z");

      await monitor.recordMetric({
        model: "@cf/black-forest-labs/flux-1-schnell",
        operation: "generate",
        startTime,
        endTime,
        duration: 5000,
        success: true,
        cost: 0,
        parameters: { prompt: "test prompt" },
      });

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        model: "@cf/black-forest-labs/flux-1-schnell",
        operation: "generate",
        duration: 5000,
        success: true,
        cost: 0,
      });
    });

    it("should record a failed metric", async () => {
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T10:00:02Z");

      await monitor.recordMetric({
        model: "@cf/black-forest-labs/flux-1-schnell",
        operation: "generate",
        startTime,
        endTime,
        duration: 2000,
        success: false,
        errorType: "APIError",
        errorMessage: "Rate limit exceeded",
        cost: 0,
        parameters: { prompt: "test prompt" },
      });

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        success: false,
        errorType: "APIError",
        errorMessage: "Rate limit exceeded",
      });
    });
  });

  describe("getUsageStats", () => {
    beforeEach(async () => {
      // Add some test metrics
      await monitor.recordMetric({
        model: "@cf/black-forest-labs/flux-1-schnell",
        operation: "generate",
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T10:00:05Z"),
        duration: 5000,
        success: true,
        cost: 0,
        parameters: {},
      });

      await monitor.recordMetric({
        model: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        operation: "generate",
        startTime: new Date("2024-01-01T11:00:00Z"),
        endTime: new Date("2024-01-01T11:00:10Z"),
        duration: 10000,
        success: true,
        cost: 0,
        parameters: {},
      });
    });

    it("should return daily usage statistics", () => {
      const stats = monitor.getUsageStats("daily");
      expect(stats).toHaveLength(1);
      expect(stats[0]).toMatchObject({
        date: "2024-01-01",
        totalOperations: 2,
        successfulOperations: 2,
        failedOperations: 0,
        errorRate: 0,
      });
      expect(stats[0].modelUsage).toHaveProperty(
        "@cf/black-forest-labs/flux-1-schnell",
        1,
      );
      expect(stats[0].modelUsage).toHaveProperty(
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        1,
      );
    });
  });

  describe("getOptimizationRecommendations", () => {
    it("should return recommendations when there are performance issues", async () => {
      // Add metrics that would trigger recommendations
      for (let i = 0; i < 10; i++) {
        await monitor.recordMetric({
          model: "@cf/black-forest-labs/flux-1-schnell",
          operation: "generate",
          startTime: new Date(Date.now() - i * 60 * 60 * 1000),
          endTime: new Date(Date.now() - i * 60 * 60 * 1000 + 35000), // 35 seconds - high latency
          duration: 35000,
          success: true,
          cost: 0,
          parameters: {},
        });
      }

      const recommendations = monitor.getOptimizationRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty("type");
      expect(recommendations[0]).toHaveProperty("title");
      expect(recommendations[0]).toHaveProperty("impact");
    });
  });

  describe("getHealthStatus", () => {
    it("should return health status", () => {
      const health = monitor.getHealthStatus();
      expect(health).toHaveProperty("apiAvailable");
      expect(health).toHaveProperty("errorRate");
      expect(health).toHaveProperty("averageResponseTime");
      expect(health).toHaveProperty("uptime");
    });
  });

  describe("cleanupOldData", () => {
    it("should remove old metrics based on retention policy", async () => {
      // Add old metric
      await monitor.recordMetric({
        model: "@cf/black-forest-labs/flux-1-schnell",
        operation: "generate",
        startTime: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
        endTime: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000 + 5000),
        duration: 5000,
        success: true,
        cost: 0,
        parameters: {},
      });

      // Add recent metric
      await monitor.recordMetric({
        model: "@cf/black-forest-labs/flux-1-schnell",
        operation: "generate",
        startTime: new Date(),
        endTime: new Date(Date.now() + 5000),
        duration: 5000,
        success: true,
        cost: 0,
        parameters: {},
      });

      expect(monitor.getMetrics()).toHaveLength(2);

      await monitor.cleanupOldData();

      const remainingMetrics = monitor.getMetrics();
      expect(remainingMetrics).toHaveLength(1);
      expect(remainingMetrics[0].startTime.getTime()).toBeGreaterThan(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      );
    });
  });
});

describe("getMonitor", () => {
  it("should return a monitoring instance", () => {
    const monitor = getMonitor();
    expect(monitor).toBeInstanceOf(CloudflareMonitoring);
  });

  it("should return the same instance on multiple calls", () => {
    const monitor1 = getMonitor();
    const monitor2 = getMonitor();
    expect(monitor1).toBe(monitor2);
  });
});
