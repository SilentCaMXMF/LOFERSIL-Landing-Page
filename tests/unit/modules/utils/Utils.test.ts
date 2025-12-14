/**
 * Utils Tests
 * Test suite for utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  debounce,
  throttle,
  isInViewport,
} from "../../../../src/scripts/modules/Utils.js";

describe("Utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("debounce", () => {
    it("should delay function execution", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should reset delay on multiple calls", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);

      debouncedFn(); // Reset timer
      vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments correctly", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1", "arg2");
      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("throttle", () => {
    it("should limit function execution rate", () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1); // Still 1, throttled

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2); // Now allowed again
    });

    it("should pass arguments correctly", () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn("arg1", "arg2");
      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("isInViewport", () => {
    it("should return true for fully visible element", () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: 10,
          left: 10,
          bottom: 100,
          right: 100,
        }),
      };

      Object.defineProperty(window, "innerHeight", { value: 200 });
      Object.defineProperty(window, "innerWidth", { value: 200 });

      expect(isInViewport(mockElement as Element)).toBe(true);
    });

    it("should return false for partially visible element", () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: -10,
          left: 10,
          bottom: 100,
          right: 100,
        }),
      };

      Object.defineProperty(window, "innerHeight", { value: 200 });
      Object.defineProperty(window, "innerWidth", { value: 200 });

      expect(isInViewport(mockElement as Element)).toBe(false);
    });

    it("should return false for element outside viewport", () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: 300,
          left: 10,
          bottom: 400,
          right: 100,
        }),
      };

      Object.defineProperty(window, "innerHeight", { value: 200 });
      Object.defineProperty(window, "innerWidth", { value: 200 });

      expect(isInViewport(mockElement as Element)).toBe(false);
    });
  });
});
