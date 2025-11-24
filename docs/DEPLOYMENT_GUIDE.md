# LOFERSIL Landing Page - Deployment Guide

This guide covers the complete deployment process for the LOFERSIL Landing Page to Vercel.

## Overview

The LOFERSIL Landing Page uses a modern deployment pipeline with:

- **Static Site Generation**: TypeScript + PostCSS build process
- **Serverless Functions**: Contact form and environment testing APIs
- **CI/CD**: GitHub Actions for automated deployments
- **Platform**: Vercel for hosting and deployment

## Prerequisites

### Required Accounts & Tools

- GitHub repository access
- Vercel account with project setup
- Node.js 18+ installed locally
- Git configured

### Required Secrets

Set these in GitHub repository secrets:

- `VERCEL_TOKEN`: Vercel personal access token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

Set these in Vercel environment variables:

- `NODE_ENV=production`
- `WEBSITE_URL=https://lofersil.pt`
- Email configuration (SMTP settings)
- Analytics IDs (optional)

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/LOFERSIL-Landing-Page.git
cd LOFERSIL-Landing-Page
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your local development values
```

### 4. Development Server

```bash
npm run dev
```

### 5. Local Build Test

```bash
npm run build        # Development build
npm run build:prod   # Production build
```

## Deployment Process

### Automatic Deployment (Recommended)

#### Main Branch Deployment

1. Push to `main` or `master` branch
2. GitHub Actions triggers automatically
3. Production build is created
4. Deployed to Vercel production environment

#### Preview Deployment

1. Push to `preview-deployment` branch
2. Create pull request to main
3. Preview build is created
4. Deployed to Vercel preview environment

### Manual Deployment

#### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
npm run build:prod
vercel --prod

# Deploy to preview
npm run build
vercel
```

#### Using GitHub Actions

```bash
# Trigger workflow manually
gh workflow run "Deploy to Vercel"
```

## Build Process Details

### Development Build (`npm run build`)

- TypeScript compilation with source maps
- PostCSS processing without minification
- All static files copied to `dist/`
- Source maps included for debugging

### Production Build (`npm run build:prod`)

- TypeScript compilation without source maps
- PostCSS processing with minification
- Comments removed
- Optimized for production deployment

### Build Scripts

- `build:clean` - Clean dist directory
- `build:ts` - Compile TypeScript
- `build:ts:prod` - Compile TypeScript for production
- `build:css` - Process CSS with PostCSS
- `build:static` - Copy static files
- `build:assets` - Copy assets directory

## File Structure After Build

```
dist/
├── api/                    # Serverless functions
│   ├── contact.js          # Contact form API
│   └── test-env.js        # Environment test API
├── assets/                 # Static assets
│   └── images/            # Image files
├── src/                   # Compiled TypeScript
│   └── scripts/           # JavaScript modules
├── index.html             # Main HTML
├── privacy.html            # Privacy policy
├── terms.html             # Terms and conditions
├── main.css               # Processed CSS
├── site.webmanifest        # PWA manifest
├── robots.txt             # SEO robots file
├── sitemap.xml            # SEO sitemap
├── dompurify.min.js       # XSS protection
└── favicon.svg            # Site favicon
```

## Environment Variables

### Required for Production

- `NODE_ENV=production`
- `WEBSITE_URL=https://lofersil.pt`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CONTACT_EMAIL`
- `CORS_ORIGIN=https://lofersil.pt`

### Optional

- `GOOGLE_ANALYTICS_ID`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ENABLE_MCP_INTEGRATION`

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete details.

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build:prod
```

#### TypeScript Errors

```bash
# Check TypeScript configuration
npm run build:ts:prod -- --listFiles

# Verify types
npx tsc --noEmit
```

#### PostCSS Issues

```bash
# Test PostCSS configuration
npx postcss src/styles/main.css -o test.css

# Check autoprefixer
npx autoprefixer --info
```

#### Deployment Failures

1. **Check GitHub Actions logs**
2. **Verify Vercel secrets**
3. **Check environment variables**
4. **Validate build output**

#### API Function Issues

```bash
# Test environment variables
curl https://lofersil.pt/api/test-env

# Test contact form
curl -X POST https://lofersil.pt/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### Debugging Steps

#### 1. Local Build Test

```bash
npm run build:prod
ls -la dist/
```

#### 2. Environment Check

```bash
# Check current environment
echo $NODE_ENV
npm run build:prod
```

#### 3. Vercel Logs

1. Go to Vercel dashboard
2. Select project
3. View "Functions" tab
4. Check function logs

#### 4. GitHub Actions Debug

1. Go to repository "Actions" tab
2. Click on failed workflow run
3. Review each step's output
4. Check for error messages

### Performance Issues

#### Build Optimization

- Use `npm run build:prod` for production
- Verify CSS minification is working
- Check asset optimization

#### Runtime Performance

- Monitor Vercel Analytics
- Check Core Web Vitals
- Verify caching headers

### Security Issues

#### Environment Variables

- Never commit `.env.local`
- Use Vercel encrypted variables
- Rotate API keys regularly

#### Content Security

- Verify CORS settings
- Check rate limiting
- Monitor XSS protection

## Monitoring and Maintenance

### Deployment Monitoring

- GitHub Actions workflow status
- Vercel deployment logs
- Website uptime monitoring

### Performance Monitoring

- Vercel Analytics
- Google Analytics (if configured)
- Core Web Vitals

### Security Monitoring

- Vercel security headers
- API rate limiting
- Environment variable audits

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous deployment
vercel rollback [deployment-url]

# Or redeploy previous commit
git checkout [previous-commit]
git push origin main
```

### Emergency Rollback

1. Go to Vercel dashboard
2. Select "Deployments" tab
3. Click "..." on previous deployment
4. Select "Promote to Production"

## Support

### Documentation

- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

### Contact

- Technical issues: Create GitHub issue
- Deployment emergencies: Contact DevOps team
- General questions: Team communication channel

---

**Last Updated**: November 24, 2025
**Version**: 1.0.0
