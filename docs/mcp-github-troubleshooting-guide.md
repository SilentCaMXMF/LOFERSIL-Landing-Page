# MCP GitHub Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [Diagnostic Tools](#diagnostic-tools)
3. [Error Resolution Procedures](#error-resolution-procedures)
4. [Performance Issues](#performance-issues)
5. [Authentication Problems](#authentication-problems)
6. [Network & Firewall Issues](#network--firewall-issues)
7. [Debugging Techniques](#debugging-techniques)

---

## Common Issues

### 1. HTTP 400 Bad Request

**Symptoms**:

```
Error: Non-200 status code (400) not connecting
"Accept must contain both 'application/json' and 'text/event-stream'"
```

**Root Cause**: Missing `text/event-stream` in Accept header

**Solution**:

```javascript
// Ensure both content types are included
headers: {
  'Accept': 'application/json, text/event-stream',  // BOTH required
  'Content-Type': 'application/json',
  'Authorization': `token ${token}`,
}
```

**Verification**:

```bash
curl -H "Accept: application/json, text/event-stream" \
     -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.githubcopilot.com/mcp/
```

### 2. EventSource Not Available in Node.js

**Symptoms**:

```
ReferenceError: EventSource is not defined
TypeError: Cannot read property 'EventSource' of undefined
```

**Root Cause**: EventSource is browser-only API

**Solution**: Replace with fetch-based streaming

```javascript
// Old (Node.js incompatible)
const eventSource = new EventSource(url);

// New (Node.js compatible)
const response = await fetch(url, {
  headers: { Accept: "text/event-stream" },
});
const reader = response.body?.getReader();
```

### 3. Authentication Failures

**Symptoms**:

```
HTTP 401 Unauthorized
HTTP 403 Forbidden
```

**Solutions**:

#### Check Token Validity

```bash
# Test token against GitHub API
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user

# Check token scopes
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user/scopes
```

#### Verify Token Format

```javascript
// GitHub tokens start with 'ghp_' and are 40 characters
function validateToken(token) {
  return /^ghp_[A-Za-z0-9]{36}$/.test(token);
}
```

#### Required Scopes

- `copilot` - Access to GitHub Copilot API
- `read:user` - Read user profile information
- `repo` - Access to repository data

### 4. Connection Timeouts

**Symptoms**:

```
Error: Request timeout
Error: ETIMEDOUT
```

**Solutions**:

```javascript
// Increase timeout
const config = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
};

// Implement retry logic
async function connectWithRetry(client, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.connect();
      return; // Success
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

---

## Diagnostic Tools

### 1. Simple Diagnostic Tool

```bash
# Run comprehensive diagnostic
node simple-mcp-diagnostic.js

# Example output:
# ✅ Environment Variables: Configured
# ✅ Token Format: Valid
# ✅ GitHub API Access: Working
# ✅ MCP Endpoint: Accessible
# ❌ Accept Headers: Missing text/event-stream
```

### 2. Header-Specific Test

```bash
# Test Accept header configuration
node test-mcp-headers-fix.js

# Expected success:
# Response Status: 200 OK
# Content-Type: text/event-stream
# SSE Messages: Receiving
```

### 3. Connection Health Monitor

```javascript
class MCPHealthChecker {
  async runFullDiagnostic() {
    const results = {
      environment: await this.checkEnvironment(),
      authentication: await this.checkAuthentication(),
      connectivity: await this.checkConnectivity(),
      streaming: await this.checkStreaming(),
    };

    console.table(results);
    return results;
  }

  async checkEnvironment() {
    return {
      tokenPresent: !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      tokenValid: this.validateToken(process.env.GITHUB_PERSONAL_ACCESS_TOKEN),
      serverUrlConfigured: !!process.env.MCP_SERVER_URL,
    };
  }

  async checkAuthentication() {
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        },
      });
      return {
        status: response.status,
        authenticated: response.ok,
        scopes: response.headers.get("X-OAuth-Scopes"),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async checkConnectivity() {
    try {
      const response = await fetch("https://api.githubcopilot.com/mcp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
        }),
      });
      return {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async checkStreaming() {
    try {
      const response = await fetch("https://api.githubcopilot.com/mcp/", {
        headers: {
          Accept: "text/event-stream",
          Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        },
      });
      return {
        status: response.status,
        streaming: response.ok,
        contentType: response.headers.get("content-type"),
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}
```

---

## Error Resolution Procedures

### Procedure 1: Fix HTTP 400 Errors

#### Step 1: Verify Current Headers

```javascript
// Log current headers
console.log("Current headers:", {
  "Content-Type": "application/json",
  Accept: "application/json", // ❌ This is the problem
  Authorization: `token ${token}`,
});
```

#### Step 2: Apply Fix

```javascript
// Update headers to include both content types
const fixedHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream", // ✅ Fixed
  Authorization: `token ${token}`,
};
```

#### Step 3: Test Fix

```bash
# Test the fix
curl -H "Accept: application/json, text/event-stream" \
     -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.githubcopilot.com/mcp/
```

#### Step 4: Verify Success

- Should receive `200 OK` instead of `400 Bad Request`
- Should receive SSE formatted responses
- Connection should establish without errors

### Procedure 2: Fix EventSource Issues

#### Step 1: Identify EventSource Usage

```bash
# Search for EventSource usage
grep -r "new EventSource" src/
```

#### Step 2: Replace with Fetch Streaming

```javascript
// Find this pattern:
const eventSource = new EventSource(url);

// Replace with:
const response = await fetch(url, {
  headers: { Accept: "text/event-stream" },
});
const reader = response.body?.getReader();
```

#### Step 3: Update Event Handling

```javascript
// Old EventSource event handling
eventSource.addEventListener("message", (event) => {
  console.log(event.data);
});

// New fetch streaming handling
async function processStream(reader) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data && data !== "[DONE]") {
          console.log(data);
        }
      }
    }
  }
}
```

### Procedure 3: Fix Authentication Issues

#### Step 1: Verify Token

```bash
# Check if token is set
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# Validate token format
if [[ ! $GITHUB_PERSONAL_ACCESS_TOKEN =~ ^ghp_[A-Za-z0-9]{36}$ ]]; then
  echo "❌ Invalid token format"
else
  echo "✅ Token format valid"
fi
```

#### Step 2: Test Token Against GitHub API

```bash
# Test basic authentication
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user

# Check token scopes
curl -i -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user/scopes
```

#### Step 3: Verify Required Scopes

```bash
# Required scopes: copilot, read:user, repo
# Check if token has required scopes
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user/scopes | grep -E "(copilot|read:user|repo)"
```

---

## Performance Issues

### 1. Slow Connection Establishment

**Symptoms**: Connection takes >10 seconds to establish

**Causes & Solutions**:

#### Network Latency

```javascript
// Add connection timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === "AbortError") {
    console.error("Connection timeout");
  }
}
```

#### Large Response Data

```javascript
// Stream responses instead of loading all at once
const response = await fetch(url, {
  headers: { Accept: "text/event-stream" },
});

const reader = response.body?.getReader();
// Process data in chunks as it arrives
```

### 2. Memory Leaks

**Symptoms**: Memory usage increases over time

**Causes & Solutions**:

#### Unclosed Connections

```javascript
class MCPClient {
  private readers: ReadableStreamDefaultReader[] = [];

  async connect() {
    const reader = response.body?.getReader();
    this.readers.push(reader);

    // Clean up on disconnect
    this.addCleanupHandler(() => {
      reader.releaseLock();
    });
  }

  async disconnect() {
    // Release all readers
    for (const reader of this.readers) {
      reader.releaseLock();
    }
    this.readers = [];
  }
}
```

#### Event Listener Accumulation

```javascript
// Remove event listeners when done
const handler = (event) => console.log(event.data);
eventSource.addEventListener("message", handler);

// Cleanup later
eventSource.removeEventListener("message", handler);
```

---

## Authentication Problems

### 1. Token Expiration

**Symptoms**: Authentication suddenly fails

**Solution**: Token rotation mechanism

```javascript
class TokenManager {
  private tokenExpiry: Date | null = null;

  async getValidToken(): Promise<string> {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

    if (!this.isTokenValid(token)) {
      throw new Error('Token expired or invalid');
    }

    return token;
  }

  private isTokenValid(token: string): boolean {
    // Check if token format is valid
    if (!/^ghp_[A-Za-z0-9]{36}$/.test(token)) {
      return false;
    }

    // Check expiry if set
    if (this.tokenExpiry && new Date() > this.tokenExpiry) {
      return false;
    }

    return true;
  }
}
```

### 2. Insufficient Scopes

**Symptoms**: 403 Forbidden on specific endpoints

**Solution**: Verify and request required scopes

```bash
# Check current scopes
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user/scopes

# Required for MCP:
# - copilot: Access GitHub Copilot API
# - read:user: Read user profile
# - repo: Access repository data
```

### 3. Environment Variable Issues

**Symptoms**: Token not found or undefined

**Solution**: Environment validation

```javascript
function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required variables
  const required = ['GITHUB_PERSONAL_ACCESS_TOKEN', 'MCP_SERVER_URL'];
  for (const variable of required) {
    if (!process.env[variable]) {
      errors.push(`${variable} is not set`);
    }
  }

  // Validate token format
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (token && !/^ghp_[A-Za-z0-9]{36}$/.test(token)) {
    errors.push('GITHUB_PERSONAL_ACCESS_TOKEN has invalid format');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Network & Firewall Issues

### 1. Corporate Firewall Blocking

**Symptoms**: Connection refused or timeout

**Solutions**:

#### Test Basic Connectivity

```bash
# Test if you can reach GitHub
curl -I https://api.githubcopilot.com

# Test specific port
telnet api.githubcopilot.com 443
```

#### Configure Proxy (if needed)

```javascript
// For environments requiring proxy
const httpsProxyAgent = require("https-proxy-agent");

const agent = new httpsProxyAgent("http://proxy.company.com:8080");

const response = await fetch(url, {
  agent: agent,
  // ... other options
});
```

### 2. DNS Resolution Issues

**Symptoms**: Name resolution failures

**Solutions**:

#### Test DNS Resolution

```bash
# Test DNS resolution
nslookup api.githubcopilot.com
dig api.githubcopilot.com

# Test with alternative DNS
nslookup api.githubcopilot.com 8.8.8.8
```

#### Use IP Address (fallback)

```javascript
// As a last resort, use IP directly
const fallbackUrl = "https://140.82.112.6/mcp/"; // GitHub's IP
```

---

## Debugging Techniques

### 1. Enable Verbose Logging

```javascript
// Create debug logger
class MCPDebugger {
  constructor(private enabled = process.env.MCP_DEBUG === 'true') {}

  log(method: string, message: any, data?: any) {
    if (!this.enabled) return;

    console.log(`[MCP:${method}] ${message}`);
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  }

  logRequest(url: string, headers: Record<string, string>, body?: any) {
    this.log('REQUEST', `POST ${url}`, { headers, body });
  }

  logResponse(status: number, headers: Record<string, string>, body?: any) {
    this.log('RESPONSE', `${status}`, { headers, body });
  }
}

// Usage
const debugger = new MCPDebugger();
debugger.logRequest(url, headers, body);
```

### 2. Network Traffic Analysis

```javascript
// Intercept fetch for debugging
const originalFetch = global.fetch;
global.fetch = async (...args) => {
  const [url, options = {}] = args;

  console.log("🌐 Fetch Request:", {
    url,
    method: options.method || "GET",
    headers: options.headers,
  });

  const response = await originalFetch(...args);

  console.log("🌐 Fetch Response:", {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  });

  return response;
};
```

### 3. Step-by-Step Connection Debugging

```javascript
async function debugConnection() {
  console.log("🔍 Starting MCP connection debug...");

  // Step 1: Check environment
  console.log("\n📋 Environment Check:");
  const envCheck = validateEnvironment();
  console.log(envCheck);
  if (!envCheck.valid) {
    console.error("❌ Environment validation failed");
    return;
  }

  // Step 2: Test basic GitHub API
  console.log("\n🔐 Authentication Test:");
  try {
    const authResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      },
    });
    console.log(`✅ GitHub API: ${authResponse.status}`);
  } catch (error) {
    console.error("❌ GitHub API failed:", error.message);
    return;
  }

  // Step 3: Test MCP endpoint
  console.log("\n🔌 MCP Endpoint Test:");
  try {
    const mcpResponse = await fetch("https://api.githubcopilot.com/mcp/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
      }),
    });

    console.log(`✅ MCP Endpoint: ${mcpResponse.status}`);

    if (mcpResponse.ok) {
      console.log("\n🎉 Connection successful!");
    } else {
      console.error("❌ MCP connection failed");
      const errorText = await mcpResponse.text();
      console.error("Error details:", errorText);
    }
  } catch (error) {
    console.error("❌ MCP endpoint failed:", error.message);
  }
}

// Run debug
debugConnection();
```

### 4. Real-time Connection Monitoring

```javascript
class ConnectionMonitor {
  private metrics = {
    attempts: 0,
    successes: 0,
    failures: 0,
    lastSuccess: null as Date | null,
    lastFailure: null as Date | null,
  };

  recordAttempt() {
    this.metrics.attempts++;
  }

  recordSuccess() {
    this.metrics.successes++;
    this.metrics.lastSuccess = new Date();
    this.logStatus();
  }

  recordFailure(error: Error) {
    this.metrics.failures++;
    this.metrics.lastFailure = new Date();
    console.error('Connection failed:', error.message);
    this.logStatus();
  }

  private logStatus() {
    const successRate = ((this.metrics.successes / this.metrics.attempts) * 100).toFixed(1);
    console.log(`📊 Connection Stats: ${successRate}% success rate (${this.metrics.successes}/${this.metrics.attempts})`);
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: ((this.metrics.successes / this.metrics.attempts) * 100).toFixed(1) + '%',
    };
  }
}
```

---

## Quick Reference

### Essential Fixes

1. **Headers Fix**: `Accept: 'application/json, text/event-stream'`
2. **EventSource Replacement**: Use fetch-based streaming
3. **Token Validation**: Check format and scopes
4. **Environment Setup**: Proper `.env` configuration

### Debug Commands

```bash
# Run diagnostic
node simple-mcp-diagnostic.js

# Test headers
node test-mcp-headers-fix.js

# Check token
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user

# Test MCP endpoint
curl -H "Accept: application/json, text/event-stream" \
     -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.githubcopilot.com/mcp/
```

### Environment Template

```bash
# Required for MCP GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
GITHUB_ACCESS_TOKEN=${GITHUB_PERSONAL_ACCESS_TOKEN}
MCP_SERVER_URL=https://api.githubcopilot.com/mcp/

# Optional for debugging
MCP_DEBUG=true
MCP_TIMEOUT=30000
MCP_RETRY_ATTEMPTS=3
```

This troubleshooting guide provides comprehensive procedures for resolving all common MCP GitHub integration issues.
