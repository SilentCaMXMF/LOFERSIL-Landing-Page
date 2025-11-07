# 02. Integrate Validation Messages with TranslationManager

meta:
id: improve-contact-form-accessibility-ux-02
feature: improve-contact-form-accessibility-ux
priority: P2
depends_on: [improve-contact-form-accessibility-ux-01]
tags: [localization, i18n, validation, frontend]

objective:

- Replace hardcoded Portuguese validation messages with TranslationManager integration
- Ensure consistent localization across all form validation feedback
- Add form-specific translation keys to pt.json

deliverables:

- Updated ContactFormManager to use TranslationManager for messages
- Extended pt.json with form validation keys
- Consistent message formatting and tone

steps:

- Extract all hardcoded validation messages from ContactFormManager.ts
- Add form validation keys to locales/pt.json
- Modify ContactFormManager to accept TranslationManager instance
- Update validation.ts to support localized messages
- Test message loading and fallback behavior

tests:

- Unit: Verify TranslationManager integration works
- Integration: Test form validation with different locales
- E2e: Ensure messages display correctly in form

acceptance_criteria:

- All validation messages use TranslationManager
- Fallback to English if Portuguese translations fail
- Message keys follow consistent naming convention
- No hardcoded Portuguese strings in form code

validation:

- Load form with Portuguese locale and verify messages
- Test with missing translation keys (fallback behavior)
- Check console for any translation loading errors

notes:

- Form messages should match existing LOFERSIL tone (professional, helpful)
- Consider adding success/error message translations
- Ensure compatibility with existing translation loading</content>
<parameter name="filePath">tasks/subtasks/improve-contact-form-accessibility-ux/02-integrate-validation-localization.md