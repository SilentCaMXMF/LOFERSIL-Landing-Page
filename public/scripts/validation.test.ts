/**
 * LOFERSIL Landing Page - Validation Tests
 * Comprehensive tests for form validation functions
 */

import {
  validateName,
  validateEmail,
  validatePhone,
  validateMessage,
  validateContactForm,
  VALIDATION_MESSAGES,
} from './validation';

// Test helper function
function runTest(testName: string, testFn: () => boolean): void {
  try {
    const result = testFn();
    console.log(`${result ? '✅' : '❌'} ${testName}`);
    if (!result) {
      throw new Error(`Test failed: ${testName}`);
    }
  } catch (error) {
    console.error(`❌ ${testName}:`, error);
  }
}

// Name validation tests
function testValidateName(): boolean {
  console.log('\n--- Testing validateName ---');

  // Valid names
  runTest('Valid name: John Doe', () => validateName('John Doe').isValid === true);
  runTest('Valid name: María José', () => validateName('María José').isValid === true);
  runTest("Valid name: O'Connor", () => validateName("O'Connor").isValid === true);
  runTest('Valid name: Jean-Pierre', () => validateName('Jean-Pierre').isValid === true);

  // Invalid names
  runTest('Invalid name: empty string', () => {
    const result = validateName('');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.name.required;
  });

  runTest('Invalid name: too short', () => {
    const result = validateName('A');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.name.tooShort;
  });

  runTest('Invalid name: too long', () => {
    const result = validateName('A'.repeat(101));
    return result.isValid === false && result.error === VALIDATION_MESSAGES.name.tooLong;
  });

  runTest('Invalid name: invalid characters', () => {
    const result = validateName('John123');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.name.invalidChars;
  });

  runTest('Invalid name: special characters', () => {
    const result = validateName('John@Doe');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.name.invalidChars;
  });

  return true;
}

// Email validation tests
function testValidateEmail(): boolean {
  console.log('\n--- Testing validateEmail ---');

  // Valid emails
  runTest(
    'Valid email: user@example.com',
    () => validateEmail('user@example.com').isValid === true
  );
  runTest(
    'Valid email: test.email+tag@gmail.com',
    () => validateEmail('test.email+tag@gmail.com').isValid === true
  );
  runTest(
    'Valid email: user@subdomain.example.com',
    () => validateEmail('user@subdomain.example.com').isValid === true
  );

  // Invalid emails
  runTest('Invalid email: empty string', () => {
    const result = validateEmail('');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.email.required;
  });

  runTest('Invalid email: missing @', () => {
    const result = validateEmail('userexample.com');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.email.invalid;
  });

  runTest('Invalid email: missing domain', () => {
    const result = validateEmail('user@');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.email.invalid;
  });

  runTest('Invalid email: invalid characters', () => {
    const result = validateEmail('user@exa mple.com');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.email.invalid;
  });

  runTest('Invalid email: too long', () => {
    const result = validateEmail('a'.repeat(250) + '@example.com');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.email.tooLong;
  });

  return true;
}

// Phone validation tests
function testValidatePhone(): boolean {
  console.log('\n--- Testing validatePhone ---');

  // Valid phones (including empty/optional)
  runTest('Valid phone: empty (optional)', () => validatePhone('').isValid === true);
  runTest('Valid phone: +1 555-123-4567', () => validatePhone('+1 555-123-4567').isValid === true);
  runTest('Valid phone: (555) 123-4567', () => validatePhone('(555) 123-4567').isValid === true);
  runTest('Valid phone: 5551234567', () => validatePhone('5551234567').isValid === true);
  runTest(
    'Valid phone: +351 912 345 678',
    () => validatePhone('+351 912 345 678').isValid === true
  );

  // Invalid phones
  runTest('Invalid phone: too short', () => {
    const result = validatePhone('123');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.phone.invalid;
  });

  runTest('Invalid phone: invalid characters', () => {
    const result = validatePhone('555-abc-1234');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.phone.invalid;
  });

  runTest('Invalid phone: too long', () => {
    const result = validatePhone('1'.repeat(21));
    return result.isValid === false && result.error === VALIDATION_MESSAGES.phone.tooLong;
  });

  return true;
}

// Message validation tests
function testValidateMessage(): boolean {
  console.log('\n--- Testing validateMessage ---');

  // Valid messages
  runTest(
    'Valid message: normal length',
    () => validateMessage('This is a valid message with enough content.').isValid === true
  );
  runTest('Valid message: minimum length', () => validateMessage('Hello world!').isValid === true);

  // Invalid messages
  runTest('Invalid message: empty string', () => {
    const result = validateMessage('');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.message.required;
  });

  runTest('Invalid message: too short', () => {
    const result = validateMessage('Hi');
    return result.isValid === false && result.error === VALIDATION_MESSAGES.message.tooShort;
  });

  runTest('Invalid message: too long', () => {
    const result = validateMessage('A'.repeat(2001));
    return result.isValid === false && result.error === VALIDATION_MESSAGES.message.tooLong;
  });

  return true;
}

// Complete form validation tests
function testValidateContactForm(): boolean {
  console.log('\n--- Testing validateContactForm ---');

  // Valid form
  runTest('Valid contact form', () => {
    const result = validateContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-123-4567',
      message: 'This is a valid message with enough content to pass validation.',
    });
    return result.isValid === true && Object.keys(result.errors).length === 0;
  });

  // Invalid form - missing required fields
  runTest('Invalid contact form: missing name', () => {
    const result = validateContactForm({
      name: '',
      email: 'john@example.com',
      message: 'Valid message',
    });
    return result.isValid === false && result.errors.name === VALIDATION_MESSAGES.name.required;
  });

  runTest('Invalid contact form: invalid email', () => {
    const result = validateContactForm({
      name: 'John Doe',
      email: 'invalid-email',
      message: 'Valid message',
    });
    return result.isValid === false && result.errors.email === VALIDATION_MESSAGES.email.invalid;
  });

  runTest('Invalid contact form: short message', () => {
    const result = validateContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hi',
    });
    return (
      result.isValid === false && result.errors.message === VALIDATION_MESSAGES.message.tooShort
    );
  });

  // Multiple errors
  runTest('Invalid contact form: multiple errors', () => {
    const result = validateContactForm({
      name: '',
      email: 'invalid',
      message: '',
    });
    return (
      result.isValid === false &&
      result.errors.name === VALIDATION_MESSAGES.name.required &&
      result.errors.email === VALIDATION_MESSAGES.email.invalid &&
      result.errors.message === VALIDATION_MESSAGES.message.required
    );
  });

  return true;
}

// Run all tests
export function runValidationTests(): void {
  console.log('🚀 Starting LOFERSIL Validation Tests\n');

  try {
    testValidateName();
    testValidateEmail();
    testValidatePhone();
    testValidateMessage();
    testValidateContactForm();

    console.log('\n🎉 All validation tests completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Run tests after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runValidationTests);
  } else {
    runValidationTests();
  }
}
