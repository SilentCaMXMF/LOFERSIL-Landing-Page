/**
 * LOFERSIL Landing Page - Form Validation Module
 * Comprehensive input validation system for contact forms
 */

// Extended contact request interface with phone field
export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Field-specific validation result
export interface FieldValidationResult extends ValidationResult {
  field: string;
}

// Complete form validation result
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldResults: Record<string, FieldValidationResult>;
}

// Validation error messages (can be internationalized later)
export const VALIDATION_MESSAGES = {
  name: {
    required: 'Name is required',
    tooShort: 'Name must be at least 2 characters long',
    tooLong: 'Name must be less than 100 characters',
    invalidChars: 'Name contains invalid characters',
  },
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
    tooLong: 'Email address is too long',
  },
  phone: {
    invalid: 'Please enter a valid phone number',
    tooLong: 'Phone number is too long',
  },
  message: {
    required: 'Message is required',
    tooShort: 'Message must be at least 10 characters long',
    tooLong: 'Message must be less than 2000 characters',
  },
} as const;

/**
 * Validates a name field
 * @param name - The name to validate
 * @returns ValidationResult
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: VALIDATION_MESSAGES.name.required };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: VALIDATION_MESSAGES.name.tooShort };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: VALIDATION_MESSAGES.name.tooLong };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[\p{L}\s\-']+$/u;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: VALIDATION_MESSAGES.name.invalidChars };
  }

  return { isValid: true };
}

/**
 * Validates an email field
 * @param email - The email to validate
 * @returns ValidationResult
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: VALIDATION_MESSAGES.email.required };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: VALIDATION_MESSAGES.email.tooLong };
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: VALIDATION_MESSAGES.email.invalid };
  }

  return { isValid: true };
}

/**
 * Validates a phone number field (optional)
 * @param phone - The phone number to validate
 * @returns ValidationResult
 */
export function validatePhone(phone: string): ValidationResult {
  // Phone is optional, so empty is valid
  if (!phone || phone.trim().length === 0) {
    return { isValid: true };
  }

  const trimmedPhone = phone.trim();

  if (trimmedPhone.length > 20) {
    return { isValid: false, error: VALIDATION_MESSAGES.phone.tooLong };
  }

  // Flexible phone regex that accepts various formats
  // Allows digits, spaces, hyphens, parentheses, plus signs
  const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;

  if (!phoneRegex.test(trimmedPhone)) {
    return { isValid: false, error: VALIDATION_MESSAGES.phone.invalid };
  }

  // Check for minimum reasonable length (after removing formatting)
  const digitsOnly = trimmedPhone.replace(/[\s\-\(\)\+]/g, '');
  if (digitsOnly.length < 7) {
    return { isValid: false, error: VALIDATION_MESSAGES.phone.invalid };
  }

  return { isValid: true };
}

/**
 * Validates a message field
 * @param message - The message to validate
 * @returns ValidationResult
 */
export function validateMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: VALIDATION_MESSAGES.message.required };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length < 10) {
    return { isValid: false, error: VALIDATION_MESSAGES.message.tooShort };
  }

  if (trimmedMessage.length > 2000) {
    return { isValid: false, error: VALIDATION_MESSAGES.message.tooLong };
  }

  return { isValid: true };
}

/**
 * Validates an entire contact form
 * @param formData - The contact form data
 * @returns FormValidationResult
 */
export function validateContactForm(formData: ContactRequest): FormValidationResult {
  const fieldResults: Record<string, FieldValidationResult> = {};
  const errors: Record<string, string> = {};

  // Validate each field
  const nameResult = validateName(formData.name);
  fieldResults.name = { ...nameResult, field: 'name' };
  if (!nameResult.isValid && nameResult.error) {
    errors.name = nameResult.error;
  }

  const emailResult = validateEmail(formData.email);
  fieldResults.email = { ...emailResult, field: 'email' };
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  if (formData.phone !== undefined) {
    const phoneResult = validatePhone(formData.phone);
    fieldResults.phone = { ...phoneResult, field: 'phone' };
    if (!phoneResult.isValid && phoneResult.error) {
      errors.phone = phoneResult.error;
    }
  }

  const messageResult = validateMessage(formData.message);
  fieldResults.message = { ...messageResult, field: 'message' };
  if (!messageResult.isValid && messageResult.error) {
    errors.message = messageResult.error;
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    fieldResults,
  };
}

/**
 * Error display system for form validation
 */
export class FormErrorDisplay {
  private formElement: HTMLElement | null = null;
  private errorContainer: HTMLElement | null = null;

  constructor(formSelector: string) {
    this.formElement = document.querySelector(formSelector);
    if (this.formElement) {
      this.createErrorContainer();
    }
  }

  /**
   * Creates a container for displaying form errors
   */
  private createErrorContainer(): void {
    if (!this.formElement) return;

    this.errorContainer = document.createElement('div');
    this.errorContainer.className = 'form-errors';
    this.errorContainer.setAttribute('role', 'alert');
    this.errorContainer.setAttribute('aria-live', 'polite');
    this.errorContainer.style.cssText = `
      display: none;
      background-color: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      color: #c33;
    `;

    // Insert at the beginning of the form
    this.formElement.insertBefore(this.errorContainer, this.formElement.firstChild);
  }

  /**
   * Displays validation errors
   * @param errors - Object containing field errors
   */
  public displayErrors(errors: Record<string, string>): void {
    if (!this.errorContainer) return;

    // Clear previous errors
    this.clearErrors();

    const errorMessages = Object.values(errors);
    if (errorMessages.length === 0) {
      this.errorContainer.style.display = 'none';
      return;
    }

    // Create error list
    const errorList = document.createElement('ul');
    errorList.style.cssText = 'margin: 0; padding-left: 20px;';

    errorMessages.forEach(error => {
      const listItem = document.createElement('li');
      listItem.textContent = error;
      errorList.appendChild(listItem);
    });

    this.errorContainer.appendChild(errorList);
    this.errorContainer.style.display = 'block';

    // Focus the error container for accessibility
    this.errorContainer.focus();
  }

  /**
   * Displays field-specific errors
   * @param fieldResults - Field validation results
   */
  public displayFieldErrors(fieldResults: Record<string, FieldValidationResult>): void {
    // Clear previous field errors
    this.clearFieldErrors();

    Object.entries(fieldResults).forEach(([fieldName, result]) => {
      if (!result.isValid && result.error) {
        this.displayFieldError(fieldName, result.error);
      }
    });
  }

  /**
   * Displays error for a specific field
   * @param fieldName - Name of the field
   * @param errorMessage - Error message to display
   */
  public displayFieldError(fieldName: string, errorMessage: string): void {
    const fieldElement = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (!fieldElement) return;

    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = errorMessage;
    errorElement.setAttribute('role', 'alert');
    errorElement.style.cssText = `
      color: #c33;
      font-size: 14px;
      margin-top: 4px;
      margin-bottom: 8px;
    `;

    // Add error class to field
    fieldElement.classList.add('error');

    // Insert error after the field
    fieldElement.parentNode?.insertBefore(errorElement, fieldElement.nextSibling);
  }

  /**
   * Clears all displayed errors
   */
  public clearErrors(): void {
    if (this.errorContainer) {
      this.errorContainer.innerHTML = '';
      this.errorContainer.style.display = 'none';
    }
    this.clearFieldErrors();
  }

  /**
   * Clears field-specific errors
   */
  public clearFieldErrors(): void {
    // Remove error classes and error elements
    const errorFields = this.formElement?.querySelectorAll('.error');
    errorFields?.forEach(field => {
      field.classList.remove('error');
    });

    const errorElements = this.formElement?.querySelectorAll('.field-error');
    errorElements?.forEach(element => {
      element.remove();
    });
  }

  /**
   * Displays success message
   * @param message - Success message to display
   */
  public displaySuccess(message: string): void {
    if (!this.errorContainer) return;

    this.clearErrors();

    this.errorContainer.textContent = message;
    this.errorContainer.style.cssText = `
      display: block;
      background-color: #efe;
      border: 1px solid #cfc;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      color: #363;
    `;
    this.errorContainer.setAttribute('role', 'status');
  }
}

/**
 * Form validation handler that can be integrated with form submission
 */
export class ContactFormValidator {
  private errorDisplay: FormErrorDisplay;
  private formElement: HTMLFormElement | null = null;

  constructor(formSelector: string) {
    this.errorDisplay = new FormErrorDisplay(formSelector);
    this.formElement = document.querySelector(formSelector);
    this.setupFormValidation();
  }

  /**
   * Sets up real-time validation on form fields
   */
  private setupFormValidation(): void {
    if (!this.formElement) return;

    const fields = ['name', 'email', 'phone', 'message'];

    fields.forEach(fieldName => {
      const field = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      if (field) {
        field.addEventListener('blur', () => this.validateField(fieldName));
        field.addEventListener('input', () => this.clearFieldError(fieldName));
      }
    });
  }

  /**
   * Validates a single field and displays error if invalid
   * @param fieldName - Name of the field to validate
   */
  private validateField(fieldName: string): void {
    const field = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
    if (!field) return;

    let result: ValidationResult;

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

    if (!result.isValid && result.error) {
      this.errorDisplay.displayFieldError(fieldName, result.error);
    }
  }

  /**
   * Clears error for a specific field
   * @param fieldName - Name of the field
   */
  private clearFieldError(fieldName: string): void {
    const field = this.formElement?.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (field) {
      field.classList.remove('error');
      const errorElement = field.parentNode?.querySelector('.field-error');
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  /**
   * Validates the entire form
   * @returns FormValidationResult
   */
  public validateForm(): FormValidationResult {
    if (!this.formElement) {
      return {
        isValid: false,
        errors: { form: 'Form not found' },
        fieldResults: {},
      };
    }

    const formData: ContactRequest = {
      name: (this.formElement.querySelector('[name="name"]') as HTMLInputElement)?.value || '',
      email: (this.formElement.querySelector('[name="email"]') as HTMLInputElement)?.value || '',
      phone: (this.formElement.querySelector('[name="phone"]') as HTMLInputElement)?.value || '',
      message:
        (this.formElement.querySelector('[name="message"]') as HTMLTextAreaElement)?.value || '',
    };

    const result = validateContactForm(formData);

    if (!result.isValid) {
      this.errorDisplay.displayErrors(result.errors);
      this.errorDisplay.displayFieldErrors(result.fieldResults);
    } else {
      this.errorDisplay.clearErrors();
    }

    return result;
  }

  /**
   * Gets form data as ContactRequest object
   * @returns ContactRequest or null if form not found
   */
  public getFormData(): ContactRequest | null {
    if (!this.formElement) return null;

    return {
      name:
        (this.formElement.querySelector('[name="name"]') as HTMLInputElement)?.value.trim() || '',
      email:
        (this.formElement.querySelector('[name="email"]') as HTMLInputElement)?.value.trim() || '',
      phone:
        (this.formElement.querySelector('[name="phone"]') as HTMLInputElement)?.value.trim() || '',
      message:
        (this.formElement.querySelector('[name="message"]') as HTMLTextAreaElement)?.value.trim() ||
        '',
    };
  }

  /**
   * Displays success message
   * @param message - Success message
   */
  public displaySuccess(message: string): void {
    this.errorDisplay.displaySuccess(message);
  }

  /**
   * Clears all errors
   */
  public clearErrors(): void {
    this.errorDisplay.clearErrors();
  }
}
