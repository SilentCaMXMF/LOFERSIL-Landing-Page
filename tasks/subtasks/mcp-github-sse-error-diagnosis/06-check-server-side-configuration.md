# Check Server-side GitHub MCP Configuration

## Objective

Analyze server-side GitHub MCP configuration requirements and identify potential server-side issues that could cause 400 status code errors.

## Implementation Steps

### Step 1: Research GitHub Copilot MCP Server Documentation

**Documentation Sources to Research:**

- GitHub Copilot API official documentation
- Model Context Protocol (MCP) specification
- GitHub's MCP server implementation details
- Server-side configuration requirements

**Key Information Needed:**

1. **Supported Endpoints:** Official GitHub MCP server URLs
2. **Required Headers:** Mandatory request headers
3. **Authentication Methods:** Supported auth mechanisms
4. **Protocol Version:** Required MCP protocol version
5. **Rate Limits:** Connection and request limits

### Step 2: Analyze Current Server Configuration

**Current Server Configuration Analysis:**
Based on test results, the current server appears to require:

```typescript
// Required headers based on 400 error response:
headers: {
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream", // BOTH required
  "Authorization": "Bearer ghp_XXXXXXXXXX",
  "User-Agent": "ClientName/Version"
}
```

**Server Response Analysis:**

```typescript
// From 400 error:
"Accept must contain both 'application/json' and 'text/event-stream'";
```

### Step 3: Identify Server-Side Requirements

#### Required Request Format:

```typescript
// MCP JSON-RPC Initialize Request:
{
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05", // Specific version required
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    clientInfo: {
      name: "Client Name",
      version: "1.0.0"
    }
  }
}
```

#### Required Headers:

```typescript
{
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream", // BOTH required
  "Authorization": "Bearer ghp_XXXXXXXXXX",
  "User-Agent": "ClientName/Version",
  "X-GitHub-Api-Version": "2022-11-28" // Recommended
}
```

#### Required Endpoint:

```typescript
// Correct endpoint (based on testing):
serverUrl: "https://api.githubcopilot.com/mcp/";
```

### Step 4: Server-Side Error Analysis

#### 400 Bad Request Scenarios:

**Scenario 1: Missing Accept Headers**

```typescript
// Problematic:
Accept: "application/json";

// Response: 400 Bad Request
// Message: "Accept must contain both 'application/json' and 'text/event-stream'"
```

**Scenario 2: Incorrect Protocol Version**

```typescript
// Problematic:
protocolVersion: "2024-01-01"; // Wrong version

// Response: 400 Bad Request
// Message: "Unsupported protocol version"
```

**Scenario 3: Missing Capabilities**

```typescript
// Problematic:
capabilities: {
} // Missing required capability objects

// Response: 400 Bad Request
// Message: "Missing required capabilities"
```

**Scenario 4: Invalid Client Info**

```typescript
// Problematic:
clientInfo: {
} // Missing name/version

// Response: 400 Bad Request
// Message: "Invalid client information"
```

### Step 5: Server-Side Configuration Validation

#### Token Requirements Analysis:

```typescript
// GitHub Copilot token requirements:
interface GitHubCopilotToken {
  type: "classic" | "fine-grained";
  prefix: "ghp_" | "github_pat_";
  scopes: ["copilot", "repo", "read:org"]; // Required scopes
  expiration: Date;
  status: "active" | "expired" | "revoked";
}
```

#### Server Rate Limits:

```typescript
// Anticipated rate limits:
interface MCPRateLimits {
  connections: {
    maxPerMinute: 10;
    maxPerHour: 100;
    current: number;
    resetTime: Date;
  };
  requests: {
    maxPerMinute: 60;
    maxPerHour: 1000;
    current: number;
    resetTime: Date;
  };
  streaming: {
    maxConcurrent: 5;
    maxMessageSize: 1024 * 1024; // 1MB
    connectionTimeout: 300000; // 5 minutes
  };
}
```

## Server-Side Issues Identified

### 1. **Strict Header Validation** 🔴 CRITICAL

**Issue:** GitHub MCP server strictly validates Accept header

**Current Problem:**

```typescript
// Current implementation:
Accept: "application/json";

// Server expects:
Accept: "application/json, text/event-stream";
```

**Fix:** Update Accept header to include both content types

### 2. **Protocol Version Requirements** 🔴 HIGH PRIORITY

**Issue:** Server requires specific MCP protocol version

**Requirement:** `protocolVersion: "2024-11-05"`

**Current Implementation:** May be using wrong version

### 3. **Authentication Scope Validation** 🔴 HIGH PRIORITY

**Issue:** Server validates token scopes at connection time

**Required Scopes:**

- `copilot` - Access to Copilot features
- `repo` - Repository access for tools
- `read:org` - Organization read access

### 4. **Streaming Protocol Requirements** 🔴 HIGH PRIORITY

**Issue:** Server requires proper streaming protocol handling

**Requirements:**

- Single HTTP POST connection with streaming response
- Proper SSE message format parsing
- Connection keep-alive handling

## Server Configuration Recommendations

### Recommendation 1: Update Client Configuration

**Required Changes:**

```typescript
const clientConfig = {
  serverUrl: "https://api.githubcopilot.com/mcp/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream", // BOTH required
    Authorization: `Bearer ${validatedToken}`,
    "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
    "X-GitHub-Api-Version": "2022-11-28",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  },
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  },
};
```

### Recommendation 2: Implement Server Compliance

**Compliance Requirements:**

1. **Header Validation:** Send all required headers
2. **Protocol Version:** Use correct MCP version
3. **Token Validation:** Ensure proper token format and scopes
4. **Streaming Support:** Implement proper SSE handling
5. **Error Handling:** Handle server error responses correctly

### Recommendation 3: Add Server Validation

**Validation Functions:**

```typescript
async function validateServerCompliance(): Promise<boolean> {
  try {
    // Test with minimal valid request
    const response = await fetch("https://api.githubcopilot.com/mcp/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          clientInfo: { name: "Test", version: "1.0.0" },
        },
      }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
```

## Implementation Plan

### Phase 1: Server Configuration Updates (Immediate)

1. **Update Accept Headers:** Include both JSON and Event-Stream
2. **Fix Protocol Version:** Use "2024-11-05"
3. **Add Required Headers:** User-Agent, API version, etc.
4. **Validate Token Format:** Ensure proper GitHub token

### Phase 2: Streaming Implementation (Short-term)

1. **Replace EventSource:** Use fetch with streaming response
2. **Implement SSE Parsing:** Proper SSE message format handling
3. **Add Connection Management:** Keep-alive and reconnection
4. **Handle Server Responses:** Parse JSON-RPC and SSE events

### Phase 3: Server Compliance (Medium-term)

1. **Add Server Validation:** Test server compatibility
2. **Implement Error Recovery:** Handle server-side errors
3. **Add Rate Limit Handling:** Respect server rate limits
4. **Monitor Server Changes:** Detect API changes

## Success Criteria

- [ ] Server requirements identified and documented
- [ ] Required headers implemented
- [ ] Correct protocol version used
- [ ] Proper token validation added
- [ ] Server compliance validation implemented
- [ ] 400 errors resolved through server compliance

## Dependencies

This task depends on:

- Task 01: MCP Configuration Analysis (COMPLETED)
- Task 02: GitHub Integration Settings (COMPLETED)
- Task 03: Authentication Tokens and Permissions (COMPLETED)
- Task 04: Test MCP Connection Endpoints (COMPLETED)
- Task 05: Analyze SSE Connection Implementation (COMPLETED)

This task enables:

- Task 07: Implement Comprehensive Diagnostics

## Expected Outcomes

### Primary Outcome: Server Compliance

Understanding and implementing server-side requirements should resolve 400 errors.

### Secondary Outcomes:

- Proper server communication protocol
- Improved error handling
- Better connection reliability
- Compliance with GitHub MCP specifications

---

_This analysis provides server-side configuration requirements and compliance guidelines for resolving GitHub MCP connection issues._
