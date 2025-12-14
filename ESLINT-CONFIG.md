# ESLint Configuration for LOFERSIL Landing Page

This project uses a modern ESLint flat configuration (`eslint.config.js`) that provides comprehensive linting for TypeScript, JavaScript, PWA development, accessibility, security, and performance.

## Features

### 🎯 TypeScript Support

- Full TypeScript parsing with `@typescript-eslint/parser`
- Type-aware linting with project configuration
- Import/export organization and sorting
- Async/await and promise handling best practices

### 🔒 Security Rules

- XSS prevention with DOMPurify integration
- Input validation and sanitization
- CSRF token validation
- Bot detection patterns
- No eval, no new Function, no script URLs

### ♿ Accessibility (a11y)

- ARIA attribute validation
- Screen reader compatibility
- Focus management
- Live region announcements
- Keyboard navigation support

### ⚡ Performance Optimization

- Memory leak prevention
- Service worker caching strategies
- Async operation best practices
- Bundle size optimization
- Critical resource loading

### 🌐 PWA Development

- Service Worker specific globals and patterns
- Offline functionality support
- Push notification handling
- Background sync validation
- Cache management rules

## Usage

### Basic Linting

```bash
# Lint all TypeScript and JavaScript files
npm run lint

# Lint specific files
npx eslint src/scripts/modules/ContactFormManager.ts

# Lint with auto-fix
npx eslint . --fix
```

### Configuration Structure

The configuration is organized into logical sections:

1. **Base Rules**: JavaScript/TypeScript fundamentals
2. **TypeScript Files**: `.ts` and `.tsx` specific rules
3. **JavaScript Files**: `.js` specific rules
4. **Service Workers**: `sw.js` and service worker patterns
5. **Test Files**: `.test.ts`, `.spec.js` test-specific rules
6. **API Files**: Security-focused API endpoint rules
7. **PWA Rules**: Performance and offline functionality
8. **Accessibility**: ARIA and screen reader support
9. **Security**: XSS, CSRF, and input validation
10. **Import/Export**: Module organization and sorting

### Key Rules

#### Security

- `no-eval`: Prevents code injection
- `no-implied-eval`: Blocks indirect eval usage
- `no-script-url`: Disallows javascript: URLs
- `prefer-promise-reject-errors`: Ensures proper error handling

#### Performance

- `no-loop-func`: Prevents memory leaks in loops
- `no-inner-declarations`: Avoids function hoisting issues
- `no-extend-native`: Prevents prototype pollution
- `require-await`: Ensures async functions use await

#### Accessibility

- `no-alert`: Encourages ARIA live regions over alerts
- `no-duplicate-id`: Prevents DOM ID conflicts
- `no-labels`: Ensures proper form labeling
- `prefer-const`: Encourages immutable patterns

#### TypeScript Best Practices

- `@typescript-eslint/prefer-optional-chain`: Cleaner null checks
- `@typescript-eslint/prefer-nullish-coalescing`: Better null handling
- `@typescript-eslint/no-floating-promises`: Prevents unhandled promises
- `@typescript-eslint/no-misused-promises`: Correct async patterns

### File-Specific Configurations

#### Service Workers (`src/scripts/sw.js`)

- Service Worker globals enabled (`self`, `caches`, `clients`)
- Console logging allowed for debugging
- Cache management patterns validated

#### Test Files (`**/*.test.ts`, `**/*.spec.js`)

- Vitest globals enabled (`describe`, `it`, `test`, `expect`)
- Relaxed rules for test assertions
- `any` types allowed for test flexibility

#### API Files (`api/**/*.js`, `api/**/*.ts`)

- Enhanced security validation
- Input sanitization requirements
- Error handling best practices

### Integration with Other Tools

#### Prettier

The ESLint config is designed to work alongside Prettier:

```bash
# Format code
npm run format

# Lint after formatting
npm run lint
```

#### Vitest Testing

Test files have relaxed rules to allow:

- Test-specific patterns
- Mock objects and fixtures
- Assertion syntax flexibility

#### TypeScript Compilation

The config respects `tsconfig.json` settings:

- ES2020 target support
- DOM library types
- Module resolution configuration

### Custom Rules for LOFERSIL

#### DOM Manipulation Safety

- Allows `innerHTML` when used with DOMPurify
- Permits DOM element property modifications
- Validates event handler patterns

#### Form Security

- CSRF token validation
- Honeypot field detection
- Rate limiting enforcement
- Bot detection patterns

#### PWA Features

- Service worker lifecycle validation
- Cache strategy patterns
- Background sync requirements
- Push notification handling

### Troubleshooting

#### Common Issues

1. **TypeScript Project Not Found**

   ```bash
   # Ensure tsconfig.json exists and is valid
   npx tsc --noEmit
   ```

2. **Missing Globals**
   - Service Worker files: `self`, `caches`, `clients`
   - Browser files: `window`, `document`, `navigator`
   - Test files: `describe`, `it`, `expect`

3. **Import Path Issues**
   - Use `.js` extensions for ES modules
   - Check `tsconfig.json` `moduleResolution`
   - Verify file paths exist

#### Performance Tips

1. **ESLint Cache**

   ```bash
   # Enable caching for faster runs
   npx eslint . --cache
   ```

2. **Selective Linting**

   ```bash
   # Lint only changed files
   npx eslint --cache --quiet src/scripts/
   ```

3. **CI/CD Integration**
   ```bash
   # Strict linting for CI
   npx eslint . --max-warnings=0
   ```

## Contributing

When adding new rules or configurations:

1. Test against existing codebase
2. Update this documentation
3. Consider impact on build performance
4. Ensure compatibility with Prettier
5. Validate TypeScript compilation

## Dependencies

Required packages (already installed):

- `eslint@^9.0.0`
- `@eslint/js@^9.0.0`
- `@typescript-eslint/eslint-plugin@^8.0.0`
- `@typescript-eslint/parser@^8.0.0`
- `globals@^15.0.0`

This configuration provides a robust foundation for maintaining code quality, security, accessibility, and performance in the LOFERSIL Landing Page project.
