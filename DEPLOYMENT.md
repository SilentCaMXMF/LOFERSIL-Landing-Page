# Deployment Guide - LOFERSIL Landing Page

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Platform-Specific Deployment](#platform-specific-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Domain & SSL Setup](#domain--ssl-setup)
5. [Performance Optimization](#performance-optimization)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## 🎯 Prerequisites

### System Requirements
- **Node.js**: 22.x or later
- **npm**: 10.x or later
- **Git**: For version control
- **Vercel Account**: For automated deployment

### Build Dependencies
All dependencies are automatically installed with:
```bash
npm install
```

### Build Tools
The project uses these build tools:
- **Astro 5.17.2**: Static site generation
- **TypeScript 5.0**: Type checking and compilation
- **PostCSS**: CSS processing and optimization
- **ESLint + Prettier**: Code quality

## 🌐 Platform-Specific Deployment

### Vercel (Recommended)

#### Automatic Deployment (Recommended)
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Custom domain setup
vercel --prod --domains lofersil.vercel.app
```

#### Project Configuration
The `vercel.json` is pre-configured:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "cleanUrls": true,
  "trailingSlash": false
}
```

#### Vercel Dashboard Steps
1. **Connect Repository**: Import from GitHub
2. **Configure Domain**: Set `lofersil.vercel.app` or custom domain
3. **Environment Variables**: Set any required environment variables
4. **Deploy**: Automatic deployment on git push

### Netlify

#### Manual Setup
```bash
# Build project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### Netlify Configuration
Create `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "22"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### GitHub Pages

#### Manual Setup
```bash
# Build and deploy
npm run build
cd dist
git init
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main:gh-pages --force
```

#### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '22'

    - name: Install dependencies
      run: npm install

    - name: Build
      run: npm run build

    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### AWS S3 + CloudFront

#### Prerequisites
- AWS CLI configured
- S3 bucket created
- CloudFront distribution set up

#### Deployment Script
```bash
#!/bin/bash

# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR-DISTRIBUTION-ID --paths "/*"
```

## 🔧 Environment Configuration

### Required Variables

#### For Production
```bash
# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_API_KEY=

# Error tracking (optional)
VITE_ERROR_ENDPOINT=
VITE_ERROR_API_KEY=
```

### Configuration Files

#### Astro Configuration (`astro.config.mjs`)
- Static output configured for optimal performance
- CSP headers for security
- Image optimization settings
- Bundle analysis support

## 📊 Monitoring & Maintenance

### Performance Monitoring

#### Built-in Monitoring
- **Web Vitals**: Automatic tracking
- **Error Tracking**: Real-time error reporting
- **Analytics Dashboard**: `/performance` endpoint
- **Bundle Analysis**: `npm run build:analyze`

### Maintenance Checklist

#### Regular Tasks
- [ ] **Weekly**: Check bundle size and performance
- [ ] **Monthly**: Update dependencies, review security
- [ ] **Quarterly**: Full performance audit, update documentation
- [ ] **Annually**: Major framework update consideration

---

**Last Updated**: February 12, 2026  
**Framework**: Astro 5.17.2  
**Node Version**: 22.x  
**Target Platform**: Vercel (production ready)