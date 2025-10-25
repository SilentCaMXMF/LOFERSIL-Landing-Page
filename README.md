# LOFERSIL Landing Page

A modern, static landing page built with vanilla TypeScript, optimized for performance and SEO. Deployed on Vercel with AI-assisted development using OpenCode agents.

## 🚀 Features

- **⚡ Fast & Modern**: Built with vanilla TypeScript for optimal performance
- **📱 Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **🔍 SEO Optimized**: Semantic HTML, meta tags, structured data, and sitemap
- **🤖 AI-Assisted Development**: Powered by OpenCode agents for rapid development
- **🎨 Modern UI**: Clean, professional design with smooth animations
- **🌐 Static Deployment**: Optimized for Vercel's global CDN
- **♿ Accessible**: WCAG compliant with proper ARIA labels and keyboard navigation

## 🛠️ Tech Stack

- **Frontend**: Vanilla TypeScript, HTML5, CSS3
- **Build Tools**: TypeScript Compiler, PostCSS, Terser
- **Development**: ESLint, Prettier, Live Server
- **Deployment**: Vercel (free tier)
- **AI Development**: OpenCode Agents
- **Performance**: Lighthouse CI, Image optimization

## 📦 Project Structure

```
lofersil-landing-page/
├── .opencode/          # OpenCode agent system
├── .github/           # GitHub workflows
├── src/               # Source files
│   ├── scripts/       # TypeScript source
│   ├── styles/        # CSS stylesheets
│   └── components/    # Reusable components
├── dist/              # Build output (generated)
├── assets/            # Static assets (images, fonts)
├── index.html         # Main HTML file
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lofersil-landing-page
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Development**

   ```bash
   # Start development server with live reload
   npm run dev

   # View the site at http://localhost:3000
   ```

4. **Build for production**

   ```bash
   # Create optimized production build
   npm run build

   # Preview production build
   npm start
   ```

### Deployment

**Deploy to Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or use the script
npm run vercel-deploy
```

**Manual Deployment**

```bash
# Build the project
npm run build

# Upload the dist/ folder to your hosting provider
```

## 🎯 Available Scripts

- `npm run dev` - Start development server with TypeScript watching
- `npm run build` - Create production build with minification
- `npm run start` - Preview production build locally
- `npm run lint` - Run ESLint on TypeScript files
- `npm run format` - Format code with Prettier
- `npm run lighthouse` - Run Lighthouse performance audit

## 🤖 OpenCode Integration

This project uses OpenCode agents for AI-assisted development. The `.opencode/` directory contains:

- **Agents**: Specialized AI workers for different tasks
- **Commands**: Slash commands for common operations
- **Context**: Knowledge base for consistent patterns
- **Plugins**: Extensions and integrations

### Using OpenCode Commands

```bash
# Create hero section component
/create-hero-section "Premium products showcase"

# Optimize for SEO
/optimize-seo

# Deploy to production
/deploy-landing
```

## 🎨 Customization

### Styling

- Main styles: `src/styles/main.css`
- CSS variables for easy theming
- Responsive design with mobile-first approach

### Content

- Update text and images in `index.html`
- Modify TypeScript functionality in `src/scripts/`
- Add new sections following the existing patterns

### SEO

- Update meta tags in `index.html`
- Modify sitemap generation in `build.js`
- Add structured data for better search visibility

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Development
NODE_ENV=development

# Production (set by Vercel automatically)
NODE_ENV=production
```

### Build Configuration

- TypeScript: `tsconfig.json`
- PostCSS: `postcss.config.js`
- Vercel: `vercel.json`

## 📊 Performance

The landing page is optimized for:

- **Fast loading**: Minified CSS/JS, optimized images
- **Core Web Vitals**: LCP, FID, CLS optimization
- **SEO**: Semantic HTML, meta tags, structured data
- **Accessibility**: WCAG 2.1 AA compliance

Run `npm run lighthouse` to audit performance.

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team

---

Built with ❤️ using vanilla TypeScript and OpenCode agents.
