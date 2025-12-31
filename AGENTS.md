# LOFERSIL Landing Page - Agent Guidelines

## Build/Lint/Test Commands

### Core Commands

- **Full Build:** `npm run build` (bundles JS, compiles TS, processes CSS, copies assets, generates SEO files)
- **Development Build:** `npm run build:dev` (bundle + CSS only)
- **Bundle Only:** `npm run build:bundle` (creates JavaScript bundle)
- **CSS Only:** `npm run build:css` (PostCSS processing)
- **Copy Assets:** `npm run build:copy` (copies static files to dist/)
- **TypeScript Compile:** `npm run build:compile` (tsc compilation)

### Testing Commands

- **Single Test:** Run individual test files from `test-scripts-archive/` directory
- **Email Testing:** `npm run test:email` (tests SMTP/email functionality)
- **Contact Form:** `npm run test:contact` (tests contact API endpoint)
- **Bundle Verification:** `npm run verify:bundle` (validates JavaScript bundle)
- **Environment Check:** `npm run check:env` (validates environment variables)
- **Browser Compatibility:** `npm run test:browser` (tests module detection)
- **Full Compatibility:** `npm run test:compatibility` (builds then tests compatibility)

### Code Quality

- **Lint:** `npm run lint` (ESLint on TypeScript files in src/)
- **Format:** `npm run format` (Prettier on .ts and .css files)
- **Dev Server:** `npm run dev` (TypeScript watch mode)
- **Start Production:** `npm run start` (serve dist/ on port 3000)

## Code Style Guidelines

### TypeScript Configuration

- **Target:** ES2020, **Module:** ES2020, **Strict Mode:** Enabled
- **Module Resolution:** Bundler (for esbuild compatibility)
- **Extensions:** Use `.js` extensions in import statements for ES modules
- **Source Maps:** Enabled for debugging, **Comments:** Preserved
- **Type Safety:** Strict mode with consistent casing

### Import/Export Patterns

```typescript
// Use .js extensions for ES modules
import { ContactFormValidator } from "../validation.js";
import type { TranslationManager } from "./TranslationManager.js";

// Group imports by type: types, then modules, then external deps
import type { ContactRequest } from "../validation.js";
import { ErrorManager } from "./ErrorManager.js";
import DOMPurify from "dompurify";
```

### Naming Conventions

- **Classes/Interfaces:** PascalCase (ContactFormManager, LazyLoadConfig)
- **Functions/Variables:** camelCase (handleSubmit, isLoading, performanceMetrics)
- **Constants:** UPPER_SNAKE_CASE (MIN_NAME_LENGTH, API_ENDPOINTS)
- **Files:** PascalCase for modules (ContactFormManager.ts), kebab-case for utilities

### Error Handling

- **Use ErrorManager:** Always use the centralized ErrorManager class from "./ErrorManager.js"
- **Context Objects:** Include component, operation, and timestamp in error context
- **Graceful Degradation:** Never break the user experience, always provide fallbacks
- **Async Error Handling:** Use try-catch with proper error logging and user feedback

### Function Documentation

- **JSDoc Required:** All exported functions must have JSDoc comments
- **Type Annotations:** Use explicit return types and parameter types
- **Generic Types:** Use proper generic syntax: `<T extends (...args: any[]) => any>`

### File Structure Organization

```
src/scripts/
├── index.ts (main entry point)
├── validation.ts (shared validation logic)
├── types.ts (global type definitions)
└── modules/
    ├── ContactFormManager.ts
    ├── LazyLoadManager.ts
    ├── ErrorManager.ts
    └── (other feature modules)
```

### CSS and Styling

- **PostCSS Processing:** All CSS goes through PostCSS pipeline
- **Responsive Design:** Mobile-first approach with breakpoints
- **Performance:** Use CSS containment and will-change properties appropriately
- **Accessibility:** Include focus states, ARIA labels, and semantic markup

### API Integration

- **Environment Variables:** Use EnvironmentLoader for all external configuration
- **Error Handling:** Include proper HTTP status code handling and user feedback
- **Security:** Always sanitize user input with DOMPurify
- **CORS:** Handle cross-origin requests gracefully

### Performance Guidelines

- **Lazy Loading:** Use LazyLoadManager for below-fold content and images
- **Bundle Optimization:** esbuild handles tree shaking and minification
- **Module Detection:** Include fallbacks for browsers without ES6 support
- **Memory Management:** Clean up event listeners and observers

### Development Workflow

- **Pre-build Hook:** Runs format automatically before each build
- **Bundle Verification:** Always run verify:bundle after major changes
- **Browser Testing:** Test compatibility with test:browser before deployment
- **Environment Validation:** Use check:env to verify SMTP configuration

### Security Requirements

- **Input Sanitization:** Mandatory DOMPurify usage for all user input
- **CSRF Protection:** Include CSRF tokens in form submissions
- **Environment Security:** Never commit sensitive environment variables
- **HTTPS Enforcement:** All production endpoints must use HTTPS

### No Comments Policy

- **Exception:** Only add comments when explicitly requested or for complex algorithms
- **Self-Documenting Code:** Write clear, descriptive function and variable names
- **JSDoc Only:** Use JSDoc for documentation, avoid inline comments

This codebase follows a modular architecture with TypeScript strict mode, modern ES2020+ features, and a focus on performance, accessibility, and maintainability. Always test bundle integrity and browser compatibility before deployment.
