# 01. Fix MCP Test Suite Syntax Errors

meta:
id: opencode-integration-completion-01
feature: opencode-integration-completion
priority: P2
depends_on: []
tags: [implementation, tests-required]

objective:

- Fix syntax errors and incorrect test expectations in MCP test files to ensure all tests pass

deliverables:

- Updated .opencode/tool/mcp/\*.test.ts files with correct syntax and expectations

steps:

- Review config-loader.test.ts for syntax errors
- Review client-headers.test.ts for incorrect expectations
- Review context7-integration.test.ts for timeout issues and incorrect assertions
- Run tests to verify fixes

tests:

- Unit: MCP configuration loader, client headers, integration tests
- Integration/e2e: Full MCP test suite passes

acceptance_criteria:

- All MCP test files have no syntax errors
- Test suite runs without failures

validation:

- Run npm test or vitest on MCP test files

notes:

- Based on integration-gaps.md findings
