/**
 * LOFERSIL Landing Page - Test Email Recipient Utilities
 * Mock email service for testing email functionality
 */

import { ContactRequest } from "../validation.js";

// Ethereal email configuration
interface EtherealConfig {
  user: string;
  pass: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
}

// Test email result interface
export interface TestEmailResult {
  success: boolean;
  emailId: string;
  messageId?: string;
  previewUrl?: string;
  provider?: string;
  recipients: string[];
  trapped?: boolean;
  rateLimited?: boolean;
  deliveryTime: number;
  timestamp: Date;
}

// Email trapping interface
export interface TrappedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  headers: Record<string, string>;
  receivedAt: Date;
  size: number;
}

// Reply-to test result
export interface ReplyToTestResult {
  success: boolean;
  replyToWorked: boolean;
  deliveredTo?: string;
  responseTime: number;
  error?: string;
}

// Mock email provider configuration
export interface MockEmailProvider {
  name: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  limits: {
    maxRecipients: number;
    maxSize: number;
    rateLimit: number; // emails per minute
  };
}

/**
 * Test Email Recipient Utility
 * Provides mock email services for testing email functionality
 */
export class TestEmailRecipient {
  private etherealConfig: EtherealConfig | null = null;
  private trappedEmails: Map<string, TrappedEmail> = new Map();
  private emailCounter: number = 0;
  private rateLimitTracker: Map<string, number[]> = new Map();
  private mockProviders: Map<string, MockEmailProvider> = new Map();
  private isEmailTrappingEnabled: boolean = false;

  constructor() {
    this.initializeMockProviders();
  }

  /**
   * Initialize mock email providers for testing
   */
  private initializeMockProviders(): void {
    // Gmail mock configuration
    this.mockProviders.set("Gmail", {
      name: "Gmail",
      smtp: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
      },
      limits: {
        maxRecipients: 50,
        maxSize: 25 * 1024 * 1024, // 25MB
        rateLimit: 100,
      },
    });

    // Outlook mock configuration
    this.mockProviders.set("Outlook", {
      name: "Outlook",
      smtp: {
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
      },
      limits: {
        maxRecipients: 100,
        maxSize: 20 * 1024 * 1024, // 20MB
        rateLimit: 120,
      },
    });

    // Custom domain mock configuration
    this.mockProviders.set("Custom Domain", {
      name: "Custom Domain",
      smtp: {
        host: "smtp.lofersil.pt",
        port: 587,
        secure: false,
      },
      limits: {
        maxRecipients: 200,
        maxSize: 50 * 1024 * 1024, // 50MB
        rateLimit: 200,
      },
    });
  }

  /**
   * Setup mock email service for testing
   */
  public async setupMockEmailService(): Promise<void> {
    try {
      // Initialize rate limiting
      this.rateLimitTracker.clear();

      // Setup email trapping if enabled
      if (this.isEmailTrappingEnabled) {
        await this.enableEmailTrapping();
      }

      console.log("Mock email service setup completed");
    } catch (error) {
      console.error("Failed to setup mock email service:", error);
      throw error;
    }
  }

  /**
   * Setup Ethereal email account for testing
   */
  public async setupEtherealAccount(): Promise<EtherealConfig> {
    try {
      // Create a mock Ethereal account
      this.etherealConfig = {
        user: "test@ethereal.email",
        pass: "test_password_123456",
        smtp: {
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
        },
      };

      return this.etherealConfig;
    } catch (error) {
      console.error("Failed to setup Ethereal account:", error);
      throw error;
    }
  }

  /**
   * Send test email using mock service
   */
  public async sendTestEmail(
    data: ContactRequest,
    options: {
      provider?: string;
      additionalRecipients?: string[];
      language?: string;
      priority?: "high" | "normal" | "low";
    } = {},
  ): Promise<TestEmailResult> {
    const startTime = Date.now();
    this.emailCounter++;

    try {
      // Check rate limiting
      const rateLimitKey = data.email;
      if (this.isRateLimited(rateLimitKey)) {
        return {
          success: false,
          emailId: `email_${this.emailCounter}`,
          recipients: [data.email],
          trapped: this.isEmailTrappingEnabled,
          rateLimited: true,
          deliveryTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      // Get provider configuration
      const providerName = options.provider || "Custom Domain";
      const provider = this.mockProviders.get(providerName);
      if (!provider) {
        throw new Error(`Provider ${providerName} not configured`);
      }

      // Validate email size
      const emailSize = this.calculateEmailSize(data);
      if (emailSize > provider.limits.maxSize) {
        throw new Error("Email size exceeds provider limits");
      }

      // Prepare recipients
      const recipients = [data.email];
      if (options.additionalRecipients) {
        recipients.push(...options.additionalRecipients);
      }

      if (recipients.length > provider.limits.maxRecipients) {
        throw new Error("Too many recipients");
      }

      // Generate email content
      const emailContent = this.generateEmailContent(data, {
        language: options.language || "pt-PT",
        provider: providerName,
      });

      // Create email record
      const emailId = `email_${this.emailCounter}`;
      const email: TrappedEmail = {
        id: emailId,
        from: `noreply@lofersil.pt`,
        to: recipients,
        subject: `Nova mensagem de contacto - ${data.name}`,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        headers: {
          "Reply-To": data.email,
          "Content-Type": "text/html; charset=UTF-8",
          "X-Priority": options.priority === "high" ? "1" : "3",
          "X-Mailer": "LOFERSIL Test Email Service",
        },
        receivedAt: new Date(),
        size: emailSize,
      };

      // Trap email if enabled
      if (this.isEmailTrappingEnabled) {
        this.trappedEmails.set(emailId, email);
      }

      // Update rate limiting
      this.updateRateLimit(rateLimitKey);

      const deliveryTime = Date.now() - startTime;

      return {
        success: true,
        emailId,
        messageId: `msg_${this.emailCounter}`,
        previewUrl: this.isEmailTrappingEnabled
          ? `http://localhost:3000/test-email/${emailId}`
          : undefined,
        provider: providerName,
        recipients,
        trapped: this.isEmailTrappingEnabled,
        deliveryTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        emailId: `email_${this.emailCounter}`,
        recipients: [data.email],
        deliveryTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send test email via Ethereal
   */
  public async sendTestEmailViaEthereal(
    data: ContactRequest,
  ): Promise<TestEmailResult> {
    const startTime = Date.now();
    this.emailCounter++;

    try {
      if (!this.etherealConfig) {
        throw new Error("Ethereal account not setup");
      }

      // Generate email content for Ethereal
      const emailContent = this.generateEmailContent(data, {
        language: "pt-PT",
        provider: "Ethereal",
      });

      // Simulate Ethereal email sending
      const messageId = `ethereal_${this.emailCounter}`;
      const previewUrl = `https://ethereal.email/message/${messageId}`;

      // Store as trapped email for validation
      const email: TrappedEmail = {
        id: `ethereal_${this.emailCounter}`,
        from: `test@ethereal.email`,
        to: ["contact@lofersil.pt"],
        subject: `Nova mensagem de contacto - ${data.name}`,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        headers: {
          "Reply-To": data.email,
          "Content-Type": "text/html; charset=UTF-8",
          "X-Ethereal-Test": "true",
        },
        receivedAt: new Date(),
        size: this.calculateEmailSize(data),
      };

      this.trappedEmails.set(email.id, email);

      return {
        success: true,
        emailId: email.id,
        messageId,
        previewUrl,
        provider: "Ethereal",
        recipients: ["contact@lofersil.pt"],
        trapped: true,
        deliveryTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        emailId: `ethereal_failed_${this.emailCounter}`,
        recipients: ["contact@lofersil.pt"],
        deliveryTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test reply-to functionality
   */
  public async testReplyTo(
    emailId: string,
    options: {
      replyToEmail?: string;
      testMessage?: string;
    } = {},
  ): Promise<ReplyToTestResult> {
    const startTime = Date.now();

    try {
      const trappedEmail = this.trappedEmails.get(emailId);
      if (!trappedEmail) {
        throw new Error("Email not found for reply-to testing");
      }

      const replyToEmail =
        options.replyToEmail || trappedEmail.headers["Reply-To"];
      if (!replyToEmail) {
        throw new Error("No Reply-To header found");
      }

      // Simulate reply email sending
      const replyContent = this.generateReplyContent(
        options.testMessage || "Test reply message",
      );

      // Simulate delivery to reply-to address
      const replyEmail: TrappedEmail = {
        id: `reply_${Date.now()}`,
        from: "contact@lofersil.pt",
        to: [replyToEmail],
        subject: `Re: ${trappedEmail.subject}`,
        htmlContent: replyContent.html,
        textContent: replyContent.text,
        headers: {
          "In-Reply-To": trappedEmail.id,
          References: trappedEmail.id,
          "Content-Type": "text/html; charset=UTF-8",
        },
        receivedAt: new Date(),
        size: replyContent.html.length,
      };

      this.trappedEmails.set(replyEmail.id, replyEmail);

      return {
        success: true,
        replyToWorked: true,
        deliveredTo: replyToEmail,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        replyToWorked: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Enable email trapping for testing
   */
  public async enableEmailTrapping(): Promise<void> {
    this.isEmailTrappingEnabled = true;
    console.log("Email trapping enabled for testing");
  }

  /**
   * Disable email trapping
   */
  public async disableEmailTrapping(): Promise<void> {
    this.isEmailTrappingEnabled = false;
    console.log("Email trapping disabled");
  }

  /**
   * Get trapped email by ID
   */
  public async getTrappedEmail(emailId: string): Promise<TrappedEmail | null> {
    return this.trappedEmails.get(emailId) || null;
  }

  /**
   * Get all trapped emails
   */
  public async getAllTrappedEmails(): Promise<TrappedEmail[]> {
    return Array.from(this.trappedEmails.values());
  }

  /**
   * Cleanup trapped emails
   */
  public async cleanupTrappedEmails(): Promise<void> {
    this.trappedEmails.clear();
    console.log("Trapped emails cleaned up");
  }

  /**
   * Validate Ethereal email
   */
  public async validateEtherealEmail(messageId: string): Promise<{
    received: boolean;
    contentMatch: boolean;
    headersValid: boolean;
    previewAvailable: boolean;
  }> {
    try {
      // Find the corresponding trapped email
      const etherealEmail = Array.from(this.trappedEmails.values()).find(
        (email) =>
          email.id.startsWith("ethereal_") && email.id.includes(messageId),
      );

      if (!etherealEmail) {
        return {
          received: false,
          contentMatch: false,
          headersValid: false,
          previewAvailable: false,
        };
      }

      return {
        received: true,
        contentMatch: etherealEmail.htmlContent.length > 0,
        headersValid: !!etherealEmail.headers["Reply-To"],
        previewAvailable: true,
      };
    } catch (error) {
      return {
        received: false,
        contentMatch: false,
        headersValid: false,
        previewAvailable: false,
      };
    }
  }

  /**
   * Cleanup test resources
   */
  public async cleanup(): Promise<void> {
    await this.cleanupTrappedEmails();
    this.rateLimitTracker.clear();
    this.emailCounter = 0;
    console.log("Test email recipient cleanup completed");
  }

  /**
   * Generate email content
   */
  private generateEmailContent(
    data: ContactRequest,
    options: {
      language: string;
      provider: string;
    },
  ): { html: string; text: string } {
    const timestamp = new Date().toLocaleString(
      options.language === "pt-PT" ? "pt-PT" : "en-US",
    );

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Nova mensagem de contacto</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Nome:</strong> ${this.escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${this.escapeHtml(data.email)}">${this.escapeHtml(data.email)}</a></p>
          ${data.phone ? `<p><strong>Telefone:</strong> ${this.escapeHtml(data.phone)}</p>` : ""}
          <p><strong>Mensagem:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 3px; margin-top: 10px;">
            ${this.escapeHtml(data.message).replace(/\n/g, "<br>")}
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          Enviado através do formulário de contacto em ${timestamp}<br>
          Provider: ${options.provider}<br>
          Test Email ID: ${this.emailCounter}
        </p>
      </div>
    `;

    const text = `
Nova mensagem de contacto

Nome: ${data.name}
Email: ${data.email}
${data.phone ? `Telefone: ${data.phone}` : ""}

Mensagem:
${data.message}

---
Enviado através do formulário de contacto em ${timestamp}
Provider: ${options.provider}
Test Email ID: ${this.emailCounter}
    `;

    return { html, text };
  }

  /**
   * Generate reply content
   */
  private generateReplyContent(message: string): {
    html: string;
    text: string;
  } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #333;">Resposta automática de teste</h3>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p>${this.escapeHtml(message)}</p>
        </div>
        <p style="font-size: 12px; color: #666;">Esta é uma resposta de teste automática.</p>
      </div>
    `;

    const text = `
Resposta automática de teste

${message}

---
Esta é uma resposta de teste automática.
    `;

    return { html, text };
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Calculate email size
   */
  private calculateEmailSize(data: ContactRequest): number {
    const content = JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      message: data.message,
    });

    return Buffer.byteLength(content, "utf8");
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5; // 5 requests per minute

    const requests = this.rateLimitTracker.get(key) || [];
    const recentRequests = requests.filter(
      (timestamp) => now - timestamp < windowMs,
    );

    return recentRequests.length >= maxRequests;
  }

  /**
   * Update rate limit tracker
   */
  private updateRateLimit(key: string): void {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(key) || [];
    requests.push(now);

    // Keep only requests from the last hour
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentRequests = requests.filter(
      (timestamp) => timestamp > oneHourAgo,
    );

    this.rateLimitTracker.set(key, recentRequests);
  }
}
