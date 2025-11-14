# MCP Server Management

## Connecting to MCP Server

To connect to an MCP server, follow these steps:

1. **Configure environment variables**:

   ```bash
   export CONTEXT7_MCP_URL="wss://your-mcp-server.com"
   export CONTEXT7_API_KEY="your-api-key"
   export CONTEXT7_API_TIMEOUT="60000"
   ```

2. **Activate the integration**:

   ```bash
   export ENABLE_MCP_INTEGRATION=true
   ```

3. **Initialize the MCP client**:

   ```typescript
   import { MCPFactory } from './mcp/index.js';

   const mcp = await MCPFactory.createContext7();
   await mcp.connect(); // Initiates health monitoring
   ```

## Configuring MCP

### Environment Variables

- `CONTEXT7_MCP_URL`: The MCP server URL (WebSocket or HTTP)
- `CONTEXT7_API_KEY`: API key for authentication
- `CONTEXT7_API_TIMEOUT`: Request timeout in milliseconds (default: 60000)
- `ENABLE_MCP_INTEGRATION`: Boolean flag to enable/disable MCP integration

### Security Configuration

- Ensure `.env` file is in `.gitignore`
- API keys should never be committed to version control
- Use secure key management for production deployments

### Testing Integration

1. **Verify connectivity**:
   - Check if the MCP server is reachable
   - Validate API key authentication

2. **Test basic operations**:
   - List available tools
   - Execute a simple tool
   - Check health metrics

### Advanced Configuration

- **Logging**: Configure structured logging levels
- **Health Monitoring**: Automatic health checks every 30 seconds
- **Circuit Breaker**: Protection against cascading failures
- **Performance**: Connection pooling and request deduplication
