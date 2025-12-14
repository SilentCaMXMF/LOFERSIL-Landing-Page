/**
 * Quick Rate Limiting Test
 * Simple test to verify rate limiting configuration
 */

import { describe, it, expect } from "vitest";
import {
  RATE_LIMIT_CONFIGS,
  getEnvironmentSpecificConfig,
  RateLimitUtils,
} from "../../src/scripts/modules/RateLimitConfig.js";

describe("Rate Limiting Quick Test", () => {
  it("should validate rate limit configurations", () => {
    // Check that all required configs exist
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("general");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("contact");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("csrf");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("api");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("push");

    // Check contact form has strictest limits
    expect(RATE_LIMIT_CONFIGS.contact.max).toBeLessThan(
      RATE_LIMIT_CONFIGS.api.max,
    );
    expect(RATE_LIMIT_CONFIGS.contact.max).toBeLessThan(
      RATE_LIMIT_CONFIGS.general.max,
    );

    // Check window sizes are reasonable
    expect(RATE_LIMIT_CONFIGS.general.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    expect(RATE_LIMIT_CONFIGS.contact.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(15 * 60 * 1000); // 15 minutes

    // Check message formats
    Object.values(RATE_LIMIT_CONFIGS).forEach((config) => {
      expect(config.message).toHaveProperty("success", false);
      expect(config.message).toHaveProperty("error");
      expect(config.message).toHaveProperty("code");
      expect(config.message).toHaveProperty("retryAfter");
      expect(config.standardHeaders).toBe(true);
      expect(config.legacyHeaders).toBe(false);
    });
  });

  it("should handle environment-specific configurations", () => {
    const baseConfig = RATE_LIMIT_CONFIGS.general;

    // Production should be unchanged
    const prodConfig = getEnvironmentSpecificConfig(baseConfig, "production");
    expect(prodConfig.max).toBe(baseConfig.max);
    expect(prodConfig.windowMs).toBe(baseConfig.windowMs);

    // Development should have higher limits
    const devConfig = getEnvironmentSpecificConfig(baseConfig, "development");
    expect(devConfig.max).toBe(baseConfig.max * 2);
    expect(devConfig.windowMs).toBe(baseConfig.windowMs);

    // Test should have much higher limits
    const testConfig = getEnvironmentSpecificConfig(baseConfig, "test");
    expect(testConfig.max).toBe(baseConfig.max * 10);
    expect(testConfig.windowMs).toBe(60 * 1000); // 1 minute
  });

  it("should generate proper rate limit keys", () => {
    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        "user-agent": "Test Browser",
      },
    };

    const key = RateLimitUtils.generateKey(mockReq, "test");
    expect(key).toBe("test:192.168.1.1:Test Browser");

    // Test with x-forwarded-for
    const mockReqProxy = {
      headers: {
        "x-forwarded-for": "203.0.113.1, 192.168.1.1",
        "user-agent": "Test Browser",
      },
    };

    const keyProxy = RateLimitUtils.generateKey(mockReqProxy, "test");
    expect(keyProxy).toBe("test:203.0.113.1:Test Browser");
  });

  it("should calculate retry after correctly", () => {
    expect(RateLimitUtils.calculateRetryAfter(60000)).toBe(60);
    expect(RateLimitUtils.calculateRetryAfter(900000)).toBe(900);
    expect(RateLimitUtils.calculateRetryAfter(3600000)).toBe(3600);
  });

  it("should format headers correctly", () => {
    const config = RATE_LIMIT_CONFIGS.general;
    const headers = RateLimitUtils.formatHeaders(
      config,
      50,
      Date.now() + 60000,
    );

    expect(headers).toHaveProperty("X-RateLimit-Limit", "100");
    expect(headers).toHaveProperty("X-RateLimit-Remaining", "50");
    expect(headers).toHaveProperty("X-RateLimit-Reset");
    expect(headers).toHaveProperty("X-RateLimit-Window", "900000");
  });
});
