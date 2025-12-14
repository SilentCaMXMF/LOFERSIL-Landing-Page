/**
 * LOFERSIL Landing Page - Email Testing Utilities
 * Comprehensive email testing and SMTP validation utilities
 */

import type {
  SMTPConfig,
  EmailConfig,
  ValidationResult,
  ConnectionTestResult,
  EmailTestResult,
  EmailTestConfig,
  MockSMTPResponse,
  EmailProvider,
} from "./email-config.js";
import { SMTPProviders, EMAIL_PROVIDERS } from "./email-config.js";
import {
  getSmtpConfig,
  getEmailEnvironmentConfig,
  validateEmailEnvironment,
} from "./env-validator.js";

export class EmailTester {
  private mockMode: boolean = false;
  private mockResponses: MockSMTPResponse[] = [];
  private configCache: Map<string, EmailConfig> = new Map();

  constructor(mockMode: boolean = false) {
    this.mockMode = mockMode;
  }

  public async testSMTPConnection(
    config: SMTPConfig,
  ): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      if (this.mockMode) {
        return this.mockSMTPConnectionTest(config);
      }

      const nodemailer = (await import("nodemailer")) as any;

      const transporter = nodemailer.default.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        pool: false,
        connectionTimeout: config.timeout || 30000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      try {
        await transporter.verify();
        const responseTime = Date.now() - startTime;

        return {
          success: true,
          responseTime,
          serverInfo: {
            host: config.host,
            port: config.port,
            secure: config.secure,
          },
        };
      } finally {
        transporter.close();
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTime,
        error:
          error instanceof Error
            ? error.message
            : "Unknown SMTP connection error",
        serverInfo: {
          host: config.host,
          port: config.port,
          secure: config.secure,
        },
      };
    }
  }

  public async sendTestEmail(
    config: EmailConfig,
    testConfig: EmailTestConfig,
  ): Promise<EmailTestResult> {
    const startTime = Date.now();

    try {
      if (this.mockMode) {
        return this.mockEmailSend(testConfig);
      }

      const nodemailer = (await import("nodemailer")) as any;

      const transporter = nodemailer.default.createTransporter({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.auth,
        pool: config.smtp.pool || true,
        maxConnections: config.smtp.maxConnections || 5,
        maxMessages: config.smtp.maxMessages || 100,
        rateLimit: config.smtp.rateLimit,
      });

      const mailOptions = this.buildEmailMessage(config, testConfig);

      const result = await transporter.sendMail(mailOptions);
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        messageId: result.messageId,
        responseTime,
        previewUrl: this.getPreviewUrl(result),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        responseTime,
        error:
          error instanceof Error
            ? error.message
            : "Unknown email sending error",
      };
    }
  }

  public validateEmailConfig(config: EmailConfig): ValidationResult {
    const warnings: string[] = [];

    if (!config.smtp) {
      return {
        isValid: false,
        error: "SMTP configuration is required",
      };
    }

    const smtpValidation = this.validateSMTPConfig(config.smtp);
    if (!smtpValidation.isValid) {
      return smtpValidation;
    }

    if (smtpValidation.warnings) {
      warnings.push(...smtpValidation.warnings);
    }

    if (!config.from) {
      return {
        isValid: false,
        error: "From email address is required",
      };
    }

    if (!this.isValidEmail(config.from)) {
      return {
        isValid: false,
        error: "Invalid from email address",
      };
    }

    if (!config.to || config.to.length === 0) {
      return {
        isValid: false,
        error: "At least one recipient email address is required",
      };
    }

    const invalidToEmails = config.to.filter(
      (email) => !this.isValidEmail(email),
    );
    if (invalidToEmails.length > 0) {
      return {
        isValid: false,
        error: `Invalid recipient email addresses: ${invalidToEmails.join(", ")}`,
      };
    }

    if (config.replyTo && !this.isValidEmail(config.replyTo)) {
      return {
        isValid: false,
        error: "Invalid reply-to email address",
      };
    }

    if (config.to.length > 50) {
      warnings.push(
        "Sending to more than 50 recipients may trigger spam filters",
      );
    }

    if (config.smtp.rateLimit && config.smtp.rateLimit < 10) {
      warnings.push("Very low rate limit may cause delays in sending emails");
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  public async simulateSMTPFailure(type: string): Promise<void> {
    const responseMap: Record<string, MockSMTPResponse[]> = {
      auth_failure: [
        {
          code: 535,
          message: "Authentication credentials invalid",
          error: true,
        },
      ],
      connection_timeout: [
        { code: 421, message: "Connection timed out", error: true },
      ],
      rate_limit: [
        {
          code: 451,
          message: "Rate limit exceeded, please try again later",
          error: true,
        },
      ],
      recipient_error: [
        { code: 550, message: "Recipient address rejected", error: true },
      ],
      server_error: [{ code: 554, message: "Transaction failed", error: true }],
    };

    this.mockResponses = responseMap[type] || responseMap["server_error"];

    if (this.mockResponses.length > 0) {
      const error = new Error(this.mockResponses[0].message);
      (error as any).code = this.mockResponses[0].code;
      throw error;
    }
  }

  public createConfigFromEnvironment(): EmailConfig {
    // Use environment validator for consistent validation and configuration
    const validation = validateEmailEnvironment();

    if (!validation.isValid) {
      throw new Error(
        `Invalid email environment configuration. Missing: ${validation.missingVariables.join(", ")}, Invalid: ${validation.invalidVariables.join(", ")}`,
      );
    }

    const envKey = `${validation.smtpConfig?.host}:${validation.smtpConfig?.port}:${validation.smtpConfig?.auth.user}`;

    if (this.configCache.has(envKey)) {
      return this.configCache.get(envKey)!;
    }

    const smtpConfig = getSmtpConfig();
    if (!smtpConfig) {
      throw new Error(
        "Failed to create SMTP configuration from environment variables",
      );
    }

    const emailEnvConfig = getEmailEnvironmentConfig();

    const config: EmailConfig = {
      smtp: smtpConfig,
      from: emailEnvConfig.from || smtpConfig.auth.user,
      to: emailEnvConfig.to || [smtpConfig.auth.user],
      replyTo: emailEnvConfig.replyTo,
      subject: emailEnvConfig.subjectPrefix,
    };

    this.configCache.set(envKey, config);
    return config;
  }

  public detectProvider(config: SMTPConfig): SMTPProviders {
    const host = config.host.toLowerCase();

    if (host.includes("gmail.com") || host.includes("googlemail.com")) {
      return SMTPProviders.GMAIL;
    }

    if (
      host.includes("outlook.com") ||
      host.includes("hotmail.com") ||
      host.includes("live.com")
    ) {
      return SMTPProviders.OUTLOOK;
    }

    if (host.includes("yahoo.com")) {
      return SMTPProviders.YAHOO;
    }

    return SMTPProviders.CUSTOM;
  }

  public optimizeConfigForProvider(
    config: SMTPConfig,
    provider: SMTPProviders,
  ): SMTPConfig {
    const { defaultConfig } = EMAIL_PROVIDERS[provider];

    return {
      ...defaultConfig,
      ...config,
      auth: config.auth || defaultConfig.auth,
    };
  }

  private validateSMTPConfig(config: SMTPConfig): ValidationResult {
    const warnings: string[] = [];

    if (!config.host) {
      return {
        isValid: false,
        error: "SMTP host is required",
      };
    }

    if (!config.port || config.port < 1 || config.port > 65535) {
      return {
        isValid: false,
        error: "Valid SMTP port (1-65535) is required",
      };
    }

    if (
      config.port !== 25 &&
      config.port !== 465 &&
      config.port !== 587 &&
      config.port !== 2525
    ) {
      warnings.push("Non-standard SMTP port may cause connection issues");
    }

    if (!config.auth) {
      return {
        isValid: false,
        error: "SMTP authentication configuration is required",
      };
    }

    if (!config.auth.user) {
      return {
        isValid: false,
        error: "SMTP username is required",
      };
    }

    if (!config.auth.pass) {
      return {
        isValid: false,
        error: "SMTP password is required",
      };
    }

    if (config.timeout && config.timeout < 5000) {
      warnings.push("Very low timeout may cause premature connection failures");
    }

    if (config.rateLimit && config.rateLimit > 1000) {
      warnings.push("Very high rate limit may trigger spam filters");
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  private buildEmailMessage(config: EmailConfig, testConfig: EmailTestConfig) {
    const subject = testConfig.subject || "LOFERSIL - Test Email";
    const timestamp = new Date().toISOString();

    const templates = {
      contact: `
        <h2>Nova mensagem de contacto de teste</h2>
        <p><strong>Email:</strong> ${testConfig.recipient}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <hr>
        <p><em>Este é um email de teste do sistema da LOFERSIL</em></p>
      `,
      test: `
        <h2>LOFERSIL - Email de Teste</h2>
        <p>Este é um email de teste automatizado para verificar a configuração SMTP.</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>Destinatário:</strong> ${testConfig.recipient}</p>
        <hr>
        <p><small>Se recebeu este email, a configuração SMTP está a funcionar corretamente.</small></p>
      `,
      verification: `
        <h2>LOFERSIL - Verificação de Email</h2>
        <p>Este email foi enviado para verificar a configuração do sistema de email.</p>
        <p><strong>Código de Verificação:</strong> ${Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <hr>
        <p><small>Email automatizado - não responda a esta mensagem.</small></p>
      `,
    };

    const htmlContent = templates[testConfig.template || "test"];

    return {
      from: config.from,
      to: testConfig.recipient,
      subject,
      html: htmlContent,
      replyTo: config.replyTo || config.from,
      headers: {
        "X-Priority": "3",
        "X-Mailer": "LOFERSIL Email Tester",
        "X-LOFERSIL-Test": "true",
      },
    };
  }

  private getPreviewUrl(result: any): string | undefined {
    if (typeof result === "object" && result.previewUrl) {
      return result.previewUrl;
    }

    if (typeof result === "object" && result.messageId) {
      return `https://mail.google.com/mail/u/0/#inbox/${result.messageId}`;
    }

    return undefined;
  }

  private mockSMTPConnectionTest(config: SMTPConfig): ConnectionTestResult {
    const responseTime = 150 + Math.random() * 200;

    if (config.auth.user === "fail@test.com") {
      return {
        success: false,
        responseTime,
        error: "Authentication failed: 535 Authentication credentials invalid",
        serverInfo: {
          host: config.host,
          port: config.port,
          secure: config.secure,
        },
      };
    }

    if (config.host.includes("timeout.test")) {
      return {
        success: false,
        responseTime: 30000,
        error: "Connection timeout: 421 Service not available",
        serverInfo: {
          host: config.host,
          port: config.port,
          secure: config.secure,
        },
      };
    }

    if (
      config.host.includes("invalid") ||
      config.host.includes("nonexistent")
    ) {
      return {
        success: false,
        responseTime,
        error: "Connection failed: ENOTFOUND",
        serverInfo: {
          host: config.host,
          port: config.port,
          secure: config.secure,
        },
      };
    }

    return {
      success: true,
      responseTime,
      serverInfo: {
        host: config.host,
        port: config.port,
        secure: config.secure,
      },
    };
  }

  private mockEmailSend(testConfig: EmailTestConfig): EmailTestResult {
    const responseTime = 200 + Math.random() * 300;

    if (testConfig.recipient === "fail@test.com") {
      return {
        success: false,
        responseTime,
        error: "550 Recipient address rejected: fail@test.com",
      };
    }

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      responseTime,
      previewUrl: `https://ethereal.email/message/${Math.random().toString(36).substring(2)}`,
    };
  }

  public setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }

  public clearConfigCache(): void {
    this.configCache.clear();
  }
}

export default EmailTester;
