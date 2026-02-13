/**
 * LOFERSIL Landing Page - Form Validation Module
 * Comprehensive input validation system for contact forms
 */

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MIN_PHONE_LENGTH = 7;
const MAX_PHONE_LENGTH = 20;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

const DOMPurify = (
  globalThis as unknown as {
    DOMPurify: { sanitize: (input: string) => string };
  }
).DOMPurify;

export const VALIDATION_MESSAGES = {
  name: {
    required: "Nome é obrigatório",
    tooShort: "Nome deve ter pelo menos 2 caracteres",
    tooLong: "Nome deve ter menos de 100 caracteres",
    invalidChars: "Nome contém caracteres inválidos",
  },
  email: {
    required: "Email é obrigatório",
    invalid: "Por favor, insira um email válido",
    tooLong: "Endereço de email muito longo",
  },
  phone: {
    invalid: "Por favor, insira um número de telefone válido",
    tooLong: "Número de telefone muito longo",
  },
  message: {
    required: "Mensagem é obrigatória",
    tooShort: "Mensagem deve ter pelo menos 10 caracteres",
    tooLong: "Mensagem deve ter menos de 2000 caracteres",
  },
};

export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FieldValidationResult extends ValidationResult {
  field: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldResults: Record<string, FieldValidationResult>;
}

export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.name.required,
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < MIN_NAME_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.name.tooShort,
    };
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.name.tooLong,
    };
  }

  const nameRegex = /^[a-zA-Zà-žÀ-Ž\s\-']+$/u;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.name.invalidChars,
    };
  }

  return { isValid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.email.required,
    };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.email.tooLong,
    };
  }

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.email.invalid,
    };
  }

  return { isValid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true };
  }

  const trimmedPhone = phone.trim();

  if (trimmedPhone.length > MAX_PHONE_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.phone.tooLong,
    };
  }

  const phoneRegex = /^[+]?[\d\s\-()]+$/;

  if (!phoneRegex.test(trimmedPhone)) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.phone.invalid,
    };
  }

  const digitsOnly = trimmedPhone.replace(/[\s\-()+]/g, "");
  if (digitsOnly.length < MIN_PHONE_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.phone.invalid,
    };
  }

  return { isValid: true };
}

export function validateMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.message.required,
    };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.message.tooShort,
    };
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.message.tooLong,
    };
  }

  return { isValid: true };
}

export function validateContactForm(
  formData: ContactRequest,
): FormValidationResult {
  const fieldResults: Record<string, FieldValidationResult> = {};
  const errors: Record<string, string> = {};

  const nameResult = validateName(formData.name);
  fieldResults.name = { ...nameResult, field: "name" };
  if (!nameResult.isValid && nameResult.error) {
    errors.name = nameResult.error;
  }

  const emailResult = validateEmail(formData.email);
  fieldResults.email = { ...emailResult, field: "email" };
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  if (formData.phone !== undefined) {
    const phoneResult = validatePhone(formData.phone);
    fieldResults.phone = { ...phoneResult, field: "phone" };
    if (!phoneResult.isValid && phoneResult.error) {
      errors.phone = phoneResult.error;
    }
  }

  const messageResult = validateMessage(formData.message);
  fieldResults.message = { ...messageResult, field: "message" };
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

export class FormErrorDisplay {
  private formElement: HTMLElement | null = null;
  private errorContainer: HTMLElement | null = null;

  constructor(formSelector: string) {
    this.formElement = document.querySelector(formSelector);
    if (this.formElement) {
      this.createErrorContainer();
    }
  }

  private createErrorContainer(): void {
    if (!this.formElement) {
      return;
    }

    this.errorContainer = document.createElement("div");
    this.errorContainer.className = "form-errors";
    this.errorContainer.setAttribute("role", "alert");
    this.errorContainer.setAttribute("aria-live", "polite");
    this.errorContainer.style.cssText = `
      display: none;
      background-color: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      color: #c33;
    `;

    this.formElement.insertBefore(
      this.errorContainer,
      this.formElement.firstChild,
    );
  }

  public displayErrors(errors: Record<string, string>): void {
    if (!this.errorContainer) {
      return;
    }

    this.clearErrors();

    const errorMessages = Object.values(errors);
    if (errorMessages.length === 0) {
      this.errorContainer.style.display = "none";
      return;
    }

    const errorList = document.createElement("ul");
    errorList.style.cssText = "margin: 0; padding-left: 20px;";

    errorMessages.forEach((error) => {
      const listItem = document.createElement("li");
      listItem.textContent = error;
      errorList.appendChild(listItem);
    });

    this.errorContainer.appendChild(errorList);
    this.errorContainer.style.display = "block";

    this.errorContainer.focus();
  }

  public displayFieldErrors(
    fieldResults: Record<string, FieldValidationResult>,
  ): void {
    this.clearFieldErrors();

    Object.entries(fieldResults).forEach(([fieldName, result]) => {
      if (!result.isValid && result.error) {
        this.displayFieldError(fieldName, result.error);
      }
    });
  }

  public displayFieldError(fieldName: string, errorMessage: string): void {
    const fieldElement = this.formElement?.querySelector(
      `[name="${fieldName}"]`,
    ) as HTMLElement;
    if (!fieldElement) {
      return;
    }

    const errorElement = document.createElement("div");
    errorElement.className = "field-error";
    errorElement.textContent = errorMessage;
    errorElement.setAttribute("role", "alert");
    errorElement.style.cssText = `
      color: #c33;
      font-size: 14px;
      margin-top: 4px;
      margin-bottom: 8px;
    `;

    fieldElement.classList.add("error");

    fieldElement.parentNode?.insertBefore(
      errorElement,
      fieldElement.nextSibling,
    );
  }

  public clearErrors(): void {
    if (this.errorContainer) {
      this.errorContainer.innerHTML = "";
      this.errorContainer.style.display = "none";
    }
    this.clearFieldErrors();
  }

  public clearFieldErrors(): void {
    const errorFields = this.formElement?.querySelectorAll(".error");
    errorFields?.forEach((field) => {
      field.classList.remove("error");
    });

    const errorElements = this.formElement?.querySelectorAll(".field-error");
    errorElements?.forEach((element) => {
      element.remove();
    });
  }

  public displaySuccess(message: string): void {
    if (!this.errorContainer) {
      return;
    }

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
    this.errorContainer.setAttribute("role", "status");
  }
}

export class ContactFormValidator {
  private errorDisplay: FormErrorDisplay;
  private formElement: HTMLFormElement | null = null;

  constructor(formSelector: string) {
    this.errorDisplay = new FormErrorDisplay(formSelector);
    this.formElement = document.querySelector(formSelector);
    this.setupFormValidation();
  }

  private setupFormValidation(): void {
    if (!this.formElement) {
      return;
    }

    const fields = ["name", "email", "phone", "message"];

    fields.forEach((fieldName) => {
      const field = this.formElement?.querySelector(
        `[name="${fieldName}"]`,
      ) as HTMLInputElement;
      if (field) {
        field.addEventListener("blur", () => this.validateField(fieldName));
        field.addEventListener("input", () => this.clearFieldError(fieldName));
      }
    });
  }

  private validateField(fieldName: string): void {
    const field = this.formElement?.querySelector(
      `[name="${fieldName}"]`,
    ) as HTMLInputElement;
    if (!field) {
      return;
    }

    let result: ValidationResult;

    switch (fieldName) {
      case "name":
        result = validateName(field.value);
        break;
      case "email":
        result = validateEmail(field.value);
        break;
      case "phone":
        result = validatePhone(field.value);
        break;
      case "message":
        result = validateMessage(field.value);
        break;
      default:
        return;
    }

    if (!result.isValid && result.error) {
      this.errorDisplay.displayFieldError(fieldName, result.error);
    }
  }

  private clearFieldError(fieldName: string): void {
    const field = this.formElement?.querySelector(
      `[name="${fieldName}"]`,
    ) as HTMLElement;
    if (field) {
      field.classList.remove("error");
      const errorElement = field.parentNode?.querySelector(".field-error");
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  public validateForm(): FormValidationResult {
    if (!this.formElement) {
      return {
        isValid: false,
        errors: { form: "Form not found" },
        fieldResults: {},
      };
    }

    const formData: ContactRequest = {
      name: DOMPurify.sanitize(
        (this.formElement.querySelector('[name="name"]') as HTMLInputElement)
          ?.value || "",
      ),
      email: DOMPurify.sanitize(
        (this.formElement.querySelector('[name="email"]') as HTMLInputElement)
          ?.value || "",
      ),
      phone: DOMPurify.sanitize(
        (this.formElement.querySelector('[name="phone"]') as HTMLInputElement)
          ?.value || "",
      ),
      message: DOMPurify.sanitize(
        (
          this.formElement.querySelector(
            '[name="message"]',
          ) as HTMLTextAreaElement
        )?.value || "",
      ),
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

  public getFormData(): ContactRequest | null {
    if (!this.formElement) {
      return null;
    }

    return {
      name: DOMPurify.sanitize(
        (
          this.formElement.querySelector('[name="name"]') as HTMLInputElement
        )?.value.trim() || "",
      ),
      email: DOMPurify.sanitize(
        (
          this.formElement.querySelector('[name="email"]') as HTMLInputElement
        )?.value.trim() || "",
      ),
      phone: DOMPurify.sanitize(
        (
          this.formElement.querySelector('[name="phone"]') as HTMLInputElement
        )?.value.trim() || "",
      ),
      message: DOMPurify.sanitize(
        (
          this.formElement.querySelector(
            '[name="message"]',
          ) as HTMLTextAreaElement
        )?.value.trim() || "",
      ),
    };
  }

  public displaySuccess(message: string): void {
    this.errorDisplay.displaySuccess(message);
  }

  public clearErrors(): void {
    this.errorDisplay.clearErrors();
  }
}
