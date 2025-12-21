# Review Authentication Tokens and Permissions

## Objective

Analyze authentication token configuration, permissions, and validation to identify authentication-related causes of the 400 status code error when connecting to GitHub's MCP server.

## Implementation Steps

### Step 1: Examine Current Token Usage

**Files Analyzing Token Usage:**

- `/test-github-mcp-http.ts` - `process.env.GITHUB_PERSONAL_ACCESS_TOKEN`
- `/test-github-mcp-http.js` - `process.env.GITHUB_PERSONAL_ACCESS_TOKEN`
- `/test-github-mcp.ts` - `process.env.GITHUB_PERSONAL_ACCESS_TOKEN`
- `/src/scripts/modules/github-projects.ts` - GitHub API token usage
- `/src/scripts/modules/github-issues/` - GitHub Issues token usage

**Current Token Configuration:**

```typescript
// From test files
Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;

// From .env.example
GITHUB_ACCESS_TOKEN = your - github - personal - access - token;
```

### Step 2: Token Format and Validation Analysis

**Current Token Format Issues:**

1. **Environment Variable Mismatch:**
   - Tests use `GITHUB_PERSONAL_ACCESS_TOKEN`
   - .env.example uses `GITHUB_ACCESS_TOKEN`
   - No validation for token presence

2. **Token Format Validation Missing:**

   ```typescript
   // Current (problematic) usage:
   Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
   // Results in: "Bearer undefined" if token not set
   ```

3. **No Token Validation:**
   - No checks for token existence
   - No token format validation (ghp\_ prefix)
   - No token expiration checks

### Step 3: Required Token Scopes for GitHub Copilot MCP

**Critical Required Scopes:**

#### GitHub Copilot Specific Scopes:

```bash
copilot              # Access to GitHub Copilot features
copilot:read         # Read Copilot data
copilot:write        # Write Copilot data (if needed)
```

#### Repository Access Scopes:

```bash
repo                 # Full repository access
repo:status          # Commit status access
repo_deployment     # Deployment status access
public_repo         # Public repository access (if only public repos)
```

#### Organization and User Scopes:

```bash
read:org           # Read organization data
read:user          # Read user profile data
user               # Basic user information
```

#### Workflow and Actions Scopes:

```bash
workflow           # GitHub Actions workflow access
```

### Step 4: GitHub Copilot Authentication Methods

**Method 1: Personal Access Token (Recommended)**

```bash
# Create token with Copilot access
gh token create \
  --scopes "copilot,repo,read:org,read:user" \
  --note "LOFERSIL MCP Integration"
```

**Method 2: GitHub Copilot Token (Alternative)**

```bash
# Use GitHub CLI with Copilot extension
gh copilot login
# Token stored in GitHub CLI config
```

**Method 3: OAuth App (Production)**

```bash
# Create OAuth App for production use
# Requires web flow for authentication
```

### Step 5: Token Security Best Practices

**Security Requirements:**

1. **Token Storage:** Environment variables only
2. **Token Rotation:** Every 90 days maximum
3. **Token Scope Principle:** Minimum required scopes
4. **Token Validation:** Format and expiration checks
5. **Token Revocation:** Immediate revocation if compromised

### Step 6: Authentication Flow Analysis

**Current Authentication Flow:**

```typescript
// Current problematic flow
const client = new HTTPMCPClient({
  serverUrl: "https://api.githubcopilot.com/mcp/",
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
});
```

**Problems Identified:**

1. No token validation before connection
2. Empty Authorization header if token undefined
3. Wrong server URL (should not include `/mcp/`)
4. No error handling for authentication failures

## Critical Authentication Issues

### 1. **Token Environment Variable Mismatch** 🚨 CRITICAL

**Problem:** Tests use different variable than configuration

**Current Code:**

```typescript
// test-github-mcp-http.ts
Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;

// .env.example
GITHUB_ACCESS_TOKEN = your - github - personal - access - token;
```

**Fix Required:**

```typescript
// Standardize on one variable name
Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`;
```

### 2. **Missing Token Validation** 🚨 CRITICAL

**Problem:** No validation for token presence or format

**Current Code:**

```typescript
// Direct usage without validation
Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`;
```

**Fix Required:**

```typescript
function validateGitHubToken(token?: string): string {
  if (!token) {
    throw new Error("GitHub access token is required");
  }
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    throw new Error("Invalid GitHub token format");
  }
  return token;
}

const token = validateGitHubToken(process.env.GITHUB_ACCESS_TOKEN);
Authorization: `Bearer ${token}`;
```

### 3. **Incorrect Token Scopes** ⚠️ HIGH PRIORITY

**Problem:** Standard GitHub token may not include Copilot scope

**Required Fix:**

```bash
# Create new token with Copilot scope
gh token create \
  --scopes "copilot,repo,read:org,read:user" \
  --note "LOFERSIL Landing Page MCP Integration"
```

### 4. **No Token Expiration Handling** ⚠️ MEDIUM PRIORITY

**Problem:** No checks for token expiration

**Recommended Fix:**

```typescript
interface TokenInfo {
  token: string;
  expiresAt?: Date;
  scopes: string[];
}

function validateTokenExpiration(tokenInfo: TokenInfo): void {
  if (tokenInfo.expiresAt && tokenInfo.expiresAt < new Date()) {
    throw new Error("GitHub access token has expired");
  }
}
```

## Authentication Implementation Plan

### Step 1: Create Token Validation Module

```typescript
// src/scripts/modules/auth/github-token-validator.ts
export class GitHubTokenValidator {
  static validate(token?: string): string;
  static validateScopes(token: string, requiredScopes: string[]): boolean;
  static parseTokenInfo(token: string): TokenInfo;
}
```

### Step 2: Update Environment Configuration

```bash
# Add to .env.example
# GitHub Authentication
GITHUB_ACCESS_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GITHUB_TOKEN_SCOPES=copilot,repo,read:org,read:user
GITHUB_TOKEN_EXPIRES_AT=2025-03-20T00:00:00Z
```

### Step 3: Update Test Configuration

```typescript
// test-github-mcp-http.ts
const token = process.env.GITHUB_ACCESS_TOKEN;
if (!token) {
  throw new Error("GITHUB_ACCESS_TOKEN environment variable is required");
}

const client = new HTTPMCPClient({
  serverUrl: "https://api.githubcopilot.com/",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Step 4: Implement Token Rotation

```typescript
// Token rotation logic for production
export class TokenManager {
  static async refreshIfNeeded(): Promise<string>;
  static async rotateToken(): Promise<string>;
  static async validateToken(token: string): Promise<boolean>;
}
```

## Files to Create/Modify

### New Files:

1. `/src/scripts/modules/auth/github-token-validator.ts` - Token validation logic
2. `/src/scripts/modules/auth/token-manager.ts` - Token rotation and management
3. `/tests/unit/modules/auth/github-token-validator.test.ts` - Token validation tests

### Files to Modify:

1. `/test-github-mcp-http.ts` - Use standardized variable and validation
2. `/test-github-mcp-http.js` - Use standardized variable and validation
3. `/.env.example` - Add authentication environment variables
4. `/src/scripts/modules/mcp/http-client.ts` - Add token validation
5. `/src/scripts/modules/github-projects.ts` - Use token validator

## Success Criteria

- [ ] Token environment variable standardized across all files
- [ ] Token validation implemented for format and presence
- [ ] Required scopes identified and documented
- [ ] GitHub Copilot token with correct scopes obtained
- [ ] Authentication flow updated with proper error handling
- [ ] Token rotation strategy implemented
- [ ] Test files updated with correct authentication

## Dependencies

This task depends on:

- Task 01: MCP Configuration Analysis (COMPLETED)
- Task 02: GitHub Integration Settings (COMPLETED)

This task enables:

- Task 04: Test MCP Connection Endpoints
- Task 06: Server-side Configuration Check

## Immediate Actions Required

### Action 1: Create GitHub Token with Copilot Scope

```bash
# Create new token
gh token create \
  --scopes "copilot,repo,read:org,read:user" \
  --note "LOFERSIL MCP Integration - $(date)"
```

### Action 2: Update Environment Variables

```bash
# Set token in environment
export GITHUB_ACCESS_TOKEN="ghp_XXXXXXXXXXXXXXXXXXXXXXXX"

# Add to .env file
echo "GITHUB_ACCESS_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXX" >> .env
```

### Action 3: Update Test Files

Modify all test files to use `GITHUB_ACCESS_TOKEN` and implement validation.

## Root Cause Conclusion

The 400 status code error is primarily caused by:

1. **Authentication Token Issues:** Missing or invalid token
2. **Scope Mismatch:** Token lacks Copilot permissions
3. **Configuration Problems:** Wrong environment variable names

After implementing proper token validation and obtaining correct scopes, the 400 errors should be resolved.
