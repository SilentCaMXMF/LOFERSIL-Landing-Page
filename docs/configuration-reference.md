# Configuration Reference

This document provides a comprehensive reference for all environment variables used in the LOFERSIL Landing Page application.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Email Configuration](#email-configuration)
- [Analytics & Tracking](#analytics--tracking)
- [AI Services](#ai-services)
- [Integrations](#integrations)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)

## Basic Configuration

### NODE_ENV
- **Type**: String
- **Default**: `development`
- **Required**: No
- **Description**: Specifies the environment the application is running in. Affects logging, error handling, and security settings.
- **Valid Values**: `development`, `production`, `test`
- **Used In**: All API endpoints, health checks, monitoring

### WEBSITE_URL
- **Type**: String
- **Default**: `https://lofersil.pt`
- **Required**: No
- **Description**: The base URL of the website. Used for generating absolute URLs and redirects.
- **Example**: `https://lofersil.pt`, `https://staging.lofersil.pt`
- **Used In**: Contact form responses, email templates, health checks

## Email Configuration

### SMTP_HOST
- **Type**: String
- **Default**: `smtp.gmail.com`
- **Required**: Yes (for email functionality)
- **Description**: The hostname of the SMTP server used for sending emails.
- **Examples**: `smtp.gmail.com`, `smtp.office365.com`, `localhost`
- **Used In**: Contact form API, health checks, email testing

### SMTP_PORT
- **Type**: Number
- **Default**: `587`
- **Required**: No
- **Description**: The port number for the SMTP server connection.
- **Common Values**: `587` (STARTTLS), `465` (SMTPS), `25` (plain)
- **Used In**: SMTP configuration, health checks

### SMTP_SECURE
- **Type**: Boolean (as string)
- **Default**: `false`
- **Required**: No
- **Description**: Whether to use a secure connection (TLS/SSL) for SMTP.
- **Valid Values**: `true`, `false`
- **Notes**: Set to `true` for port 465 (SMTPS), `false` for port 587 (STARTTLS)
- **Used In**: SMTP transport configuration

### SMTP_USER
- **Type**: String
- **Required**: Yes (for email functionality)
- **Description**: The username/email address for SMTP authentication.
- **Example**: `noreply@lofersil.pt`, `your-email@gmail.com`
- **Used In**: SMTP authentication, contact form

### SMTP_PASS
- **Type**: String
- **Required**: Yes (for email functionality)
- **Description**: The password or app-specific password for SMTP authentication.
- **Security**: Never log or expose this value
- **Used In**: SMTP authentication

### CONTACT_EMAIL
- **Type**: String
- **Default**: `contact@lofersil.pt`
- **Required**: No
- **Description**: The primary contact email address displayed on the website.
- **Used In**: Contact page, footer

### FROM_EMAIL
- **Type**: String
- **Default**: `noreply@lofersil.pt`
- **Required**: No
- **Description**: The email address used as the sender for outgoing emails.
- **Example**: `noreply@lofersil.pt`, `contact@lofersil.pt`
- **Used In**: Contact form emails, notifications

### TO_EMAIL
- **Type**: String
- **Default**: `admin@lofersil.pt`
- **Required**: No
- **Description**: The email address that receives contact form submissions.
- **Example**: `admin@lofersil.pt`, `support@lofersil.pt`
- **Used In**: Contact form processing

### EMAIL_REPLY_TO
- **Type**: String
- **Default**: `support@lofersil.pt`
- **Required**: No
- **Description**: The reply-to email address for outgoing emails.
- **Used In**: Email headers

### EMAIL_SUBJECT_PREFIX
- **Type**: String
- **Default**: `[LOFERSIL]`
- **Required**: No
- **Description**: Prefix added to all email subjects for easy identification.
- **Example**: `[LOFERSIL]`, `[Contact Form]`
- **Used In**: Email subject generation

### SMTP_TIMEOUT
- **Type**: Number
- **Default**: `30000`
- **Required**: No
- **Description**: Timeout in milliseconds for SMTP connections.
- **Unit**: Milliseconds
- **Used In**: SMTP transport configuration

### SMTP_RETRY_ATTEMPTS
- **Type**: Number
- **Default**: `3`
- **Required**: No
- **Description**: Number of retry attempts for failed email deliveries.
- **Used In**: Email sending logic

### EMAIL_TEST_MODE
- **Type**: Boolean (as string)
- **Default**: `true`
- **Required**: No
- **Description**: When enabled, emails are logged instead of actually sent.
- **Valid Values**: `true`, `false`
- **Notes**: Useful for development and testing
- **Used In**: Email sending logic

### EMAIL_LOG_LEVEL
- **Type**: String
- **Default**: `info`
- **Required**: No
- **Description**: Logging level for email-related operations.
- **Valid Values**: `error`, `warn`, `info`, `debug`
- **Used In**: Email logging configuration

## Analytics & Tracking

### GOOGLE_ANALYTICS_ID
- **Type**: String
- **Required**: No
- **Description**: Google Analytics tracking ID for website analytics.
- **Format**: `G-XXXXXXXXXX`
- **Example**: `G-ABC123DEF4`
- **Used In**: Analytics integration

### GOOGLE_TAG_MANAGER_ID
- **Type**: String
- **Required**: No
- **Description**: Google Tag Manager container ID for advanced tracking.
- **Format**: `GTM-XXXXXXX`
- **Example**: `GTM-ABC123D`
- **Used In**: Tag management integration

## AI Services

### OPENAI_API_KEY
- **Type**: String
- **Required**: No
- **Description**: OpenAI API key for AI-powered features.
- **Security**: Keep secret and never commit to version control
- **Used In**: AI integrations, MCP server

### GEMINI_API_KEY
- **Type**: String
- **Required**: No
- **Description**: Google Gemini API key for AI services.
- **Security**: Keep secret and never commit to version control
- **Used In**: AI integrations

## Integrations

### ENABLE_MCP_INTEGRATION
- **Type**: Boolean (as string)
- **Default**: `false`
- **Required**: No
- **Description**: Whether to enable MCP (Model Context Protocol) integration.
- **Valid Values**: `true`, `false`
- **Used In**: Feature toggling

### MCP_SERVER_URL
- **Type**: String
- **Required**: No (only if MCP integration is enabled)
- **Description**: URL of the MCP server for integration.
- **Example**: `https://your-mcp-server.com`
- **Used In**: MCP client configuration

### MCP_SERVER_PORT
- **Type**: Number
- **Required**: No
- **Description**: Port number for the MCP server.
- **Default**: 3001 (from code)
- **Used In**: MCP server startup

## Security

### CSRF_SECRET
- **Type**: String
- **Required**: No
- **Description**: Secret key used for generating CSRF tokens.
- **Security**: Keep secret and rotate regularly
- **Notes**: Auto-generated if not provided
- **Used In**: CSRF protection

### CORS_ORIGIN
- **Type**: String
- **Default**: `https://lofersil.pt`
- **Required**: No
- **Description**: Allowed origin for CORS requests.
- **Example**: `https://lofersil.pt`, `*` (not recommended for production)
- **Used In**: CORS configuration

### RATE_LIMIT_WINDOW_MS
- **Type**: Number
- **Default**: `900000`
- **Required**: No
- **Description**: Time window in milliseconds for rate limiting.
- **Unit**: Milliseconds
- **Default Equivalent**: 15 minutes
- **Used In**: Rate limiting configuration

### RATE_LIMIT_MAX_REQUESTS
- **Type**: Number
- **Default**: `100`
- **Required**: No
- **Description**: Maximum number of requests allowed per rate limit window.
- **Used In**: Rate limiting configuration

## Development

### DEBUG
- **Type**: Boolean (as string)
- **Default**: `false`
- **Required**: No
- **Description**: Enables debug mode for additional logging and error details.
- **Valid Values**: `true`, `false`
- **Used In**: Debug endpoints, logging

### LOG_LEVEL
- **Type**: String
- **Default**: `info`
- **Required**: No
- **Description**: General logging level for the application.
- **Valid Values**: `error`, `warn`, `info`, `debug`
- **Used In**: Logging configuration

## Deployment

### VERCEL
- **Type**: String
- **Required**: No (automatically set by Vercel)
- **Description**: Indicates if running on Vercel platform.
- **Value**: `1` when on Vercel
- **Used In**: Environment detection

### VERCEL_URL
- **Type**: String
- **Required**: No (automatically set by Vercel)
- **Description**: The deployment URL provided by Vercel.
- **Example**: `lofersil-landing-page.vercel.app`
- **Used In**: Health checks, URL generation

## Environment Variable Setup

### Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in the required values
3. Restart your development server

### Production (Vercel)
1. Go to your Vercel dashboard
2. Navigate to Project Settings > Environment Variables
3. Add each variable with its appropriate value
4. Redeploy the application

### Security Best Practices
- Never commit sensitive values (API keys, passwords) to version control
- Use environment-specific values for different deployment environments
- Rotate secrets regularly
- Use app-specific passwords for email services
- Enable 2FA on accounts that provide the credentials

## Validation

The application includes health check endpoints that validate email configuration:
- `/api/health` - General health check
- `/api/health/email` - Email-specific health check
- `/api/health/smtp` - SMTP connection health check

Check the health endpoints after configuration changes to ensure everything is working correctly.