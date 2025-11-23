# 01. Extract common API call and response parsing logic into reusable helpers

meta:
id: improve-gemini-tool-01
feature: improve-gemini-tool
priority: P2
depends_on: []
tags: [refactoring, api-helpers]

objective:

- Extract repeated API call and response parsing code into reusable helper functions to reduce duplication and improve maintainability

deliverables:

- New helper functions for API requests and response parsing
- Updated generateImage, editImage, and analyzeImage to use helpers
- Constants for API endpoints

steps:

- Identify common patterns in API calls (e.g., fetch setup, error handling, response parsing)
- Create helper function for making API requests with error handling
- Create helper for parsing Gemini API responses for image data
- Create helper for parsing text responses
- Update existing functions to use the new helpers
- Add constants for API URLs to avoid magic strings

tests:

- Unit: Test helper functions for API requests and parsing with mock responses
- Integration: Verify that generateImage, editImage, and analyzeImage still work correctly after refactoring

acceptance_criteria:

- No duplication of API call logic across functions
- All API responses are parsed consistently
- Functions pass existing tests or mock scenarios
- Code is more readable and maintainable

validation:

- Run linting to ensure no syntax errors
- Test in development mode to verify functionality

notes:

- Ensure helpers handle both image and text responses
- Reference Gemini API documentation for response structures
