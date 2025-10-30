# 02. Setup OpenAI API client and authentication

meta:
id: add-openai-image-specialist-02
feature: add-openai-image-specialist
priority: P2
depends_on: [add-openai-image-specialist-01]
tags: [implementation, api-setup]

objective:

- Establish secure OpenAI API client configuration and authentication

deliverables:

- OpenAI API client module with proper authentication
- Environment variable setup for API keys
- Error handling for API authentication failures

steps:

- Install OpenAI SDK if not already available (npm install openai)
- Create API client configuration module
- Implement secure API key loading from environment variables
- Add authentication validation and error handling
- Test API connection with a simple request

implementation_details:

- **OpenAIClient Module**: Created `src/scripts/modules/OpenAIClient.ts` with full API client functionality
- **Environment Loading**: Created `EnvironmentLoader.ts` for secure environment variable management
- **API Methods**: Implemented generateImage, editImage, createImageVariations, and createChatCompletion
- **Authentication**: Bearer token authentication with API key validation
- **Error Handling**: Comprehensive error handling with retry logic and user-friendly messages
- **Dependencies**: Added `openai: ^4.0.0` to package.json
- **Environment Variables**: Added OPENAI_API_KEY to .env.example

tests:

- Unit: Test API client initialization with valid/invalid keys
- Integration/e2e: Verify API connectivity and authentication

acceptance_criteria:

- OpenAI API client can be initialized successfully with valid API key
- Authentication errors are handled gracefully
- API key is loaded securely from environment variables

validation:

- Run test script to verify API client initialization
- Check that authentication works with valid API key
- Confirm error handling for invalid keys

notes:

- Use OPENAI_API_KEY environment variable
- Follow existing project patterns for API client setup
- Ensure API key is not logged or exposed in code
