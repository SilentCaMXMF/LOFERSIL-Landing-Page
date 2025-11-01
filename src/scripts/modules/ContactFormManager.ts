/**
 * LOFERSIL Landing Page - Contact Form Module
 * Handles contact form submission, validation, and email service integration
 */

import { ContactFormValidator, ContactRequest } from '../validation.js';

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

    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.setAttribute('aria-hidden', 'true');
    }

    // Set up form submission handler
    this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

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
   * Handle form submission
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.isSubmitting) {
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

    // Start submission
    this.setSubmittingState(true);

    try {
      // Call submit handler if provided
      const success = (await this.eventHandlers.onSubmit?.(formData)) ?? true;

      if (success) {
        this.showSuccessMessage();
        this.resetForm();
        this.eventHandlers.onSuccess?.(formData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
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
  private showSuccessMessage(): void {
    const successElement = document.querySelector(
      this.config.successMessageSelector
    ) as HTMLElement;
    const errorElement = document.querySelector(this.config.errorMessageSelector) as HTMLElement;

    if (successElement) {
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
 * Email service integration using Formspree
 */
class EmailService {
  private endpoint: string;
  private formId: string;

  constructor() {
    // Formspree endpoint - replace with actual form ID
    this.formId = 'xqakpvna'; // This should be replaced with actual Formspree form ID
    this.endpoint = `https://formspree.io/f/${this.formId}`;
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
          subject: `Nova mensagem de contacto de ${data.name}`,
          _subject: `LOFERSIL - Contacto de ${data.name}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.ok || true;
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error('Falha ao enviar mensagem. Por favor, tente novamente mais tarde.');
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
    emailService: {
      endpoint: 'https://formspree.io/f/xqakpvna',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
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
    console.error('Contact form submission error:', error);
  });

  return contactForm;
}
