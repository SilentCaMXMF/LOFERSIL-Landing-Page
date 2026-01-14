# AGENTS.md - Development Guide for LOFERSIL Landing Page

This document provides essential information for agentic coding assistants (such as yourself) working on the LOFERSIL Landing Page project. It includes build commands, testing procedures, and code style guidelines to ensure consistency and quality.

## Project Overview

LOFERSIL Landing Page is a static TypeScript website built for Vercel deployment. It features dual language support (Portuguese/English), dark/light themes, responsive design, and contact form functionality using Formspree.

Tech Stack:

- TypeScript (relaxed configuration)
- HTML5/CSS3 with PostCSS
- DOMPurify for XSS protection
- ESLint + Prettier for code quality
- Static site generation

## Build/Lint/Test Commands

### Build Commands

```bash
# Full production build (compiles TS, processes CSS, copies assets)
npm run build

# Individual build steps
npm run build:compile    # Compile TypeScript to JavaScript
npm run build:css        # Process CSS with PostCSS
npm run build:copy       # Copy assets to dist/

# Development build (watch TypeScript changes)
npm run dev
```

### Lint and Format Commands

```bash
# Lint TypeScript files
npm run lint

# Format code (runs Prettier on TS and CSS files)
npm run format
```

### Test Commands

**Note:** This project does not currently have automated tests configured. There are no test frameworks (Jest, Vitest, etc.) installed.

If you add tests:

- Install a testing framework like Vitest
- Add test scripts to package.json
- Run single tests with: `npm run test -- --run path/to/test.ts`

### Development Server

```bash
# Serve built site locally (after running npm run build)
npm start
```

## Code Style Guidelines

### General Principles

- **Relaxed TypeScript**: The project uses a permissive TypeScript configuration (strict: false) to prioritize development speed over strict type checking.
- **Browser-first**: All code runs in the browser environment. Use DOM APIs directly.
- **Module-based**: Code is organized into ES modules in `src/scripts/modules/`.
- **Error resilience**: Graceful error handling with user-friendly fallbacks.

### File Structure

```
src/
├── scripts/
│   ├── index.ts                 # Main application entry
│   ├── types.ts                 # Global type definitions
│   ├── validation.ts            # Form validation logic
│   └── modules/                 # Feature modules
│       ├── ContactFormManager.ts
│       ├── ThemeManager.ts
│       ├── NavigationManager.ts
│       └── ...
└── styles/
    └── main.css                 # Main stylesheet
```

### TypeScript Configuration

- **Target**: ES2020
- **Module**: ES2020 with bundler resolution
- **Strict mode**: Disabled (noImplicitAny: false, strictNullChecks: false)
- **JSX**: React-jsx (for potential future React migration)
- **Source maps**: Enabled in development
- **Declaration files**: Not generated

### Import Style

- Use ES6 imports with `.js` extension for relative imports (TypeScript requirement)
- Import types with `import type` syntax
- Group imports: types first, then modules
- Relative paths only (no absolute imports)

```typescript
import type { ContactFormManager } from "./modules/ContactFormManager.js";
import { TranslationManager } from "./modules/TranslationManager.js";
import { ErrorManager } from "./ErrorManager.js";
```

### Naming Conventions

- **Classes**: PascalCase (e.g., `ContactFormManager`, `ThemeManager`)
- **Interfaces**: PascalCase (e.g., `ContactFormConfig`, `ValidationResult`)
- **Methods/Properties**: camelCase (e.g., `initializeForm()`, `currentTheme`)
- **Constants**: UPPER_SNAKE_CASE for configuration constants
- **Private members**: Prefix with underscore (e.g., `_config`, `_validator`)
- **Files**: PascalCase for class files, camelCase for utilities

### Type Annotations

- Use explicit types for public APIs and complex objects
- Allow implicit `any` for simple cases (due to relaxed config)
- Use union types for variant values (e.g., `"light" | "dark"`)
- Prefer interfaces over types for object shapes

### Error Handling

- Use try-catch for operations that might fail (localStorage, DOM queries)
- Log warnings for non-critical errors, not errors
- Provide user feedback for form validation errors
- Graceful degradation when features fail

```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.warn("Failed to save to localStorage:", error);
  // Continue without persistence
}
```

### Code Organization

- **Single Responsibility**: Each module handles one feature
- **JSDoc Comments**: Document all public classes and methods
- **Private Methods**: Use for internal logic, prefixed with `#` if supported
- **Configuration Objects**: Use interfaces for complex config objects
- **Event Listeners**: Clean up on destroy to prevent memory leaks

### DOM Manipulation

- Query elements once in constructor, cache references
- Use modern DOM APIs (querySelector, classList, etc.)
- Avoid direct style manipulation; use CSS classes
- Sanitize user input with DOMPurify before insertion

### Performance Considerations

- Lazy load images and heavy features
- Debounce scroll/resize handlers
- Minimize DOM queries in loops
- Use IntersectionObserver for scroll-based animations

### CSS Guidelines

- Use PostCSS with Autoprefixer for browser compatibility
- CSSnano minification in production
- BEM-like naming: `.component-name__element--modifier`
- CSS custom properties for theming
- Mobile-first responsive design

### Linting Rules

Based on ESLint config:

- `@typescript-eslint/no-unused-vars`: Warn
- `@typescript-eslint/no-explicit-any`: Warn
- `@typescript-eslint/explicit-function-return-type`: Off
- `no-console`: Warn (use for debugging)
- `no-debugger`: Error
- `prefer-const`: Error
- `no-var`: Error

### Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- Run `npm run format` before committing
- Keep commits focused on single changes

### Deployment

- Automatic deployment via GitHub Actions to Vercel
- Manual deployment: `npm run build` then deploy dist/ folder
- Environment variables set in Vercel dashboard

## Testing Strategy

**Current State**: No automated tests.

**Recommended Approach**:

1. Add Vitest for unit testing
2. Test critical paths: form validation, theme switching, navigation
3. Mock DOM APIs for isolated testing
4. Add E2E tests with Playwright if needed

Example test structure:

```
src/
├── scripts/
│   └── modules/
│       └── ContactFormManager.test.ts
```

## Development Workflow

1. **Setup**: `npm install`
2. **Development**: `npm run dev` (watch mode)
3. **Testing**: Manual testing in browser
4. **Linting**: `npm run lint`
5. **Formatting**: `npm run format`
6. **Build**: `npm run build`
7. **Deploy**: Push to main branch or manual Vercel deploy

## AI Assistant Guidelines

- Prefer functional programming where possible
- Keep methods small and focused
- Add JSDoc for new public APIs
- Test changes in multiple browsers
- Follow existing patterns in similar modules
- Use TypeScript types even in relaxed mode
- Document complex logic with comments
- Check console for warnings/errors during development

## Security Considerations

- Sanitize all user inputs with DOMPurify
- Use HTTPS for external requests
- Validate form data on client and server side
- Avoid storing sensitive data in localStorage
- Implement CSP headers if possible

This guide should be updated as the project evolves. Last updated: January 2025.</content>
<parameter name="filePath">AGENTS.md
