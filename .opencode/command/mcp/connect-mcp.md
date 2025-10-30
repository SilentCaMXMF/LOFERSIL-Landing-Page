---
name: connect-mcp
agent: mcp-agent
description: Connect to a Model Context Protocol (MCP) server
---

You are the MCP connection specialist. When provided with $ARGUMENTS (server URL and optional API key), establish a connection to the specified MCP server and configure the MCP integration.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/mcp/mcp-patterns.md

## Connection Process:

**Step 1: Parse Connection Parameters**

- Extract server URL from $ARGUMENTS or configuration file
- Load configuration from file if `--config` specified
- Select server from config if `--server` specified
- Use environment-based configuration if `--env` specified
- Extract API key if provided, otherwise use environment variable
- Parse custom headers from `--headers` JSON
- Set timeout from `--timeout` parameter
- Validate URL format and accessibility

**Step 2: Environment Setup**

- Check for MCP_API_KEY environment variable
- Load MCPFactory configuration if config file specified
- Resolve environment variables for Context7 if `--env context7`
- Set custom headers from `--headers` parameter
- Configure timeout from `--timeout` parameter
- Set MCP_SERVER_URL if provided
- Validate API key format and permissions

**Step 3: Establish Connection**

- Initialize MCP client using MCPFactory.createFromConfig() or direct config
- Use MCPFactory.createContext7() for Context7 connections
- Attempt connection with specified timeout
- Handle authentication via headers and API keys
- Set up reconnection logic

**Step 4: Connection Validation**

- Test basic MCP protocol communication
- Verify tool availability
- Check resource access
- Confirm server capabilities

**Step 5: Integration Setup**

- Register MCP tools with OpenCode system
- Set up resource subscriptions if needed
- Configure error handling and logging
- Update connection status

## 📡 Connection Results

### 🔗 Server Details

- **URL**: [Server URL connected to]
- **Protocol Version**: [MCP protocol version]
- **Connection Status**: [Connected/Reconnecting/Failed]

### 🔧 Server Capabilities

- **Tools Available**: [Number of tools discovered]
- **Resources Available**: [Number of resources discovered]
- **Features Supported**: [List of supported MCP features]

### 🛠️ Tool Categories

- **File Operations**: [Tools for file manipulation]
- **System Tools**: [System interaction tools]
- **Development Tools**: [Code analysis and build tools]
- **Custom Tools**: [Project-specific tools]

### 📊 Resource Types

- **Configuration**: [Config resources available]
- **Data Sources**: [Database and API resources]
- **File System**: [File and directory resources]
- **System Resources**: [System information resources]

### ⚙️ Configuration Applied

- **Reconnection**: [Auto-reconnection settings]
- **Timeouts**: [Request and connection timeouts]
- **Caching**: [Tool and resource caching enabled]
- **Logging**: [Connection logging level]

## Usage Examples:

```
 /connect-mcp ws://localhost:3000
 /connect-mcp wss://api.example.com/mcp sk-abc123...
 /connect-mcp https://mcp-server.com --api-key env:MCP_API_KEY
 /connect-mcp --config mcp-config.json --server context7
 /connect-mcp --env context7
 /connect-mcp ws://localhost:3000 --headers '{"Authorization": "Bearer token"}' --timeout 30000
```

## Command Options:

- `--config <file>`: Load MCP configuration from JSON file (e.g., `mcp-config.json`)
- `--server <name>`: Connect to specific server defined in configuration file
- `--env <environment>`: Use environment variables for connection (e.g., `context7` for Context7)
- `--headers <json>`: Custom headers as JSON string for authentication
- `--timeout <ms>`: Connection timeout in milliseconds (default: 30000)
- `--api-key <key>`: API key for authentication (can also use env:MCP_API_KEY)

## Special Connection Commands

### `/mcp-connect-context7`

Quick connect to Context7 MCP server using environment variables.

**Usage:**

```
/mcp-connect-context7 [--timeout <ms>]
```

**Parameters:**

- `--timeout <ms>`: Override default timeout (optional)

**Process:**

1. Check for required Context7 environment variables
2. Use MCPFactory.createContext7() method
3. Establish connection with default or specified timeout
4. Validate connection and tool availability
5. Report connection status and available resources

**Required Environment Variables:**

- `CONTEXT7_MCP_URL`: Context7 MCP server URL
- `CONTEXT7_API_KEY`: API key for authentication
- `CONTEXT7_API_TIMEOUT`: Connection timeout (optional, default 60000ms)

**Example Output:**

```
🔗 Connecting to Context7 MCP Server...

Connection Details:
- URL: https://mcp.context7.com/mcp
- Authentication: Header (CONTEXT7_API_KEY)
- Timeout: 60000ms

✅ Connected successfully!

Server Capabilities:
- Protocol Version: 1.0
- Tools Available: 15
- Resources Available: 8
- Features: file-operations, code-analysis, context-search

Ready to use Context7 tools and resources.
```

## Error Handling:

### Connection Failures

- **Network Error**: Check server URL and network connectivity
- **Authentication Failed**: Verify API key validity
- **Protocol Mismatch**: Ensure MCP protocol version compatibility
- **Server Unavailable**: Check server status and retry later

### Configuration Issues

- **Invalid URL**: Provide properly formatted WebSocket/HTTP URL
- **Missing API Key**: Set MCP_API_KEY environment variable or use --api-key
- **Permission Denied**: Verify API key has required permissions
- **Config File Not Found**: Ensure configuration file exists and is valid JSON
- **Server Not in Config**: Verify server name exists in configuration file
- **Invalid Headers**: Ensure --headers contains valid JSON
- **Environment Not Supported**: Check if specified environment is configured

## Connection Monitoring:

Once connected, the MCP integration will:

- Monitor connection health
- Automatically reconnect on failures
- Log connection events and errors
- Provide connection status via `/mcp-status`

## Next Steps:

After successful connection:

1. Use `/mcp-tools` to explore available tools
2. Use `/mcp-resources` to discover resources
3. Execute tools with `/mcp-call <tool-name>`
4. Monitor connection with `/mcp-status`
