# CSP Headers Configuration

## Overview

Content Security Policy (CSP) headers have been added to `vercel.json` to resolve 'unsafe-eval' violations from Google Search Console while maintaining security best practices.

## Configuration Details

### CSP Header Value

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https:;
connect-src 'self' https://formspree.io https://fonts.googleapis.com https://fonts.gstatic.com;
font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com;
object-src 'none';
frame-src 'none';
base-uri 'self';
form-action 'self' https://formspree.io;
upgrade-insecure-requests
```

### Directive Breakdown

| Directive                     | Value                                                                                | Purpose                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **default-src**               | `'self'`                                                                             | Default policy allows only same-origin resources                                                                   |
| **script-src**                | `'self' 'unsafe-inline'`                                                             | Allows inline scripts (required for JSON-LD) and scripts from same origin. **Note: 'unsafe-eval' is NOT included** |
| **style-src**                 | `'self' 'unsafe-inline' https://fonts.googleapis.com`                                | Allows inline styles and Google Fonts CSS                                                                          |
| **img-src**                   | `'self' data: https:`                                                                | Allows images from same origin, data URLs, and any HTTPS source                                                    |
| **connect-src**               | `'self' https://formspree.io https://fonts.googleapis.com https://fonts.gstatic.com` | Allows fetch/XHR to Formspree and Google Fonts                                                                     |
| **font-src**                  | `'self' data: https://fonts.googleapis.com https://fonts.gstatic.com`                | Allows fonts from same origin, data URLs, and Google Fonts                                                         |
| **object-src**                | `'none'`                                                                             | Blocks plugins (Flash, Java, etc.)                                                                                 |
| **frame-src**                 | `'none'`                                                                             | Blocks iframes for clickjacking protection                                                                         |
| **base-uri**                  | `'self'`                                                                             | Restricts base tag to same origin                                                                                  |
| **form-action**               | `'self' https://formspree.io`                                                        | Allows form submissions to Formspree                                                                               |
| **upgrade-insecure-requests** | N/A                                                                                  | Automatically upgrades HTTP to HTTPS                                                                               |

## Security Considerations

### What's Allowed

- ✅ Inline JSON-LD structured data (via 'unsafe-inline' in script-src)
- ✅ Formspree.io form submissions
- ✅ Google Fonts loading
- ✅ Local scripts and styles
- ✅ Images from same origin and HTTPS sources
- ✅ Data URIs for images and fonts

### What's Blocked

- ❌ 'unsafe-eval' (prevents eval(), setTimeout() with string arguments)
- ❌ Plugins and objects
- ❌ Iframes
- ❌ External scripts except those explicitly whitelisted
- ❌ Form submissions to unapproved domains

### Trade-offs

- **'unsafe-inline'**: Required for inline JSON-LD structured data which is static and trusted. This is a common practice for static sites with schema markup.
- **Google Fonts**: Explicitly whitelisted as they're from a trusted CDN.

## Implementation Notes

1. **No 'unsafe-eval'**: The CSP explicitly avoids 'unsafe-eval', which was the source of the Google Search Console violations.

2. **Formspree Integration**: The `connect-src` and `form-action` directives include `https://formspree.io` to ensure contact forms work correctly.

3. **Google Fonts**: Both `connect-src` and `font-src` include Google Fonts domains to ensure proper font loading.

4. **Default-Deny Policy**: The `default-src 'self'` directive ensures only same-origin resources are allowed by default, with specific exceptions.

## Testing

After deployment, verify the CSP works correctly by:

1. **Google Search Console**: Check that 'unsafe-eval' violations are resolved
2. **Browser Console**: Ensure no CSP violations appear
3. **Contact Form**: Test that form submissions work with Formspree
4. **JSON-LD**: Verify structured data is accessible to search engines
5. **Fonts**: Confirm Google Fonts load properly

## Deployment

The CSP headers will be applied automatically when deployed to Vercel. The headers are configured for all routes via the `/.*` source pattern.

## Monitoring

After deployment, monitor:

- Google Search Console for any remaining CSP issues
- Browser console for CSP violations
- Site functionality (forms, fonts, images)

## Future Improvements

For enhanced security, consider:

1. Moving inline scripts to external files where possible
2. Using CSP nonces or hashes for inline scripts instead of 'unsafe-inline'
3. Implementing Report-Only mode first to test changes
4. Adding `report-uri` directive to monitor violations

## Related Files

- `vercel.json`: Main configuration file with CSP headers
- `index.html`: Contains inline JSON-LD structured data
- `en/index.html`: English version with structured data
- `src/scripts/modules/ContactFormManager.js`: Form handling (Formspree integration)
