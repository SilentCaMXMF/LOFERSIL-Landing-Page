# SMTP Configuration Guide for LOFERSIL Contact Form

## Quick Setup Steps

### 1. Choose Your Email Provider

#### Gmail (Recommended for testing)

```bash
# Enable 2-factor authentication on your Gmail account
# Generate an App Password: https://myaccount.google.com/apppasswords

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-generated-app-password
FROM_EMAIL=noreply@your-domain.com
TO_EMAIL=contact@your-domain.com
```

#### Outlook/Hotmail

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@your-domain.com
TO_EMAIL=contact@your-domain.com
```

#### Custom SMTP Server

```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # or true for SSL
SMTP_USER=your-username
SMTP_PASS=your-password
FROM_EMAIL=noreply@your-domain.com
TO_EMAIL=contact@your-domain.com
```

### 2. Configure Environment Variables

#### Local Development (.env.local)

```bash
# Copy to .env.local and fill in your values
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@lofersil.pt
TO_EMAIL=contact@lofersil.pt
```

#### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each SMTP variable:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `FROM_EMAIL`
   - `TO_EMAIL`

### 3. Test the Configuration

```bash
# Test with the verification script
npm run verify-contact

# Or test manually
node verify-contact-form.js
```

## Troubleshooting

### Gmail Authentication Issues

- **Error**: "535-5.7.8 Username and Password not accepted"
- **Solution**: Use an App Password, not your regular password
- **Steps**:
  1. Enable 2FA on your Google Account
  2. Go to App Passwords: https://myaccount.google.com/apppasswords
  3. Generate a new app password
  4. Use that password in SMTP_PASS

### Connection Issues

- **Error**: "ECONNECTION" or "ETIMEDOUT"
- **Solution**: Check SMTP_HOST and SMTP_PORT
- **Common ports**: 587 (TLS), 465 (SSL), 25 (unencrypted)

### SSL/TLS Issues

- **Error**: "SSL/TLS handshake failed"
- **Solution**: Adjust SMTP_SECURE setting
- **Port 587**: SMTP_SECURE=false (STARTTLS)
- **Port 465**: SMTP_SECURE=true (SSL/TLS)

## Security Notes

1. **Never commit credentials to git**
2. **Use App Passwords** for Gmail/Google Workspace
3. **Use environment-specific variables** for different environments
4. **Consider using EmailJS** for client-side solutions (optional)

## Alternative Solutions

If you prefer not to use SMTP:

### EmailJS (Client-side)

```javascript
// Environment variables
EMAILJS_SERVICE_ID = your - service - id;
EMAILJS_TEMPLATE_ID = your - template - id;
EMAILJS_PUBLIC_KEY = your - public - key;
```

### External Email Services

- SendGrid
- Mailgun
- AWS SES
- Resend

## Testing Commands

```bash
# Test email configuration
node test-email-functionality.js

# Test contact API
node test-contact-api.js

# Verify production setup
node verify-contact-form.js

# Check environment variables
node check-environment.js
```
