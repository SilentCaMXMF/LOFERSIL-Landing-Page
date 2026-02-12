# Astro Migration Guide

## Phase 3 Complete: Migration to Astro

This document outlines the successful migration from static HTML to Astro framework.

### What Was Migrated

#### ✅ Completed Tasks

1. **Astro Framework Installation**
   - Installed Astro v5.17.2
   - Added Vercel adapter for deployment
   - Added Tailwind CSS integration

2. **Project Structure**
   - Created Astro-compatible directory structure:
     ```
     src/
     ├── pages/          # Astro pages (index.astro, privacy.astro, terms.astro)
     ├── components/     # Astro components
     ├── layouts/       # Astro layouts (MainLayout.astro)
     └── styles/        # CSS files
     public/            # Static assets
     ```
   - Moved assets to `public/` directory
   - Copied scripts to `public/scripts/`

3. **Page Conversion**
   - `index.html` → `src/pages/index.astro`
   - `en/index.html` → `src/pages/en/index.astro`
   - `privacy.html` → `src/pages/privacy.astro`
   - `terms.html` → `src/pages/terms.astro`

4. **Layout System**
   - Created `MainLayout.astro` with proper meta tags
   - Maintained SEO optimization
   - Added CSP security headers
   - Supports multiple languages with hreflang

5. **Configuration Updates**
   - `astro.config.mjs`: Astro configuration with Vercel adapter
   - `package.json`: Updated scripts for Astro
   - `vercel.json`: Set framework to "astro"
   - `.astroignore`: Excludes unnecessary files
   - `eslint.config.js`: Added Astro file support

### Benefits Gained

#### 🔒 Enhanced Security
- Built-in CSP headers configuration
- Better control over script loading
- Reduced attack surface

#### ⚡ Performance
- Astro's static site generation
- Optimized asset bundling
- Automatic code splitting
- Improved Core Web Vitals

#### 🛠 Developer Experience
- Component-based architecture
- TypeScript support out of the box
- Modern build system
- Better development server

#### 🌍 Internationalization
- Clean language routing (`/` for PT, `/en/` for EN)
- Proper hreflang implementation
- Meta tag management

### Building and Deploying

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
npm run build && vercel --prod
```

### File Structure After Migration

```
src/
├── pages/
│   ├── index.astro          # Portuguese main page
│   ├── en/
│   │   └── index.astro     # English main page
│   ├── privacy.astro        # Privacy policy
│   └── terms.astro         # Terms of service
├── layouts/
│   └── MainLayout.astro     # Main layout component
└── styles/                 # CSS files

public/
├── assets/                 # Images and static assets
├── scripts/                # JavaScript files
├── locales/                # Translation files
└── robots.txt, sitemap.xml # SEO files

astro.config.mjs             # Astro configuration
package.json                # Updated dependencies
```

### Migration Checklist

- [x] Install Astro and dependencies
- [x] Create Astro project structure
- [x] Convert HTML pages to Astro components
- [x] Migrate TypeScript modules
- [x] Update build process
- [x] Update deployment configuration
- [x] Test functionality
- [x] Update documentation

### Next Steps (Phase 4)

1. **Performance Optimization**
   - Bundle analysis
   - Critical CSS implementation
   - Image optimization

2. **Monitoring**
   - Error tracking setup
   - Performance monitoring
   - Analytics integration

### Troubleshooting

#### Common Issues

1. **Path Resolution**: All static assets should be in `public/` and referenced with `/` prefix
2. **Module Imports**: Scripts work as ES modules with `.js` extensions
3. **TypeScript**: Auto-compiled by Astro, no separate build step needed

#### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Security Considerations

- CSP headers configured in `astro.config.mjs`
- DOMPurify still used for client-side sanitization
- No sensitive data in client-side code
- HTTPS enforced

---

**Migration completed on: February 12, 2026**  
**Framework**: Astro v5.17.2  
**Deployment**: Vercel