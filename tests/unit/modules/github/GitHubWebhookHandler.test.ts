/**
 * Tests for GitHub Webhook Handler
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  GitHubWebhookHandler,
  GitHubWebhookPayload,
} from "../../../../src/scripts/modules/../../../src/scripts/modules/GitHubWebhookHandler";
import { createHmac } from "crypto";

describe("GitHubWebhookHandler", () => {
  let handler: GitHubWebhookHandler;
  const webhookSecret = "test-webhook-secret-12345";
  const validConfig = {
    webhookSecret,
    supportedEvents: ["issues", "pull_request"],
    maxPayloadSize: 1024 * 1024, // 1MB
    timeout: 30000,
  };

  beforeEach(() => {
    handler = new GitHubWebhookHandler(validConfig);
  });

  describe("Configuration Validation", () => {
    it("should accept valid configuration", () => {
      expect(() => new GitHubWebhookHandler(validConfig)).not.toThrow();
    });

    it("should reject missing webhook secret", () => {
      expect(
        () =>
          new GitHubWebhookHandler({
            ...validConfig,
            webhookSecret: "",
          }),
      ).toThrow("Webhook secret is required");
    });

    it("should reject short webhook secret", () => {
      expect(
        () =>
          new GitHubWebhookHandler({
            ...validConfig,
            webhookSecret: "short",
          }),
      ).toThrow("Webhook secret should be at least 16 characters long");
    });

    it("should reject unsupported events", () => {
      expect(
        () =>
          new GitHubWebhookHandler({
            ...validConfig,
            supportedEvents: ["unsupported"],
          }),
      ).toThrow("Issues event must be supported");
    });
  });

  describe("Signature Validation", () => {
    const testPayload = JSON.stringify({
      action: "opened",
      issue: { number: 1, title: "Test Issue" },
    });

    it("should validate correct signature", () => {
      const signature = createHmac("sha256", webhookSecret)
        .update(testPayload, "utf8")
        .digest("hex");

      const headers = {
        "x-hub-signature-256": `sha256=${signature}`,
      };

      const result = handler["validateSignature"](headers, testPayload);
      expect(result.isValid).toBe(true);
    });

    it("should reject missing signature header", () => {
      const headers = {};
      const result = handler["validateSignature"](headers, testPayload);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Missing X-Hub-Signature-256 header");
    });

    it("should reject invalid signature format", () => {
      const headers = {
        "x-hub-signature-256": "invalid-format",
      };
      const result = handler["validateSignature"](headers, testPayload);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid signature format");
    });

    it("should reject incorrect signature", () => {
      const headers = {
        "x-hub-signature-256": "sha256=incorrect-signature",
      };
      const result = handler["validateSignature"](headers, testPayload);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Signature verification failed");
    });
  });

  describe("Payload Parsing", () => {
    it("should parse valid JSON payload", () => {
      const payload = {
        action: "opened",
        issue: { number: 1, title: "Test" },
        repository: { full_name: "test/repo" },
      };
      const rawBody = JSON.stringify(payload);

      const result = handler["parsePayload"](rawBody);
      expect(result).toEqual(payload);
    });

    it("should return null for invalid JSON", () => {
      const rawBody = "invalid json";
      const result = handler["parsePayload"](rawBody);
      expect(result).toBeNull();
    });

    it("should return null for payload missing required fields", () => {
      const payload = { action: "opened" }; // missing issue and repository
      const rawBody = JSON.stringify(payload);

      const result = handler["parsePayload"](rawBody);
      expect(result).toBeNull();
    });
  });

  describe("Event Validation", () => {
    const validPayload: GitHubWebhookPayload = {
      action: "opened",
      issue: {
        number: 1,
        title: "Test Issue",
        body: "Test body",
        labels: [],
        user: { login: "testuser" },
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        state: "open",
        html_url: "https://github.com/test/repo/issues/1",
      },
      repository: {
        name: "repo",
        full_name: "test/repo",
        owner: { login: "test" },
        html_url: "https://github.com/test/repo",
      },
      sender: { login: "testuser" },
    };

    it("should validate supported issue actions", () => {
      const actions = [
        "opened",
        "edited",
        "closed",
        "reopened",
        "assigned",
        "unassigned",
        "labeled",
        "unlabeled",
      ];

      actions.forEach((action) => {
        const testPayload = { ...validPayload, action: action as any };
        const result = handler["isValidIssueEvent"](testPayload);
        expect(result).toBe(true);
      });
    });

    it("should reject unsupported actions", () => {
      const testPayload = { ...validPayload, action: "unsupported" as any };
      const result = handler["isValidIssueEvent"](testPayload);
      expect(result).toBe(false);
    });

    it("should reject invalid payload structure", () => {
      const invalidPayload = { action: "opened" }; // missing issue and repository
      const result = handler["isValidIssueEvent"](invalidPayload as any);
      expect(result).toBe(false);
    });
  });

  describe("Webhook Handling", () => {
    const validPayload: GitHubWebhookPayload = {
      action: "opened",
      issue: {
        number: 123,
        title: "Test Issue",
        body: "Test body",
        labels: [{ name: "bug" }],
        user: { login: "testuser" },
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        state: "open",
        html_url: "https://github.com/test/repo/issues/123",
      },
      repository: {
        name: "repo",
        full_name: "test/repo",
        owner: { login: "test" },
        html_url: "https://github.com/test/repo",
      },
      sender: { login: "testuser" },
    };

    it("should successfully handle valid webhook", async () => {
      const rawBody = JSON.stringify(validPayload);
      const signature = createHmac("sha256", webhookSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const headers = {
        "x-hub-signature-256": `sha256=${signature}`,
      };

      const result = await handler.handleWebhook(headers, rawBody, "issues");

      expect(result.success).toBe(true);
      expect(result.issueNumber).toBe(123);
      expect(result.action).toBe("opened");
    });

    it("should reject webhook with invalid signature", async () => {
      const rawBody = JSON.stringify(validPayload);
      const headers = {
        "x-hub-signature-256": "sha256=invalid-signature",
      };

      const result = await handler.handleWebhook(headers, rawBody, "issues");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Signature verification failed");
    });

    it("should reject webhook with unsupported event type", async () => {
      const rawBody = JSON.stringify(validPayload);
      const signature = createHmac("sha256", webhookSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const headers = {
        "x-hub-signature-256": `sha256=${signature}`,
      };

      const result = await handler.handleWebhook(
        headers,
        rawBody,
        "unsupported",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported event type");
    });

    it("should reject payload exceeding size limit", async () => {
      const largeConfig = {
        ...validConfig,
        maxPayloadSize: 100, // Very small limit
      };
      const largeHandler = new GitHubWebhookHandler(largeConfig);

      const largeBody = "x".repeat(200); // Exceeds limit
      const signature = createHmac("sha256", webhookSecret)
        .update(largeBody, "utf8")
        .digest("hex");

      const headers = {
        "x-hub-signature-256": `sha256=${signature}`,
      };

      const result = await largeHandler.handleWebhook(
        headers,
        largeBody,
        "issues",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Payload size exceeds maximum allowed");
    });

    it("should handle malformed JSON payload", async () => {
      const malformedBody = "{ invalid json";
      const signature = createHmac("sha256", webhookSecret)
        .update(malformedBody, "utf8")
        .digest("hex");

      const headers = {
        "x-hub-signature-256": `sha256=${signature}`,
      };

      const result = await handler.handleWebhook(
        headers,
        malformedBody,
        "issues",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to parse webhook payload");
    });

    it("should reject invalid issue event payload", async () => {
      const invalidPayload = {
        action: "opened",
        // missing issue and repository
      };
      const rawBody = JSON.stringify(invalidPayload);
      const signature = createHmac("sha256", webhookSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const headers = {
        "x-hub-signature-256": `sha256=${signature}`,
      };

      const result = await handler.handleWebhook(headers, rawBody, "issues");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid issue event payload structure");
    });
  });

  describe("Utility Methods", () => {
    it("should return supported actions", () => {
      const actions = handler.getSupportedActions();
      expect(actions).toEqual([
        "opened",
        "edited",
        "closed",
        "reopened",
        "assigned",
        "unassigned",
        "labeled",
        "unlabeled",
      ]);
    });

    it("should return configuration", () => {
      const config = handler.getConfig();
      expect(config.webhookSecret).toBe(webhookSecret);
      expect(config.supportedEvents).toEqual(["issues", "pull_request"]);
    });
  });
});
