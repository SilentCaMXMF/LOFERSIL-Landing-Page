# AGENTS.md - LOFERSIL Landing Page

This file contains essential information for agentic coding assistants working on the LOFERSIL Landing Page project.

## Build Commands

### Full Build
```bash
npm run build
```
Compiles TypeScript, processes CSS with PostCSS, copies static assets, and outputs to `dist/` directory.

### Production Build
```bash
npm run build:prod
```
Production build with optimizations and minification.

### Development Build
```bash
npm run build:dev
```
Quick development build.

### Watch Mode
```bash
npm run dev
```
Watches TypeScript files for changes and recompiles automatically.

## Test Commands

### Run All Tests
```bash
npm test
# or
npm run test:run
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### Run Single Test File
```bash
# Run a specific test file
npx vitest run path/to/test-file.test.ts

# Example: Run mobile navigation tests
npx vitest run tests/unit/mobile-navigation.test.js
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# Unit test coverage
npm run test:coverage:unit

# Integration test coverage
npm run test:coverage:integration

# E2E test coverage
npm run test:coverage:e2e
```

## Lint Commands

### Lint TypeScript Files
```bash
npm run lint
```
Lints all TypeScript files in `src/` directory (excludes test files).

### Format Code
```bash
npm run format
```
Formats TypeScript and CSS files using Prettier.

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022
- Module system: ES modules
- Strict mode: Disabled (allows implicit any, no implicit returns/this)
- Source maps enabled
- Decorators not allowed
- JSX: React (automatic runtime)

### ESLint Rules
- **Unused variables**: Warn (TypeScript handles this)
- **Explicit any**: Warn
- **Console statements**: Warn
- **Debug statements**: Error
- **Prefer const**: Error
- **No var**: Error
- **Unused vars from TS**: Off (let TS handle)

### Naming Conventions
- **Files**: kebab-case (e.g., `mobile-navigation.js`, `contact-form-enhancer.js`)
- **Classes**: PascalCase (e.g., `MobileNavigationEnhancer`)
- **Functions/Methods**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Variables**: camelCase

### Import/Export Style
- Use ES6 imports/exports
- Group imports: standard library, third-party, local modules
- Use absolute paths with aliases when available (@/, @scripts/, @modules/, etc.)

### Error Handling
- Use try/catch blocks for async operations
- Throw descriptive error messages
- Handle promise rejections properly
- Log errors appropriately (not in production)

### Code Organization
- One class/function per file when possible
- Group related functionality
- Use clear, descriptive names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### CSS/PostCSS
- Use PostCSS with Autoprefixer for vendor prefixes
- CSS Nano for production minification
- Follow BEM methodology for class naming
- Use CSS custom properties (variables) for theming

### Testing
- Use Vitest as test runner
- JSDOM environment for DOM testing
- Global test functions enabled
- Coverage thresholds: 80% for all metrics
- Test files: `*.test.ts`, `*.test.js`
- Mock external dependencies appropriately

### API Endpoints
- Node.js/Express based
- Use ES modules
- Include proper error handling and validation
- Rate limiting and security middleware
- CORS configuration

### Performance
- Lazy load images with intersection observer
- Service worker for offline support
- Critical CSS inlining
- Resource hints (preconnect, dns-prefetch)
- Bundle optimization for production

### Security
- Input validation and sanitization
- CSRF protection
- Rate limiting
- Helmet for security headers
- Content Security Policy
- XSS protection with DOMPurify

### Accessibility
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

### Internationalization
- Portuguese (pt) and English (en) locales
- Data attributes for translation keys
- Client-side language switching
- RTL support preparation

### Git Workflow
- Feature branches from main
- Pull request reviews required
- Automated CI/CD with GitHub Actions
- Vercel deployment previews
- Production deployment to Vercel

## Development Workflow

1. **Setup**: `npm install`
2. **Development**: `npm run dev` (watch mode) + `npm start` (serve locally)
3. **Testing**: Run tests frequently, ensure coverage thresholds met
4. **Linting**: `npm run lint` before commits
5. **Formatting**: `npm run format` to maintain consistent style
6. **Build**: `npm run build` for production-ready artifacts
7. **Deploy**: Automated via GitHub Actions to Vercel

## Environment Variables

- `NODE_ENV`: Set to "production" for production builds
- `VITEST_SEED`: Optional seed for test randomization
- API keys and secrets in `.env` files (not committed)

## File Structure
```
├── src/
│   ├── locales/          # Translation files
│   └── styles/           # CSS files (processed by PostCSS)
├── api/                  # Serverless API endpoints
├── assets/               # Static assets (images, etc.)
├── tests/                # Test files (unit, integration, e2e)
├── dist/                 # Build output (generated)
├── index.html           # Main HTML file
└── package.json         # Dependencies and scripts
```</content>
<parameter name="filePath">AGENTS.md