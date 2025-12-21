# OpenCode GitHub MCP Implementation Guide

**Based on Context7 Documentation & Project Analysis**  
**Date:** December 21, 2025  
**Environment:** LOFERSIL-Landing-Page Project

## Executive Summary

This document provides a comprehensive guide for implementing GitHub MCP (Model Context Protocol) integration in OpenCode projects, using the official GitHub MCP server with proper PAT authentication and configuration best practices.

## Prerequisites

### ✅ Environment Setup Verified

- `.env` file exists in project root (1665 bytes)
- GitHub PAT token configured in environment variables
- Node.js v22.21.1 environment ready

### Required PAT Scopes

For full GitHub MCP functionality, ensure your Personal Access Token has these scopes:

- `repo` - Repository access (read/write)
- `read:user` - User profile access
- `copilot` - GitHub Copilot integration
- `issues` - Issue management
- `pull_requests` - PR operations

## Implementation Options

### 1. Remote HTTP Server (Recommended for Production)

**Configuration for OpenCode (`~/.kiro/settings/mcp.json`):**

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}",
        "GITHUB_TOOLSETS": "repos,issues,pull_requests,actions,code_security"
      }
    }
  }
}
```

**Advantages:**

- ✅ No local server maintenance
- ✅ Official GitHub infrastructure
- ✅ Automatic updates and security patches
- ✅ Optimized for GitHub Copilot integration

### 2. Docker Local Server (Recommended for Development)

**Configuration for OpenCode:**

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e",
        "GITHUB_TOOLSETS",
        "ghcr.io/github/github-mcp-server:latest"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}",
        "GITHUB_TOOLSETS": "repos,issues,pull_requests,actions,code_security"
      }
    }
  }
}
```

**Advantages:**

- ✅ Full control over server version
- ✅ Custom tool selection possible
- ✅ Better debugging capabilities
- ✅ Offline development possible

### 3. Custom OpenCode Integration

**For the LOFERSIL-Landing-Page project, implement this pattern:**

```typescript
// src/scripts/modules/mcp/github-client.ts
import { MCPClient } from "./client.js";

export class GitHubMCPClient extends MCPClient {
  constructor() {
    super({
      serverUrl: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      tools: [
        "get_file_contents",
        "create_issue",
        "list_repositories",
        "pull_request_read",
        "search_repositories",
      ],
    });
  }

  async createRepositoryIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
  ) {
    return this.callTool("create_issue", {
      owner,
      repo,
      title,
      body: body || "",
    });
  }

  async getFileContents(owner: string, repo: string, path: string) {
    return this.callTool("get_file_contents", {
      owner,
      repo,
      path,
    });
  }

  async listUserRepositories(username: string) {
    return this.callTool("list_repositories", {
      username,
    });
  }
}
```

## Available GitHub MCP Tools

### Core Repository Operations

- `get_file_contents` - Read repository files
- `list_repositories` - List user/organization repositories
- `search_repositories` - Search GitHub repositories
- `get_repository` - Get repository details

### Issue Management

- `create_issue` - Create new issues
- `list_issues` - List repository issues
- `update_issue` - Update existing issues
- `close_issue` - Close issues

### Pull Request Operations

- `pull_request_read` - Read PR details
- `create_pull_request` - Create new PRs
- `list_pull_requests` - List repository PRs
- `merge_pull_request` - Merge PRs

### Code Security & Analysis

- `code_security_scan` - Run security scans
- `get_codeql_analysis` - Get CodeQL results
- `list_dependabot_alerts` - Get security alerts

### Actions & Workflows

- `list_workflow_runs` - List GitHub Actions runs
- `trigger_workflow` - Trigger workflows
- `get_workflow_logs` - Get execution logs

## Environment Configuration

### Required Environment Variables

```bash
# Required for authentication
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here

# Optional: Tool selection (comma-separated)
GITHUB_TOOLSETS=repos,issues,pull_requests,actions,code_security

# Optional: GitHub Enterprise (if applicable)
GITHUB_ENTERPRISE_URL=https://your-github-enterprise.com
```

### Toolsets Configuration

```bash
# Minimal set
export GITHUB_TOOLSETS="repos,issues"

# Full set
export GITHUB_TOOLSETS="repos,issues,pull_requests,actions,code_security"

# Custom selection
export GITHUB_TOOLSETS="get_file_contents,create_issue,pull_request_read"
```

## OpenCode Integration Steps

### Step 1: Update MCP Configuration

```bash
# Edit OpenCode settings
nano ~/.kiro/settings/mcp.json

# Add GitHub server configuration
# (See examples above)
```

### Step 2: Set Environment Variables

```bash
# Verify token is set
echo $GITHUB_PERSONAL_ACCESS_TOKEN

# Test token permissions
curl -H "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user
```

### Step 3: Restart OpenCode

```bash
# Restart to load new MCP configuration
# OpenCode will automatically detect and load GitHub MCP server
```

### Step 4: Test Integration

```typescript
// Test GitHub MCP functionality
import { GitHubMCPClient } from "./src/scripts/modules/mcp/github-client.js";

const client = new GitHubMCPClient();

// Test repository listing
const repos = await client.listUserRepositories("pedroocalado");
console.log("Repositories:", repos);

// Test issue creation
const issue = await client.createRepositoryIssue(
  "pedroocalado",
  "LOFERSIL-Landing-Page",
  "Test MCP Integration",
  "Testing GitHub MCP server integration",
);
console.log("Created issue:", issue);
```

## Best Practices

### Security

- ✅ **Never commit PAT tokens** to repositories
- ✅ **Use least-privilege scopes** for your use case
- ✅ **Rotate tokens regularly** (every 90 days recommended)
- ✅ **Store tokens securely** in environment variables only

### Performance Optimization

```json
{
  "headers": {
    "X-MCP-Tools": "get_file_contents,create_issue,list_repositories"
  }
}
```

### Error Handling

```typescript
import { ErrorManager } from "../ErrorManager.js";

export class GitHubMCPClient extends MCPClient {
  async callTool(toolName: string, args: any) {
    try {
      return await super.callTool(toolName, args);
    } catch (error) {
      ErrorManager.log("GitHub MCP Error", {
        tool: toolName,
        args,
        error: error.message,
      });
      throw error;
    }
  }
}
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Authentication Errors

**Symptom:** `401 Unauthorized` or token invalid  
**Solution:** Verify PAT scopes and token validity

#### 2. Connection Timeouts

**Symptom:** MCP server not responding  
**Solution:** Check network connectivity and server URL

#### 3. Tool Not Available

**Symptom:** `Tool not found` errors  
**Solution:** Verify `GITHUB_TOOLSETS` configuration

#### 4. Rate Limiting

**Symptom:** `403 Rate limit exceeded`  
**Solution:** Implement exponential backoff, reduce API calls

### Diagnostic Commands

```bash
# Test GitHub API connectivity
curl -I https://api.githubcopilot.com/mcp/

# Verify MCP server health
node -e "
const https = require('https');
https.get('https://api.githubcopilot.com/mcp/', (res) => {
  console.log('MCP Server Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
"

# Check OpenCode MCP configuration
cat ~/.kiro/settings/mcp.json | jq .
```

## Implementation Roadmap

### Phase 1: Basic Integration (Week 1)

- [ ] Set up remote GitHub MCP server
- [ ] Implement basic repository operations
- [ ] Add error handling and logging

### Phase 2: Advanced Features (Week 2)

- [ ] Add issue management tools
- [ ] Implement PR operations
- [ ] Add security scanning capabilities

### Phase 3: Optimization (Week 3)

- [ ] Performance tuning and caching
- [ ] Rate limiting implementation
- [ ] Monitoring and metrics

### Phase 4: Custom Tools (Week 4)

- [ ] Develop custom OpenCode-specific tools
- [ ] Integrate with existing project workflows
- [ ] Add automated testing

## Resources

### Official Documentation

- [GitHub MCP Server Repository](https://github.com/github/github-mcp-server)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [OpenCode Documentation](https://docs.opencode.ai/)

### Community Resources

- [MCP Server Directory](https://github.com/camel-ai/mcp-hub)
- [GitHub MCP Examples](https://github.com/github/github-mcp-server/tree/main/examples)

### Support

- [GitHub Issues](https://github.com/github/github-mcp-server/issues)
- [OpenCode Community](https://community.opencode.ai/)
- [MCP Discord](https://discord.gg/modelcontextprotocol)

---

**Implementation Status:** Ready for deployment  
**Next Steps:** Follow Phase 1 integration steps, test with your existing PAT token, and validate functionality.
