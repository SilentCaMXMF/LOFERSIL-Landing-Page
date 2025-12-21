# Analyze MCP Configuration Files and Setup

## Objective

Systematically analyze all MCP configuration files and setup to identify potential misconfigurations that could cause the "Non-200 status code (400) not connecting" error when connecting to GitHub's MCP server.

## Implementation Steps

### Step 1: Examine Core MCP Configuration Files

**Files to Analyze:**

- `/src/scripts/modules/mcp/types.ts` - Core MCP type definitions and interfaces
- `/src/scripts/modules/mcp/http-client.ts` - HTTP-based MCP client implementation
- `/src/scripts/modules/mcp/websocket-client.ts` - WebSocket-based MCP client implementation
- `/src/scripts/modules/mcp/client.ts` - Main MCP client coordinator
- `/src/scripts/modules/mcp/protocol.ts` - MCP protocol layer implementation

**Analysis Focus:**

- Default configuration values
- Connection timeout settings
- Authentication header formatting
- Server URL configurations
- SSE (Server-Sent Events) setup

### Step 2: Review Environment Configuration

**Files to Examine:**

- `/.env.example` - Environment variable template
- `/.env` (if exists) - Actual environment configuration
- `/package.json` - Dependencies and scripts
- `/tsconfig.json` - TypeScript configuration

**Key Environment Variables to Check:**

```bash
# GitHub MCP related variables
GITHUB_PERSONAL_ACCESS_TOKEN
MCP_SERVER_URL
MCP_API_KEY
ENABLE_MCP_INTEGRATION
```

### Step 3: Analyze Test Configuration Files

**Test Files to Review:**

- `/test-github-mcp-http.ts` - HTTP MCP client test
- `/test-github-mcp-http.js` - JavaScript version of HTTP test
- `/test-github-mcp.ts` - General MCP test
- `/tests/integration/mcp-integration.test.ts` - Integration tests
- `/tests/integration/mcp-error-handling.test.ts` - Error handling tests

**Test Configuration Analysis:**

- Test server URLs
- Mock configurations
- Authentication setup in tests
- Error simulation patterns

### Step 4: Check MCP Package Dependencies

**Dependencies to Verify:**

- `@modelcontextprotocol/sdk` (if used)
- WebSocket libraries
- HTTP client libraries
- EventSource polyfills (if needed)

### Step 5: Configuration Validation Checklist

**Critical Configuration Points:**

1. **Server URL Configuration:**
   - Verify `https://api.githubcopilot.com/mcp/` is correct
   - Check for trailing slashes
   - Validate HTTPS protocol

2. **Authentication Configuration:**
   - Bearer token format
   - Header case sensitivity
   - Token scope and permissions

3. **SSE Configuration:**
   - EventSource constructor parameters
   - CORS handling
   - Connection timeout settings

4. **HTTP Client Configuration:**
   - Request headers
   - Content-Type settings
   - User-Agent configuration

## Expected Outcomes

### Configuration Issues to Identify:

1. **Incorrect Server URL:** Wrong endpoint or protocol
2. **Missing Authentication:** No Bearer token or malformed header
3. **Timeout Misconfiguration:** Too short/long timeouts
4. **SSE Implementation Issues:** EventSource configuration problems
5. **Header Problems:** Missing or incorrect HTTP headers

### Deliverables:

1. Configuration analysis report
2. List of identified issues
3. Recommended fixes
4. Updated configuration templates

## Files to Create/Modify

### New Files:

- `/tasks/subtasks/mcp-github-sse-error-diagnosis/config-analysis-report.md`

### Files to Examine (Read-Only Analysis):

1. `/src/scripts/modules/mcp/types.ts`
2. `/src/scripts/modules/mcp/http-client.ts`
3. `/src/scripts/modules/mcp/websocket-client.ts`
4. `/src/scripts/modules/mcp/client.ts`
5. `/test-github-mcp-http.ts`
6. `/.env.example`
7. `/package.json`

## Root Cause Hypothesis

Based on preliminary analysis, potential root causes for the 400 status code error:

1. **Authentication Issues:**
   - Missing or invalid `GITHUB_PERSONAL_ACCESS_TOKEN`
   - Incorrect Bearer token format in headers
   - Insufficient token permissions for GitHub Copilot API

2. **Server URL Problems:**
   - Incorrect GitHub Copilot MCP endpoint
   - Protocol mismatch (HTTP vs HTTPS)
   - Path configuration errors

3. **SSE Configuration Errors:**
   - EventSource not properly configured for GitHub's SSE implementation
   - Missing required headers for SSE connection
   - CORS issues with EventSource

4. **HTTP Client Misconfiguration:**
   - Incorrect request formatting
   - Missing required headers
   - Timeout settings causing premature connection closure

## Success Criteria

- [ ] All MCP configuration files analyzed and documented
- [ ] Configuration issues identified and categorized
- [ ] Root cause narrowed down to specific configuration problems
- [ ] Recommendations generated for each identified issue
- [ ] Configuration analysis report completed

## Dependencies

This task must be completed before:

- Task 02: Examine GitHub Integration Settings
- Task 04: Test MCP Connection Endpoints
- Task 07: Implement Comprehensive Diagnostics

## Next Steps

After completing this analysis:

1. Proceed to Task 02 to examine GitHub integration settings
2. Use findings to inform authentication token review in Task 03
3. Apply configuration fixes during endpoint testing in Task 04
