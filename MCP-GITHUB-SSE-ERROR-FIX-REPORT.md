# MCP GitHub SSE Error - DIAGNOSIS AND SOLUTION REPORT

## 🔍 Problem Diagnosis

The MCP server GitHub SSE connection was failing with a **400 status code error**: "Accept must contain both 'application/json' and 'text/event-stream'"

## 🎯 Root Cause Analysis

Through systematic diagnostic testing, I identified:

1. **GitHub API Access**: ✅ Working
   - User: SilentCaMXMF (Pedro Calado)
   - Token: Valid and properly authenticated

2. **Environment Setup**: ✅ Working
   - `GITHUB_PERSONAL_ACCESS_TOKEN` is properly set
   - Environment variables are configured correctly

3. **GitHub Copilot MCP Endpoint**: ❌ **ISSUE IDENTIFIED**
   - Endpoint URL: `https://api.githubcopilot.com/mcp/` ✅ Correct
   - Authentication: ✅ Working
   - **Headers**: ❌ **MISSING REQUIRED HEADER**

The GitHub Copilot MCP server **requires** the Accept header to include both:

- `application/json` (for JSON-RPC responses)
- `text/event-stream` (for Server-Sent Events)

Original code only had: `Accept: 'application/json'`

## ✅ Solution Implemented

### Fix Applied

Updated the HTTP MCP client in `/src/scripts/modules/mcp/http-client.js`:

**Before:**

```javascript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',  // ❌ Missing text/event-stream
  'Authorization': this.config.headers?.Authorization || '',
  ...(this.config.headers || {}),
}
```

**After:**

```javascript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',  // ✅ Both required formats
  'Authorization': this.config.headers?.Authorization || '',
  ...(this.config.headers || {}),
}
```

### Verification Results

1. **Old Headers**: ❌ 400 Bad Request - "Accept must contain both 'application/json' and 'text/event-stream'"
2. **Fixed Headers**: ✅ 200 OK - Connection established successfully

The server now responds with Server-Sent Events format containing the JSON-RPC response.

## 🛠️ Technical Details

### Why Both Headers Are Required

- **GitHub Copilot MCP** uses a hybrid communication protocol:
  - Initial requests via HTTP POST (JSON)
  - Real-time responses via Server-Sent Events (SSE)
  - The server needs to negotiate both content types from the start

### Response Format

The server responds with SSE format:

```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"capabilities":{"completions":{},"prompts":{},"resources":{},"tools":{}}...}}
```

## 📋 Additional Findings

### 1. HTTP Client File Issues

The `http-client.js` file had syntax errors that were fixed:

- Removed duplicate `sendRequest` method
- Fixed incomplete method implementations
- Resolved corrupted code blocks

### 2. Token Validation

- GitHub Personal Access Token is valid and working
- User has proper GitHub Copilot access
- Token has required permissions

### 3. Diagnostic Tools Created

1. `simple-mcp-diagnostic.js` - Comprehensive diagnostic tool
2. `test-mcp-headers-fix.js` - Specific header fix validation
3. `mcp-diagnostic-tool.js` - Full-featured diagnostic (needs ErrorManager fix)

## 🚀 Next Steps

### Immediate Actions

1. ✅ **FIXED**: Updated HTTP client headers
2. ✅ **FIXED**: Resolved syntax errors in HTTP client
3. ✅ **VERIFIED**: Connection works with correct headers

### Testing

Run the following to verify the fix:

```bash
source .env && GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN" node test-mcp-headers-fix.js
```

### Integration Testing

Update any existing MCP integration tests to use the new HTTP client with proper headers.

## 💡 Recommendations

### For Production

1. **Monitor SSE connections**: Implement proper SSE parsing and event handling
2. **Error handling**: Add robust error handling for SSE stream disconnections
3. **Connection pooling**: Consider connection management for multiple MCP clients

### For Development

1. **Use diagnostic tools**: The diagnostic tools created can help troubleshoot future MCP issues
2. **Documentation**: Document the header requirement in MCP client documentation
3. **Testing**: Include header validation in automated tests

## 🎉 Resolution Summary

**STATUS**: ✅ **RESOLVED**

The MCP GitHub SSE 400 error has been successfully fixed by:

1. **Identifying** the exact header requirement through systematic testing
2. **Fixing** the Accept header to include both required content types
3. **Verifying** the solution works with live testing
4. **Documenting** the solution for future reference

The MCP server should now connect successfully without 400 status code errors.
