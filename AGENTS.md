# AGENTS.md - LOFERSIL Landing Page

This file provides guidelines for agentic coding agents working on this codebase.

## Build, Lint, and Test Commands

```bash
# Full build (compile, CSS, copy assets, SEO)
npm run build

# Build only (compile + CSS, no asset copying)
npm run build:dev

# Development mode with TypeScript watch
npm run dev

# Lint all TypeScript files
npm run lint

# Format code (TypeScript + CSS)
npm run format

# Start local server (serve dist folder)
npm start

# Pre-build (runs format before build)
npm run prebuild
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: No `any` unless necessary (linter warns)
- **Explicit types**: Use interfaces for objects, types for unions/primitives
- **Import types**: Use `import type { Foo } from "./foo.js"` for type-only imports
- **ES modules**: Use `.js` extension in imports (even for TypeScript files)
- **Async/await**: Prefer over Promise chains for readability

### Naming Conventions

- **Classes**: PascalCase (`class LOFERSILLandingPage`)
- **Functions/variables**: camelCase (`submitContact`, `isValid`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces**: PascalCase with descriptive names (`ContactRequest`)
- **Private members**: Prefix with `_` or use `private` keyword (`private logger`)

### Imports Order

1. Type-only imports (`import type`)
2. External library imports
3. Internal module imports (relative paths)
4. Order matches existing file patterns

Example:

```typescript
import type { ContactRequest, ContactResponse } from "./types.js";
import { TranslationManager } from "./modules/TranslationManager.js";
import { envLoader } from "./modules/EnvironmentLoader.js";
import { ErrorManager } from "./modules/ErrorManager.js";
```

### Error Handling

- Use `ErrorManager` class for centralized error handling
- Always provide context: `{ component, operation, timestamp }`
- Never swallow errors silently
- Return typed response objects for async operations

```typescript
try {
  // operation
} catch (error) {
  this.errorHandler.handleError(error, "Operation failed", {
    component: "ClassName",
    operation: "methodName",
    timestamp: new Date(),
  });
}
```

### CSS/Styles

- Use CSS custom properties (variables) from `:root`
- Follow existing color variables (`--brand-primary`, `--gray-500`)
- Use BEM-style naming for component classes (`.block__element--modifier`)
- Mobile-first responsive design
- Dark mode support via `[data-theme="dark"]` selector

### File Organization

- **Entry point**: `src/scripts/index.ts`
- **Modules**: `src/scripts/modules/[ModuleName].ts`
- **Types**: `src/scripts/types.ts`
- **Styles**: `src/styles/*.css` (main.css imports others)
- **Locales**: `src/locales/[lang].json`

### Git Workflow

- Commit messages: `<emoji> <type>: <description>` (conventional commits)
- Branch naming: `feature/...`, `fix/...`, `ci/...`
- Run `npm run lint && npm run build` before committing
- Run `npm run format` to auto-format before committing

### Testing Notes

- No dedicated test framework currently configured
- Build validation serves as primary quality gate
- ESLint catches TypeScript issues
- Prettier enforces code formatting

### Browser Compatibility

- Target: ES2020 (configured in tsconfig.json)
- Modern browsers with ES modules support
- No legacy browser polyfills expected

### Key Dependencies

- **dompurify**: XSS protection (imported at runtime)
- **No frameworks**: Vanilla TypeScript + CSS
- **Node 22.x** required
