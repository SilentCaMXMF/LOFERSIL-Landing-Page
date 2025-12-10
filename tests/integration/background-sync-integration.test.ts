/**
 * BackgroundSync Integration Tests
 * Tests integration between BackgroundSync and ContactFormManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BackgroundSync } from "../../src/scripts/modules/BackgroundSync.js";
import { ContactFormManager } from "../../src/scripts/modules/ContactFormManager.js";

// Mock DOM elements
document.body.innerHTML = `
  <form id="contact-form-element">
    <input name="name" type="text" />
    <input name="email" type="email" />
    <input name="phone" type="tel" />
    <textarea name="message"></textarea>
    <button id="contact-submit" type="submit">
      <span class="btn-text">Enviar</span>
      <span class="btn-loading hidden">Enviando...</span>
    </button>
  </form>
  <div id="form-success" class="hidden"></div>
  <div id="form-error" class="hidden"></div>
  <div id="contact-form-live-region"></div>
  <div id="form-progress"></div>
`;

// Mock service worker
Object.defineProperty(global, "navigator", {
  value: {
    serviceWorker: {
      ready: Promise.resolve({
        sync: {
          register: vi.fn().mockResolvedValue(undefined),
          getTags: vi.fn().mockResolvedValue(["contact-form-sync"]),
        },
      }),
    },
    onLine: false, // Start offline to test background sync
  },
  writable: true,
});

// Mock IndexedDB
Object.defineProperty(global, "indexedDB", {
  value: {
    open: vi.fn(() => {
      const request = {
        result: {
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              getAll: vi.fn().mockResolvedValue([]),
              add: vi.fn().mockResolvedValue(undefined),
              clear: vi.fn().mockResolvedValue(undefined),
              delete: vi.fn().mockResolvedValue(undefined),
            })),
          })),
        },
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      setTimeout(() => {
        if (request.onsuccess) (request.onsuccess as any)({ target: request });
      }, 0);

      return request;
    }),
  },
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
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
});

describe("BackgroundSync Integration", () => {
  let contactFormManager: ContactFormManager;

  beforeEach(() => {
    vi.clearAllMocks();
    contactFormManager = new ContactFormManager({
      formSelector: "#contact-form-element",
      submitButtonSelector: "#contact-submit",
      successMessageSelector: "#form-success",
      errorMessageSelector: "#form-error",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Offline form submission", () => {
    it("should register form for background sync when offline", async () => {
      // Initialize BackgroundSync
      await BackgroundSync.initialize();

      // Fill form with test data
      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
      const emailInput = form.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageInput = form.querySelector(
        '[name="message"]',
      ) as HTMLInputElement;

      nameInput.value = "Test User";
      emailInput.value = "test@example.com";
      messageInput.value = "Test message";

      // Submit form (should trigger background sync)
      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify background sync was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should show appropriate message when offline and background sync is available", async () => {
      await BackgroundSync.initialize();

      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
      const emailInput = form.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageInput = form.querySelector(
        '[name="message"]',
      ) as HTMLInputElement;

      nameInput.value = "Test User";
      emailInput.value = "test@example.com";
      messageInput.value = "Test message";

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const successElement = document.querySelector("#form-success");
      expect(successElement?.textContent).toContain("Sem ligação à internet");
    });

    it("should show error message when offline and background sync is not supported", async () => {
      // Mock no background sync support
      Object.defineProperty(global, "navigator", {
        value: {
          onLine: false,
        },
        writable: true,
      });

      const form = document.querySelector(
        "#contact-form-element",
      ) as HTMLFormElement;
      const nameInput = form.querySelector('[name="name"]') as HTMLInputElement;
      const emailInput = form.querySelector(
        '[name="email"]',
      ) as HTMLInputElement;
      const messageInput = form.querySelector(
        '[name="message"]',
      ) as HTMLInputElement;

      nameInput.value = "Test User";
      emailInput.value = "test@example.com";
      messageInput.value = "Test message";

      const submitEvent = new Event("submit", { cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorElement = document.querySelector("#form-error");
      expect(errorElement?.textContent).toContain("Sem ligação à internet");
    });
  });

  describe("Background sync status", () => {
    it("should provide sync status information", async () => {
      await BackgroundSync.initialize();

      const status = await BackgroundSync.getSyncStatus();

      expect(status).toHaveProperty("isSupported");
      expect(status).toHaveProperty("isRegistered");
      expect(status).toHaveProperty("pendingCount");
      expect(status).toHaveProperty("lastSyncTime");
      expect(status).toHaveProperty("storageUsed");
      expect(status).toHaveProperty("storageQuota");
    });

    it("should track pending forms count", async () => {
      await BackgroundSync.initialize();

      const count = await BackgroundSync.getPendingCount();
      expect(typeof count).toBe("number");
    });
  });

  describe("Manual sync triggering", () => {
    it("should allow manual sync trigger when online", async () => {
      // Set online
      Object.defineProperty(global, "navigator", {
        value: {
          ...global.navigator,
          onLine: true,
        },
        writable: true,
      });

      await BackgroundSync.initialize();
      await BackgroundSync.triggerSync();

      // Should not throw error
      expect(true).toBe(true);
    });

    it("should not sync when offline", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await BackgroundSync.initialize();
      await BackgroundSync.triggerSync();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cannot sync while offline"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Configuration", () => {
    it("should allow configuration updates", () => {
      expect(() => {
        BackgroundSync.updateConfig({
          maxRetries: 5,
          enableLogging: false,
        });
      }).not.toThrow();
    });
  });
});
