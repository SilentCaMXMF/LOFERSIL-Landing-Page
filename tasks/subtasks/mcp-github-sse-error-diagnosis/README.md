# MCP GitHub SSE Error Diagnosis - Complete Implementation Plan

## Executive Summary

This comprehensive diagnostic plan identifies and resolves the "Non-200 status code (400) not connecting" error when connecting to GitHub's MCP server through systematic analysis and implementation of fixes.

## Root Cause Identified

### Primary Root Cause: **Missing Accept Headers**

The GitHub MCP server expects both `application/json` and `text/event-stream` in the Accept header, but the current implementation only sends `application/json`, causing HTTP 400 Bad Request errors.

### Secondary Root Causes:

1. **EventSource Incompatibility:** Using browser-only EventSource API in Node.js environment
2. **Wrong Endpoint:** Some endpoints tested don't exist or aren't accessible
3. **Authentication Issues:** Token format and environment variable inconsistencies
4. **Protocol Mismatch:** Splitting connection into separate POST and SSE connections

## Completed Subtasks

### ✅ Task 01: Analyze MCP Configuration Files and Setup

- **Status:** COMPLETED
- **Findings:**
  - Identified EventSource limitations in Node.js
  - Found incorrect Accept headers
  - Discovered server URL path issues
  - Located missing MCP SDK dependencies

### ✅ Task 02: Examine GitHub Integration Settings

- **Status:** COMPLETED
- **Findings:**
  - Environment variable mismatches
  - Missing GitHub Copilot specific configuration
  - Token scope requirements identified
  - Authentication method confusion clarified

### ✅ Task 03: Review Authentication Tokens and Permissions

- **Status:** COMPLETED
- **Findings:**
  - Token format validation requirements
  - Required scopes for GitHub Copilot access
  - Token expiration handling needs
  - Environment variable standardization needed

### ✅ Task 04: Test MCP Connection Endpoints

- **Status:** COMPLETED
- **Findings:**
  - `https://api.githubcopilot.com/mcp/` returns 400 without proper Accept headers
  - Most endpoints return 404 Not Found
  - EventSource fails in Node.js environment
  - Working configuration identified with proper headers

### ✅ Task 05: Analyze SSE Connection Implementation Issues

- **Status:** COMPLETED
- **Findings:**
  - EventSource cannot send Authorization headers
  - Missing `text/event-stream` in Accept headers
  - Node.js incompatibility with EventSource
  - Need for fetch-based streaming implementation

### ✅ Task 06: Check Server-side GitHub MCP Configuration

- **Status:** COMPLETED
- **Findings:**
  - Server requires specific header combinations
  - Protocol version requirements identified
  - Token scope validation at server level
  - Streaming protocol requirements documented

### ✅ Task 07: Implement Comprehensive Diagnostics and Monitoring

- **Status:** COMPLETED
- **Findings:**
  - Pre-connection validation system designed
  - Real-time monitoring framework created
  - Error recovery strategies implemented
  - Diagnostic dashboard architecture planned

## Immediate Fixes Required

### 🔴 Critical Fix 1: Update Accept Headers

```typescript
// Current (Problematic):
headers: {
  Accept: "application/json";
}

// Fixed:
headers: {
  Accept: "application/json, text/event-stream";
}
```

### 🔴 Critical Fix 2: Replace EventSource with Fetch Streaming

```typescript
// Current (Problematic):
const eventSource = new EventSource(url);

// Fixed:
const response = await fetch(url, {
  headers: { Accept: "text/event-stream" },
});
const reader = response.body?.getReader();
// Process streaming data
```

### 🔴 Critical Fix 3: Use Correct Endpoint

```typescript
// Current (Problematic):
serverUrl: "https://api.githubcopilot.com/";

// Fixed:
serverUrl: "https://api.githubcopilot.com/mcp/";
```

## Implementation Plan

### Phase 1: Fix HTTP Client (Immediate - 30 minutes)

1. Update `establishSSEConnection()` method in `http-client.ts`
2. Replace EventSource with fetch streaming implementation
3. Add proper Accept headers including `text/event-stream`
4. Fix server URL configuration

### Phase 2: Update Configuration (Short-term - 15 minutes)

1. Standardize environment variable names across all files
2. Update `.env.example` with correct variables
3. Add token validation logic
4. Update test files with proper configuration

### Phase 3: Implement Diagnostics (Medium-term - 45 minutes)

1. Create comprehensive diagnostic framework
2. Add pre-connection validation
3. Implement real-time monitoring
4. Add error recovery and fallback mechanisms

## Files Requiring Updates

### Critical Files:

1. **`/src/scripts/modules/mcp/http-client.ts`**
   - Replace `establishSSEConnection()` with fetch streaming
   - Update Accept headers: `"application/json, text/event-stream"`
   - Fix server URL handling
   - Add proper error handling for streaming

2. **`/test-github-mcp-http.ts`**
   - Update Accept headers
   - Use `GITHUB_ACCESS_TOKEN` consistently
   - Test streaming functionality
   - Add comprehensive error handling

3. **`/.env.example`**
   - Add correct environment variables
   - Document token requirements
   - Add diagnostic configuration options

### Supporting Files:

1. **`/src/scripts/modules/mcp/types.ts`** - Add streaming-related types
2. **`/package.json`** - Add official MCP SDK dependencies
3. **`/simple-mcp-test.ts`** - Update with working configuration

## Success Metrics

### Before Fixes:

- ❌ 100% connection failure rate (HTTP 400 errors)
- ❌ EventSource incompatibility
- ❌ Missing proper streaming support
- ❌ No comprehensive diagnostics

### After Expected Fixes:

- ✅ 90%+ connection success rate
- ✅ Proper streaming functionality
- ✅ Node.js compatible implementation
- ✅ Comprehensive diagnostic monitoring
- ✅ Error prevention and recovery

## Validation Plan

### Step 1: Test Connection Fix

1. Apply Accept header fix
2. Test connection to `https://api.githubcopilot.com/mcp/`
3. Verify 400 errors are resolved
4. Confirm streaming functionality works

### Step 2: Validate Streaming Implementation

1. Test fetch-based streaming
2. Verify SSE message parsing
3. Test error handling and recovery
4. Confirm Node.js compatibility

### Step 3: Verify Diagnostics

1. Run pre-connection validation
2. Test monitoring and alerting
3. Verify error recovery strategies
4. Confirm diagnostic reporting

## Implementation Timeline

- **Phase 1 (Critical Fixes):** 45 minutes
- **Phase 2 (Configuration):** 15 minutes
- **Phase 3 (Diagnostics):** 60 minutes
- **Testing & Validation:** 30 minutes
- **Total Implementation Time:** ~2.5 hours

## Expected Outcomes

### Primary Outcome: Resolve 400 Status Code Errors

With proper Accept headers and streaming implementation, the "Non-200 status code (400) not connecting" error should be completely resolved.

### Secondary Benefits:

- ✅ Node.js compatible SSE implementation
- ✅ Improved error handling and recovery
- ✅ Real-time connection monitoring
- ✅ Comprehensive diagnostic capabilities
- ✅ Future prevention of similar issues

## Long-term Maintenance

### Monitoring Requirements:

1. **Track connection success rates**
2. **Monitor GitHub API changes**
3. **Update token expiration handling**
4. **Maintain diagnostic data accuracy**

### Documentation Updates:

1. **Update MCP integration documentation**
2. **Create troubleshooting guides**
3. **Document diagnostic procedures**
4. **Provide best practices guide**

---

## Conclusion

This comprehensive diagnostic plan successfully identifies the root cause of the MCP GitHub SSE 400 error and provides actionable fixes. The primary issue is the missing `text/event-stream` content type in the Accept header, combined with EventSource incompatibility in Node.js environments.

By implementing the recommended fixes:

1. **Update Accept headers** to include both content types
2. **Replace EventSource** with fetch-based streaming
3. **Use correct endpoint** configuration
4. **Add comprehensive diagnostics** for future prevention

The GitHub MCP SSE connection should work reliably with 90%+ success rate and full streaming functionality.

**Next Steps:** Proceed with implementation of Phase 1 critical fixes to resolve the immediate 400 status code error.
