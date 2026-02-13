/**
 * TranslationManager Tests
 * Comprehensive unit tests for translation management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranslationManager } from '../modules/TranslationManager.js';

describe('TranslationManager', () => {
  let translationManager: TranslationManager;

  // Mock translations data
  const mockTranslations = {
    pt: {
      hero: {
        title: 'Bem-vindo à LOFERSIL',
        subtitle: 'Produtos Premium',
      },
      navigation: {
        home: 'Início',
        about: 'Sobre',
      },
    },
    en: {
      hero: {
        title: 'Welcome to LOFERSIL',
        subtitle: 'Premium Products',
      },
      navigation: {
        home: 'Home',
        about: 'About',
      },
    },
  };

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();

    // Reset document
    document.documentElement.innerHTML = '';
    document.documentElement.lang = '';

    // Mock fetch for loading translations
    global.fetch = vi.fn((url: string) => {
      const lang = url.match(/\/locales\/(\w+)\.json/)?.[1];
      if (lang && mockTranslations[lang as keyof typeof mockTranslations]) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTranslations[lang as keyof typeof mockTranslations]),
        } as Response);
      }
      return Promise.reject(new Error('Translation file not found'));
    });
  });

  describe('Initialization', () => {
    it('should initialize with default language (pt)', () => {
      translationManager = new TranslationManager();

      // Before initialize, detectLanguage should return default
      expect(translationManager.getCurrentLanguage()).toBe('pt');
    });

    it('should use stored language from localStorage', () => {
      localStorage.setItem('language', 'en');

      translationManager = new TranslationManager();

      expect(translationManager.getCurrentLanguage()).toBe('en');
    });

    it('should detect browser language', () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });

      translationManager = new TranslationManager();

      // Should detect English from browser
      expect(translationManager.getCurrentLanguage()).toBe('en');
    });

    it('should fallback to Portuguese for unsupported languages', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      });

      translationManager = new TranslationManager();

      expect(translationManager.getCurrentLanguage()).toBe('pt');
    });
  });

  describe('loadTranslations', () => {
    beforeEach(() => {
      translationManager = new TranslationManager();
    });

    it('should load translations for all supported languages', async () => {
      await translationManager.loadTranslations();

      expect(fetch).toHaveBeenCalledWith('/locales/pt.json');
      expect(fetch).toHaveBeenCalledWith('/locales/en.json');
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      // Should not throw, but log error
      await expect(translationManager.loadTranslations()).resolves.not.toThrow();
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response)
      );

      await expect(translationManager.loadTranslations()).resolves.not.toThrow();
    });
  });

  describe('Language Detection', () => {
    beforeEach(() => {
      translationManager = new TranslationManager();
    });

    it('should detect browser language', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });

      expect(translationManager.getCurrentLanguage()).toBe('en');
    });

    it('should detect Portuguese browser language', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'pt-BR',
        configurable: true,
      });

      expect(translationManager.getCurrentLanguage()).toBe('pt');
    });

    it('should fallback to Portuguese for unsupported languages', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      });

      expect(translationManager.getCurrentLanguage()).toBe('pt');
    });
  });

  describe('applyTranslations', () => {
    beforeEach(async () => {
      // Create elements with data-i18n attributes
      document.body.innerHTML = `
        <h1 data-i18n="hero.title">Default Title</h1>
        <p data-i18n="hero.subtitle">Default Subtitle</p>
        <nav>
          <a data-i18n="navigation.home" href="/">Home</a>
        </nav>
      `;

      translationManager = new TranslationManager();
      await translationManager.initialize();
    });

    it('should apply translations to elements with data-i18n attributes', () => {
      const title = document.querySelector('[data-i18n="hero.title"]');
      const subtitle = document.querySelector('[data-i18n="hero.subtitle"]');

      expect(title?.textContent).toBe('Bem-vindo à LOFERSIL');
      expect(subtitle?.textContent).toBe('Produtos Premium');
    });

    it('should update translations when language changes', async () => {
      await translationManager.setLanguage('en');

      const title = document.querySelector('[data-i18n="hero.title"]');
      expect(title?.textContent).toBe('Welcome to LOFERSIL');
    });
  });

  describe('translate', () => {
    beforeEach(async () => {
      translationManager = new TranslationManager();
      await translationManager.initialize();
    });

    it('should return translation for given key', () => {
      const title = translationManager.translate('hero.title');
      expect(title).toBe('Bem-vindo à LOFERSIL');
    });

    it('should return key if translation not found', () => {
      const result = translationManager.translate('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('should return translation with interpolation', () => {
      // Add translation with placeholder
      const translations = (translationManager as any).translations;
      translations.pt.greeting = 'Olá, {name}!';

      const result = translationManager.translate('greeting', { name: 'João' });
      expect(result).toBe('Olá, João!');
    });
  });

  describe('updateHtmlLangAttribute', () => {
    beforeEach(async () => {
      translationManager = new TranslationManager();
      await translationManager.initialize();
    });

    it('should update html lang attribute', async () => {
      await translationManager.setLanguage('en');

      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('getTranslations', () => {
    beforeEach(async () => {
      translationManager = new TranslationManager();
      await translationManager.initialize();
    });

    it('should return current language translations', () => {
      const translations = translationManager.getTranslations();

      expect(translations).toBeDefined();
      expect(typeof translations).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation files', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response)
      );

      translationManager = new TranslationManager();

      // Should not throw
      await expect(translationManager.initialize()).resolves.not.toThrow();
    });

    it('should handle localStorage errors', async () => {
      // Make localStorage throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage error');
      });

      translationManager = new TranslationManager();
      await translationManager.initialize();

      // Should not throw when setting language
      await expect(translationManager.setLanguage('en')).resolves.not.toThrow();

      // Restore
      (localStorage as any).setItem = originalSetItem;
    });
  });
});
