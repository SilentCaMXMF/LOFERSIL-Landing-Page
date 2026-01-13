# LOFERSIL Landing Page

A modern, responsive static landing page for LOFERSIL - built with TypeScript, HTML5, and modern CSS.

## Features

- **Dual Language Support**: Portuguese/English language switching
- **Dark/Light Theme**: System preference detection with manual toggle
- **Contact Form**: Secure form submission via Formspree
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Optimized scroll effects and transitions
- **Mobile Navigation**: Hamburger menu for mobile devices

## Tech Stack

- **TypeScript** (relaxed mode)
- **HTML5, CSS3**
- **Formspree** (contact form)
- **DOMPurify** (XSS protection)

## Project Structure

```
lofersil-landing-page/
├── src/
│   ├── scripts/        # TypeScript source
│   ├── styles/         # CSS files
│   └── locales/        # Translation files (en.json, pt.json)
├── assets/
│   └── images/        # Images and favicons
├── index.html          # Main landing page
├── privacy.html        # Privacy policy
├── terms.html          # Terms of service
├── robots.txt         # SEO
├── sitemap.xml        # SEO
├── site.webmanifest   # PWA manifest (optional)
└── package.json       # Dependencies and scripts
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

- Compiles TypeScript to JavaScript
- Compiles CSS with PostCSS
- Copies all assets to `dist/`

## Deployment to Vercel

### Automatic Deployment

1. Push to `main` branch
2. GitHub Actions workflow triggers automatically
3. Deploys to Vercel production

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

## License

MIT License
