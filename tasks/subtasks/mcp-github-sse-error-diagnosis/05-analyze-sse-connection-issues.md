# Analyze SSE Connection Implementation Issues

## Objective

Analyze Server-Sent Events (SSE) implementation issues that cause 400 status code errors and provide comprehensive fixes for GitHub MCP server integration.

## Implementation Analysis

### Current SSE Implementation Issues

#### 1. **EventSource Browser API Limitation** 🚨 CRITICAL

**File:** `/src/scripts/modules/mcp/http-client.ts` (lines 313-379)

**Current Implementation:**

```typescript
private async establishSSEConnection(): Promise<void> {
  const sseUrl = new URL(this.config.serverUrl);

  const eventSource = new EventSource(sseUrl.toString(), {
    withCredentials: true,
  });

  eventSource.addEventListener("message", (event) => {
    this.handleSSEMessage(event.data);
  });
}
```

**Problems Identified:**

1. **Browser-Only API:** EventSource only exists in browsers, not Node.js
2. **No Custom Headers:** Cannot send Authorization headers
3. **GET Requests Only:** EventSource only supports GET, not POST
4. **CORS Restrictions:** Limited by cross-origin policies

#### 2. **Missing Required Accept Headers** 🔴 HIGH PRIORITY

**Current HTTP POST Headers:**

```typescript
headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: this.config.headers?.Authorization || "",
}
```

**Missing Required Headers:**

```typescript
// GitHub MCP server requires both content types:
headers: {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",  // MISSING!
}
```

#### 3. **SSE Connection Flow Error** 🔴 HIGH PRIORITY

**Current Flow:**

1. Make POST request to initialize connection
2. Create EventSource for streaming responses
3. Try to handle messages from both

**Problems:**

- POST and GET use different authentication contexts
- EventSource cannot inherit authentication from POST
- Server expects single connection with proper headers

## Root Cause Analysis

### Primary Root Cause: Protocol Mismatch

The GitHub MCP server expects a **single HTTP POST connection** with streaming response that includes both JSON and Event-Stream content types. Current implementation tries to separate this into two connections:

1. **POST Request** for initialization (works but incomplete)
2. **EventSource** for streaming (fails due to authentication issues)

### Secondary Root Causes

1. **Accept Header Incomplete:** Missing `text/event-stream`
2. **EventSource Incompatible:** Browser API in Node.js environment
3. **Authentication Split:** Separate auth for POST and SSE

## SSE Implementation Fixes

### Fix 1: Replace EventSource with Fetch Streaming

**Current (Problematic):**

```typescript
const eventSource = new EventSource(sseUrl.toString(), {
  withCredentials: true,
});
```

**Fixed:**

```typescript
private async establishStreamingConnection(): Promise<void> {
  const response = await fetch(this.config.serverUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': this.config.headers?.Authorization || '',
      'User-Agent': 'LOFERSIL-MCP-Client/1.0.0'
    },
    body: JSON.stringify(initializationPayload)
  });

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming not supported');
  }

  // Process streaming data
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    this.handleStreamingData(chunk);
  }
}
```

### Fix 2: Update Accept Headers

**Current:**

```typescript
Accept: "application/json";
```

**Fixed:**

```typescript
Accept: "application/json, text/event-stream";
```

### Fix 3: Single Connection Implementation

**Current:** Separate POST and EventSource connections
**Fixed:** Single POST connection with streaming response processing

## Comprehensive SSE Implementation

### New Streaming Implementation:

```typescript
/**
 * Enhanced MCP HTTP Client with proper SSE support
 */
export class EnhancedHTTPMCPClient {
  private streamingReader?: ReadableStreamDefaultReader<Uint8Array>;
  private isStreaming = false;

  /**
   * Establish MCP connection with streaming support
   */
  async connect(): Promise<void> {
    try {
      this.setState(MCPConnectionState.CONNECTING);

      // Single POST request with streaming response
      const response = await this.initializeConnection();

      // Handle streaming response
      await this.handleStreamingResponse(response);

      this.setState(MCPConnectionState.CONNECTED);
    } catch (error) {
      this.setState(MCPConnectionState.ERROR);
      throw error;
    }
  }

  /**
   * Initialize connection with proper headers
   */
  private async initializeConnection(): Promise<Response> {
    const initRequest: JSONRPCRequest = {
      jsonrpc: "2.0",
      id: ++this.requestId,
      method: "initialize",
      params: {
        protocolVersion: MCP_VERSION,
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        clientInfo: {
          name: this.config.clientInfo?.name || "LOFERSIL MCP Client",
          version: this.config.clientInfo?.version || "1.0.0",
        },
      },
    };

    const response = await fetch(this.config.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: this.validateAndGetAuthHeader(),
        "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: JSON.stringify(initRequest),
      signal: AbortSignal.timeout(this.config.requestTimeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Handle streaming response from server
   */
  private async handleStreamingResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body not available for streaming");
    }

    this.streamingReader = reader;
    this.isStreaming = true;

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (!this.shouldStopStreaming) {
        const { done, value } = await reader.read();

        if (done) {
          this.handleStreamEnd();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE messages
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            this.handleSSELine(line);
          }
        }
      }
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "EnhancedHTTPMCPClient.handleStreamingResponse",
      );
      throw error;
    }
  }

  /**
   * Handle individual SSE line
   */
  private handleSSELine(line: string): void {
    try {
      // Handle SSE format: data: {JSON}
      if (line.startsWith("data: ")) {
        const data = line.substring(6);

        if (data.trim()) {
          this.handleSSEMessage(data);
        }
      }
      // Handle SSE events
      else if (line.startsWith("event: ")) {
        const eventType = line.substring(7);
        this.emitEvent(eventType, { timestamp: new Date() });
      }
      // Handle SSE IDs
      else if (line.startsWith("id: ")) {
        const eventId = line.substring(4);
        this.lastEventId = eventId;
      }
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "EnhancedHTTPMCPClient.handleSSELine",
        { line },
      );
    }
  }

  /**
   * Handle SSE message data
   */
  private handleSSEMessage(data: string): void {
    try {
      // Check if it's JSON-RPC response
      if (data.startsWith("{") && data.endsWith("}")) {
        const response = JSON.parse(data);
        this.handleJSONRPCResponse(response);
      }
      // Handle other SSE event types
      else {
        this.emitEvent(MCPClientEventType.TOOL_CALLED, {
          event: "sse_message",
          data,
        });
      }
    } catch (error) {
      this.errorHandler.handleError(
        error,
        "EnhancedHTTPMCPClient.handleSSEMessage",
        { data },
      );
    }
  }

  /**
   * Validate and get authentication header
   */
  private validateAndGetAuthHeader(): string {
    const auth = this.config.headers?.Authorization;

    if (!auth) {
      throw new Error("Authorization header is required");
    }

    if (!auth.startsWith("Bearer ")) {
      throw new Error('Authorization header must start with "Bearer "');
    }

    const token = auth.substring(7);
    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      throw new Error("Invalid GitHub token format");
    }

    return auth;
  }
}
```

## Implementation Migration Plan

### Step 1: Update HTTP Client (High Priority)

1. Replace `establishSSEConnection()` with `handleStreamingResponse()`
2. Add proper Accept headers
3. Implement fetch streaming instead of EventSource
4. Add SSE line parsing logic

### Step 2: Fix Authentication Headers (High Priority)

1. Validate Authorization header format
2. Add required headers (User-Agent, Cache-Control, Connection)
3. Implement token format validation
4. Add proper error messages for auth issues

### Step 3: Add Streaming Error Handling (Medium Priority)

1. Handle stream interruptions
2. Implement reconnection logic for streaming
3. Add stream health monitoring
4. Handle partial message scenarios

## Files to Modify

### Critical Files:

1. `/src/scripts/modules/mcp/http-client.ts`
   - Replace EventSource with fetch streaming
   - Update Accept headers
   - Add SSE line parsing
   - Improve error handling

2. `/test-github-mcp-http.ts`
   - Update test to use new streaming method
   - Add proper Accept headers
   - Test streaming functionality

### Supporting Files:

1. `/src/scripts/modules/mcp/types.ts`
   - Add streaming-related types
   - Extend error types for streaming

2. `/.env.example`
   - Document required headers
   - Add streaming configuration options

## Success Criteria

- [ ] EventSource replaced with fetch streaming
- [ ] Accept headers include both JSON and Event-Stream
- [ ] Single POST connection implementation
- [ ] Proper SSE message parsing implemented
- [ ] Authentication validation added
- [ ] Streaming error handling implemented
- [ ] Test cases updated for new implementation

## Dependencies

This task depends on:

- Task 01: MCP Configuration Analysis (COMPLETED)
- Task 02: GitHub Integration Settings (COMPLETED)
- Task 03: Authentication Tokens and Permissions (COMPLETED)
- Task 04: Test MCP Connection Endpoints (COMPLETED)

This task enables:

- Task 06: Check Server-side Configuration
- Task 07: Implement Comprehensive Diagnostics

## Expected Outcomes

### Primary Outcome: Resolve 400 Status Code Errors

With proper Accept headers and streaming implementation, 400 errors should be resolved.

### Secondary Outcomes:

- Node.js compatible SSE implementation
- Better error handling and diagnostics
- Improved connection reliability
- Proper streaming message parsing

## Implementation Validation

After implementing fixes:

1. Test connection to `https://api.githubcopilot.com/mcp/`
2. Verify 400 errors are resolved
3. Test streaming message handling
4. Validate error recovery scenarios
5. Confirm Node.js compatibility

---

_This analysis identifies SSE implementation issues and provides comprehensive fixes for resolving 400 status code errors in GitHub MCP integration._
