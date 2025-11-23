# Context7 Integration Test Suite

A consolidated test suite that combines functionality from multiple Context7 integration files into a single, unified testing framework.

## Features

- **Multiple Test Modes**: Supports different testing scenarios
- **Code Deduplication**: Eliminates redundant connection/disconnection logic
- **CLI Interface**: Easy command-line usage with configurable options
- **Error Handling**: Comprehensive error handling and reporting

## Test Modes

### `basic-connection`

Tests basic MCP connection to Context7 server and lists available tools and resources.

```bash
node context7-integration-test-suite.ts basic-connection
```

### `demo`

Runs a demonstration of MCP capabilities, showing available tools and resources.

```bash
node context7-integration-test-suite.ts demo
```

### `docs-fetch`

Fetches documentation from Context7 for specified libraries and topics.

```bash
# Default: OpenCode library, agent prompting configuration
node context7-integration-test-suite.ts docs-fetch

# Custom library and topic
node context7-integration-test-suite.ts docs-fetch --library MyLibrary --topic "API usage"

# With custom token limit
node context7-integration-test-suite.ts docs-fetch --tokens 5000
```

## Options

For `docs-fetch` mode:

- `--library <name>`: Library name to fetch docs for (default: OpenCode)
- `--topic <topic>`: Documentation topic (default: "agent prompting configuration")
- `--tokens <num>`: Maximum tokens to retrieve (default: 2000)

## Files Consolidated

This test suite combines functionality from:

- `test-context7-connection.ts` - Basic connection testing
- `fetch-opencode-docs.ts` - Documentation fetching
- `mcp-config.json` - Configuration management
- `MCP-Context7-Integration-Test-Results.md` - Test results documentation

## Usage Examples

```bash
# Test basic connection
node context7-integration-test-suite.ts basic-connection

# Run demo
node context7-integration-test-suite.ts demo

# Fetch GitHub worktrees documentation
node context7-integration-test-suite.ts docs-fetch --topic "GitHub worktrees functionality"

# Fetch custom library docs
node context7-integration-test-suite.ts docs-fetch --library React --topic "hooks implementation"
```

## Environment Requirements

Ensure the following environment variables are set:

- `CONTEXT7_API_KEY`: Your Context7 API key
- `CONTEXT7_MCP_URL`: Context7 MCP server URL (configured in mcp-config.json)

## Error Handling

The test suite includes comprehensive error handling:

- Connection failures are reported with detailed error messages
- Automatic cleanup (disconnection) on errors
- Process exits with code 1 on test failures
