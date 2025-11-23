# 03. Add Environment Variable Validation on Startup

meta:
id: opencode-integration-completion-03
feature: opencode-integration-completion
priority: P2
depends_on: []
tags: [implementation]

objective:

- Add validation for required environment variables on application startup

deliverables:

- New environment validation utility in .opencode/tool/env/
- Integration into main application startup

steps:

- Create validation utility for GEMINI_API_KEY and other critical vars
- Add startup check in main application
- Provide clear error messages for missing variables

tests:

- Unit: Validation function tests
- Integration: Startup fails gracefully with missing vars

acceptance_criteria:

- Application fails to start with missing required environment variables
- Clear error messages indicate which variables are missing

validation:

- Start application with missing env vars

notes:

- Critical variables: GEMINI_API_KEY, etc.
