/**
 * Email Security and Rate Limiting Tests
 * Comprehensive testing for email security features and rate limiting functionality
 */

// Mock DOMPurify at the top level before imports
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((input: string, config?: any) => {
      // Basic sanitization for testing
      if (typeof input !== "string") return input;

      // Remove script tags and dangerous content
      let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/alert\(/gi, "alert-disabled(");

      return sanitized;
    }),
  },
}));

// Set up global DOMPurify
Object.defineProperty(global, "DOMPurify", {
  value: {
    sanitize: vi.fn((input: string, config?: any) => {
      // Basic sanitization for testing
      if (typeof input !== "string") return input;

      // Remove script tags and dangerous content
      let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/alert\(/gi, "alert-disabled(");

      return sanitized;
    }),
  },
  writable: true,
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  RateLimiter,
  RateLimiterFactory,
  RateLimitStrategy,
  RateLimitType,
} from "../utils/rate-limiter.js";
import {
  EmailSecurityManager,
  SecurityManagerFactory,
  SecurityIncidentType,
  SecurityThreatLevel,
} from "../utils/email-security.js";

describe("Rate Limiter Tests", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Fixed Window Strategy", () => {
    beforeEach(() => {
      rateLimiter = RateLimiterFactory.createIpLimiter({
        strategy: RateLimitStrategy.FIXED_WINDOW,
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      });
    });

    it("should allow requests within limit", async () => {
      const result1 = await rateLimiter.checkLimit("192.168.1.1");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = await rateLimiter.checkLimit("192.168.1.1");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it("should block requests exceeding limit", async () => {
      // Allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit("192.168.1.1");
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = await rateLimiter.checkLimit("192.168.1.1");
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
      expect(blockedResult.breachLevel).toBeDefined();
    });

    it("should reset after window expires", async () => {
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit("192.168.1.1");
      }

      // Should be blocked
      let result = await rateLimiter.checkLimit("192.168.1.1");
      expect(result.allowed).toBe(false);

      // Advance time by window duration
      vi.advanceTimersByTime(60000);

      // Should be allowed again
      result = await rateLimiter.checkLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should handle multiple IPs independently", async () => {
      // Exhaust limit for IP1
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit("192.168.1.1");
      }

      // IP1 should be blocked
      const ip1Result = await rateLimiter.checkLimit("192.168.1.1");
      expect(ip1Result.allowed).toBe(false);

      // IP2 should still be allowed
      const ip2Result = await rateLimiter.checkLimit("192.168.1.2");
      expect(ip2Result.allowed).toBe(true);
    });
  });

  describe("Sliding Window Strategy", () => {
    beforeEach(() => {
      rateLimiter = RateLimiterFactory.createIpLimiter({
        strategy: RateLimitStrategy.SLIDING_WINDOW,
        windowMs: 60000,
        maxRequests: 5,
      });
    });

    it("should allow requests within sliding window", async () => {
      const result1 = await rateLimiter.checkLimit("192.168.1.1");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      // Advance time and make another request
      vi.advanceTimersByTime(10000);
      const result2 = await rateLimiter.checkLimit("192.168.1.1");
      expect(result2.allowed).toBe(true);

      // Old request should slide out of window eventually
      vi.advanceTimersByTime(50000);
      const result3 = await rateLimiter.checkLimit("192.168.1.1");
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(4); // Only recent requests count
    });
  });

  describe("Token Bucket Strategy", () => {
    beforeEach(() => {
      rateLimiter = RateLimiterFactory.createIpLimiter({
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        windowMs: 60000,
        maxRequests: 5,
      });
    });

    it("should start with full bucket", async () => {
      const result = await rateLimiter.checkLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should refill tokens over time", async () => {
      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit("192.168.1.1");
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      let result = await rateLimiter.checkLimit("192.168.1.1");
      expect(result.allowed).toBe(false);

      // Wait for partial refill
      vi.advanceTimersByTime(12000); // 20% of window

      // Should have some tokens again
      result = await rateLimiter.checkLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0); // Just enough for this request
    });
  });

  describe("Whitelist Functionality", () => {
    beforeEach(() => {
      rateLimiter = RateLimiterFactory.createIpLimiter({
        strategy: RateLimitStrategy.FIXED_WINDOW,
        windowMs: 60000,
        maxRequests: 2,
      });
    });

    it("should allow unlimited requests for whitelisted IPs", async () => {
      // Add IP to whitelist
      rateLimiter.addToWhitelist(
        "192.168.1.100",
        RateLimitType.IP,
        "Test whitelist",
      );

      // Make many requests
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkLimit("192.168.1.100");
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(Infinity);
      }
    });

    it("should respect whitelist expiry", async () => {
      const expiry = new Date(Date.now() + 30000); // 30 seconds from now
      rateLimiter.addToWhitelist(
        "192.168.1.100",
        RateLimitType.IP,
        "Test whitelist",
        expiry,
      );

      // Should be allowed now
      let result = await rateLimiter.checkLimit("192.168.1.100");
      expect(result.allowed).toBe(true);

      // Advance past expiry
      vi.advanceTimersByTime(35000);

      // Should be subject to rate limiting again
      result = await rateLimiter.checkLimit("192.168.1.100");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should allow removing from whitelist", async () => {
      rateLimiter.addToWhitelist(
        "192.168.1.100",
        RateLimitType.IP,
        "Test whitelist",
      );

      // Should be allowed
      let result = await rateLimiter.checkLimit("192.168.1.100");
      expect(result.allowed).toBe(true);

      // Remove from whitelist
      rateLimiter.removeFromWhitelist("192.168.1.100", RateLimitType.IP);

      // Now should be subject to rate limiting
      for (let i = 0; i < 2; i++) {
        result = await rateLimiter.checkLimit("192.168.1.100");
        expect(result.allowed).toBe(true);
      }

      // Third request should be blocked
      result = await rateLimiter.checkLimit("192.168.1.100");
      expect(result.allowed).toBe(false);
    });
  });

  describe("Breach Detection", () => {
    beforeEach(() => {
      rateLimiter = RateLimiterFactory.createIpLimiter({
        strategy: RateLimitStrategy.FIXED_WINDOW,
        windowMs: 60000,
        maxRequests: 5,
      });
    });

    it("should detect warning level breaches", async () => {
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.checkLimit("192.168.1.1");
      }

      // Next request should trigger breach
      const result = await rateLimiter.checkLimit("192.168.1.1");
      expect(result.allowed).toBe(false);
      expect(result.breachLevel).toBe("warning");

      // Check breach notifications
      const breaches = rateLimiter.getBreachNotifications();
      expect(breaches).toHaveLength(1);
      expect(breaches[0].breachLevel).toBe("warning");
    });
  });

  describe("Statistics and Monitoring", () => {
    beforeEach(() => {
      rateLimiter = RateLimiterFactory.createIpLimiter();
    });

    it("should provide accurate statistics", async () => {
      // Make some requests
      await rateLimiter.checkLimit("192.168.1.1");
      await rateLimiter.checkLimit("192.168.1.2");
      await rateLimiter.checkLimit("192.168.1.1");

      const stats = rateLimiter.getStatistics();
      expect(stats.totalEntries).toBe(2); // 2 unique IPs
      expect(stats.averageUsage).toBe(1.5); // Average of 2 and 1 requests
    });
  });
});

describe("Email Security Tests", () => {
  let securityManager: EmailSecurityManager;

  beforeEach(() => {
    securityManager = SecurityManagerFactory.createContactFormSecurity();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("XSS Protection", () => {
    it("should block script tags", () => {
      const data = {
        name: 'John<script>alert("xss")</script>',
        email: "test@example.com",
        message: "Hello there",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.isValid).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].type).toBe(SecurityIncidentType.XSS_ATTEMPT);
      expect(result.threats[0].severity).toBe(SecurityThreatLevel.CRITICAL);
    });

    it("should block javascript: URLs", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: 'Click here: javascript:alert("xss")',
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.isValid).toBe(false);
      expect(
        result.threats.some((t) => t.type === SecurityIncidentType.XSS_ATTEMPT),
      ).toBe(true);
    });

    it("should sanitize XSS attempts instead of blocking when not critical", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello <b>world</b>", // Non-critical HTML
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.sanitizedData.message).not.toContain("<b>");
    });
  });

  describe("Email Injection Protection", () => {
    it("should block newline injection attempts", () => {
      const data = {
        name: "John\\r\\nCc: victim@example.com",
        email: "test@example.com",
        message: "Hello there",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.isValid).toBe(false);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.EMAIL_INJECTION,
        ),
      ).toBe(true);
    });

    it("should block BCC injection attempts", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello\\nBcc: victim@example.com\\nMessage",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.isValid).toBe(false);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.EMAIL_INJECTION,
        ),
      ).toBe(true);
    });

    it("should block header injection attempts", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        subject: "Hello\\nContent-Type: text/html",
        message: "Message content",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.isValid).toBe(false);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.EMAIL_INJECTION,
        ),
      ).toBe(true);
    });
  });

  describe("Spam Detection", () => {
    it("should detect spam keywords", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message:
          "WINNER! You have won the lottery! Click here to claim your free viagra prize!",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
    });

    it("should block emails from blocked domains", () => {
      const data = {
        name: "John",
        email: "test@10minutemail.com",
        message: "Hello there",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.isValid).toBe(false);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
      expect(result.blocked).toBe(true);
    });

    it("should detect excessive capitalization", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "THIS IS VERY IMPORTANT AND URGENT PLEASE RESPOND IMMEDIATELY",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
    });

    it("should detect excessive punctuation", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello!!! How are you???? Please respond!!!!!",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
    });

    it("should detect suspiciously short messages", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hi",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
    });

    it("should detect URLs in messages", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Check out this link: https://example.com/product",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
    });
  });

  describe("Bot Detection", () => {
    it("should detect common bot user agents", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello there",
      };

      const source = {
        userAgent:
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      };

      const result = securityManager.validateEmailContent(data, source);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.BOT_DETECTED,
        ),
      ).toBe(true);
    });

    it("should detect requests without user agent", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello there",
      };

      const source = {}; // No user agent

      const result = securityManager.validateEmailContent(data, source);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.BOT_DETECTED,
        ),
      ).toBe(true);
    });

    it("should detect curl user agent", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello there",
      };

      const source = {
        userAgent: "curl/7.68.0",
      };

      const result = securityManager.validateEmailContent(data, source);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.BOT_DETECTED,
        ),
      ).toBe(true);
    });
  });

  describe("Content Validation", () => {
    it("should validate email format", () => {
      const data = {
        name: "John",
        email: "invalid-email",
        message: "Hello there",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.MALICIOUS_CONTENT,
        ),
      ).toBe(true);
    });

    it("should detect suspicious patterns", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "This has base64 content: SGVsbG8gV29ybGQ=",
      };

      const result = securityManager.validateEmailContent(data);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SUSPICIOUS_PATTERN,
        ),
      ).toBe(true);
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize HTML tags from input", () => {
      const data = {
        name: 'John<script>alert("xss")</script>',
        email: "test@example.com",
        message: "Hello <b>world</b>",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.sanitizedData.name).not.toContain("<script>");
      expect(result.sanitizedData.message).not.toContain("<b>");
    });

    it("should sanitize email addresses", () => {
      const data = {
        name: "John",
        email: "test+spam@example.com",
        message: "Hello there",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.sanitizedData.email).toBe("test+spam@example.com");
    });

    it("should sanitize phone numbers", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        phone: "(555) 123-4567 ext. 890",
        message: "Hello there",
      };

      const result = securityManager.validateEmailContent(data);
      expect(result.sanitizedData.phone).toBe("(555) 123-4567 ext. 890");
    });
  });

  describe("CSRF Protection", () => {
    it("should generate and validate CSRF tokens", () => {
      const securityManagerWithCSRF = new EmailSecurityManager({
        csrfTokenSecret: "test-secret",
      });

      const token = securityManagerWithCSRF.generateCSRFToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");

      const isValid = securityManagerWithCSRF.validateCSRFToken(token);
      expect(isValid).toBe(true);
    });

    it("should reject invalid CSRF tokens", () => {
      const securityManagerWithCSRF = new EmailSecurityManager({
        csrfTokenSecret: "test-secret",
      });

      const isValid =
        securityManagerWithCSRF.validateCSRFToken("invalid-token");
      expect(isValid).toBe(false);
    });

    it("should prevent token reuse", () => {
      const securityManagerWithCSRF = new EmailSecurityManager({
        csrfTokenSecret: "test-secret",
      });

      const token = securityManagerWithCSRF.generateCSRFToken();

      // First use should succeed
      expect(securityManagerWithCSRF.validateCSRFToken(token)).toBe(true);

      // Second use should fail
      expect(securityManagerWithCSRF.validateCSRFToken(token)).toBe(false);
    });

    it("should expire old tokens", () => {
      const securityManagerWithCSRF = new EmailSecurityManager({
        csrfTokenSecret: "test-secret",
      });

      const token = securityManagerWithCSRF.generateCSRFToken();

      // Advance time past expiry
      vi.advanceTimersByTime(3600000 + 1000); // 1 hour + 1 second

      const isValid = securityManagerWithCSRF.validateCSRFToken(token);
      expect(isValid).toBe(false);
    });
  });

  describe("Security Headers", () => {
    it("should provide security headers", () => {
      const headers = securityManager.getSecurityHeaders();

      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
      expect(headers["Referrer-Policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(headers["Permissions-Policy"]).toContain("geolocation=()");
    });

    it("should provide CSP header", () => {
      const csp = securityManager.getCSPHeader();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe("Blocking and Whitelisting", () => {
    it("should block IP addresses", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello there",
      };

      const source = { ip: "192.168.1.100" };

      // Block the IP
      securityManager.blockIp("192.168.1.100", "Test block");

      const result = securityManager.validateEmailContent(data, source);
      expect(result.blocked).toBe(true);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.BOT_DETECTED,
        ),
      ).toBe(true);
    });

    it("should block email addresses", () => {
      const data = {
        name: "John",
        email: "spam@example.com",
        message: "Hello there",
      };

      // Block the email
      securityManager.blockEmail("spam@example.com", "Test block");

      const result = securityManager.validateEmailContent(data);
      expect(result.blocked).toBe(true);
      expect(
        result.threats.some(
          (t) => t.type === SecurityIncidentType.SPAM_DETECTED,
        ),
      ).toBe(true);
    });

    it("should allow unblocking IPs", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello there",
      };

      const source = { ip: "192.168.1.100" };

      // Block then unblock
      securityManager.blockIp("192.168.1.100", "Test block");
      securityManager.unblockIp("192.168.1.100");

      const result = securityManager.validateEmailContent(data, source);
      expect(result.blocked).toBe(false);
      expect(result.isValid).toBe(true);
    });

    it("should allow unblocking emails", () => {
      const data = {
        name: "John",
        email: "spam@example.com",
        message: "Hello there",
      };

      // Block then unblock
      securityManager.blockEmail("spam@example.com", "Test block");
      securityManager.unblockEmail("spam@example.com");

      const result = securityManager.validateEmailContent(data);
      expect(result.blocked).toBe(false);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Statistics and Monitoring", () => {
    it("should provide security statistics", () => {
      const data = {
        name: 'John<script>alert("xss")</script>',
        email: "test@10minutemail.com",
        message: "WINNER! Click here for free viagra!",
      };

      securityManager.validateEmailContent(data, {
        ip: "192.168.1.100",
        userAgent: "curl/7.68.0",
      });

      const stats = securityManager.getStatistics();
      expect(stats.totalIncidents).toBeGreaterThan(0);
      expect(stats.blockedIps).toBe(1);
      expect(stats.blockedEmails).toBe(1);
      expect(stats.incidentsByType[SecurityIncidentType.XSS_ATTEMPT]).toBe(1);
      expect(stats.incidentsByType[SecurityIncidentType.SPAM_DETECTED]).toBe(1);
      expect(stats.incidentsByType[SecurityIncidentType.BOT_DETECTED]).toBe(1);
    });

    it("should provide recent incidents", () => {
      const data = {
        name: "John",
        email: "test@example.com",
        message: "Hello there",
      };

      securityManager.validateEmailContent(data, {
        ip: "192.168.1.100",
        userAgent: "curl/7.68.0",
      });

      const recentIncidents = securityManager.getRecentIncidents(24);
      expect(recentIncidents.length).toBe(1);
      expect(recentIncidents[0].type).toBe(SecurityIncidentType.BOT_DETECTED);

      const olderIncidents = securityManager.getRecentIncidents(1); // 1 hour ago
      expect(olderIncidents.length).toBe(0);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complex attack scenarios", () => {
      const maliciousData = {
        name: 'John<script>alert("xss")</script>',
        email: "test@10minutemail.com",
        message:
          'WINNER! Click here: javascript:alert("xss") for free viagra! Bcc: victim@example.com',
      };

      const source = {
        ip: "192.168.1.100",
        userAgent: "curl/7.68.0",
        referer: "http://spam-site.com",
      };

      const result = securityManager.validateEmailContent(
        maliciousData,
        source,
      );

      expect(result.blocked).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.threats.length).toBeGreaterThan(2);

      const threatTypes = result.threats.map((t) => t.type);
      expect(threatTypes).toContain(SecurityIncidentType.XSS_ATTEMPT);
      expect(threatTypes).toContain(SecurityIncidentType.EMAIL_INJECTION);
      expect(threatTypes).toContain(SecurityIncidentType.SPAM_DETECTED);
      expect(threatTypes).toContain(SecurityIncidentType.BOT_DETECTED);
    });

    it("should allow legitimate submissions", () => {
      const legitimateData = {
        name: "John Smith",
        email: "john.smith@company.com",
        phone: "+1 (555) 123-4567",
        message:
          "Hello, I would like to inquire about your services. Please contact me at your earliest convenience. Thank you.",
      };

      const source = {
        ip: "192.168.1.100",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        referer: "https://lofersil.com/",
      };

      const result = securityManager.validateEmailContent(
        legitimateData,
        source,
      );

      expect(result.blocked).toBe(false);
      expect(result.isValid).toBe(true);
      expect(result.threats.length).toBe(0);
      expect(result.sanitizedData.name).toBe("John Smith");
      expect(result.sanitizedData.email).toBe("john.smith@company.com");
    });
  });
});

describe("Rate Limiting and Security Integration Tests", () => {
  let rateLimiter: RateLimiter;
  let securityManager: EmailSecurityManager;

  beforeEach(() => {
    rateLimiter = RateLimiterFactory.createIpLimiter({
      strategy: RateLimitStrategy.FIXED_WINDOW,
      windowMs: 60000,
      maxRequests: 3,
    });

    securityManager = SecurityManagerFactory.createContactFormSecurity();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should apply both rate limiting and security checks", async () => {
    const data = {
      name: "John Smith",
      email: "john@example.com",
      message: "Hello there",
    };

    const source = { ip: "192.168.1.100" };

    // First request should pass both checks
    const rateLimitResult1 = await rateLimiter.checkLimit("192.168.1.100");
    const securityResult1 = securityManager.validateEmailContent(data, source);

    expect(rateLimitResult1.allowed).toBe(true);
    expect(securityResult1.isValid).toBe(true);

    // Make more requests to exhaust rate limit
    await rateLimiter.checkLimit("192.168.1.100");
    await rateLimiter.checkLimit("192.168.1.100");

    // Rate limit should block
    const rateLimitResult4 = await rateLimiter.checkLimit("192.168.1.100");
    expect(rateLimitResult4.allowed).toBe(false);
    expect(rateLimitResult4.breachLevel).toBeDefined();

    // Even legitimate content should be affected by rate limit
    const securityResult2 = securityManager.validateEmailContent(data, source);
    expect(securityResult2.isValid).toBe(true); // Security passes, but rate limit blocks
  });

  it("should handle burst protection scenarios", async () => {
    // Simulate burst traffic
    const requests: Promise<any>[] = [];
    for (let i = 0; i < 10; i++) {
      requests.push(rateLimiter.checkLimit("192.168.1.100"));
    }

    const results = await Promise.all(requests);
    const allowedRequests = results.filter((r) => r.allowed).length;
    const blockedRequests = results.filter((r) => !r.allowed).length;

    expect(allowedRequests).toBe(3); // Should allow exactly the limit
    expect(blockedRequests).toBe(7); // Should block the rest
  });

  it("should log and monitor security incidents", async () => {
    const maliciousData = {
      name: '<script>alert("xss")</script>',
      email: "test@10minutemail.com",
      message: "WINNER! Click here!",
    };

    const source = {
      ip: "192.168.1.100",
      userAgent: "curl/7.68.0",
    };

    // Process malicious request
    securityManager.validateEmailContent(maliciousData, source);

    // Check statistics
    const stats = securityManager.getStatistics();
    expect(stats.totalIncidents).toBeGreaterThan(0);
    expect(stats.blockedEmails).toBe(1);
    expect(stats.incidentsByType[SecurityIncidentType.XSS_ATTEMPT]).toBe(1);
    expect(stats.incidentsByType[SecurityIncidentType.BOT_DETECTED]).toBe(1);
  });

  it("should maintain performance under load", async () => {
    const startTime = Date.now();

    // Simulate 1000 legitimate requests
    const requests: Promise<any>[] = [];
    for (let i = 0; i < 1000; i++) {
      const ip = `192.168.1.${(i % 255) + 1}`; // Different IPs to avoid rate limiting
      requests.push(rateLimiter.checkLimit(ip));
    }

    const results = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (under 5 seconds)
    expect(duration).toBeLessThan(5000);
    expect(results.every((r) => r.allowed)).toBe(true);
  });
});
