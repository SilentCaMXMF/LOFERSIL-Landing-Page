# 05. Standardize MCP Error Handling Across Tools

meta:
id: opencode-integration-completion-05
feature: opencode-integration-completion
priority: P2
depends_on: [opencode-integration-completion-01]
tags: [implementation]

objective:

- Standardize error codes and messages across MCP tools

deliverables:

- Updated .opencode/tool/mcp/\*.ts files with consistent error handling

steps:

- Review current error formats in MCP tools
- Define standard error codes and message formats
- Update all MCP implementations to use standardized errors

tests:

- Unit: Error handling tests

acceptance_criteria:

- All MCP tools use consistent error codes and messages
- Error debugging is easier due to standardization

validation:

- Code review of error handling patterns

notes:

- Depends on test fixes for accurate error testing
