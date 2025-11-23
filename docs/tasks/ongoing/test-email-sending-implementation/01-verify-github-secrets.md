# Verify GitHub Secrets Configuration

## Task

Verify all SMTP secrets are properly configured in GitHub repository.

## Steps

1. Navigate to GitHub repository
2. Go to Settings → Secrets and variables → Actions
3. Verify these secrets exist with correct values:
   - SMTP_HOST = smtp.gmail.com
   - SMTP_PORT = 587
   - SMTP_SECURE = false
   - SMTP_USER = pedroocalado@gmail.com
   - SMTP_PASS = siit szqr mqoy wpdt
   - FROM_EMAIL = pedroocalado@gmail.com
   - TO_EMAIL = a35255@campus.fcsh.unl.pt
   - ALLOWED_ORIGINS = https://lofersil.vercel.app

## Success Criteria

- All 8 secrets are present
- Names match exactly (case-sensitive)
- Values are correct (no typos)

## Time Estimate: 5 minutes
