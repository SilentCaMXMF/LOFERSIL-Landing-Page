# 02. Search Console Logs

meta:
id: review-opencode-plugin-console-logs-02
feature: review-opencode-plugin-console-logs
priority: P2
depends_on: [review-opencode-plugin-console-logs-01]
tags: [analysis, code-search]

objective:

- Locate all instances of console.log statements across the plugin's source files

deliverables:

- A list of all console.log occurrences with file paths, line numbers, and surrounding context

steps:

- Use grep tool to search for "console\.log" pattern in all TypeScript and JavaScript files
- Include surrounding lines for context (2-3 lines before and after)
- Record file paths and line numbers for each occurrence

tests:

- Unit: N/A (search task)
- Integration/e2e: Verify search results are accurate by manual spot checks

acceptance_criteria:

- All console.log statements in the plugin are found and documented
- No occurrences are missed in the search

validation:

- Run grep with "console\.log" and verify results match manual inspection

notes:

- Search in .ts, .js files primarily; ignore config files like JSON
- Be aware of variations like console.error, but focus on console.log as specified