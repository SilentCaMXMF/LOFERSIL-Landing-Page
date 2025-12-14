# Email Configuration Guide

## Overview

This guide provides comprehensive instructions for configuring and setting up email functionality for the LOFERSIL landing page contact form. The system uses Nodemailer with SMTP support for reliable email delivery.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [SMTP Provider Setup](#smtp-provider-setup)
3. [Environment Configuration](#environment-configuration)
4. [Testing and Validation](#testing-and-validation)
5. [Security Configuration](#security-configuration)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before configuring email functionality, ensure you have:

- Node.js 18+ and npm installed
- Access to an SMTP email service
- Administrative access to your domain's DNS settings
- Vercel account for deployment

## SMTP Provider Setup

### Gmail/Google Workspace

1. **Enable 2-Factor Authentication**

   ```bash
   # Go to: https://myaccount.google.com/security
   # Enable 2-Step Verification
   ```

2. **Generate App Password**

   ```bash
   # Go to: https://myaccount.google.com/apppasswords
   # Select "Mail" for app and "Other (Custom name)" for device
   # Name: "LOFERSIL Contact Form"
   # Copy the 16-character password
   ```

3. **Configuration Variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

### Microsoft 365/Outlook

1. **Create App Password**

   ```bash
   # Go to: https://account.microsoft.com/security
   # Enable 2-Step Verification
   # Create app password for email access
   ```

2. **Configuration Variables**
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@company.com
   SMTP_PASS=your-app-password
   ```

### Custom SMTP Provider

1. **Gather SMTP Details**
   - SMTP server hostname
   - Port number (usually 587 for TLS, 465 for SSL)
   - Authentication credentials
   - Security requirements

2. **Configuration Variables**
   ```env
   SMTP_HOST=your-smtp-server.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-username
   SMTP_PASS=your-password
   ```

## Environment Configuration

### Local Development

1. **Create Environment File**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure Email Variables**

   ```env
   # Basic SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Email Addresses
   FROM_EMAIL=noreply@lofersil.pt
   TO_EMAIL=admin@lofersil.pt
   CONTACT_EMAIL=contact@lofersil.pt

   # Advanced Configuration
   SMTP_TIMEOUT=30000
   SMTP_RETRY_ATTEMPTS=3
   EMAIL_TEST_MODE=true
   EMAIL_LOG_LEVEL=info
   ```

### Vercel Production

1. **Access Environment Variables**

   ```bash
   # Go to Vercel Dashboard → Project → Settings → Environment Variables
   ```

2. **Add Production Variables**
   - Add all SMTP configuration variables
   - Set environment to "Production", "Preview", and "Development" as needed
   - Use production email addresses and credentials

### Environment Variable Reference

| Variable              | Required | Description                  | Example               |
| --------------------- | -------- | ---------------------------- | --------------------- |
| `SMTP_HOST`           | Yes      | SMTP server hostname         | `smtp.gmail.com`      |
| `SMTP_PORT`           | Yes      | SMTP server port             | `587`                 |
| `SMTP_SECURE`         | Yes      | Use SSL/TLS connection       | `false`               |
| `SMTP_USER`           | Yes      | SMTP authentication username | `user@gmail.com`      |
| `SMTP_PASS`           | Yes      | SMTP authentication password | `app-password`        |
| `FROM_EMAIL`          | No       | From email address           | `noreply@lofersil.pt` |
| `TO_EMAIL`            | No       | Destination email address    | `admin@lofersil.pt`   |
| `SMTP_TIMEOUT`        | No       | Connection timeout in ms     | `30000`               |
| `SMTP_RETRY_ATTEMPTS` | No       | Number of retry attempts     | `3`                   |
| `EMAIL_TEST_MODE`     | No       | Enable test mode             | `false`               |

## Testing and Validation

### Local Testing

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Test Contact Form**
   - Open `http://localhost:3000`
   - Fill out the contact form with test data
   - Submit and check console logs

3. **Verify Email Delivery**
   ```bash
   # Check console for email sending logs
   # Verify email received at TO_EMAIL address
   ```

### SMTP Connection Test

Create a test script to verify SMTP configuration:

```javascript
// test-smtp.js
import nodemailer from "nodemailer";

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful");

    // Send test email
    const result = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: "Test Email - LOFERSIL",
      text: "This is a test email from the LOFERSIL contact form.",
    });

    console.log("✅ Test email sent:", result.messageId);
  } catch (error) {
    console.error("❌ SMTP test failed:", error);
  }
}

testSMTP();
```

### Production Testing

1. **Deploy to Preview**

   ```bash
   # Push changes to trigger preview deployment
   git push origin feature/email-config
   ```

2. **Test Preview Environment**
   - Visit preview URL
   - Test contact form functionality
   - Verify email delivery

3. **Production Deployment**
   ```bash
   # Merge to main branch for production deployment
   git checkout main
   git merge feature/email-config
   git push origin main
   ```

## Security Configuration

### Email Security Best Practices

1. **Use App Passwords**
   - Never use primary account passwords
   - Generate dedicated app passwords
   - Regularly rotate app passwords

2. **Implement Rate Limiting**

   ```env
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Enable TLS/SSL**

   ```env
   SMTP_SECURE=true  # For port 465
   SMTP_SECURE=false # For port 587 with STARTTLS
   ```

4. **Input Validation**
   - Email format validation
   - Content sanitization
   - XSS protection

### DNS Configuration

1. **SPF Record**

   ```dns
   lofersil.pt. IN TXT "v=spf1 include:_spf.google.com ~all"
   ```

2. **DKIM Configuration**
   - Generate DKIM keys with your email provider
   - Add public key to DNS records

3. **DMARC Record**
   ```dns
   _dmarc.lofersil.pt. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@lofersil.pt"
   ```

## Production Deployment

### Pre-Deployment Checklist

- [ ] SMTP credentials tested and verified
- [ ] Environment variables configured in Vercel
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] Email templates reviewed and tested
- [ ] Error handling and logging configured
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting set up

### Deployment Steps

1. **Configure Production Environment**

   ```bash
   # Set production environment variables in Vercel
   # Use production email addresses
   # Disable test mode
   EMAIL_TEST_MODE=false
   ```

2. **Deploy Application**

   ```bash
   git push origin main
   ```

3. **Verify Deployment**
   - Test contact form on production site
   - Check email delivery
   - Monitor error logs

### Monitoring Setup

1. **Email Delivery Monitoring**

   ```javascript
   // Add to contact.js
   console.log("Email delivery status:", {
     messageId: result.messageId,
     response: result.response,
     accepted: result.accepted,
     rejected: result.rejected,
     pending: result.pending,
   });
   ```

2. **Error Alerting**
   - Configure Vercel error notifications
   - Set up email alerts for critical failures
   - Monitor SMTP provider dashboards

## Advanced Configuration

### Multiple SMTP Providers

```javascript
// Configure fallback SMTP providers
const smtpProviders = [
  {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  },
  {
    host: process.env.BACKUP_SMTP_HOST,
    port: process.env.BACKUP_SMTP_PORT,
    secure: process.env.BACKUP_SMTP_SECURE,
    auth: {
      user: process.env.BACKUP_SMTP_USER,
      pass: process.env.BACKUP_SMTP_PASS,
    },
  },
];
```

### Email Templates

```javascript
// Enhanced email template
const emailTemplate = {
  subject: `Nova mensagem de contacto - ${name}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nova Mensagem de Contacto</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nova Mensagem de Contacto</h1>
        </div>
        <div class="content">
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
        <div class="footer">
          <p>Enviado através do formulário de contacto em ${new Date().toLocaleString("pt-PT")}</p>
          <p>LOFERSIL - Soluções de Embalagem</p>
        </div>
      </div>
    </body>
    </html>
  `,
};
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify app password is correct
   - Check 2FA is enabled
   - Ensure SMTP user is correct

2. **Connection Timeout**
   - Check firewall settings
   - Verify SMTP host and port
   - Test network connectivity

3. **Email Not Delivered**
   - Check spam folders
   - Verify SPF/DKIM records
   - Review SMTP provider logs

### Debug Mode

Enable debug logging for troubleshooting:

```env
EMAIL_LOG_LEVEL=debug
DEBUG=nodemailer
```

### Testing Tools

1. **Telnet SMTP Test**

   ```bash
   telnet smtp.gmail.com 587
   EHLO yourdomain.com
   ```

2. **Email Testing Services**
   - Mailtrap.io for development testing
   - Ethereal.email for temporary testing
   - Gmail's SMTP testing tool

## Support and Maintenance

### Regular Maintenance Tasks

- Monthly: Review email delivery rates
- Quarterly: Rotate app passwords
- Annually: Review and update security settings

### Monitoring Metrics

- Email delivery success rate
- Average response time
- Error rates by type
- SMTP provider status

### Contact Information

For email configuration issues:

- Technical Support: tech@lofersil.pt
- System Administrator: admin@lofersil.pt

---

**Last Updated:** December 2025  
**Version:** 1.0  
**Next Review:** March 2026
