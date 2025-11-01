/**
 * LOFERSIL Landing Page - Validation Tests
 * Comprehensive tests for form validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  validateContactForm,
  VALIDATION_MESSAGES,
} from './validation';

describe('Validation Functions', () => {
  describe('validateName', () => {
    it('should validate valid names', () => {
      expect(validateName('John Doe').isValid).toBe(true);
      expect(validateName('María José').isValid).toBe(true);
      expect(validateName("O'Connor").isValid).toBe(true);
      expect(validateName('Jean-Pierre').isValid).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(validateName('').isValid).toBe(false);
      expect(validateName('A').isValid).toBe(false);
      expect(validateName('A'.repeat(101)).isValid).toBe(false);
      expect(validateName('John123').isValid).toBe(false);
      expect(validateName('John@Doe').isValid).toBe(false);
    });

    it('should return correct error messages', () => {
      expect(validateName('').error).toBe(VALIDATION_MESSAGES.name.required);
      expect(validateName('A').error).toBe(VALIDATION_MESSAGES.name.tooShort);
      expect(validateName('A'.repeat(101)).error).toBe(VALIDATION_MESSAGES.name.tooLong);
      expect(validateName('John123').error).toBe(VALIDATION_MESSAGES.name.invalidChars);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid emails', () => {
      expect(validateEmail('user@example.com').isValid).toBe(true);
      expect(validateEmail('test.email+tag@gmail.com').isValid).toBe(true);
      expect(validateEmail('user@subdomain.example.com').isValid).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('userexample.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('user@exa mple.com').isValid).toBe(false);
      expect(validateEmail('a'.repeat(250) + '@example.com').isValid).toBe(false);
    });

    it('should return correct error messages', () => {
      expect(validateEmail('').error).toBe(VALIDATION_MESSAGES.email.required);
      expect(validateEmail('userexample.com').error).toBe(VALIDATION_MESSAGES.email.invalid);
      expect(validateEmail('a'.repeat(250) + '@example.com').error).toBe(
        VALIDATION_MESSAGES.email.tooLong
      );
    });
  });

  describe('validatePhone', () => {
    it('should validate valid phones', () => {
      expect(validatePhone('').isValid).toBe(true); // Optional field
      expect(validatePhone('+1 555-123-4567').isValid).toBe(true);
      expect(validatePhone('(555) 123-4567').isValid).toBe(true);
      expect(validatePhone('5551234567').isValid).toBe(true);
      expect(validatePhone('+351 912 345 678').isValid).toBe(true);
    });

    it('should reject invalid phones', () => {
      expect(validatePhone('123').isValid).toBe(false);
      expect(validatePhone('555-abc-1234').isValid).toBe(false);
      expect(validatePhone('1'.repeat(21)).isValid).toBe(false);
    });

    it('should return correct error messages', () => {
      expect(validatePhone('123').error).toBe(VALIDATION_MESSAGES.phone.invalid);
      expect(validatePhone('1'.repeat(21)).error).toBe(VALIDATION_MESSAGES.phone.tooLong);
    });
  });

  describe('validateMessage', () => {
    it('should validate valid messages', () => {
      expect(validateMessage('This is a valid message with enough content.').isValid).toBe(true);
      expect(validateMessage('Hello world!').isValid).toBe(true);
    });

    it('should reject invalid messages', () => {
      expect(validateMessage('').isValid).toBe(false);
      expect(validateMessage('Hi').isValid).toBe(false);
      expect(validateMessage('A'.repeat(2001)).isValid).toBe(false);
    });

    it('should return correct error messages', () => {
      expect(validateMessage('').error).toBe(VALIDATION_MESSAGES.message.required);
      expect(validateMessage('Hi').error).toBe(VALIDATION_MESSAGES.message.tooShort);
      expect(validateMessage('A'.repeat(2001)).error).toBe(VALIDATION_MESSAGES.message.tooLong);
    });
  });

  describe('validateContactForm', () => {
    it('should validate valid contact form', () => {
      const result = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 555-123-4567',
        message: 'This is a valid message with enough content to pass validation.',
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject invalid contact forms', () => {
      // Missing name
      let result = validateContactForm({
        name: '',
        email: 'john@example.com',
        message: 'Valid message',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe(VALIDATION_MESSAGES.name.required);

      // Invalid email
      result = validateContactForm({
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Valid message',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.email.invalid);

      // Short message
      result = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hi',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.message).toBe(VALIDATION_MESSAGES.message.tooShort);
    });

    it('should handle multiple validation errors', () => {
      const result = validateContactForm({
        name: '',
        email: 'invalid',
        message: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe(VALIDATION_MESSAGES.name.required);
      expect(result.errors.email).toBe(VALIDATION_MESSAGES.email.invalid);
      expect(result.errors.message).toBe(VALIDATION_MESSAGES.message.required);
    });
  });
});
