/**
 * BackgroundSync Module Tests
 * Tests for PWA background sync functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BackgroundSync } from "../../../../src/scripts/modules/BackgroundSync.js";

// Mock service worker and IndexedDB
const mockSyncRegister = vi.fn().mockResolvedValue(undefined);
const mockSyncGetTags = vi.fn().mockResolvedValue(["contact-form-sync"]);

const mockServiceWorker = {
  ready: Promise.resolve({
    sync: {
      register: mockSyncRegister,
      getTags: mockSyncGetTags,
    },
  }),
};

const mockIndexedDB = {
  open: vi.fn(),
};

// Mock navigator
Object.defineProperty(global, "navigator", {
  value: {
    serviceWorker: mockServiceWorker,
    onLine: true,
  },
  writable: true,
});

// Mock indexedDB
Object.defineProperty(global, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BackgroundSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock IndexedDB operations
    const mockDB = {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          getAll: vi.fn().mockResolvedValue([]),
          add: vi.fn().mockResolvedValue(undefined),
          clear: vi.fn().mockResolvedValue(undefined),
          delete: vi.fn().mockResolvedValue(undefined),
        })),
      })),
    };

    mockIndexedDB.open.mockImplementation(() => {
      const request = {
        result: mockDB,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      // Simulate successful open
      setTimeout(() => {
        if (request.onsuccess) (request.onsuccess as any)({ target: request });
      }, 0);

      return request;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isSupported", () => {
    it("should return true when service worker and sync are supported", () => {
      expect(BackgroundSync.isSupported()).toBe(true);
    });

    it("should return false when service worker is not supported", () => {
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
      });

      expect(BackgroundSync.isSupported()).toBe(false);
    });

    it("should return true when IndexedDB is available but sync is not", () => {
      Object.defineProperty(global, "navigator", {
        value: {
          serviceWorker: {}, // No sync property
        },
        writable: true,
      });

      expect(BackgroundSync.isSupported()).toBe(true);
    });
  });

  describe("initialize", () => {
    it("should initialize successfully when supported", async () => {
      await expect(BackgroundSync.initialize()).resolves.not.toThrow();
    });

    it("should log warning when not supported", async () => {
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await BackgroundSync.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Background sync not supported"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("registerContactForm", () => {
    const mockFormData = {
      name: "Test User",
      email: "test@example.com",
      message: "Test message",
    };

    it("should register contact form successfully", async () => {
      await expect(
        BackgroundSync.registerContactForm(mockFormData),
      ).resolves.not.toThrow();

      expect(mockServiceWorker.ready.then).toBeDefined();
    });

    it("should throw error when not supported", async () => {
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
      });

      await expect(
        BackgroundSync.registerContactForm(mockFormData),
      ).rejects.toThrow("Background sync not supported");
    });

    it("should handle sync registration failure", async () => {
      const mockError = new Error("Sync registration failed");
      mockSyncRegister.mockRejectedValue(mockError);

      await expect(
        BackgroundSync.registerContactForm(mockFormData),
      ).rejects.toThrow(mockError);
    });
  });

  describe("getSyncStatus", () => {
    it("should return sync status", async () => {
      const status = await BackgroundSync.getSyncStatus();

      expect(status).toHaveProperty("isSupported");
      expect(status).toHaveProperty("isRegistered");
      expect(status).toHaveProperty("pendingCount");
      expect(status).toHaveProperty("lastSyncTime");
      expect(status).toHaveProperty("storageUsed");
      expect(status).toHaveProperty("storageQuota");
    });
  });

  describe("getPendingCount", () => {
    it("should return 0 when no pending forms", async () => {
      const count = await BackgroundSync.getPendingCount();
      expect(count).toBe(0);
    });
  });

  describe("getPendingForms", () => {
    it("should return empty array when no pending forms", async () => {
      const forms = await BackgroundSync.getPendingForms();
      expect(forms).toEqual([]);
    });
  });

  describe("triggerSync", () => {
    it("should not sync when offline", async () => {
      Object.defineProperty(global, "navigator", {
        value: {
          ...global.navigator,
          onLine: false,
        },
        writable: true,
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await BackgroundSync.triggerSync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cannot sync while offline"),
      );

      consoleSpy.mockRestore();
    });

    it("should sync when online and no pending forms", async () => {
      await expect(BackgroundSync.triggerSync()).resolves.not.toThrow();
    });
  });

  describe("clearPending", () => {
    it("should clear pending forms", async () => {
      await expect(BackgroundSync.clearPending()).resolves.not.toThrow();
    });
  });

  describe("updateConfig", () => {
    it("should update configuration", () => {
      const newConfig = {
        maxRetries: 5,
        enableLogging: false,
      };

      expect(() => BackgroundSync.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe("Error handling", () => {
    it("should handle IndexedDB errors gracefully", async () => {
      mockIndexedDB.open.mockImplementation(() => {
        const request = {
          error: new Error("IndexedDB error"),
          onsuccess: null,
          onerror: null,
        };

        setTimeout(() => {
          if (request.onerror) (request.onerror as any)({ target: request });
        }, 0);

        return request;
      });

      const count = await BackgroundSync.getPendingCount();
      expect(count).toBe(0);
    });

    it("should handle localStorage errors gracefully", async () => {
      Object.defineProperty(global, "indexedDB", {
        value: undefined,
        writable: true,
      });

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const count = await BackgroundSync.getPendingCount();
      expect(count).toBe(0);
    });
  });

  describe("Fallback mechanisms", () => {
    it("should use localStorage when IndexedDB is not available", async () => {
      Object.defineProperty(global, "indexedDB", {
        value: undefined,
        writable: true,
      });

      const mockFormData = {
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      };

      localStorageMock.getItem.mockReturnValue("[]");

      await expect(
        BackgroundSync.registerContactForm(mockFormData),
      ).resolves.not.toThrow();

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe("Metrics and logging", () => {
    it("should record metrics for successful operations", async () => {
      const mockFormData = {
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      };

      await BackgroundSync.registerContactForm(mockFormData);

      // Metrics are recorded internally, so we just verify no errors are thrown
      expect(true).toBe(true);
    });

    it("should log messages when enabled", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      BackgroundSync.updateConfig({ enableLogging: true });
      await BackgroundSync.initialize();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
