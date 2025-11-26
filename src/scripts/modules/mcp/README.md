# MCP (Model Context Protocol) Implementation

This directory contains a comprehensive implementation of the Model Context Protocol (MCP) for the LOFERSIL Landing Page project. MCP enables standardized communication between clients and servers for tool execution, resource access, and prompt generation.

## 🚀 Features

### Core Functionality

- **Complete MCP Protocol Implementation**: Full support for MCP 2024-11-05 specification
- **WebSocket Communication**: Robust WebSocket client with automatic reconnection
- **JSON-RPC 2.0 Protocol**: Standardized message format and request/response handling
- **Tool Management**: Discover, execute, and manage server tools
- **Resource Access**: Read and access server resources with caching
- **Prompt Generation**: Generate and manage prompts with arguments

### Advanced Features

- **Automatic Reconnection**: Exponential backoff with jitter for reliable connections
- **Performance Monitoring**: Built-in metrics collection and health checks
- **Comprehensive Error Handling**: Integration with ErrorManager for robust error recovery
- **Event-Driven Architecture**: Rich event system for real-time notifications
- **Security Features**: Rate limiting, input validation, and secure defaults
- **Caching System**: Intelligent caching for tools and resources
- **TypeScript Support**: Full type safety with strict mode

## 📁 File Structure

```
src/scripts/modules/mcp/
├── client.ts              # Main MCP client implementation
├── websocket-client.ts     # WebSocket client with reconnection logic
├── protocol.ts            # JSON-RPC 2.0 protocol layer
├── types.ts               # TypeScript type definitions
└── index.ts               # Main exports and utilities

tests/
├── unit/modules/mcp/       # Unit tests for MCP components
└── integration/           # Integration tests

examples/
└── mcp-client-usage.ts    # Usage examples and demonstrations
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ or modern browser with WebSocket support
- TypeScript 4.5+ for development
- ErrorManager and EnvironmentLoader modules

### Basic Setup

```typescript
import { MCPClient } from "./modules/mcp";
import { ErrorManager } from "./modules/ErrorManager";

// Create error handler
const errorHandler = new ErrorManager();

// Create MCP client
const client = new MCPClient(
  {
    serverUrl: "ws://localhost:3000",
    clientInfo: {
      name: "MyApp",
      version: "1.0.0",
    },
  },
  errorHandler,
);
```

### Configuration Options

```typescript
const config = {
  // Required
  serverUrl: "ws://localhost:3000",

  // Optional connection settings
  connectionTimeout: 30000,
  reconnection: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },

  // Client information
  clientInfo: {
    name: "MyApp",
    version: "1.0.0",
  },

  // Protocol capabilities
  capabilities: {
    experimental: {
      customFeatures: true,
    },
  },

  // Performance settings
  maxConcurrentRequests: 10,
  enableMonitoring: true,

  // Caching settings
  tools: {
    enableCaching: true,
    cacheTTL: 300000,
  },
  resources: {
    enableCaching: true,
    cacheTTL: 600000,
  },
};
```

## 📖 Usage Examples

### Basic Connection and Operations

```typescript
import { MCPClient } from "./modules/mcp";
import { ErrorManager } from "./modules/ErrorManager";

async function basicUsage() {
  const errorHandler = new ErrorManager();
  const client = new MCPClient(
    {
      serverUrl: "ws://localhost:3000",
      clientInfo: { name: "Example", version: "1.0.0" },
    },
    errorHandler,
  );

  try {
    // Connect to server
    await client.connect();

    // Initialize protocol
    const capabilities = await client.initialize();
    console.log("Server capabilities:", capabilities);

    // List available tools
    const tools = await client.listTools();
    console.log(
      "Available tools:",
      tools.map((t) => t.name),
    );

    // Execute a tool
    if (tools.length > 0) {
      const result = await client.callTool(tools[0].name, {
        param: "value",
      });
      console.log("Tool result:", result);
    }
  } finally {
    await client.destroy();
  }
}
```

### Event Handling

```typescript
// Set up event listeners
client.addEventListener(
  MCPClientEventType.CONNECTION_STATE_CHANGED,
  (event) => {
    console.log("Connection state changed:", event.data);
  },
);

client.addEventListener(MCPClientEventType.TOOL_CALLED, (event) => {
  console.log("Tool executed:", event.data);
});

client.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
  console.error("Error occurred:", event.data);
});
```

### Resource Management

```typescript
// List resources
const resources = await client.listResources();

// Read a resource
const content = await client.readResource("file://example.txt");
console.log("Resource content:", content.content);
```

### Prompt Generation

```typescript
// List prompts
const prompts = await client.listPrompts();

// Generate a prompt
const result = await client.getPrompt("summary", {
  text: "Long text to summarize...",
  style: "concise",
});
console.log("Generated prompt:", result.messages);
```

## 🔍 API Reference

### MCPClient Class

#### Connection Methods

- `connect()`: Connect to MCP server
- `disconnect()`: Disconnect from server
- `isConnected()`: Check connection status
- `getStatus()`: Get client status information

#### Protocol Methods

- `initialize()`: Initialize MCP protocol
- `listTools()`: Get available tools
- `callTool(name, args)`: Execute a tool
- `listResources()`: Get available resources
- `readResource(uri)`: Read a resource
- `listPrompts()`: Get available prompts
- `getPrompt(name, args)`: Generate a prompt

#### Utility Methods

- `getMetrics()`: Get performance metrics
- `performHealthCheck()`: Check client health
- `performDiagnostics()`: Run diagnostics
- `clearCaches()`: Clear all caches
- `destroy()`: Clean up and destroy client

### Configuration Types

#### MCPClientConfig

```typescript
interface MCPClientConfig {
  serverUrl: string;
  apiKey?: string;
  connectionTimeout?: number;
  reconnection?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  capabilities?: MCPCapabilities;
  clientInfo?: {
    name: string;
    version: string;
  };
  debug?: boolean;
}
```

#### Event Types

- `CONNECTION_STATE_CHANGED`: Connection state changes
- `MESSAGE_RECEIVED`: Incoming messages
- `MESSAGE_SENT`: Outgoing messages
- `ERROR_OCCURRED`: Error events
- `TOOL_CALLED`: Tool execution
- `RESOURCE_ACCESSED`: Resource access
- `PROMPT_GENERATED`: Prompt generation

## 🧪 Testing

### Running Tests

```bash
# Run all MCP tests
npm run test:unit -- tests/unit/modules/mcp

# Run with coverage
npm run test:coverage:unit

# Run integration tests
npm run test:integration
```

### Test Structure

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end functionality testing
- **Mock WebSocket**: Mocked WebSocket for isolated testing

## 📊 Performance & Monitoring

### Metrics Collection

The MCP client automatically collects performance metrics:

```typescript
const metrics = client.getMetrics();
console.log("Performance metrics:", {
  totalRequests: metrics.totalRequests,
  successfulRequests: metrics.successfulRequests,
  averageResponseTime: metrics.averageResponseTime,
  toolsCalled: metrics.toolsCalled,
  resourcesAccessed: metrics.resourcesAccessed,
});
```

### Health Monitoring

```typescript
const health = await client.performHealthCheck();
if (health.success) {
  console.log("Client is healthy:", health.data);
} else {
  console.error("Health issues detected:", health.error);
}
```

## 🔒 Security Features

### Input Validation

- All inputs are validated against JSON schemas
- Message size limits prevent DoS attacks
- Type safety prevents injection vulnerabilities

### Rate Limiting

- Configurable request rate limits
- Connection attempt rate limiting
- Automatic backoff on errors

### Secure Defaults

- WSS required in production
- Certificate validation enabled
- Private IP blocking in production

## 🚨 Error Handling

### Error Types

- `WebSocketError`: WebSocket-specific errors
- `ProtocolError`: JSON-RPC protocol errors
- `ValidationError`: Input validation errors
- `ConnectionError`: Connection-related errors

### Error Recovery

- Automatic reconnection with exponential backoff
- Circuit breaker pattern for failing services
- Graceful degradation on errors
- Comprehensive error logging

## 🔧 Advanced Configuration

### Custom Event Handling

```typescript
// Custom event middleware
client.addEventListener(MCPClientEventType.MESSAGE_RECEIVED, (event) => {
  // Custom logging
  console.log("Message received:", event.data);

  // Custom metrics
  trackMessageEvent(event.data);
});
```

### Performance Tuning

```typescript
const config = {
  // Increase concurrent requests for high-throughput scenarios
  maxConcurrentRequests: 20,

  // Enable aggressive caching for read-heavy workloads
  tools: {
    enableCaching: true,
    cacheTTL: 600000, // 10 minutes
  },
  resources: {
    enableCaching: true,
    cacheTTL: 1200000, // 20 minutes
  },

  // Optimize reconnection for unstable networks
  reconnection: {
    maxAttempts: 20,
    initialDelay: 500,
    maxDelay: 60000,
    backoffMultiplier: 1.5,
  },
};
```

## 🌍 Environment Variables

```bash
# MCP Configuration
MCP_SERVER_URL=ws://localhost:3000
MCP_API_KEY=your-api-key
ENABLE_MCP_INTEGRATION=true

# Environment-specific settings
NODE_ENV=production
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Include comprehensive JSDoc comments
- Write tests for all new features

### Contributing

1. Add tests for new functionality
2. Update documentation
3. Ensure all tests pass
4. Follow code review process

## 🐛 Troubleshooting

### Common Issues

#### Connection Failures

```typescript
// Check WebSocket URL
const diagnostics = await client.performDiagnostics();
console.log("URL valid:", diagnostics.data.urlValid);

// Check network connectivity
console.log("WebSocket supported:", typeof WebSocket !== "undefined");
```

#### Performance Issues

```typescript
// Monitor metrics
const metrics = client.getMetrics();
if (metrics.averageResponseTime > 1000) {
  console.warn("High response time detected");
}

// Check active requests
const status = client.getStatus();
if (status.activeRequests > 5) {
  console.warn("High request queue");
}
```

#### Memory Leaks

```typescript
// Always clean up
await client.destroy();

// Remove event listeners
client.removeEventListener(MCPClientEventType.ERROR_OCCURRED, handler);
```

## 📚 Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ErrorManager Documentation](./ErrorManager.md)

## 🤝 Support

For issues and questions:

1. Check existing documentation
2. Review test files for usage examples
3. Create an issue with detailed information
4. Include error logs and configuration

---

**Note**: This implementation follows the MCP 2024-11-05 specification and is designed to work with compliant MCP servers.
