# 07. Update MCP Commands for Config Support

**Status**: Pending
**Priority**: Medium
**Assignee**: System
**Estimated Time**: 45 minutes

## Objective

Update the MCP slash commands to support configuration files and Context7-specific initialization options.

## Requirements

### Command Enhancements

- Add configuration file loading to `/connect-mcp`
- Support Context7-specific connection options
- Update `/mcp-status` to show configuration sources
- Add new commands for configuration management

### New Commands

- `/mcp-config-load <file>` - Load MCP configuration from file
- `/mcp-config-list` - List available MCP configurations
- `/mcp-connect-context7` - Quick connect to Context7

## Implementation Details

### Enhanced Connect Command

```markdown
# /connect-mcp

## Usage

/connect-mcp <server-url> [options]
/connect-mcp --config <config-file> --server <server-name>
/connect-mcp --env context7

## Options

- `--config <file>`: Load configuration from JSON file
- `--server <name>`: Connect to specific server from config
- `--env <name>`: Use environment variables for server
- `--headers <json>`: Custom headers for connection
- `--timeout <ms>`: Connection timeout
```

### New Config Commands

```markdown
# /mcp-config-load

Load and validate MCP configuration file

# /mcp-config-list

List configured MCP servers and their status

# /mcp-connect-context7

Quick connect to Context7 using environment variables
```

### Status Enhancement

```markdown
# /mcp-status

Show MCP connection status and configuration info

## Output

- Connected servers and their sources (config file, env vars)
- Authentication methods used
- Connection health and latency
- Available tools and resources count
```

## Acceptance Criteria

### Command Functionality

- [ ] Configuration file loading works
- [ ] Context7 quick connect works
- [ ] Status shows configuration sources
- [ ] Error messages are helpful

### User Experience

- [ ] Commands are intuitive to use
- [ ] Help text is comprehensive
- [ ] Error recovery is clear
- [ ] Backward compatibility maintained

### Integration

- [ ] Works with new factory methods
- [ ] Supports multiple server configurations
- [ ] Configuration validation integrated

## Files to Modify

- `.opencode/command/mcp/connect-mcp.md`
- `.opencode/command/mcp/list-tools.md`
- `.opencode/command/mcp/execute-tool.md`
- `.opencode/command/mcp/manage-resources.md`

## Files to Create

- `.opencode/command/mcp/config-mcp.md`

## Dependencies

- MCPFactory from task 05
- Configuration loader from task 01
- Extended types from task 02

## Testing

```bash
# Test command parsing
npm test -- --testPathPattern=commands

# Test configuration loading
npm test -- --testNamePattern=config-commands

# Manual testing
/connect-mcp --help
/mcp-config-list
```

## Notes

- Maintain existing command syntax where possible
- Provide migration guide for old usage
- Consider command aliases for common operations
- Document all new options and parameters
