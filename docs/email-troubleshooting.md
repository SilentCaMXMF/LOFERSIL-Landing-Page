# Email Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps diagnose and resolve common email issues with the LOFERSIL contact form system. It covers SMTP connection problems, email delivery issues, security concerns, and performance optimization.

## Table of Contents

1. [Quick Diagnosis Flowchart](#quick-diagnosis-flowchart)
2. [Common Error Messages](#common-error-messages)
3. [SMTP Connection Issues](#smtp-connection-issues)
4. [Email Delivery Problems](#email-delivery-problems)
5. [Authentication Issues](#authentication-issues)
6. [Rate Limiting & Security](#rate-limiting--security)
7. [Performance Issues](#performance-issues)
8. [Debugging Tools & Techniques](#debugging-tools--techniques)
9. [Preventive Maintenance](#preventive-maintenance)

## Quick Diagnosis Flowchart

```
Start → Email Not Sending?
├─ Yes → Check SMTP Configuration
│   ├─ Invalid Credentials? → Update App Password
│   ├─ Connection Timeout? → Check Network/Firewall
│   └─ Server Not Found? → Verify SMTP Host/Port
├─ No → Email Not Received?
│   ├─ Check Spam Folder
│   ├─ Verify Email Address
│   └─ Check DNS Records (SPF/DKIM)
└─ Other Issues → Check Logs & Error Messages
```

## Common Error Messages

### Authentication Errors

**Error:** `535 Authentication failed`

- **Cause:** Invalid credentials or app password
- **Solution:** Generate new app password, verify username

**Error:** `530 Must issue a STARTTLS command first`

- **Cause:** TLS configuration issue
- **Solution:** Set `SMTP_SECURE=false` for port 587

### Connection Errors

**Error:** `ECONNREFUSED`

- **Cause:** SMTP server not reachable
- **Solution:** Check firewall, verify host/port

**Error:** `ETIMEDOUT`

- **Cause:** Connection timeout
- **Solution:** Increase timeout, check network connectivity

**Error:** `ENOTFOUND`

- **Cause:** DNS resolution failure
- **Solution:** Verify SMTP hostname, check DNS settings

### Email Delivery Errors

**Error:** `550 User unknown`

- **Cause:** Invalid recipient email address
- **Solution:** Verify `TO_EMAIL` configuration

**Error:** `554 Message rejected`

- **Cause:** Spam filter or content issue
- **Solution:** Check email content, verify SPF/DKIM

## SMTP Connection Issues

### Problem: Cannot Connect to SMTP Server

**Symptoms:**

- Connection timeout errors
- Connection refused errors
- Network unreachable errors

**Diagnostic Steps:**

1. **Test Basic Connectivity**

   ```bash
   # Test DNS resolution
   nslookup smtp.gmail.com

   # Test port connectivity
   telnet smtp.gmail.com 587

   # Test with curl
   curl -v smtp://smtp.gmail.com:587
   ```

2. **Check Firewall Settings**

   ```bash
   # Check if port is blocked
   sudo ufw status
   sudo iptables -L

   # Test from different network
   # Try from mobile hotspot if possible
   ```

3. **Verify SMTP Configuration**

   ```javascript
   // Test configuration
   const config = {
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT),
     secure: process.env.SMTP_SECURE === "true",
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   };

   console.log("SMTP Config:", {
     host: config.host,
     port: config.port,
     secure: config.secure,
     user: config.auth.user,
   });
   ```

**Solutions:**

1. **Update Firewall Rules**

   ```bash
   # Allow outbound SMTP traffic
   sudo ufw allow out 587/tcp
   sudo ufw allow out 465/tcp
   ```

2. **Use Alternative Ports**

   ```env
   # Try port 25 (if available)
   SMTP_PORT=25
   SMTP_SECURE=false

   # Try port 465 (SSL)
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

3. **Check Network Configuration**
   - Verify proxy settings
   - Check VPN interference
   - Test from different network

### Problem: Intermittent Connection Issues

**Symptoms:**

- Emails sometimes send, sometimes fail
- Random timeout errors
- Inconsistent behavior

**Diagnostic Steps:**

1. **Monitor Connection Quality**

   ```javascript
   // Add connection monitoring
   const startTime = Date.now();
   try {
     await transporter.verify();
     const responseTime = Date.now() - startTime;
     console.log(`Connection verified in ${responseTime}ms`);
   } catch (error) {
     console.error(
       `Connection failed after ${Date.now() - startTime}ms:`,
       error,
     );
   }
   ```

2. **Check SMTP Provider Status**
   - Review provider dashboard
   - Check service status pages
   - Monitor rate limits

**Solutions:**

1. **Implement Connection Pooling**

   ```javascript
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: process.env.SMTP_SECURE,
     pool: true, // Enable connection pooling
     maxConnections: 5, // Maximum connections
     maxMessages: 100, // Messages per connection
     rateDelta: 1000, // Rate limit window
     rateLimit: 5, // Messages per window
   });
   ```

2. **Add Retry Logic**
   ```javascript
   // Enhanced retry configuration
   const retryConfig = {
     maxAttempts: 3,
     baseDelay: 1000,
     maxDelay: 30000,
     backoffMultiplier: 2,
     jitter: true,
   };
   ```

## Email Delivery Problems

### Problem: Emails Not Received

**Symptoms:**

- No error in application logs
- Email appears to send successfully
- Recipient never receives email

**Diagnostic Steps:**

1. **Check SMTP Logs**

   ```javascript
   // Enhanced logging
   const result = await transporter.sendMail(mailOptions);
   console.log("Email sent result:", {
     messageId: result.messageId,
     response: result.response,
     accepted: result.accepted,
     rejected: result.rejected,
     pending: result.pending,
   });
   ```

2. **Verify Email Addresses**

   ```javascript
   // Validate email format
   function validateEmail(email) {
     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return re.test(email);
   }

   console.log("From email valid:", validateEmail(process.env.FROM_EMAIL));
   console.log("To email valid:", validateEmail(process.env.TO_EMAIL));
   ```

3. **Check Spam Filters**
   - Check recipient's spam folder
   - Verify email content doesn't trigger spam filters
   - Review email headers

**Solutions:**

1. **Improve Email Content**

   ```javascript
   // Better email template
   const mailOptions = {
     from: process.env.FROM_EMAIL,
     to: process.env.TO_EMAIL,
     subject: `Contact Form Message - ${name}`,
     html: `
       <!DOCTYPE html>
       <html>
       <head>
         <meta charset="utf-8">
         <title>Contact Form Message</title>
       </head>
       <body style="font-family: Arial, sans-serif;">
         <h2>New Contact Form Submission</h2>
         <p><strong>Name:</strong> ${name}</p>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Message:</strong></p>
         <p>${message}</p>
         <hr>
         <p><small>Sent from LOFERSIL contact form</small></p>
       </body>
       </html>
     `,
     text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
     headers: {
       "X-Priority": "3",
       "X-Mailer": "LOFERSIL Contact Form",
     },
   };
   ```

2. **Configure DNS Records**

   ```dns
   ; SPF Record
   lofersil.pt. IN TXT "v=spf1 include:_spf.google.com ~all"

   ; DKIM Record (example)
   k1._domainkey.lofersil.pt. IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ..."

   ; DMARC Record
   _dmarc.lofersil.pt. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@lofersil.pt"
   ```

### Problem: Emails Going to Spam

**Symptoms:**

- Emails delivered but marked as spam
- Low delivery rates
- Recipients not seeing emails

**Diagnostic Steps:**

1. **Check Email Content**

   ```javascript
   // Spam score analysis
   function checkSpmyScore(content) {
     const spamTriggers = [
       /free money/i,
       /click here/i,
       /urgent/i,
       /limited time/i,
       /act now/i,
     ];

     let score = 0;
     spamTriggers.forEach((trigger) => {
       if (trigger.test(content)) score++;
     });

     return score;
   }
   ```

2. **Verify Email Headers**
   ```javascript
   // Check proper headers
   const headers = {
     From: process.env.FROM_EMAIL,
     "Reply-To": email,
     "Return-Path": process.env.FROM_EMAIL,
     "Message-ID": `<${Date.now()}@lofersil.pt>`,
     "X-Priority": "3",
     "X-Mailer": "LOFERSIL Contact Form",
   };
   ```

**Solutions:**

1. **Implement Email Authentication**
   - Set up SPF records
   - Configure DKIM signing
   - Implement DMARC policy

2. **Optimize Email Content**
   - Avoid spam trigger words
   - Use proper HTML structure
   - Include plain text version
   - Balance text-to-image ratio

## Authentication Issues

### Problem: Gmail App Password Issues

**Symptoms:**

- `535 Authentication failed` errors
- Credentials suddenly stop working
- 2FA-related problems

**Diagnostic Steps:**

1. **Verify 2FA Status**

   ```bash
   # Check if 2FA is enabled
   # Visit: https://myaccount.google.com/security
   ```

2. **Test App Password**

   ```javascript
   // Test with current credentials
   const testTransporter = nodemailer.createTransport({
     host: "smtp.gmail.com",
     port: 587,
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   try {
     await testTransporter.verify();
     console.log("✅ Gmail authentication successful");
   } catch (error) {
     console.error("❌ Gmail authentication failed:", error.message);
   }
   ```

**Solutions:**

1. **Generate New App Password**

   ```bash
   # Steps:
   # 1. Go to: https://myaccount.google.com/apppasswords
   # 2. Select "Mail" for app
   # 3. Select "Other (Custom name)" for device
   # 4. Name: "LOFERSIL Contact Form"
   # 5. Copy the 16-character password
   # 6. Update SMTP_PASS environment variable
   ```

2. **Enable Less Secure Apps (if necessary)**
   ```bash
   # Only for testing - not recommended for production
   # Visit: https://myaccount.google.com/lesssecureapps
   # Enable temporarily for testing
   ```

### Problem: Microsoft 365 Authentication

**Symptoms:**

- Authentication failures with Office 365
- Connection issues with Outlook SMTP
- License or permission problems

**Solutions:**

1. **Check SMTP Settings**

   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@company.com
   SMTP_PASS=your-app-password
   ```

2. **Verify Exchange Online License**
   - Ensure user has Exchange Online license
   - Check SMTP authentication is enabled
   - Verify mailbox is active

## Rate Limiting & Security

### Problem: Rate Limiting Errors

**Symptoms:**

- `429 Too many requests` errors
- `451 Temporary failure` messages
- Emails being throttled

**Diagnostic Steps:**

1. **Monitor Send Rate**

   ```javascript
   // Track email sending rate
   const emailTracker = {
     sent: 0,
     windowStart: Date.now(),
     windowSize: 60000, // 1 minute
     maxPerWindow: 10,
   };

   function checkRateLimit() {
     const now = Date.now();
     if (now - emailTracker.windowStart > emailTracker.windowSize) {
       emailTracker.sent = 0;
       emailTracker.windowStart = now;
     }

     if (emailTracker.sent >= emailTracker.maxPerWindow) {
       throw new Error("Rate limit exceeded");
     }

     emailTracker.sent++;
   }
   ```

**Solutions:**

1. **Implement Rate Limiting**

   ```javascript
   // Client-side rate limiting
   const rateLimiter = {
     attempts: {},
     maxAttempts: 3,
     windowMs: 15 * 60 * 1000, // 15 minutes

     checkLimit(ip) {
       const now = Date.now();
       if (!this.attempts[ip]) {
         this.attempts[ip] = { count: 0, resetTime: now + this.windowMs };
       }

       if (now > this.attempts[ip].resetTime) {
         this.attempts[ip] = { count: 0, resetTime: now + this.windowMs };
       }

       if (this.attempts[ip].count >= this.maxAttempts) {
         return false;
       }

       this.attempts[ip].count++;
       return true;
     },
   };
   ```

2. **Use Email Queue**
   ```javascript
   // Simple email queue
   class EmailQueue {
     constructor() {
       this.queue = [];
       this.processing = false;
     }

     async add(emailData) {
       this.queue.push(emailData);
       if (!this.processing) {
         this.process();
       }
     }

     async process() {
       this.processing = true;
       while (this.queue.length > 0) {
         const emailData = this.queue.shift();
         try {
           await this.sendEmail(emailData);
           await this.delay(1000); // 1 second between emails
         } catch (error) {
           console.error("Email send failed:", error);
         }
       }
       this.processing = false;
     }

     delay(ms) {
       return new Promise((resolve) => setTimeout(resolve, ms));
     }
   }
   ```

### Problem: Security Issues

**Symptoms:**

- Email injection attacks
- XSS in email content
- CSRF vulnerabilities

**Solutions:**

1. **Input Sanitization**

   ```javascript
   import DOMPurify from "dompurify";

   function sanitizeInput(input) {
     return DOMPurify.sanitize(input, {
       ALLOWED_TAGS: ["b", "i", "em", "strong"],
       ALLOWED_ATTR: [],
     });
   }

   // Sanitize form data
   const sanitizedName = sanitizeInput(name);
   const sanitizedMessage = sanitizeInput(message);
   ```

2. **Email Header Injection Prevention**

   ```javascript
   function preventHeaderInjection(value) {
     // Remove newlines and carriage returns
     return value.replace(/[\r\n]/g, "");
   }

   const safeSubject = preventHeaderInjection(`Contact Form - ${name}`);
   const safeFrom = preventHeaderInjection(process.env.FROM_EMAIL);
   ```

## Performance Issues

### Problem: Slow Email Sending

**Symptoms:**

- Long response times
- Timeout errors
- Poor user experience

**Diagnostic Steps:**

1. **Measure Performance**

   ```javascript
   const startTime = Date.now();

   try {
     const result = await transporter.sendMail(mailOptions);
     const duration = Date.now() - startTime;
     console.log(`Email sent in ${duration}ms`);

     if (duration > 5000) {
       console.warn("Slow email sending detected");
     }
   } catch (error) {
     console.error(`Email failed after ${Date.now() - startTime}ms:`, error);
   }
   ```

**Solutions:**

1. **Optimize SMTP Configuration**

   ```javascript
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: process.env.SMTP_SECURE,
     pool: true,
     maxConnections: 5,
     maxMessages: 100,
     rateDelta: 1000,
     rateLimit: 5,
     connectionTimeout: 60000,
     greetingTimeout: 30000,
     socketTimeout: 60000,
   });
   ```

2. **Implement Async Processing**

   ```javascript
   // Process email asynchronously
   export default async function handler(req, res) {
     // ... validation code ...

     // Respond immediately, process email in background
     res.status(200).json({
       success: true,
       message: "Message received. We will contact you soon.",
     });

     // Send email asynchronously
     sendEmailAsync({ name, email, message }).catch((error) => {
       console.error("Async email send failed:", error);
     });
   }

   async function sendEmailAsync(data) {
     // Email sending logic here
   }
   ```

## Debugging Tools & Techniques

### 1. Enable Debug Logging

```javascript
// Enable Nodemailer debug mode
process.env.DEBUG = "nodemailer";

// Custom debug logging
const debug = require("debug")("email:debug");

debug("SMTP Configuration:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
});
```

### 2. Use Email Testing Services

```javascript
// Mailtrap configuration for testing
const testTransporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "your-mailtrap-user",
    pass: "your-mailtrap-pass",
  },
});

// Ethereal.email for temporary testing
const testAccount = await nodemailer.createTestAccount();
const testTransporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
  },
});
```

### 3. Network Diagnostics

```bash
# Test SMTP connectivity
openssl s_client -connect smtp.gmail.com:587 -starttls smtp

# Check DNS records
dig lofersil.pt TXT
dig lofersil.pt MX

# Test email routing
swaks --to test@lofersil.pt --from test@example.com --server smtp.gmail.com:587
```

### 4. Email Validation Tools

```javascript
// Advanced email validation
async function validateEmailAdvanced(email) {
  // Syntax check
  const syntaxValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!syntaxValid) return false;

  // DNS MX record check
  const domain = email.split("@")[1];
  try {
    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    return false;
  }
}
```

## Preventive Maintenance

### Regular Checks

1. **Daily Monitoring**
   - Check email delivery rates
   - Monitor error logs
   - Verify SMTP provider status

2. **Weekly Maintenance**
   - Review email content performance
   - Check spam complaint rates
   - Update security settings

3. **Monthly Reviews**
   - Analyze email metrics
   - Update DNS records if needed
   - Review rate limiting settings

### Health Checks

```javascript
// Automated health check
async function emailHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    smtpConnection: false,
    emailDelivery: false,
    dnsRecords: false,
    rateLimit: false,
  };

  try {
    // Test SMTP connection
    await transporter.verify();
    results.smtpConnection = true;

    // Test email delivery
    const testResult = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject: "Health Check Test",
      text: "This is a health check test email.",
    });
    results.emailDelivery = true;

    // Check DNS records
    const mxRecords = await resolveMx("lofersil.pt");
    results.dnsRecords = mxRecords.length > 0;

    // Check rate limiting
    results.rateLimit = rateLimiter.checkLimit("health-check");
  } catch (error) {
    console.error("Health check failed:", error);
  }

  return results;
}
```

### Alert Configuration

```javascript
// Alert system for critical issues
class EmailAlertSystem {
  async sendAlert(issue, details) {
    const alertMessage = `
       🚨 EMAIL SYSTEM ALERT 🚨
       
       Issue: ${issue}
       Details: ${JSON.stringify(details, null, 2)}
       Timestamp: ${new Date().toISOString()}
       
       Please investigate immediately.
     `;

    // Send alert to administrators
    await this.sendAdminAlert(alertMessage);
  }

  async sendAdminAlert(message) {
    // Implementation for sending alerts
    // Could be email, Slack, SMS, etc.
  }
}
```

## Emergency Procedures

### Complete Email Failure

1. **Immediate Actions**
   - Check SMTP provider status
   - Verify environment variables
   - Review recent changes

2. **Fallback Procedures**
   - Switch to backup SMTP provider
   - Enable manual email collection
   - Notify users of temporary issues

3. **Recovery Steps**
   - Fix underlying issue
   - Clear email queue
   - Monitor system stability

### Security Incident Response

1. **Containment**
   - Disable email functionality
   - Rotate SMTP credentials
   - Review access logs

2. **Investigation**
   - Analyze attack vectors
   - Review email logs
   - Identify affected users

3. **Recovery**
   - Patch vulnerabilities
   - Update security measures
   - Communicate with stakeholders

---

**Last Updated:** December 2025  
**Version:** 1.0  
**Next Review:** March 2026  
**Emergency Contact:** admin@lofersil.pt
