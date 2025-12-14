/**
 * VAPID Configuration Tests
 * Tests for VAPID key validation and push notification setup
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PushNotificationManager } from "../../src/scripts/modules/PushNotificationManager.js";
import { EnvironmentLoader } from "../../src/scripts/modules/EnvironmentLoader.js";

// Mock Notification API
const mockNotification = {
  requestPermission: vi.fn(),
  permission: "default" as NotificationPermission,
};

// Mock navigator and serviceWorker
const mockNavigator = {
  serviceWorker: {
    ready: Promise.resolve({
      pushManager: {
        subscribe: vi.fn(),
        getSubscription: vi.fn(),
      },
    }),
  },
};

// Mock window
Object.defineProperty(window, "Notification", {
  value: mockNotification,
  writable: true,
});

Object.defineProperty(window, "navigator", {
  value: mockNavigator,
  writable: true,
});

describe("VAPID Configuration", () => {
  let envLoader: EnvironmentLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    envLoader = new EnvironmentLoader();
  });

  describe("EnvironmentLoader VAPID methods", () => {
    it("should validate VAPID key format correctly", () => {
      // Valid VAPID key (base64url format, 87+ characters)
      const validKey =
        "BMvFTj_7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz";
      expect(envLoader.validateVapidKey(validKey)).toBe(true);

      // Invalid VAPID key (too short)
      const shortKey = "BMvFTj_7pNj2Bz5Q2pLx";
      expect(envLoader.validateVapidKey(shortKey)).toBe(false);

      // Invalid VAPID key (contains invalid characters)
      const invalidCharsKey =
        "BMvFTj/7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz=";
      expect(envLoader.validateVapidKey(invalidCharsKey)).toBe(false);

      // Empty key
      expect(envLoader.validateVapidKey("")).toBe(false);
      expect(envLoader.validateVapidKey(null as any)).toBe(false);
      expect(envLoader.validateVapidKey(undefined as any)).toBe(false);
    });

    it("should return null for missing VAPID key", () => {
      const key = envLoader.getVapidPublicKey();
      expect(key).toBeNull();
    });

    it("should return null for invalid VAPID key", () => {
      // Mock environment with invalid key
      vi.spyOn(envLoader, "get").mockReturnValue("invalid-key");
      const key = envLoader.getVapidPublicKey();
      expect(key).toBeNull();
    });

    it("should check push notification enabled status", () => {
      // Default should be false without valid VAPID key
      expect(envLoader.isPushNotificationEnabled()).toBe(false);
    });
  });

  describe("PushNotificationManager configuration", () => {
    it("should handle missing VAPID key gracefully", () => {
      const manager = new PushNotificationManager(null);
      const status = manager.getConfigurationStatus();

      expect(status.configured).toBe(false);
      expect(status.vapidKeyPresent).toBe(false);
      expect(manager.isReady()).toBe(false);
    });

    it("should handle invalid VAPID key gracefully", () => {
      const manager = new PushNotificationManager("invalid-key");
      const status = manager.getConfigurationStatus();

      expect(status.configured).toBe(false);
      expect(status.vapidKeyPresent).toBe(true);
      expect(manager.isReady()).toBe(false);
    });

    it("should configure correctly with valid VAPID key", () => {
      const validKey =
        "BMvFTj_7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz";
      const manager = new PushNotificationManager(validKey);
      const status = manager.getConfigurationStatus();

      expect(status.configured).toBe(true);
      expect(status.vapidKeyPresent).toBe(true);
      expect(manager.isReady()).toBe(true);
    });

    it("should reject subscription when not configured", async () => {
      const manager = new PushNotificationManager(null);

      await expect(manager.subscribe()).rejects.toThrow(
        "Push notifications not configured - missing or invalid VAPID key",
      );
    });

    it("should reject permission request when not configured", async () => {
      const manager = new PushNotificationManager(null);

      const permission = await manager.requestPermission();
      expect(permission).toBe("denied");
    });

    it("should handle unsubscribe gracefully when not configured", async () => {
      const manager = new PushNotificationManager(null);

      // Should not throw error
      await expect(manager.unsubscribe()).resolves.toBeUndefined();
    });

    it("should handle test notification gracefully when not configured", async () => {
      const manager = new PushNotificationManager(null);

      // Should not throw error
      await expect(manager.showTestNotification()).resolves.toBeUndefined();
    });
  });

  describe("Integration tests", () => {
    it("should work with environment-loaded VAPID key", () => {
      // Mock environment with valid VAPID key
      const validKey =
        "BMvFTj_7pNj2Bz5Q2pLx8XKf9Gh3Jk6LmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz";
      vi.spyOn(envLoader, "get").mockReturnValue(validKey);

      const vapidKey = envLoader.getVapidPublicKey();
      expect(vapidKey).toBe(validKey);

      const manager = new PushNotificationManager(vapidKey);
      expect(manager.isReady()).toBe(true);
    });

    it("should provide helpful configuration status", () => {
      const manager = new PushNotificationManager(null);
      const status = manager.getConfigurationStatus();

      expect(status).toHaveProperty("supported");
      expect(status).toHaveProperty("configured");
      expect(status).toHaveProperty("vapidKeyPresent");
      expect(status).toHaveProperty("permission");

      expect(typeof status.supported).toBe("boolean");
      expect(typeof status.configured).toBe("boolean");
      expect(typeof status.vapidKeyPresent).toBe("boolean");
      expect(typeof status.permission).toBe("string");
    });
  });
});
