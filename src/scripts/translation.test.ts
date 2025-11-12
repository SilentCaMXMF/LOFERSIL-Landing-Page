/**
 * Test script to verify dual language functionality
 * This simulates the language switching behavior
 */

import { TranslationManager } from './modules/TranslationManager.js';
import { ErrorHandler } from './modules/ErrorHandler.js';

// Mock DOM elements for testing
const mockElements = [
  { getAttribute: () => 'hero.title', textContent: 'Original Title' },
  { getAttribute: () => 'hero.subtitle', textContent: 'Original Subtitle' },
  { getAttribute: () => 'nav.about', textContent: 'Sobre Nós' },
];

// Mock document.querySelectorAll
const originalQuerySelectorAll = document.querySelectorAll;
document.querySelectorAll = vi.fn((selector: string) => {
  if (selector === '[data-translate]') {
    return mockElements as any;
  }
  return originalQuerySelectorAll.call(document, selector);
});

// Mock fetch for loading translations
const originalFetch = global.fetch;
global.fetch = vi.fn(async (url: string) => {
  if (url.includes('/locales/pt.json')) {
    return {
      ok: true,
      json: async () => ({
        hero: { title: 'Bem-vindo à LOFERSIL', subtitle: 'Produtos Premium' },
        nav: { about: 'Sobre Nós' },
      }),
    };
  } else if (url.includes('/locales/en.json')) {
    return {
      ok: true,
      json: async () => ({
        hero: { title: 'Welcome to LOFERSIL', subtitle: 'Premium Products' },
        nav: { about: 'About Us' },
      }),
    };
  }
  return originalFetch(url);
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.language
Object.defineProperty(navigator, 'language', { value: 'pt-PT' });

// Test the TranslationManager
describe('TranslationManager Dual Language Test', () => {
  let translationManager: TranslationManager;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    translationManager = new TranslationManager(errorHandler);
    vi.clearAllMocks();
  });

  test('should initialize with Portuguese as default', async () => {
    localStorageMock.getItem.mockReturnValue(null); // No stored preference
    await translationManager.initialize();

    expect(translationManager.getCurrentLanguage()).toBe('pt');
    expect(localStorageMock.setItem).not.toHaveBeenCalled(); // Should not store default
  });

  test('should switch to English and update elements', async () => {
    await translationManager.initialize();
    translationManager.switchLanguage('en');

    expect(translationManager.getCurrentLanguage()).toBe('en');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'en');

    // Check if translations were applied
    expect(mockElements[0].textContent).toBe('Welcome to LOFERSIL');
    expect(mockElements[1].textContent).toBe('Premium Products');
  });

  test('should switch back to Portuguese', async () => {
    await translationManager.initialize();
    translationManager.switchLanguage('en');
    translationManager.switchLanguage('pt');

    expect(translationManager.getCurrentLanguage()).toBe('pt');
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith('language', 'pt');

    // Check if Portuguese translations were applied
    expect(mockElements[0].textContent).toBe('Bem-vindo à LOFERSIL');
    expect(mockElements[1].textContent).toBe('Produtos Premium');
  });

  test('should detect browser language preference', async () => {
    // Test Portuguese detection
    Object.defineProperty(navigator, 'language', { value: 'pt-BR' });
    const tm1 = new TranslationManager(errorHandler);
    expect(tm1.getCurrentLanguage()).toBe('pt');

    // Test English detection
    Object.defineProperty(navigator, 'language', { value: 'en-US' });
    const tm2 = new TranslationManager(errorHandler);
    expect(tm2.getCurrentLanguage()).toBe('en');
  });

  test('should persist language preference in localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('en'); // Stored preference
    const tm = new TranslationManager(errorHandler);
    await tm.initialize();

    expect(tm.getCurrentLanguage()).toBe('en');
  });
});
