# LOFERSIL Landing Page

A modern, responsive static landing page for LOFERSIL - built with TypeScript, HTML5, and modern CSS.

## Features

- **Dual Language Support**: Portuguese/English language switching
- **Dark/Light Theme**: System preference detection with manual toggle
- **Contact Form**: Secure form submission via Formspree
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Optimized scroll effects and transitions
- **Mobile Navigation**: Hamburger menu with proper scroll behavior
- **SEO Optimized**: Google Search Console verification for both domains
- **Modern Build Pipeline**: TypeScript + PostCSS + Vercel deployment

## Tech Stack

- **TypeScript** (relaxed mode, ES2020 target)
- **HTML5, CSS3** (PostCSS + Autoprefixer)
- **Formspree** (contact form)
- **DOMPurify** (XSS protection)
- **ESLint + Prettier** (code quality)
- **PostCSS + CSSnano** (CSS optimization)

## Project Structure

```
lofersil-landing-page/
├── src/
│   ├── scripts/        # TypeScript source (modules in subdirectories)
│   ├── styles/         # CSS files (PostCSS processing)
│   └── locales/        # Translation files (en.json, pt.json)
├── assets/
│   └── images/        # Images and favicons
├── en/                # English HTML pages
├── .github/workflows/ # GitHub Actions deployment
├── dist/              # Build output (generated)
├── index.html         # Main landing page
├── privacy.html       # Privacy policy
├── terms.html         # Terms of service
├── robots.txt        # SEO
├── sitemap.xml       # SEO
├── site.webmanifest  # PWA manifest
├── AGENTS.md         # Development guidelines
└── package.json      # Dependencies and scripts
```

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode (watch TypeScript)
npm run dev

# Serve locally (after build)
npm start

# Lint code
npm run lint

# Format code
npm run format
```

## Build Process

Single command builds everything:

```bash
npm run build
```

This command:

1. **Format code** with Prettier
2. **Compile TypeScript** to JavaScript (ES2020)
3. **Process CSS** with PostCSS + Autoprefixer
4. **Copy assets** to `dist/` directory
5. **Minify output** with CSSnano

### Build Scripts

- `npm run build:compile` - TypeScript compilation only
- `npm run build:css` - CSS processing only
- `npm run build:copy` - Asset copying only
- `npm run dev` - Watch TypeScript changes

## Deployment to Vercel

### Automatic Deployment

1. Push to `master` branch
2. GitHub Actions workflow triggers automatically
3. Deploys to Vercel production at `lofersil.vercel.app`

### Manual Deployment

1. Build project: `npm run build`
2. Deploy via Vercel CLI or dashboard
3. Configure secrets in Vercel settings

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
- Email: pedroocalado@gmail.com
- Domain: `lofersil.vercel.app` (migrated from lofersil.pt)

## Environment Variables (Vercel)

Required for deployment:

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Code Quality & Style

- **ESLint**: Linting with relaxed TypeScript rules
- **Prettier**: Code formatting for consistency
- **TypeScript**: Relaxed mode (strict: false) for flexibility
- **Git Hooks**: Pre-commit formatting enforced

## Security

- **XSS Protection**: DOMPurify sanitization
- **HTTPS Required**: Production deployments force HTTPS
- **Input Validation**: Client-side form validation
- **CSP Ready**: Content Security Policy headers available

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License
