# PRODUCTION DEPLOYMENT GUIDE - Gmail SMTP System

## 📋 OVERVIEW

This comprehensive guide provides step-by-step instructions for deploying the LOFERSIL Landing Page with Gmail SMTP system to Vercel production environment.

**Project:** LOFERSIL Landing Page  
**Gmail Account:** pedroocalado@gmail.com  
**Deployment Target:** Vercel Production  
**Last Updated:** 2025-12-10

---

## 🚀 QUICK START

### Prerequisites

- Node.js 22.x installed
- Vercel CLI installed and authenticated
- Gmail account with 2-Step Verification enabled
- App password generated for Gmail
- All environment variables configured

### One-Command Deployment

```bash
# Deploy to preview environment
npm run deploy:preview

# Deploy to production environment
npm run deploy:prod

# Automated deployment with verification
node scripts/deploy-to-vercel.js production
```

---

## 🔧 PRE-DEPLOYMENT SETUP

### 1. Gmail SMTP Configuration

#### Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Follow the setup process

#### Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** for app
3. Select **Other (Custom name)** and enter "LOFERSIL Landing Page"
4. Click **Generate**
5. Copy the 16-character password (save it securely!)

#### Configure Gmail Settings

1. Ensure **IMAP** is enabled in Gmail settings
2. Check that **Less secure apps** setting allows app passwords
3. Verify account is not blocked or suspended

### 2. Environment Variables Configuration

#### Create Production .env File

```bash
# Copy the example file
cp .env.example .env.production

# Edit with your actual values
nano .env.production
```

#### Required Environment Variables

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pedroocalado@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=noreply@lofersil.pt
TO_EMAIL=contact@lofersil.pt

# Production Environment
NODE_ENV=production
BASE_URL=https://lofersil.pt
API_BASE_URL=https://lofersil.pt/api

# Security Configuration
CSRF_SECRET=your-32+character-random-string
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=20
CONTACT_RATE_LIMIT_MAX=5

# Monitoring
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
ENABLE_PERFORMANCE_MONITORING=true
```

#### Generate CSRF Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

### 3. Vercel Configuration

#### Install Vercel CLI

```bash
# Install globally
npm i -g vercel

# Login to Vercel
vercel login
```

#### Configure Vercel Project

```bash
# Link to existing project or create new
vercel link

# Set environment variables in Vercel
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add FROM_EMAIL production
vercel env add TO_EMAIL production
vercel env add NODE_ENV production
vercel env add BASE_URL production
vercel env add CSRF_SECRET production
```

---

## 📝 STEP-BY-STEP DEPLOYMENT

### Step 1: Pre-Deployment Verification

#### Run Automated Verification

```bash
# Run comprehensive verification
node scripts/verify-production-deployment.js
```

#### Manual Checks

- [ ] All environment variables configured
- [ ] Gmail app password working
- [ ] Local tests passing
- [ ] Build process successful
- [ ] Security measures active

### Step 2: Build and Test Locally

#### Build Project

```bash
# Clean build
npm run build

# Test build output
npm run build-and-serve-8000
```

#### Run Tests

```bash
# Run all tests
npm run test:run

# Run coverage
npm run test:coverage

# Run specific tests
npm run test:unit
npm run test:integration
npm run test:e2e
```

#### Test Gmail SMTP Locally

```bash
# Test SMTP connection
node api/test-smtp.js

# Test email sending
SEND_TEST_EMAIL=true node api/contact.js
```

### Step 3: Deploy to Preview Environment

#### Automated Preview Deployment

```bash
# Deploy to preview with verification
node scripts/deploy-to-vercel.js preview
```

#### Manual Preview Deployment

```bash
# Deploy to preview
vercel

# Test preview deployment
# Visit the provided URL and test:
# - Main page loads
# - Contact form works
# - Health endpoints respond
```

### Step 4: Production Deployment

#### Automated Production Deployment

```bash
# Deploy to production with full verification
node scripts/deploy-to-vercel.js production
```

#### Manual Production Deployment

```bash
# Deploy to production
vercel --prod

# Verify production deployment
curl https://lofersil.pt/api/health
```

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### 1. Health Checks

#### Automated Health Check

```bash
# Check all health endpoints
curl https://lofersil.pt/api/health
curl https://lofersil.pt/api/metrics
```

#### Manual Testing Checklist

- [ ] Main page loads: https://lofersil.pt
- [ ] Contact form functional
- [ ] Email delivery working
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] Performance acceptable

### 2. Gmail SMTP Testing

#### Test Contact Form

1. Visit https://lofersil.pt
2. Fill out contact form with real data
3. Submit form
4. Check email receipt at contact@lofersil.pt
5. Verify email content and formatting

#### Test Error Scenarios

1. Invalid email format
2. Missing required fields
3. Very long message
4. Rapid form submissions (rate limiting)

### 3. Performance Monitoring

#### Check Performance Metrics

```bash
# Check performance endpoint
curl https://lofersil.pt/api/metrics
```

#### Browser Performance Testing

1. Open Chrome DevTools
2. Go to Network tab
3. Refresh page
4. Check load times:
   - First Contentful Paint: < 1.5s
   - Largest Contentful Paint: < 2.5s
   - Time to Interactive: < 3.5s

---

## 📊 MONITORING SETUP

### 1. Vercel Analytics

#### Enable Analytics

1. Go to Vercel dashboard
2. Select your project
3. Go to **Analytics** tab
4. Enable **Web Analytics**
5. Configure **Speed Insights**

#### Monitor Key Metrics

- Page views
- Unique visitors
- Web Vitals
- Error rates
- Performance scores

### 2. Gmail SMTP Monitoring

#### Set Up Email Monitoring

```bash
# Check email health endpoint
curl https://lofersil.pt/api/health/email
```

#### Monitor Gmail Quotas

- Daily email limit: 500 emails
- Monitor usage in Gmail settings
- Set up alerts for quota warnings

### 3. Custom Monitoring

#### Health Check Automation

```bash
# Add to cron job for monitoring
*/5 * * * * curl -f https://lofersil.pt/api/health || alert-admin
```

#### Performance Monitoring

- Response time monitoring
- Error rate tracking
- Memory usage monitoring
- Uptime monitoring

---

## 🛠️ TROUBLESHOOTING GUIDE

### Gmail SMTP Issues

#### Authentication Failed

**Symptoms:** 535-5.7.8 Username and Password not accepted

**Solutions:**

1. Verify 2-Step Verification is enabled
2. Generate new App Password
3. Check email address is correct
4. Ensure no spaces in app password

#### Connection Timeout

**Symptoms:** ETIMEDOUT or connection timeout errors

**Solutions:**

1. Check network connectivity
2. Verify firewall settings
3. Check Gmail service status
4. Increase timeout values

#### Quota Exceeded

**Symptoms:** Daily quota exceeded message

**Solutions:**

1. Monitor email usage
2. Implement rate limiting
3. Consider email service provider for high volume
4. Wait for quota reset (midnight PST)

### Vercel Deployment Issues

#### Build Failures

**Symptoms:** Build process fails during deployment

**Solutions:**

1. Check build logs in Vercel dashboard
2. Verify all dependencies installed
3. Check TypeScript compilation errors
4. Ensure build command works locally

#### Environment Variable Issues

**Symptoms:** Missing environment or configuration errors

**Solutions:**

1. Verify variables set in Vercel dashboard
2. Check variable names match exactly
3. Ensure no trailing spaces
4. Restart deployment after changes

#### Performance Issues

**Symptoms:** Slow page loads or timeouts

**Solutions:**

1. Check Vercel Analytics
2. Optimize images and assets
3. Enable caching headers
4. Review function cold starts

### General Issues

#### SSL Certificate Problems

**Symptoms:** HTTPS errors or certificate warnings

**Solutions:**

1. Verify domain DNS settings
2. Check SSL certificate in Vercel
3. Ensure domain properly configured
4. Clear browser cache

#### Contact Form Not Working

**Symptoms:** Form submission fails or no email received

**Solutions:**

1. Check API endpoint accessibility
2. Verify Gmail SMTP configuration
3. Check browser console for errors
4. Test with different browsers

---

## 📈 PERFORMANCE OPTIMIZATION

### 1. Vercel Optimizations

#### Edge Functions

- Contact form deployed as edge function
- Geographic distribution for better performance
- Automatic scaling based on demand

#### Caching Strategy

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Gmail SMTP Optimizations

#### Connection Pooling

- Reuse SMTP connections when possible
- Implement connection timeouts
- Use exponential backoff for retries

#### Email Optimization

- Optimize email templates for fast delivery
- Minimize email size
- Use appropriate content types

### 3. Frontend Optimizations

#### Image Optimization

- WebP format for modern browsers
- Responsive images with srcset
- Lazy loading for below-fold images

#### Code Optimization

- Minify JavaScript and CSS
- Remove unused code
- Optimize bundle size

---

## 🔒 SECURITY BEST PRACTICES

### 1. Gmail Security

#### App Password Management

- Use unique app password for each application
- Rotate app passwords regularly
- Never share app passwords
- Store securely in environment variables

#### Account Security

- Enable 2-Step Verification
- Monitor account activity
- Use strong, unique password
- Regular security checkups

### 2. Application Security

#### Environment Variables

- Never commit secrets to git
- Use Vercel environment variables
- Rotate secrets regularly
- Limit access to production secrets

#### Input Validation

- Sanitize all user inputs
- Validate email formats
- Implement rate limiting
- Use CSRF protection

### 3. Network Security

#### HTTPS Enforcement

- Force HTTPS redirects
- Use secure headers
- Implement HSTS
- Monitor SSL certificates

#### API Security

- Validate all API requests
- Implement rate limiting
- Use CORS properly
- Monitor for abuse

---

## 📋 MAINTENANCE CHECKLIST

### Daily

- [ ] Check error logs
- [ ] Monitor email delivery rates
- [ ] Review performance metrics
- [ ] Check uptime monitoring

### Weekly

- [ ] Review Gmail quota usage
- [ ] Check SSL certificate status
- [ ] Analyze traffic patterns
- [ ] Update dependencies

### Monthly

- [ ] Rotate app passwords
- [ ] Review security settings
- [ ] Performance audit
- [ ] Backup configuration

### Quarterly

- [ ] Security audit
- [ ] Performance optimization review
- [ ] Dependency updates
- [ ] Documentation updates

---

## 🚨 EMERGENCY PROCEDURES

### Gmail Account Compromised

1. Immediately change Gmail password
2. Revoke all app passwords
3. Generate new app password
4. Update environment variables
5. Monitor account activity

### Deployment Failure

1. Check Vercel build logs
2. Verify environment variables
3. Test locally with production config
4. Rollback to previous version if needed
5. Contact Vercel support if needed

### Email Delivery Issues

1. Check Gmail service status
2. Verify SMTP configuration
3. Test email sending manually
4. Check quota limits
5. Monitor error logs

### Performance Degradation

1. Check Vercel Analytics
2. Review recent changes
3. Monitor error rates
4. Check third-party service status
5. Implement emergency optimizations

---

## 📞 SUPPORT CONTACTS

### Technical Support

- **Vercel Support**: https://vercel.com/support
- **Gmail Support**: https://support.google.com/mail
- **Node.js Documentation**: https://nodejs.org/docs

### Emergency Contacts

- **DevOps Engineer**: [Contact Information]
- **Backend Developer**: [Contact Information]
- **System Administrator**: [Contact Information]

---

## 📚 ADDITIONAL RESOURCES

### Documentation

- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments)
- [Gmail SMTP Configuration](https://support.google.com/mail/answer/7126229)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Web Performance Optimization](https://web.dev/performance/)

### Tools

- [Vercel CLI](https://vercel.com/docs/cli)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)

### Monitoring

- [Vercel Analytics](https://vercel.com/docs/concepts/analytics)
- [Google Analytics](https://analytics.google.com)
- [Uptime Robot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)

---

**🎯 SUCCESS METRICS**

When your deployment is successful, you should see:

- ✅ All health checks passing
- ✅ Contact form working perfectly
- ✅ Email delivery successful
- ✅ Performance scores > 90
- ✅ Zero security vulnerabilities
- ✅ Uptime > 99.9%

**🚀 READY TO DEPLOY**: Follow this guide step-by-step for a successful production deployment of your Gmail SMTP system on Vercel.
