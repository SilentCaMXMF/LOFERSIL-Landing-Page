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

2. **Input Validation**
   - All form inputs are validated before processing
   - Email format validation with regex
   - Length limits enforced on all fields
   - Implemented in `src/scripts/validation.ts` and `ContactFormManager.ts`

3. **Content Sanitization**
   - HTML content is sanitized before DOM insertion
   - Script tags and event handlers are removed
   - Implemented using DOMPurify in form handling

### Content Security Policy (CSP)

The following CSP headers are configured in `vercel.json`:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://formspree.io;
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self' https://formspree.io;
```

### Security Headers

The following security headers are configured in `vercel.json`:

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME-type sniffing
- `X-XSS-Protection: 1; mode=block` - Enable browser XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin` - Control referrer information
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - Restrict permissions

### Dependencies

Current security-related dependencies:

- **DOMPurify ^3.3.0**: XSS protection library
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
   - Length limits enforced (name: 100 chars, email: 254 chars, phone: 20 chars, message: 2000 chars)
   - Implemented in `ContactFormManager.ts`

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly using one of the following methods:

### Private Reporting (Preferred)
1. **GitHub Security Advisories**: Use [GitHub's private vulnerability reporting](https://github.com/SilentCaMXMF/LOFERSIL-Landing-Page/security/advisories/new) to submit a security advisory privately
2. **Email**: Send details to **security@lofersil.pt**

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline
- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix and disclosure**: Coordinated with reporter

Please do not disclose vulnerabilities publicly until we have had a chance to address them. We appreciate responsible disclosure and will credit reporters who follow these guidelines.

## Security Best Practices

1. Always sanitize user input before displaying it
2. Use DOMPurify for all HTML content
3. Keep dependencies up-to-date
4. Follow the principle of least privilege
5. Never store sensitive data in localStorage or cookies
6. Always use HTTPS in production
