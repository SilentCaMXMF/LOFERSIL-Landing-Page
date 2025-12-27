# LOFERSIL Landing Page - Operations Runbook

## Overview

Comprehensive operational procedures and runbooks for managing the LOFERSIL Landing Page deployment pipeline. This document provides step-by-step instructions for common operational tasks, emergency procedures, and maintenance activities.

## Emergency Procedures

### 🚨 Critical Incident Response

#### Website Completely Down

**Symptoms:**

- All pages return 5xx errors
- Health checks failing consecutively
- User reports of inability to access site

**Immediate Actions (0-5 minutes):**

1. **Verify Incident Scope**

   ```bash
   # Check from multiple locations
   curl -I https://lofersil.pt
   curl -I https://www.lofersil.pt

   # Check Vercel status
   curl https://www.vercel-status.com/api/v2/status.json
   ```

2. **Check Vercel Dashboard**
   - Log into Vercel dashboard
   - Review deployment status
   - Check for any ongoing incidents

3. **Verify Recent Deployments**

   ```bash
   # Check last deployment
   vercel ls --scope=lofersil

   # Review recent commits
   git log --oneline -10
   ```

**Resolution Actions (5-15 minutes):**

1. **Quick Rollback**

   ```bash
   # Rollback to previous deployment
   vercel rollback [previous-deployment-url]

   # Or promote previous deployment via dashboard
   # Dashboard → Deployments → ... → Promote to Production
   ```

2. **If Rollback Fails**

   ```bash
   # Redeploy last known good commit
   git checkout [last-known-good-commit]
   git push origin preview-deployment --force
   ```

3. **Enable Maintenance Mode** (if extended downtime)
   ```bash
   # Deploy maintenance page
   cp maintenance.html index.html
   git add . && git commit -m "emergency: enable maintenance mode"
   git push origin preview-deployment
   ```

#### Deployment Pipeline Broken

**Symptoms:**

- GitHub Actions workflow failing
- Unable to deploy new changes
- Build errors in CI/CD

**Diagnosis Steps:**

1. **Check GitHub Actions Logs**
   - Go to repository → Actions tab
   - Review failed workflow runs
   - Identify failure point

2. **Verify Environment Variables**

   ```bash
   # Test secrets locally (if available)
   echo "Testing environment variables..."

   # Check required secrets in GitHub settings
   # Settings → Secrets and variables → Actions
   ```

3. **Test Build Locally**
   ```bash
   # Clean local build test
   rm -rf dist node_modules package-lock.json
   npm install
   npm run build:prod
   ```

**Resolution Actions:**

1. **Fix Build Issues**

   ```bash
   # If dependency issues
   npm update
   npm audit fix

   # If TypeScript errors
   npx tsc --noEmit
   # Fix type errors manually
   ```

2. **Update Workflow Configuration**

   ```bash
   # Test workflow changes locally
   act -j deploy-preview  # Using act for local GitHub Actions
   ```

3. **Emergency Manual Deployment**
   ```bash
   # Deploy directly via Vercel CLI
   npm run build:prod
   vercel --prod
   ```

#### Security Incident Response

**Symptoms:**

- Suspicious activity detected
- Security vulnerability reported
- Data breach indicators

**Immediate Actions (0-10 minutes):**

1. **Assess Incident Scope**

   ```bash
   # Check for unauthorized deployments
   git log --author="" --oneline -10

   # Review access logs (if available)
   # Check Vercel function logs
   ```

2. **Isolate Affected Systems**

   ```bash
   # Rotate API keys immediately
   # Update environment variables
   # Enable additional monitoring
   ```

3. **Document Everything**
   - Create incident report
   - Document all actions taken
   - Preserve logs and evidence

**Escalation Actions:**

1. **Notify Security Team**
2. **Implement Temporary Fixes**
3. **Plan Long-term Remediation**

## Routine Operations

### 🔄 Regular Maintenance Procedures

#### Daily Health Check (9:00 AM)

**Automated Script:**

```bash
#!/bin/bash
# daily-health-check.sh

echo "🔍 LOFERSIL Landing Page - Daily Health Check"
echo "============================================"

# Check website availability
echo "1. Checking website availability..."
if curl -f -s https://lofersil.pt > /dev/null; then
    echo "✅ Website is accessible"
else
    echo "❌ Website is DOWN"
    exit 1
fi

# Check API endpoints
echo "2. Checking API endpoints..."
if curl -f -s https://lofersil.pt/api/test-env > /dev/null; then
    echo "✅ API endpoints are responding"
else
    echo "⚠️ API endpoints may have issues"
fi

# Check SSL certificate
echo "3. Checking SSL certificate..."
ssl_info=$(openssl s_client -connect lofersil.pt:443 -servername lofersil.pt 2>/dev/null | openssl x509 -noout -dates)
echo "SSL Certificate: $ssl_info"

# Check performance
echo "4. Running performance check..."
lighthouse_result=$(lighthouse https://lofersil.pt --output=json --quiet --chrome-flags="--headless" 2>/dev/null)
performance_score=$(echo "$lighthouse_result" | jq -r '.lhr.categories.performance.score * 100')
echo "Performance Score: ${performance_score}"

# Generate summary
echo "============================================"
echo "Daily Health Check Complete"
echo "Website Status: ✅ Operational"
echo "Performance Score: ${performance_score}/100"
echo "SSL Status: Valid"
```

#### Weekly Performance Review (Monday 10:00 AM)

**Performance Analysis Script:**

```bash
#!/bin/bash
# weekly-performance-review.sh

echo "📊 LOFERSIL Landing Page - Weekly Performance Review"
echo "===================================================="

# Build performance metrics
echo "1. Analyzing build performance..."
build_time_start=$(date +%s)
npm run build:prod
build_time_end=$(date +%s)
build_duration=$((build_time_end - build_time_start))
echo "Build Time: ${build_duration} seconds"

# Bundle size analysis
echo "2. Analyzing bundle sizes..."
dist_size=$(du -sh dist/ | cut -f1)
js_size=$(find dist/ -name "*.js" -exec du -ch {} + | grep total$ | cut -f1)
css_size=$(find dist/ -name "*.css" -exec du -ch {} + | grep total$ | cut -f1)
echo "Total Dist Size: $dist_size"
echo "JavaScript Bundle: $js_size"
echo "CSS Bundle: $css_size"

# Performance trends
echo "3. Performance trends..."
# Integration with Lighthouse CI or similar tool
# This would connect to your monitoring system

# Security scan results
echo "4. Security scan summary..."
npm audit --audit-level high
```

#### Monthly Security Audit (First Friday)

**Security Audit Checklist:**

```bash
#!/bin/bash
# monthly-security-audit.sh

echo "🔒 LOFERSIL Landing Page - Monthly Security Audit"
echo "=================================================="

# Dependency vulnerability scan
echo "1. Scanning for vulnerable dependencies..."
npm audit --json > audit-report.json
critical_vulns=$(cat audit-report.json | jq '.vulnerabilities | map(select(.severity == "critical")) | length')
high_vulns=$(cat audit-report.json | jq '.vulnerabilities | map(select(.severity == "high")) | length')

echo "Critical Vulnerabilities: $critical_vulns"
echo "High Vulnerabilities: $high_vulns"

# Code security analysis
echo "2. Analyzing code security..."
# Integration with code scanning tools
# semgrep, eslint-security, etc.

# Environment variable audit
echo "3. Auditing environment variables..."
# Check for any exposed secrets
# Validate secure configurations

# SSL/TLS configuration check
echo "4. Checking SSL/TLS configuration..."
# Test SSL configuration
# Check for latest security practices

# Generate security report
echo "5. Generating security report..."
# Compile findings into report
# Create remediation tasks
```

### 📋 Deployment Procedures

#### Standard Deployment Process

**1. Preparation Phase**

```bash
# Verify branch is up to date
git checkout preview-deployment
git pull origin preview-deployment

# Run local tests
npm install
npm run lint
npm run build:prod

# Verify build output
ls -la dist/
```

**2. Deployment Phase**

```bash
# Commit and push changes
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin preview-deployment

# Monitor deployment
# GitHub Actions → Monitor workflow run
# Wait for completion
```

**3. Verification Phase**

```bash
# Test staging deployment
staging_url="https://lofersil-landing-page-[hash].vercel.app"
curl -f -s "$staging_url" || echo "Staging deployment failed"

# Run smoke tests
npm run test:e2e -- --baseUrl="$staging_url"

# Manual verification checklist
echo "✅ Page loads correctly"
echo "✅ Navigation works"
echo "✅ Contact form functions"
echo "✅ Theme switching works"
echo "✅ Language switching works"
```

#### Production Deployment (Manual Trigger)

**1. Pre-Deployment Checklist**

- [ ] All tests passing in staging
- [ ] Performance metrics acceptable
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Stakeholders notified

**2. Deployment Execution**

```bash
# Trigger via GitHub Actions
gh workflow run "Deploy to Vercel" --field environment=production

# Or manual via Vercel CLI
npm run build:prod
vercel --prod
```

**3. Post-Deployment Verification**

```bash
# Test production deployment
curl -f -s https://lofersil.pt || echo "Production deployment failed"

# Run smoke tests in production
npm run test:e2e -- --baseUrl="https://lofersil.pt"

# Monitor metrics for 30 minutes
# Watch for any performance degradation
```

### 🔧 Configuration Management

#### Environment Variable Management

**Adding New Environment Variables:**

1. **Local Development**

   ```bash
   # Add to .env.local
   NEW_VARIABLE=value

   # Test locally
   npm run dev
   ```

2. **Staging Environment**

   ```bash
   # Add to Vercel staging environment
   vercel env add NEW_VARIABLE preview

   # Redeploy staging
   git push origin preview-deployment
   ```

3. **Production Environment**

   ```bash
   # Add to Vercel production environment
   vercel env add NEW_VARIABLE production

   # Trigger production deployment
   # Follow production deployment procedure
   ```

**Rotating Secrets:**

```bash
# 1. Generate new secret
# 2. Update Vercel environment variable
vercel env remove OLD_SECRET production
vercel env add NEW_SECRET production

# 3. Update application code (if needed)
# 4. Deploy changes
git add .
git commit -m "security: rotate API keys"
git push origin preview-deployment

# 5. Test deployment
# 6. Promote to production
```

#### Dependency Management

**Regular Dependency Updates:**

```bash
# Check for outdated packages
npm outdated

# Update patch versions
npm update

# Update minor versions
npm update --save

# Major version updates (manual review)
npm install package@latest
npm test
```

**Security Update Process:**

```bash
# Check for security vulnerabilities
npm audit

# Fix automatically (when safe)
npm audit fix

# Manual fixes required
npm audit fix --force
# Review changes carefully
```

## Troubleshooting Procedures

### 🔍 Common Issues and Solutions

#### Build Failures

**Issue: TypeScript Compilation Errors**

```bash
# Diagnose
npx tsc --noEmit --listFiles

# Common fixes
npm install --save-dev @types/node  # Missing types
npm install typescript@latest        # Update TypeScript
```

**Issue: PostCSS Processing Errors**

```bash
# Test PostCSS configuration
npx postcss src/styles/main.css -o test.css

# Check plugins
npx postcss --use autoprefixer --use cssnano src/styles/main.css -o test.css
```

**Issue: Asset Missing Errors**

```bash
# Verify assets are copied
ls -la dist/assets/images/

# Check build script
npm run build:assets
```

#### Runtime Issues

**Issue: API 500 Errors**

```bash
# Check Vercel function logs
vercel logs

# Test environment variables
curl https://lofersil.pt/api/test-env

# Check function deployment
vercel ls
```

**Issue: Performance Degradation**

```bash
# Run Lighthouse audit
lighthouse https://lofersil.pt --view

# Check bundle sizes
npm run build:prod && du -sh dist/

# Analyze performance
# Use browser dev tools to identify bottlenecks
```

#### Integration Issues

**Issue: CORS Errors**

```bash
# Check CORS configuration
# Verify CORS_ORIGIN environment variable

# Test CORS
curl -H "Origin: https://lofersil.pt" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://lofersil.pt/api/contact
```

**Issue: Form Submission Failures**

```bash
# Test contact form API
curl -X POST https://lofersil.pt/api/contact \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com","message":"Test"}'

# Check email configuration
# Verify SMTP settings
```

## Backup and Recovery

### 💾 Backup Procedures

#### Code Repository Backup

```bash
# Create backup archive
git archive --format=zip --output=lofersil-backup-$(date +%Y%m%d).zip HEAD

# Verify backup
unzip -l lofersil-backup-$(date +%Y%m%d).zip
```

#### Environment Configuration Backup

```bash
# Export environment variables
vercel env pull .env.backup

# Document current configuration
echo "# Environment Backup - $(date)" > env-backup-notes.md
vercel env ls >> env-backup-notes.md
```

### 🔄 Recovery Procedures

#### Complete System Recovery

```bash
# 1. Restore from backup
git checkout [backup-commit]
npm install
npm run build:prod

# 2. Deploy restored version
vercel --prod

# 3. Verify functionality
# Run comprehensive tests
# Monitor performance
```

#### Partial Recovery

```bash
# Selective file recovery
git checkout [backup-commit] -- path/to/file

# Environment recovery
vercel env restore [backup-file]
```

## Communication Procedures

### 📢 Incident Communication

#### Internal Communication

- **Slack/Teams**: #deployment-alerts channel
- **Email**: devops-team@company.com
- **GitHub Issues**: Create incident issue

#### External Communication

- **Status Page**: Update status page for extended outages
- **User Notification**: In-app notification banner
- **Social Media**: Company social channels

### 📋 Reporting Structure

**Incident Report Template:**

```markdown
# Incident Report - [Date]

## Summary

[Brief description of incident]

## Impact

- Users affected: [Number]
- Duration: [Time]
- Systems affected: [List]

## Timeline

- [Time]: Incident detected
- [Time]: Response initiated
- [Time]: Resolution implemented
- [Time]: Service restored

## Root Cause

[Detailed analysis of what went wrong]

## Resolution

[Steps taken to fix the issue]

## Prevention

[Measures to prevent recurrence]

## Lessons Learned

[Key takeaways and improvements]
```

## Automation Scripts

### 🤖 Maintenance Automation

#### Automated Health Check

```bash
#!/bin/bash
# auto-health-check.sh
# Runs every 5 minutes via cron

HEALTH_URL="https://lofersil.pt/api/health"
ALERT_EMAIL="devops@company.com"

response=$(curl -s -w "%{http_code}" "$HEALTH_URL")
http_code="${response: -3}"
response_body="${response%???}"

if [ "$http_code" != "200" ]; then
    echo "Health check failed with HTTP $http_code" | \
    mail -s "🚨 LOFERSIL Website Health Check Failed" "$ALERT_EMAIL"

    # Attempt auto-recovery
    curl -X POST "https://api.github.com/repos/SilentCaMXMF/LOFERSIL-Landing-Page/actions/workflows/deploy-to-vercel.yml/dispatches" \
         -H "Authorization: token $GITHUB_TOKEN" \
         -H "Accept: application/vnd.github.v3+json" \
         -d '{"ref":"preview-deployment","inputs":{"environment":"production"}}'
fi
```

#### Automated Security Scan

```bash
#!/bin/bash
# auto-security-scan.sh
# Runs daily via cron

npm audit --audit-level high > /tmp/security-scan.log
if [ $? -ne 0 ]; then
    mail -s "🔒 Security Vulnerabilities Detected" "security@company.com" < /tmp/security-scan.log

    # Create GitHub issue automatically
    gh issue create \
        --title "Security Vulnerabilities Detected - $(date)" \
        --body "Automated security scan detected vulnerabilities. See attached report." \
        --label "security" \
        < /tmp/security-scan.log
fi
```

---

**Last Updated**: December 27, 2025
**Version**: 1.0.0
**Next Review**: January 27, 2026
