/**
 * CSRF Protection Tests
 * Tests for CSRF token generation, validation, and middleware
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CSRFProtection } from "../../src/scripts/modules/CSRFProtection.js";

describe("CSRF Protection", () => {
  let csrf: CSRFProtection;

  beforeEach(() => {
    csrf = new CSRFProtection({
      tokenExpiration: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    csrf.destroy();
  });

  describe("Token Generation", () => {
    it("should generate a valid CSRF token", () => {
      const result = csrf.generateToken();

      expect(result).toHaveProperty("tokenId");
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expires");
      expect(typeof result.tokenId).toBe("string");
      expect(typeof result.token).toBe("string");
      expect(typeof result.expires).toBe("number");
      expect(result.tokenId.length).toBeGreaterThan(0);
      expect(result.token.length).toBeGreaterThan(0);
    });

    it("should generate unique tokens", () => {
      const token1 = csrf.generateToken();
      const token2 = csrf.generateToken();

      expect(token1.tokenId).not.toBe(token2.tokenId);
      expect(token1.token).not.toBe(token2.token);
    });

    it("should set expiration time correctly", () => {
      const result = csrf.generateToken();
      const now = Date.now();
      const expectedExpiration = now + 60 * 60 * 1000; // 1 hour

      expect(result.expires).toBeGreaterThan(now);
      expect(result.expires).toBeLessThanOrEqual(expectedExpiration + 1000); // Allow 1 second tolerance
    });
  });

  describe("Token Validation", () => {
    it("should validate a correct token", () => {
      const { tokenId, token } = csrf.generateToken();
      const isValid = csrf.validateToken(tokenId, token);

      expect(isValid).toBe(true);
    });

    it("should reject invalid token", () => {
      const { tokenId } = csrf.generateToken();
      const invalidToken = "invalid-token";
      const isValid = csrf.validateToken(tokenId, invalidToken);

      expect(isValid).toBe(false);
    });

    it("should reject token with invalid ID", () => {
      const { token } = csrf.generateToken();
      const invalidTokenId = "invalid-id";
      const isValid = csrf.validateToken(invalidTokenId, token);

      expect(isValid).toBe(false);
    });

    it("should reject empty token or ID", () => {
      expect(csrf.validateToken("", "token")).toBe(false);
      expect(csrf.validateToken("id", "")).toBe(false);
      expect(csrf.validateToken("", "")).toBe(false);
      expect(csrf.validateToken(null as any, null as any)).toBe(false);
      expect(csrf.validateToken(undefined as any, undefined as any)).toBe(
        false,
      );
    });

    it("should reject expired tokens", async () => {
      const shortLivedCsrf = new CSRFProtection({
        tokenExpiration: 10, // 10ms
      });

      const { tokenId, token } = shortLivedCsrf.generateToken();

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      const isValid = shortLivedCsrf.validateToken(tokenId, token);
      expect(isValid).toBe(false);

      shortLivedCsrf.destroy();
    });

    it("should use one-time tokens", () => {
      const { tokenId, token } = csrf.generateToken();

      // First validation should succeed
      expect(csrf.validateToken(tokenId, token)).toBe(true);

      // Second validation should fail
      expect(csrf.validateToken(tokenId, token)).toBe(false);
    });
  });

  describe("Configuration", () => {
    it("should use default configuration", () => {
      const defaultCsrf = new CSRFProtection();
      const config = defaultCsrf.getConfig();

      expect(config.tokenLength).toBe(32);
      expect(config.tokenExpiration).toBe(60 * 60 * 1000);
      expect(config.cookieName).toBe("_csrf");
      expect(config.headerName).toBe("x-csrf-token");
      expect(config.fieldName).toBe("csrf_token");
      expect(config.secretLength).toBe(32);

      defaultCsrf.destroy();
    });

    it("should accept custom configuration", () => {
      const customCsrf = new CSRFProtection({
        tokenLength: 64,
        tokenExpiration: 30 * 60 * 1000,
        cookieName: "custom-csrf",
      });

      const config = customCsrf.getConfig();
      expect(config.tokenLength).toBe(64);
      expect(config.tokenExpiration).toBe(30 * 60 * 1000);
      expect(config.cookieName).toBe("custom-csrf");

      customCsrf.destroy();
    });
  });

  describe("Statistics", () => {
    it("should provide token statistics", () => {
      const initialStats = csrf.getStats();
      expect(initialStats.activeTokens).toBe(0);
      expect(initialStats.oldestToken).toBeNull();

      csrf.generateToken();
      csrf.generateToken();

      const stats = csrf.getStats();
      expect(stats.activeTokens).toBe(2);
      expect(stats.oldestToken).toBeGreaterThan(0);
    });
  });

  describe("Security", () => {
    it("should generate tokens with sufficient entropy", () => {
      const { token } = csrf.generateToken();

      // Tokens should be hex strings of reasonable length
      expect(token).toMatch(/^[a-f0-9]+$/);
      expect(token.length).toBe(64); // SHA256 hex output
    });

    it("should generate token IDs with sufficient entropy", () => {
      const { tokenId } = csrf.generateToken();

      // Token IDs should be alphanumeric strings
      expect(tokenId).toMatch(/^[a-z0-9]+$/);
      expect(tokenId.length).toBeGreaterThan(20);
    });
  });
});
