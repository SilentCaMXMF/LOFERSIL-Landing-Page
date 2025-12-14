/**
 * Email Security Utilities - Comprehensive security protection for email handling
 * Provides protection against injection attacks, XSS, CSRF, spam, and other threats
 */

import DOMPurify from "dompurify";

// Security threat levels
export enum SecurityThreatLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Security incident types
export enum SecurityIncidentType {
  EMAIL_INJECTION = "email_injection",
  XSS_ATTEMPT = "xss_attempt",
  CSRF_ATTEMPT = "csrf_attempt",
  SQL_INJECTION = "sql_injection",
  SPAM_DETECTED = "spam_detected",
  BOT_DETECTED = "bot_detected",
  RATE_LIMIT_BREACH = "rate_limit_breach",
  MALICIOUS_CONTENT = "malicious_content",
  SUSPICIOUS_PATTERN = "suspicious_pattern",
}

// Security configuration
export interface SecurityConfig {
  enableXssProtection: boolean;
  enableSpamDetection: boolean;
  enableBotDetection: boolean;
  enableContentValidation: boolean;
  enableHeaderInjectionProtection: boolean;
  strictMode: boolean;
  allowedDomains: string[];
  blockedDomains: string[];
  maxContentLength: number;
  csrfTokenSecret?: string;
  customPatterns?: SecurityPattern[];
}

// Security pattern for threat detection
export interface SecurityPattern {
  name: string;
  pattern: RegExp;
  severity: SecurityThreatLevel;
  description: string;
  enabled: boolean;
}

// Security incident record
export interface SecurityIncident {
  id: string;
  type: SecurityIncidentType;
  severity: SecurityThreatLevel;
  description: string;
  timestamp: Date;
  source: {
    ip?: string;
    email?: string;
    userAgent?: string;
    referer?: string;
  };
  details: Record<string, any>;
  blocked: boolean;
  resolved: boolean;
  resolvedAt?: Date;
}

// Content Security Policy configuration
export interface CSPConfig {
  enabled: boolean;
  directives: {
    "default-src": string[];
    "script-src": string[];
    "style-src": string[];
    "img-src": string[];
    "font-src": string[];
    "connect-src": string[];
    "frame-ancestors": string[];
    "form-action": string[];
  };
  reportUri?: string;
}

// CSRF token configuration
export interface CSRFConfig {
  enabled: boolean;
  tokenExpiry: number; // in milliseconds
  cookieName: string;
  headerName: string;
  requireSameSite: boolean;
}

/**
 * Email Security Manager
 */
export class EmailSecurityManager {
  private config: SecurityConfig;
  private incidents: SecurityIncident[] = [];
  private csrfTokens: Map<string, { timestamp: number; used: boolean }> =
    new Map();
  private blockedIps: Set<string> = new Set();
  private blockedEmails: Set<string> = new Set();
  private suspiciousPatterns: SecurityPattern[];

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableXssProtection: true,
      enableSpamDetection: true,
      enableBotDetection: true,
      enableContentValidation: true,
      enableHeaderInjectionProtection: true,
      strictMode: false,
      allowedDomains: [],
      blockedDomains: [],
      maxContentLength: 10000,
      ...config,
    };

    this.suspiciousPatterns = this.initializeSecurityPatterns();
  }

  /**
   * Validate and sanitize email content
   */
  public validateEmailContent(
    data: {
      name: string;
      email: string;
      message: string;
      phone?: string;
      subject?: string;
    },
    source?: {
      ip?: string;
      userAgent?: string;
      referer?: string;
    },
  ): {
    isValid: boolean;
    sanitizedData: any;
    threats: SecurityIncident[];
    blocked: boolean;
  } {
    const threats: SecurityIncident[] = [];
    let blocked = false;
    const sanitizedData = { ...data };

    // Check if source is blocked
    if (source?.ip && this.isBlockedIp(source.ip)) {
      const incident = this.createIncident(
        SecurityIncidentType.BOT_DETECTED,
        SecurityThreatLevel.HIGH,
        "Request from blocked IP address",
        source,
        { ip: source.ip },
      );
      threats.push(incident);
      blocked = true;
    }

    if (data.email && this.isBlockedEmail(data.email)) {
      const incident = this.createIncident(
        SecurityIncidentType.SPAM_DETECTED,
        SecurityThreatLevel.HIGH,
        "Request from blocked email address",
        source,
        { email: data.email },
      );
      threats.push(incident);
      blocked = true;
    }

    // XSS protection
    if (this.config.enableXssProtection) {
      const xssThreats = this.detectXSS(data, source);
      threats.push(...xssThreats);
      if (xssThreats.some((t) => t.severity === SecurityThreatLevel.CRITICAL)) {
        blocked = true;
      }
    }

    // Email injection protection
    const injectionThreats = this.detectEmailInjection(data, source);
    threats.push(...injectionThreats);
    if (
      injectionThreats.some((t) => t.severity === SecurityThreatLevel.CRITICAL)
    ) {
      blocked = true;
    }

    // Spam detection
    if (this.config.enableSpamDetection) {
      const spamThreats = this.detectSpam(data, source);
      threats.push(...spamThreats);
      if (spamThreats.some((t) => t.severity === SecurityThreatLevel.HIGH)) {
        blocked = true;
      }
    }

    // Bot detection
    if (this.config.enableBotDetection && source) {
      const botThreats = this.detectBot(source);
      threats.push(...botThreats);
      if (botThreats.some((t) => t.severity === SecurityThreatLevel.HIGH)) {
        blocked = true;
      }
    }

    // Content validation
    if (this.config.enableContentValidation) {
      const validationThreats = this.validateContent(data, source);
      threats.push(...validationThreats);
      if (
        validationThreats.some(
          (t) => t.severity === SecurityThreatLevel.CRITICAL,
        )
      ) {
        blocked = true;
      }
    }

    // Sanitize content if not blocked
    if (!blocked) {
      sanitizedData.name = this.sanitizeInput(data.name);
      sanitizedData.email = this.sanitizeEmail(data.email);
      sanitizedData.message = this.sanitizeInput(data.message);
      if (data.phone) {
        sanitizedData.phone = this.sanitizePhone(data.phone);
      }
      if (data.subject) {
        sanitizedData.subject = this.sanitizeInput(data.subject);
      }
    }

    // Record all incidents
    threats.forEach((incident) => this.recordIncident(incident));

    return {
      isValid: !blocked && threats.length === 0,
      sanitizedData,
      threats,
      blocked,
    };
  }

  /**
   * Detect XSS attacks
   */
  private detectXSS(
    data: any,
    source?: { ip?: string; userAgent?: string; referer?: string },
  ): SecurityIncident[] {
    const threats: SecurityIncident[] = [];
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi,
      /<link\b/gi,
      /<meta\b/gi,
      /expression\s*\(/gi,
      /@import/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];

    const fields = ["name", "email", "message", "phone", "subject"];

    for (const field of fields) {
      if (data[field]) {
        for (const pattern of xssPatterns) {
          if (pattern.test(data[field])) {
            const incident = this.createIncident(
              SecurityIncidentType.XSS_ATTEMPT,
              SecurityThreatLevel.CRITICAL,
              `XSS pattern detected in ${field} field`,
              source,
              {
                field,
                pattern: pattern.source,
                value: data[field].substring(0, 100),
              },
            );
            threats.push(incident);
            break;
          }
        }
      }
    }

    return threats;
  }

  /**
   * Detect email injection attacks
   */
  private detectEmailInjection(
    data: any,
    source?: { ip?: string; userAgent?: string; referer?: string },
  ): SecurityIncident[] {
    const threats: SecurityIncident[] = [];
    const injectionPatterns = [
      /\r\n|\r|\n/gi, // Newline characters
      /bcc:/gi, // Blind carbon copy
      /cc:/gi, // Carbon copy
      /to:/gi, // To field
      /from:/gi, // From field
      /subject:/gi, // Subject field
      /reply-to:/gi, // Reply to field
      /content-type:/gi, // Content type header
      /mime-version:/gi, // MIME version header
      /multipart\/mixed/gi, // Multipart content
      /%0d%0a/gi, // URL encoded newlines
    ];

    const fields = ["name", "email", "message", "phone", "subject"];

    for (const field of fields) {
      if (data[field]) {
        for (const pattern of injectionPatterns) {
          if (pattern.test(data[field])) {
            const incident = this.createIncident(
              SecurityIncidentType.EMAIL_INJECTION,
              SecurityThreatLevel.CRITICAL,
              `Email injection pattern detected in ${field} field`,
              source,
              {
                field,
                pattern: pattern.source,
                value: data[field].substring(0, 100),
              },
            );
            threats.push(incident);
            break;
          }
        }
      }
    }

    return threats;
  }

  /**
   * Detect spam content
   */
  private detectSpam(
    data: any,
    source?: { ip?: string; userAgent?: string; referer?: string },
  ): SecurityIncident[] {
    const threats: SecurityIncident[] = [];

    // Check blocked domains
    const emailDomain = data.email?.split("@")[1]?.toLowerCase();
    if (emailDomain && this.config.blockedDomains.includes(emailDomain)) {
      const incident = this.createIncident(
        SecurityIncidentType.SPAM_DETECTED,
        SecurityThreatLevel.HIGH,
        `Email from blocked domain: ${emailDomain}`,
        source,
        { email: data.email, domain: emailDomain },
      );
      threats.push(incident);
    }

    // Spam keywords and patterns
    const spamPatterns = [
      /\b(viagra|cialis|levitra)\b/gi,
      /\b(casino|poker|blackjack|roulette)\b/gi,
      /\b(lottery|winner|prize|award)\b/gi,
      /\b(click here|free money|make money)\b/gi,
      /\b(urgent|immediate action required)\b/gi,
      /\b(\d+\s*million|\d+\s*billion)\b/gi,
      /\b(weight loss|lose weight|diet pill)\b/gi,
      /\b(claim now|limited time|exclusive offer)\b/gi,
      /http[s]?:\/\/[^\s]+/gi, // URLs in message
      /\b(test|test123|asdf)\b/gi, // Common test strings
    ];

    const message = data.message || "";
    let spamScore = 0;

    for (const pattern of spamPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        spamScore += matches.length;
      }
    }

    // Check for excessive capitalization
    const upperCaseRatio =
      (message.match(/[A-Z]/g) || []).length / message.length;
    if (upperCaseRatio > 0.5) {
      spamScore += 2;
    }

    // Check for excessive punctuation
    const punctCount = (message.match(/[!?.]/g) || []).length;
    if (punctCount > message.length / 10) {
      spamScore += 2;
    }

    // Check message length
    if (message.length < 10 || message.length > this.config.maxContentLength) {
      spamScore += 1;
    }

    if (spamScore >= 3) {
      const incident = this.createIncident(
        SecurityIncidentType.SPAM_DETECTED,
        spamScore >= 5 ? SecurityThreatLevel.HIGH : SecurityThreatLevel.MEDIUM,
        `Spam content detected (score: ${spamScore})`,
        source,
        { spamScore, messageLength: message.length },
      );
      threats.push(incident);
    }

    return threats;
  }

  /**
   * Detect bot behavior
   */
  private detectBot(source: {
    ip?: string;
    userAgent?: string;
    referer?: string;
  }): SecurityIncident[] {
    const threats: SecurityIncident[] = [];

    if (!source.userAgent) {
      const incident = this.createIncident(
        SecurityIncidentType.BOT_DETECTED,
        SecurityThreatLevel.MEDIUM,
        "No user agent provided",
        source,
        {},
      );
      threats.push(incident);
      return threats;
    }

    // Bot user agent patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
      /postman/i,
      /insomnia/i,
      /httpie/i,
      /axios/i,
      /fetch/i,
    ];

    const userAgent = source.userAgent.toLowerCase();

    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        const incident = this.createIncident(
          SecurityIncidentType.BOT_DETECTED,
          SecurityThreatLevel.MEDIUM,
          `Bot user agent detected: ${source.userAgent}`,
          source,
          { userAgent: source.userAgent },
        );
        threats.push(incident);
        break;
      }
    }

    return threats;
  }

  /**
   * Validate content format and structure
   */
  private validateContent(
    data: any,
    source?: { ip?: string; userAgent?: string; referer?: string },
  ): SecurityIncident[] {
    const threats: SecurityIncident[] = [];

    // Validate email format
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        const incident = this.createIncident(
          SecurityIncidentType.MALICIOUS_CONTENT,
          SecurityThreatLevel.MEDIUM,
          "Invalid email format detected",
          source,
          { email: data.email },
        );
        threats.push(incident);
      }
    }

    // Check for suspicious patterns using custom patterns
    for (const pattern of this.suspiciousPatterns) {
      if (!pattern.enabled) continue;

      const fields = ["name", "email", "message", "phone", "subject"];
      for (const field of fields) {
        if (data[field] && pattern.pattern.test(data[field])) {
          const incident = this.createIncident(
            SecurityIncidentType.SUSPICIOUS_PATTERN,
            pattern.severity,
            `Suspicious pattern detected in ${field}: ${pattern.description}`,
            source,
            {
              field,
              pattern: pattern.name,
              value: data[field].substring(0, 100),
            },
          );
          threats.push(incident);
        }
      }
    }

    return threats;
  }

  /**
   * Generate CSRF token
   */
  public generateCSRFToken(): string {
    if (!this.config.csrfTokenSecret) {
      throw new Error("CSRF token secret not configured");
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const token = Buffer.from(`${timestamp}:${random}`).toString("base64");

    this.csrfTokens.set(token, { timestamp, used: false });

    // Clean up old tokens
    this.cleanupCSRFTokens();

    return token;
  }

  /**
   * Validate CSRF token
   */
  public validateCSRFToken(token: string): boolean {
    if (!this.config.csrfTokenSecret) {
      return true; // CSRF protection disabled
    }

    const tokenData = this.csrfTokens.get(token);
    if (!tokenData) {
      return false;
    }

    if (tokenData.used) {
      return false;
    }

    const age = Date.now() - tokenData.timestamp;
    const maxAge = this.config.csrfTokenSecret ? 3600000 : 0; // 1 hour if configured

    if (age > maxAge) {
      this.csrfTokens.delete(token);
      return false;
    }

    // Mark token as used
    tokenData.used = true;

    return true;
  }

  /**
   * Get security headers
   */
  public getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    };

    // Add HSTS header in production
    if (
      typeof window !== "undefined" &&
      window.location?.protocol === "https:"
    ) {
      headers["Strict-Transport-Security"] =
        "max-age=31536000; includeSubDomains";
    }

    return headers;
  }

  /**
   * Get Content Security Policy header
   */
  public getCSPHeader(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ];

    return directives.join("; ");
  }

  /**
   * Sanitize input text
   */
  private sanitizeInput(input: string): string {
    if (!input) return "";

    // Use DOMPurify for HTML sanitization
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize email address
   */
  private sanitizeEmail(email: string): string {
    if (!email) return "";

    // Remove any HTML and trim whitespace
    const sanitized = this.sanitizeInput(email).trim().toLowerCase();

    // Additional email-specific sanitization
    return sanitized.replace(/[^\w@.-]/g, "");
  }

  /**
   * Sanitize phone number
   */
  private sanitizePhone(phone: string): string {
    if (!phone) return "";

    // Remove any HTML and non-phone characters
    const sanitized = this.sanitizeInput(phone);

    // Keep only digits, plus, hyphens, parentheses, and spaces
    return sanitized.replace(/[^\d\s\-()+]/g, "");
  }

  /**
   * Create security incident
   */
  private createIncident(
    type: SecurityIncidentType,
    severity: SecurityThreatLevel,
    description: string,
    source?: {
      ip?: string;
      email?: string;
      userAgent?: string;
      referer?: string;
    },
    details: Record<string, any> = {},
  ): SecurityIncident {
    return {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      severity,
      description,
      timestamp: new Date(),
      source: {
        ip: source?.ip,
        email: source?.email || details.email, // Use email as source if no IP
        userAgent: source?.userAgent,
        referer: source?.referer,
      },
      details,
      blocked:
        severity === SecurityThreatLevel.CRITICAL ||
        severity === SecurityThreatLevel.HIGH,
      resolved: false,
    };
  }

  /**
   * Record security incident
   */
  private recordIncident(incident: SecurityIncident): void {
    this.incidents.push(incident);

    // Log incident
    console.warn(`Security incident recorded:`, {
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
      source: incident.source,
      timestamp: incident.timestamp.toISOString(),
    });

    // Auto-block high severity threats
    if (
      incident.severity === SecurityThreatLevel.CRITICAL ||
      incident.severity === SecurityThreatLevel.HIGH
    ) {
      if (incident.source.ip) {
        this.blockedIps.add(incident.source.ip);
      }
      if (incident.source.email) {
        this.blockedEmails.add(incident.source.email);
      }
    }

    // Cleanup old incidents
    this.cleanupIncidents();
  }

  /**
   * Check if IP is blocked
   */
  private isBlockedIp(ip: string): boolean {
    return this.blockedIps.has(ip);
  }

  /**
   * Check if email is blocked
   */
  private isBlockedEmail(email: string): boolean {
    return this.blockedEmails.has(email.toLowerCase());
  }

  /**
   * Initialize security patterns
   */
  private initializeSecurityPatterns(): SecurityPattern[] {
    const defaultPatterns: SecurityPattern[] = [
      {
        name: "excessive_links",
        pattern: /https?:\/\/[^\s]+/gi,
        severity: SecurityThreatLevel.MEDIUM,
        description: "Excessive URLs in content",
        enabled: true,
      },
      {
        name: "base64_content",
        pattern: /[A-Za-z0-9+/]{20,}={0,2}/g,
        severity: SecurityThreatLevel.HIGH,
        description: "Base64 encoded content detected",
        enabled: true,
      },
      {
        name: "script_like_content",
        pattern: /(function|var|let|const|if|for|while|return)\s*\(/gi,
        severity: SecurityThreatLevel.HIGH,
        description: "Script-like content detected",
        enabled: true,
      },
    ];

    return [...defaultPatterns, ...(this.config.customPatterns || [])];
  }

  /**
   * Cleanup old CSRF tokens
   */
  private cleanupCSRFTokens(): void {
    const now = Date.now();
    const maxAge = this.config.csrfTokenSecret ? 3600000 : 0; // 1 hour

    for (const [token, data] of this.csrfTokens.entries()) {
      if (now - data.timestamp > maxAge) {
        this.csrfTokens.delete(token);
      }
    }
  }

  /**
   * Cleanup old incidents
   */
  private cleanupIncidents(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.incidents = this.incidents.filter(
      (incident) => incident.timestamp >= cutoff,
    );
  }

  /**
   * Get security statistics
   */
  public getStatistics(): {
    totalIncidents: number;
    blockedIps: number;
    blockedEmails: number;
    incidentsByType: Record<SecurityIncidentType, number>;
    incidentsBySeverity: Record<SecurityThreatLevel, number>;
  } {
    const incidentsByType: Record<string, number> = {};
    const incidentsBySeverity: Record<string, number> = {};

    for (const incident of this.incidents) {
      incidentsByType[incident.type] =
        (incidentsByType[incident.type] || 0) + 1;
      incidentsBySeverity[incident.severity] =
        (incidentsBySeverity[incident.severity] || 0) + 1;
    }

    return {
      totalIncidents: this.incidents.length,
      blockedIps: this.blockedIps.size,
      blockedEmails: this.blockedEmails.size,
      incidentsByType: incidentsByType as Record<SecurityIncidentType, number>,
      incidentsBySeverity: incidentsBySeverity as Record<
        SecurityThreatLevel,
        number
      >,
    };
  }

  /**
   * Get recent incidents
   */
  public getRecentIncidents(hours: number = 24): SecurityIncident[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.incidents.filter((incident) => incident.timestamp >= cutoff);
  }

  /**
   * Block IP address
   */
  public blockIp(ip: string, reason: string = "Manual block"): void {
    this.blockedIps.add(ip);

    const incident = this.createIncident(
      SecurityIncidentType.BOT_DETECTED,
      SecurityThreatLevel.HIGH,
      `IP blocked manually: ${reason}`,
      { ip },
      { reason, manual: true },
    );
    this.recordIncident(incident);
  }

  /**
   * Block email address
   */
  public blockEmail(email: string, reason: string = "Manual block"): void {
    this.blockedEmails.add(email.toLowerCase());

    const incident = this.createIncident(
      SecurityIncidentType.SPAM_DETECTED,
      SecurityThreatLevel.HIGH,
      `Email blocked manually: ${reason}`,
      { email },
      { reason, manual: true },
    );
    this.recordIncident(incident);
  }

  /**
   * Unblock IP address
   */
  public unblockIp(ip: string): void {
    this.blockedIps.delete(ip);
  }

  /**
   * Unblock email address
   */
  public unblockEmail(email: string): void {
    this.blockedEmails.delete(email.toLowerCase());
  }
}

/**
 * Factory for creating pre-configured security managers
 */
export class SecurityManagerFactory {
  /**
   * Create security manager for contact form
   */
  public static createContactFormSecurity(): EmailSecurityManager {
    return new EmailSecurityManager({
      enableXssProtection: true,
      enableSpamDetection: true,
      enableBotDetection: true,
      enableContentValidation: true,
      enableHeaderInjectionProtection: true,
      strictMode: false,
      maxContentLength: 2000,
      blockedDomains: [
        "10minutemail.com",
        "guerrillamail.com",
        "mailinator.com",
        "tempmail.org",
        "yopmail.com",
      ],
    });
  }

  /**
   * Create strict security manager
   */
  public static createStrictSecurity(): EmailSecurityManager {
    return new EmailSecurityManager({
      enableXssProtection: true,
      enableSpamDetection: true,
      enableBotDetection: true,
      enableContentValidation: true,
      enableHeaderInjectionProtection: true,
      strictMode: true,
      maxContentLength: 1000,
      customPatterns: [
        {
          name: "excessive_special_chars",
          pattern: /[^\w\s\-@.,!?]/g,
          severity: SecurityThreatLevel.MEDIUM,
          description: "Excessive special characters",
          enabled: true,
        },
      ],
    });
  }
}
