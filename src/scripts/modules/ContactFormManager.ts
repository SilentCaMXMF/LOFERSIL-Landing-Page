/// <reference types="vite/client" />

/**
 * LOFERSIL Landing Page - Contact Form Module
 * Handles contact form submission, validation, and email service integration
 */

import {
  ContactFormValidator,
  ContactRequest,
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  validateContactForm,
} from "../validation.js";

import { envLoader } from "./EnvironmentLoader.js";
import { TranslationManager } from "./TranslationManager.js";

// Contact form configuration
interface ContactFormConfig {
  formSelector: string;
  submitButtonSelector: string;
  successMessageSelector: string;
  errorMessageSelector: string;
  translationManager?: TranslationManager;
  emailService?: {
    endpoint: string;
    method: "POST" | "GET";
    headers?: Record<string, string>;
  };
  accessibility?: AccessibilityConfig;
}

// Accessibility configuration
interface AccessibilityConfig {
  liveRegionSelector?: string;
  progressIndicatorSelector?: string;
  focusManagement?: boolean;
  announceStateChanges?: boolean;
}

// Form submission events
export interface ContactFormEvents {
  onSubmit: (data: ContactRequest) => Promise<boolean>;
  onSuccess: (data: ContactRequest) => void;
  onError: (error: Error) => void;
  onValidationFailed: (errors: Record<string, string>) => void;
}

/**
 * Contact Form Manager
 * Handles form validation, submission, and user feedback
 */
export class ContactFormManager {
  private validator: ContactFormValidator;
  private config: ContactFormConfig;
  private formElement: HTMLFormElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private isSubmitting = false;
  private eventHandlers: Partial<ContactFormEvents> = {};
  private validationTimeouts: Map<string, number> = new Map();
  private formLoadTime: number = Date.now();
  private analyticsEnabled: boolean = true;
  private liveRegion: HTMLElement | null = null;
  private progressIndicator: HTMLElement | null = null;
  private lastFocusedElement: HTMLElement | null = null;

  constructor(config: ContactFormConfig) {
    this.config = config;
    this.validator = new ContactFormValidator(
      config.formSelector,
      config.translationManager,
    );
    this.initializeForm();
  }

  /**
   * Initialize the contact form
   */
  private initializeForm(): void {
    this.formElement = document.querySelector(this.config.formSelector);
    this.submitButton = document.querySelector(
      this.config.submitButtonSelector,
    );

    if (!this.formElement) {
      console.warn("Contact form element not found");
      return;
    }

    // Initialize accessibility features
    this.initializeAccessibility();

    // Ensure success and error messages are hidden on initialization
    const successElement = document.querySelector(
      this.config.successMessageSelector,
    ) as HTMLElement;
    const errorElement = document.querySelector(
      this.config.errorMessageSelector,
    ) as HTMLElement;

    if (successElement) {
      successElement.classList.add("hidden");
      successElement.style.display = "none";
      successElement.setAttribute("aria-hidden", "true");
    }

    if (errorElement) {
      errorElement.classList.add("hidden");
      errorElement.style.display = "none";
      errorElement.setAttribute("aria-hidden", "true");
    }

    // Set up form submission handler
    this.formElement.addEventListener("submit", this.handleSubmit.bind(this));

    // Initialize security features
    this.initializeSecurity();

    // Set up real-time validation
    this.setupRealtimeValidation();

    // Track form load
    this.trackEvent("form_load", {
      userAgent: navigator.userAgent.substring(0, 50),
      referrer: document.referrer || "direct",
    });

    // Set up keyboard navigation enhancements
    this.setupKeyboardNavigation();
  }

  /**
   * Debounce utility for performance optimization
   */
  private debounce(func: Function, wait: number): (...args: any[]) => void {
    return (...args: any[]) => {
      const key = func.name + JSON.stringify(args);
      const existingTimeout = this.validationTimeouts.get(key);

      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = window.setTimeout(() => {
        func.apply(this, args);
        this.validationTimeouts.delete(key);
      }, wait);

      this.validationTimeouts.set(key, timeout);
    };
  }

  /**
   * Set up real-time validation feedback with debouncing
   */
  private setupRealtimeValidation(): void {
    if (!this.formElement) return;

    const fields = ["name", "email", "phone", "message"];

    fields.forEach((fieldName) => {
      const field = this.formElement?.querySelector(
        `[name="${fieldName}"]`,
      ) as HTMLInputElement;
      const errorElement = document.getElementById(`${fieldName}-error`);

      if (field && errorElement) {
        // Track field focus
        field.addEventListener("focus", () => {
          this.trackFieldInteraction(fieldName, "focus");
        });

        // Validate on blur immediately (no debouncing for accessibility)
        field.addEventListener("blur", () => {
          this.trackFieldInteraction(fieldName, "blur");

          const hadError = errorElement.classList.contains("show");
          this.validateField(fieldName, errorElement!);

          // Track validation result
          const hasError = errorElement.classList.contains("show");
          this.trackValidation(
            fieldName,
            !hasError,
            hasError ? "field_error" : undefined,
          );

          // Announce validation result if error state changed
          if (!hadError && hasError) {
            const errorMessage = errorElement.textContent || "Validation error";
            this.announceToScreenReader(
              `${fieldName} field: ${errorMessage}`,
              "assertive",
            );
          } else if (hadError && !hasError) {
            this.announceToScreenReader(
              `${fieldName} field is valid`,
              "polite",
            );
          }
        });

        // Clear error on input with debounced validation (300ms delay)
        const debouncedClearError = this.debounce(() => {
          if (field.classList.contains("error")) {
            field.classList.remove("error");
            errorElement.classList.remove("show");
            errorElement.textContent = "";
            this.announceToScreenReader(
              `${fieldName} field error cleared`,
              "polite",
            );
          }
        }, 300);

        field.addEventListener("input", () => {
          this.trackFieldInteraction(fieldName, "input");
          debouncedClearError();
        });

        // Enhanced focus management for validation
        field.addEventListener("invalid", (event) => {
          event.preventDefault();
          this.validateField(fieldName, errorElement!);
          const errorMessage =
            errorElement.textContent || "This field is required";
          this.announceToScreenReader(
            `${fieldName} field: ${errorMessage}`,
            "assertive",
          );
          this.manageFocus(field);
        });
      }
    });
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibility(): void {
    // Create live region for announcements if not provided
    if (this.config.accessibility?.liveRegionSelector) {
      this.liveRegion = document.querySelector(
        this.config.accessibility.liveRegionSelector,
      );
    }

    if (!this.liveRegion) {
      this.liveRegion = document.createElement("div");
      this.liveRegion.setAttribute("aria-live", "polite");
      this.liveRegion.setAttribute("aria-atomic", "true");
      this.liveRegion.className = "sr-only accessibility-live-region";
      this.liveRegion.id = "contact-form-live-region";
      this.formElement?.appendChild(this.liveRegion);
    }

    // Set up progress indicator
    if (this.config.accessibility?.progressIndicatorSelector) {
      this.progressIndicator = document.querySelector(
        this.config.accessibility.progressIndicatorSelector,
      );
    }

    // Ensure form has proper ARIA attributes
    if (this.formElement) {
      this.formElement.setAttribute("role", "form");
      this.formElement.setAttribute("aria-labelledby", "contact-title");
    }

    // Ensure submit button has proper accessibility
    if (this.submitButton) {
      this.submitButton.setAttribute(
        "aria-describedby",
        "contact-submit-description",
      );
    }
  }

  /**
   * Set up enhanced keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.formElement) return;

    // Store last focused element before form interactions
    this.formElement.addEventListener("focusin", (event) => {
      this.lastFocusedElement = event.target as HTMLElement;
    });

    // Enhanced tab order management
    const focusableElements = this.formElement.querySelectorAll(
      'input:not([type="hidden"]):not(.honeypot-field input), textarea, button',
    );

    // Ensure proper tab order and focus management
    focusableElements.forEach((element, index) => {
      const el = element as HTMLElement;
      el.setAttribute("tabindex", "0");

      // Add keyboard event listeners for better navigation
      el.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && el.tagName !== "TEXTAREA") {
          event.preventDefault();
          if (el === this.submitButton) {
            this.formElement?.requestSubmit();
          }
        }
      });
    });
  }

  /**
   * Announce state changes to screen readers
   */
  private announceToScreenReader(
    message: string,
    priority: "polite" | "assertive" = "polite",
  ): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute("aria-live", priority);
    this.liveRegion.textContent = message;

    // Clear the message after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = "";
      }
    }, 1000);
  }

  /**
   * Manage focus during form interactions
   */
  private manageFocus(element: HTMLElement | null): void {
    if (!element || !this.config.accessibility?.focusManagement) return;

    // Small delay to ensure element is visible
    setTimeout(() => {
      element.focus();
      // Scroll into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  /**
   * Initialize security features (CSRF token, etc.)
   */
  private initializeSecurity(): void {
    if (!this.formElement) return;

    // Generate and set CSRF token
    const token = this.generateCsrfToken();
    const tokenField = this.formElement.querySelector(
      '[name="csrf_token"]',
    ) as HTMLInputElement;
    if (tokenField) {
      tokenField.value = token;
    }
  }

  /**
   * Generate a simple CSRF token
   */
  private generateCsrfToken(): string {
    const token =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      sessionStorage.setItem("csrf_token", token);
    } catch (error) {
      console.warn("Failed to store CSRF token:", error);
    }
    return token;
  }

  /**
   * Validate a single field and display error
   */
  private validateField(fieldName: string, errorElement: HTMLElement): void {
    const field = this.formElement?.querySelector(
      `[name="${fieldName}"]`,
    ) as HTMLInputElement;
    if (!field) return;

    let result: { isValid: boolean; error?: string };

    switch (fieldName) {
      case "name":
        result = validateName(field.value, this.config.translationManager);
        break;
      case "email":
        result = validateEmail(field.value, this.config.translationManager);
        break;
      case "phone":
        result = validatePhone(field.value, this.config.translationManager);
        break;
      case "message":
        result = validateMessage(field.value, this.config.translationManager);
        break;
      default:
        return;
    }

    if (!result.isValid) {
      field.classList.add("error");
      errorElement.textContent = result.error || "";
      errorElement.classList.add("show");
    } else {
      field.classList.remove("error");
      errorElement.classList.remove("show");
      errorElement.textContent = "";
    }
  }

  /**
   * Check rate limiting for form submissions
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const key = "contact_form_submissions";
    const maxSubmissions = 3; // Max 3 submissions per hour
    const windowMs = 60 * 60 * 1000; // 1 hour

    try {
      const stored = localStorage.getItem(key);
      const submissions: number[] = stored ? JSON.parse(stored) : [];

      // Filter out submissions outside the time window
      const validSubmissions = submissions.filter(
        (timestamp) => now - timestamp < windowMs,
      );

      if (validSubmissions.length >= maxSubmissions) {
        return false;
      }

      return true;
    } catch (error) {
      // If localStorage fails, allow submission but log error
      console.warn("Rate limiting check failed:", error);
      return true;
    }
  }

  /**
   * Record a successful submission for rate limiting
   */
  private recordSubmission(): void {
    const now = Date.now();
    const key = "contact_form_submissions";

    try {
      const stored = localStorage.getItem(key);
      const submissions: number[] = stored ? JSON.parse(stored) : [];
      submissions.push(now);

      // Keep only recent submissions (within 2 hours to be safe)
      const windowMs = 2 * 60 * 60 * 1000;
      const validSubmissions = submissions.filter(
        (timestamp) => now - timestamp < windowMs,
      );

      localStorage.setItem(key, JSON.stringify(validSubmissions));
    } catch (error) {
      console.warn("Failed to record submission:", error);
    }
  }

  /**
   * Check honeypot field for bot protection
   */
  private checkHoneypot(): boolean {
    if (!this.formElement) return true;

    const honeypotField = this.formElement.querySelector(
      '[name="website"]',
    ) as HTMLInputElement;
    if (!honeypotField) return true; // If field doesn't exist, allow submission

    // If honeypot field has any value, it's likely a bot
    return !honeypotField.value || honeypotField.value.trim() === "";
  }

  /**
   * Validate CSRF token
   */
  private validateCsrfToken(): boolean {
    if (!this.formElement) return true;

    const tokenField = this.formElement.querySelector(
      '[name="csrf_token"]',
    ) as HTMLInputElement;
    const storedToken = sessionStorage.getItem("csrf_token");

    if (!tokenField || !storedToken) return true; // If no token system, allow

    return tokenField.value === storedToken;
  }

  /**
   * Check for suspicious submission timing (bot detection)
   */
  private checkSubmissionTiming(): boolean {
    const timeSinceLoad = Date.now() - this.formLoadTime;
    // Reject submissions faster than 3 seconds (likely bots)
    return timeSinceLoad > 3000;
  }

  /**
   * Validate request size limits
   */
  private validateRequestSize(data: ContactRequest): boolean {
    const totalSize = JSON.stringify(data).length;
    const maxSize = 10000; // 10KB limit
    return totalSize <= maxSize;
  }

  /**
   * Enhanced bot detection combining multiple signals
   */
  private performBotDetection(): boolean {
    // Check timing
    if (!this.checkSubmissionTiming()) {
      console.warn("Submission rejected: too fast (possible bot)");
      return false;
    }

    // Check for automated patterns in user agent
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = ["bot", "crawler", "spider", "scraper"];
    if (botPatterns.some((pattern) => userAgent.includes(pattern))) {
      console.warn("Submission rejected: suspicious user agent");
      return false;
    }

    return true;
  }

  /**
   * Sanitize form data using DOMPurify with enhanced security
   */
  private sanitizeFormData(data: ContactRequest): ContactRequest {
    // Additional length checks for security
    const sanitized = {
      name: window.DOMPurify.sanitize(data.name)?.substring(0, 100) || "",
      email: window.DOMPurify.sanitize(data.email)?.substring(0, 254) || "",
      phone: data.phone
        ? window.DOMPurify.sanitize(data.phone)?.substring(0, 20)
        : undefined,
      message:
        window.DOMPurify.sanitize(data.message)?.substring(0, 2000) || "",
    };

    return sanitized;
  }

  /**
   * Analytics tracking methods
   */
  private trackEvent(
    eventName: string,
    properties: Record<string, any> = {},
  ): void {
    if (!this.analyticsEnabled) return;

    const eventData = {
      event: eventName,
      formId: "contact-form",
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      ...properties,
    };

    // Send to analytics service (could be Google Analytics, custom endpoint, etc.)
    this.sendAnalyticsEvent(eventData);

    // Also log to console for debugging
    console.log("Form Analytics:", eventData);
  }

  /**
   * Get or create session ID for tracking
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem("contact_form_session");
    if (!sessionId) {
      sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("contact_form_session", sessionId);
    }
    return sessionId;
  }

  /**
   * Send analytics event to tracking service
   */
  private sendAnalyticsEvent(eventData: any): void {
    // This could be extended to send to Google Analytics, Mixpanel, etc.
    // For now, we'll store in localStorage for basic analytics

    try {
      const analyticsKey = "contact_form_analytics";
      const existingData = localStorage.getItem(analyticsKey);
      const analytics = existingData
        ? JSON.parse(existingData)
        : { events: [] };

      analytics.events.push(eventData);

      // Keep only last 100 events to prevent storage bloat
      if (analytics.events.length > 100) {
        analytics.events = analytics.events.slice(-100);
      }

      localStorage.setItem(analyticsKey, JSON.stringify(analytics));
    } catch (error) {
      console.warn("Analytics storage failed:", error);
    }

    // If Google Analytics is available, send event there too
    if (typeof (window as any).gtag !== "undefined") {
      (window as any).gtag("event", eventData.event, {
        custom_parameter_1: eventData.formId,
        custom_parameter_2: eventData.sessionId,
      });
    }
  }

  /**
   * Track form field interactions
   */
  private trackFieldInteraction(fieldName: string, action: string): void {
    this.trackEvent("form_field_interaction", {
      field: fieldName,
      action: action, // 'focus', 'blur', 'input', 'error'
      timeSinceLoad: Date.now() - this.formLoadTime,
    });
  }

  /**
   * Track form validation events
   */
  private trackValidation(
    fieldName: string,
    isValid: boolean,
    errorType?: string,
  ): void {
    this.trackEvent("form_validation", {
      field: fieldName,
      valid: isValid,
      errorType: errorType,
      timeSinceLoad: Date.now() - this.formLoadTime,
    });
  }

  /**
   * Track form submission attempts
   */
  private trackSubmissionAttempt(success: boolean, errorType?: string): void {
    this.trackEvent("form_submission_attempt", {
      success: success,
      errorType: errorType,
      timeSinceLoad: Date.now() - this.formLoadTime,
      formDataSize: this.getFormData()?.message?.length || 0,
    });
  }

  /**
   * Get basic analytics summary
   */
  public getAnalyticsSummary(): any {
    try {
      const analyticsKey = "contact_form_analytics";
      const data = localStorage.getItem(analyticsKey);
      if (!data) return { events: [] };

      const analytics = JSON.parse(data);
      const events = analytics.events || [];

      // Calculate summary statistics
      const summary = {
        totalEvents: events.length,
        formLoads: events.filter((e: any) => e.event === "form_load").length,
        fieldInteractions: events.filter(
          (e: any) => e.event === "form_field_interaction",
        ).length,
        validations: events.filter((e: any) => e.event === "form_validation")
          .length,
        submissionAttempts: events.filter(
          (e: any) => e.event === "form_submission_attempt",
        ).length,
        successfulSubmissions: events.filter(
          (e: any) => e.event === "form_submission_attempt" && e.success,
        ).length,
        averageTimeToSubmit: this.calculateAverageTimeToSubmit(events),
        errorRate: this.calculateErrorRate(events),
      };

      return summary;
    } catch (error) {
      console.warn("Failed to get analytics summary:", error);
      return { events: [], error: "Failed to load analytics" };
    }
  }

  /**
   * Calculate average time from form load to submission
   */
  private calculateAverageTimeToSubmit(events: any[]): number {
    const submissions = events.filter(
      (e: any) => e.event === "form_submission_attempt" && e.success,
    );
    if (submissions.length === 0) return 0;

    const totalTime = submissions.reduce(
      (sum: number, sub: any) => sum + (sub.timeSinceLoad || 0),
      0,
    );
    return Math.round(totalTime / submissions.length / 1000); // Convert to seconds
  }

  /**
   * Calculate error rate from validation events
   */
  private calculateErrorRate(events: any[]): number {
    const validations = events.filter(
      (e: any) => e.event === "form_validation",
    );
    if (validations.length === 0) return 0;

    const errors = validations.filter((e: any) => !e.valid).length;
    return Math.round((errors / validations.length) * 100);
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.isSubmitting) {
      this.announceToScreenReader(
        "Form is already being submitted",
        "assertive",
      );
      return;
    }

    // Announce submission start
    this.announceToScreenReader("Submitting form...", "polite");

    // Enhanced security checks
    if (!this.checkRateLimit()) {
      this.showErrorMessage(
        "Demasiadas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.",
      );
      return;
    }

    if (!this.checkHoneypot()) {
      this.showErrorMessage("Erro de validação. Por favor, tente novamente.");
      return;
    }

    if (!this.validateCsrfToken()) {
      this.showErrorMessage(
        "Token de segurança inválido. Por favor, recarregue a página e tente novamente.",
      );
      return;
    }

    if (!this.performBotDetection()) {
      this.showErrorMessage("Erro de validação. Por favor, tente novamente.");
      return;
    }

    if (!this.checkHoneypot()) {
      const message = "Erro de validação. Por favor, tente novamente.";
      this.showErrorMessage(message);
      this.announceToScreenReader(message, "assertive");
      return;
    }

    if (!this.validateCsrfToken()) {
      const message =
        "Token de segurança inválido. Por favor, recarregue a página e tente novamente.";
      this.showErrorMessage(message);
      this.announceToScreenReader(message, "assertive");
      return;
    }

    // Get form data first
    const formData = this.validator.getFormData();
    if (!formData) {
      const message = "Não foi possível obter os dados do formulário";
      this.showErrorMessage(message);
      this.announceToScreenReader(message, "assertive");
      return;
    }

    // Validate form
    const validationResult = validateContactForm(
      formData,
      this.config.translationManager,
    );

    if (!validationResult.isValid) {
      // Display validation errors
      const errorMessages = Object.values(validationResult.errors);
      if (errorMessages.length > 0) {
        const message = errorMessages.join(". ");
        this.showErrorMessage(message);
        this.announceToScreenReader(
          `Form validation failed: ${message}`,
          "assertive",
        );

        // Focus on first invalid field
        const firstInvalidField = Object.keys(validationResult.errors)[0];
        const fieldElement = this.formElement?.querySelector(
          `[name="${firstInvalidField}"]`,
        ) as HTMLElement;
        this.manageFocus(fieldElement);
      }
      this.eventHandlers.onValidationFailed?.(validationResult.errors);
      return;
    }
    if (!formData) {
      const message = "Não foi possível obter os dados do formulário";
      this.eventHandlers.onError?.(new Error(message));
      this.announceToScreenReader(message, "assertive");
      return;
    }

    // Validate request size
    if (!this.validateRequestSize(formData)) {
      this.showErrorMessage(
        "Dados do formulário demasiado grandes. Por favor, reduza o tamanho da mensagem.",
      );
      return;
    }

    // Sanitize inputs
    const sanitizedData = this.sanitizeFormData(formData);

    // Start submission
    this.setSubmittingState(true);

    try {
      // Call submit handler if provided
      const success =
        (await this.eventHandlers.onSubmit?.(sanitizedData)) ?? true;

      if (success) {
        this.trackSubmissionAttempt(true);
        this.recordSubmission(); // Record successful submission for rate limiting
        this.showSuccessMessage();
        this.resetForm();
        this.eventHandlers.onSuccess?.(sanitizedData);
      } else {
        this.trackSubmissionAttempt(false, "submission_failed");
      }
    } catch (error) {
      // Sanitize error messages to prevent information leakage
      let errorMessage =
        "Ocorreu um erro inesperado. Por favor, tente novamente.";

      if (error instanceof Error) {
        // Only show user-friendly messages, not internal errors
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network")
        ) {
          errorMessage =
            "Erro de ligação. Por favor, verifique a sua ligação à internet e tente novamente.";
        } else if (error.message.includes("HTTP error")) {
          errorMessage =
            "Erro do servidor. Por favor, tente novamente mais tarde.";
        }
        // Log the actual error for debugging but don't expose it to user
        console.error("Contact form submission error:", {
          message: error.message,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100), // Truncate for privacy
        });
      }

      // Check if we're offline
      if (!navigator.onLine) {
        this.showErrorMessage(
          "Sem ligação à internet. Verifique a sua ligação e tente novamente.",
        );
        this.eventHandlers.onError?.(new Error("Offline"));
        return;
      }

      this.trackSubmissionAttempt(false, "error");
      this.showErrorMessage(errorMessage);
      this.eventHandlers.onError?.(
        error instanceof Error ? error : new Error("Form submission failed"),
      );
    } finally {
      this.setSubmittingState(false);
    }
  }

  /**
   * Set form submission state
   */
  private setSubmittingState(isSubmitting: boolean): void {
    this.isSubmitting = isSubmitting;

    if (this.submitButton) {
      const buttonText = this.submitButton.querySelector(
        ".btn-text",
      ) as HTMLElement;
      const loadingText = this.submitButton.querySelector(
        ".btn-loading",
      ) as HTMLElement;

      if (isSubmitting) {
        this.submitButton.disabled = true;
        this.submitButton.setAttribute("aria-disabled", "true");
        if (buttonText) buttonText.classList.add("hidden");
        if (loadingText) loadingText.classList.remove("hidden");

        // Update progress indicator if available
        if (this.progressIndicator) {
          this.progressIndicator.setAttribute("aria-hidden", "false");
          this.progressIndicator.textContent = "Submitting form...";
        }

        // Announce submission state
        this.announceToScreenReader("Form submission in progress", "polite");
      } else {
        this.submitButton.disabled = false;
        this.submitButton.setAttribute("aria-disabled", "false");
        if (buttonText) buttonText.classList.remove("hidden");
        if (loadingText) loadingText.classList.add("hidden");

        // Hide progress indicator
        if (this.progressIndicator) {
          this.progressIndicator.setAttribute("aria-hidden", "true");
          this.progressIndicator.textContent = "";
        }
      }
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message?: string): void {
    const successElement = document.querySelector(
      this.config.successMessageSelector,
    ) as HTMLElement;
    const errorElement = document.querySelector(
      this.config.errorMessageSelector,
    ) as HTMLElement;

    if (successElement) {
      if (message) {
        successElement.textContent = message;
      }
      successElement.classList.remove("hidden");
      (successElement as HTMLElement).style.display = "block";
      successElement.setAttribute("aria-hidden", "false");
      successElement.setAttribute("tabindex", "-1"); // Make focusable for screen readers

      // Manage focus to success message
      this.manageFocus(successElement);
    }

    if (errorElement) {
      errorElement.classList.add("hidden");
      (errorElement as HTMLElement).style.display = "none";
      errorElement.setAttribute("aria-hidden", "true");
    }

    // Hide success message after 5 seconds
    setTimeout(() => {
      if (successElement) {
        successElement.classList.add("hidden");
        (successElement as HTMLElement).style.display = "none";
        successElement.setAttribute("aria-hidden", "true");
        successElement.removeAttribute("tabindex");
        // Reset to default message
        successElement.textContent =
          "Mensagem enviada com sucesso! Entraremos em contacto brevemente.";
      }
    }, 5000);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    const errorElement = document.querySelector(
      this.config.errorMessageSelector,
    ) as HTMLElement;
    const successElement = document.querySelector(
      this.config.successMessageSelector,
    ) as HTMLElement;

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove("hidden");
      (errorElement as HTMLElement).style.display = "block";
      errorElement.setAttribute("aria-hidden", "false");
      errorElement.setAttribute("tabindex", "-1"); // Make focusable for screen readers

      // Manage focus to error message
      this.manageFocus(errorElement);
    }

    if (successElement) {
      successElement.classList.add("hidden");
      (successElement as HTMLElement).style.display = "none";
      successElement.setAttribute("aria-hidden", "true");
    }
  }

  /**
   * Reset the form
   */
  private resetForm(): void {
    if (this.formElement) {
      this.formElement.reset();
      this.validator.clearErrors();
      // Regenerate CSRF token after form reset
      this.initializeSecurity();
    }
  }

  /**
   * Set event handlers
   */
  public on<K extends keyof ContactFormEvents>(
    event: K,
    handler: ContactFormEvents[K],
  ): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Remove event handlers
   */
  public off<K extends keyof ContactFormEvents>(event: K): void {
    delete this.eventHandlers[event];
  }

  /**
   * Get form data
   */
  public getFormData(): ContactRequest | null {
    return this.validator.getFormData();
  }

  /**
   * Validate form manually
   */
  public validateForm() {
    return this.validator.validateForm();
  }

  /**
   * Destroy the contact form manager
   */
  public destroy(): void {
    if (this.formElement) {
      this.formElement.removeEventListener("submit", this.handleSubmit);
    }

    // Clear all validation timeouts
    this.validationTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.validationTimeouts.clear();

    this.eventHandlers = {};
  }
}

/**
 * Email service integration using custom backend
 */
class EmailService {
  private endpoint: string;

  constructor() {
    this.endpoint = envLoader.get("CONTACT_API_ENDPOINT") || "/api/contact";
  }

  /**
   * Send form data to email service
   */
  async sendEmail(data: ContactRequest): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Email service error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Falha ao enviar mensagem. Por favor, tente novamente mais tarde.",
      );
    }
  }
}

/**
 * Create a contact form manager with default configuration and email service
 */
export function createContactForm(
  translationManager?: TranslationManager,
): ContactFormManager {
  const config: ContactFormConfig = {
    formSelector: "#contact-form-element",
    submitButtonSelector: "#contact-submit",
    successMessageSelector: "#form-success",
    errorMessageSelector: "#form-error",
    translationManager,
    accessibility: {
      liveRegionSelector: "#contact-form-live-region",
      progressIndicatorSelector: "#form-progress",
      focusManagement: true,
      announceStateChanges: true,
    },
  };

  const contactForm = new ContactFormManager(config);
  const emailService = new EmailService();

  // Set up email submission handler
  contactForm.on("onSubmit", async (data: ContactRequest) => {
    return await emailService.sendEmail(data);
  });

  // Set up success handler
  contactForm.on("onSuccess", (data: ContactRequest) => {
    console.log("Contact form submitted successfully:", data);
  });

  // Set up error handler
  contactForm.on("onError", (error: Error) => {
    // Log error message without exposing sensitive information
    console.error("Contact form submission failed:", {
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  return contactForm;
}
