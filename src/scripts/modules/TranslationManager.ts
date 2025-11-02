/**
 * Translation Manager for LOFERSIL Landing Page
 * Handles loading and applying Portuguese translations
 */

import { Translations } from '../types.js';
import { ErrorHandler } from './ErrorHandler.js';

export class TranslationManager {
  private translations: Translations;
  private readonly defaultLanguage = 'pt';
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.translations = {};
    this.errorHandler = errorHandler;
  }

  /**
   * Initialize the translation system
   */
  async initialize(): Promise<void> {
    await this.loadTranslations();
    this.applyTranslations();
    this.updateMetaTagsForLanguage();
    this.setupHreflangTags();
  }

  /**
   * Load Portuguese translations
   */
  async loadTranslations(): Promise<void> {
    console.log(`Loading Portuguese translations`);
    try {
      const response = await fetch(`/locales/${this.defaultLanguage}.json`);
      console.log(`Fetch response for Portuguese:`, response.status);
      if (!response.ok) {
        throw new Error(
          `Failed to load Portuguese translations: ${response.status} ${response.statusText}`
        );
      }
      this.translations = await response.json();
      console.log(`Portuguese translations loaded:`, this.translations);
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to load translations', {
        component: 'TranslationManager',
        action: 'loadTranslations',
        timestamp: new Date().toISOString(),
      });
      // Fallback to empty translations if loading fails
      this.translations = {};
      // Show user-friendly message for translation loading failure
      this.errorHandler.showInfoMessage(
        'Some text may appear in English. Please refresh the page to try loading translations again.'
      );
    }
  }

  /**
   * Apply translations to DOM elements
   */
  applyTranslations(): void {
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`Applying Portuguese translations: Found ${elements.length} elements`);
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key && this.translations) {
        const translation = this.getNestedTranslation(this.translations, key);
        if (translation && element instanceof HTMLElement) {
          // Handle different element types
          if (element.tagName === 'META') {
            element.setAttribute('content', translation);
          } else if (element.tagName === 'TITLE') {
            element.textContent = translation;
          } else {
            element.textContent = translation;
          }
        }
      }
    });
    console.log('Portuguese translations applied');
  }

  /**
   * Get nested translation value
   */
  getNestedTranslation(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : '';
    }, obj);
  }

  /**
   * Update meta tags for Portuguese language
   */
  updateMetaTagsForLanguage(): void {
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
   * Setup hreflang tags for Portuguese
   */
  setupHreflangTags(): void {
    // Remove existing hreflang tags
    const existingTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingTags.forEach(tag => tag.remove());

    // Add Portuguese hreflang tag
    const baseUrl = window.location.origin;
    this.addHreflangTag('pt-PT', `${baseUrl}/`);
    // Default language
    this.addHreflangTag('x-default', `${baseUrl}/`);
  }

  /**
   * Add a single hreflang tag
   */
  private addHreflangTag(hreflang: string, url: string): void {
    const link = document.createElement('link') as HTMLLinkElement;
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Update canonical link for SEO
   */
  updateCanonicalLink(): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    const baseUrl = window.location.origin;
    if (!canonical) {
      canonical = document.createElement('link') as HTMLLinkElement;
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    // Set canonical URL for Portuguese
    canonical.href = `${baseUrl}${window.location.pathname}`;
  }

  /**
   * Get current translations (for debugging/testing)
   */
  getTranslations(): Translations {
    return this.translations;
  }
}
