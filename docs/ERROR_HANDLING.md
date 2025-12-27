# Error Handling & Troubleshooting Guide

## 🚨 Error Categories & Solutions

### 1. Secret Configuration Errors

#### ❌ `VERCEL_TOKEN secret is not set`

**Cause**: Vercel token not configured in GitHub repository secrets

**Solution**:

1. Navigate to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add `VERCEL_TOKEN` with your Vercel personal access token
4. Ensure token has deployment permissions for the project

**Verification**:

```bash
# Test token locally
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v9/user
```

#### ❌ `VERCEL_ORG_ID secret is not set`

**Cause**: Vercel organization ID missing from repository secrets

**Solution**:

1. Get your Vercel organization ID from Vercel dashboard
2. Add as `VERCEL_ORG_ID` in repository secrets
3. Verify ID format (usually starts with `org_`)

#### ❌ `VERCEL_PROJECT_ID secret is not set`

**Cause**: Vercel project ID not configured

**Solution**:

1. Get project ID from `vercel link` or Vercel dashboard
2. Add as `VERCEL_PROJECT_ID` in repository secrets
3. Verify project ID format (usually starts with `prj_`)

### 2. Dependency Installation Errors

#### ❌ `npm ci failed`

**Cause**: package-lock.json is out of sync or corrupted

**Solutions**:

```bash
# Local debugging
rm -f package-lock.json
npm install --package-lock-only
git add package-lock.json
git commit -m "Fix package lock sync"

# Or if lock file is corrupted
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Prevention**:

- Always commit package-lock.json changes
- Use npm ci in CI environments
- Regular dependency updates with npm update

#### ❌ `ENOTFOUND npm registry`

**Cause**: Network connectivity issues or registry problems

**Solutions**:

```bash
# Configure alternative registry
npm config set registry https://registry.npmjs.org/

# Use npm proxy (if configured)
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Clean npm cache
npm cache clean --force
```

### 3. Build Compilation Errors

#### ❌ TypeScript Compilation Failed

**Common Issues**:

- Type errors in TypeScript code
- Missing type definitions
- Import/export mismatches

**Debugging Steps**:

```bash
# Local type checking
npx tsc --noEmit

# Detailed error output
npx tsc --noEmit --pretty

# Check missing types
npm install --save-dev @types/node @types/express
```

**Fix Strategies**:

1. Fix type errors in source code
2. Add missing type definitions
3. Update tsconfig.json configuration
4. Use `any` type sparingly as last resort

#### ❌ CSS Compilation Errors

**Common Issues**:

- PostCSS configuration problems
- Missing PostCSS plugins
- Invalid CSS syntax

**Solutions**:

```bash
# Check PostCSS config
cat postcss.config.js

# Test CSS compilation locally
npx postcss src/styles/main.css -o test.css

# Reinstall PostCSS dependencies
npm uninstall postcss postcss-cli autoprefixer cssnano
npm install --save-dev postcss postcss-cli autoprefixer cssnano
```

### 4. Vercel Deployment Errors

#### ❌ `Project not found` or `Invalid project ID`

**Cause**: Incorrect Vercel project configuration

**Solutions**:

```bash
# Verify project linkage
vercel link

# Check current project
vercel project ls

# Update project configuration
vercel --prod
```

**Verification Checklist**:

- [ ] VERCEL_ORG_ID matches Vercel dashboard
- [ ] VERCEL_PROJECT_ID is correct for this project
- [ ] Vercel token has project permissions
- [ ] Project exists in correct Vercel organization

#### ❌ `Deployment timeout` or `Network error`

**Cause**: Network connectivity or Vercel API issues

**Solutions**:

1. **Retry deployment** (automatic in optimized workflow)
2. **Check Vercel status**: https://www.vercel-status.com/
3. **Verify network connectivity**
4. **Check rate limits**: Too many deployments in short time

**Manual Retry**:

```bash
# Local deployment
vercel --prod --debug

# Or using Vercel CLI
vercel deploy --prod
```

### 5. Build Output Verification Errors

#### ❌ `dist/index.html not found`

**Cause**: Build process failed or output directory structure changed

**Debugging Steps**:

```bash
# Check build output locally
npm run build
ls -la dist/

# Verify build script in package.json
cat package.json | grep -A 5 '"build"'

# Check TypeScript output
npx tsc
ls -la dist/
```

**Common Fixes**:

1. Fix build script in package.json
2. Update tsconfig.json output directory
3. Ensure all build steps complete successfully
4. Check file permissions and disk space

#### ❌ `Build too large` warnings

**Cause**: Bundle size optimization needed

**Solutions**:

```bash
# Analyze bundle sizes
du -sh dist/*
find dist -name "*.js" -exec ls -lh {} \;

# CSS optimization
npx cssnano dist/main.css dist/main.min.css

# Image optimization
# Use WebP format, compress images
```

## 🔧 Advanced Troubleshooting

### Debug Mode Activation

Enable comprehensive debugging by adding debug flag to workflow:

```yaml
# In workflow_dispatch inputs
debug:
  description: "Enable debug mode"
  required: false
  default: false
  type: boolean
```

### Local Environment Replication

Replicate CI environment locally:

```bash
# Use same Node.js version
nvm use 20

# Clean environment
rm -rf node_modules dist
npm cache clean --force

# Replicate CI build
npm ci
npm run build
npm run lint
```

### Network Debugging

Debug network-related issues:

```bash
# Test Vercel API connectivity
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
     https://api.vercel.com/v9/user

# Test deployment URL availability
curl -I https://your-app.vercel.app

# DNS debugging
nslookup vercel.com
ping api.vercel.com
```

### Dependency Debugging

Investigate dependency issues:

```bash
# Check for vulnerable packages
npm audit

# Check dependency tree
npm ls --depth=0

# Check outdated packages
npm outdated

# Verify package integrity
npm verify
```

## 🚨 Emergency Procedures

### Production Deployment Failure

1. **Immediate Actions**:
   - Check workflow logs for specific error
   - Verify no secrets were exposed
   - Assess impact on live application

2. **Rollback Options**:
   - Use Vercel dashboard rollback feature
   - Deploy previous known-good commit
   - Enable maintenance mode if needed

3. **Communication**:
   - Notify stakeholders of deployment issue
   - Provide estimated resolution time
   - Share progress updates

### Security Incident Response

1. **Secret Exposure**:
   - Immediately rotate exposed secrets
   - Revoke compromised Vercel tokens
   - Check for unauthorized deployments

2. **Vulnerable Dependencies**:
   - Update affected packages immediately
   - Run security audit on all branches
   - Consider emergency patch deployment

3. **Unauthorized Access**:
   - Review GitHub access logs
   - Revoke suspicious permissions
   - Enable additional security controls

## 📊 Performance Monitoring

### Build Performance

Monitor build metrics:

```bash
# Track build times
time npm run build

# Monitor memory usage
/usr/bin/time -v npm run build

# Profile build process
node --prof npm run build
```

### Deployment Performance

Track deployment success rates:

- Monitor build times (target: < 2 minutes)
- Track deployment success rate (target: >95%)
- Monitor rollback frequency (target: < 1%)
- Track deployment verification time

### Alert Thresholds

Set up alerts for:

- Build time > 5 minutes
- Deployment failure rate > 5%
- Security vulnerabilities detected
- Bundle size increase > 20%

## 📚 Reference Materials

### Useful Commands

```bash
# Vercel CLI commands
vercel --version
vercel whoami
vercel projects
vercel logs

# GitHub Actions debugging
gh run list
gh run view <run-id>
gh workflow list

# Build tools
npm run build --verbose
npx tsc --diagnostics
npm ls --json
```

### Configuration Files

Key files to check:

- `package.json` - Build scripts and dependencies
- `tsconfig.json` - TypeScript compilation settings
- `postcss.config.js` - CSS processing configuration
- `vercel.json` - Vercel deployment configuration
- `.github/workflows/` - CI/CD pipeline definitions

### External Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [npm Security](https://docs.npmjs.com/cli/v8/commands/npm-audit)
