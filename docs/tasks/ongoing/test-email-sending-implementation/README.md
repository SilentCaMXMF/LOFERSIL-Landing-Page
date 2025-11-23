# Test Email Sending Implementation

Objective: Comprehensive testing plan for Gmail SMTP integration with contact form to ensure emails are properly sent from pedroocalado@gmail.com to a35255@campus.fcsh.unl.pt.

Status legend: [ ] todo, [~] in-progress, [x] done

Tasks

- [x] 01 — verify-github-secrets → `01-verify-github-secrets.md`
- [ ] 02 — verify-vercel-variables → `02-verify-vercel-variables.md`
- [ ] 03 — test-environment-access → `03-test-environment-access.md`
- [ ] 04 — deploy-and-trigger → `04-deploy-and-trigger.md`
- [ ] 05 — test-contact-form-submission → `05-test-contact-form-submission.md`
- [ ] 06 — verify-email-receipt → `06-verify-email-receipt.md`
- [ ] 07 — check-function-logs → `07-check-function-logs.md`
- [ ] 08 — test-email-formatting → `08-test-email-formatting.md`
- [ ] 09 — test-error-handling → `09-test-error-handling.md`
- [ ] 10 — test-reply-to-functionality → `10-test-reply-to-functionality.md`
- [ ] 11 — document-results → `11-document-results.md`

Dependencies

- 02 depends on 01
- 03 depends on 02
- 04 depends on 03
- 05 depends on 04
- 06 depends on 05
- 07 depends on 06
- 08 depends on 07
- 09 depends on 08
- 10 depends on 09
- 11 depends on 10

Exit criteria

- All email functionality tested successfully with proper SMTP integration, environment variables verified, and comprehensive documentation completed.

## Prerequisites

- ✅ GitHub Secrets configured with SMTP variables
- ✅ Vercel environment variables set
- ✅ Latest code deployed with email integration

## Testing Tasks

### Phase 1: Environment Verification (High Priority)

#### 01-verify-github-secrets.md

- Verify all 8 SMTP secrets are present in GitHub repository
- Check secret names match exactly: SMTP_HOST, SMTP_PORT, etc.
- Confirm values are correct (no typos)

#### 02-verify-vercel-variables.md

- Verify all 8 environment variables in Vercel dashboard
- Check Production scope is set
- Confirm values match GitHub Secrets

#### 03-test-environment-access.md

- Test `/api/test-env.js` endpoint
- Verify all variables are accessible at runtime
- Check for any missing or undefined variables

### Phase 2: Functional Testing (High Priority)

#### 04-deploy-and-trigger.md

- Deploy latest changes to trigger GitHub Actions
- Monitor deployment for any errors
- Verify build completes with environment variables

#### 05-test-contact-form-submission.md

- Submit valid test form on deployed site
- Use test data: Name="Test User", Email="test@example.com"
- Verify form submission succeeds without errors

#### 06-verify-email-receipt.md

- Check email at `a35255@campus.fcsh.unl.pt`
- Look in both inbox and spam folder
- Verify email content and formatting

### Phase 3: Validation Testing (Medium Priority)

#### 07-check-function-logs.md

- Review Vercel function logs for `/api/contact`
- Verify SMTP authentication succeeds
- Check for email delivery confirmation

#### 08-test-email-formatting.md

- Verify HTML email formatting is correct
- Check all form data is included
- Confirm Portuguese text displays properly

#### 09-test-error-handling.md

- Test invalid form submissions
- Verify proper error messages
- Ensure no emails sent for invalid data

### Phase 4: Advanced Testing (Low Priority)

#### 10-test-reply-to-functionality.md

- Reply to received test email
- Verify reply goes to submitter's email
- Confirm reply-to header works correctly

#### 11-document-results.md

- Record all test results
- Document any issues found
- Create troubleshooting procedures
- Update team documentation

## Test Data

### Valid Test Submission

```json
{
  "name": "Pedro Test",
  "email": "pedro.test@example.com",
  "message": "Este é um teste para verificar que o sistema de envio de emails está funcionando corretamente com a integração SMTP do Gmail."
}
```

### Invalid Test Cases

- Empty name field
- Invalid email format
- Short message (< 10 characters)
- Very long message (> 2000 characters)

## Success Criteria

- ✅ Environment variables accessible in production
- ✅ Contact form submits successfully
- ✅ Email received at university address
- ✅ Professional email formatting
- ✅ Proper error handling
- ✅ Clean function logs

## Troubleshooting Guide

### Common Issues

- **Authentication Failed**: Check Gmail app password
- **Connection Refused**: Verify SMTP settings
- **Email Not Received**: Check spam folder
- **Function Errors**: Review Vercel logs

### Debug Commands

```bash
# Test environment variables
curl https://your-app.vercel.app/api/test-env

# Check function logs
vercel logs

# Test SMTP connection
telnet smtp.gmail.com 587
```

## Timeline

- **Phase 1**: 20 minutes
- **Phase 2**: 25 minutes
- **Phase 3**: 30 minutes
- **Phase 4**: 20 minutes
- **Total**: 95 minutes

## Security Notes

- Never share Gmail app password
- Use environment variables for all credentials
- Monitor for unauthorized access
- Rotate passwords regularly
