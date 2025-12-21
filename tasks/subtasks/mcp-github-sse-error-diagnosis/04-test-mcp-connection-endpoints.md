# Test MCP Connection Endpoints

## Objective

Test multiple MCP connection endpoints and authentication methods to identify the correct configuration that resolves 400 status code errors when connecting to GitHub's MCP server.

## Implementation Steps

### Step 1: Create Comprehensive Endpoint Testing Script

**File to Create:** `/test-mcp-endpoints.ts`

**Testing Requirements:**

1. **Multiple Endpoint URLs:**
   - `https://api.githubcopilot.com/`
   - `https://api.githubcopilot.com/mcp/`
   - `https://api.github.com/copilot/`
   - `https://copilot.github.com/`

2. **Multiple Authentication Methods:**
   - Bearer token in Authorization header
   - Token in query parameters
   - GitHub CLI authentication

3. **Multiple Connection Methods:**
   - EventSource (current implementation)
   - Fetch with streaming response
   - WebSocket fallback
   - Standard HTTP POST

### Step 2: Implement Token Validation

**Validation Requirements:**

```typescript
interface TokenValidation {
  isValid: boolean;
  format: "classic" | "fine-grained" | "invalid";
  prefix: string;
  length: number;
  expiresAt?: Date;
}

function validateGitHubToken(token?: string): TokenValidation;
```

### Step 3: Test Authentication Headers

**Header Combinations to Test:**

```typescript
const headerVariations = [
  { Authorization: `Bearer ${token}` },
  { Authorization: `token ${token}` },
  { "X-GitHub-Token": token },
  { "Copilot-Token": token },
  { "User-Agent": "LOFERSIL-MCP-Client/1.0.0" },
  { Accept: "application/vnd.github.v3+json" },
  { "Content-Type": "application/json" },
];
```

### Step 4: Test Connection Methods

**Method 1: EventSource (Current)**

```typescript
async function testEventSourceConnection(
  url: string,
  token: string,
): Promise<TestResult>;
```

**Method 2: Fetch Streaming (Recommended)**

```typescript
async function testFetchStreaming(
  url: string,
  token: string,
): Promise<TestResult>;
```

**Method 3: WebSocket (Alternative)**

```typescript
async function testWebSocketConnection(
  url: string,
  token: string,
): Promise<TestResult>;
```

**Method 4: Standard HTTP (Fallback)**

```typescript
async function testStandardHTTP(
  url: string,
  token: string,
): Promise<TestResult>;
```

### Step 5: Error Analysis and Classification

**Error Types to Identify:**

1. **Authentication Errors:** 401, 403
2. **Authorization Errors:** 403 with specific messages
3. **Endpoint Errors:** 404, 400 (Bad Request)
4. **Protocol Errors:** Connection refused, timeout
5. **CORS Errors:** Cross-origin restrictions

**Error Classification:**

```typescript
interface ErrorAnalysis {
  category: "auth" | "endpoint" | "protocol" | "scope" | "config";
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
  nextSteps: string[];
}
```

## Expected Outcomes

### Primary Goal: Identify Working Configuration

- [ ] Correct endpoint URL that accepts connections
- [ ] Working authentication method
- [ ] Proper connection protocol (HTTP/SSE vs WebSocket)
- [ ] Required headers and token format

### Secondary Goals:

- [ ] Comprehensive error analysis
- [ ] Recommended fixes for each issue found
- [ ] Diagnostic report with actionable steps
- [ ] Configuration that resolves 400 status code errors

## Root Cause Hypotheses to Test

### Hypothesis 1: EventSource Limitations

**Theory:** EventSource cannot send authentication headers, causing 400 errors

**Test:** Compare EventSource vs fetch streaming with same credentials

### Hypothesis 2: Incorrect Endpoint URL

**Theory:** Using wrong GitHub Copilot MCP endpoint

**Test:** Try multiple endpoint URLs to find working one

### Hypothesis 3: Token Format/Scope Issues

**Theory:** Wrong token format or missing required scopes

**Test:** Validate token format and test with different header formats

### Hypothesis 4: Missing Required Headers

**Theory:** GitHub MCP server requires specific headers

**Test:** Test various header combinations

## Files to Create/Modify

### New Files:

1. `/test-mcp-endpoints.ts` - Comprehensive endpoint testing script
2. `/tasks/subtasks/mcp-github-sse-error-diagnosis/endpoint-test-results.md` - Test results

### Files to Reference:

1. `/src/scripts/modules/mcp/http-client.ts` - Current implementation
2. `/test-github-mcp-http.ts` - Existing test configuration
3. `/.env.example` - Environment variable template

## Testing Script Implementation

### Script Structure:

```typescript
#!/usr/bin/env tsx

interface TestConfig {
  endpoints: string[];
  tokens: { name: string; value?: string }[];
  methods: ("eventsource" | "fetch-streaming" | "websocket" | "http")[];
  headers: Record<string, string>[];
}

interface TestResult {
  endpoint: string;
  method: string;
  token: string;
  status: "success" | "error" | "timeout";
  httpStatus?: number;
  error?: Error;
  responseTime: number;
  details: Record<string, any>;
}

async function main(): Promise<void> {
  // 1. Validate environment
  // 2. Test each configuration combination
  // 3. Analyze results
  // 4. Generate recommendations
  // 5. Output diagnostic report
}
```

### Test Matrix:

```
Endpoints: 4 variants
Tokens: 2-3 variants
Methods: 4 variants
Headers: 5 combinations
Total Tests: ~160-240 combinations
```

## Success Criteria

- [ ] All major GitHub Copilot endpoints tested
- [ ] Multiple authentication methods evaluated
- [ ] Working connection method identified
- [ ] Root cause of 400 errors isolated
- [ ] Recommended configuration provided
- [ ] Diagnostic report generated

## Dependencies

This task depends on:

- Task 01: MCP Configuration Analysis (COMPLETED)
- Task 02: GitHub Integration Settings (COMPLETED)
- Task 03: Authentication Tokens and Permissions (COMPLETED)

This task enables:

- Task 05: Analyze SSE Connection Implementation
- Task 06: Check Server-side Configuration
- Task 07: Implement Comprehensive Diagnostics

## Implementation Timeline

**Phase 1: Script Creation (30 minutes)**

- Create endpoint testing framework
- Implement token validation
- Add error handling and reporting

**Phase 2: Testing Execution (15 minutes)**

- Run comprehensive test matrix
- Collect and analyze results
- Identify working configurations

**Phase 3: Analysis and Recommendations (15 minutes)**

- Generate diagnostic report
- Create fix recommendations
- Document successful configuration

## Expected Findings

Based on previous analysis, likely outcomes:

1. **EventSource will fail** due to header limitations
2. **Fetch streaming will succeed** with correct authentication
3. **Correct endpoint** will be `https://api.githubcopilot.com/` (not `/mcp/`)
4. **Proper token format** will be `Bearer ghp_XXXXXXXXXX`

## Next Steps

After testing:

1. Implement the successful connection method
2. Update HTTP client configuration
3. Fix authentication token handling
4. Proceed to Task 05 for SSE analysis
