# GitHub Secrets Configuration Guide

This document outlines all the environment variables that need to be configured as GitHub Secrets for secure deployment.

## Required GitHub Secrets

### Authentication & Deployment

- `VERCEL_TOKEN` - Vercel deployment token (get from Vercel dashboard)
- `VERCEL_ORG_ID` - Vercel organization ID (get from Vercel dashboard)
- `VERCEL_PROJECT_ID` - Vercel project ID (get from Vercel dashboard)

### AI API Keys

- `GEMINI_API_KEY` - Google Gemini API key (get from https://makersuite.google.com/app/apikey)
- `OPENAI_API_KEY` - OpenAI API key (get from https://platform.openai.com/api-keys)
- `CONTEXT7_API_KEY` - Context7 API key

### Email Configuration (SMTP)

- `SMTP_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (e.g., 587)
- `SMTP_SECURE` - SMTP secure flag (true/false)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password/app password
- `FROM_EMAIL` - Sender email address
- `TO_EMAIL` - Recipient email address
- `ALLOWED_ORIGINS` - CORS allowed origins (e.g., https://lofersil.vercel.app)

### Analytics & Monitoring

- `GOOGLE_ANALYTICS_ID` - Google Analytics tracking ID
- `HOTJAR_ID` - Hotjar tracking ID
- `SENTRY_DSN` - Sentry error tracking DSN

### Telegram Bot Configuration

- `TELEGRAM_BOT_TOKEN` - Telegram bot token (get from @BotFather)
- `TELEGRAM_CHAT_ID` - Telegram chat ID
- `TELEGRAM_BOT_USERNAME` - Bot username (e.g., @YourBotUsername)
- `TELEGRAM_TEST_CHAT_ID` - Test chat ID for development

### Application Configuration

- `WEBSITE_URL` - Production website URL (e.g., https://lofersil.vercel.app)
- `CONTACT_EMAIL` - Public contact email
- `PHONE_NUMBER` - Contact phone number
- `COMPANY_NAME` - Company name (LOFERSIL)
- `COMPANY_DESCRIPTION` - Company description
- `SITE_NAME` - Site name for SEO (LOFERSIL)
- `SITE_TITLE` - Site title
- `SITE_DESCRIPTION` - Site description
- `OG_IMAGE_URL` - OpenGraph image URL

### Feature Flags

- `ENABLE_ANALYTICS` - Enable analytics (true/false)
- `ENABLE_ERROR_TRACKING` - Enable error tracking (true/false)
- `ENABLE_PERFORMANCE_MONITORING` - Enable performance monitoring (true/false)
- `ENABLE_MCP_INTEGRATION` - Enable MCP integration (true/false)

### MCP Configuration

- `MCP_API_KEY` - MCP server authentication key
- `MCP_SERVER_URL` - MCP server URL
- `MCP_CLIENT_ID` - MCP client identifier
- `MCP_RECONNECT_INTERVAL` - Reconnection interval (ms)
- `MCP_MAX_RECONNECT_ATTEMPTS` - Max reconnection attempts

## How to Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value
5. Use the names exactly as listed above

## Important Notes

- **Never commit actual secret values** to the repository
- **Use strong, unique passwords** for SMTP and API keys
- **Test thoroughly** after configuration changes
- **Rotate secrets regularly** for security
- **Document secret purposes** for team members

## Environment Variable Mapping

The build process will automatically map these GitHub Secrets to environment variables during deployment. No changes to the application code are required.
