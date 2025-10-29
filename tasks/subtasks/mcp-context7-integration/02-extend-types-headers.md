# 02. Extend MCP Types for Headers Support

**Status**: Pending
**Priority**: High
**Assignee**: System
**Estimated Time**: 30 minutes

## Objective

Extend the MCP type definitions to support custom headers, timeout configuration, and retry logic for the Context7 integration.

## Requirements

### Type Extensions Needed

- Add `headers` field to `MCPClientConfig`
- Add `timeout` field to `MCPClientConfig`
- Create `MCPConfig` interface for configuration file structure
- Create `MCPConfigFile` interface for root configuration
- Add retry configuration types

### Backward Compatibility

- Keep existing fields optional or with defaults
- Ensure existing code continues to work
- Provide migration path for old configurations

## Implementation Details

### New Type Definitions

```typescript
export interface MCPClientConfig {
  serverUrl: string;
  apiKey?: string; // Made optional when using headers
  clientId?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  headers?: Record<string, string>; // NEW
  timeout?: number; // NEW
}

export interface MCPConfig {
  name: string;
  type: 'remote' | 'local';
  url: string;
  headers: Record<string, string>;
  enabled: boolean;
  timeout: number;
  retry: {
    maxAttempts: number;
    interval: number;
  };
}

export interface MCPConfigFile {
  mcp: Record<string, MCPConfig>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## Acceptance Criteria

### Type Safety

- [ ] All new interfaces compile without errors
- [ ] Existing interfaces remain unchanged
- [ ] Optional fields work correctly
- [ ] TypeScript strict mode compliance

### Backward Compatibility

- [ ] Existing MCPClientConfig usage still works
- [ ] No breaking changes to current API
- [ ] Default values provided for new fields

### Documentation

- [ ] JSDoc comments for all new types
- [ ] Usage examples in comments
- [ ] Migration notes for existing code

## Files to Modify

- `.opencode/tool/mcp/types.ts`

## Testing

```bash
# Type checking
npm run typecheck

# Test new interfaces
npm test -- --testPathPattern=types
```

## Notes

- Keep changes minimal and focused
- Document any breaking changes (though none expected)
- Consider future extensibility in type design
