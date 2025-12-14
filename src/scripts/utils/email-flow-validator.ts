/**
 * LOFERSIL Landing Page - Email Flow Validation Utilities
 * Validates complete email sending pipeline and content
 */

import { ContactRequest } from "../validation.js";
import { TestEmailRecipient } from "./test-email-recipient.js";

// Email flow validation result
export interface EmailFlowResult {
  isValid: boolean;
  emailDelivered: boolean;
  contentValid: boolean;
  headersValid: boolean;
  replyToValid: boolean;
  deliveryTime: number;
  stages: string[];
  stageResults: StageResult[];
  errors: string[];
  warnings: string[];
}

// Individual stage result
export interface StageResult {
  stage: string;
  success: boolean;
  duration: number;
  error?: string;
  metadata?: Record<string, any>;
}

// Email content validation result
export interface EmailContentValidation {
  emailId: string;
  htmlContent: string;
  textContent: string;
  subject: string;
  sanitized: boolean;
  encoding: string;
  contentValid: boolean;
  size: number;
  structureValid: boolean;
  hasRequiredFields: boolean;
  portugueseContentValid: boolean;
}

// Email headers validation result
export interface EmailHeadersValidation {
  emailId: string;
  headers: Record<string, string>;
  validHeaders: string[];
  missingHeaders: string[];
  invalidHeaders: string[];
  replyToValid: boolean;
  contentTypeValid: boolean;
  encodingValid: boolean;
  securityHeadersValid: boolean;
}

// Email size validation result
export interface EmailSizeValidation {
  isValid: boolean;
  totalSize: number;
  maxSize: number;
  sizeBreakdown: {
    headers: number;
    htmlContent: number;
    textContent: number;
    attachments: number;
  };
  errors: string[];
  warnings: string[];
}

// Email address validation result
export interface EmailAddressValidation {
  isValid: boolean;
  email: string;
  localPart: string;
  domain: string;
  issues: string[];
  suggestions: string[];
  provider?: string;
  disposable: boolean;
}

// Provider compatibility result
export interface ProviderCompatibilityResult {
  compatible: boolean;
  provider: string;
  supportedFeatures: string[];
  unsupportedFeatures: string[];
  limitations: string[];
  recommendations: string[];
}

// Email flow analytics
export interface EmailFlowAnalytics {
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  successRate: number;
  averageDeliveryTime: number;
  providerStats: Record<
    string,
    {
      count: number;
      successRate: number;
      averageTime: number;
    }
  >;
  errorBreakdown: Record<string, number>;
  performanceMetrics: {
    fastestDelivery: number;
    slowestDelivery: number;
    totalDeliveryTime: number;
  };
}

/**
 * Email Flow Validator
 * Comprehensive validation for email sending pipeline
 */
export class EmailFlowValidator {
  private testEmailRecipient: TestEmailRecipient;
  private emailHistory: EmailFlowResult[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.testEmailRecipient = new TestEmailRecipient();
  }

  /**
   * Validate complete email flow from submission to delivery
   */
  public async validateEmailFlow(
    data: ContactRequest,
    options: {
      timeout?: number;
      validateContent?: boolean;
      validateHeaders?: boolean;
      testReplyTo?: boolean;
    } = {},
  ): Promise<EmailFlowResult> {
    const startTime = Date.now();
    const stages: string[] = [
      "form_validation",
      "api_submission",
      "email_processing",
      "smtp_delivery",
      "email_received",
    ];

    const stageResults: StageResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Stage 1: Form Validation
      const formValidationStart = Date.now();
      const formValidation = await this.validateFormData(data);
      stageResults.push({
        stage: "form_validation",
        success: formValidation.isValid,
        duration: Date.now() - formValidationStart,
        error: formValidation.isValid ? undefined : "Form validation failed",
      });

      if (!formValidation.isValid) {
        errors.push("Form validation failed");
        return this.createFlowResult(
          false,
          stageResults,
          errors,
          warnings,
          startTime,
        );
      }

      // Stage 2: API Submission
      const apiSubmissionStart = Date.now();
      const apiResult = await this.validateApiSubmission(data);
      stageResults.push({
        stage: "api_submission",
        success: apiResult.success,
        duration: Date.now() - apiSubmissionStart,
        error: apiResult.success ? undefined : apiResult.error,
      });

      if (!apiResult.success) {
        errors.push(apiResult.error || "API submission failed");
        return this.createFlowResult(
          false,
          stageResults,
          errors,
          warnings,
          startTime,
        );
      }

      // Stage 3: Email Processing
      const emailProcessingStart = Date.now();
      const emailResult = await this.testEmailRecipient.sendTestEmail(data);
      stageResults.push({
        stage: "email_processing",
        success: emailResult.success,
        duration: Date.now() - emailProcessingStart,
        error: emailResult.success ? undefined : "Email processing failed",
        metadata: {
          emailId: emailResult.emailId,
          provider: emailResult.provider,
          deliveryTime: emailResult.deliveryTime,
        },
      });

      if (!emailResult.success) {
        errors.push("Email processing failed");
        return this.createFlowResult(
          false,
          stageResults,
          errors,
          warnings,
          startTime,
        );
      }

      // Stage 4: SMTP Delivery
      const smtpDeliveryStart = Date.now();
      const smtpResult = await this.validateSmtpDelivery(emailResult.emailId);
      stageResults.push({
        stage: "smtp_delivery",
        success: smtpResult.delivered,
        duration: Date.now() - smtpDeliveryStart,
        error: smtpResult.delivered ? undefined : "SMTP delivery failed",
      });

      if (!smtpResult.delivered) {
        errors.push("SMTP delivery failed");
      }

      // Stage 5: Email Received
      const emailReceivedStart = Date.now();
      const receivedResult = await this.validateEmailReceived(
        emailResult.emailId,
      );
      stageResults.push({
        stage: "email_received",
        success: receivedResult.received,
        duration: Date.now() - emailReceivedStart,
        error: receivedResult.received ? undefined : "Email not received",
      });

      // Content validation
      let contentValid = true;
      if (options.validateContent !== false) {
        const contentValidation = await this.validateEmailContent(
          emailResult.emailId,
        );
        contentValid = contentValidation.contentValid;
        if (!contentValid) {
          warnings.push("Email content validation failed");
        }
      }

      // Headers validation
      let headersValid = true;
      if (options.validateHeaders !== false) {
        const headersValidation = await this.validateEmailHeaders(
          emailResult.emailId,
        );
        headersValid =
          headersValidation.validHeaders.length > 0 &&
          headersValidation.missingHeaders.length === 0;
        if (!headersValid) {
          warnings.push("Email headers validation failed");
        }
      }

      // Reply-to validation
      let replyToValid = true;
      if (options.testReplyTo !== false) {
        const replyToTest = await this.testEmailRecipient.testReplyTo(
          emailResult.emailId,
        );
        replyToValid = replyToTest.replyToWorked;
        if (!replyToValid) {
          warnings.push("Reply-to functionality test failed");
        }
      }

      const isValid =
        stageResults.every((r) => r.success) &&
        contentValid &&
        headersValid &&
        replyToValid;
      const totalTime = Date.now() - startTime;

      // Record performance metrics
      this.recordPerformanceMetric("email_flow_total_time", totalTime);

      return this.createFlowResult(
        isValid,
        stageResults,
        errors,
        warnings,
        startTime,
        emailResult.success,
        contentValid,
        headersValid,
        replyToValid,
      );
    } catch (error) {
      errors.push(
        `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return this.createFlowResult(
        false,
        stageResults,
        errors,
        warnings,
        startTime,
      );
    }
  }

  /**
   * Validate email content and formatting
   */
  public async validateEmailContent(
    emailId: string,
  ): Promise<EmailContentValidation> {
    try {
      const trappedEmail =
        await this.testEmailRecipient.getTrappedEmail(emailId);
      if (!trappedEmail) {
        throw new Error("Email not found for content validation");
      }

      const htmlContent = trappedEmail.htmlContent;
      const textContent = trappedEmail.textContent;
      const subject = trappedEmail.subject;

      // Check content structure
      const structureValid = this.validateContentStructure(
        htmlContent,
        textContent,
      );

      // Check required fields
      const hasRequiredFields = this.validateRequiredFields(
        htmlContent,
        subject,
      );

      // Check Portuguese content
      const portugueseContentValid =
        this.validatePortugueseContent(htmlContent);

      // Check if content is properly sanitized
      const sanitized =
        !htmlContent.includes("<script>") &&
        !htmlContent.includes("javascript:") &&
        !htmlContent.includes("onerror=");

      // Check encoding
      const encoding = trappedEmail.headers["Content-Type"]?.includes("UTF-8")
        ? "UTF-8"
        : "ASCII";

      return {
        emailId,
        htmlContent,
        textContent,
        subject,
        sanitized,
        encoding,
        contentValid:
          structureValid &&
          hasRequiredFields &&
          portugueseContentValid &&
          sanitized,
        size: trappedEmail.size,
        structureValid,
        hasRequiredFields,
        portugueseContentValid,
      };
    } catch (error) {
      return {
        emailId,
        htmlContent: "",
        textContent: "",
        subject: "",
        sanitized: false,
        encoding: "ASCII",
        contentValid: false,
        size: 0,
        structureValid: false,
        hasRequiredFields: false,
        portugueseContentValid: false,
      };
    }
  }

  /**
   * Validate email headers and metadata
   */
  public async validateEmailHeaders(
    emailId: string,
  ): Promise<EmailHeadersValidation> {
    try {
      const trappedEmail =
        await this.testEmailRecipient.getTrappedEmail(emailId);
      if (!trappedEmail) {
        throw new Error("Email not found for headers validation");
      }

      const headers = trappedEmail.headers;
      const validHeaders: string[] = [];
      const missingHeaders: string[] = [];
      const invalidHeaders: string[] = [];

      // Required headers
      const requiredHeaders = [
        "From",
        "To",
        "Subject",
        "Reply-To",
        "Content-Type",
        "MIME-Version",
      ];

      requiredHeaders.forEach((header) => {
        const headerKey = Object.keys(headers).find(
          (key) => key.toLowerCase() === header.toLowerCase(),
        );

        if (headerKey) {
          validHeaders.push(header);
        } else {
          missingHeaders.push(header);
        }
      });

      // Validate Reply-To format
      const replyToValid = this.validateReplyToHeader(headers["Reply-To"]);

      // Validate Content-Type
      const contentTypeValid = Boolean(
        headers["Content-Type"]?.includes("text/html") &&
          headers["Content-Type"]?.includes("UTF-8"),
      );

      // Validate encoding
      const encodingValid = Boolean(headers["Content-Type"]?.includes("UTF-8"));

      // Check security headers
      const securityHeadersValid = this.validateSecurityHeaders(headers);

      return {
        emailId,
        headers,
        validHeaders,
        missingHeaders,
        invalidHeaders,
        replyToValid,
        contentTypeValid,
        encodingValid,
        securityHeadersValid,
      };
    } catch (error) {
      return {
        emailId,
        headers: {},
        validHeaders: [],
        missingHeaders: [],
        invalidHeaders: [],
        replyToValid: false,
        contentTypeValid: false,
        encodingValid: false,
        securityHeadersValid: false,
      };
    }
  }

  /**
   * Validate email size limits
   */
  public async validateEmailSize(
    data: ContactRequest,
  ): Promise<EmailSizeValidation> {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const errors: string[] = [];
    const warnings: string[] = [];

    // Calculate estimated sizes
    const headersSize = 1024; // Rough estimate
    const htmlContentSize = data.message.length * 2; // Rough HTML size estimate
    const textContentSize = data.message.length;
    const attachmentsSize = 0; // No attachments in current implementation

    const totalSize =
      headersSize + htmlContentSize + textContentSize + attachmentsSize;

    if (totalSize > maxSize) {
      errors.push(
        `Email size (${Math.round(totalSize / 1024)}KB) exceeds maximum allowed size (${Math.round(maxSize / 1024)}KB)`,
      );
    }

    if (totalSize > maxSize * 0.8) {
      warnings.push(
        `Email size (${Math.round(totalSize / 1024)}KB) is close to maximum allowed size`,
      );
    }

    return {
      isValid: totalSize <= maxSize,
      totalSize,
      maxSize,
      sizeBreakdown: {
        headers: headersSize,
        htmlContent: htmlContentSize,
        textContent: textContentSize,
        attachments: attachmentsSize,
      },
      errors,
      warnings,
    };
  }

  /**
   * Validate email address format and validity
   */
  public async validateEmailAddress(
    email: string,
  ): Promise<EmailAddressValidation> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Basic format validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      issues.push("Invalid email format");
      suggestions.push("Please check the email address format");
    }

    // Extract parts
    const atIndex = email.lastIndexOf("@");
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);

    // Validate local part
    if (localPart.length === 0) {
      issues.push("Local part is empty");
    } else if (localPart.length > 64) {
      issues.push("Local part is too long (max 64 characters)");
    }

    // Validate domain
    if (domain.length === 0) {
      issues.push("Domain is empty");
    } else if (domain.length > 253) {
      issues.push("Domain is too long");
    }

    // Check for disposable email providers
    const disposableDomains = [
      "10minutemail.com",
      "tempmail.org",
      "guerrillamail.com",
    ];
    const disposable = disposableDomains.some((d) => domain.includes(d));

    // Identify email provider
    const provider = this.identifyEmailProvider(domain);

    return {
      isValid: issues.length === 0,
      email,
      localPart,
      domain,
      issues,
      suggestions,
      provider,
      disposable,
    };
  }

  /**
   * Validate provider compatibility
   */
  public async validateProviderCompatibility(
    emailId: string,
    providerName: string,
  ): Promise<ProviderCompatibilityResult> {
    const supportedFeatures = [
      "HTML emails",
      "UTF-8 encoding",
      "Reply-to functionality",
      "Multiple recipients",
    ];

    const unsupportedFeatures: string[] = [];
    const limitations: string[] = [];
    const recommendations: string[] = [];

    // Provider-specific validations
    switch (providerName.toLowerCase()) {
      case "gmail":
        limitations.push("Strict spam filtering");
        recommendations.push("Use clear subject lines");
        break;
      case "outlook":
        limitations.push("Limited CSS support");
        recommendations.push("Use inline CSS styles");
        unsupportedFeatures.push("Advanced CSS features");
        break;
      case "custom domain":
        supportedFeatures.push("Custom configuration");
        limitations.push("Requires proper DNS setup");
        break;
      default:
        unsupportedFeatures.push("Provider-specific optimizations");
        recommendations.push("Consider using major email providers");
    }

    return {
      compatible: unsupportedFeatures.length === 0,
      provider: providerName,
      supportedFeatures,
      unsupportedFeatures,
      limitations,
      recommendations,
    };
  }

  /**
   * Monitor complete email sending pipeline
   */
  public async monitorEmailPipeline(data: ContactRequest): Promise<{
    stages: string[];
    stageResults: StageResult[];
    totalTime: number;
    success: boolean;
  }> {
    const startTime = Date.now();
    const stages = [
      "form_validation",
      "api_submission",
      "email_processing",
      "smtp_delivery",
      "email_received",
    ];

    const stageResults: StageResult[] = [];

    for (const stage of stages) {
      const stageStart = Date.now();
      let success = false;
      let error: string | undefined;

      try {
        switch (stage) {
          case "form_validation":
            success = (await this.validateFormData(data)).isValid;
            break;
          case "api_submission":
            const apiResult = await this.validateApiSubmission(data);
            success = apiResult.success;
            error = apiResult.error;
            break;
          case "email_processing":
            const emailResult =
              await this.testEmailRecipient.sendTestEmail(data);
            success = emailResult.success;
            break;
          case "smtp_delivery":
            // This would be simulated in a real implementation
            success = true;
            break;
          case "email_received":
            // This would be verified in a real implementation
            success = true;
            break;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        success = false;
      }

      stageResults.push({
        stage,
        success,
        duration: Date.now() - stageStart,
        error,
      });
    }

    const totalTime = Date.now() - startTime;
    const success = stageResults.every((r) => r.success);

    return {
      stages,
      stageResults,
      totalTime,
      success,
    };
  }

  /**
   * Get email flow analytics
   */
  public async getEmailFlowAnalytics(): Promise<EmailFlowAnalytics> {
    const totalEmails = this.emailHistory.length;
    const successfulEmails = this.emailHistory.filter((r) => r.isValid).length;
    const failedEmails = totalEmails - successfulEmails;
    const successRate =
      totalEmails > 0 ? (successfulEmails / totalEmails) * 100 : 0;

    // Calculate delivery times
    const deliveryTimes = this.emailHistory
      .map((r) => r.deliveryTime)
      .filter((t) => t > 0);
    const averageDeliveryTime =
      deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

    // Provider statistics (mock data for now)
    const providerStats: Record<
      string,
      { count: number; successRate: number; averageTime: number }
    > = {
      "Custom Domain": {
        count: successfulEmails,
        successRate: successRate,
        averageTime: averageDeliveryTime,
      },
    };

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    this.emailHistory.forEach((result) => {
      result.errors.forEach((error) => {
        errorBreakdown[error] = (errorBreakdown[error] || 0) + 1;
      });
    });

    // Performance metrics
    const performanceMetrics = {
      fastestDelivery: Math.min(...deliveryTimes) || 0,
      slowestDelivery: Math.max(...deliveryTimes) || 0,
      totalDeliveryTime: deliveryTimes.reduce((a, b) => a + b, 0),
    };

    return {
      totalEmails,
      successfulEmails,
      failedEmails,
      successRate,
      averageDeliveryTime,
      providerStats,
      errorBreakdown,
      performanceMetrics,
    };
  }

  /**
   * Private helper methods
   */
  private async validateFormData(
    data: ContactRequest,
  ): Promise<{ isValid: boolean }> {
    // Basic validation
    const hasName = Boolean(data.name && data.name.trim().length >= 2);
    const hasEmail = Boolean(data.email && this.isValidEmailFormat(data.email));
    const hasMessage = Boolean(
      data.message && data.message.trim().length >= 10,
    );

    return { isValid: hasName && hasEmail && hasMessage };
  }

  private async validateApiSubmission(
    data: ContactRequest,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call validation
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
        }),
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async validateSmtpDelivery(
    emailId: string,
  ): Promise<{ delivered: boolean }> {
    // Simulate SMTP delivery validation
    const trappedEmail = await this.testEmailRecipient.getTrappedEmail(emailId);
    return { delivered: !!trappedEmail };
  }

  private async validateEmailReceived(
    emailId: string,
  ): Promise<{ received: boolean }> {
    // Simulate email receipt validation
    const trappedEmail = await this.testEmailRecipient.getTrappedEmail(emailId);
    return { received: !!trappedEmail };
  }

  private validateContentStructure(
    htmlContent: string,
    textContent: string,
  ): boolean {
    const hasHtmlStructure =
      htmlContent.includes("<html") && htmlContent.includes("</html>");
    const hasBody =
      htmlContent.includes("<body") && htmlContent.includes("</body>");
    const hasTextContent = Boolean(textContent && textContent.length > 0);

    return hasHtmlStructure && hasBody && hasTextContent;
  }

  private validateRequiredFields(
    htmlContent: string,
    subject: string,
  ): boolean {
    const hasNameField = /nome|name/i.test(htmlContent);
    const hasEmailField = /email/i.test(htmlContent);
    const hasMessageField = /mensagem|message/i.test(htmlContent);
    const hasSubject = Boolean(subject && subject.length > 0);

    return hasNameField && hasEmailField && hasMessageField && hasSubject;
  }

  private validatePortugueseContent(content: string): boolean {
    const portugueseIndicators = [
      "mensagem de contacto",
      "enviado através do formulário",
      "nova mensagem",
      "por favor",
    ];

    return portugueseIndicators.some((indicator) =>
      content.toLowerCase().includes(indicator),
    );
  }

  private validateReplyToHeader(replyTo: string): boolean {
    if (!replyTo) return false;
    return this.isValidEmailFormat(replyTo);
  }

  private validateSecurityHeaders(headers: Record<string, string>): boolean {
    // Check for basic security headers
    const hasSecurityHeaders = Boolean(
      headers["X-Mailer"] ||
        headers["X-Priority"] ||
        !Object.values(headers).some((value) => value.includes("javascript:")),
    );

    return hasSecurityHeaders;
  }

  private isValidEmailFormat(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  private identifyEmailProvider(domain: string): string {
    const domainLower = domain.toLowerCase();

    if (domainLower.includes("gmail")) return "Gmail";
    if (domainLower.includes("outlook") || domainLower.includes("hotmail"))
      return "Outlook";
    if (domainLower.includes("yahoo")) return "Yahoo";
    if (domainLower.includes("icloud")) return "iCloud";

    return "Custom Domain";
  }

  private createFlowResult(
    isValid: boolean,
    stageResults: StageResult[],
    errors: string[],
    warnings: string[],
    startTime: number,
    emailDelivered: boolean = false,
    contentValid: boolean = false,
    headersValid: boolean = false,
    replyToValid: boolean = false,
  ): EmailFlowResult {
    const result = {
      isValid,
      emailDelivered,
      contentValid,
      headersValid,
      replyToValid,
      deliveryTime: Date.now() - startTime,
      stages: stageResults.map((r) => r.stage),
      stageResults,
      errors,
      warnings,
    };

    this.emailHistory.push(result);
    return result;
  }

  private recordPerformanceMetric(metric: string, value: number): void {
    if (!this.performanceMetrics.has(metric)) {
      this.performanceMetrics.set(metric, []);
    }
    this.performanceMetrics.get(metric)!.push(value);
  }
}
