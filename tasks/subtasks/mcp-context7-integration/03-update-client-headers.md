# 03. Update MCPClient for Custom Headers

**Status**: Pending
**Priority**: High
**Assignee**: System
**Estimated Time**: 60 minutes

## Objective

Modify the MCPClient to support custom headers in WebSocket/SSE connections and HTTP requests for Context7 authentication.

## Requirements

### Header Support

- Add headers to WebSocket connection initialization
- Include headers in HTTP requests for SSE fallback
- Support both API key and header-based authentication
- Handle header security (don't log sensitive values)

### Connection Methods

- WebSocket connections with custom headers
- Server-Sent Events with authorization headers
- HTTP-based MCP protocol support
- Graceful fallback between connection methods

## Implementation Details

### WebSocket Headers

WebSocket standard doesn't support custom headers, so implement:

- HTTP-based MCP protocol as primary method
- WebSocket upgrade with authentication
- Header forwarding in initial handshake

### SSE Headers

```typescript
private async connectSSE(): Promise<void> {
  const eventSource = new EventSource(this.config.serverUrl, {
    headers: this.config.headers // If supported
  });

  // Alternative: Use fetch for initial auth, then SSE
  const response = await fetch(this.config.serverUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...this.config.headers
    },
    body: JSON.stringify({ method: 'initialize' })
  });
}
```

### Request Headers

```typescript
async sendRequest(method: string, params?: any): Promise<any> {
  const message = {
    jsonrpc: '2.0',
    id: Math.random().toString(36),
    method,
    params
  };

  // Include headers in request
  const response = await fetch(this.config.serverUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...this.config.headers
    },
    body: JSON.stringify(message)
  });

  return response.json();
}
```

## Acceptance Criteria

### Connection Tests

- [ ] WebSocket connections work with headers
- [ ] SSE connections include authorization
- [ ] HTTP requests include custom headers
- [ ] Authentication succeeds with Context7

### Error Handling

- [ ] Invalid headers produce clear errors
- [ ] Authentication failures are handled
- [ ] Connection timeouts work with headers
- [ ] Fallback mechanisms work correctly

### Security

- [ ] Headers are not logged in debug output
- [ ] Sensitive header values are masked
- [ ] HTTPS is enforced for header transmission

## Files to Modify

- `.opencode/tool/mcp/client.ts`

## Dependencies

- Extended MCPClientConfig with headers field
- Node.js fetch API or HTTP client
- Environment variable access for API keys

## Testing

```bash
# Test header functionality
npm test -- --testPathPattern=client-headers

# Test Context7 authentication
npm test -- --testNamePattern=context7-auth

# Integration test
npm test -- --testPathPattern=mcp-context7
```

## Notes

- WebSocket headers may require protocol-specific handling
- Consider using HTTP-based MCP as primary method
- Test with actual Context7 server when available
- Document header security considerations
