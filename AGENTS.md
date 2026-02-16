# AGENTS.md - Development Guide for LOFERSIL Landing Page

Static TypeScript website for Vercel deployment with dual language support (Portuguese/English), dark/light themes, responsive design, and Formspree contact forms.

**Tech Stack**: TypeScript (relaxed), HTML5/CSS3 + PostCSS, DOMPurify, ESLint + Prettier, Vitest

---

## Build/Lint/Test Commands

```bash
# Build
npm run build              # Full production build (compile + css + copy)
npm run build:compile     # Compile TypeScript to JavaScript
npm run build:css         # Process CSS with PostCSS ( Autoprefixer + cssnano)
npm run build:copy        # Copy assets to dist/

# Development
npm run dev               # Watch TypeScript changes
npm run start             # Serve built site locally (port 3000)

# Quality
npm run lint              # Lint TypeScript files
npm run format            # Format code with Prettier
npm run format:check      # Check formatting without writing

# Testing (requires npm install vitest)
# npm install vitest --save-dev  # Install first if needed
npx vitest run                       # Run all tests
npx vitest run src/scripts/modules/ThemeManager.test.ts  # Run single test file
npx vitest --watch                  # Watch mode
```

---

## Code Style Guidelines

### General Principles
- **Relaxed TypeScript**: `strict: false` in tsconfig.json - implicit `any` allowed for simple cases
- **Browser-first**: ES2020 target, vanilla JS transpiled from TypeScript
- **ES Modules**: Use `.js` extensions for relative imports
- **Error Resilience**: Graceful degradation, never crash the page

### TypeScript Config (tsconfig.json)
```json
{
  "target": "ES2020",
  "module": "ES2020",
  "moduleResolution": "bundler",
  "strict": false,
  "esModuleInterop": true,
  "skipLibCheck": true,
  "forceConsistentCasingInFileNames": true
}
```

### Imports
- Group imports: types first, then regular imports
- Use `import type` for type-only imports
- Add `.js` extension for relative imports

```typescript
import type { ContactFormManager } from "./modules/ContactFormManager.js";
import { TranslationManager } from "./modules/TranslationManager.js";
```

### Naming Conventions
- **Classes/Interfaces**: PascalCase (`ThemeManager`, `ContactFormData`)
- **Methods/Properties**: camelCase (`init()`, `handleSubmit()`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_LANGUAGE`, `API_ENDPOINT`)
- **Private Members**: Use `#` prefix for private methods (e.g., `#init()`)

### Types
- Explicit types for public APIs
- Allow implicit `any` for simple DOM manipulations
- Use union types for variants
- Prefer interfaces over types for object shapes

```typescript
interface ThemeConfig {
  default: 'light' | 'dark' | 'system';
  toggle: boolean;
}

type Theme = 'light' | 'dark' | 'system';
```

### Error Handling
- Use try-catch for localStorage/DOM operations
- Log warnings (not errors) for expected failures
- Provide user feedback for validation errors
- Graceful degradation - app should work even if features fail

```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.warn("Failed to save preference:", error);
}
```

---

## Project Organization

### Directory Structure
```
src/
├── locales/              # Translation JSON files (pt.json, en.json)
├── scripts/              # TypeScript source
│   ├── index.ts          # Main entry point
│   ├── modules/          # Feature modules
│   │   ├── ThemeManager.ts
│   │   ├── TranslationManager.ts
│   │   ├── NavigationManager.ts
│   │   ├── ContactFormManager.ts
│   │   ├── ScrollManager.ts
│   │   └── ...
│   ├── validation.ts     # Form validation utilities
│   └── types.ts          # Global type definitions
├── styles/               # PostCSS source
│   └── main.css          # Main stylesheet
└── utils/                # Utility modules
    ├── webVitals.ts      # Performance monitoring
    └── errorTracking.ts  # Error reporting
```

### Module Guidelines
- **Single Responsibility**: Each module handles one feature
- **JSDoc**: Document public APIs with JSDoc comments
- **Private Methods**: Use `#` prefix for private class methods
- **Cleanup**: Remove event listeners when modules are destroyed

### DOM Patterns
- Cache element references (don't query DOM repeatedly)
- Use modern APIs (`querySelector`, `addEventListener`)
- Prefer CSS classes over inline styles
- Sanitize user input with DOMPurify

### Performance
- Lazy loading for images (`loading="lazy"`)
- Debounce scroll/resize handlers
- Minimize DOM queries
- Use IntersectionObserver for animations

---

## CSS Guidelines

### Styling Approach
- **PostCSS**: With Autoprefixer and CSSnano for minification
- **BEM Naming**: `block__element--modifier` (e.g., `.nav-menu__item--active`)
- **CSS Custom Properties**: For theming and consistent values
- **Mobile-First**: Write base styles for mobile, add media queries for desktop

### CSS Variables Example
```css
:root {
  --color-primary: #2d5a27;
  --color-text: #333333;
  --spacing-md: 1rem;
  --transition-fast: 0.2s ease;
}
```

---

## Linting Rules

ESLint configured with these key rules:
- `no-unused-vars`: warn
- `no-explicit-any`: warn
- `no-console`: warn (for console.log usage)
- `no-debugger`: error
- `prefer-const`: error
- `no-var`: error

---

## Git/Commit Conventions

### Commit Message Format
```
type: description

[optional body]
```

Types: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

### Workflow
1. Run `npm run format` before committing
2. Run `npm run lint` to check for issues
3. Create focused, atomic commits
4. Use conventional commit format

---

## Deployment

### Automatic (GitHub Actions)
- Push to `master` branch triggers workflow
- Builds `dist/` folder
- Deploys to Vercel production
- Vercel GitHub integration disabled (manual build only)

### Manual
```bash
npm run build
# Deploy dist/ folder via Vercel CLI or dashboard
```

---

## AI Assistant Guidelines

- Prefer functional programming patterns
- Write small, focused methods
- Add JSDoc for public APIs
- Follow existing code patterns in the codebase
- Use types even in relaxed mode
- Document complex logic
- Check browser console for warnings during testing
- Test in multiple browsers if possible

---

## Security

- **XSS Protection**: Sanitize all user input with DOMPurify
- **CSP Headers**: Configured in vercel.json
- **Form Validation**: Client-side validation + Formspree backend
- **No Secrets**: Never expose API keys in client-side code
- **HTTPS**: Enforced by Vercel

---

## Development Workflow

```
1. Setup:    npm install
2. Dev:      npm run dev (watch TS) + npm run start (serve)
3. Test:     Manual testing in browser
4. Quality:  npm run lint → npm run format → npm run build
5. Deploy:   git push to master
```
