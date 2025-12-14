/**
 * Router Tests
 * Basic test suite for the Router module
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Router } from "../../../../src/scripts/modules/Router.js";
import { ErrorHandler } from "../../../../src/scripts/modules/ErrorManager";
import { TranslationManager } from "../../../../src/scripts/modules/TranslationManager.js";
import { NavigationManager } from "../../../../src/scripts/modules/NavigationManager.js";

// Mock dependencies
const mockPushState = vi.fn();
const mockAddEventListener = vi.fn();
const mockDOMPurify = vi.fn();

(global as any).DOMPurify = { sanitize: mockDOMPurify };

// Mock History API
Object.defineProperty(window, "history", {
  value: { pushState: mockPushState },
  writable: true,
});

// Mock Location
Object.defineProperty(window, "location", {
  value: { pathname: "/" },
  writable: true,
});

// Mock document
global.document = {
  addEventListener: mockAddEventListener,
} as any;

describe("Router", () => {
  let router: Router;
  let mockErrorHandler: ErrorHandler;
  let mockTranslationManager: TranslationManager;
  let mockNavigationManager: NavigationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDOMPurify.mockReturnValue("<p>Safe content</p>");

    mockErrorHandler = { handleError: vi.fn() } as any;
    mockTranslationManager = { translate: vi.fn() } as any;
    mockNavigationManager = { setActiveNavigation: vi.fn() } as any;

    router = new Router(
      null,
      mockTranslationManager,
      mockNavigationManager,
      vi.fn(),
      mockErrorHandler,
    );
  });

  describe("Route Validation", () => {
    it("should validate existing routes", () => {
      expect(router.isValidRoute("/")).toBe(true);
      expect(router.isValidRoute("/products")).toBe(true);
    });

    it("should reject invalid routes", () => {
      expect(router.isValidRoute("/invalid")).toBe(false);
    });
  });

  describe("Navigation", () => {
    it("should navigate programmatically", () => {
      router.navigateTo("/products");
      expect(mockPushState).toHaveBeenCalledWith(null, "", "/products");
    });
  });

  describe("Setup", () => {
    it("should setup routing event listeners", () => {
      router.setupRouting();
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe("Rendering", () => {
    it("should render pages without errors", () => {
      expect(() => router.renderPage()).not.toThrow();
    });
  });
});
