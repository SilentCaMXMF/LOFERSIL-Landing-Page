# LOFERSIL Landing Page

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/lofersil/landing-page)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black.svg)](https://vercel.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A sophisticated, production-ready landing page for LOFERSIL, a premium retail store in Lisbon, Portugal. Built with modern TypeScript, featuring comprehensive security, PWA capabilities, and advanced development tooling.

## 🏪 About LOFERSIL

LOFERSIL is a trusted family-owned business serving Lisbon for over 30 years, located at R. Gomes Freire 187 B. We specialize in premium products including:

- **Baby Products** - Hyper-realistic reborn dolls and baby essentials
- **Jewelry Boxes** - Elegant storage solutions with premium finishes
- **Office Supplies** - High-quality stationery and professional materials
- **Promotional Items** - Custom pens and business accessories
- **Backpacks & Bags** - Modern, durable designs for everyday use
- **Printer Supplies** - Compatible ink cartridges with reliable performance

## ✨ Key Features

### 🎯 Core Functionality

- **Responsive Design** - Optimized for all devices and screen sizes
- **Multi-language Support** - Portuguese and English with easy switching
- **Dark/Light Theme** - User preference detection and manual toggle
- **Progressive Web App** - Installable with offline capabilities
- **SEO Optimized** - Comprehensive meta tags, sitemaps, and structured data
- **Accessibility First** - WCAG 2.1 AA compliant with screen reader support

### 🔒 Security & Performance

- **CSRF Protection** - Token-based form security
- **Rate Limiting** - API endpoint protection against abuse
- **XSS Prevention** - DOMPurify integration for content sanitization
- **Input Validation** - Comprehensive form validation with Joi
- **Performance Monitoring** - Web Vitals tracking and optimization
- **Lazy Loading** - Images and components loaded on demand

### 📧 Advanced Contact System

- **Gmail SMTP Integration** - Reliable email delivery via Gmail
- **Form Validation** - Real-time client and server-side validation
- **Bot Protection** - Honeypot fields and CSRF tokens
- **Error Handling** - Comprehensive error management and user feedback
- **Background Sync** - Offline form submission with sync on reconnect

### 🛠️ Development Excellence

- **TypeScript Strict Mode** - Type-safe development with comprehensive interfaces
- **Modular Architecture** - Clean separation of concerns with ES6 modules
- **Comprehensive Testing** - Unit, integration, and E2E tests with Vitest
- **Code Quality** - ESLint, Prettier, and automated code formatting
- **CI/CD Pipeline** - Automated testing and deployment via GitHub Actions

### 🚀 Advanced Features

- **MCP Integration** - Model Context Protocol for AI tool integration
- **GitHub Integration** - Automated code review and issue management
- **Task Management** - Structured development workflow with task tracking
- **Monitoring & Analytics** - Performance metrics and health checks
- **Service Worker** - Advanced caching strategies and offline support

## 🏗️ Technical Architecture

### Frontend Stack

- **Language**: TypeScript 5.0+ (strict mode)
- **Styling**: PostCSS with modern CSS features
- **Build System**: Custom build pipeline with optimization
- **Testing**: Vitest with jsdom environment
- **Bundling**: Optimized for production with tree shaking

### Backend & API

- **Runtime**: Node.js 22.x
- **Framework**: Express.js for API endpoints
- **Email**: Nodemailer with Gmail SMTP
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Joi schema validation

### Deployment & Infrastructure

- **Platform**: Vercel (production-ready configuration)
- **CDN**: Global content delivery network
- **Environment**: Production, preview, and development branches
- **Monitoring**: Built-in health checks and performance metrics

## 📁 Project Structure

```
LOFERSIL-Landing-Page/
├── src/                          # Source code
│   ├── scripts/                  # TypeScript modules
│   │   ├── modules/             # Feature modules
│   │   │   ├── mcp/            # Model Context Protocol
│   │   │   ├── github-issues/  # GitHub integration
│   │   │   └── [40+ modules]   # Core functionality
│   │   ├── index.ts            # Main application entry
│   │   ├── types.ts            # TypeScript definitions
│   │   └── validation.ts       # Form validation schemas
│   ├── styles/                  # CSS stylesheets
│   └── locales/                 # Internationalization
├── api/                         # Backend API endpoints
│   ├── contact.js              # Contact form handler
│   ├── health/                 # Health check endpoints
│   └── monitoring/             # Monitoring APIs
├── tests/                       # Comprehensive test suite
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests
│   └── fixtures/               # Test data and mocks
├── tasks/                       # Development task management
├── docs/                        # Documentation
├── scripts/                     # Build and utility scripts
└── assets/                      # Static assets (images, icons)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm 10.x or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/lofersil/landing-page.git
cd landing-page

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your Gmail credentials and other settings
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Run tests in watch mode
npm test

# Build for development
npm run build:dev

# Start local server
npm start
```

### Production

```bash
# Build for production
npm run build

# Run tests
npm run test:run

# Check code quality
npm run lint

# Deploy to Vercel preview
npm run deploy:preview

# Deploy to production
npm run deploy:prod
```

## 🧪 Testing

The project includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage thresholds
npm run test:coverage:threshold
```

### Test Structure

- **Unit Tests**: Individual module and function testing
- **Integration Tests**: API endpoint and module interaction testing
- **E2E Tests**: Complete user flow testing
- **Performance Tests**: Load time and optimization testing
- **Security Tests**: CSRF, XSS, and vulnerability testing

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Security
CSRF_SECRET=your-csrf-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application
NODE_ENV=production
PORT=8000

# MCP Integration (Optional)
CONTEXT7_API_KEY=your-context7-api-key
```

### Vercel Configuration

The project is optimized for Vercel deployment with:

- Automatic builds on git push
- Environment variable management
- Custom headers for security and performance
- Static asset optimization
- Edge function support for API routes

## 📊 Monitoring & Analytics

### Built-in Monitoring

- **Performance Metrics**: Web Vitals tracking
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: API endpoint monitoring
- **Usage Analytics**: Form submission and user interaction tracking

### External Integrations

- **GitHub**: Automated code review and issue management
- **Context7**: AI-powered documentation and tool integration
- **Vercel Analytics**: Performance and usage insights

## 🔒 Security Features

### Implemented Security Measures

- **CSRF Protection**: Token-based security for all forms
- **Rate Limiting**: API endpoint protection with configurable limits
- **XSS Prevention**: DOMPurify integration for content sanitization
- **Input Validation**: Comprehensive server-side validation
- **Security Headers**: Helmet.js for HTTP security headers
- **Bot Protection**: Honeypot fields and behavioral analysis

### Security Best Practices

- Regular dependency updates and vulnerability scanning
- Secure password storage and authentication
- HTTPS enforcement and secure cookie handling
- Content Security Policy (CSP) implementation
- Regular security audits and penetration testing

## 🌐 PWA Features

### Progressive Web App Capabilities

- **Offline Support**: Service worker with intelligent caching
- **App Installation**: Native app-like experience on mobile devices
- **Push Notifications**: Optional notification system
- **Background Sync**: Offline form submission
- **Responsive Design**: Optimized for all screen sizes

### PWA Configuration

- Web App Manifest with custom icons
- Service worker with cache-first strategy
- Offline fallback pages
- App installation prompts
- Background synchronization

## 📚 Documentation

### Comprehensive Documentation

- **Development Guide**: Setup and development workflows
- **API Documentation**: Complete API endpoint documentation
- **Deployment Guide**: Production deployment instructions
- **Security Guide**: Security implementation details
- **Testing Guide**: Testing strategies and best practices

### Task Management

- Structured task organization in `/tasks`
- Implementation guides and summaries
- Progress tracking and status updates
- Step-by-step development instructions

## 🤝 Contributing

We welcome contributions! Please follow our guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure code passes all linting and formatting checks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

### LOFERSIL Store

- **Address**: R. Gomes Freire 187 B, 1150-178 Lisboa, Portugal
- **Phone**: +351 21 353 1555
- **Email**: info@lofersil.pt
- **Website**: [https://lofersil.pt](https://lofersil.pt)

### Project Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/lofersil/landing-page/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/lofersil/landing-page/discussions)

## 🙏 Acknowledgments

- **Vercel** for hosting and deployment platform
- **OpenAI** for AI integration capabilities
- **Context7** for MCP implementation and documentation tools
- **GitHub** for version control and CI/CD
- The open-source community for the amazing tools and libraries

---

**Built with ❤️ for LOFERSIL - Serving Lisbon with premium products and exceptional service since 1990.**
