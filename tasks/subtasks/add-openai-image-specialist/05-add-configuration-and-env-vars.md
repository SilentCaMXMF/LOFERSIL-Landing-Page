# 05. Add configuration and environment variables

meta:
id: add-openai-image-specialist-05
feature: add-openai-image-specialist
priority: P2
depends_on: [add-openai-image-specialist-04]
tags: [configuration, environment]

objective:

- Configure the image specialist with proper settings and environment variables

deliverables:

- Configuration module for image specialist settings
- Updated environment variable templates
- Default configuration values

steps:

- Create configuration interface and defaults
- Add OpenAI-specific settings (model, size limits, etc.)
- Update .env.example with required variables
- Implement configuration loading and validation
- Add configuration to main module exports

implementation_details:

- **Environment Variables**: Added OPENAI_API_KEY to .env.example
- **EnvironmentLoader**: Created secure environment variable loading utility
- **Configuration Interface**: ImageSpecialistConfig with flexible settings
- **Default Values**: Sensible defaults for all configuration options
- **Validation**: Environment variable validation with clear error messages
- **Integration**: Seamless integration with existing project patterns

tests:

- Unit: Test configuration loading with valid/invalid values
- Integration/e2e: Verify configuration is applied correctly

acceptance_criteria:

- Configuration can be loaded from environment variables
- Default values are provided for optional settings
- Invalid configuration values are rejected with clear errors

validation:

- Load configuration with test environment variables
- Verify default values are used when variables are missing
- Test configuration validation with invalid inputs

notes:

- Include settings for image sizes, quality, and API parameters
- Follow existing configuration patterns in the project
- Document all configuration options
