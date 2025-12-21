# MCP Configuration Analysis Report

## Executive Summary

Analysis of MCP (Model Context Protocol) configuration reveals several critical issues that likely cause the "Non-200 status code (400) not connecting" error when connecting to GitHub's MCP server.

## Critical Configuration Issues Identified

### 1. **Server URL Configuration Problem** ⚠️ HIGH PRIORITY

**File:** `/test-github-mcp-http.ts`, `/test-github-mcp-http.js`
**Issue:** Incorrect GitHub Copilot MCP endpoint URL

**Current Configuration:**

```typescript
serverUrl: "https://api.githubcopilot.com/mcp/";
```

**Problems Identified:**

- GitHub Copilot MCP server does not use `/mcp/` path
- The correct endpoint should be `https://api.githubcopilot.com/` or GitHub's official MCP endpoint
- Trailing slash may cause routing issues

**Recommended Fix:**

```typescript
serverUrl: "https://api.githubcopilot.com/";
```

### 2. **EventSource SSE Configuration Error** ⚠️ HIGH PRIORITY

**File:** `/src/scripts/modules/mcp/http-client.ts` (lines 313-315)
**Issue:** EventSource cannot make POST requests with authentication headers

**Current Code:**

```typescript
const eventSource = new EventSource(sseUrl.toString(), {
  withCredentials: true,
});
```

**Problems Identified:**

- EventSource only supports GET requests, not POST
- Cannot set custom headers (including Authorization) with EventSource
- `withCredentials: true` only sends cookies, not Authorization headers
- GitHub MCP server likely requires POST with Bearer token for SSE

**Recommended Fix:**

- Use fetch with streaming response instead of EventSource
- Or implement WebSocket connection for real-time communication
- Move authentication to query parameters if EventSource must be used

### 3. **Authentication Header Handling Issue** ⚠️ MEDIUM PRIORITY

**File:** `/src/scripts/modules/mcp/http-client.ts` (lines 494-496)
**Issue:** Potential header conflict in POST requests

**Current Code:**

```typescript
headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: this.config.headers?.Authorization || "",
  ...this.config.headers,
},
```

**Problems Identified:**

- Spread operator may override critical headers
- Empty string Authorization when no token provided
- No validation of Authorization header format

**Recommended Fix:**

```typescript
headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(this.config.headers?.Authorization && {
    Authorization: this.config.headers.Authorization
  }),
  ...Object.fromEntries(
    Object.entries(this.config.headers || {})
      .filter(([key]) => key !== 'Authorization')
  ),
},
```

### 4. **Missing MCP Dependencies** ⚠️ MEDIUM PRIORITY

**File:** `/package.json`
**Issue:** No official MCP SDK dependencies

**Current State:** Custom MCP implementation without official libraries

**Problems Identified:**

- Custom implementation may have protocol compliance issues
- Missing official Model Context Protocol SDK
- No reference implementation for GitHub Copilot integration

**Recommended Dependencies to Add:**

```json
{
  "@modelcontextprotocol/sdk": "^0.5.0",
  "@modelcontextprotocol/inspector": "^0.5.0"
}
```

### 5. **Environment Variable Configuration Gap** ⚠️ LOW PRIORITY

**File:** `/.env.example`
**Issue:** Missing GitHub Copilot specific environment variables

**Current Variables:** Only `GITHUB_ACCESS_TOKEN` (for GitHub API, not Copilot)

**Recommended Addition:**

```bash
# GitHub Copilot MCP Configuration
GITHUB_COPILOT_TOKEN=your-github-copilot-token
GITHUB_MCP_SERVER_URL=https://api.githubcopilot.com/
GITHUB_MCP_TIMEOUT=30000
ENABLE_GITHUB_MCP_LOGGING=true
```

## Root Cause Analysis

### Primary Root Cause: EventSource Limitations

The main issue is attempting to use EventSource for GitHub MCP server communication. EventSource has fundamental limitations:

1. **No Custom Headers:** Cannot send Authorization headers
2. **GET Only:** Only supports GET requests, not POST
3. **No Request Body:** Cannot send JSON-RPC initialization payload
4. **CORS Restrictions:** GitHub server may reject EventSource connections

### Secondary Root Cause: Incorrect Endpoint

The GitHub Copilot MCP server URL may be incorrect, leading to 400 Bad Request responses.

## Immediate Action Items

### Priority 1: Fix SSE Connection (Critical)

1. Replace EventSource with fetch streaming or WebSocket
2. Ensure proper authentication in connection establishment
3. Test with correct GitHub MCP endpoint

### Priority 2: Update Server URL (High)

1. Verify correct GitHub Copilot MCP endpoint
2. Update test configuration files
3. Remove trailing slash if causing issues

### Priority 3: Add Official MCP SDK (Medium)

1. Install official MCP SDK
2. Migrate custom implementation to use SDK
3. Ensure protocol compliance

## Files Requiring Changes

### Critical Changes Required:

1. `/src/scripts/modules/mcp/http-client.ts` - Replace EventSource with fetch streaming
2. `/test-github-mcp-http.ts` - Update server URL and authentication
3. `/test-github-mcp-http.js` - Update server URL and authentication
4. `/package.json` - Add MCP SDK dependencies

### Recommended Changes:

1. `/.env.example` - Add GitHub Copilot environment variables
2. `/src/scripts/modules/mcp/` - Migrate to official SDK

## Next Steps

1. **Immediate:** Fix SSE connection implementation
2. **Short-term:** Update server URLs and test connectivity
3. **Medium-term:** Migrate to official MCP SDK
4. **Long-term:** Implement comprehensive error handling and monitoring

## Validation Plan

After implementing fixes:

1. Test connection to GitHub MCP server
2. Verify authentication flow works correctly
3. Test tool listing and execution
4. Validate error handling and reconnection logic

## Impact Assessment

**Before Fix:** MCP GitHub integration completely non-functional due to 400 errors
**After Fix:** Full MCP GitHub integration with proper authentication and tool access

---

_This analysis provides a clear path to resolving the 400 status code errors by addressing fundamental SSE configuration issues and endpoint problems._
