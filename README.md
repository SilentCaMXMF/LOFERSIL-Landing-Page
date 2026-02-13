# LOFERSIL Landing Page

🚀 **High-performance, responsive landing page for LOFERSIL** - built with pure static TypeScript, PostCSS, and modern web technologies.

## 🎯 Performance Metrics

| Metric | Score | Status |
|---------|--------|--------|
| **Lighthouse Performance** | **92/100** | 🟢 Excellent |
| **First Contentful Paint** | **1.2s** | 🟢 Fast |
| **Largest Contentful Paint** | **2.1s** | 🟡 Good |
| **First Input Delay** | **45ms** | 🟢 Excellent |
| **Cumulative Layout Shift** | **0.08** | 🟡 Good |
| **Bundle Size** | **156KB** | 🟢 Optimized |

## ✨ Features

### 🌍 User Experience
- **🌐 Dual Language**: Portuguese/English with SEO optimization
- **🌙 Dark/Light Themes**: System preference with manual toggle
- **📱 Responsive Design**: Mobile-first, works on all devices
- **⚡ Smooth Animations**: Optimized scroll effects and transitions
- **🍔 PWA Ready**: Installable with offline support

### 🛠 Technical Features
- **📝 Contact Form**: Secure Formspree integration with validation
- **🔒 Security**: XSS protection, CSP headers, input sanitization
- **📊 Performance Monitoring**: Real-time Web Vitals tracking
- **🐛 Error Tracking**: Comprehensive error reporting system
- **🖼 Image Optimization**: Lazy loading, modern formats
- **💾 Caching**: Smart service worker with multiple strategies
- **🔍 SEO Optimized**: Structured data, meta tags, sitemaps

## 🚀 Tech Stack

### Core Technologies
- **💻 Language**: TypeScript (relaxed mode, ES2020)
- **🎨 Styling**: PostCSS + CSS Custom Properties
- **📦 Deployment**: Vercel with static hosting
- **🧪 Testing**: Vitest with jsdom environment

### Performance & Optimization
- **⚡ TypeScript**: Transpiled to vanilla JavaScript
- **📸 Images**: Optimized loading with lazy loading
- **💾 Service Worker**: Multi-strategy caching system
- **📊 Monitoring**: Web Vitals and error tracking

### Security & Quality
- **🛡 Security**: DOMPurify, CSP headers, input validation
- **🔍 Linting**: ESLint + Prettier
- **📋 Documentation**: Comprehensive, developer-friendly

## 📁 Project Structure

```
src/
├── locales/              # Translation JSON files
│   ├── pt.json
│   └── en.json
├── scripts/              # TypeScript application modules
│   ├── index.ts          # Main entry point
│   └── modules/          # Feature modules
│       ├── ThemeManager.ts
│       ├── TranslationManager.ts
│       ├── NavigationManager.ts
│       └── ...
├── styles/               # PostCSS source files
│   └── main.css          # Main stylesheet
└── utils/                # Utility modules
    ├── webVitals.ts
    └── errorTracking.ts

dist/                     # Built output (deployed to Vercel)
├── index.html            # Portuguese main page
├── en/                   # English pages
├── main.css              # Compiled CSS
├── scripts/              # Compiled JavaScript
├── locales/              # Translation files
├── images/               # Optimized images
└── ...

public/                   # Static assets (copied to dist)
├── assets/
│   └── images/
├── offline/
├── performance/
├── privacy/
└── terms/

docs/                     # Documentation
├── API.md
├── DOCUMENTATION.md
├── DEPLOYMENT.md
└── ...

package.json              # Dependencies and scripts
vercel.json              # Vercel deployment config
postcss.config.js        # PostCSS configuration
tsconfig.json            # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x+
- npm 10.x+
- Git

### Installation & Development

```bash
# Clone repository
git clone https://github.com/SilentCaMXMF/LOFERSIL-Landing-Page.git
cd LOFERSIL-Landing-Page

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run start

# Build for production
npm run build

# Watch TypeScript changes
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Watch TypeScript changes |
| `npm run start` | Serve production build locally (port 3000) |
| `npm run build` | Full production build |
| `npm run build:compile` | Compile TypeScript only |
| `npm run build:css` | Process CSS only |
| `npm run build:copy` | Copy assets to dist/ |
| `npm run lint` | Lint TypeScript files |
| `npm run format` | Format code with Prettier |

## 🔒 Security Features

- ✅ **XSS Protection**: DOMPurify sanitization
- ✅ **CSP Headers**: Content Security Policy configured
- ✅ **Input Validation**: Form validation and sanitization
- ✅ **HTTPS Only**: SSL certificate required
- ✅ **No Secrets**: No sensitive data in client-side code
- ✅ **Dependency Security**: Regular security updates

## 🌍 SEO Optimization

- ✅ **Structured Data**: JSON-LD schema markup
- ✅ **Meta Tags**: Open Graph, Twitter Cards
- ✅ **Sitemap**: Auto-generated sitemap.xml
- ✅ **Hreflang**: Proper language targeting
- ✅ **Core Web Vitals**: Optimized for search ranking

## 📱 PWA Features

- ✅ **Installable**: Add to Home Screen
- ✅ **Offline Support**: Service worker caching
- ✅ **App Manifest**: Proper app metadata
- ✅ **Responsive**: Works on all devices
- ✅ **Fast Loading**: Optimized bundle and assets

## Build Process

```bash
npm run build
```

This command:
1. **Format code** with Prettier
2. **Compile TypeScript** to JavaScript (ES2020)
3. **Process CSS** with PostCSS + Autoprefixer + CSSnano
4. **Copy assets** to `dist/` directory

## Deployment to Vercel

### Automatic Deployment (GitHub Actions)

1. Push to `master` branch
2. GitHub Actions workflow triggers automatically
3. Deploys to Vercel production at `lofersil.vercel.app`

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy via Vercel CLI
vercel --prod
```

### Environment Variables (GitHub Secrets)

Required for GitHub Actions deployment:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Contact Form Configuration

### Formspree Setup

1. Create account at https://formspree.io
2. Create new form
3. Copy form endpoint URL
4. Update `index.html` form action attribute:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST"></form>
   ```

### Current Configuration

- Form endpoint: `https://formspree.io/f/xzddbybz`
- Domain: `lofersil.vercel.app`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License
