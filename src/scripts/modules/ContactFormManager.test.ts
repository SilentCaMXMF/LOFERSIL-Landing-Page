/**
 * ContactFormManager Tests
 * Comprehensive unit tests for contact form functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContactFormManager } from '../modules/ContactFormManager.js';

describe('ContactFormManager', () => {
  let contactFormManager: ContactFormManager;
  const mockConfig = {
    formSelector: '#contact-form',
    submitButtonSelector: '#submit-btn',
    successMessageSelector: '#success-message',
    errorMessageSelector: '#error-message',
  };

  beforeEach(() => {
    // Create form HTML structure
    document.body.innerHTML = `
      <form id="contact-form">
        <input type="text" name="name" id="name" />
        <div id="name-error" class="error"></div>
        
        <input type="email" name="email" id="email" />
        <div id="email-error" class="error"></div>
        
        <input type="tel" name="phone" id="phone" />
        <div id="phone-error" class="error"></div>
        
        <textarea name="message" id="message"></textarea>
        <div id="message-error" class="error"></div>
        
        <button type="submit" id="submit-btn">Submit</button>
      </form>
      
      <div id="success-message" class="hidden">Success!</div>
      <div id="error-message" class="hidden">Error!</div>
    `;

    contactFormManager = new ContactFormManager(mockConfig);
  });

  describe('Initialization', () => {
    it('should initialize with provided config', () => {
      expect(contactFormManager).toBeDefined();
    });

    it('should hide success and error messages on initialization', () => {
      const successMessage = document.querySelector(mockConfig.successMessageSelector);
      const errorMessage = document.querySelector(mockConfig.errorMessageSelector);

      expect(successMessage?.classList.contains('hidden')).toBe(true);
      expect(errorMessage?.classList.contains('hidden')).toBe(true);
    });

    it('should handle missing form element gracefully', () => {
      document.body.innerHTML = ''; // Remove form

      // Should not throw when form is missing
      expect(() => {
        new ContactFormManager(mockConfig);
      }).not.toThrow();
    });
  });

  describe('Field Validation', () => {
    it('should validate name field', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const nameError = document.getElementById('name-error');

      nameInput.value = '';
      nameInput.dispatchEvent(new Event('blur'));

      expect(nameError?.textContent).toContain('obrigatório');
    });

    it('should validate email field with invalid format', () => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const emailError = document.getElementById('email-error');

      emailInput.value = 'invalid-email';
      emailInput.dispatchEvent(new Event('blur'));

      expect(emailError?.textContent).toContain('válido');
    });

    it('should validate email field with valid format', () => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const emailError = document.getElementById('email-error');

      emailInput.value = 'test@example.com';
      emailInput.dispatchEvent(new Event('blur'));

      // Error should be cleared
      expect(emailError?.textContent).toBe('');
    });

    it('should validate message field minimum length', () => {
      const messageInput = document.getElementById('message') as HTMLTextAreaElement;
      const messageError = document.getElementById('message-error');

      messageInput.value = 'Hi';
      messageInput.dispatchEvent(new Event('blur'));

      expect(messageError?.textContent).toContain('pelo menos');
    });

    it('should clear error on input', () => {
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const nameError = document.getElementById('name-error');

      // Trigger error first
      nameInput.value = '';
      nameInput.dispatchEvent(new Event('blur'));
      expect(nameError?.textContent).not.toBe('');

      // Clear on input
      nameInput.value = 'John';
      nameInput.dispatchEvent(new Event('input'));
      expect(nameError?.textContent).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form with valid data', () => {
      const form = document.getElementById('contact-form') as HTMLFormElement;

      // Set valid values
      (form.querySelector('[name="name"]') as HTMLInputElement).value = 'John Doe';
      (form.querySelector('[name="email"]') as HTMLInputElement).value = 'john@example.com';
      (form.querySelector('[name="phone"]') as HTMLInputElement).value = '123456789';
      (form.querySelector('[name="message"]') as HTMLTextAreaElement).value =
        'This is a test message with enough length';

      const isValid = contactFormManager.validateForm();
      expect(isValid).toBe(true);
    });

    it('should invalidate form with empty required fields', () => {
      const form = document.getElementById('contact-form') as HTMLFormElement;

      // Leave fields empty
      const isValid = contactFormManager.validateForm();
      expect(isValid).toBe(false);
    });

    it('should invalidate form with invalid email', () => {
      const form = document.getElementById('contact-form') as HTMLFormElement;

      (form.querySelector('[name="name"]') as HTMLInputElement).value = 'John Doe';
      (form.querySelector('[name="email"]') as HTMLInputElement).value = 'invalid-email';
      (form.querySelector('[name="message"]') as HTMLTextAreaElement).value = 'Valid message here';

      const isValid = contactFormManager.validateForm();
      expect(isValid).toBe(false);
    });
  });

  describe('Submit Button State', () => {
    it('should disable submit button during submission', async () => {
      const submitButton = document.getElementById('submit-btn') as HTMLButtonElement;

      contactFormManager.setSubmitting(true);

      expect(submitButton.disabled).toBe(true);
    });

    it('should enable submit button after submission', async () => {
      const submitButton = document.getElementById('submit-btn') as HTMLButtonElement;

      contactFormManager.setSubmitting(true);
      contactFormManager.setSubmitting(false);

      expect(submitButton.disabled).toBe(false);
    });

    it('should prevent concurrent submissions', async () => {
      contactFormManager.setSubmitting(true);

      // Try to submit again while already submitting
      const result = contactFormManager.canSubmit();

      expect(result).toBe(false);
    });
  });

  describe('Success/Error Messages', () => {
    it('should show success message', () => {
      contactFormManager.showSuccessMessage();

      const successMessage = document.querySelector(mockConfig.successMessageSelector);
      expect(successMessage?.classList.contains('hidden')).toBe(false);
    });

    it('should show error message', () => {
      contactFormManager.showErrorMessage('Test error message');

      const errorMessage = document.querySelector(mockConfig.errorMessageSelector) as HTMLElement;
      expect(errorMessage?.classList.contains('hidden')).toBe(false);
      expect(errorMessage?.textContent).toContain('Test error message');
    });

    it('should hide messages', () => {
      contactFormManager.showSuccessMessage();
      contactFormManager.hideMessages();

      const successMessage = document.querySelector(mockConfig.successMessageSelector);
      const errorMessage = document.querySelector(mockConfig.errorMessageSelector);

      expect(successMessage?.classList.contains('hidden')).toBe(true);
      expect(errorMessage?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Form Reset', () => {
    it('should reset form and clear errors', () => {
      const form = document.getElementById('contact-form') as HTMLFormElement;

      // Set some values
      (form.querySelector('[name="name"]') as HTMLInputElement).value = 'John';
      (document.getElementById('name-error') as HTMLElement).textContent = 'Error';

      contactFormManager.resetForm();

      expect((form.querySelector('[name="name"]') as HTMLInputElement).value).toBe('');
      expect((document.getElementById('name-error') as HTMLElement).textContent).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing form elements gracefully', () => {
      // Remove submit button
      const submitButton = document.getElementById('submit-btn');
      submitButton?.remove();

      // Should not throw when setting submitting state
      expect(() => {
        contactFormManager.setSubmitting(true);
      }).not.toThrow();
    });

    it('should handle validation errors gracefully', () => {
      // Force an error in validation
      const nameInput = document.getElementById('name') as HTMLInputElement;
      Object.defineProperty(nameInput, 'value', {
        get: () => {
          throw new Error('Test error');
        },
        configurable: true,
      });

      // Should not throw
      expect(() => {
        nameInput.dispatchEvent(new Event('blur'));
      }).not.toThrow();
    });
  });
});
