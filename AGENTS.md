# LOFERSIL Landing Page - Agent Guidelines

## Build/Lint/Test Commands
- **Build:** `npm run build` (creates dist/ with compiled TS and copied assets)
- **Single test:** `vitest run path/to/test.test.ts` or `npm run test:run`
- **Test by type:** `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`
- **Lint:** `npm run lint` (excludes test files)
- **Format:** `npm run format`
- **Dev server:** `npm run dev` (TypeScript watch mode)

## Code Style Guidelines
- **TypeScript:** Strict mode, ES2020 target, ES modules (.js extensions in imports)
- **Naming:** PascalCase classes, camelCase functions/variables, UPPER_SNAKE_CASE constants
- **Imports:** Use `.js` extensions for ES modules, group imports by type
- **Functions:** JSDoc comments required, generic types with `<T extends (...args: any[]) => any>`
- **Error Handling:** Use ErrorManager class, include context objects with component/operation/timestamp
- **Testing:** Vitest with describe/it/expect, vi for mocking, beforeEach/afterEach for setup
- **File Structure:** src/scripts/modules/ for TS modules, src/styles/ for CSS, assets/ for static files
- **No comments:** Do not add comments unless explicitly requested