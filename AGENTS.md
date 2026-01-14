# AGENTS.md - Development Guide for LOFERSIL Landing Page

Static TypeScript website for Vercel deployment with dual language support (Portuguese/English), dark/light themes, responsive design, and Formspree contact forms.

Tech Stack: TypeScript (relaxed), HTML5/CSS3 + PostCSS, DOMPurify, ESLint + Prettier

## Build/Lint/Test Commands

```bash
npm run build           # Full production build
npm run build:compile   # Compile TypeScript to JavaScript
npm run build:css       # Process CSS with PostCSS
npm run build:copy      # Copy assets to dist/
npm run dev             # Watch TypeScript changes
npm start               # Serve built site locally (port 3000)
npm run lint            # Lint TypeScript files
npm run format          # Format code with Prettier
```

**Testing**: No automated tests configured. If adding tests, install Vitest and run single tests with: `npm run test -- --run path/to/test.ts`

## Code Style Guidelines

**General Principles**: Relaxed TypeScript (strict: false), browser-first, ES modules in `src/scripts/modules/`, error resilience

**TypeScript Config**: ES2020 target, bundler resolution, no strict mode, React-jsx, source maps enabled

**Imports**: ES6 with `.js` extensions for relative imports, `import type` for types, group imports (types first)

```typescript
import type { ContactFormManager } from "./modules/ContactFormManager.js";
import { TranslationManager } from "./modules/TranslationManager.js";
```

**Naming**: Classes/Interfaces PascalCase, methods/properties camelCase, constants UPPER*SNAKE_CASE, private members with `*` prefix

**Types**: Explicit types for public APIs, allow implicit `any` for simple cases, union types for variants, prefer interfaces

**Error Handling**: Try-catch for localStorage/DOM, log warnings (not errors), user feedback for validation, graceful degradation

```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.warn("Failed to save:", error);
}
```

**Organization**: Single responsibility modules, JSDoc for public APIs, private methods with `#`, config interfaces, clean up event listeners

**DOM**: Cache element references, modern APIs, CSS classes over styles, sanitize with DOMPurify

**Performance**: Lazy loading, debounced scroll/resize, minimize DOM queries, IntersectionObserver

**CSS**: PostCSS + Autoprefixer, CSSnano, BEM naming, CSS custom properties, mobile-first

**Linting**: `no-unused-vars: warn`, `no-explicit-any: warn`, `no-console: warn`, `no-debugger: error`, `prefer-const: error`, `no-var: error`

**Commits**: Conventional commits (`feat:`, `fix:`, `docs:`), run `npm run format` first, focused changes

**Deployment**: GitHub Actions to Vercel, or `npm run build` then deploy `dist/`

## Development Workflow

Setup → Dev (`npm run dev`) → Test manually → Lint (`npm run lint`) → Format (`npm run format`) → Build → Deploy

## AI Assistant Guidelines

Prefer functional programming, small focused methods, JSDoc for public APIs, test in multiple browsers, follow existing patterns, use types even in relaxed mode, document complex logic, check console for warnings

## Security

Sanitize inputs with DOMPurify, use HTTPS, validate client/server, avoid sensitive localStorage, implement CSP headers</content>
<parameter name="filePath">AGENTS.md
