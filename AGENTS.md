# AGENTS.md

## Build/Lint/Test Commands

- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: No unit tests; use `npm run lighthouse` for performance audits
- Run single test: N/A (no unit tests available)

## Code Style Guidelines

- **Imports**: Use ES6 imports; group external libraries first, then internal modules
- **Formatting**: Follow Prettier config (single quotes, semicolons, trailing commas, 100 char width)
- **Types**: TypeScript with strict mode; use explicit types, avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Error Handling**: Use try-catch blocks; throw custom errors for clarity
- **Other**: Allow console statements for debugging; no unused variables enforced
- **Additional**: No Cursor or Copilot rules defined
