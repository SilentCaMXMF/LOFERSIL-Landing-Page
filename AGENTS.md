# AGENTS.md

## Build/Lint/Test Commands

- Build: `npm run build` (runs build.js for static site generation)
- Lint: `npm run lint` (ESLint on src/\*_/_.ts)
- Format: `npm run format` (Prettier on src/\*_/_.{ts,css,html})
- Test: No unit tests; use `npm run lighthouse` for performance audits
- Run single test: N/A (no unit tests available)

## Code Style Guidelines

- **Imports**: Use ES6 imports; group external libraries first, then internal modules
- **Formatting**: Follow Prettier config (single quotes, semicolons, trailing commas, 100 char width, 2-space tabs)
- **Types**: TypeScript with strict mode (ES2020 target); use explicit types, avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Error Handling**: Use try-catch blocks; throw custom errors for clarity
- **Other**: Allow console statements for debugging (warn level); no unused variables enforced
- **Additional**: No Cursor or Copilot rules defined; static site with no React components
