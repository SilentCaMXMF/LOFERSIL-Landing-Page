# Vercel Environment Variables Configuration Guide

This guide explains how to configure environment variables in Vercel for serverless functions and production deployment.

## Why Configure Environment Variables in Vercel?

While GitHub Actions passes environment variables during the build process for client-side code, **Vercel serverless functions** (like API routes) require environment variables to be configured directly in Vercel. This ensures they have access to secrets at runtime.

## Required Vercel Environment Variables

Configure these variables in your Vercel project dashboard under **Settings → Environment Variables**.

### Production Environment Variables

| Variable      | Value Source        | Required | Description            |
| ------------- | ------------------- | -------- | ---------------------- |
| `NODE_ENV`    | `production`        | Yes      | Environment mode       |
| `WEBSITE_URL` | Your production URL | Yes      | Production website URL |

| `SMTP_HOST` | Your SMTP host | No | Email server hostname |
| `SMTP_PORT` | Your SMTP port | No | Email server port |
| `SMTP_SECURE` | `true`/`false` | No | SMTP secure connection |
| `SMTP_USER` | Your SMTP username | No | Email server username |
| `SMTP_PASS` | Your SMTP password | No | Email server password |
| `FROM_EMAIL` | Your sender email | No | Email sender address |
| `TO_EMAIL` | Your contact email | No | Email recipient address |
| `ALLOWED_ORIGINS` | Your allowed origins | No | CORS allowed origins |
| `GOOGLE_ANALYTICS_ID` | Your GA ID | No | Google Analytics tracking ID |
| `HOTJAR_ID` | Your Hotjar ID | No | Hotjar tracking ID |
| `SENTRY_DSN` | Your Sentry DSN | No | Sentry error tracking DSN |
| `TELEGRAM_BOT_TOKEN` | Your bot token | No | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Your chat ID | No | Telegram chat ID |
| `ENABLE_ANALYTICS` | `true`/`false` | No | Enable analytics |
| `ENABLE_ERROR_TRACKING` | `true`/`false` | No | Enable error tracking |
| `ENABLE_PERFORMANCE_MONITORING` | `true`/`false` | No | Enable performance monitoring |

## How to Configure in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project dashboard
   - Click on **Settings** tab

2. **Environment Variables Section**
   - Scroll down to **Environment Variables**
   - Click **Add New**

3. **Add Each Variable**
   - **Name**: Enter the variable name (e.g., `GEMINI_API_KEY`)
   - **Value**: Enter the actual secret value
   - **Environment**: Select `Production` (and optionally `Preview` for staging)
   - Click **Save**

4. **Repeat for All Variables**
   - Add all required variables following the table above

## Environment Variable Groups

You can create environment variable groups in Vercel for better organization:

1. Go to your Vercel dashboard
2. Navigate to **Storage** → **Environment Groups**
3. Create groups like:
   - `API_KEYS` - For all API keys
   - `EMAIL_CONFIG` - For SMTP settings
   - `ANALYTICS` - For tracking configurations

## Security Best Practices

- **Never commit secrets** to version control
- **Use strong, unique values** for all secrets
- **Rotate secrets regularly** (at least annually)
- **Limit secret scope** to only necessary environments
- **Monitor secret usage** through Vercel dashboard

## Testing Configuration

After configuring environment variables:

1. **Deploy to preview** to test non-production builds
2. **Check Vercel function logs** for any missing environment variables
3. **Test serverless functions** that depend on these variables
4. **Verify client-side functionality** that uses injected variables

## Troubleshooting

### Common Issues

- **Function fails with missing env var**: Check Vercel dashboard configuration
- **Build succeeds but runtime fails**: Environment variables not set in Vercel
- **Wrong environment scope**: Ensure variables are set for correct environments

### Debugging Steps

1. Check Vercel function logs in dashboard
2. Verify environment variable names match exactly
3. Ensure variables are set for the correct environment (Production/Preview)
4. Test with simple function that logs environment variables

## Integration with GitHub Secrets

The GitHub Actions workflows now pass environment variables during the build process for client-side code. However, serverless functions require Vercel-specific configuration as described above.

## Next Steps

After configuring Vercel environment variables:

1. Test a deployment to ensure everything works
2. Update your team's documentation with secret management procedures
3. Set up monitoring for secret rotation and access
