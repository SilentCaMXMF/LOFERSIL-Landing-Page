# LOFERSIL Essential Patterns - Core Implementation Guide

## Manager Module Pattern

**ALWAYS** structure core functionality as manager modules with dependency injection:

```typescript
// src/scripts/modules/NavigationManager.ts
export class NavigationManager {
  private router: Router;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(router: Router, logger: Logger, errorHandler: ErrorHandler) {
    this.router = router;
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.initialize();
  }

  private initialize(): void {
    this.setupEventListeners();
    this.logger.info('NavigationManager initialized');
  }

  private setupEventListeners(): void {
    window.addEventListener('popstate', event => {
      this.handleNavigation(event.state?.path || '/');
    });
  }

  public navigate(path: string): void {
    try {
      this.router.navigate(path);
      this.updateHistory(path);
    } catch (error) {
      this.errorHandler.handleError(error, 'Navigation failed');
    }
  }
}
```

## Event-Driven Communication Pattern

**ALWAYS** use custom events for cross-module communication:

```typescript
// src/scripts/modules/UIManager.ts
export class UIManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for navigation events
    window.addEventListener('lofersil:navigate', (event: CustomEvent) => {
      this.handleNavigation(event.detail.path);
    });

    // Listen for language change events
    window.addEventListener('lofersil:language-change', (event: CustomEvent) => {
      this.updateLanguage(event.detail.language);
    });
  }

  public emitNavigation(path: string): void {
    const event = new CustomEvent('lofersil:navigate', {
      detail: { path },
    });
    window.dispatchEvent(event);
  }
}
```

## DOM Element Caching Pattern

**ALWAYS** cache DOM elements to avoid repeated queries:

```typescript
// src/scripts/modules/SEOManager.ts
export class SEOManager {
  private cachedElements: {
    title?: HTMLTitleElement;
    metaDescription?: HTMLMetaElement;
    canonical?: HTMLLinkElement;
  } = {};

  private cacheElements(): void {
    this.cachedElements = {
      title: document.querySelector('title'),
      metaDescription: document.querySelector('meta[name="description"]'),
      canonical: document.querySelector('link[rel="canonical"]'),
    };
  }

  public updateMetaTags(title: string, description: string): void {
    if (!this.cachedElements.title) this.cacheElements();

    if (this.cachedElements.title) {
      this.cachedElements.title.textContent = title;
    }

    if (this.cachedElements.metaDescription) {
      this.cachedElements.metaDescription.setAttribute('content', description);
    }
  }
}
```

## Translation Management Pattern

**ALWAYS** use the translation system for internationalization:

```typescript
// src/scripts/modules/TranslationManager.ts
export class TranslationManager {
  private translations: Record<string, any> = {};
  private currentLanguage: string = 'pt';

  public async loadTranslations(language: string): Promise<void> {
    try {
      const response = await fetch(`/locales/${language}.json`);
      this.translations = await response.json();
      this.currentLanguage = language;
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
      // Fallback to Portuguese
      if (language !== 'pt') {
        await this.loadTranslations('pt');
      }
    }
  }

  public translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(`{{${param}}}`, val),
        value
      );
    }

    return value;
  }
}
```

## Contact Form Validation Pattern

**ALWAYS** validate contact form data with comprehensive checks:

```typescript
// src/scripts/modules/ContactFormManager.ts
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  phone?: string;
}

export class ContactFormManager {
  private validator: ContactFormValidator;

  constructor(validator: ContactFormValidator) {
    this.validator = validator;
  }

  public validateForm(data: ContactFormData): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Name validation
    if (!data.name?.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (data.name.length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email?.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(data.email)) {
      errors.email = 'Email inválido';
    }

    // Message validation
    if (!data.message?.trim()) {
      errors.message = 'Mensagem é obrigatória';
    } else if (data.message.length < 10) {
      errors.message = 'Mensagem deve ter pelo menos 10 caracteres';
    }

    // Phone validation (optional)
    if (data.phone && !/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
      errors.phone = 'Telefone contém caracteres inválidos';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
}
```

## Error Handling Pattern

**ALWAYS** use the ErrorHandler for consistent error management:

```typescript
// src/scripts/modules/ErrorHandler.ts
export class ErrorHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    window.addEventListener('error', event => {
      this.handleError(event.error, 'Global error');
    });

    window.addEventListener('unhandledrejection', event => {
      this.handleError(event.reason, 'Unhandled promise rejection');
    });
  }

  public handleError(error: any, context: string): void {
    // Log the error
    this.logger.error(`${context}:`, error);

    // Sanitize error for user display
    const userMessage = this.getUserFriendlyMessage(error);

    // Emit error event for UI handling
    const event = new CustomEvent('lofersil:error', {
      detail: { message: userMessage, originalError: error },
    });
    window.dispatchEvent(event);
  }

  private getUserFriendlyMessage(error: any): string {
    // Map technical errors to user-friendly messages
    if (error.name === 'NetworkError') {
      return 'Erro de conexão. Verifique sua internet.';
    }
    if (error.name === 'ValidationError') {
      return 'Dados inválidos. Verifique os campos.';
    }
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }
}
```

## Performance Optimization Pattern

**ALWAYS** implement performance optimizations with debouncing and Intersection Observer:

```typescript
// src/scripts/modules/ScrollManager.ts
export class ScrollManager {
  private throttledScrollHandler: () => void;
  private observer: IntersectionObserver;

  constructor() {
    this.throttledScrollHandler = this.debounce(this.handleScroll.bind(this), 16); // ~60fps
    this.setupIntersectionObserver();
    this.setupScrollListener();
  }

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleElementVisible(entry.target as HTMLElement);
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  public observeElement(element: HTMLElement): void {
    this.observer.observe(element);
  }

  private handleElementVisible(element: HTMLElement): void {
    // Lazy load images, trigger animations, etc.
    const img = element.querySelector('img[data-src]');
    if (img) {
      img.setAttribute('src', img.getAttribute('data-src')!);
      img.removeAttribute('data-src');
    }
  }
}
```

## Security Pattern with DOMPurify

**ALWAYS** sanitize user-generated content:

```typescript
// Security utilities
import DOMPurify from 'dompurify';

export class SecurityUtils {
  public static sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }

  public static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>]/g, '');
  }

  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
}
```

## Logging Pattern

**ALWAYS** use the Logger for consistent logging:

```typescript
// src/scripts/modules/Logger.ts
export class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = !window.location.hostname.includes('lofersil');
  }

  public debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  public error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);

    // In production, could send to error tracking service
    if (!this.isDevelopment) {
      this.reportError(message, args);
    }
  }

  private reportError(message: string, args: any[]): void {
    // Send to error tracking service (Sentry, etc.)
    // Implementation depends on chosen service
  }
}
```

## Configuration Pattern

**ALWAYS** use environment-aware configuration:

```typescript
// src/scripts/modules/Config.ts
export interface AppConfig {
  apiBaseUrl: string;
  contactEndpoint: string;
  defaultLanguage: string;
  features: {
    pwa: boolean;
    analytics: boolean;
    contactForm: boolean;
  };
}

export class Config {
  private static instance: Config;
  private config: AppConfig;

  private constructor() {
    this.config = {
      apiBaseUrl: this.getEnvVar('API_BASE_URL', '/api'),
      contactEndpoint: this.getEnvVar('CONTACT_ENDPOINT', '/contact'),
      defaultLanguage: this.getEnvVar('DEFAULT_LANGUAGE', 'pt'),
      features: {
        pwa: this.getEnvVar('ENABLE_PWA', 'true') === 'true',
        analytics: this.getEnvVar('ENABLE_ANALYTICS', 'false') === 'true',
        contactForm: this.getEnvVar('ENABLE_CONTACT_FORM', 'true') === 'true',
      },
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public get(): AppConfig {
    return this.config;
  }

  private getEnvVar(key: string, defaultValue: string): string {
    // In browser environment, check for global config or data attributes
    const script = document.querySelector('script[data-config]');
    if (script) {
      const config = JSON.parse(script.getAttribute('data-config') || '{}');
      return config[key] || defaultValue;
    }
    return defaultValue;
  }
}
```

These patterns reflect LOFERSIL's actual architecture and should be followed for all new development and modifications.</content>
<parameter name="filePath">.opencode/context/core/essential-patterns.md
