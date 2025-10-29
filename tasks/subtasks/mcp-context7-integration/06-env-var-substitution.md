# 06. Implement Environment Variable Substitution

**Status**: Pending
**Priority**: Medium
**Assignee**: System
**Estimated Time**: 30 minutes

## Objective

Implement environment variable substitution logic for configuration files, allowing dynamic replacement of values like `${CONTEXT7_API_KEY}`.

## Requirements

### Substitution Logic

- Replace `${VAR_NAME}` with `process.env.VAR_NAME`
- Support default values: `${VAR_NAME:-default}`
- Handle missing environment variables gracefully
- Provide clear error messages for missing required vars

### Security Considerations

- Validate environment variable names
- Prevent code injection through variable names
- Mask sensitive values in logs and errors

## Implementation Details

### Substitution Function

```typescript
export function substituteEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return substituteInString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(substituteEnvVars);
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVars(value);
    }
    return result;
  }

  return obj;
}

function substituteInString(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, varExpr) => {
    const [varName, defaultValue] = varExpr.split(':-');
    const value = process.env[varName];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable '${varName}' is not set`);
    }

    return value;
  });
}
```

### Usage Examples

```typescript
// Configuration with variables
const config = {
  headers: {
    CONTEXT7_API_KEY: '${CONTEXT7_API_KEY}',
    TIMEOUT: '${API_TIMEOUT:-30000}',
  },
};

// After substitution
const resolved = substituteEnvVars(config);
// Result: { headers: { 'CONTEXT7_API_KEY': 'actual-key', 'TIMEOUT': '30000' } }
```

## Acceptance Criteria

### Substitution Tests

- [ ] Simple variable substitution works
- [ ] Default values work when variables missing
- [ ] Nested object substitution works
- [ ] Array substitution works

### Error Handling

- [ ] Missing required variables throw clear errors
- [ ] Invalid variable names are rejected
- [ ] Error messages include variable names

### Security

- [ ] Variable names are validated
- [ ] Sensitive values not logged
- [ ] No code injection possible

## Files to Create

- `.opencode/tool/mcp/env-substitution.ts`

## Dependencies

- Node.js process.env access
- String manipulation functions

## Testing

```bash
# Test substitution logic
npm test -- --testPathPattern=env-substitution

# Test with real environment variables
CONTEXT7_API_KEY=test-key npm test -- --testNamePattern=substitution

# Test error cases
npm test -- --testNamePattern=missing-vars
```

## Notes

- Consider caching substituted configurations
- Document variable syntax clearly
- Provide examples in documentation
- Handle both sync and async substitution if needed
