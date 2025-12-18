# Production Deployment Guide

This guide provides comprehensive instructions for deploying the LOFERSIL Landing Page to production environments, including security hardening, performance monitoring, and troubleshooting procedures.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Methods](#deployment-methods)
- [Security Hardening](#security-hardening)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)
- [Maintenance Procedures](#maintenance-procedures)

## Prerequisites

### System Requirements

- **Node.js**: Version 20.x (matches Vercel runtime)
- **npm**: Version 10.0.0 or higher
- **Git**: For version control and deployment
- **Vercel Account**: For hosting and deployment

### Required Accounts and Services

1. **Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Create a new project for the landing page

2. **GitHub Repository**
   - Repository must contain the project code
   - GitHub Actions enabled for CI/CD

3. **Environment Variables**
   - `VERCEL_TOKEN`: Personal access token from Vercel
   - `VERCEL_ORG_ID`: Organization ID from Vercel dashboard
   - `VERCEL_PROJECT_ID`: Project ID from Vercel dashboard

### Email Service Configuration (Optional)

For contact form functionality:
- SMTP server credentials
- Email service provider (Gmail, SendGrid, etc.)
- Rate limiting configuration

## Environment Setup

### 1. Local Development Environment

```bash
# Clone the repository
git clone https://github.com/your-org/lofersil-landing-page.git
cd lofersil-landing-page

# Install dependencies
npm ci

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Verify setup
npm run build
npm run test
```

### 2. Vercel Project Configuration

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

### 3. Environment Variables in Vercel

Set the following environment variables in your Vercel dashboard:

```
NODE_ENV=production
VERCEL_ENV=production
# Email configuration (if using contact forms)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-smtp-password
# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=5
```

## Deployment Methods

### Method 1: Automated CI/CD (Recommended)

The project includes GitHub Actions for automated deployment:

#### GitHub Secrets Setup

In your GitHub repository settings, add these secrets:

- `VERCEL_TOKEN`: Your Vercel personal access token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `GITHUB_TOKEN`: Automatically provided by GitHub

#### Deployment Triggers

- **Production Deployment**: Push to `main` or `master` branch
- **Preview Deployment**: Push to any other branch or create a pull request

#### Monitoring Deployment

Check deployment status in:
- GitHub Actions tab in your repository
- Vercel dashboard
- Deployment logs for detailed output

### Method 2: Manual Deployment via Vercel CLI

```bash
# Deploy to production
npm run deploy:prod

# Deploy to preview environment
npm run deploy:preview
```

### Method 3: Direct Vercel Deployment

```bash
# Build the project
npm run build:prod

# Deploy using Vercel CLI
vercel --prod
```

## Security Hardening

The application includes multiple security layers configured in `vercel.json`:

### Content Security Policy (CSP)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.lofersil.pt; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

### HTTP Security Headers

- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload`

### API Security

- **CORS Configuration**: Restricted to allowed origins
- **Rate Limiting**: Configured via environment variables
- **CSRF Protection**: Token-based validation for forms
- **Input Validation**: Joi schema validation for API endpoints

### Additional Security Measures

1. **Dependency Security**
   ```bash
   # Audit dependencies
   npm audit

   # Update dependencies
   npm update

   # Check for security vulnerabilities
   npm audit fix
   ```

2. **Environment Variable Security**
   - Never commit secrets to version control
   - Use Vercel's encrypted environment variables
   - Rotate credentials regularly

3. **Access Control**
   - Restrict Vercel project access to authorized team members
   - Use GitHub branch protection rules
   - Enable two-factor authentication for all accounts

## Performance Monitoring

The application includes comprehensive monitoring capabilities:

### Built-in Monitoring Endpoints

#### Health Check
```bash
curl https://your-domain.com/api/health
```

#### Metrics Collection
```bash
curl https://your-domain.com/api/metrics
```

#### Email Metrics
```bash
curl https://your-domain.com/api/monitoring/email-metrics
```

#### Alerts Management
```bash
curl https://your-domain.com/api/monitoring/alerts
```

### Performance Metrics Tracked

- **Response Times**: API endpoint performance
- **Error Rates**: Application error tracking
- **Memory Usage**: Server resource monitoring
- **Email Delivery**: SMTP success/failure rates
- **Security Events**: Intrusion detection alerts

### Monitoring Dashboard

Access monitoring data via:
```bash
# Get comprehensive metrics
curl "https://your-domain.com/api/monitoring/email-metrics?aggregate=true&trends=true&health=true&alerts=true"
```

### Alert Configuration

Default alert rules include:
- High error rate (>10% in 1 hour)
- Slow response time (>3 seconds average)
- SMTP connection failures
- Email delivery failure (>10% failure rate)
- High memory usage (>80%)
- Security events detected

### External Monitoring Integration

Consider integrating with:
- **Google Analytics**: User behavior tracking
- **Vercel Analytics**: Platform-specific metrics
- **Uptime monitoring services**: External health checks
- **Log aggregation services**: Centralized logging

## Troubleshooting

### Common Deployment Issues

#### Build Failures

**Symptom**: Build fails during CI/CD
```bash
# Check build logs in GitHub Actions
# Or run locally for debugging
npm run build:prod
```

**Solutions**:
- Verify Node.js version matches Vercel runtime (20.x)
- Check for missing dependencies
- Validate TypeScript compilation
- Ensure all required environment variables are set

#### Environment Variable Issues

**Symptom**: Application fails to start or features don't work
```bash
# Check Vercel environment variables
vercel env ls

# Validate environment setup
npm run test:env
```

#### API Endpoint Failures

**Symptom**: 500 errors on API calls
```bash
# Check API health
curl https://your-domain.com/api/health

# Check error logs in Vercel dashboard
```

### Performance Issues

#### Slow Page Loads

**Diagnosis**:
```bash
# Check Lighthouse scores
npm run lighthouse

# Monitor Core Web Vitals
curl https://your-domain.com/api/metrics
```

**Solutions**:
- Optimize images using `npm run optimize-images`
- Enable Vercel Edge Network
- Review and optimize CSS/JS bundles
- Implement proper caching headers

#### High Memory Usage

**Diagnosis**:
```bash
# Check memory metrics
curl "https://your-domain.com/api/monitoring/email-metrics?health=true"
```

**Solutions**:
- Review serverless function memory allocation
- Optimize code for serverless environment
- Implement proper error handling
- Monitor for memory leaks

### Email Delivery Issues

#### SMTP Connection Failures

**Diagnosis**:
```bash
# Check SMTP health
curl "https://your-domain.com/api/monitoring/email-metrics?health=true"

# Test SMTP connection
npm run test:smtp
```

**Solutions**:
- Verify SMTP credentials
- Check firewall/network restrictions
- Implement retry logic
- Use alternative SMTP providers

#### High Bounce Rates

**Diagnosis**:
```bash
# Check delivery metrics
curl https://your-domain.com/api/monitoring/email-metrics
```

**Solutions**:
- Validate email addresses
- Check sender reputation
- Implement email validation
- Monitor for spam complaints

### Security Incidents

#### Detecting Security Issues

```bash
# Check security alerts
curl "https://your-domain.com/api/monitoring/alerts?type=SECURITY"
```

**Response Procedures**:
1. Isolate affected systems
2. Review access logs
3. Update security configurations
4. Notify relevant stakeholders
5. Implement fixes and patches

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
```bash
# Update dependencies
npm audit
npm update

# Run security audit
npm audit fix

# Check monitoring alerts
curl "https://your-domain.com/api/monitoring/alerts?summary=true"
```

#### Monthly Tasks
```bash
# Review performance metrics
npm run monitor:report

# Update SSL certificates (handled by Vercel)
# Review access logs
# Update documentation
```

#### Quarterly Tasks
```bash
# Major dependency updates
npm outdated
npm update --save

# Security assessment
# Performance optimization review
# Backup verification
```

### Backup and Recovery

#### Configuration Backup
- Environment variables are managed by Vercel
- Code is version controlled in Git
- Database backups (if applicable)

#### Emergency Rollback
```bash
# Rollback via Git
git revert <commit-hash>
git push origin main

# Or rollback via Vercel dashboard
# Navigate to Deployments > Rollback
```

### Scaling Considerations

#### Traffic Increase Handling
- Vercel automatically scales serverless functions
- Monitor resource usage
- Implement caching strategies
- Consider CDN optimization

#### Database Scaling (Future)
- Implement connection pooling
- Use read replicas for high traffic
- Implement data partitioning if needed

## Contact and Support

For deployment issues or questions:
- Check this documentation first
- Review Vercel documentation
- Check GitHub Issues for known problems
- Contact the development team

## Version History

- **v1.0.0**: Initial deployment guide
- Includes security hardening and monitoring setup
- Comprehensive troubleshooting procedures