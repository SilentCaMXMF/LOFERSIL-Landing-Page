/**
 * LanguageManager - Handles translation system and language switching
 * Manages language loading, switching, and UI updates
 */

import { ErrorHandler } from './ErrorHandler';

/**
 * Translation types
 */
interface Translations {
  [key: string]: string | Translations;
}

/**
 * Language configuration interface
 */
interface LanguageConfig {
  code: string;
  name: string;
  flag: string;
}

/**
 * LanguageManager class for handling internationalization
 */
export class LanguageManager {
  private langToggle: HTMLElement | null = null;
  private currentLanguage: string = 'pt';
  private translations: Translations = {};
  private languages: LanguageConfig[];
  private errorHandler: ErrorHandler;

  constructor(languages: LanguageConfig[], errorHandler: ErrorHandler) {
    this.languages = languages;
    this.errorHandler = errorHandler;
    this.setupDOMElements();
    this.setupLanguageSystem();
  }

  /**
   * Setup DOM element references
   */
  private setupDOMElements(): void {
    this.langToggle = document.getElementById('lang-toggle');
  }

  /**
   * Setup language system
   */
  private async setupLanguageSystem(): Promise<void> {
    try {
      // Load saved language or default to Portuguese
      this.currentLanguage = localStorage.getItem('language') || 'pt';

      // Load translations
      await this.loadTranslations(this.currentLanguage);

      // Update language toggle button
      this.updateLanguageToggle();

      // Update HTML lang attribute
      document.documentElement.lang = this.currentLanguage;

      // Setup hreflang tags
      this.setupHreflangTags();

      // Setup event listener for language toggle
      this.langToggle?.addEventListener('click', () => this.toggleLanguage());
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to setup language system');
    }
  }

  /**
   * Load translations for a specific language
   */
  private async loadTranslations(language: string): Promise<void> {
    try {
      const response = await fetch(`/locales/${language}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${language} translations`);
      }
      this.translations = await response.json();
    } catch (error) {
      this.errorHandler.handleError(error, `Error loading translations for ${language}`);
      // Fallback to English if available
      if (language !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }

  /**
   * Toggle between languages
   */
  public async toggleLanguage(): Promise<void> {
    try {
      const currentIndex = this.languages.findIndex(lang => lang.code === this.currentLanguage);
      const nextIndex = (currentIndex + 1) % this.languages.length;
      const nextLanguage = this.languages[nextIndex].code;

      this.currentLanguage = nextLanguage;
      localStorage.setItem('language', nextLanguage);

      // Load new translations
      await this.loadTranslations(nextLanguage);

      // Update UI
      this.applyTranslations();
      this.updateLanguageToggle();
      document.documentElement.lang = nextLanguage;

      // Update hreflang tags
      this.updateHreflangTags();

      // Update meta tags
      this.updateMetaTagsForLanguage();

      // Dispatch custom event for other modules
      window.dispatchEvent(
        new CustomEvent('languageChanged', {
          detail: { language: nextLanguage, translations: this.translations },
        })
      );
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to toggle language');
    }
  }

  /**
   * Update language toggle button
   */
  private updateLanguageToggle(): void {
    if (this.langToggle) {
      const currentLangConfig = this.languages.find(lang => lang.code === this.currentLanguage);
      if (currentLangConfig) {
        this.langToggle.textContent = currentLangConfig.code.toUpperCase();
        this.langToggle.setAttribute('aria-label', `Switch to ${currentLangConfig.name}`);
      }
    }
  }

  /**
   * Apply translations to DOM elements with error boundary
   */
  public applyTranslations(): void {
    try {
      const elements = document.querySelectorAll('[data-i18n]');
      elements.forEach(element => {
        try {
          const key = element.getAttribute('data-i18n');
          if (key && this.translations) {
            const translation = this.getNestedTranslation(this.translations, key);
            if (translation && element instanceof HTMLElement) {
              // Handle different element types
              if (element.tagName === 'META') {
                element.setAttribute('content', translation);
              } else if (element.tagName === 'TITLE') {
                element.textContent = translation;
              } else if (element.tagName === 'IMG') {
                element.setAttribute('alt', translation);
              } else {
                element.textContent = translation;
              }
            }
          }
        } catch (elementError) {
          // Log individual element errors but continue processing others
          console.warn(
            `Failed to translate element with key "${element.getAttribute('data-i18n')}"`,
            elementError
          );
        }
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to apply translations', {
        component: 'LanguageManager',
        action: 'applyTranslations',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get nested translation value
   */
  private getNestedTranslation(obj: Translations, path: string): string {
    return path.split('.').reduce((current: Translations | string, key: string) => {
      return current && typeof current === 'object' ? current[key] : '';
    }, obj) as string;
  }

  /**
   * Update meta tags for current language
   */
  private updateMetaTagsForLanguage(): void {
    const metaKeys = [
      'title',
      'description',
      'ogTitle',
      'ogDescription',
      'twitterTitle',
      'twitterDescription',
    ];
    metaKeys.forEach(key => {
      const translation = this.getNestedTranslation(this.translations, `meta.${key}`);
      if (translation) {
        switch (key) {
          case 'title':
            document.title = translation;
            break;
          case 'description':
            this.updateMetaTag('description', translation);
            break;
          case 'ogTitle':
            this.updateMetaTag('og:title', translation);
            break;
          case 'ogDescription':
            this.updateMetaTag('og:description', translation);
            break;
          case 'twitterTitle':
            this.updateMetaTag('twitter:title', translation);
            break;
          case 'twitterDescription':
            this.updateMetaTag('twitter:description', translation);
            break;
        }
      }
    });
  }

  /**
   * Update a specific meta tag
   */
  private updateMetaTag(name: string, content: string): void {
    let meta =
      document.querySelector(`meta[name="${name}"]`) ||
      document.querySelector(`meta[property="${name}"]`);
    if (meta) {
      meta.setAttribute('content', content);
    }
  }

  /**
   * Setup hreflang tags for SEO
   */
  private setupHreflangTags(): void {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.remove());

    // Add new hreflang tags
    const baseUrl = window.location.origin;

    // English version
    this.addHreflangTag('en', `${baseUrl}/`);

    // Portuguese version (PT-PT)
    this.addHreflangTag('pt-PT', `${baseUrl}/`);

    // Default language
    this.addHreflangTag('x-default', `${baseUrl}/`);
  }

  /**
   * Update hreflang tags when language changes
   */
  private updateHreflangTags(): void {
    // Update the canonical link to reflect current language preference
    this.updateCanonicalLink();
  }

  /**
   * Add a single hreflang tag
   */
  private addHreflangTag(hreflang: string, url: string): void {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Update canonical link for SEO
   */
  private updateCanonicalLink(): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    const baseUrl = window.location.origin;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    // Set canonical URL based on current language
    canonical.href = `${baseUrl}${window.location.pathname}`;
  }

  /**
   * Get current language
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   */
  public getAvailableLanguages(): LanguageConfig[] {
    return this.languages;
  }

  /**
   * Get translation for a key
   */
  public getTranslation(key: string): string {
    return this.getNestedTranslation(this.translations, key);
  }

  /**
   * Set language programmatically
   */
  public async setLanguage(languageCode: string): Promise<void> {
    if (this.languages.find(lang => lang.code === languageCode)) {
      this.currentLanguage = languageCode;
      localStorage.setItem('language', languageCode);
      await this.loadTranslations(languageCode);
      this.applyTranslations();
      this.updateLanguageToggle();
      document.documentElement.lang = languageCode;
      this.updateHreflangTags();
      this.updateMetaTagsForLanguage();
    }
  }
}
