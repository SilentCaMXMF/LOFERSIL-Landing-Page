# AGENTS.md - Development Guidelines

## Commands

- **Build**: `npm run build` (full) / `npm run build:dev` (dev)
- **Lint**: `npm run lint` (ESLint) / `npm run format` (Prettier)
- **Test**: `npm run test` (watch) / `npm run test:run` (single run)
- **Single Test**: `vitest run path/to/test.test.ts`
- **Coverage**: `npm run test:coverage` / `npm run test:coverage:unit`

## Code Style

- **TypeScript**: Strict mode, ES2020 target, interfaces over types
- **Imports**: Use `type` imports for types: `import type { Config }`
- **Naming**: PascalCase for classes/interfaces, camelCase for variables/functions
- **Formatting**: 2-space indent, single quotes, no trailing commas
- **Error Handling**: Always catch promises, use ErrorManager for logging

## Architecture

- **Modules**: Export classes, use singleton pattern for managers
- **Types**: Centralized in `src/scripts/types.ts`
- **Security**: Use DOMPurify for HTML sanitization, no eval()
- **Performance**: Lazy loading, event delegation, memory leak prevention

## Testing

- **Framework**: Vitest with jsdom environment
- **Structure**: unit/integration/e2e in separate directories
- **Coverage**: 80% threshold required
- **Globals**: describe/it/expect available

## Security

- **XSS**: Always sanitize HTML with DOMPurify
- **CSRF**: Use tokens for forms
- **API**: Validate inputs with Joi, rate limiting enabled
