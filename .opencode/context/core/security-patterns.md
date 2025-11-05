# LOFERSIL Security Patterns - Input Validation & Sanitization

## DOMPurify HTML Sanitization Pattern

**ALWAYS** sanitize any user-generated HTML content before inserting into DOM:

```typescript
// src/scripts/modules/SecurityUtils.ts
import DOMPurify from 'dompurify';

export class SecurityUtils {
  /**
   * Sanitizes HTML content for safe insertion into the DOM
   * Allows only safe tags and attributes for a stationery store landing page
   */
  public static sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'b',
        'i',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'blockquote',
        'cite',
        'a',
        'img',
      ],
      ALLOWED_ATTR: [
        'href',
        'target',
        'rel', // for links
        'src',
        'alt',
        'title', // for images
        'class',
        'id', // for styling
      ],
      ALLOW_DATA_ATTR: false, // no data attributes
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
    });
  }

  /**
   * Sanitizes user input for display (strips HTML completely)
   */
  public static sanitizeTextInput(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }
}
```

## Contact Form Validation Pattern

**ALWAYS** validate contact form data on both client and server side:

```typescript
// src/scripts/modules/ContactFormValidator.ts
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitizedData?: ContactFormData;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export class ContactFormValidator {
  /**
   * Comprehensive validation for contact form submissions
   */
  public validateContactForm(data: any): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Partial<ContactFormData> = {};

    // Name validation
    const nameResult = this.validateName(data.name);
    if (!nameResult.valid) {
      errors.name = nameResult.error!;
    } else {
      sanitizedData.name = nameResult.sanitized!;
    }

    // Email validation
    const emailResult = this.validateEmail(data.email);
    if (!emailResult.valid) {
      errors.email = emailResult.error!;
    } else {
      sanitizedData.email = emailResult.sanitized!;
    }

    // Phone validation (optional)
    if (data.phone) {
      const phoneResult = this.validatePhone(data.phone);
      if (!phoneResult.valid) {
        errors.phone = phoneResult.error!;
      } else {
        sanitizedData.phone = phoneResult.sanitized!;
      }
    }

    // Subject validation
    const subjectResult = this.validateSubject(data.subject);
    if (!subjectResult.valid) {
      errors.subject = subjectResult.error!;
    } else {
      sanitizedData.subject = subjectResult.sanitized!;
    }

    // Message validation
    const messageResult = this.validateMessage(data.message);
    if (!messageResult.valid) {
      errors.message = messageResult.error!;
    } else {
      sanitizedData.message = messageResult.sanitized!;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitizedData:
        Object.keys(errors).length === 0 ? (sanitizedData as ContactFormData) : undefined,
    };
  }

  private validateName(name: any): { valid: boolean; error?: string; sanitized?: string } {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Nome é obrigatório' };
    }

    const sanitized = SecurityUtils.sanitizeTextInput(name.trim());

    if (sanitized.length < 2) {
      return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (sanitized.length > 100) {
      return { valid: false, error: 'Nome deve ter no máximo 100 caracteres' };
    }

    // Check for suspicious patterns
    if (/[<>{}[\]\\]/.test(sanitized)) {
      return { valid: false, error: 'Nome contém caracteres inválidos' };
    }

    return { valid: true, sanitized };
  }

  private validateEmail(email: any): { valid: boolean; error?: string; sanitized?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email é obrigatório' };
    }

    const sanitized = SecurityUtils.sanitizeTextInput(email.trim().toLowerCase());

    // RFC 5322 compliant email regex (simplified)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(sanitized)) {
      return { valid: false, error: 'Email inválido' };
    }

    if (sanitized.length > 254) {
      return { valid: false, error: 'Email muito longo' };
    }

    return { valid: true, sanitized };
  }

  private validatePhone(phone: any): { valid: boolean; error?: string; sanitized?: string } {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Telefone inválido' };
    }

    const sanitized = SecurityUtils.sanitizeTextInput(phone.trim());

    // Allow digits, spaces, hyphens, parentheses, plus sign
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (!phoneRegex.test(sanitized)) {
      return { valid: false, error: 'Telefone contém caracteres inválidos' };
    }

    // Remove all non-digit characters for length check
    const digitsOnly = sanitized.replace(/\D/g, '');

    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
      return { valid: false, error: 'Telefone deve ter entre 9 e 15 dígitos' };
    }

    return { valid: true, sanitized };
  }

  private validateSubject(subject: any): { valid: boolean; error?: string; sanitized?: string } {
    if (!subject || typeof subject !== 'string') {
      return { valid: false, error: 'Assunto é obrigatório' };
    }

    const sanitized = SecurityUtils.sanitizeTextInput(subject.trim());

    if (sanitized.length < 5) {
      return { valid: false, error: 'Assunto deve ter pelo menos 5 caracteres' };
    }

    if (sanitized.length > 200) {
      return { valid: false, error: 'Assunto deve ter no máximo 200 caracteres' };
    }

    return { valid: true, sanitized };
  }

  private validateMessage(message: any): { valid: boolean; error?: string; sanitized?: string } {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Mensagem é obrigatória' };
    }

    const sanitized = SecurityUtils.sanitizeTextInput(message.trim());

    if (sanitized.length < 10) {
      return { valid: false, error: 'Mensagem deve ter pelo menos 10 caracteres' };
    }

    if (sanitized.length > 2000) {
      return { valid: false, error: 'Mensagem deve ter no máximo 2000 caracteres' };
    }

    return { valid: true, sanitized };
  }
}
```

## API Security Pattern

**ALWAYS** implement secure API communication for contact form submissions:

```typescript
// api/contact.js - Server-side validation
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurifyServer = DOMPurify(window);

function validateContactSubmission(req, res, next) {
  const { name, email, phone, subject, message } = req.body;

  const errors = [];

  // Server-side sanitization and validation
  const sanitizedName = DOMPurifyServer.sanitize(name || '', { ALLOWED_TAGS: [] }).trim();
  if (!sanitizedName || sanitizedName.length < 2) {
    errors.push('Nome inválido');
  }

  const sanitizedEmail = DOMPurifyServer.sanitize(email || '', { ALLOWED_TAGS: [] }).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    errors.push('Email inválido');
  }

  const sanitizedMessage = DOMPurifyServer.sanitize(message || '', { ALLOWED_TAGS: [] }).trim();
  if (!sanitizedMessage || sanitizedMessage.length < 10) {
    errors.push('Mensagem muito curta');
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
    phone: phone ? DOMPurifyServer.sanitize(phone, { ALLOWED_TAGS: [] }).trim() : undefined,
    subject: DOMPurifyServer.sanitize(subject || '', { ALLOWED_TAGS: [] }).trim(),
    message: sanitizedMessage,
  };

  next();
}

module.exports = { validateContactSubmission };
```

## Content Security Policy Pattern

**ALWAYS** implement CSP headers for the landing page:

```typescript
// server.js - CSP implementation
const express = require('express');
const app = express();

// Content Security Policy for stationery landing page
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});
```

## Rate Limiting Pattern

**ALWAYS** implement rate limiting for contact form submissions:

```typescript
// api/contact.js - Rate limiting
const rateLimit = require('express-rate-limit');

// Create rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 contact form submissions per windowMs
  message: {
    success: false,
    error: 'Muitas tentativas de contato. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store rate limit data in memory (for production, use Redis)
  store: new rateLimit.MemoryStore(),
});

app.post('/api/contact', contactLimiter, validateContactSubmission, async (req, res) => {
  // Process contact form
  const { name, email, phone, subject, message } = req.sanitizedData;

  try {
    // Send email or save to database
    // Implementation depends on chosen service

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});
```

## Input Sanitization Utilities

**ALWAYS** use these utility functions for consistent sanitization:

```typescript
// src/scripts/modules/SecurityUtils.ts
export class SecurityUtils {
  /**
   * Removes potentially dangerous characters from input
   */
  public static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:/gi, '') // Remove data: URLs
      .trim();
  }

  /**
   * Validates and sanitizes URLs
   */
  public static sanitizeUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return null;
      }

      // Additional validation can be added here
      return parsedUrl.toString();
    } catch {
      return null;
    }
  }

  /**
   * Checks for suspicious patterns in user input
   */
  public static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }
}
```

## Security Testing Pattern

**ALWAYS** include security tests for validation functions:

```typescript
// src/scripts/validation.test.ts
import { ContactFormValidator } from '../modules/ContactFormValidator';
import { SecurityUtils } from '../modules/SecurityUtils';

describe('Security Validation', () => {
  const validator = new ContactFormValidator();

  test('rejects XSS attempts in name field', () => {
    const result = validator.validateContactForm({
      name: '<script>alert("xss")</script>',
      email: 'test@example.com',
      subject: 'Test',
      message: 'Test message',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.name).toContain('caracteres inválidos');
  });

  test('sanitizes HTML from input', () => {
    const sanitized = SecurityUtils.sanitizeHtml('<p>Hello <strong>world</strong></p>');
    expect(sanitized).toBe('<p>Hello <strong>world</strong></p>');
  });

  test('blocks dangerous HTML', () => {
    const sanitized = SecurityUtils.sanitizeHtml('<script>alert("danger")</script><p>Safe</p>');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Safe</p>');
  });

  test('validates email format', () => {
    expect(
      validator.validateContactForm({
        name: 'Test User',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Test message',
      }).valid
    ).toBe(false);
  });
});
```

These security patterns ensure LOFERSIL's contact forms and user interactions remain secure against common web vulnerabilities while maintaining usability for legitimate stationery store customers.</content>
<parameter name="filePath">.opencode/context/core/security-patterns.md
