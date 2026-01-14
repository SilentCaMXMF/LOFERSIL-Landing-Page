# LOFERSIL Landing Page Project Context

## Project Overview

**LOFERSIL** is a modern, high-performance landing page for a Portuguese stationery store specializing in office supplies, school materials, and creative products. The site serves as a digital storefront with contact functionality, product showcases, and optimized user experience.

**Target Audience**: Portuguese businesses and individuals seeking quality stationery products
**Key Features**: Product catalog, contact form, internationalization (PT/EN), PWA capabilities, performance optimization

## Technology Stack

**Frontend:**

- **Language**: TypeScript (ES2020 target, strict mode)
- **Styling**: PostCSS with custom CSS framework
- **Build Tool**: Custom Node.js build script (build.js)
- **Module System**: ES modules
- **Image Processing**: Sharp for optimization and responsive images

**Backend/API:**

- **Runtime**: Node.js with Express
- **Contact API**: RESTful endpoint for form submissions
- **Security**: Input validation, DOMPurify for sanitization

**Development & Testing:**

- **Testing Framework**: Vitest with jsdom environment
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Package Manager**: npm (with Bun support)

**Performance & PWA:**

- **Service Worker**: Caching and offline capabilities
- **Web App Manifest**: Installable PWA
- **Optimization**: Lazy loading, debounced events, Intersection Observer

## Project Structure

```
LOFERSIL-Landing-Page/
├── src/
│   ├── scripts/
│   │   ├── modules/           # Core application modules
│   │   │   ├── NavigationManager.ts    # SPA navigation
│   │   │   ├── SEOManager.ts           # SEO optimization
│   │   │   ├── UIManager.ts            # UI state management
│   │   │   ├── ScrollManager.ts        # Scroll effects
│   │   │   ├── ContactFormManager.ts   # Form handling
│   │   │   ├── Router.ts               # Client-side routing
│   │   │   ├── TranslationManager.ts   # i18n support
│   │   │   ├── PerformanceTracker.ts   # Performance monitoring
│   │   │   ├── ErrorHandler.ts         # Error management
│   │   │   └── Logger.ts               # Logging system
│   │   ├── index.ts           # Main application entry
│   │   └── types.ts           # TypeScript type definitions
│   ├── styles/
│   │   └── main.css           # Main stylesheet
│   └── locales/               # Translation files
│       ├── pt.json            # Portuguese translations
│       └── en.json            # English translations
├── api/
│   └── contact.js             # Contact form API endpoint
├── assets/
│   └── images/                # Optimized product images
├── styles/
│   └── main.css               # Processed CSS output
├── index.html                 # Main HTML template
├── server.js                  # Development server
├── build.js                   # Production build script
├── optimize-images.js         # Image optimization script
└── package.json               # Dependencies and scripts
```

## Core Architecture Patterns

### Modular Architecture

- **Separation of Concerns**: Each module handles a specific domain (navigation, SEO, forms, etc.)
- **Dependency Injection**: Modules receive dependencies through constructor injection
- **Event-Driven Communication**: Custom events for cross-module communication
- **Singleton Pattern**: Core managers instantiated once and shared

### Security Patterns

- **Input Sanitization**: DOMPurify for all user-generated HTML content
- **Validation**: Comprehensive client and server-side validation
- **CSP Headers**: Content Security Policy implementation
- **Secure Defaults**: HTTPS-only, secure cookie settings

### Performance Patterns

- **Lazy Loading**: Images and non-critical resources loaded on demand
- **Debouncing**: User input events debounced to prevent excessive processing
- **Intersection Observer**: Efficient scroll-based effects
- **Memory Management**: Proper cleanup of event listeners and timers

### Internationalization

- **JSON-Based Translations**: Separate files for Portuguese and English
- **Dynamic Loading**: Translation strings loaded based on user preference
- **Fallback Support**: Default to Portuguese if translation missing
- **Semantic Keys**: Descriptive keys for maintainable translations

## Development Workflow

1. **Local Development**: `npm run dev` with TypeScript watch mode
2. **Building**: `npm run build` compiles TypeScript and processes assets
3. **Testing**: `npm run test` runs Vitest test suite
4. **Optimization**: `npm run optimize-images` processes product images
5. **Deployment**: Automated deployment to Vercel with build optimization

## Quality Standards

- **TypeScript Strict Mode**: All type checking enabled
- **ESLint Compliance**: Code style and quality enforcement
- **Test Coverage**: Critical paths covered with unit tests
- **Performance Budget**: Lighthouse scores maintained above 90
- **Accessibility**: WCAG 2.1 AA compliance for core functionality
- **SEO Optimization**: Automated sitemap and meta tag generation

## Key Dependencies

**Core:**

- `typescript`: TypeScript compilation
- `sharp`: Image processing and optimization
- `dompurify`: HTML sanitization
- `express`: API server framework

**Development:**

- `vitest`: Testing framework
- `eslint`: Code linting
- `@typescript-eslint/*`: TypeScript-specific linting
- `prettier`: Code formatting

**Build:**

- `postcss`: CSS processing
- `autoprefixer`: CSS vendor prefixing
- `cssnano`: CSS minification

## Deployment & Hosting

- **Platform**: Vercel
- **Build Command**: Custom build script with asset optimization
- **Environment**: Node.js runtime with static file serving
- **CDN**: Automatic asset optimization and global distribution
- **Monitoring**: Vercel analytics and error tracking

This context provides the foundation for understanding LOFERSIL's architecture, technology choices, and development patterns. All agents should reference this when working on the project to ensure alignment with the actual implementation and requirements.</content>
<parameter name="filePath">.opencode/context/project/project-context.md
