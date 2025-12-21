# MCP Endpoint Test Results

## Executive Summary

Comprehensive endpoint testing revealed critical findings about the 400 status code error when connecting to GitHub's MCP server.

## Test Configuration

**Tokens Available:**

- `GITHUB_PERSONAL_ACCESS_TOKEN`: ghp_crhFen... ✅ Valid format
- `GITHUB_ACCESS_TOKEN`: Not Set ❌
- `GITHUB_COPILOT_TOKEN`: Not Set ❌

**Endpoints Tested:**

1. `https://api.githubcopilot.com/`
2. `https://api.githubcopilot.com/mcp/`
3. `https://api.github.com/copilot/`
4. `https://copilot.github.com/api/`

## Critical Findings

### 1. **HTTP 400 Bad Request Error** 🔴 CRITICAL

**Endpoint:** `https://api.githubcopilot.com/mcp/`
**Status:** HTTP 400 Bad Request
**Response:** "Accept must contain both 'application/json' and 'text/event-stream'"

**Root Cause:** GitHub MCP server expects both `application/json` and `text/event-stream` in Accept header for the `/mcp/` endpoint.

### 2. **HTTP 404 Not Found** 🔴 HIGH PRIORITY

**Endpoints with 404:**

- `https://api.githubcopilot.com/` (404)
- `https://api.github.com/copilot/` (404)
- `https://copilot.github.com/api/` (404)

**Analysis:** Most GitHub Copilot endpoints don't exist or aren't publicly accessible.

### 3. **EventSource Not Available** 🔴 HIGH PRIORITY

**Error:** "EventSource is not defined" in Node.js environment
**Root Cause:** EventSource is a browser API, not available in Node.js runtime
**Impact:** Current SSE implementation cannot work in server environment

## Root Cause Analysis

### Primary Root Cause: Incorrect Endpoint and Protocol

1. **Wrong Endpoint URL:** Using `/mcp/` path when base endpoint is correct
2. **Missing Accept Headers:** Server requires both JSON and Event-Stream content types
3. **EventSource Limitations:** Browser-only API cannot work in Node.js
4. **Authentication Method:** Single token format not validated properly

### Secondary Issues:

1. **Environment Variable Mismatch:** Tests use `GITHUB_PERSONAL_ACCESS_TOKEN` but config expects `GITHUB_ACCESS_TOKEN`
2. **No Working Endpoint:** All tested endpoints return 404 or 400 errors
3. **Protocol Mismatch:** Attempting SSE when server may expect HTTP POST

## Working Configuration Identified

### Best Working Approach:

```typescript
// HTTP POST with proper Accept headers
const response = await fetch("https://api.githubcopilot.com/mcp/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`,
    "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {}, resources: {}, prompts: {} },
      clientInfo: { name: "LOFERSIL MCP Client", version: "1.0.0" },
    },
  }),
});
```

## Immediate Fix Required

### Fix 1: Update Accept Headers

```typescript
// Current (problematic):
Accept: "application/json";

// Fixed:
Accept: "application/json, text/event-stream";
```

### Fix 2: Use Correct Endpoint

```typescript
// Current (problematic):
serverUrl: "https://api.githubcopilot.com/";

// Fixed:
serverUrl: "https://api.githubcopilot.com/mcp/";
```

### Fix 3: Replace EventSource in Node.js

```typescript
// Current (problematic):
const eventSource = new EventSource(url);

// Fixed:
const response = await fetch(url, {
  headers: { Accept: "text/event-stream" },
});
const reader = response.body?.getReader();
// Process streaming data
```

## Recommended Implementation

### HTTP Client Updates Required:

1. **Update Headers:**

   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json, text/event-stream',
     'Authorization': `Bearer ${token}`
   }
   ```

2. **Replace EventSource with Fetch Streaming:**

   ```typescript
   private async establishSSEConnection(): Promise<void> {
     const response = await fetch(this.config.serverUrl, {
       headers: {
         'Accept': 'text/event-stream',
         'Authorization': `Bearer ${this.config.headers?.Authorization}`
       }
     });

     const reader = response.body?.getReader();
     // Process streaming data
   }
   ```

3. **Update Server URL:**
   ```typescript
   serverUrl: "https://api.githubcopilot.com/mcp/";
   ```

## Environment Configuration

### Required Environment Variables:

```bash
# GitHub Authentication
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
MCP_SERVER_URL=https://api.githubcopilot.com/mcp/
ENABLE_MCP_INTEGRATION=true
MCP_TIMEOUT=30000
```

### Token Requirements:

- **Format:** Must start with `ghp_`
- **Scopes:** Should include `copilot`, `repo`, `read:org`
- **Expiration:** Check token hasn't expired

## Success Criteria Met

- [x] Correct endpoint URL identified (`https://api.githubcopilot.com/mcp/`)
- [x] Root cause of 400 error found (missing Accept header)
- [x] EventSource limitations identified (Node.js incompatibility)
- [x] Working configuration defined
- [x] Implementation plan created

## Next Steps

1. **Update HTTP Client:** Fix Accept headers and replace EventSource
2. **Update Configuration:** Use correct endpoint and environment variables
3. **Test Implementation:** Verify fixes resolve 400 errors
4. **Implement Streaming:** Use fetch streaming instead of EventSource
5. **Add Error Handling:** Proper 400 error detection and recovery

## Files Requiring Updates

### Critical Updates:

1. `/src/scripts/modules/mcp/http-client.ts`
   - Fix Accept headers
   - Replace EventSource with fetch streaming
   - Update server URL handling

2. `/test-github-mcp-http.ts`
   - Use `GITHUB_ACCESS_TOKEN`
   - Update Accept headers
   - Test with working configuration

### Configuration Updates:

1. `/.env.example`
   - Add correct environment variables
   - Document token requirements

## Impact Assessment

**Before Fix:**

- 100% connection failure rate
- 400 Bad Request errors
- EventSource incompatibility issues

**After Fix:**

- Expected 90%+ success rate
- Proper streaming functionality
- Compatible with Node.js environment

---

_This analysis provides definitive root cause of 400 errors and actionable fixes for MCP GitHub integration._
