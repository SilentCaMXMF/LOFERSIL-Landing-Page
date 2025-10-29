# 10. Update MCP Documentation

**Status**: Pending
**Priority**: Low
**Assignee**: System
**Estimated Time**: 30 minutes

## Objective

Update the MCP agent and context documentation to reflect the new configuration capabilities and Context7 integration.

## Requirements

### Documentation Updates

- Update MCP agent with configuration file support
- Document new command options and usage
- Add Context7-specific examples
- Include troubleshooting guides

### Content Areas

- Agent capabilities and commands
- Configuration file formats
- Environment variable usage
- Error handling and recovery

## Implementation Details

### Agent Documentation Updates

Update `.opencode/agent/mcp-agent.md` with:

- Configuration file loading capabilities
- Context7-specific connection methods
- New command syntax and options
- Error handling improvements

### Context Documentation Updates

Update `.opencode/context/mcp/` files with:

- Configuration patterns and examples
- Environment variable substitution
- Context7 integration examples
- Best practices for configuration

### New Documentation Sections

````markdown
## Configuration File Support

The MCP agent now supports loading configurations from JSON files:

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      },
      "enabled": true
    }
  }
}
```
````

## Context7 Integration

For Context7 MCP server integration:

```bash
# Quick connect using environment variables
/mcp-connect-context7

# Load from configuration file
/connect-mcp --config mcp-config.json --server context7
```

## Environment Variables

The following environment variables are supported:

- `CONTEXT7_API_KEY`: API key for Context7 authentication
- `CONTEXT7_MCP_URL`: MCP server URL for Context7
- `CONTEXT7_API_TIMEOUT`: Request timeout in milliseconds

````

## Acceptance Criteria

### Documentation Completeness
- [ ] All new features documented
- [ ] Configuration examples provided
- [ ] Command usage documented
- [ ] Troubleshooting guides included

### Accuracy
- [ ] Examples work as documented
- [ ] Command syntax is correct
- [ ] Error messages match implementation

### User-Friendly
- [ ] Clear explanations provided
- [ ] Step-by-step instructions
- [ ] Common issues addressed

## Files to Modify
- `.opencode/agent/mcp-agent.md`
- `.opencode/context/mcp/mcp-patterns.md`
- `.opencode/context/mcp/tool-definitions.md`
- `.opencode/context/mcp/resource-patterns.md`

## Dependencies
- All implementation tasks completed
- Configuration examples tested
- Command functionality verified

## Testing
```bash
# Test documentation examples
npm test -- --testPathPattern=documentation

# Validate command examples
npm test -- --testNamePattern=command-examples

# Check documentation links
npm run docs:validate
````

## Notes

- Keep documentation in sync with implementation
- Provide both beginner and advanced usage examples
- Include migration guide for existing users
- Consider creating separate troubleshooting document
