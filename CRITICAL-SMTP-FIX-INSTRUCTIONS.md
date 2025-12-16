# CRITICAL: Gmail SMTP Authentication Fix - IMMEDIATE ACTION REQUIRED

## 🚨 BUSINESS IMPACT: HIGH

- Customers CANNOT contact the store
- Email system is COMPLETELY BROKEN
- All contact form submissions are failing
- This is blocking all customer communication

## 🔍 ROOT CAUSE ANALYSIS

The Gmail app password "pvlh kfrm tfnq qhij" is either:

1. **EXPIRED** - Gmail app passwords expire after a certain time
2. **REVOKED** - Password may have been revoked from Google Account
3. **INVALID FORMAT** - Password format may be incorrect
4. **ACCOUNT CHANGES** - 2-Step Verification settings may have changed

## 🛠️ IMMEDIATE FIX REQUIRED

### Step 1: Generate New Gmail App Password (URGENT)

1. **Go to Google Account**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (must be enabled)
3. **App passwords** → **Select app**: "Mail"
4. **Select device**: "Other (Custom name)" → Enter "LOFERSIL Contact Form"
5. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

### Step 2: Update Environment Variables

**For Local Development (.env.local):**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pedroocalado@gmail.com
SMTP_PASS=YOUR_NEW_16_CHAR_APP_PASSWORD
FROM_EMAIL=pedroocalado@gmail.com
TO_EMAIL=pedroocalado@gmail.com
CONTACT_EMAIL=contact@lofersil.pt
```

**For Production (Vercel Dashboard):**

1. Go to Vercel Project → Settings → Environment Variables
2. Update `SMTP_PASS` with the new app password
3. Redeploy the application

### Step 3: Test the Fix

Run this command to test:

```bash
node test-smtp-auth.js
```

## 📋 VERIFICATION CHECKLIST

- [ ] Generate new Gmail app password
- [ ] Update local environment variables
- [ ] Update production environment variables
- [ ] Test SMTP connection locally
- [ ] Test contact form functionality
- [ ] Verify email delivery
- [ ] Check health endpoint status

## 🔧 ALTERNATIVE SOLUTIONS

If Gmail app passwords don't work:

### Option 1: Use SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
```

### Option 2: Use Resend

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=YOUR_RESEND_API_KEY
```

## ⚡ TEMPORARY WORKAROUND

While fixing authentication, the contact form will:

- Accept submissions but show "email service unavailable"
- Log all submissions for manual follow-up
- Store contact data for later processing

## 🚀 DEPLOYMENT INSTRUCTIONS

1. **Update environment variables immediately**
2. **Test locally first**: `node test-smtp-auth.js`
3. **Deploy to production**: Vercel will auto-deploy on env var changes
4. **Verify health endpoint**: `/api/health`
5. **Test contact form end-to-end**

## 📞 SUPPORT

If you need help:

1. Check Gmail account security settings
2. Verify 2-Step Verification is enabled
3. Ensure app password is correctly copied (no spaces)
4. Test with a different Gmail account if needed

---

**TIME CRITICAL**: This issue must be resolved within 1-2 hours to restore customer contact functionality.
