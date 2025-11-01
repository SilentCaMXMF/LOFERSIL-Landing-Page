/**
 * Contact Form Functionality Test
 * Tests the contact form validation and submission behavior
 */

// Test data
const testData = {
  valid: {
    name: 'João Silva',
    email: 'joao.silva@exemplo.com',
    message: 'Gostaria de saber mais sobre os produtos de papelaria disponíveis na vossa loja.',
  },
  invalid: {
    emptyName: {
      name: '',
      email: 'test@example.com',
      message: 'Esta é uma mensagem válida com mais de 10 caracteres.',
    },
    shortName: {
      name: 'A',
      email: 'test@example.com',
      message: 'Esta é uma mensagem válida com mais de 10 caracteres.',
    },
    invalidEmail: {
      name: 'João Silva',
      email: 'email-invalido',
      message: 'Esta é uma mensagem válida com mais de 10 caracteres.',
    },
    emptyMessage: {
      name: 'João Silva',
      email: 'joao.silva@exemplo.com',
      message: '',
    },
    shortMessage: {
      name: 'João Silva',
      email: 'joao.silva@exemplo.com',
      message: 'Curta',
    },
  },
};

/**
 * Test form validation
 */
function testFormValidation() {
  console.log('🧪 Testing Contact Form Validation...');

  // Test valid data
  console.log('✅ Testing valid form data...');
  const validForm = document.querySelector('#contact-form-element') as HTMLFormElement;
  if (validForm) {
    // Fill form with valid data
    (validForm.querySelector('[name="name"]') as HTMLInputElement).value = testData.valid.name;
    (validForm.querySelector('[name="email"]') as HTMLInputElement).value = testData.valid.email;
    (validForm.querySelector('[name="message"]') as HTMLTextAreaElement).value =
      testData.valid.message;

    // Trigger validation
    const submitEvent = new Event('submit', { cancelable: true });
    const result = validForm.dispatchEvent(submitEvent);

    console.log('Valid form submission:', result);
  }

  // Test invalid data
  console.log('❌ Testing invalid form data...');

  // Test empty name
  Object.entries(testData.invalid).forEach(([testName, data]) => {
    console.log(`Testing ${testName}...`);

    if (validForm) {
      // Clear form
      validForm.reset();

      // Fill with test data
      (validForm.querySelector('[name="name"]') as HTMLInputElement).value = data.name;
      (validForm.querySelector('[name="email"]') as HTMLInputElement).value = data.email;
      (validForm.querySelector('[name="message"]') as HTMLTextAreaElement).value = data.message;

      // Trigger blur events for validation
      (validForm.querySelector('[name="name"]') as HTMLInputElement).dispatchEvent(
        new Event('blur')
      );
      (validForm.querySelector('[name="email"]') as HTMLInputElement).dispatchEvent(
        new Event('blur')
      );
      (validForm.querySelector('[name="message"]') as HTMLTextAreaElement).dispatchEvent(
        new Event('blur')
      );

      // Check for error messages
      const nameError = document.querySelector('#name-error');
      const emailError = document.querySelector('#email-error');
      const messageError = document.querySelector('#message-error');

      console.log(`${testName} errors:`, {
        nameError: nameError?.textContent,
        emailError: emailError?.textContent,
        messageError: messageError?.textContent,
      });
    }
  });
}

/**
 * Test navigation to contact form
 */
function testNavigationToContactForm() {
  console.log('🧭 Testing navigation to contact form...');

  const contactoButton = document.querySelector('a[href="#contact-form"]');
  if (contactoButton) {
    console.log('✅ Contacto button found');

    // Test click
    contactoButton.addEventListener('click', e => {
      e.preventDefault();
      const contactSection = document.querySelector('#contact-form');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        console.log('✅ Navigation to contact form successful');
      } else {
        console.log('❌ Contact form section not found');
      }
    });
  } else {
    console.log('❌ Contacto button not found');
  }
}

/**
 * Test form accessibility
 */
function testFormAccessibility() {
  console.log('♿ Testing form accessibility...');

  const form = document.querySelector('#contact-form-element');
  if (form) {
    // Check for proper labels
    const labels = form.querySelectorAll('label');
    const inputs = form.querySelectorAll('input, textarea');

    console.log(`Found ${labels.length} labels and ${inputs.length} inputs`);

    // Check ARIA attributes
    const errorElements = form.querySelectorAll('[role="alert"]');
    console.log(`Found ${errorElements.length} ARIA alert elements`);

    // Check for required attributes
    const requiredFields = form.querySelectorAll('[required]');
    console.log(`Found ${requiredFields.length} required fields`);

    console.log('✅ Accessibility checks completed');
  } else {
    console.log('❌ Form not found for accessibility testing');
  }
}

/**
 * Run all tests when DOM is ready
 */
function runContactFormTests() {
  console.log('🚀 Starting Contact Form Tests...');

  // Wait a bit for the form to be initialized
  setTimeout(() => {
    testNavigationToContactForm();
    testFormAccessibility();
    testFormValidation();

    console.log('✅ Contact form tests completed');
  }, 1000);
}

// Export for use in main application
export { runContactFormTests };

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runContactFormTests);
  } else {
    runContactFormTests();
  }
}
