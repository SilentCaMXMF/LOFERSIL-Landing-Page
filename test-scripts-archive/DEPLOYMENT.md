# LOFERSIL Landing Page - Deployment Guide

## 🎯 Deployment Strategy

This guide covers the complete deployment process for LOFERSIL landing page using a **staging → production** workflow.

---

## 📋 Prerequisites

### **Required Secrets (GitHub)**

Set in GitHub Repository → Settings → Secrets and variables → Actions:

- `VERCEL_TOKEN`: Vercel personal access token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### **Environment Variables (Vercel)**

Set in Vercel Dashboard → Project → Settings → Environment Variables:

- `CONTACT_EMAIL`: Email address for form submissions
- `CONTACT_SUBJECT`: Default subject for contact emails
- `RECAPTCHA_SECRET`: Optional reCAPTCHA secret key

---

## 🚀 Deployment Process

### **Option 1: Staging Deployment (Automatic)**

**Trigger:** Push to `preview-deployment` branch

```bash
# Switch to preview branch
git checkout preview-deployment

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: update landing page content"

# Push to trigger automatic staging deployment
git push origin preview-deployment
```

**Result:**

- Automatic GitHub Actions workflow runs
- Deploys to Vercel staging environment
- URL: `https://lofersil-landing-page-{commit-hash}.vercel.app`
- GitHub Actions provides staging URL in summary

### **Option 2: Production Deployment (Manual)**

**Trigger:** GitHub Actions manual workflow

**Steps:**

1. Go to **GitHub Repository** → **Actions** tab
2. Select **"Deploy to Vercel"** workflow
3. Click **"Run workflow"** button
4. Configure workflow inputs:
   - **Environment**: `production`
   - **Branch**: `preview-deployment` (default)
5. Click **"Run workflow"** to start deployment

**Result:**

- Manual GitHub Actions workflow runs
- Deploys to Vercel production environment
- URL: `https://lofersil-landing-page.vercel.app`
- GitHub Actions provides production URL in summary

---

## 🔄 Rollback Procedures

### **Quick Rollback (Vercel Dashboard)**

**When to use:** Immediate rollback needed, < 5 minutes

**Steps:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **LOFERSIL Landing Page** project
3. Click **"Deployments"** tab
4. Find previous stable deployment
5. Click **"..."** menu on that deployment
6. Select **"Promote to Production"**

**Time:** < 2 minutes

### **Full Rollback (Git-based)**

**When to use:** Complete rollback to last known good state

**Steps:**

```bash
# Switch to rollback branch (stable state)
git checkout master-clean

# Push to trigger redeployment
git push origin master-clean
```

**Alternative Rollback:**

```bash
# Reset preview-deployment to stable state
git checkout preview-deployment
git reset --hard master-clean
git push --force-with-lease origin preview-deployment
```

**Time:** 5-10 minutes (includes build and deploy)

---

## 📊 Deployment Verification

### **Staging Verification Checklist**

After staging deployment:

- [ ] Page loads without errors
- [ ] All images display correctly
- [ ] Contact form functions (test submission)
- [ ] Theme switching works (light/dark)
- [ ] Language switching works (PT/EN)
- [ ] Mobile navigation functions
- [ ] No console errors in browser
- [ ] Responsive design on mobile devices
- [ ] SEO meta tags present

### **Production Verification Checklist**

After production deployment:

- [ ] All staging checks passed
- [ ] Production URL accessible
- [ ] SSL certificate valid (HTTPS)
- [ ] Core Web Vitals scores acceptable
- [ ] Form submissions receive emails
- [ ] Analytics tracking (if implemented)

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Build Fails**

```bash
# Check locally
npm run build

# Check for TypeScript errors
npm run lint

# Verify dependencies
npm ci
```

#### **Deployment Fails**

- Check GitHub Actions logs
- Verify Vercel secrets are correct
- Check Vercel environment variables
- Verify Vercel project settings

#### **Contact Form Issues**

- Verify `CONTACT_EMAIL` environment variable
- Check Vercel Function logs
- Test email delivery separately
- Verify CORS settings if using external APIs

#### **Asset Loading Issues**

- Check file paths in HTML
- Verify assets copied to dist directory
- Check Vercel deployment logs
- Verify file case sensitivity

### **Debug Commands**

```bash
# Check build output
ls -la dist/
cat dist/index.html | head -20

# Test locally
npm run build
npm start
# Visit http://localhost:3000

# Check TypeScript compilation
npx tsc --noEmit
```

---

## 📈 Performance Monitoring

### **Core Web Vitals Targets**

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### **Monitoring Tools**

- **Google PageSpeed Insights**: [pagespeed.web.dev](https://pagespeed.web.dev)
- **Lighthouse**: Chrome DevTools → Lighthouse
- **Vercel Analytics**: Vercel Dashboard → Analytics

---

## 🔄 Maintenance

### **Regular Tasks**

**Weekly:**

- Check deployment status
- Monitor Core Web Vitals
- Review error logs
- Update dependencies if needed

**Monthly:**

- SSL certificate renewal (automatic with Vercel)
- Security audit of dependencies
- Performance optimization review

### **Update Process**

```bash
# Update dependencies
npm update

# Test updates locally
npm run build
npm start

# Deploy staging first
git checkout preview-deployment
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin preview-deployment

# After staging verification, deploy to production
# Use GitHub Actions manual workflow
```

---

## 📞 Support

### **For Deployment Issues:**

1. **Check GitHub Actions**: Repository → Actions → Select workflow run
2. **Check Vercel Dashboard**: Deployments tab for error logs
3. **Check this Guide**: Review troubleshooting steps
4. **Contact Team**: Create GitHub issue with deployment details

### **Include in Support Request:**

- Branch being deployed
- GitHub Actions run ID
- Error messages (screenshot preferred)
- Steps taken so far
- Expected vs actual behavior

---

## 📚 Additional Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Actions**: [docs.github.com/actions](https://docs.github.com/actions)
- **Project Repository**: [GitHub](https://github.com/SilentCaMXMF/LOFERSIL-Landing-Page)

---

_Last Updated: December 2024_
