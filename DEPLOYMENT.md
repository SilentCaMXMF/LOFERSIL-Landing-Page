# LOFERSIL Landing Page - Deployment Guide

## 🚀 Deployment Options

### 1. Vercel (Recommended)

#### Automatic Deployment (GitHub Integration)

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the settings

2. **Configure Environment Variables** (in Vercel Dashboard)

   ```
   NODE_ENV=production
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

3. **Automatic Deployments**
   - Push to `main` branch → Production deployment
   - Pull requests → Preview deployments

#### Manual Deployment (CLI)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
npm run vercel-deploy

# Or use the automated script
./vercel-deploy.sh
```

#### Local Development Deployment

```bash
# Deploy preview
npm run deploy:preview

# Deploy to production
npm run deploy:prod
```

### 2. Other Static Hosting

#### Netlify

```bash
# Build the project
npm run build

# Deploy dist/ folder to Netlify
# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages

```bash
# Build the project
npm run build

# Copy dist/ to docs/ for GitHub Pages
cp -r dist docs

# Push to gh-pages branch
git subtree push --prefix docs origin gh-pages
```

#### AWS S3 + CloudFront

```bash
# Build the project
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Configuration Files

### Vercel Configuration (`vercel.json`)

- **Static build**: Optimized for static sites
- **Routing**: SPA-friendly routing
- **Headers**: Security and caching headers
- **Regions**: Global CDN deployment

### Build Process

1. **Clean**: Remove previous build artifacts
2. **Install**: Install dependencies
3. **Lint**: Code quality checks
4. **Build**: Production build with minification
5. **Deploy**: Upload to Vercel CDN

### Environment Variables

| Variable            | Description             | Default       |
| ------------------- | ----------------------- | ------------- |
| `NODE_ENV`          | Build environment       | `development` |
| `VERCEL_ORG_ID`     | Vercel organization ID  | -             |
| `VERCEL_PROJECT_ID` | Vercel project ID       | -             |
| `VERCEL_TOKEN`      | Vercel deployment token | -             |

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Build completes successfully
- [ ] Environment variables configured
- [ ] SEO meta tags updated
- [ ] Performance optimized
- [ ] Security headers configured

### Post-Deployment

- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Forms and links work
- [ ] Mobile responsive
- [ ] SEO score checked
- [ ] Performance tested
- [ ] Analytics configured

## 🔍 Monitoring

### Vercel Dashboard

- **Analytics**: Page views, visitors, performance
- **Logs**: Real-time error tracking
- **Deployments**: Deployment history and rollbacks
- **Functions**: Serverless function monitoring

### Performance Monitoring

```bash
# Run Lighthouse audit
npm run lighthouse

# Check Core Web Vitals
# Use Chrome DevTools > Lighthouse
```

### SEO Monitoring

- **Google Search Console**: Search performance
- **Google PageSpeed Insights**: Performance scores
- **GTmetrix**: Detailed performance analysis

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Deployment Failures

```bash
# Check Vercel logs
vercel logs

# Check deployment status
vercel list
```

#### Performance Issues

- Check image optimization
- Verify minification
- Monitor Core Web Vitals
- Test on different devices

#### SEO Issues

- Verify meta tags
- Check sitemap.xml
- Test robots.txt
- Validate structured data

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://vercel.com/community)
- [GitHub Issues](https://github.com/vercel/vercel/issues)

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

- **Trigger**: Push to main, pull requests
- **Steps**: Build → Test → Deploy → Comment
- **Environments**: Production (main), Preview (PRs)
- **Secrets**: Vercel tokens and IDs

### Manual Triggers

```bash
# Trigger workflow manually
gh workflow run "Deploy to Vercel"
```

---

**Note**: This deployment guide is specifically configured for the LOFERSIL landing page with vanilla TypeScript and static site generation.
