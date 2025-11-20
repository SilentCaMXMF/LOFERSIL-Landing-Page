# LOFERSIL Backend API Patterns

## Express Server Architecture Pattern

**ALWAYS** structure Express servers with proper middleware, error handling, and security:

```javascript
// server.js - Main Express server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { contactRouter } = require('./api/contact');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration for contact form
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://lofersil.pt', 'https://www.lofersil.pt']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      // Raw body for webhook signature verification if needed
      req.rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);

  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`[${timestamp}] Response: ${res.statusCode}`);
    originalSend.call(this, data);
  };

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', contactRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 LOFERSIL API server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;
```

## Contact Form API Endpoint Pattern

**ALWAYS** implement secure contact form endpoints with comprehensive validation:

```javascript
// api/contact.js - Contact form API router
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const rateLimit = require('express-rate-limit');

// Initialize DOMPurify
const window = new JSDOM('').window;
const DOMPurifyServer = DOMPurify(window);

// Email rate limiting (stricter than global limit)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 contact form submissions per hour
  message: {
    success: false,
    error: 'Muitas tentativas de contato. Tente novamente em 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store in memory (use Redis in production)
  store: new rateLimit.MemoryStore(),
});

// Email transporter configuration
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use service like SendGrid, Mailgun, etc.
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use Ethereal for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }
};

let transporter = createTransporter();

// Contact form validation middleware
const validateContactForm = (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;
  const errors = [];

  // Name validation
  const sanitizedName = DOMPurifyServer.sanitize(name || '', { ALLOWED_TAGS: [] }).trim();
  if (!sanitizedName || sanitizedName.length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  } else if (sanitizedName.length > 100) {
    errors.push('Nome deve ter no máximo 100 caracteres');
  } else if (/[<>{}[\]\\]/.test(sanitizedName)) {
    errors.push('Nome contém caracteres inválidos');
  }

  // Email validation
  const sanitizedEmail = DOMPurifyServer.sanitize(email || '', { ALLOWED_TAGS: [] }).trim();
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(sanitizedEmail)) {
    errors.push('Email inválido');
  } else if (sanitizedEmail.length > 254) {
    errors.push('Email muito longo');
  }

  // Phone validation (optional)
  let sanitizedPhone = '';
  if (phone) {
    sanitizedPhone = DOMPurifyServer.sanitize(phone, { ALLOWED_TAGS: [] }).trim();
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      errors.push('Telefone contém caracteres inválidos');
    } else {
      const digitsOnly = sanitizedPhone.replace(/\D/g, '');
      if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        errors.push('Telefone deve ter entre 9 e 15 dígitos');
      }
    }
  }

  // Subject validation
  const sanitizedSubject = DOMPurifyServer.sanitize(subject || '', { ALLOWED_TAGS: [] }).trim();
  if (!sanitizedSubject || sanitizedSubject.length < 5) {
    errors.push('Assunto deve ter pelo menos 5 caracteres');
  } else if (sanitizedSubject.length > 200) {
    errors.push('Assunto deve ter no máximo 200 caracteres');
  }

  // Message validation
  const sanitizedMessage = DOMPurifyServer.sanitize(message || '', { ALLOWED_TAGS: [] }).trim();
  if (!sanitizedMessage || sanitizedMessage.length < 10) {
    errors.push('Mensagem deve ter pelo menos 10 caracteres');
  } else if (sanitizedMessage.length > 2000) {
    errors.push('Mensagem deve ter no máximo 2000 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  // Attach sanitized data to request
  req.sanitizedData = {
    name: sanitizedName,
    email: sanitizedEmail,
    phone: sanitizedPhone,
    subject: sanitizedSubject,
    message: sanitizedMessage,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  next();
};

// Contact form submission endpoint
router.post('/contact', contactLimiter, validateContactForm, async (req, res) => {
  try {
    const { name, email, phone, subject, message, ip, userAgent, timestamp } = req.sanitizedData;

    // Prepare email content
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.CONTACT_EMAIL || 'contact@lofersil.pt',
      subject: `LOFERSIL - ${subject}`,
      html: generateContactEmailHTML(name, email, phone, subject, message),
      text: generateContactEmailText(name, email, phone, subject, message),
      // Add metadata for spam filtering
      headers: {
        'X-Mailer': 'LOFERSIL Contact Form',
        'X-Originating-IP': ip,
        'X-User-Agent': userAgent,
        'X-Submitted-At': timestamp,
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Contact form email sent:', info.messageId);

    // Send confirmation email to user (optional)
    if (process.env.SEND_CONFIRMATION === 'true') {
      await sendConfirmationEmail(email, name, subject);
    }

    // Log successful submission
    console.log(`Contact form submission from ${name} <${email}> at ${timestamp}`);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Contact form error:', error);

    // Don't expose internal errors
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor. Tente novamente mais tarde.',
    });
  }
});

// Generate HTML email content
function generateContactEmailHTML(name, email, phone, subject, message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #007bff; color: white; padding: 20px; }
        .content { padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; }
        .value { margin-top: 5px; }
        .message { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Nova mensagem de contato - LOFERSIL</h1>
      </div>
      <div class="content">
        <div class="field">
          <div class="label">Nome:</div>
          <div class="value">${escapeHtml(name)}</div>
        </div>
        <div class="field">
          <div class="label">Email:</div>
          <div class="value">${escapeHtml(email)}</div>
        </div>
        ${
          phone
            ? `
        <div class="field">
          <div class="label">Telefone:</div>
          <div class="value">${escapeHtml(phone)}</div>
        </div>
        `
            : ''
        }
        <div class="field">
          <div class="label">Assunto:</div>
          <div class="value">${escapeHtml(subject)}</div>
        </div>
        <div class="field">
          <div class="label">Mensagem:</div>
          <div class="message">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text email content
function generateContactEmailText(name, email, phone, subject, message) {
  return `
LOFERSIL - Nova mensagem de contato

Nome: ${name}
Email: ${email}
${phone ? `Telefone: ${phone}\n` : ''}Assunto: ${subject}

Mensagem:
${message}

---
Enviado através do formulário de contato em ${new Date().toLocaleString('pt-PT')}
  `.trim();
}

// Send confirmation email to user
async function sendConfirmationEmail(userEmail, userName, subject) {
  const confirmationOptions = {
    from: process.env.CONTACT_EMAIL || 'contact@lofersil.pt',
    to: userEmail,
    subject: 'Confirmação de contato - LOFERSIL',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Obrigado pelo contato, ${userName}!</h2>
        <p>Recebemos sua mensagem sobre "${subject}" e entraremos em contato em breve.</p>
        <p>Atenciosamente,<br>Equipe LOFERSIL</p>
      </div>
    `,
    text: `
Obrigado pelo contato, ${userName}!

Recebemos sua mensagem sobre "${subject}" e entraremos em contato em breve.

Atenciosamente,
Equipe LOFERSIL
    `.trim(),
  };

  await transporter.sendMail(confirmationOptions);
}

// HTML escaping utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

module.exports = router;
```

## API Security and Monitoring Pattern

**ALWAYS** implement comprehensive security and monitoring for API endpoints:

```javascript
// api/security.js - Security utilities
const crypto = require('crypto');

// IP-based abuse detection
class AbuseDetector {
  constructor() {
    this.attempts = new Map();
    this.blockedIPs = new Set();
  }

  recordAttempt(ip, endpoint) {
    const key = `${ip}:${endpoint}`;
    const attempts = this.attempts.get(key) || [];
    attempts.push(Date.now());

    // Keep only attempts from last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAttempts = attempts.filter(time => time > oneHourAgo);

    this.attempts.set(key, recentAttempts);

    // Block if too many attempts
    if (recentAttempts.length > 10) {
      this.blockedIPs.add(ip);
      console.warn(`IP ${ip} blocked due to abuse on ${endpoint}`);
      return true; // Blocked
    }

    return false; // Not blocked
  }

  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(time => time > oneHourAgo);
      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentAttempts);
      }
    }
  }
}

// Request logging and monitoring
class APIMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      responseTimes: [],
      errors: [],
      popularEndpoints: new Map(),
    };

    // Cleanup old data periodically
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  recordRequest(req, res, responseTime) {
    this.metrics.totalRequests++;

    // Record response time
    this.metrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }

    // Record endpoint popularity
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    this.metrics.popularEndpoints.set(
      endpoint,
      (this.metrics.popularEndpoints.get(endpoint) || 0) + 1
    );

    // Record errors
    if (res.statusCode >= 400) {
      this.metrics.errors.push({
        endpoint,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
        ip: req.ip,
      });
    }
  }

  getMetrics() {
    const responseTimes = this.metrics.responseTimes;
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: this.metrics.errors.length / Math.max(this.metrics.totalRequests, 1),
      popularEndpoints: Array.from(this.metrics.popularEndpoints.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  }

  cleanup() {
    // Keep only recent errors (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics.errors = this.metrics.errors.filter(
      error => new Date(error.timestamp) > oneDayAgo
    );
  }
}

// Security middleware
const securityMiddleware = (abuseDetector, apiMonitor) => {
  return (req, res, next) => {
    const startTime = Date.now();

    // Check if IP is blocked
    if (abuseDetector.isBlocked(req.ip)) {
      return res.status(429).json({
        error: 'IP bloqueado devido a atividade suspeita',
      });
    }

    // Record attempt for abuse detection
    const isBlocked = abuseDetector.recordAttempt(req.ip, req.path);
    if (isBlocked) {
      return res.status(429).json({
        error: 'Muitas tentativas. Tente novamente mais tarde.',
      });
    }

    // Add security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    });

    // Monitor response
    const originalSend = res.send;
    res.send = function (data) {
      const responseTime = Date.now() - startTime;
      apiMonitor.recordRequest(req, res, responseTime);
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { AbuseDetector, APIMonitor, securityMiddleware };
```

## Environment Configuration Pattern

**ALWAYS** use environment variables for configuration with validation:

```javascript
// config/api.js - API configuration
require('dotenv').config();

const requiredEnvVars = ['CONTACT_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];

const optionalEnvVars = ['SEND_CONFIRMATION', 'ETHEREAL_USER', 'ETHEREAL_PASS'];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Required environment variable ${envVar} is not set`);
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  contactEmail: process.env.CONTACT_EMAIL,
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  email: {
    sendConfirmation: process.env.SEND_CONFIRMATION === 'true',
    ethereal: {
      user: process.env.ETHEREAL_USER,
      pass: process.env.ETHEREAL_PASS,
    },
  },
  security: {
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  },
};
```

These backend API patterns ensure LOFERSIL's contact form and API endpoints are secure, reliable, and maintainable while providing excellent user experience.</content>
<parameter name="filePath">.opencode/context/backend/api-patterns.md
