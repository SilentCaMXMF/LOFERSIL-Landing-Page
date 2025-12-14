# LOFERSIL Landing Page

A modern, responsive landing page for LOFERSIL - Soluções de Embalagem, featuring a contact form with email functionality, multi-language support, and comprehensive monitoring.

## 🚀 Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Multi-language Support**: Portuguese and English language options
- **Contact Form**: Secure email delivery with advanced error handling
- **Email Monitoring**: Real-time monitoring and alerting system
- **Performance Optimized**: Fast loading times and SEO friendly
- **Accessibility**: WCAG 2.1 compliant with full keyboard navigation
- **Security**: XSS protection, CSRF protection, and input sanitization

## 📧 Email System Overview

The LOFERSIL landing page includes a comprehensive email system for handling contact form submissions. The system features:

- **SMTP Integration**: Support for Gmail, Outlook, and custom SMTP providers
- **Advanced Error Handling**: Automatic retry logic with exponential backoff
- **Real-time Monitoring**: Performance metrics and alerting
- **Security Features**: Rate limiting, input sanitization, and spam protection
- **Maintenance Tools**: Automated health checks and incident response

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ and npm installed
- SMTP email service (Gmail, Outlook, or custom)
- Vercel account for deployment

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/LOFERSIL-Landing-Page.git
   cd LOFERSIL-Landing-Page
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

4. **Set up email configuration** (see [Email Configuration Guide](docs/email-configuration.md))

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```bash
   http://localhost:3000
   ```

## 📧 Email Setup Instructions

### 1. Configure SMTP Provider

Choose your SMTP provider and follow the setup instructions:

#### Gmail/Google Workspace

1. Enable 2-Factor Authentication
2. Generate an App Password
3. Configure environment variables:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

#### Microsoft 365/Outlook

1. Enable 2-Factor Authentication
2. Create App Password
3. Configure environment variables:
   ```env
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@company.com
   SMTP_PASS=your-app-password
   ```

#### Custom SMTP Provider

1. Gather SMTP server details
2. Configure environment variables:
   ```env
   SMTP_HOST=your-smtp-server.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-username
   SMTP_PASS=your-password
   ```

### 2. Environment Configuration

Create a `.env.local` file with the following configuration:

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

# Website Configuration
NODE_ENV=development
WEBSITE_URL=https://lofersil.pt
```

### 3. Test Email Configuration

1. **Run the email test script**

   ```bash
   npm run test:email
   ```

2. **Test the contact form**
   - Open `http://localhost:3000`
   - Fill out the contact form with test data
   - Submit and check for email delivery

3. **Check console logs** for email sending status

### 4. Production Deployment

1. **Configure Vercel Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all SMTP configuration variables
   - Set environment to "Production"

2. **Deploy to Vercel**

   ```bash
   git push origin main
   ```

3. **Verify production email functionality**
   - Test contact form on production site
   - Check email delivery
   - Monitor error logs

## 📊 Email Monitoring and Maintenance

### Monitoring Dashboard

Access the email monitoring dashboard at `/admin/email-monitoring` to view:

- Real-time email metrics
- Delivery success rates
- Response time analytics
- Error distribution
- System health status

### Health Checks

The system includes automated health checks for:

- SMTP connection status
- Environment variable validation
- DNS record verification
- Performance metrics
- Error rate monitoring

### Alert System

Configure alerts for:

- Critical service failures
- Performance degradation
- High error rates
- Security issues

### Maintenance Procedures

- **Daily**: Automated health checks and performance monitoring
- **Weekly**: System health review and log cleanup
- **Monthly**: Comprehensive performance analysis and security audit

## 🛠️ Development

### Build Commands

```bash
# Build for production
npm run build

# Run development server
npm run dev

# Run tests
npm run test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
├── api/                    # API endpoints
│   └── contact.js         # Contact form email handler
├── docs/                  # Documentation
│   ├── email-configuration.md
│   ├── email-troubleshooting.md
│   └── email-monitoring-guide.md
├── src/                   # Source code
│   ├── scripts/          # TypeScript modules
│   ├── styles/           # CSS stylesheets
│   └── locales/          # Translation files
├── assets/               # Static assets
└── tools/               # Utility scripts
```

### Email System Architecture

```
Contact Form → Frontend Validation → API Endpoint → Email Service → SMTP Provider
     ↓              ↓                    ↓              ↓              ↓
   Client Side   Input Sanitization   Rate Limiting   Retry Logic    Email Delivery
     ↓              ↓                    ↓              ↓              ↓
   User Input   Security Checks      Error Handling  Monitoring    Delivery Confirmation
```

## 🔧 Configuration

### Environment Variables

| Variable              | Required | Description                  | Default   |
| --------------------- | -------- | ---------------------------- | --------- |
| `SMTP_HOST`           | Yes      | SMTP server hostname         | -         |
| `SMTP_PORT`           | Yes      | SMTP server port             | 587       |
| `SMTP_SECURE`         | Yes      | Use SSL/TLS connection       | false     |
| `SMTP_USER`           | Yes      | SMTP authentication username | -         |
| `SMTP_PASS`           | Yes      | SMTP authentication password | -         |
| `FROM_EMAIL`          | No       | From email address           | SMTP_USER |
| `TO_EMAIL`            | No       | Destination email address    | SMTP_USER |
| `SMTP_TIMEOUT`        | No       | Connection timeout (ms)      | 30000     |
| `SMTP_RETRY_ATTEMPTS` | No       | Number of retry attempts     | 3         |
| `EMAIL_TEST_MODE`     | No       | Enable test mode             | false     |

### Advanced Configuration

#### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

#### Security

```env
CORS_ORIGIN=https://lofersil.pt  # Allowed origins
ENABLE_CSRF_PROTECTION=true      # CSRF protection
```

#### Monitoring

```env
EMAIL_LOG_LEVEL=info             # Log level (debug, info, warn, error)
ENABLE_METRICS=true              # Enable performance metrics
```

## 🧪 Testing

### Email Testing

Run comprehensive email tests:

```bash
# Test SMTP connection
npm run test:smtp

# Test email templates
npm run test:templates

# Test error handling
npm run test:email-errors

# Run all email tests
npm run test:email-all
```

### Test Coverage

The email system includes tests for:

- SMTP connection testing
- Email template validation
- Error handling and retry logic
- Security and input sanitization
- Performance and load testing
- End-to-end email delivery

## 🔍 Troubleshooting

### Common Issues

#### Email Not Sending

1. Check SMTP credentials in environment variables
2. Verify network connectivity to SMTP server
3. Check for rate limiting or provider restrictions
4. Review error logs in browser console and server logs

#### Authentication Errors

1. Generate new app password for Gmail/Outlook
2. Verify 2FA is enabled
3. Check SMTP username and password

#### Delivery Issues

1. Check recipient email address
2. Verify SPF/DKIM DNS records
3. Check spam filters and email content

### Debug Mode

Enable debug logging:

```env
EMAIL_LOG_LEVEL=debug
DEBUG=nodemailer
```

### Support Resources

- [Email Configuration Guide](docs/email-configuration.md)
- [Email Troubleshooting Guide](docs/email-troubleshooting.md)
- [Email Monitoring Guide](docs/email-monitoring-guide.md)

## 📈 Performance

### Optimization Features

- **Connection Pooling**: Reuse SMTP connections for better performance
- **Email Queue**: Handle high volume with queuing system
- **Caching**: Cache email templates and configurations
- **Compression**: Optimize email content for faster delivery

### Performance Metrics

Target performance metrics:

- **Email Response Time**: < 2 seconds
- **Success Rate**: > 99%
- **System Uptime**: > 99.9%
- **Error Rate**: < 0.5%

## 🔒 Security

### Security Features

- **Input Sanitization**: Prevent XSS and injection attacks
- **Rate Limiting**: Prevent spam and abuse
- **CSRF Protection**: Prevent cross-site request forgery
- **Content Security Policy**: Restrict resource loading
- **HTTPS Only**: Enforce secure connections

### Security Best Practices

1. **Use App Passwords**: Never use primary account passwords
2. **Enable 2FA**: Require two-factor authentication
3. **Regular Updates**: Keep dependencies updated
4. **Monitor Logs**: Review security logs regularly
5. **Access Control**: Limit access to email configuration

## 📚 Documentation

### Email System Documentation

- **[Email Configuration Guide](docs/email-configuration.md)**: Complete setup and configuration instructions
- **[Email Troubleshooting Guide](docs/email-troubleshooting.md)**: Common issues and solutions
- **[Email Monitoring Guide](docs/email-monitoring-guide.md)**: Monitoring and maintenance procedures

### API Documentation

#### Contact Form Endpoint

**POST** `/api/contact`

Submit contact form data:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message sent successfully!",
  "emailSent": true,
  "timestamp": "2025-12-13T10:30:00.000Z"
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings

2. **Environment Variables**
   - Add all required environment variables
   - Set appropriate values for production

3. **Deploy**
   - Automatic deployment on git push
   - Preview deployments for pull requests

### Environment-Specific Configuration

#### Development

```env
NODE_ENV=development
EMAIL_TEST_MODE=true
EMAIL_LOG_LEVEL=debug
```

#### Production

```env
NODE_ENV=production
EMAIL_TEST_MODE=false
EMAIL_LOG_LEVEL=info
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Style

- Use TypeScript for new code
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation

## 📞 Support

### Technical Support

For email system issues:

- **Email**: tech@lofersil.pt
- **Documentation**: See guides in `/docs/` directory
- **Issues**: Create GitHub issue for bugs

### Emergency Contacts

For critical email system failures:

- **System Administrator**: admin@lofersil.pt
- **On-call Support**: emergency@lofersil.pt

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Version History

### v2.0.0 (December 2025)

- Added comprehensive email system
- Implemented real-time monitoring
- Added advanced error handling
- Enhanced security features
- Complete documentation overhaul

### v1.0.0 (October 2025)

- Initial landing page release
- Basic contact form functionality
- Multi-language support
- Responsive design

---

**Last Updated**: December 2025  
**Version**: 2.0.0  
**Next Review**: March 2026

For detailed email system documentation, see the [docs/](docs/) directory.
