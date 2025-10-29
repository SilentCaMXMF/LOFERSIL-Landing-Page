# 01. Create MCP Configuration Loader

**Status**: Pending
**Priority**: High
**Assignee**: System
**Estimated Time**: 45 minutes

## Objective

Create a configuration loader that can parse JSON configuration files and handle environment variable substitution for MCP server configurations.

## Requirements

### Functional Requirements

- Parse JSON configuration files with MCP server definitions
- Support environment variable substitution (e.g., `${CONTEXT7_API_KEY}`)
- Validate configuration structure and required fields
- Provide error messages for invalid configurations
- Support multiple MCP server configurations

### Technical Requirements

- TypeScript implementation with proper type safety
- Environment variable access with fallback handling
- JSON schema validation
- Error handling for missing files or invalid JSON

## Implementation Details

### Configuration File Format

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      },
      "enabled": true,
      "timeout": 30000,
      "retry": {
        "maxAttempts": 5,
        "interval": 5000
      }
    }
  }
}
```

### Core Functions

- `loadConfig(filePath: string): MCPConfigFile`
- `validateConfig(config: MCPConfigFile): ValidationResult`
- `substituteEnvVars(config: MCPConfigFile): MCPConfigFile`
- `resolveServerConfig(serverName: string, config: MCPConfigFile): MCPClientConfig`

## Acceptance Criteria

### Functional Tests

- [ ] Loads valid JSON configuration file
- [ ] Substitutes environment variables correctly
- [ ] Validates required fields
- [ ] Handles missing environment variables gracefully
- [ ] Supports multiple server configurations

### Error Handling

- [ ] Invalid JSON format throws descriptive error
- [ ] Missing required fields throw validation errors
- [ ] Missing environment variables provide helpful messages
- [ ] File not found errors are handled appropriately

### Type Safety

- [ ] All functions have proper TypeScript types
- [ ] Configuration interfaces match implementation
- [ ] Error types are properly defined

## Files to Create

- `.opencode/tool/mcp/config-loader.ts`

## Dependencies

- MCP types from `types.ts`
- Node.js `fs` and `path` modules
- Environment variable access

## Testing

```bash
# Test configuration loading
npm test -- --testPathPattern=config-loader

# Test environment substitution
CONTEXT7_API_KEY=test-key npm test -- --testNamePattern=substitute
```

## Notes

- Follow existing code style and patterns
- Include comprehensive JSDoc comments
- Handle both sync and async operations appropriately
- Consider caching parsed configurations for performance
