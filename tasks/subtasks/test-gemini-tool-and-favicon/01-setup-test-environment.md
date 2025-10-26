# 01. Set up test environment for Gemini tool

meta:
id: test-gemini-tool-and-favicon-01
feature: test-gemini-tool-and-favicon
priority: P1
depends_on: []
tags: [setup, testing]

objective:

- Set up environment variables and dependencies for testing the Gemini tool

deliverables:

- .env file with GEMINI_API_KEY
- Test mode enabled in Gemini tool
- Verification that tool can be imported and executed

steps:

- Check if .env.example exists and copy to .env
- Add GEMINI_API_KEY to .env (use a test key or placeholder)
- Set GEMINI_TEST_MODE=true in .env
- Verify imports in the Gemini tool file
- Run a basic import test

tests:

- Unit: Verify getApiKey function returns the key
- Integration/e2e: Import the tool and check if it loads without errors

acceptance_criteria:

- .env file is created with required variables
- Tool can be imported without TypeScript errors
- Test mode is active

validation:

- Run: node -e "import('./.opencode/tool/gemini/index.js').then(m => console.log('Import successful'))"
- Check: No errors in console

notes:

- Ensure API key is valid for tests
- Use test mode to avoid actual API calls
