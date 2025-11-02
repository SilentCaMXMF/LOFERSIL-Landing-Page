# AGENTS.md

## Build/Lint/Test Commands

- **Build**: `npm run build` (custom build script: TypeScript compilation, CSS processing, asset optimization)
- **Dev**: `npm run dev` (TypeScript watch mode for development)
- **Lint**: `npm run lint` (ESLint on src/**/*.ts with TypeScript rules)
- **Format**: `npm run format` (Prettier on src/**/*.{ts,css,html})
- **Test**: `npm run test` (Vitest with watch mode) or `npm run test:run` (Vitest run once)
- **Single test**: `npm run test:run src/scripts/index.test.ts` or `vitest run src/scripts/validation.test.ts`
- **Performance audit**: `npm run lighthouse` (Lighthouse performance testing on localhost:3000)
- **Serve**: `npm run start` (serve dist folder on port 3000)

## Code Style Guidelines

### Language & Environment

- **TypeScript**: ES2020 target, strict mode enabled, DOM types included
- **Module system**: ES modules (`"type": "module"` in package.json)
- **Runtime**: Browser environment with Node.js types for build tools

### Imports & Dependencies

- **Import style**: ES6 imports with named imports preferred
- **Grouping**: External libraries first (e.g., DOMPurify), then internal modules
- **Example**:

  ```typescript
  import { ErrorHandler } from './modules/ErrorHandler';
  import { NavigationManager } from './modules/NavigationManager';
  ```

### Formatting & Style

- **Formatter**: Prettier with single quotes, semicolons, trailing commas
- **Line width**: 100 characters
- **Indentation**: 2 spaces (configured in Prettier)
- **CSS**: Processed with PostCSS, minified in production

### Types & TypeScript

- **Strict mode**: Enabled in tsconfig.json
- **Type annotations**: Explicit types required, avoid `any`
- **Interfaces**: PascalCase, descriptive names (e.g., `NavigationConfig`, `Service`)
- **Generic types**: Used for utility functions (e.g., `debounce<T>`)
- **Global declarations**: Used for browser APIs and CDN-loaded libraries

### Naming Conventions

- **Variables/Functions**: camelCase (e.g., `navigationConfig`, `initializeApp`)
- **Classes/Interfaces**: PascalCase (e.g., `LOFERSILLandingPage`, `ErrorHandler`)
- **Constants**: UPPER_SNAKE_CASE for config objects (e.g., `IS_DEVELOPMENT`)
- **Files**: PascalCase for class files, camelCase for utility files
- **Directories**: lowercase with hyphens if needed

### Error Handling

- **Try-catch blocks**: Used for async operations and external API calls
- **Custom errors**: Throw descriptive errors with context
- **Fallbacks**: Graceful degradation (e.g., routes fallback to home page)
- **Logging**: Console statements allowed for debugging in development

### Architecture Patterns

- **Modular design**: Separate concerns into modules (NavigationManager, SEOManager, etc.)
- **Configuration objects**: Centralized config for different features
- **Event-driven**: Custom events for cross-module communication
- **Utility functions**: Pure functions for common operations (debounce, throttle, etc.)
- **Class-based**: Main application logic in classes with dependency injection

### Testing

- **Framework**: Vitest with jsdom environment
- **Mocking**: Comprehensive mocking of DOM APIs and external dependencies
- **Test structure**: Describe blocks for features, it blocks for specific behaviors
- **Coverage**: Focus on critical paths and error conditions
- **Environment**: Tests run in isolated environment with mocked globals

### Build & Deployment

- **Build process**: Custom Node.js script handling TypeScript, CSS, assets
- **Optimization**: Minification, image optimization (WebP), source maps in production
- **Asset management**: Images converted to multiple sizes and formats
- **SEO**: Automatic sitemap and robots.txt generation
- **Deployment**: Vercel-ready with environment-specific builds

### Additional Rules

- **No unused variables**: Enforced by ESLint
- **Console statements**: Allowed for debugging (warn level in production)
- **Comments**: JSDoc-style for public APIs and complex logic
- **Security**: DOMPurify for HTML sanitization, input validation
- **Performance**: Debounced/throttled event handlers, lazy loading
- **Accessibility**: Semantic HTML, proper ARIA attributes where needed

### No External Rules

- No Cursor rules (.cursor/rules/ or .cursorrules) defined
- No Copilot rules (.github/copilot-instructions.md) defined
