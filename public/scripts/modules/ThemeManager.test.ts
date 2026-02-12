/**
 * ThemeManager Tests
 * Comprehensive unit tests for theme management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../modules/ThemeManager.js';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    // Reset DOM
    document.documentElement.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset matchMedia mock to return light theme by default
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Initialization', () => {
    it('should initialize with system preference when no saved theme', () => {
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should use saved theme from localStorage when available', () => {
      localStorage.setItem('lofersil-theme', 'dark');
      
      themeManager = new ThemeManager();
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should ignore invalid saved themes', () => {
      localStorage.setItem('lofersil-theme', 'invalid-theme');
      
      themeManager = new ThemeManager();
      
      // Should fallback to system preference (light in our mock)
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
  });

  describe('Theme Toggle', () => {
    beforeEach(() => {
      // Create theme toggle button
      const button = document.createElement('button');
      button.id = 'theme-toggle';
      button.innerHTML = `
        <span class="theme-toggle-icon sun"></span>
        <span class="theme-toggle-icon moon"></span>
      `;
      document.body.appendChild(button);
      
      themeManager = new ThemeManager();
    });

    it('should toggle theme from light to dark', () => {
      expect(themeManager.getCurrentTheme()).toBe('light');
      
      themeManager.toggleTheme();
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('lofersil-theme')).toBe('dark');
    });

    it('should toggle theme from dark to light', () => {
      themeManager.setTheme('dark');
      
      themeManager.toggleTheme();
      
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('lofersil-theme')).toBe('light');
    });
  });

  describe('setTheme', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should set theme to dark', () => {
      themeManager.setTheme('dark');
      
      expect(themeManager.getCurrentTheme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('lofersil-theme')).toBe('dark');
    });

    it('should set theme to light', () => {
      themeManager.setTheme('dark'); // Set to dark first
      themeManager.setTheme('light'); // Then switch to light
      
      expect(themeManager.getCurrentTheme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem('lofersil-theme')).toBe('light');
    });
  });

  describe('resetToSystemPreference', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should clear localStorage and reset to system preference', () => {
      themeManager.setTheme('dark'); // Set saved theme
      expect(localStorage.getItem('lofersil-theme')).toBe('dark');
      
      themeManager.resetToSystemPreference();
      
      expect(localStorage.getItem('lofersil-theme')).toBeNull();
      expect(themeManager.getCurrentTheme()).toBe('light'); // System preference in mock
    });
  });

  describe('Theme Change Event', () => {
    beforeEach(() => {
      themeManager = new ThemeManager();
    });

    it('should dispatch themeChange event when theme changes', () => {
      const eventHandler = vi.fn();
      window.addEventListener('themeChange', eventHandler);
      
      themeManager.setTheme('dark');
      
      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.theme).toBe('dark');
      
      window.removeEventListener('themeChange', eventHandler);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage error');
      });
      
      themeManager = new ThemeManager();
      
      // Should not throw
      expect(() => themeManager.setTheme('dark')).not.toThrow();
      
      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });
});
