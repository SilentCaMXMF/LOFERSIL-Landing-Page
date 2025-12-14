# Vercel Configuration Update for Node.js 22.17.1 LTS

## Summary of Changes

This document outlines the Vercel configuration updates to align with Node.js 22.17.1 LTS security requirements and optimizations.

## Files Updated

### 1. `vercel.json` - Main Configuration

#### Key Changes:

- **Added Node.js Runtime Specification**: `"nodeVersion": "22.x"`
- **Enhanced Security Headers**: Added Content Security Policy (CSP), Permissions Policy, HSTS
- **API CORS Headers**: Proper CORS configuration for `/api/*` routes
- **Function Runtime Configuration**: Explicit Node.js 22.x for serverless functions
- **Schema Validation**: Added `$schema` for better IDE support

#### Security Enhancements:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.lofersil.pt; frame-ancestors 'none';"
}
```

#### Function Configuration:

```json
{
  "functions": {
    "api/*.js": {
      "runtime": "nodejs22.x",
      "maxDuration": 10,
      "memory": 512
    }
  }
}
```

### 2. `.vercelignore` - Deployment Optimizations

#### New Exclusions:

- Node.js 22.x specific files: `.node_repl_history`, `.nyc_output`
- Build configuration files: `tsconfig.json`, `postcss.config.js`
- Build tool directories: `.vite/`, `.vitest/`

### 3. Function-Specific Configurations

#### `api/contact.vc-config.json`:

- Runtime: `nodejs22.x`
- Max Duration: 10 seconds (email operations)
- Memory: 512MB (SMTP operations)
- Node.js launcher with helpers enabled
- Source maps disabled for production

#### `api/test-env.vc-config.json`:

- Runtime: `nodejs22.x`
- Max Duration: 5 seconds (environment validation)
- Memory: 256MB (lightweight operation)
- Node.js launcher with helpers enabled
- Source maps disabled for production

## Security Benefits

### 1. Node.js 22.17.1 LTS Security Fixes

- Latest security patches and vulnerability fixes
- Improved V8 engine security features
- Enhanced TLS/SSL support

### 2. Enhanced HTTP Headers

- **Content Security Policy (CSP)**: Prevents XSS and injection attacks
- **Permissions Policy**: Controls access to browser features
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks

### 3. API Security

- Proper CORS configuration
- Method-based access control
- Header-based security policies

## Performance Optimizations

### 1. Build Environment

- Explicit Node.js 22.x runtime ensures consistent builds
- Optimized memory allocation for functions
- Reduced cold start times

### 2. Static Asset Caching

- Immutable caching for compiled assets (1 year)
- Long-term caching for fonts and images
- Appropriate caching for API responses

### 3. Function Performance

- Adequate memory allocation for email operations
- Reasonable timeout values for different function types
- Helper methods enabled for better debugging

## Deployment Validation

### Pre-deployment Checks:

1. **Node.js Version**: Verify `nodeVersion: "22.x"` in vercel.json
2. **Function Configs**: Ensure `.vc-config.json` files exist
3. **Security Headers**: Test headers with security scanners
4. **API Functionality**: Verify contact form works

### Post-deployment Validation:

1. **Security Headers**: Check response headers in browser dev tools
2. **Function Logs**: Monitor Vercel function logs for errors
3. **Performance**: Test API response times
4. **Build Process**: Verify successful deployment

## Environment Variables

Ensure these are configured in Vercel dashboard:

- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (email configuration)
- `TO_EMAIL`, `FROM_EMAIL` (email routing)
- `NODE_ENV=production` (production optimizations)

## Monitoring

### Key Metrics to Monitor:

- Function execution times
- Error rates for contact form
- Security header compliance
- Build success rates

### Recommended Monitoring Tools:

- Vercel Analytics
- Vercel Log Drains
- Custom health checks via `/api/test-env`

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert to previous vercel.json version
2. **Functions**: Remove `.vc-config.json` files to use defaults
3. **Headers**: Simplify security headers if compatibility issues
4. **Gradual**: Deploy changes incrementally

## Future Considerations

### Node.js Updates:

- Monitor for Node.js 22.x security releases
- Update to newer LTS versions when available
- Test compatibility with dependencies

### Security Enhancements:

- Consider Vercel's built-in security features
- Implement rate limiting for API endpoints
- Add request validation middleware

### Performance Optimization:

- Monitor function cold start times
- Consider edge functions for static assets
- Implement CDN optimization

## Support

For issues with this configuration:

1. Check Vercel deployment logs
2. Review function-specific logs
3. Test with local development environment
4. Verify environment variable configuration

---

**Note**: This configuration aligns with Node.js 22.17.1 LTS security best practices and Vercel deployment recommendations for production applications.
