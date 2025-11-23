# AI-Powered GitHub Issues Reviewer Architecture

## Overview

An autonomous system that analyzes GitHub issues, generates solutions using AI agents, and creates pull requests for review. The system integrates OpenCode agents for analysis and review, Git worktrees for isolated development, and SWE-agent patterns for autonomous code generation.

## Core Components

### 1. Issue Intake & Analysis (`issue-analyzer`)

- **Purpose**: Analyze incoming GitHub issues and determine if they're suitable for autonomous resolution
- **Technology**: OpenCode agent with GitHub API access
- **Responsibilities**:
  - Parse issue content and categorize (bug, feature, documentation, etc.)
  - Assess complexity and feasibility for AI resolution
  - Extract requirements and acceptance criteria
  - Determine required tools and permissions

### 2. Worktree Manager (`worktree-manager`)

- **Purpose**: Create and manage isolated development environments per issue
- **Technology**: Git worktrees + wkit CLI integration
- **Responsibilities**:
  - Create worktree with unique branch name (e.g., `ai-fix/issue-123`)
  - Copy necessary files and configurations
  - Track worktree lifecycle and cleanup
  - Sync changes back to main branch

### 3. Autonomous Resolver (`swe-resolver`)

- **Purpose**: Generate code solutions using SWE-agent patterns
- **Technology**: SWE-agent inspired autonomous agent
- **Responsibilities**:
  - Analyze codebase structure and patterns
  - Generate solution using available tools (edit, bash, grep, etc.)
  - Test and validate changes
  - Handle complex multi-file modifications

### 4. Code Reviewer (`code-reviewer`)

- **Purpose**: Validate generated solutions and ensure code quality
- **Technology**: OpenCode agent with code analysis tools
- **Responsibilities**:
  - Review code changes for correctness
  - Check adherence to coding standards
  - Validate tests and documentation
  - Assess security implications

### 5. PR Generator (`pr-generator`)

- **Purpose**: Create and submit pull requests with proper documentation
- **Technology**: GitHub API + OpenCode agent for PR content
- **Responsibilities**:
  - Generate meaningful commit messages
  - Create comprehensive PR descriptions
  - Link back to original issue
  - Request appropriate reviewers

### 6. Workflow Orchestrator (`orchestrator`)

- **Purpose**: Coordinate the entire resolution pipeline
- **Technology**: Custom workflow engine with error recovery
- **Responsibilities**:
  - Manage state transitions between components
  - Handle failures and retries
  - Track progress and metrics
  - Coordinate cleanup operations

## Data Flow

```
GitHub Issue Webhook
        ↓
   Issue Analyzer
        ↓
  Worktree Creation
        ↓
   SWE Resolver
        ↓
  Code Reviewer
        ↓
    PR Generator
        ↓
   GitHub PR Created
```

## Configuration Structure

```json
{
  "github": {
    "token": "${GITHUB_TOKEN}",
    "repositories": ["owner/repo"],
    "webhook_secret": "${WEBHOOK_SECRET}"
  },
  "opencode": {
    "config_path": "./opencode-config.json",
    "agents": {
      "issue-analyzer": {
        "model": "claude-sonnet-4-20250514",
        "temperature": 0.1,
        "tools": ["github-api", "grep", "read"]
      },
      "code-reviewer": {
        "model": "claude-sonnet-4-20250514",
        "temperature": 0.2,
        "tools": ["edit", "bash", "test-runner"]
      }
    }
  },
  "worktrees": {
    "root": ".git/ai-worktrees",
    "auto_cleanup": true,
    "sync_strategy": "merge"
  },
  "swe_agent": {
    "model": "claude-sonnet-4-20250514",
    "max_iterations": 10,
    "cost_limit": 5.0,
    "tools": ["edit", "bash", "grep", "run-tests"]
  }
}
```

## Error Handling & Recovery

### Circuit Breakers

- Per-component failure thresholds
- Automatic backoff and retry logic
- Manual intervention triggers for complex issues

### Rollback Mechanisms

- Worktree isolation prevents main branch pollution
- Failed resolutions can be abandoned without impact
- Partial solutions can be saved for human review

### Monitoring & Alerting

- Success/failure metrics per issue type
- Performance tracking for each component
- Alert thresholds for system health

## Security Considerations

### Access Control

- Read-only GitHub access for analysis
- Scoped permissions for code modifications
- Sandboxed execution environments

### Code Review Requirements

- All AI-generated changes require human review
- Critical security issues flagged for immediate attention
- Audit trail of all agent actions

## Deployment Architecture

### Local Development

- Single-machine deployment for testing
- Direct file system access
- Simplified GitHub webhook simulation

### Production Deployment

- Containerized components
- Kubernetes orchestration
- External GitHub webhook handling
- Database for state persistence

## Integration Points

### GitHub Integration

- Webhook handling for issue events
- API access for repository operations
- PR creation and management

### OpenCode Integration

- Agent configuration and management
- Tool execution and result processing
- Multi-agent coordination

### External Tools

- Git worktrees for isolation
- Testing frameworks for validation
- Linting tools for code quality</content>
  <parameter name="filePath">architecture-design.md
