# Security Policy

## Overview

This document outlines the security measures implemented in the LOFERSIL Landing Page and provides guidelines for maintaining a secure codebase.

## Security Measures

### XSS Protection

The LOFERSIL Landing Page implements multiple layers of XSS protection:

1. **DOMPurify Sanitization**
   - All DOM insertions are sanitized using DOMPurify
   - Configured to allow only safe HTML tags and attributes
   - Located in `src/scripts/purify.min.js`

2. **Route Path Sanitization**
   - URL paths are sanitized before processing
   - Only alphanumeric characters, hyphens, and slashes are allowed
   - Implemented in `src/scripts/index.js`

3. **Content Sanitization**
   - HTML content is sanitized before DOM insertion
   - Script tags and event handlers are removed
   - Implemented in the `sanitizeContent()` method

### Content Security Policy (CSP)

The following CSP headers should be configured on the server:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://formspree.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self' https://formspree.io;
```

### Security Headers

Recommended security headers for production:

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME-type sniffing
- `X-XSS-Protection: 1; mode=block` - Enable browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - Restrict permissions

### Dependencies

Current security-related dependencies:

- **DOMPurify 3.3.0**: XSS protection library
  - Only external library required for security
  - Self-hosted to prevent supply chain attacks

### Form Security

The contact form implements the following security measures:

1. **Client-side Validation**
   - Input validation before submission
   - Email format validation
   - Required field validation
   - Implemented in `src/scripts/validation.ts`

2. **Server-side Processing**
   - Form submissions handled by Formspree
   - HTTPS enforced for all submissions
   - No sensitive data stored client-side

3. **Input Sanitization**
   - All form inputs sanitized with DOMPurify
   - Length limits enforced
   - Character filtering applied

## Vulnerability Disclosure

If you discover a security vulnerability, please report it to:

- **Email**: pedroocalado@gmail.com
- **Subject**: [SECURITY] LOFERSIL Landing Page Vulnerability Report
- **Details**: Include steps to reproduce, impact assessment, and suggested fix

## Security Checklist

Before deploying updates:

- [ ] All user inputs are sanitized
- [ ] No `innerHTML` with unsanitized content
- [ ] DOMPurify is loaded and functioning
- [ ] CSP headers are configured
- [ ] HTTPS is enforced
- [ ] No sensitive data in client-side code
- [ ] Dependencies are up to date
- [ ] No console.log statements with sensitive data

## Security Updates

### February 2026
- Fixed XSS vulnerability in `src/scripts/index.js` (line 628)
- Fixed XSS vulnerability in `src/scripts/modules/UIManager.ts` (line 235)
- Removed 45+ unused files reducing attack surface
- Implemented route path sanitization
- Added content sanitization methods

## Compliance

### GDPR Compliance
- No persistent user data storage
- Form data processed by third-party (Formspree)
- Privacy policy available at `/privacy.html`
- Cookie consent implemented

### Data Protection
- No analytics tracking without consent
- Minimal data collection
- Secure transmission via HTTPS

## Incident Response

In case of security incident:

1. **Immediate Response**
   - Assess scope and impact
   - Take affected systems offline if necessary
   - Document timeline and actions taken

2. **Investigation**
   - Identify root cause
   - Determine affected users/data
   - Preserve evidence

3. **Remediation**
   - Deploy security patches
   - Update security measures
   - Verify fixes

4. **Communication**
   - Notify affected users if required
   - Update security documentation
   - Report to relevant authorities if necessary

## Additional Resources

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

Last Updated: February 2026  
Security Contact: pedroocalado@gmail.com
