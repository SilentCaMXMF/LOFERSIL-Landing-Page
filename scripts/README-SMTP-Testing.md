# SMTP Connection Testing Infrastructure

This directory contains the Phase 1 SMTP Connection Testing Infrastructure for Gmail SMTP setup.

## Files

### 1. `scripts/test-smtp-connection.js`

Standalone SMTP connection test script that:

- Tests Gmail SMTP connectivity with provided credentials
- Verifies authentication with App Password
- Checks TLS/SSL configuration
- Provides detailed success/failure feedback in Portuguese
- Tests connection timeout handling
- Includes comprehensive error handling

### 2. `api/test-smtp.js`

Vercel serverless test endpoint that:

- Tests Gmail connection from serverless environment
- Verifies environment variables are loaded
- Returns detailed status for debugging
- Handles Vercel timeout constraints (10 seconds)
- Provides JSON response with test results

### 3. `scripts/run-smtp-test.js`

Quick test runner that:

- Validates both implementations
- Sets default environment variables if needed
- Provides clean test result summary

## Environment Variables

Required environment variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pedroocalado@gmail.com
SMTP_PASS=pvlh kfrm tfnq qhij
FROM_EMAIL=pedroocalado@gmail.com
TO_EMAIL=pedroocalado@gmail.com
```

## Usage

### Standalone Testing

```bash
# Run the standalone test script
node scripts/test-smtp-connection.js

# Or use the quick test runner
node scripts/run-smtp-test.js
```

### API Testing

```bash
# Test connection only
curl https://your-domain.vercel.app/api/test-smtp

# Test connection and email sending
curl "https://your-domain.vercel.app/api/test-smtp?sendEmail=true"

# POST request with email sending
curl -X POST https://your-domain.vercel.app/api/test-smtp \
  -H "Content-Type: application/json" \
  -d '{"sendEmail": true}'
```

## Test Results

Both implementations provide detailed test results including:

1. **Environment Check**: Validates all required variables
2. **Connection Test**: Verifies SMTP server connectivity
3. **Authentication Test**: Validates Gmail App Password
4. **TLS/SSL Test**: Checks secure connection configuration
5. **Email Test**: Sends test email (optional)

## Features

### Portuguese Error Messages

All error messages and feedback are provided in Portuguese for better user experience.

### Comprehensive Error Handling

- Connection timeout detection
- Authentication failure analysis
- TLS/SSL configuration validation
- Gmail-specific error guidance

### Vercel Optimization

- 8-second timeout constraints
- Serverless environment compatibility
- CORS headers for web access
- JSON response format

### Security

- App Password validation
- Secure connection enforcement
- Environment variable masking
- Error message sanitization

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify App Password is correctly generated
   - Check 2-factor authentication is enabled
   - Ensure "Less secure app access" is properly configured

2. **Connection Timeout**
   - Check network connectivity
   - Verify firewall settings
   - Confirm SMTP server accessibility

3. **TLS/SSL Issues**
   - Ensure correct port (587 for STARTTLS, 465 for SSL/TLS)
   - Verify secure flag matches port configuration

### Debug Mode

For detailed debugging, the standalone script provides:

- Step-by-step progress logging
- Detailed error messages
- Connection timing information
- Server response details

## Next Steps

After successful testing:

1. Deploy to Vercel
2. Test API endpoint in production
3. Integrate with contact form
4. Set up monitoring and alerts
5. Configure production email templates

## Dependencies

- `nodemailer`: SMTP client library
- Node.js 18+ (for ES modules)
- Vercel (for serverless deployment)

## Security Notes

- Never commit actual credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate App Passwords
- Monitor for unauthorized access attempts
- Implement rate limiting in production
