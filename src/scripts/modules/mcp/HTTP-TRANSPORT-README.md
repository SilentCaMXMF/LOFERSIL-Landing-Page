# HTTP Transport Implementation for Context7 MCP

This document provides a comprehensive overview of the HTTP transport layer implementation for the MCP (Model Context Protocol) client to communicate with Context7.

## Overview

The HTTP transport layer enables MCP protocol communication over HTTP using the fetch API, specifically designed for integration with Context7's MCP endpoint. This implementation provides a robust, feature-rich alternative to WebSocket-based MCP communication.

## Architecture

### Core Components

1. **Transport Interface** (`transport-interface.ts`)
   - Common interface for all MCP transports
   - Defines the contract that both WebSocket and HTTP transports must implement
   - Provides unified API for different transport mechanisms

2. **HTTP Transport** (`http-transport.ts`)
   - Complete HTTP implementation of the transport interface
   - Uses fetch API for HTTP requests
   - Supports Context7 API key authentication
   - Implements retry logic with exponential backoff

3. **Extended Types** (`types.ts`)
   - HTTP-specific configuration types
   - Context7 configuration interfaces
   - Validation functions for HTTP transport settings

## Features

### ✅ Core Functionality

- [x] JSON-RPC 2.0 protocol over HTTP
- [x] Context7 API key authentication
- [x] Request/response handling
- [x] Connection lifecycle management
- [x] Event-driven architecture

### ✅ Error Handling & Recovery

- [x] Comprehensive error classification
- [x] Automatic retry with exponential backoff
- [x] Rate limiting support
- [x] Circuit breaker pattern
- [x] Error recovery strategies

### ✅ Performance & Monitoring

- [x] Request/response caching
- [x] Performance metrics collection
- [x] Health check functionality
- [x] Diagnostic capabilities
- [x] Request timeout management

### ✅ Security & Reliability

- [x] API key authentication
- [x] Request validation
- [x] Rate limiting
- [x] Request sanitization
- [x] Memory leak prevention

## Configuration

### Basic Configuration

```typescript
import { HTTPTransport, type HTTPTransportConfig } from "./modules/mcp";

const config: HTTPTransportConfig = {
  serverUrl: "https://mcp.context7.com/mcp",
  context7: {
    apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
    mcpEndpoint: "https://mcp.context7.com/mcp",
    apiVersion: "v1",
  },
  requestTimeout: 30000,
  maxRetries: 3,
};
```

### Advanced Configuration

```typescript
const config: HTTPTransportConfig = {
  serverUrl: "https://mcp.context7.com/mcp",
  context7: {
    apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
    apiVersion: "v1",
  },
  requestTimeout: 45000,
  maxRetries: 5,
  retryBaseDelay: 1000,
  retryMaxDelay: 30000,
  retryJitter: true,
  rateLimit: {
    maxRequests: 10,
    windowMs: 60000,
    retryAfter: 5000,
  },
  enableCompression: true,
  enableCaching: true,
  cacheTTL: 300000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "MyApp/1.0.0",
  },
};
```

## Usage Examples

### Basic Usage

```typescript
import { createContext7Transport } from "./modules/mcp";

// Create transport with factory function
const transport = createContext7Transport(
  "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
);

// Initialize transport
await transport.initialize();

// Make MCP requests
const tools = await transport.sendRequest("tools/list");
const result = await transport.sendRequest("tools/call", {
  name: "example_tool",
  arguments: { param: "value" },
});

// Clean up
await transport.destroy();
```

### Event Handling

```typescript
// Set up event listeners
transport.addEventListener(
  MCPClientEventType.CONNECTION_STATE_CHANGED,
  (event) => {
    console.log(`Connection state: ${event.data.connectionState}`);
  },
);

transport.addEventListener(MCPClientEventType.MESSAGE_SENT, (event) => {
  console.log(`Request sent: ${JSON.stringify(event.data.message)}`);
});

transport.addEventListener(MCPClientEventType.MESSAGE_RECEIVED, (event) => {
  console.log(`Response received: ${JSON.stringify(event.data.message)}`);
});

transport.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
  console.error(`Transport error: ${event.data.error?.message}`);
});
```

### Error Handling

```typescript
try {
  const result = await transport.sendRequest("tools/call", {
    name: "example_tool",
    arguments: { param: "value" },
  });
  console.log("Success:", result);
} catch (error) {
  if (error && typeof error === "object" && "type" in error) {
    const transportError = error as any;
    console.error(`Error type: ${transportError.type}`);
    console.error(`Retryable: ${transportError.retryable}`);
    console.error(`Retry delay: ${transportError.retryDelay}ms`);
  }
}
```

## Context7 Integration

### Authentication

The HTTP transport automatically handles Context7 authentication using the provided API key:

```typescript
const config: HTTPTransportConfig = {
  context7: {
    apiKey: "ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44",
  },
};

// The transport automatically adds the Authorization header:
// Authorization: Bearer ctx7sk-a1d42d0e-9a2a-4c54-9e41-0e85e1b7de44
```

### API Endpoints

Default Context7 endpoints:

- MCP Endpoint: `https://mcp.context7.com/mcp`
- API Version: `v1`

### Request Format

The transport sends standard JSON-RPC 2.0 requests:

```json
{
  "jsonrpc": "2.0",
  "id": "request_id",
  "method": "tools/list",
  "params": {}
}
```

## Performance Optimization

### Caching

Enable response caching to reduce redundant requests:

```typescript
const config: HTTPTransportConfig = {
  enableCaching: true,
  cacheTTL: 300000, // 5 minutes
};
```

### Rate Limiting

Configure rate limiting to respect API limits:

```typescript
const config: HTTPTransportConfig = {
  rateLimit: {
    maxRequests: 10, // 10 requests per window
    windowMs: 60000, // 1 minute window
    retryAfter: 5000, // Wait 5 seconds after rate limit hit
  },
};
```

### Retry Logic

Configure retry behavior for transient failures:

```typescript
const config: HTTPTransportConfig = {
  maxRetries: 3,
  retryBaseDelay: 1000, // Start with 1 second delay
  retryMaxDelay: 30000, // Maximum 30 second delay
  retryJitter: true, // Add randomness to prevent thundering herd
};
```

## Monitoring & Diagnostics

### Health Checks

```typescript
const health = await transport.healthCheck();
console.log("Healthy:", health.healthy);
console.log("Details:", health.details);
```

### Performance Metrics

```typescript
const stats = transport.getStats();
console.log("Messages sent:", stats.messagesSent);
console.log("Messages received:", stats.messagesReceived);
console.log("Average response time:", stats.averageResponseTime);
console.log("Connection uptime:", stats.connectionUptime);
```

### Diagnostics

```typescript
const diagnostics = await transport.performDiagnostics();
console.log("Diagnostics:", diagnostics);
```

## Error Types

The HTTP transport defines specific error types:

| Error Type              | Description                    | Retryable |
| ----------------------- | ------------------------------ | --------- |
| `CONNECTION_FAILED`     | Failed to establish connection | ✅        |
| `CONNECTION_TIMEOUT`    | Connection timed out           | ✅        |
| `REQUEST_FAILED`        | HTTP request failed            | ✅        |
| `REQUEST_TIMEOUT`       | Request timed out              | ✅        |
| `RATE_LIMITED`          | Rate limit exceeded            | ✅        |
| `AUTHENTICATION_FAILED` | Invalid API key                | ❌        |
| `SERVER_ERROR`          | Server returned error status   | ✅        |
| `NETWORK_ERROR`         | Network connectivity issue     | ✅        |

## Integration with Existing MCP Client

The HTTP transport is designed to work with the existing MCP client architecture:

```typescript
import { MCPClient } from "./modules/mcp";
import { HTTPTransport } from "./modules/mcp";

// Create HTTP transport
const transport = new HTTPTransport(config);

// Use with existing MCP client (requires adapter)
// The MCP client can be extended to support pluggable transports
```

## Testing

### Unit Tests

```typescript
import { HTTPTransport } from "./modules/mcp";

describe("HTTPTransport", () => {
  let transport: HTTPTransport;

  beforeEach(() => {
    transport = new HTTPTransport({
      serverUrl: "https://api.test.com",
      context7: { apiKey: "test-key" },
    });
  });

  afterEach(async () => {
    await transport.destroy();
  });

  it("should initialize successfully", async () => {
    await expect(transport.initialize()).resolves.not.toThrow();
    expect(transport.isConnected()).toBe(true);
  });
});
```

### Integration Tests

See `http-transport-example.ts` for comprehensive integration examples.

## Security Considerations

### API Key Protection

- API keys are included in HTTP headers
- Keys are never logged or exposed in error messages
- Support for environment variable injection

### Request Validation

- All requests are validated against JSON-RPC 2.0 specification
- Input sanitization prevents injection attacks
- Content-Type headers are enforced

### Rate Limiting

- Built-in rate limiting prevents abuse
- Configurable windows and thresholds
- Automatic backoff on rate limit hits

## Browser Compatibility

The HTTP transport uses the fetch API and supports:

- ✅ Chrome 42+
- ✅ Firefox 39+
- ✅ Safari 10.1+
- ✅ Edge 14+

For older browsers, a fetch polyfill is required.

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure Context7 allows requests from your domain
   - Check that proper headers are set

2. **Authentication Failures**
   - Verify API key is correct
   - Check that Authorization header is being sent

3. **Timeout Issues**
   - Increase request timeout for slow operations
   - Check network connectivity

4. **Rate Limiting**
   - Implement proper backoff strategies
   - Monitor request frequency

### Debug Mode

Enable debug logging:

```typescript
const config: HTTPTransportConfig = {
  debug: true,
};
```

### Error Analysis

Use the built-in error analysis:

```typescript
transport.addEventListener(MCPClientEventType.ERROR_OCCURRED, (event) => {
  const error = event.data.error;
  console.error("Error details:", {
    type: error?.type,
    message: error?.message,
    retryable: error?.retryable,
    recoverable: error?.recoverable,
    statusCode: error?.statusCode,
  });
});
```

## Future Enhancements

### Planned Features

- [ ] WebSocket fallback support
- [ ] Request batching
- [ ] Streaming responses
- [ ] Advanced caching strategies
- [ ] Metrics export to external systems
- [ ] GraphQL transport support

### Performance Improvements

- [ ] HTTP/2 support
- [ ] Request deduplication
- [ ] Connection pooling
- [ ] Adaptive retry strategies

## Contributing

When contributing to the HTTP transport implementation:

1. Follow the existing code patterns and TypeScript conventions
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility
5. Test with both development and production Context7 endpoints

## License

This implementation is part of the LOFERSIL Landing Page project and follows the same licensing terms.

---

**Last Updated**: December 12, 2025
**Version**: 1.0.0
**Authors**: MCP Implementation Team
