# Scripts Directory

This directory contains utility scripts for the LOFERSIL Landing Page project.

## update-mcp-progress.js

Updates the GitHub Projects Kanban board to reflect MCP implementation completion.

### Usage

```bash
npm run update-mcp-progress
```

### Requirements

- `GITHUB_ACCESS_TOKEN`: GitHub Personal Access Token with `repo` and `project` permissions
- `GITHUB_PROJECT_ID`: GitHub Project ID (default: PVT_kwDOB2ZJcM4Akw2Q for project #2)
- `GITHUB_REPOSITORY_OWNER`: Repository owner (default: SilentCaMXMF)
- `GITHUB_REPOSITORY_NAME`: Repository name (default: LOFERSIL-Landing-Page)

### What it does

1. Connects to the GitHub Projects API
2. Finds all MCP-related task cards (Tasks 03-13)
3. Updates their status to "Done"
4. Updates the main MCP Implementation card to "Done"
5. Verifies all updates were successful

### Environment Setup

Copy the GitHub-related variables from `.env.example` to your `.env` file and set your access token.

### Notes

- The script uses the existing `GitHubProjectsIntegration` class
- Progress percentage updates in card descriptions are not supported by GitHub Projects API
- Cards are moved to "Done" status instead

## weekly-review-automation.sh

Automates the weekly tasks review process for maintaining project organization and progress tracking.

### Usage

```bash
# Run all checks
./scripts/weekly-review-automation.sh all

# Scan task status consistency
./scripts/weekly-review-automation.sh scan

# Generate progress report
./scripts/weekly-review-automation.sh report

# Validate task consistency
./scripts/weekly-review-automation.sh validate
```

### Commands

- **scan**: Checks task status indicators and verification criteria across all task files
- **report**: Generates progress summary with completion rates and statistics
- **validate**: Performs consistency checks for broken links and missing files
- **all**: Runs all checks in sequence

### What it does

1. **Status Scanning**: Validates that all task files have proper status indicators (✅ 🔄 etc.)
2. **Progress Reporting**: Calculates completion rates and provides project health metrics
3. **Consistency Validation**: Checks for broken references and missing documentation

### Integration

This script supports the [weekly review process](../tasks/weekly-review-process.md) and is designed to run automatically as part of the review cycle.
