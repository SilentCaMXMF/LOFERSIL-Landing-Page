/**
 * UIManager Tests
 * Basic test suite for the UIManager module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from './UIManager.js';
import { ErrorHandler } from './ErrorManager';

describe('UIManager', () => {
  let uiManager: UIManager;
  let mockErrorHandler: ErrorHandler;

  beforeEach(() => {
    mockErrorHandler = { handleError: vi.fn() } as any;

    (global as any).IntersectionObserver = class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    };

    (global as any).MutationObserver = class MockMutationObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    };

    global.document = {
      querySelector: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      createElement: vi.fn().mockReturnValue({
        style: {},
        classList: { add: vi.fn() },
        setAttribute: vi.fn(),
      }),
    } as any;

    uiManager = new UIManager({ scrollThreshold: 100 }, mockErrorHandler);
  });

  describe('Initialization', () => {
    it('should initialize with config', () => {
      expect(uiManager).toBeDefined();
    });
  });

  describe('UI Methods', () => {
    it('should handle showLoading without errors', () => {
      const mockElement = {
        classList: { add: vi.fn() },
        setAttribute: vi.fn(),
        textContent: '',
        style: {},
        appendChild: vi.fn(),
      } as any;

      expect(() => uiManager.showLoading(mockElement as HTMLElement)).not.toThrow();
    });

    it('should handle hideLoading without errors', () => {
      const mockElement = {
        classList: { remove: vi.fn() },
        removeAttribute: vi.fn(),
        querySelector: vi.fn(),
      } as any;

      expect(() => uiManager.hideLoading(mockElement as HTMLElement)).not.toThrow();
    });

    it('should handle toggleVisibility without errors', () => {
      const mockElement = {
        classList: { add: vi.fn(), remove: vi.fn() },
        style: { display: 'none' },
      } as any;

      expect(() => uiManager.toggleVisibility(mockElement as HTMLElement, true)).not.toThrow();
    });
  });
});
