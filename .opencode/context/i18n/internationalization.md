# LOFERSIL Internationalization Patterns

## Translation System Architecture Pattern

**ALWAYS** implement a robust translation system with caching, fallbacks, and dynamic loading:

```typescript
// src/scripts/modules/TranslationManager.ts
export interface TranslationData {
  [key: string]: string | TranslationData;
}

export class TranslationManager {
  private translations: Map<string, TranslationData> = new Map();
  private currentLanguage: string = 'pt';
  private fallbackLanguage: string = 'pt';
  private isLoading: Map<string, Promise<void>> = new Map();

  constructor(defaultLanguage: string = 'pt') {
    this.currentLanguage = defaultLanguage;
    this.fallbackLanguage = defaultLanguage;
  }

  /**
   * Load translations for a specific language
   */
  async loadTranslations(language: string): Promise<void> {
    // Prevent duplicate loading
    if (this.isLoading.has(language)) {
      return this.isLoading.get(language);
    }

    // Check if already loaded
    if (this.translations.has(language)) {
      return;
    }

    const loadPromise = this.fetchTranslations(language);
    this.isLoading.set(language, loadPromise);

    try {
      await loadPromise;
      this.isLoading.delete(language);
    } catch (error) {
      this.isLoading.delete(language);
      throw error;
    }
  }

  private async fetchTranslations(language: string): Promise<void> {
    try {
      const response = await fetch(`/locales/${language}.json`, {
        cache: 'default', // Use browser cache
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}: ${response.status}`);
      }

      const data: TranslationData = await response.json();

      // Validate translation structure
      this.validateTranslations(data, language);

      this.translations.set(language, data);
    } catch (error) {
      console.error(`Translation loading failed for ${language}:`, error);

      // If fallback language fails, provide minimal fallback
      if (language === this.fallbackLanguage) {
        this.translations.set(language, this.getMinimalFallbacks());
      } else {
        throw error;
      }
    }
  }

  /**
   * Get translated text with key path support
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = this.translations.get(this.currentLanguage);

    // Try current language
    for (const k of keys) {
      value = value?.[k];
    }

    // Fallback to fallback language if not found
    if (value === undefined && this.currentLanguage !== this.fallbackLanguage) {
      value = this.translations.get(this.fallbackLanguage);
      for (const k of keys) {
        value = value?.[k];
      }
    }

    // Final fallback
    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key} in ${this.currentLanguage}`);
      return key; // Return key as fallback
    }

    // Apply parameter interpolation
    return this.interpolateParams(value, params);
  }

  /**
   * Interpolate parameters in translation strings
   */
  private interpolateParams(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;

    return Object.entries(params).reduce((result, [key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      return result.replace(placeholder, String(value));
    }, text);
  }

  /**
   * Set current language and load translations if needed
   */
  async setLanguage(language: string): Promise<void> {
    if (language === this.currentLanguage) return;

    // Validate language code
    if (!this.isValidLanguageCode(language)) {
      throw new Error(`Invalid language code: ${language}`);
    }

    // Load translations if not already loaded
    await this.loadTranslations(language);

    const previousLanguage = this.currentLanguage;
    this.currentLanguage = language;

    // Emit language change event
    window.dispatchEvent(
      new CustomEvent('lofersil:language-change', {
        detail: {
          previousLanguage,
          newLanguage: language,
        },
      })
    );

    // Update document language attribute
    document.documentElement.lang = this.getHtmlLangAttribute(language);

    // Update page title and meta tags
    this.updateMetaTags();

    // Persist language preference
    this.persistLanguagePreference(language);

    console.log(`Language changed from ${previousLanguage} to ${language}`);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): string[] {
    // In a real implementation, this would come from a config
    return ['pt', 'en'];
  }

  /**
   * Check if a language is loaded
   */
  isLanguageLoaded(language: string): boolean {
    return this.translations.has(language);
  }

  /**
   * Validate translation data structure
   */
  private validateTranslations(data: TranslationData, language: string): void {
    const requiredKeys = ['nav.home', 'nav.products', 'nav.contact'];

    for (const key of requiredKeys) {
      const keys = key.split('.');
      let value: any = data;

      for (const k of keys) {
        value = value?.[k];
      }

      if (typeof value !== 'string') {
        throw new Error(`Required translation key missing: ${key} for language ${language}`);
      }
    }
  }

  /**
   * Get HTML lang attribute for language
   */
  private getHtmlLangAttribute(language: string): string {
    const langMap: Record<string, string> = {
      pt: 'pt-PT',
      en: 'en-US',
    };
    return langMap[language] || language;
  }

  /**
   * Update page meta tags for SEO
   */
  private updateMetaTags(): void {
    const title = this.translate('meta.title');
    const description = this.translate('meta.description');

    if (title) document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute('content', description);
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) {
      ogTitle.setAttribute('content', title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute('content', description);
    }
  }

  /**
   * Persist language preference
   */
  private persistLanguagePreference(language: string): void {
    try {
      localStorage.setItem('lofersil-language', language);
    } catch (error) {
      // localStorage not available, use cookie as fallback
      document.cookie = `lofersil-language=${language};path=/;max-age=31536000`;
    }
  }

  /**
   * Load persisted language preference
   */
  async loadPersistedLanguage(): Promise<void> {
    let savedLanguage: string | null = null;

    try {
      savedLanguage = localStorage.getItem('lofersil-language');
    } catch {
      // Try cookie fallback
      const cookieMatch = document.cookie.match(/lofersil-language=([^;]+)/);
      savedLanguage = cookieMatch ? cookieMatch[1] : null;
    }

    if (savedLanguage && this.getAvailableLanguages().includes(savedLanguage)) {
      await this.setLanguage(savedLanguage);
    }
  }

  /**
   * Validate language code format
   */
  private isValidLanguageCode(language: string): boolean {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(language);
  }

  /**
   * Minimal fallback translations
   */
  private getMinimalFallbacks(): TranslationData {
    return {
      nav: {
        home: 'Início',
        products: 'Produtos',
        contact: 'Contato',
      },
      meta: {
        title: 'LOFERSIL - Material Escolar e Escritório',
        description: 'Loja de material escolar, escritório e artigos criativos em Portugal',
      },
    };
  }
}
```

## Translation File Structure Pattern

**ALWAYS** organize translation files with consistent structure and naming:

```json
// locales/pt.json - Portuguese translations
{
  "meta": {
    "title": "LOFERSIL - Material Escolar e Escritório",
    "description": "Loja de material escolar, escritório e artigos criativos em Portugal. Canetas, cadernos, dossiers e muito mais com entrega rápida.",
    "keywords": "material escolar, escritório, canetas, cadernos, portugal",
    "author": "LOFERSIL"
  },
  "og": {
    "title": "LOFERSIL - Material Escolar e Escritório",
    "description": "Loja de material escolar, escritório e artigos criativos em Portugal.",
    "siteName": "LOFERSIL",
    "locale": "pt_PT"
  },
  "twitter": {
    "title": "LOFERSIL - Material Escolar e Escritório",
    "description": "Loja de material escolar, escritório e artigos criativos em Portugal.",
    "card": "summary_large_image"
  },
  "nav": {
    "home": "Início",
    "products": "Produtos",
    "about": "Sobre",
    "contact": "Contato",
    "cart": "Carrinho"
  },
  "home": {
    "hero": {
      "title": "Bem-vindo à LOFERSIL",
      "subtitle": "Material escolar e escritório de qualidade",
      "cta": "Ver Produtos"
    },
    "features": {
      "quality": {
        "title": "Qualidade Garantida",
        "description": "Produtos de marcas reconhecidas com garantia"
      },
      "delivery": {
        "title": "Entrega Rápida",
        "description": "Entregamos em todo o território português"
      },
      "support": {
        "title": "Suporte Especializado",
        "description": "Equipe pronta para ajudar sua escolha"
      }
    }
  },
  "products": {
    "title": "Nossos Produtos",
    "categories": {
      "school": "Material Escolar",
      "office": "Material de Escritório",
      "art": "Material de Arte"
    },
    "filters": {
      "all": "Todos",
      "price": "Preço",
      "brand": "Marca",
      "rating": "Avaliação"
    }
  },
  "contact": {
    "title": "Entre em Contato",
    "form": {
      "name": "Nome completo",
      "email": "Email",
      "phone": "Telefone (opcional)",
      "subject": "Assunto",
      "message": "Mensagem",
      "submit": "Enviar Mensagem",
      "sending": "Enviando...",
      "success": "Mensagem enviada com sucesso!",
      "error": "Erro ao enviar mensagem. Tente novamente."
    },
    "info": {
      "address": "Morada",
      "phone": "Telefone",
      "email": "Email",
      "hours": "Horário de funcionamento"
    }
  },
  "footer": {
    "links": {
      "privacy": "Política de Privacidade",
      "terms": "Termos de Uso",
      "shipping": "Envio e Devoluções"
    },
    "newsletter": {
      "title": "Newsletter",
      "description": "Receba novidades e ofertas especiais",
      "placeholder": "Seu email",
      "subscribe": "Inscrever"
    },
    "social": {
      "title": "Siga-nos",
      "facebook": "Facebook",
      "instagram": "Instagram"
    }
  },
  "accessibility": {
    "skipToMain": "Saltar para conteúdo principal",
    "menu": "Menu de navegação",
    "search": "Campo de pesquisa",
    "close": "Fechar"
  },
  "errors": {
    "404": {
      "title": "Página não encontrada",
      "message": "A página que procura não existe.",
      "backHome": "Voltar ao início"
    },
    "500": {
      "title": "Erro interno",
      "message": "Ocorreu um erro inesperado. Tente novamente."
    }
  },
  "validation": {
    "required": "Campo obrigatório",
    "email": "Email inválido",
    "minLength": "Deve ter pelo menos {{count}} caracteres",
    "maxLength": "Deve ter no máximo {{count}} caracteres"
  }
}
```

```json
// locales/en.json - English translations
{
  "meta": {
    "title": "LOFERSIL - School Supplies and Office Materials",
    "description": "Portuguese store for school supplies, office materials and creative products. Pens, notebooks, folders and more with fast delivery.",
    "keywords": "school supplies, office, pens, notebooks, portugal",
    "author": "LOFERSIL"
  },
  "og": {
    "title": "LOFERSIL - School Supplies and Office Materials",
    "description": "Portuguese store for school supplies, office materials and creative products.",
    "siteName": "LOFERSIL",
    "locale": "en_US"
  },
  "twitter": {
    "title": "LOFERSIL - School Supplies and Office Materials",
    "description": "Portuguese store for school supplies, office materials and creative products.",
    "card": "summary_large_image"
  },
  "nav": {
    "home": "Home",
    "products": "Products",
    "about": "About",
    "contact": "Contact",
    "cart": "Cart"
  },
  "home": {
    "hero": {
      "title": "Welcome to LOFERSIL",
      "subtitle": "Quality school and office supplies",
      "cta": "View Products"
    },
    "features": {
      "quality": {
        "title": "Guaranteed Quality",
        "description": "Products from recognized brands with warranty"
      },
      "delivery": {
        "title": "Fast Delivery",
        "description": "We deliver throughout Portugal"
      },
      "support": {
        "title": "Specialized Support",
        "description": "Team ready to help with your choice"
      }
    }
  },
  "products": {
    "title": "Our Products",
    "categories": {
      "school": "School Supplies",
      "office": "Office Supplies",
      "art": "Art Materials"
    },
    "filters": {
      "all": "All",
      "price": "Price",
      "brand": "Brand",
      "rating": "Rating"
    }
  },
  "contact": {
    "title": "Contact Us",
    "form": {
      "name": "Full name",
      "email": "Email",
      "phone": "Phone (optional)",
      "subject": "Subject",
      "message": "Message",
      "submit": "Send Message",
      "sending": "Sending...",
      "success": "Message sent successfully!",
      "error": "Error sending message. Please try again."
    },
    "info": {
      "address": "Address",
      "phone": "Phone",
      "email": "Email",
      "hours": "Business hours"
    }
  },
  "footer": {
    "links": {
      "privacy": "Privacy Policy",
      "terms": "Terms of Use",
      "shipping": "Shipping & Returns"
    },
    "newsletter": {
      "title": "Newsletter",
      "description": "Receive news and special offers",
      "placeholder": "Your email",
      "subscribe": "Subscribe"
    },
    "social": {
      "title": "Follow Us",
      "facebook": "Facebook",
      "instagram": "Instagram"
    }
  },
  "accessibility": {
    "skipToMain": "Skip to main content",
    "menu": "Navigation menu",
    "search": "Search field",
    "close": "Close"
  },
  "errors": {
    "404": {
      "title": "Page not found",
      "message": "The page you are looking for does not exist.",
      "backHome": "Back to home"
    },
    "500": {
      "title": "Internal error",
      "message": "An unexpected error occurred. Please try again."
    }
  },
  "validation": {
    "required": "Required field",
    "email": "Invalid email",
    "minLength": "Must be at least {{count}} characters",
    "maxLength": "Must be at most {{count}} characters"
  }
}
```

## HTML Internationalization Pattern

**ALWAYS** use data attributes and semantic HTML for translatable content:

```html
<!-- index.html - Internationalized HTML -->
<!DOCTYPE html>
<html lang="pt" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <title data-i18n="meta.title">LOFERSIL - Material Escolar e Escritório</title>
    <meta name="description" content="" data-i18n="meta.description" />
    <meta name="keywords" content="" data-i18n="meta.keywords" />
  </head>
  <body>
    <!-- Navigation -->
    <nav aria-label="" data-i18n="accessibility.menu">
      <a href="/" data-i18n="nav.home">Início</a>
      <a href="/produtos" data-i18n="nav.products">Produtos</a>
      <a href="/contato" data-i18n="nav.contact">Contato</a>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <h1 data-i18n="home.hero.title">Bem-vindo à LOFERSIL</h1>
      <p data-i18n="home.hero.subtitle">Material escolar e escritório de qualidade</p>
      <a href="/produtos" class="cta-button" data-i18n="home.hero.cta">Ver Produtos</a>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="feature">
        <h3 data-i18n="home.features.quality.title">Qualidade Garantida</h3>
        <p data-i18n="home.features.quality.description">
          Produtos de marcas reconhecidas com garantia
        </p>
      </div>
      <div class="feature">
        <h3 data-i18n="home.features.delivery.title">Entrega Rápida</h3>
        <p data-i18n="home.features.delivery.description">
          Entregamos em todo o território português
        </p>
      </div>
    </section>

    <!-- Contact Form -->
    <section class="contact">
      <h2 data-i18n="contact.title">Entre em Contato</h2>
      <form class="contact-form" data-i18n-form="contact">
        <div class="form-group">
          <label for="name" data-i18n="contact.form.name">Nome completo</label>
          <input type="text" id="name" name="name" required />
        </div>
        <div class="form-group">
          <label for="email" data-i18n="contact.form.email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div class="form-group">
          <label for="message" data-i18n="contact.form.message">Mensagem</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit" data-i18n="contact.form.submit">Enviar Mensagem</button>
      </form>
    </section>

    <!-- Language Switcher -->
    <div class="language-switcher">
      <button class="lang-btn" data-lang="pt" aria-label="Português">PT</button>
      <button class="lang-btn" data-lang="en" aria-label="English">EN</button>
    </div>

    <!-- Footer -->
    <footer>
      <p>
        &copy; 2024 LOFERSIL.
        <span data-i18n="footer.links.rights">Todos os direitos reservados.</span>
      </p>
    </footer>
  </body>
</html>
```

## Language Detection and Switching Pattern

**ALWAYS** implement automatic language detection and manual switching:

```typescript
// src/scripts/modules/LanguageDetector.ts
export class LanguageDetector {
  private translationManager: TranslationManager;

  constructor(translationManager: TranslationManager) {
    this.translationManager = translationManager;
  }

  /**
   * Detect user's preferred language
   */
  async detectLanguage(): Promise<string> {
    // Priority order: persisted > browser > default
    const persisted = await this.getPersistedLanguage();
    if (persisted) return persisted;

    const browser = this.getBrowserLanguage();
    if (browser && this.isSupportedLanguage(browser)) return browser;

    return this.translationManager.fallbackLanguage;
  }

  /**
   * Get browser's language preference
   */
  private getBrowserLanguage(): string | null {
    const languages = navigator.languages || [navigator.language];

    for (const lang of languages) {
      const baseLang = lang.split('-')[0];
      if (this.isSupportedLanguage(baseLang)) {
        return baseLang;
      }
      if (this.isSupportedLanguage(lang)) {
        return lang;
      }
    }

    return null;
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(language: string): boolean {
    return this.translationManager.getAvailableLanguages().includes(language);
  }

  /**
   * Get persisted language preference
   */
  private async getPersistedLanguage(): Promise<string | null> {
    try {
      await this.translationManager.loadPersistedLanguage();
      return this.translationManager.getCurrentLanguage();
    } catch {
      return null;
    }
  }
}

// Language switcher component
export class LanguageSwitcher {
  private container: HTMLElement;
  private translationManager: TranslationManager;

  constructor(container: HTMLElement, translationManager: TranslationManager) {
    this.container = container;
    this.translationManager = translationManager;
    this.initializeSwitcher();
  }

  private initializeSwitcher(): void {
    const availableLanguages = this.translationManager.getAvailableLanguages();
    const currentLanguage = this.translationManager.getCurrentLanguage();

    this.container.innerHTML = availableLanguages
      .map(
        lang => `
      <button
        class="lang-btn ${lang === currentLanguage ? 'active' : ''}"
        data-lang="${lang}"
        aria-label="${this.getLanguageLabel(lang)}"
      >
        ${lang.toUpperCase()}
      </button>
    `
      )
      .join('');

    this.container.addEventListener('click', this.handleLanguageSwitch.bind(this));
  }

  private async handleLanguageSwitch(event: Event): Promise<void> {
    const button = (event.target as Element).closest('.lang-btn') as HTMLButtonElement;
    if (!button) return;

    const newLanguage = button.dataset.lang;
    if (!newLanguage) return;

    try {
      // Update button states
      this.container.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Switch language
      await this.translationManager.setLanguage(newLanguage);

      // Update page content
      this.updatePageContent();
    } catch (error) {
      console.error('Language switch failed:', error);
      // Revert button state
      this.initializeSwitcher();
    }
  }

  private updatePageContent(): void {
    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const translation = this.translationManager.translate(key);
        this.setElementText(element as HTMLElement, translation);
      }
    });

    // Update form placeholders and labels
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (key) {
        (element as HTMLInputElement).placeholder = this.translationManager.translate(key);
      }
    });

    // Update aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      if (key) {
        element.setAttribute('aria-label', this.translationManager.translate(key));
      }
    });
  }

  private setElementText(element: HTMLElement, text: string): void {
    // Preserve existing child elements (like icons)
    const childNodes = Array.from(element.childNodes);
    const hasOnlyText = childNodes.every(node => node.nodeType === Node.TEXT_NODE);

    if (hasOnlyText) {
      element.textContent = text;
    } else {
      // Replace only text nodes
      childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = text;
        }
      });
    }
  }

  private getLanguageLabel(language: string): string {
    const labels: Record<string, string> = {
      pt: 'Português',
      en: 'English',
    };
    return labels[language] || language;
  }
}
```

## SEO and Multilingual Pattern

**ALWAYS** implement proper SEO for multilingual sites:

```typescript
// src/scripts/modules/SEOManager.ts - Extended for i18n
export class SEOManager {
  private translationManager: TranslationManager;

  constructor(translationManager: TranslationManager) {
    this.translationManager = translationManager;
  }

  /**
   * Generate hreflang tags for multilingual SEO
   */
  generateHreflangTags(): string {
    const languages = this.translationManager.getAvailableLanguages();
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/'); // Get protocol + domain

    let hreflangTags = '';

    for (const lang of languages) {
      const langUrl = this.getLanguageSpecificUrl(baseUrl, lang);
      const langCode = lang === 'pt' ? 'pt-PT' : 'en-US';

      hreflangTags += `<link rel="alternate" hreflang="${langCode}" href="${langUrl}" />\n`;
    }

    // Add x-default
    const defaultUrl = this.getLanguageSpecificUrl(
      baseUrl,
      this.translationManager.fallbackLanguage
    );
    hreflangTags += `<link rel="alternate" hreflang="x-default" href="${defaultUrl}" />`;

    return hreflangTags;
  }

  /**
   * Get language-specific URL
   */
  private getLanguageSpecificUrl(baseUrl: string, language: string): string {
    const currentPath = window.location.pathname;

    // If using subdirectories (/pt/, /en/)
    if (language !== this.translationManager.fallbackLanguage) {
      return `${baseUrl}/${language}${currentPath}`;
    }

    return `${baseUrl}${currentPath}`;
  }

  /**
   * Update canonical URL for current language
   */
  updateCanonicalUrl(): void {
    const canonicalUrl = this.getLanguageSpecificUrl(
      window.location.origin,
      this.translationManager.getCurrentLanguage()
    );

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;
  }

  /**
   * Generate language-specific sitemap
   */
  async generateLanguageSitemap(pages: string[]): Promise<string> {
    const languages = this.translationManager.getAvailableLanguages();
    const baseUrl = window.location.origin;

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    for (const page of pages) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}${page}</loc>\n`;
      sitemap += '    <lastmod>' + new Date().toISOString() + '</lastmod>\n';

      // Add alternate language versions
      for (const lang of languages) {
        const langUrl = this.getLanguageSpecificUrl(baseUrl, lang);
        const langCode = lang === 'pt' ? 'pt-PT' : 'en-US';

        sitemap += '    <xhtml:link rel="alternate"\n';
        sitemap += `      hreflang="${langCode}"\n`;
        sitemap += `      href="${langUrl}${page}" />\n`;
      }

      sitemap += '  </url>\n';
    }

    sitemap += '</urlset>';
    return sitemap;
  }
}
```

## Translation Testing Pattern

**ALWAYS** include comprehensive tests for internationalization:

```typescript
// src/scripts/modules/TranslationManager.test.ts
import { TranslationManager } from './TranslationManager';

// Mock fetch for testing
global.fetch = jest.fn();

describe('TranslationManager', () => {
  let manager: TranslationManager;

  beforeEach(() => {
    manager = new TranslationManager('pt');
    (global.fetch as jest.Mock).mockClear();
  });

  test('loads translations successfully', async () => {
    const mockTranslations = {
      nav: { home: 'Início', products: 'Produtos' },
      home: { title: 'Bem-vindo' },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTranslations),
    });

    await manager.loadTranslations('pt');

    expect(manager.translate('nav.home')).toBe('Início');
    expect(manager.translate('home.title')).toBe('Bem-vindo');
  });

  test('handles missing translations with fallback', async () => {
    const mockTranslations = { nav: { home: 'Início' } };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTranslations),
    });

    await manager.loadTranslations('pt');

    expect(manager.translate('nav.missing')).toBe('nav.missing');
  });

  test('interpolates parameters correctly', async () => {
    const mockTranslations = {
      welcome: 'Olá, {{name}}! Você tem {{count}} mensagens.',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTranslations),
    });

    await manager.loadTranslations('pt');

    const result = manager.translate('welcome', {
      name: 'João',
      count: 5,
    });

    expect(result).toBe('Olá, João! Você tem 5 mensagens.');
  });

  test('switches language and updates DOM', async () => {
    // Setup initial translations
    const ptTranslations = { nav: { home: 'Início' } };
    const enTranslations = { nav: { home: 'Home' } };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(ptTranslations),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(enTranslations),
      });

    // Load Portuguese first
    await manager.loadTranslations('pt');
    expect(manager.translate('nav.home')).toBe('Início');

    // Switch to English
    await manager.setLanguage('en');
    expect(manager.translate('nav.home')).toBe('Home');
    expect(manager.getCurrentLanguage()).toBe('en');
  });

  test('persists language preference', async () => {
    const mockTranslations = { nav: { home: 'Home' } };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTranslations),
    });

    // Mock localStorage
    const mockSetItem = jest.fn();
    Object.defineProperty(window, 'localStorage', {
      value: { setItem: mockSetItem },
      writable: true,
    });

    await manager.setLanguage('en');

    expect(mockSetItem).toHaveBeenCalledWith('lofersil-language', 'en');
  });
});
```

These internationalization patterns ensure LOFERSIL provides a consistent, accessible, and SEO-friendly experience for both Portuguese and English-speaking users.</content>
<parameter name="filePath">.opencode/context/i18n/internationalization.md
