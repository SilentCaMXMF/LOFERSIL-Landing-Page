# Task 02: Fix Contact Form Testing

## Overview

Resolve the specific contact form test failures that stem from DOM infrastructure issues and form validation logic problems. This task ensures all 7 failing contact form tests pass by fixing element access, validation logic, and form submission handling.

## Scope

- Fix 7 failing tests in `tests/unit/core/contact-form.test.ts`
- Resolve form validation testing issues
- Fix form submission mock handling
- Ensure proper element property access

## Files to Modify

- `tests/unit/core/contact-form.test.ts` - Main contact form test file
- `src/scripts/modules/ContactFormManager.ts` - Contact form implementation (if needed)
- `tests/fixtures/mocks/contact-form-mocks.ts` - Contact form mock data

## Implementation Steps

### Step 1: Analyze Current Contact Form Test Failures

Examine the specific failure patterns in contact form tests.

**Location**: `tests/unit/core/contact-form.test.ts`
**Complexity**: Medium
**Prerequisites**: Task 01 (DOM Infrastructure)

**Implementation Details**:

- Review all 7 failing test cases
- Identify common failure patterns
- Note specific error messages
- Map failures to root causes

### Step 2: Fix Form Element Access Patterns

Update tests to properly access form elements after DOM fixes.

**Location**: `tests/unit/core/contact-form.test.ts`
**Complexity**: High
**Prerequisites**: Step 1

**Implementation Details**:

- Update element selectors to match new DOM structure
- Fix form property access (innerHTML, value, etc.)
- Ensure elements exist before property access
- Add proper null/undefined checks

```typescript
// Example of what needs to be fixed
describe("Contact Form Validation", () => {
  let form: HTMLFormElement;
  let nameInput: HTMLInputElement;
  let emailInput: HTMLInputElement;
  let messageTextarea: HTMLTextAreaElement;

  beforeEach(() => {
    // Get elements properly after DOM setup
    form = document.getElementById("contactForm") as HTMLFormElement;
    nameInput = document.getElementById("name") as HTMLInputElement;
    emailInput = document.getElementById("email") as HTMLInputElement;
    messageTextarea = document.getElementById("message") as HTMLTextAreaElement;

    // Ensure elements exist
    expect(form).toBeTruthy();
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(messageTextarea).toBeTruthy();
  });
});
```

### Step 3: Fix Form Validation Testing

Update validation test logic to work with corrected form structure.

**Location**: `tests/unit/core/contact-form.test.ts`
**Complexity**: High
**Prerequisites**: Step 2

**Implementation Details**:

- Fix validation rule testing
- Update error message expectations
- Ensure proper async handling for validation
- Fix form validity checks

### Step 4: Fix Form Submission Mocks

Update mock handlers for form submission testing.

**Location**: `tests/unit/core/contact-form.test.ts` and related mock files
**Complexity**: High
**Prerequisites**: Step 3

**Implementation Details**:

- Update fetch/API call mocks
- Fix response handling expectations
- Ensure proper error simulation
- Add timeout handling for async operations

### Step 5: Fix Event Listener Testing

Update tests that verify event listener behavior.

**Location**: `tests/unit/core/contact-form.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 4

**Implementation Details**:

- Fix event simulation logic
- Update event handler expectations
- Ensure proper event propagation
- Fix custom event testing

### Step 6: Fix Accessibility Testing

Update accessibility-related test assertions.

**Location**: `tests/unit/core/contact-form.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 5

**Implementation Details**:

- Fix ARIA attribute testing
- Update screen reader expectations
- Ensure proper focus management
- Fix keyboard navigation tests

### Step 7: Add Robust Test Helpers

Create helper functions to reduce test code duplication and improve reliability.

**Location**: `tests/unit/core/contact-form.test.ts`
**Complexity**: Low
**Prerequisites**: Step 6

**Implementation Details**:

- Create form filling helpers
- Add validation check utilities
- Create mock response helpers
- Implement element wait helpers

## Testing Requirements

- All 7 contact form tests must pass
- Tests must be deterministic (no flaky behavior)
- Proper async handling throughout
- Complete validation coverage
- Mock data must be realistic

## Validation Commands

```bash
# Run contact form tests specifically
npm run test -- tests/unit/core/contact-form.test.ts

# Run with coverage for contact form
npm run test:coverage -- tests/unit/core/contact-form.test.ts

# Run all core tests to ensure no regressions
npm run test -- tests/unit/core/
```

## Success Criteria

- [ ] All 7 contact form tests pass (0 failures)
- [ ] No "Cannot set properties of undefined" errors
- [ ] Form validation logic properly tested
- [ ] Form submission mocking works correctly
- [ ] Event listener testing is reliable
- [ ] Accessibility testing passes
- [ ] Tests are deterministic and non-flaky

## Dependencies

- Task 01: Fix DOM Infrastructure Setup (must be completed first)

## Estimated Time

3-4 hours

## Risk Assessment

- **Low Risk**: Changes isolated to test files
- **Medium Impact**: Critical business functionality testing
- **Rollback Strategy**: Simple to revert test changes

## Notes

The contact form is a critical business feature, so ensuring comprehensive test coverage is essential. These fixes will also serve as a template for other form-related test fixes.

## Specific Test Cases to Fix

Based on the failing tests report, focus on these common patterns:

1. **Element Property Access**: Tests that set innerHTML or other properties
2. **Form Validation**: Tests that check form validity and error states
3. **Submission Handling**: Tests that mock form submission and API calls
4. **Event Handling**: Tests that verify event listeners and custom events
5. **Accessibility**: Tests that check ARIA attributes and screen reader support
