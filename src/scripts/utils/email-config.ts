/**
 * LOFERSIL Landing Page - Email Configuration Module
 * TypeScript interfaces and validation for email configuration
 */

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateLimit?: number;
  timeout?: number;
}

export interface EmailConfig {
  smtp: SMTPConfig;
  from: string;
  to: string[];
  replyTo?: string;
  subject?: string;
  template?: string;
}

export interface EmailProvider {
  name: string;
  displayName: string;
  defaultConfig: Partial<SMTPConfig>;
  authType: "password" | "oauth2" | "api-key";
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  ports: {
    secure: number;
    insecure: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ConnectionTestResult {
  success: boolean;
  responseTime?: number;
  error?: string;
  serverInfo?: {
    host: string;
    port: number;
    secure: boolean;
  };
}

export interface EmailTestResult {
  success: boolean;
  messageId?: string;
  responseTime?: number;
  error?: string;
  previewUrl?: string;
}

export interface EmailTestConfig {
  recipient: string;
  subject?: string;
  template?: "contact" | "test" | "verification";
  variables?: Record<string, unknown>;
}

export interface MockSMTPResponse {
  code: number;
  message: string;
  delay?: number;
  error?: boolean;
}

export enum SMTPProviders {
  GMAIL = "gmail",
  OUTLOOK = "outlook",
  YAHOO = "yahoo",
  CUSTOM = "custom",
}

export const EMAIL_PROVIDERS: Record<SMTPProviders, EmailProvider> = {
  [SMTPProviders.GMAIL]: {
    name: SMTPProviders.GMAIL,
    displayName: "Gmail",
    defaultConfig: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14,
      timeout: 60000,
    },
    authType: "password",
    requiredEnvVars: ["SMTP_USER", "SMTP_PASS"],
    optionalEnvVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE"],
    ports: {
      secure: 465,
      insecure: 587,
    },
  },
  [SMTPProviders.OUTLOOK]: {
    name: SMTPProviders.OUTLOOK,
    displayName: "Outlook/Hotmail",
    defaultConfig: {
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 30,
      timeout: 30000,
    },
    authType: "password",
    requiredEnvVars: ["SMTP_USER", "SMTP_PASS"],
    optionalEnvVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE"],
    ports: {
      secure: 587,
      insecure: 587,
    },
  },
  [SMTPProviders.YAHOO]: {
    name: SMTPProviders.YAHOO,
    displayName: "Yahoo Mail",
    defaultConfig: {
      host: "smtp.mail.yahoo.com",
      port: 587,
      secure: false,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      rateLimit: 60,
      timeout: 45000,
    },
    authType: "password",
    requiredEnvVars: ["SMTP_USER", "SMTP_PASS"],
    optionalEnvVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE"],
    ports: {
      secure: 465,
      insecure: 587,
    },
  },
  [SMTPProviders.CUSTOM]: {
    name: SMTPProviders.CUSTOM,
    displayName: "Custom SMTP Server",
    defaultConfig: {
      host: "localhost",
      port: 587,
      secure: false,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      timeout: 30000,
    },
    authType: "password",
    requiredEnvVars: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    optionalEnvVars: ["SMTP_PORT", "SMTP_SECURE"],
    ports: {
      secure: 465,
      insecure: 587,
    },
  },
};

export const SMTP_MOCK_RESPONSES: Record<string, MockSMTPResponse[]> = {
  success: [
    { code: 220, message: "SMTP server ready" },
    { code: 250, message: "Authentication successful" },
    { code: 250, message: "Sender OK" },
    { code: 250, message: "Recipient OK" },
    { code: 354, message: "Start mail input" },
    { code: 250, message: "Message accepted" },
  ],
  auth_failure: [
    { code: 220, message: "SMTP server ready" },
    { code: 535, message: "Authentication failed", error: true },
  ],
  connection_timeout: [
    { code: 421, message: "Connection timeout", error: true },
  ],
  rate_limit: [
    { code: 220, message: "SMTP server ready" },
    { code: 250, message: "Authentication successful" },
    { code: 451, message: "Rate limit exceeded", error: true },
  ],
  recipient_error: [
    { code: 220, message: "SMTP server ready" },
    { code: 250, message: "Authentication successful" },
    { code: 250, message: "Sender OK" },
    { code: 550, message: "Invalid recipient address", error: true },
  ],
};
