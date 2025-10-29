# 08. Add Configuration Validation and Error Handling

**Status**: Pending
**Priority**: Medium
**Assignee**: System
**Estimated Time**: 45 minutes

## Objective

Add comprehensive configuration validation and error handling for MCP configurations, ensuring robust error reporting and recovery.

## Requirements

### Validation Rules

- Required fields validation
- URL format validation
- Environment variable existence checks
- Type validation for configuration values
- Schema validation for configuration files

### Error Handling

- Clear, actionable error messages
- Validation error categorization
- Recovery suggestions
- Graceful degradation for partial failures

## Implementation Details

### Validation Schema

```typescript
const configSchema = {
  type: 'object',
  properties: {
    mcp: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          required: ['type', 'url', 'enabled'],
          properties: {
            type: { enum: ['remote', 'local'] },
            url: { type: 'string', format: 'uri' },
            headers: { type: 'object' },
            enabled: { type: 'boolean' },
            timeout: { type: 'number', minimum: 1000 },
            retry: {
              type: 'object',
              properties: {
                maxAttempts: { type: 'number', minimum: 1 },
                interval: { type: 'number', minimum: 100 },
              },
            },
          },
        },
      },
    },
  },
};
```

### Validation Function

```typescript
export function validateConfig(config: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic structure
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { valid: false, errors, warnings };
  }

  if (!config.mcp || typeof config.mcp !== 'object') {
    errors.push('Configuration must have an "mcp" property');
    return { valid: false, errors, warnings };
  }

  // Validate each server config
  for (const [name, serverConfig] of Object.entries(config.mcp)) {
    validateServerConfig(name, serverConfig, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

### Error Categories

- **Critical**: Missing required fields, invalid URLs
- **Warning**: Missing optional fields, deprecated syntax
- **Info**: Suggestions for optimization

## Acceptance Criteria

### Validation Coverage

- [ ] All required fields validated
- [ ] URL formats checked
- [ ] Environment variables verified
- [ ] Type safety enforced

### Error Messages

- [ ] Clear and actionable error messages
- [ ] Error categorization works
- [ ] Recovery suggestions provided
- [ ] No sensitive data in error messages

### Error Recovery

- [ ] Partial configuration loading
- [ ] Fallback to defaults
- [ ] Graceful degradation
- [ ] User-friendly error reporting

## Files to Create

- `.opencode/tool/mcp/validation.ts`

## Dependencies

- Configuration types from types.ts
- Environment variable checking
- URL validation utilities

## Testing

```bash
# Test validation logic
npm test -- --testPathPattern=validation

# Test error scenarios
npm test -- --testNamePattern=validation-errors

# Test recovery mechanisms
npm test -- --testNamePattern=validation-recovery
```

## Notes

- Consider using a validation library like Joi or Zod
- Provide both programmatic and user-friendly validation
- Include validation in configuration loading pipeline
- Document common validation errors and solutions
