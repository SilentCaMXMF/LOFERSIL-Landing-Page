/**
 * LOFERSIL Landing Page - Contact Form Module
 * Handles contact form validation and user feedback
 */

import {
  ContactFormValidator,
  ContactRequest,
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  validateContactForm,
} from '../validation.js';

// Contact form configuration
interface ContactFormConfig {
  formSelector: string;
  submitButtonSelector: string;
  successMessageSelector: string;
  errorMessageSelector: string;
}

/**
 * Contact Form Manager
 * Handles form validation and user feedback
 */
export class ContactFormManager {
  private validator: ContactFormValidator;
  private config: ContactFormConfig;
  private formElement: HTMLFormElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private isSubmitting = false;

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

    // Set up real-time validation only (form submits natively to Formspree)
    this.setupRealtimeValidation();
  }

  /**
   * Set up real-time validation feedback
   */
  private setupRealtimeValidation(): void {
    if (!this.formElement) return;

    const fields = ['name', 'email', 'phone', 'message'];

    fields.forEach(fieldName => {
      const field = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      const errorElement = document.getElementById(`${fieldName}-error`);

      if (field && errorElement) {
        // Validate on blur
        field.addEventListener('blur', () => {
          this.validateField(fieldName, errorElement);
        });

        // Clear error on input
        field.addEventListener('input', () => {
          if (field.classList.contains('error')) {
            field.classList.remove('error');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
          }
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

    let result: { isValid: boolean; error?: string };

    switch (fieldName) {
      case 'name':
        result = validateName(field.value);
        break;
      case 'email':
        result = validateEmail(field.value);
        break;
      case 'phone':
        result = validatePhone(field.value);
        break;
      case 'message':
        result = validateMessage(field.value);
        break;
      default:
        return;
    }

    if (!result.isValid) {
      field.classList.add('error');
      errorElement.textContent = result.error || '';
      errorElement.classList.add('show');
    } else {
      field.classList.remove('error');
      errorElement.classList.remove('show');
      errorElement.textContent = '';
    }
  }

  /**
   * Check honeypot field for bot protection
   */
  private checkHoneypot(): boolean {
    if (!this.formElement) return true;

    const honeypotField = this.formElement.querySelector('[name="website"]') as HTMLInputElement;
    if (!honeypotField) return true;

    // If honeypot field has any value, it's likely a bot
    return !honeypotField.value || honeypotField.value.trim() === '';
  }

  /**
   * Sanitize form data using DOMPurify
   */
  private sanitizeFormData(data: ContactRequest): ContactRequest {
    const sanitized = {
      name: window.DOMPurify.sanitize(data.name)?.substring(0, 100) || '',
      email: window.DOMPurify.sanitize(data.email)?.substring(0, 254) || '',
      phone: data.phone ? window.DOMPurify.sanitize(data.phone)?.substring(0, 20) : undefined,
      message: window.DOMPurify.sanitize(data.message)?.substring(0, 2000) || '',
    };

    return sanitized;
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.isSubmitting) {
      return;
    }

    // Check honeypot for bot protection
    if (!this.checkHoneypot()) {
      this.showErrorMessage('Erro de validação. Por favor, tente novamente.');
      return;
    }

    // Get form data
    const formData = this.validator.getFormData();
    if (!formData) {
      this.showErrorMessage('Não foi possível obter os dados do formulário');
      return;
    }

    // Validate form
    const validationResult = validateContactForm(formData);

    if (!validationResult.isValid) {
      const errorMessages = Object.values(validationResult.errors);
      if (errorMessages.length > 0) {
        const message = errorMessages.join('. ');
        this.showErrorMessage(message);

        // Focus on first invalid field
        const firstInvalidField = Object.keys(validationResult.errors)[0];
        const fieldElement = this.formElement?.querySelector(
          `[name="${firstInvalidField}"]`
        ) as HTMLElement;
        if (fieldElement) {
          fieldElement.focus();
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // Sanitize inputs
    const sanitizedData = this.sanitizeFormData(formData);

    // Allow form to submit natively to Formspree
    // The form will submit via its action attribute in HTML
    this.formElement?.submit();

    // Show success message
    this.showSuccessMessage();
    this.resetForm();
  }

  /**
   * Set form submission state
   */
  private setSubmittingState(isSubmitting: boolean): void {
    this.isSubmitting = isSubmitting;

    if (this.submitButton) {
      const buttonText = this.submitButton.querySelector('.btn-text') as HTMLElement;
      const loadingText = this.submitButton.querySelector('.btn-loading') as HTMLElement;

      if (isSubmitting) {
        this.submitButton.disabled = true;
        this.submitButton.setAttribute('aria-disabled', 'true');
        if (buttonText) buttonText.classList.add('hidden');
        if (loadingText) loadingText.classList.remove('hidden');
      } else {
        this.submitButton.disabled = false;
        this.submitButton.setAttribute('aria-disabled', 'false');
        if (buttonText) buttonText.classList.remove('hidden');
        if (loadingText) loadingText.classList.add('hidden');
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
    }
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
    // Form submits natively, no cleanup needed
  }
}

/**
 * Create a contact form manager with default configuration
 */
export function createContactForm(): ContactFormManager {
  const config: ContactFormConfig = {
    formSelector: '#contact-form-element',
    submitButtonSelector: '#contact-submit',
    successMessageSelector: '#form-success',
    errorMessageSelector: '#form-error',
  };

  return new ContactFormManager(config);
}
