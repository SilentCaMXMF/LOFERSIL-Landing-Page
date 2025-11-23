# AI-Powered GitHub Issues Reviewer

**Note: This feature has been removed as it was not needed for the landing page functionality.**

This was previously an autonomous system that analyzed GitHub issues, generated solutions using AI agents, and created pull requests for review.

## Overview

The GitHub Issues Reviewer uses a multi-agent architecture to:

1. **Analyze** incoming GitHub issues for feasibility
2. **Generate** code solutions using AI
3. **Review** generated code for quality and security
4. **Create** pull requests with comprehensive documentation

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  IssueAnalyzer  │ -> │  SWEResolver    │ -> │  CodeReviewer   │
│                 │    │                 │    │                 │
│ • Categorizes   │    │ • Generates     │    │ • Validates     │
│ • Assesses      │    │ • Tests         │    │ • Reviews       │
│ • Filters       │    │ • Implements    │    │ • Approves      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        v                       v                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ WorktreeManager │    │WorkflowOrchestr│    │ Monitoring      │
│                 │    │ator             │    │ System          │
│ • Isolates      │    │                 │    │                 │
│ • Manages       │    │ • Coordinates   │    │ • Metrics       │
│ • Cleans up     │    │ • Handles       │    │ • Alerts        │
│                 │    │   errors        │    │ • Health        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

```
GitHub Issue Webhook
        ↓
   Issue Analysis
        ↓
  Feasibility Check
        ↓
 Worktree Creation
        ↓
  Code Generation
        ↓
   Code Review
        ↓
  PR Creation
        ↓
   GitHub PR
```

## Quick Start

### Prerequisites

- Node.js 18+
- Git
- GitHub repository access
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lofersil-landing-page

# Install dependencies
npm install

# Set environment variables
export GITHUB_TOKEN=your_github_token
export GITHUB_REPOSITORY=owner/repo
export OPENAI_API_KEY=your_openai_key
```

### Basic Usage

```typescript
import { WorkflowOrchestrator } from './src/scripts/modules/WorkflowOrchestrator';

// Initialize the orchestrator
const orchestrator = new WorkflowOrchestrator({
  githubToken: process.env.GITHUB_TOKEN,
  repository: process.env.GITHUB_REPOSITORY,
  openaiApiKey: process.env.OPENAI_API_KEY,
});

// Process an issue
const result = await orchestrator.executeWorkflow(123);

if (result.success) {
  console.log(`✅ Issue #${result.issueId} processed successfully`);
  console.log(`🔗 PR created: ${result.prUrl}`);
} else {
  console.log(`❌ Processing failed: ${result.error}`);
}
```

## Configuration

### Environment Variables

| Variable            | Description                     | Required |
| ------------------- | ------------------------------- | -------- |
| `GITHUB_TOKEN`      | GitHub personal access token    | Yes      |
| `GITHUB_REPOSITORY` | Repository in owner/repo format | Yes      |
| `OPENAI_API_KEY`    | OpenAI API key                  | Yes      |
| `GITHUB_API_URL`    | Custom GitHub API URL           | No       |
| `OPENAI_MODEL`      | OpenAI model to use             | No       |
| `WORKTREE_ROOT_DIR` | Worktree storage directory      | No       |

### Configuration File

Create a `github-issues-reviewer.config.json`:

```json
{
  "github": {
    "token": "your-token",
    "repository": "owner/repo",
    "timeout": 30000,
    "maxRetries": 3
  },
  "openai": {
    "apiKey": "your-key",
    "model": "gpt-4",
    "temperature": 0.2
  },
  "worktrees": {
    "rootDir": ".git/ai-worktrees",
    "autoCleanup": true,
    "mainBranch": "main"
  },
  "issueAnalysis": {
    "complexityThresholds": {
      "low": 50,
      "medium": 200,
      "high": 500
    }
  },
  "codeGeneration": {
    "maxIterations": 10,
    "costLimit": 5.0
  },
  "codeReview": {
    "strictMode": true,
    "securityChecks": true
  },
  "workflow": {
    "maxRetries": 3,
    "timeout": 1800000,
    "enableMetrics": true
  },
  "monitoring": {
    "enableMetrics": true,
    "alertThresholds": {
      "failureRate": 0.5,
      "averageDuration": 3600000
    }
  }
}
```

## Component APIs

### IssueAnalyzer

Analyzes GitHub issues for autonomous resolution feasibility.

```typescript
import { IssueAnalyzer } from './src/scripts/modules/IssueAnalyzer';

const analyzer = new IssueAnalyzer({
  githubToken: 'token',
  repository: 'owner/repo',
});

const analysis = await analyzer.analyzeIssue(123);
console.log(`Category: ${analysis.category}`);
console.log(`Feasibility: ${analysis.feasibility}`);
console.log(`Requirements: ${analysis.requirements.length}`);
```

### SWEResolver

Generates code solutions using AI.

```typescript
import { SWEResolver } from './src/scripts/modules/SWEResolver';

const resolver = new SWEResolver({
  openaiApiKey: 'key',
  worktreePath: '/path/to/worktree',
});

const result = await resolver.resolveIssue(analysis, worktreeInfo);
console.log(`Generated ${result.changes.length} file changes`);
console.log(`Confidence: ${result.confidence}`);
```

### CodeReviewer

Validates AI-generated code.

```typescript
import { CodeReviewer } from './src/scripts/modules/CodeReviewer';

const reviewer = new CodeReviewer({
  openaiApiKey: 'key',
});

const review = await reviewer.reviewCode(analysis, codeResult, worktreePath);
console.log(`Assessment: ${review.overallAssessment}`);
console.log(`Issues found: ${review.issues.length}`);
```

### WorkflowOrchestrator

Coordinates the entire workflow.

```typescript
import { WorkflowOrchestrator } from './src/scripts/modules/WorkflowOrchestrator';

const orchestrator = new WorkflowOrchestrator(config);

// Execute workflow
const result = await orchestrator.executeWorkflow(123);

// Check status
console.log(`State: ${orchestrator.getCurrentState()}`);

// Get metrics
const metrics = orchestrator.getMetrics();
console.log(`Success rate: ${metrics.successRate}`);
```

## Monitoring and Metrics

### System Health

```typescript
import { SystemMonitor } from './src/scripts/modules/ErrorManager';

const monitor = new SystemMonitor();

// Get overall health
const health = monitor.getSystemHealth();
console.log(`System health: ${health.overall}`);

// Get metrics summary
const metrics = monitor.getMetricsSummary();
console.log(`Total workflows: ${metrics.totalWorkflows}`);
console.log(`Success rate: ${metrics.successRate}`);
```

### Available Metrics

- `workflow_total` - Total workflows executed
- `workflow_duration` - Workflow execution time
- `issue_analysis_total` - Issues analyzed
- `code_generation_total` - Code generation attempts
- `code_review_total` - Code reviews completed
- `errors_total` - Errors by component and type

## Error Handling

### Circuit Breakers

The system includes automatic circuit breakers to prevent cascade failures:

```typescript
import { ErrorRecoveryManager } from './src/scripts/modules/ErrorManager';

const recoveryManager = new ErrorRecoveryManager();

// Check component availability
if (recoveryManager.isComponentAvailable('SWEResolver')) {
  // Component is available
} else {
  // Circuit breaker is open
}
```

### Error Recovery Strategies

- **Retry**: For transient failures (network, API rate limits)
- **Rollback**: Revert changes on critical failures
- **Skip**: Skip non-critical steps
- **Escalate**: Require human intervention for complex issues
- **Manual**: Complete manual review required

## Security Considerations

### Code Review Requirements

- All AI-generated changes undergo automated security review
- Critical security issues block automatic PR creation
- Human review required for high-risk changes
- Comprehensive audit trail maintained

### Access Control

- GitHub tokens should have minimal required permissions
- OpenAI API keys should be properly secured
- Worktree isolation prevents main branch pollution
- Sandboxed execution environments

## Examples

### Processing a Bug Fix

```typescript
const result = await orchestrator.executeWorkflow(456);

if (result.success) {
  console.log('Bug fix implemented and PR created');
  console.log(`Changes made: ${result.codeResult?.changes.length}`);
  console.log(`Tests added: ${result.codeResult?.testsAdded.length}`);
}
```

### Handling Complex Features

```typescript
const analysis = await analyzer.analyzeIssue(789);

if (analysis.complexity === 'high') {
  console.log('High complexity issue - human review recommended');
  // May still attempt automated solution but with lower confidence
}
```

### Monitoring System Health

```typescript
const health = monitor.getSystemHealth();

if (health.overall === 'unhealthy') {
  console.log('System health degraded');
  health.alerts.forEach(alert => {
    console.log(`Alert: ${alert.name} - ${alert.message}`);
  });
}
```

## Troubleshooting

### Common Issues

1. **GitHub API Rate Limiting**
   - Solution: Implement retry logic with exponential backoff
   - Prevention: Use appropriate token permissions

2. **OpenAI API Quota Exceeded**
   - Solution: Monitor usage and implement cost limits
   - Prevention: Set reasonable cost thresholds

3. **Worktree Conflicts**
   - Solution: Ensure proper cleanup of failed worktrees
   - Prevention: Use unique branch names and proper isolation

4. **Code Generation Failures**
   - Solution: Implement fallback strategies and human escalation
   - Prevention: Validate inputs and provide clear requirements

### Debugging

Enable debug logging:

```typescript
const config = {
  monitoring: {
    logLevel: 'debug',
    enableConsoleLogging: true,
  },
};
```

Check system health:

```typescript
const health = monitor.getSystemHealth();
console.log(JSON.stringify(health, null, 2));
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build
npm run build
```

### Adding New Components

1. Create the component in `src/scripts/modules/`
2. Add comprehensive tests
3. Update the WorkflowOrchestrator to integrate the component
4. Update configuration and monitoring
5. Add documentation

### Testing

```bash
# Unit tests
npm run test:run

# Integration tests
npm run test:run src/scripts/modules/GitHubIssuesReviewerIntegration.test.ts

# Coverage
npm run test:coverage
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting guide
2. Review system logs and metrics
3. Create an issue in the repository
4. Contact the development team
