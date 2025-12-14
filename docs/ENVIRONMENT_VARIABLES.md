# Environment Variables Configuration

This document outlines the environment variables strategy for the LOFERSIL Landing Page deployment.

## Environment Files Structure

- `.env.example` - Template file with all available variables (safe to commit)
- `.env.local` - Local development overrides (never commit)
- `.env.development` - Development environment defaults
- `.env.production` - Production environment defaults

## Vercel Environment Variables

### Required for Production

Set these in your Vercel dashboard under **Settings → Environment Variables**:

#### Basic Configuration

- `NODE_ENV=production`
- `WEBSITE_URL=https://lofersil.pt`

#### Email Configuration (Contact Form)

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=your-email@gmail.com`
- `SMTP_PASS=your-app-password`
- `CONTACT_EMAIL=contact@lofersil.pt`

#### Security

- `CORS_ORIGIN=https://lofersil.pt`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

### Optional for Production

#### Analytics

- `GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX`
- `GOOGLE_TAG_MANAGER_ID=GTM-XXXXXXX`

#### AI Services

- `OPENAI_API_KEY=sk-your-openai-key`
- `GEMINI_API_KEY=your-gemini-key`

#### Integrations

- `ENABLE_MCP_INTEGRATION=false`
- `MCP_SERVER_URL=https://your-mcp-server.com`

## Environment-Specific Behavior

### Development

- Source maps enabled
- Debug logging enabled
- Hot reload active
- API endpoints use development data

### Production

- Source maps disabled
- Minified assets
- Optimized builds
- Rate limiting enabled
- Security headers enforced

## Setup Instructions

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your local development values
3. Run `npm run dev`

### Vercel Production Setup

1. Go to Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add all required production variables
4. Redeploy the application

### GitHub Actions

The workflow automatically uses Vercel environment variables. Ensure:

- `VERCEL_TOKEN` is set in GitHub repository secrets
- `VERCEL_ORG_ID` is set in GitHub repository secrets
- `VERCEL_PROJECT_ID` is set in GitHub repository secrets

## Security Notes

- Never commit `.env.local` or any file containing real API keys
- Use Vercel's encrypted environment variables for production
- Rotate API keys regularly
- Use app-specific passwords for SMTP (not regular passwords)
- Enable rate limiting in production

## Testing Environment Variables

Use the `/api/test-env` endpoint to verify environment variable access:

```bash
curl https://lofersil.pt/api/test-env
```

This will show which environment variables are properly configured (API keys are masked for security).
