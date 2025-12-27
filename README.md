# LOFERSIL Landing Page

A modern, responsive landing page for LOFERSIL - built with TypeScript, HTML5, and modern CSS.

## 🚀 Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dual Language Support**: Portuguese/English language switching
- **Dark/Light Theme**: System preference detection with manual toggle
- **Contact Form**: Secure form submission with CSRF protection
- **Smooth Animations**: Optimized scroll effects and transitions
- **PWA Ready**: Service worker and offline support
- **SEO Optimized**: Meta tags, sitemap, and structured data
- **Performance**: Optimized for fast loading and Core Web Vitals

## 🛠️ Technology Stack

- **Frontend**: TypeScript, HTML5, CSS3
- **Build**: PostCSS, TSC, Vercel deployment
- **Security**: DOMPurify, CSRF protection
- **Icons**: SVG-based icon system
- **Fonts**: System font stack for performance

## 📁 Project Structure

```
src/
├── scripts/
│   ├── index.ts              # Main application entry point
│   ├── modules/             # Core JavaScript modules
│   │   ├── ContactFormManager.ts    # Form handling & validation
│   │   ├── EnvironmentLoader.ts     # Environment configuration
│   │   ├── ErrorManager.ts         # Error handling & display
│   │   ├── NavigationManager.ts    # Mobile menu & navigation
│   │   ├── ScrollManager.ts        # Smooth scrolling effects
│   │   ├── ThemeManager.ts         # Theme switching
│   │   ├── TranslationManager.ts   # Language support
│   │   ├── Utils.ts               # Utility functions
│   │   └── simpleLogger.ts        # Browser logging
│   ├── validation.ts        # Form validation schemas
│   └── types.ts            # TypeScript type definitions
├── styles/                 # CSS files with PostCSS
│   ├── base.css            # Base styles & resets
│   ├── main.css           # Compiled from all modules
│   ├── forms.css          # Contact form styling
│   ├── navigation.css     # Navigation & mobile menu
│   ├── hero.css          # Hero section styles
│   ├── sections.css       # Content sections
│   ├── privacy.css        # Privacy page styles
│   └── responsive.css     # Media queries & responsive
├── locales/               # Translation files
│   ├── en.json           # English translations
│   └── pt.json           # Portuguese translations
└── sw.js                # Service worker for PWA

api/                       # API endpoints (Node.js/Express)
├── contact.js            # Contact form submission
└── csrf-token.js         # CSRF token generation

assets/                     # Static assets
├── images/               # Product images and icons
└── offline.html          # PWA offline fallback
```

## 🚀 Deployment

### **Staging Deployment (Automatic)**

Push to `preview-deployment` branch:

```bash
git checkout preview-deployment
git add .
git commit -m "feat: update for staging deployment"
git push origin preview-deployment
```

This triggers automatic deployment to staging environment.

### **Production Deployment (Manual)**

Use GitHub Actions manual trigger:

1. Go to **Actions** → **Deploy to Vercel**
2. Click **Run workflow**
3. Select:
   - Environment: `production`
   - Branch: `preview-deployment` (default)
4. Click **Run workflow**

### **Rollback Procedure**

**Quick Rollback** (via Vercel Dashboard):

1. Go to Vercel project dashboard
2. Navigate to **Deployments**
3. Click **...** on previous deployment
4. Select **Promote to Production**

**Full Rollback** (via Git):

1. Switch to `master-clean` branch (stable rollback point)
2. Push to trigger redeployment:

```bash
git checkout master-clean
git push origin master-clean
```

## 🌐 Environment Variables

### **Required for Production:**

- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### **Contact Form:**

- `CONTACT_EMAIL`: Email for contact form submissions
- `CONTACT_SUBJECT`: Subject line for emails
- `RECAPTCHA_SECRET`: Optional reCAPTCHA secret key

### **Vercel Environment:**

Set via Vercel Dashboard → Project Settings → Environment Variables.

## 🧪 Local Development

### **Setup:**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Serve locally
npm run start
```

### **Development Scripts:**

- `npm run dev`: TypeScript watch mode
- `npm run build`: Full production build
- `npm run lint`: ESLint code checking
- `npm run format`: Prettier code formatting
- `npm start`: Serve built files locally

## 📊 Performance

### **Optimizations:**

- **Minimal Bundle**: Only essential JavaScript modules (~67KB)
- **Image Optimization**: WebP format, lazy loading
- **CSS Optimization**: PostCSS with minification
- **Critical CSS**: Inlined for faster render
- **Service Worker**: Offline caching strategy

### **Core Web Vitals:**

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

## 🔒 Security

### **Implemented:**

- **XSS Protection**: DOMPurify for content sanitization
- **CSRF Protection**: Token-based form validation
- **Content Security Policy**: Configured via headers
- **HTTPS Only**: All resources served over HTTPS
- **Secure Headers**: HSTS, X-Frame-Options, etc.

## 🌍 Languages

### **Supported Languages:**

- **Portuguese (pt)**: Default language
- **English (en)**: Secondary language

### **Adding Languages:**

1. Add translation file to `src/locales/`
2. Update `TranslationManager.ts` with new language code
3. Add language button to HTML navigation
4. Update language switching logic

## 🤝 Contributing

### **Development Workflow:**

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes
4. Run tests and linting: `npm run lint`
5. Commit with conventional commits: `git commit -m "feat: add feature"`
6. Push to fork: `git push origin feature/your-feature`
7. Create Pull Request to `preview-deployment`

### **Code Standards:**

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for best practices
- **Prettier**: Consistent code formatting
- **Conventional Commits**: `type(scope): description`

## 📱 Browser Support

### **Modern Browsers:**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Mobile Support:**

- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 15+

## 📄 Legal

- **Privacy Policy**: `/privacy.html`
- **Terms of Service**: `/terms.html`
- **Cookie Policy**: Documented in privacy policy

## 🚀 URLs

- **Production**: `https://lofersil-landing-page.vercel.app`
- **Staging**: `https://lofersil-landing-page-{preview-hash}.vercel.app`
- **Repository**: `https://github.com/SilentCaMXMF/LOFERSIL-Landing-Page`

## 📞 Support

For issues, questions, or support:

- **Email**: Contact via form on website
- **Issues**: Create GitHub issue
- **Documentation**: See this README and inline code comments

## 🏷️ Version

Current version: **1.0.0** - Production Ready

---

_Built with ❤️ for LOFERSIL_
