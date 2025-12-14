/**
 * Rate Limiting Integration Tests
 * Integration tests for rate limiting functionality with the actual server
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Rate Limiting Integration", () => {
  let serverProcess: any;
  const SERVER_URL = "http://localhost:8001";
  const TEST_PORT = 8001;

  beforeAll(async () => {
    // Start the server in test mode
    serverProcess = spawn(
      "node",
      ["--experimental-modules", join(__dirname, "../../server.js")],
      {
        env: {
          ...process.env,
          NODE_ENV: "test",
          PORT: TEST_PORT.toString(),
          RATE_LIMIT_WINDOW_MS: "5000", // 5 seconds for testing
          RATE_LIMIT_MAX_REQUESTS: "3", // 3 requests per window
          CONTACT_RATE_LIMIT_MAX: "2", // 2 contact requests per hour
          CSRF_RATE_LIMIT_MAX: "5", // 5 CSRF requests per hour
          DISABLE_RATE_LIMITING: "false",
        },
        stdio: "pipe",
      },
    );

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30;

      const checkServer = async () => {
        attempts++;
        try {
          await request(SERVER_URL).get("/api/health").timeout(1000);
          resolve(true);
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(new Error("Server failed to start"));
            return;
          }
          setTimeout(checkServer, 200);
        }
      };

      checkServer();
    });
  }, 30000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  describe("CSRF Token Rate Limiting", () => {
    it("should allow CSRF token requests within limit", async () => {
      const response1 = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response1.headers).toHaveProperty("x-ratelimit-limit");
      expect(response1.headers).toHaveProperty("x-ratelimit-remaining");

      const response2 = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(200);

      expect(response2.body.success).toBe(true);
    });

    it("should rate limit CSRF token requests exceeding limit", async () => {
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await request(SERVER_URL).get("/api/csrf-token");
      }

      // Next request should be rate limited
      const response = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("CSRF_RATE_LIMIT_EXCEEDED");
      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers["x-ratelimit-remaining"]).toBe("0");
    });
  });

  describe("Contact Form Rate Limiting", () => {
    it("should allow contact form submissions within limit", async () => {
      // First get a CSRF token
      const csrfResponse = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(200);

      const csrfToken = csrfResponse.body.data.token;
      const cookies = csrfResponse.headers["set-cookie"];

      // Submit contact form
      const response1 = await request(SERVER_URL)
        .post("/api/contact")
        .set("Cookie", cookies)
        .send({
          csrf_token: csrfToken,
          name: "Test User",
          email: "test@example.com",
          message:
            "This is a test message for rate limiting integration testing.",
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
    });

    it("should rate limit contact form submissions exceeding limit", async () => {
      // Submit multiple contact forms to exceed the limit
      for (let i = 0; i < 2; i++) {
        // Get CSRF token for each request
        const csrfResponse = await request(SERVER_URL)
          .get("/api/csrf-token")
          .expect(200);

        const csrfToken = csrfResponse.body.data.token;
        const cookies = csrfResponse.headers["set-cookie"];

        await request(SERVER_URL)
          .post("/api/contact")
          .set("Cookie", cookies)
          .send({
            csrf_token: csrfToken,
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            message: `Test message ${i} for rate limiting testing.`,
          });
      }

      // Next submission should be rate limited
      const csrfResponse = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(200);

      const csrfToken = csrfResponse.body.data.token;
      const cookies = csrfResponse.headers["set-cookie"];

      const response = await request(SERVER_URL)
        .post("/api/contact")
        .set("Cookie", cookies)
        .send({
          csrf_token: csrfToken,
          name: "Test User Exceeded",
          email: "exceeded@example.com",
          message: "This should be rate limited.",
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("CONTACT_RATE_LIMIT_EXCEEDED");
    });
  });

  describe("General Rate Limiting", () => {
    it("should apply general rate limiting to all requests", async () => {
      // Make multiple requests to trigger general rate limiting
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(SERVER_URL).get("/api/csrf-token"));
      }

      const responses = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe("Rate Limit Headers", () => {
    it("should include proper rate limit headers", async () => {
      const response = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(200);

      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers).toHaveProperty("x-ratelimit-remaining");
      expect(response.headers).toHaveProperty("x-ratelimit-reset");
      expect(response.headers).toHaveProperty("x-ratelimit-window");

      // Validate header formats
      expect(parseInt(response.headers["x-ratelimit-limit"])).toBeGreaterThan(
        0,
      );
      expect(
        parseInt(response.headers["x-ratelimit-remaining"]),
      ).toBeGreaterThanOrEqual(0);
      expect(response.headers["x-ratelimit-reset"]).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });
  });

  describe("Rate Limit Error Responses", () => {
    it("should provide detailed error information", async () => {
      // Exhaust the rate limit
      for (let i = 0; i < 6; i++) {
        await request(SERVER_URL).get("/api/csrf-token");
      }

      const response = await request(SERVER_URL)
        .get("/api/csrf-token")
        .expect(429);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("details");

      expect(response.body.details).toHaveProperty("endpoint");
      expect(response.body.details).toHaveProperty("windowMs");
      expect(response.body.details).toHaveProperty("maxRequests");
      expect(response.body.details).toHaveProperty("retryAfter");
    });
  });

  describe("IP-based Rate Limiting", () => {
    it("should limit requests based on IP address", async () => {
      // Test with different IP addresses using x-forwarded-for header
      const ip1Response = await request(SERVER_URL)
        .get("/api/csrf-token")
        .set("X-Forwarded-For", "192.168.1.100")
        .expect(200);

      const ip2Response = await request(SERVER_URL)
        .get("/api/csrf-token")
        .set("X-Forwarded-For", "192.168.1.200")
        .expect(200);

      // Both should succeed as they have different IPs
      expect(ip1Response.body.success).toBe(true);
      expect(ip2Response.body.success).toBe(true);
    });
  });
});
