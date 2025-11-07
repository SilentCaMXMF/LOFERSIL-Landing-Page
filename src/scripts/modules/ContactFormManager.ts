/// <reference types="vite/client" />

/**
 * LOFERSIL Landing Page - Contact Form Module
 * Handles contact form submission, validation, and email service integration
 */

import { ContactFormValidator, ContactRequest } from '../validation.js';
import { BackgroundSync } from './BackgroundSync.js';

// Contact form configuration
interface ContactFormConfig {
  formSelector: string;
  submitButtonSelector: string;
  successMessageSelector: string;
  errorMessageSelector: string;
  emailService?: {
    endpoint: string;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
  };
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

  constructor(config: ContactFormConfig) {
    this.config = config;
    this.validator = new ContactFormValidator(config.formSelector);
    this.initializeForm();
  }

  /**
   * Initialize the contact form
   */
  private initializeForm(): void {
    this.formElement = document.querySelector(this.config.formSelector);
    this.submitButton = document.querySelector(this.config.submitButtonSelector);

    if (!this.formElement) {
      console.warn('Contact form element not found');
      return;
    }

    // Ensure success and error messages are hidden on initialization
    const successElement = document.querySelector(
      this.config.successMessageSelector
    ) as HTMLElement;
    const errorElement = document.querySelector(this.config.errorMessageSelector) as HTMLElement;

    if (successElement) {
      successElement.classList.add('hidden');
      successElement.style.display = 'none';
      successElement.setAttribute('aria-hidden', 'true');
    }

    if (errorElement) {
      errorElement.classList.add('hidden');
      errorElement.style.display = 'none';
      errorElement.setAttribute('aria-hidden', 'true');
    }

    // Set up form submission handler
    this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

    // Initialize security features
    this.initializeSecurity();

    // Set up real-time validation
    this.setupRealtimeValidation();
  }

  /**
   * Set up real-time validation feedback
   */
  private setupRealtimeValidation(): void {
    if (!this.formElement) return;

    const fields = ['name', 'email', 'message'];

    fields.forEach(fieldName => {
      const field = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      const errorElement = document.getElementById(`${fieldName}-error`);

      if (field && errorElement) {
        // Validate on blur
        field.addEventListener('blur', () => {
          this.validateField(fieldName, errorElement!);
        });

        // Clear error on input
        field.addEventListener('input', () => {
          field.classList.remove('error');
          errorElement.classList.remove('show');
          errorElement.textContent = '';
        });
      }
    });
  }

  /**
   * Initialize security features (CSRF token, etc.)
   */
  private initializeSecurity(): void {
    if (!this.formElement) return;

    // Generate and set CSRF token
    const token = this.generateCsrfToken();
    const tokenField = this.formElement.querySelector('[name="csrf_token"]') as HTMLInputElement;
    if (tokenField) {
      tokenField.value = token;
    }
  }

  /**
   * Generate a simple CSRF token
   */
  private generateCsrfToken(): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      sessionStorage.setItem('csrf_token', token);
    } catch (error) {
      console.warn('Failed to store CSRF token:', error);
    }
    return token;
  }

  /**
   * Validate a single field and display error
   */
  private validateField(fieldName: string, errorElement: HTMLElement): void {
    const field = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
    if (!field) return;

    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'name':
        const nameResult = this.validateName(field.value);
        isValid = nameResult.isValid;
        errorMessage = nameResult.error || '';
        break;
      case 'email':
        const emailResult = this.validateEmail(field.value);
        isValid = emailResult.isValid;
        errorMessage = emailResult.error || '';
        break;
      case 'message':
        const messageResult = this.validateMessage(field.value);
        isValid = messageResult.isValid;
        errorMessage = messageResult.error || '';
        break;
    }

    if (!isValid) {
      field.classList.add('error');
      errorElement.textContent = errorMessage;
      errorElement.classList.add('show');
    } else {
      field.classList.remove('error');
      errorElement.classList.remove('show');
      errorElement.textContent = '';
    }
  }

  /**
   * Simple name validation
   */
  private validateName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Por favor, insira o seu nome' };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return { isValid: false, error: 'O nome deve ter pelo menos 2 caracteres' };
    }

    if (trimmedName.length > 100) {
      return { isValid: false, error: 'O nome deve ter menos de 100 caracteres' };
    }

    return { isValid: true };
  }

  /**
   * Simple email validation
   */
  private validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'Por favor, insira o seu email' };
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, error: 'Por favor, insira um email válido' };
    }

    return { isValid: true };
  }

  /**
   * Simple message validation
   */
  private validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Por favor, insira a sua mensagem' };
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      return { isValid: false, error: 'A mensagem deve ter pelo menos 10 caracteres' };
    }

    if (trimmedMessage.length > 2000) {
      return { isValid: false, error: 'A mensagem deve ter menos de 2000 caracteres' };
    }

    return { isValid: true };
  }

  /**
   * Check rate limiting for form submissions
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const key = 'contact_form_submissions';
    const maxSubmissions = 3; // Max 3 submissions per hour
    const windowMs = 60 * 60 * 1000; // 1 hour

    try {
      const stored = localStorage.getItem(key);
      const submissions: number[] = stored ? JSON.parse(stored) : [];

      // Filter out submissions outside the time window
      const validSubmissions = submissions.filter(timestamp => now - timestamp < windowMs);

      if (validSubmissions.length >= maxSubmissions) {
        return false;
      }

      return true;
    } catch (error) {
      // If localStorage fails, allow submission but log error
      console.warn('Rate limiting check failed:', error);
      return true;
    }
  }

  /**
   * Record a successful submission for rate limiting
   */
  private recordSubmission(): void {
    const now = Date.now();
    const key = 'contact_form_submissions';

    try {
      const stored = localStorage.getItem(key);
      const submissions: number[] = stored ? JSON.parse(stored) : [];
      submissions.push(now);

      // Keep only recent submissions (within 2 hours to be safe)
      const windowMs = 2 * 60 * 60 * 1000;
      const validSubmissions = submissions.filter(timestamp => now - timestamp < windowMs);

      localStorage.setItem(key, JSON.stringify(validSubmissions));
    } catch (error) {
      console.warn('Failed to record submission:', error);
    }
  }

  /**
   * Check honeypot field for bot protection
   */
  private checkHoneypot(): boolean {
    if (!this.formElement) return true;

    const honeypotField = this.formElement.querySelector('[name="website"]') as HTMLInputElement;
    if (!honeypotField) return true; // If field doesn't exist, allow submission

    // If honeypot field has any value, it's likely a bot
    return !honeypotField.value || honeypotField.value.trim() === '';
  }

  /**
   * Validate CSRF token
   */
  private validateCsrfToken(): boolean {
    if (!this.formElement) return true;

    const tokenField = this.formElement.querySelector('[name="csrf_token"]') as HTMLInputElement;
    const storedToken = sessionStorage.getItem('csrf_token');

    if (!tokenField || !storedToken) return true; // If no token system, allow

    return tokenField.value === storedToken;
  }

  /**
   * Sanitize form data using DOMPurify
   */
  private sanitizeFormData(data: ContactRequest): ContactRequest {
    return {
      name: window.DOMPurify.sanitize(data.name),
      email: window.DOMPurify.sanitize(data.email),
      phone: data.phone ? window.DOMPurify.sanitize(data.phone) : undefined,
      message: window.DOMPurify.sanitize(data.message), // Allow basic formatting
    };
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.isSubmitting) {
      return;
    }

    // Security checks
    if (!this.checkRateLimit()) {
      this.showErrorMessage(
        'Demasiadas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.'
      );
      return;
    }

    if (!this.checkHoneypot()) {
      this.showErrorMessage('Erro de validação. Por favor, tente novamente.');
      return;
    }

    if (!this.validateCsrfToken()) {
      this.showErrorMessage(
        'Token de segurança inválido. Por favor, recarregue a página e tente novamente.'
      );
      return;
    }

    // Validate form
    const validationResult = this.validator.validateForm();

    if (!validationResult.isValid) {
      this.eventHandlers.onValidationFailed?.(validationResult.errors);
      return;
    }

    const formData = this.validator.getFormData();
    if (!formData) {
      this.eventHandlers.onError?.(new Error('Não foi possível obter os dados do formulário'));
      return;
    }

    // Sanitize inputs
    const sanitizedData = this.sanitizeFormData(formData);

    // Start submission
    this.setSubmittingState(true);

    try {
      // Call submit handler if provided
      const success = (await this.eventHandlers.onSubmit?.(sanitizedData)) ?? true;

      if (success) {
        this.recordSubmission(); // Record successful submission for rate limiting
        this.showSuccessMessage();
        this.resetForm();
        this.eventHandlers.onSuccess?.(sanitizedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      // Check if we're offline
      if (!navigator.onLine) {
        // Try to register for background sync
        try {
          await BackgroundSync.registerContactForm(sanitizedData);
          this.showSuccessMessage('Mensagem registada para envio quando a ligação for restaurada.');
          this.resetForm();
          this.eventHandlers.onSuccess?.(sanitizedData);
          return;
        } catch (syncError) {
          console.warn('Background sync not available:', syncError);
          // Fall through to normal error handling
        }
      }

      this.showErrorMessage(errorMessage);
      this.eventHandlers.onError?.(error instanceof Error ? error : new Error(errorMessage));
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
      const buttonText = this.submitButton.querySelector('.btn-text');
      const loadingText = this.submitButton.querySelector('.btn-loading');

      if (isSubmitting) {
        this.submitButton.disabled = true;
        if (buttonText) (buttonText as HTMLElement).style.display = 'none';
        if (loadingText) (loadingText as HTMLElement).style.display = 'inline-flex';
      } else {
        this.submitButton.disabled = false;
        if (buttonText) (buttonText as HTMLElement).style.display = 'inline';
        if (loadingText) (loadingText as HTMLElement).style.display = 'none';
      }
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message?: string): void {
    const successElement = document.querySelector(
      this.config.successMessageSelector
    ) as HTMLElement;
    const errorElement = document.querySelector(this.config.errorMessageSelector) as HTMLElement;

    if (successElement) {
      if (message) {
        successElement.textContent = message;
      }
      successElement.classList.remove('hidden');
      (successElement as HTMLElement).style.display = 'block';
      successElement.setAttribute('aria-hidden', 'false');
    }

    if (errorElement) {
      errorElement.classList.add('hidden');
      (errorElement as HTMLElement).style.display = 'none';
      errorElement.setAttribute('aria-hidden', 'true');
    }

    // Hide success message after 5 seconds
    setTimeout(() => {
      if (successElement) {
        successElement.classList.add('hidden');
        (successElement as HTMLElement).style.display = 'none';
        successElement.setAttribute('aria-hidden', 'true');
        // Reset to default message
        successElement.textContent =
          'Mensagem enviada com sucesso! Entraremos em contacto brevemente.';
      }
    }, 5000);
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    const errorElement = document.querySelector(this.config.errorMessageSelector) as HTMLElement;
    const successElement = document.querySelector(
      this.config.successMessageSelector
    ) as HTMLElement;

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      (errorElement as HTMLElement).style.display = 'block';
      errorElement.setAttribute('aria-hidden', 'false');
    }

    if (successElement) {
      successElement.classList.add('hidden');
      (successElement as HTMLElement).style.display = 'none';
      successElement.setAttribute('aria-hidden', 'true');
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
  public on<K extends keyof ContactFormEvents>(event: K, handler: ContactFormEvents[K]): void {
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
      this.formElement.removeEventListener('submit', this.handleSubmit);
    }
    this.eventHandlers = {};
  }
}

/**
 * Email service integration using custom backend
 */
class EmailService {
  private endpoint: string;

  constructor() {
    this.endpoint = '/api/contact';
  }

  /**
   * Send form data to email service
   */
  async sendEmail(data: ContactRequest): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Falha ao enviar mensagem. Por favor, tente novamente mais tarde.'
      );
    }
  }
}

/**
 * Create a contact form manager with default configuration and email service
 */
export function createContactForm(): ContactFormManager {
  const config: ContactFormConfig = {
    formSelector: '#contact-form-element',
    submitButtonSelector: '#contact-submit',
    successMessageSelector: '#form-success',
    errorMessageSelector: '#form-error',
  };

  const contactForm = new ContactFormManager(config);
  const emailService = new EmailService();

  // Set up email submission handler
  contactForm.on('onSubmit', async (data: ContactRequest) => {
    return await emailService.sendEmail(data);
  });

  // Set up success handler
  contactForm.on('onSuccess', (data: ContactRequest) => {
    console.log('Contact form submitted successfully:', data);
  });

  // Set up error handler
  contactForm.on('onError', (error: Error) => {
    // Log error message without exposing sensitive information
    console.error('Contact form submission failed:', {
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  return contactForm;
}
