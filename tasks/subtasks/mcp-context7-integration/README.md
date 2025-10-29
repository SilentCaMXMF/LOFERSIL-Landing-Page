# MCP Context7 Integration

**Objective**: Integrate Context7 MCP server configuration into the existing OpenCode MCP system

**Status**: Ready for Implementation
**Priority**: High
**Estimated Duration**: 4-6 hours

## Overview

This task integrates the Context7 MCP configuration into the existing OpenCode MCP infrastructure. The goal is to enable seamless connection to Context7's MCP server using the provided configuration format while maintaining backward compatibility with the existing generic MCP setup.

## Configuration Target

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      },
      "enabled": true
    }
  }
}
```

## Task Breakdown

Status legend: [ ] pending, [~] in-progress, [x] completed

### Foundation Tasks

- [ ] 01-config-loader-creation.md - Create MCP configuration loader
- [ ] 02-extend-types-headers.md - Extend types for headers support
- [ ] 03-update-client-headers.md - Update MCPClient for custom headers
- [ ] 04-test-context7-connection.md - Test Context7 MCP connection

### Integration Tasks

- [ ] 05-create-mcp-factory.md - Create MCPFactory with config loading
- [ ] 06-env-var-substitution.md - Implement environment variable substitution
- [ ] 07-update-mcp-commands.md - Update MCP commands for config support
- [ ] 08-add-validation-error-handling.md - Add configuration validation

### Polish Tasks

- [ ] 09-create-config-file.md - Create mcp-config.json file
- [ ] 10-update-documentation.md - Update MCP documentation

**All task files have been created and are ready for implementation.**

## Dependencies

- Existing MCP infrastructure (completed)
- Context7 API credentials in .env
- Node.js environment with TypeScript support

## Success Criteria

- [ ] Context7 MCP server connects successfully
- [ ] Authentication works via headers
- [ ] Tools and resources are accessible
- [ ] Configuration is loaded from JSON files
- [ ] Environment variables are properly substituted
- [ ] Error handling is comprehensive
- [ ] Backward compatibility maintained

## Files to Create/Modify

### New Files

- `.opencode/tool/mcp/config-loader.ts`
- `mcp-config.json`
- Task files in this directory

### Modified Files

- `.opencode/tool/mcp/types.ts`
- `.opencode/tool/mcp/client.ts`
- `.opencode/tool/mcp/index.ts`
- `.opencode/command/mcp/*.md`
- `.opencode/agent/mcp-agent.md`
- `.opencode/context/mcp/*.md`

## Testing Strategy

1. Unit tests for configuration loading
2. Integration tests for Context7 connection
3. End-to-end tests for tool execution
4. Error handling validation
5. Performance and reliability testing

## Risk Assessment

**Low Risk**: Configuration system is additive, doesn't break existing functionality
**Medium Risk**: Header authentication might require protocol adjustments
**High Risk**: Context7-specific integration might need server-specific handling

## Rollback Plan

If integration fails:

1. Disable Context7 configuration
2. Revert to generic MCP setup
3. Remove configuration files
4. Restore original command documentation
