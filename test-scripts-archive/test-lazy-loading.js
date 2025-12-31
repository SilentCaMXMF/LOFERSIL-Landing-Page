/**
 * Test Lazy Loading Implementation
 * 
 * This test verifies that the LazyLoadManager:
 * 1. Initializes correctly
 * 2. Sets up observers properly
 * 3. Handles image lazy loading
 * 4. Handles section lazy loading
 * 5. Provides fallback behavior
 * 6. Records performance metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LazyLoadManager } from '../src/scripts/modules/LazyLoadManager.js';
import { ErrorManager } from '../src/scripts/modules/ErrorManager.js';

// Mock DOM APIs
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

// Setup mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback, options) => {
  mockIntersectionObserver(callback, options);
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  };
});

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    querySelectorAll: vi.fn(),
    createElement: vi.fn(),
    head: {
      appendChild: vi.fn(),
    },
    body: {
      appendChild: vi.fn(),
    },
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

// Mock performance APIs
global.performance = {
  now: vi.fn().mockReturnValue(100),
} as any;

// Mock Image constructor
global.Image = vi.fn().mockImplementation(() => ({
  onload: null,
  onerror: null,
  src: '',
})) as any;

describe('LazyLoadManager', () => {
  let lazyLoadManager: LazyLoadManager;
  let errorManager: ErrorManager;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset DOM mocks
    (document.querySelectorAll as any).mockReturnValue([]);
    (document.createElement as any).mockReturnValue({
      className: '',
      setAttribute: vi.fn(),
      style: {},
      nextElementSibling: null,
      parentNode: {
        insertBefore: vi.fn(),
        removeChild: vi.fn(),
      },
      remove: vi.fn(),
    });

    // Create instances
    errorManager = new ErrorManager({ showUserMessages: false, logToConsole: false });
    lazyLoadManager = new LazyLoadManager(errorManager);
  });

  afterEach(() => {
    lazyLoadManager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configurations', () => {
      expect(lazyLoadManager).toBeDefined();
      expect(IntersectionObserver).toHaveBeenCalledTimes(3); // image, section, module observers
    });

    it('should handle missing IntersectionObserver support', () => {
      // Remove IntersectionObserver support
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      // Should not throw error
      expect(() => {
        const manager = new LazyLoadManager(errorManager);
        manager.destroy();
      }).not.toThrow();

      // Restore IntersectionObserver
      global.IntersectionObserver = originalIntersectionObserver;
    });
  });

  describe('Image Lazy Loading', () => {
    it('should observe images with data-src attribute', () => {
      const mockImages = [
        { hasAttribute: vi.fn().mockReturnValue(true), classList: { add: vi.fn() } },
        { hasAttribute: vi.fn().mockReturnValue(true), classList: { add: vi.fn() } },
      ] as any;

      (document.querySelectorAll as any).mockReturnValue(mockImages);

      lazyLoadManager.observeNewImages(mockImages as any);

      expect(mockObserve).toHaveBeenCalledTimes(2);
      expect(mockImages[0].classList.add).toHaveBeenCalledWith('lazy');
      expect(mockImages[1].classList.add).toHaveBeenCalledWith('lazy');
    });

    it('should load image progressively when intersecting', async () => {
      const mockImg = {
        getAttribute: vi.fn()
          .mockReturnValueOnce('https://example.com/image.jpg')
          .mockReturnValueOnce('https://example.com/low-quality.jpg'),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn().mockReturnValue(false),
        },
        nextElementSibling: null,
        parentNode: {
          insertBefore: vi.fn(),
        },
      } as any;

      // Get the callback from IntersectionObserver
      const [[callback]] = (IntersectionObserver as any).mock.calls;

      // Simulate intersection
      await callback([{ isIntersecting: true, target: mockImg }]);

      expect(mockImg.getAttribute).toHaveBeenCalledWith('data-src');
      expect(mockImg.classList.add).toHaveBeenCalledWith('lazy-skeleton');
    });

    it('should handle image loading errors gracefully', async () => {
      const mockImg = {
        getAttribute: vi.fn()
          .mockReturnValueOnce('https://example.com/invalid.jpg')
          .mockReturnValueOnce(null),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        nextElementSibling: null,
      } as any;

      const handleErrorSpy = vi.spyOn(errorManager, 'handleError');

      // Get the callback from IntersectionObserver
      const [[callback]] = (IntersectionObserver as any).mock.calls;

      // Simulate intersection with invalid image
      await callback([{ isIntersecting: true, target: mockImg }]);

      expect(handleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Section Lazy Loading', () => {
    it('should observe sections with data-lazy-section attribute', () => {
      const mockSections = [
        { 
          hasAttribute: vi.fn().mockReturnValue(true), 
          classList: { add: vi.fn() },
          id: 'section1',
        },
        { 
          hasAttribute: vi.fn().mockReturnValue(true), 
          classList: { add: vi.fn() },
          className: 'section-class',
        },
      ] as any;

      (document.querySelectorAll as any).mockReturnValue(mockSections);

      lazyLoadManager.observeNewSections(mockSections as any);

      expect(mockObserve).toHaveBeenCalledTimes(2);
      expect(mockSections[0].classList.add).toHaveBeenCalledWith('lazy-section');
      expect(mockSections[1].classList.add).toHaveBeenCalledWith('lazy-section');
    });

    it('should load section with animations when intersecting', () => {
      const mockSection = {
        id: 'test-section',
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        dispatchEvent: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
      } as any;

      // Get the callback from IntersectionObserver
      const [, [callback]] = (IntersectionObserver as any).mock.calls;

      // Simulate intersection
      callback([{ isIntersecting: true, target: mockSection }]);

      expect(mockSection.classList.add).toHaveBeenCalledWith('lazy-loading');
      expect(mockSection.classList.remove).toHaveBeenCalledWith('lazy-loading');
      expect(mockSection.classList.add).toHaveBeenCalledWith('lazy-loaded');
      expect(mockSection.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Module Lazy Loading', () => {
    it('should load modules when intersecting', async () => {
      const mockElement = {
        getAttribute: vi.fn().mockReturnValue('./test-module.js'),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        dispatchEvent: vi.fn(),
      } as any;

      // Mock dynamic import
      const mockModule = { default: {} };
      global.import = vi.fn().mockResolvedValue(mockModule);

      // Get the callback from IntersectionObserver
      const [, , [callback]] = (IntersectionObserver as any).mock.calls;

      // Simulate intersection
      await callback([{ isIntersecting: true, target: mockElement }]);

      expect(mockElement.classList.add).toHaveBeenCalledWith('module-loading');
      expect(global.import).toHaveBeenCalledWith('./test-module.js');
      expect(mockElement.classList.remove).toHaveBeenCalledWith('module-loading');
      expect(mockElement.classList.add).toHaveBeenCalledWith('module-loaded');
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });

    it('should handle module loading errors', async () => {
      const mockElement = {
        getAttribute: vi.fn().mockReturnValue('./invalid-module.js'),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      } as any;

      const handleErrorSpy = vi.spyOn(errorManager, 'handleError');

      // Mock failed import
      global.import = vi.fn().mockRejectedValue(new Error('Module not found'));

      // Get the callback from IntersectionObserver
      const [, , [callback]] = (IntersectionObserver as any).mock.calls;

      // Simulate intersection with invalid module
      await callback([{ isIntersecting: true, target: mockElement }]);

      expect(handleErrorSpy).toHaveBeenCalled();
      expect(mockElement.classList.add).toHaveBeenCalledWith('module-error');
    });
  });

  describe('Performance Metrics', () => {
    it('should track loaded images and sections', () => {
      const metrics = lazyLoadManager.getMetrics();

      expect(metrics).toHaveProperty('imagesLoaded');
      expect(metrics).toHaveProperty('sectionsLoaded');
      expect(metrics).toHaveProperty('totalImages');
      expect(metrics).toHaveProperty('totalSections');
      expect(typeof metrics.imagesLoaded).toBe('number');
      expect(typeof metrics.sectionsLoaded).toBe('number');
    });

    it('should preload critical images', () => {
      const imageUrls = ['https://example.com/critical1.jpg', 'https://example.com/critical2.jpg'];
      const mockLink = {
        rel: '',
        as: '',
        href: '',
      };

      (document.createElement as any).mockReturnValue(mockLink);

      lazyLoadManager.preloadCriticalImages(imageUrls);

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(mockLink.rel).toBe('preload');
      expect(mockLink.as).toBe('image');
    });
  });

  describe('Cleanup', () => {
    it('should disconnect all observers and clear tracking', () => {
      lazyLoadManager.destroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(3);
    });
  });

  describe('Fallback Behavior', () => {
    it('should load all content immediately when IntersectionObserver is not supported', () => {
      // Remove IntersectionObserver support
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      const mockImages = [
        { getAttribute: vi.fn().mockReturnValue('image.jpg'), classList: { add: vi.fn() } },
      ] as any;

      const mockSections = [
        { classList: { add: vi.fn() } },
      ] as any;

      (document.querySelectorAll as any)
        .mockReturnValueOnce(mockImages)
        .mockReturnValueOnce(mockSections);

      // Create manager without IntersectionObserver support
      const manager = new LazyLoadManager(errorManager);

      expect(mockImages[0].classList.add).toHaveBeenCalledWith('lazy-loaded');
      expect(mockSections[0].classList.add).toHaveBeenCalledWith('lazy-loaded');

      manager.destroy();

      // Restore IntersectionObserver
      global.IntersectionObserver = originalIntersectionObserver;
    });
  });
});