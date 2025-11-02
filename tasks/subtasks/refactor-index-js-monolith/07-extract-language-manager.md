# 07. Extract Translation Manager

meta:
id: refactor-index-js-monolith-07
feature: refactor-index-js-monolith
priority: P2
depends_on: [refactor-index-js-monolith-03]
tags: [modularization, i18n, translations]

objective:

- Extract translation loading and application logic into a dedicated TranslationManager module
- Simplify for single language (Portuguese) usage
- Separate translation management from main application logic
- Create a clean API for translation handling

deliverables:

- New src/scripts/modules/TranslationManager.ts class
- Methods for translation loading and UI updates
- Integration with main application class

steps:

- Create src/scripts/modules/TranslationManager.ts
- Extract loadTranslations method (simplified for Portuguese only)
- Extract applyTranslations method
- Extract getNestedTranslation method
- Extract updateMetaTagsForLanguage method (adapted for Portuguese)
- Extract setupHreflangTags method (adapted for Portuguese)
- Create proper constructor and initialization
- Update index.ts to use TranslationManager instance
- Remove language switching related code from main class

tests:

- Unit: Translations load and apply properly
- Integration: UI updates with Portuguese translations
- Unit: Translation helper functions work correctly

acceptance_criteria:

- TranslationManager.ts class created with translation functionality
- Portuguese translations load from JSON files
- UI updates reflect translation changes
- Hreflang tags are set for Portuguese
- No translation-related code remains in main class

validation:

- Page content displays in Portuguese
- Translations load correctly on page initialization
- Meta tags are set appropriately for Portuguese
- No language switching functionality remains

notes:

- Keep translation manager independent of other concerns
- Handle translation loading errors gracefully
- Simplified for single language usage
- Consider caching translations for performance
