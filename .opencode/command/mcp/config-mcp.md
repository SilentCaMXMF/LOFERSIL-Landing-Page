---
description: Manage MCP server configurations
---

# MCP Configuration Management

You are the MCP configuration specialist. Handle loading, validating, and managing MCP server configurations from files and environment variables.

## Commands Overview

### `/mcp-config-load`

Load and validate an MCP configuration file.

**Usage:**

```
/mcp-config-load <config-file> [--validate-only]
```

**Parameters:**

- `config-file`: Path to JSON configuration file (e.g., `mcp-config.json`)
- `--validate-only`: Only validate configuration without loading servers

**Process:**

1. Parse and validate JSON configuration file
2. Check for required fields and data types
3. Validate server URLs and headers
4. Substitute environment variables
5. Report validation results and any errors
6. Load servers into MCP system if validation passes

**Example Output:**

```
✅ Configuration loaded successfully from mcp-config.json

Validation Results:
- Servers found: 2 (context7, local-dev)
- Environment variables resolved: 3
- Warnings: 0
- Errors: 0

Loaded Servers:
- context7: https://mcp.context7.com/mcp (enabled)
- local-dev: ws://localhost:3000 (disabled)
```

### `/mcp-config-list`

List available MCP configurations and their connection status.

**Usage:**

```
/mcp-config-list [--status] [--config <file>]
```

**Parameters:**

- `--status`: Include current connection status for each server
- `--config <file>`: Load from specific configuration file

**Process:**

1. Load configuration from specified or default file
2. Display all configured servers
3. Show connection status if requested
4. Include server details (URL, headers, timeout)
5. Indicate which servers are currently connected

**Example Output:**

```
MCP Server Configurations:

1. context7
   - URL: https://mcp.context7.com/mcp
   - Status: Connected ✅
   - Headers: CONTEXT7_API_KEY (env var)
   - Timeout: 60000ms
   - Tools: 15 available
   - Resources: 8 available

2. local-dev
   - URL: ws://localhost:3000
   - Status: Disconnected ❌
   - Headers: None
   - Timeout: 30000ms
   - Tools: Unknown
   - Resources: Unknown

Configuration Source: mcp-config.json
Last Updated: 2025-10-29 12:00:00
```

## Configuration File Format

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      },
      "timeout": 60000,
      "enabled": true
    },
    "local-dev": {
      "type": "websocket",
      "url": "ws://localhost:3000",
      "headers": {},
      "timeout": 30000,
      "enabled": false
    }
  }
}
```

## Error Handling

### Configuration Errors

- **File Not Found**: Configuration file does not exist
- **Invalid JSON**: Configuration file contains syntax errors
- **Missing Required Fields**: Server configuration missing required fields
- **Invalid URL**: Server URL is malformed
- **Environment Variable Missing**: Referenced env var not set

### Connection Errors

- **Network Failure**: Cannot reach MCP server
- **Authentication Failed**: Invalid API key or headers
- **Protocol Mismatch**: Server uses incompatible MCP version
- **Timeout**: Connection attempt exceeded timeout limit

## Integration Notes

- All commands integrate with MCPFactory for consistent configuration handling
- Maintains backward compatibility with existing MCP connections
- Supports environment variable substitution in configuration files
- Provides comprehensive error messages and validation feedback
- Commands work with both JSON configuration files and environment variables
