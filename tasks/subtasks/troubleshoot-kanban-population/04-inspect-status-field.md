# 04. Inspect the Status field on Project V2

meta:
id: troubleshoot-kanban-population-04
feature: troubleshoot-kanban-population
priority: medium
depends_on: [troubleshoot-kanban-population-03]
tags: [status, field, project]

objective:

- Examine the Status field on the Project V2 board and collect the option IDs used for column mapping

deliverables:

- List of Status field option IDs and their display names

steps:

- Open the target Project V2 board
- Inspect the Status field (single-select)
- Note the option IDs (e.g., via API or developer tools)

tests:

- Unit: Validate option IDs are valid UUIDs or similar
- Integration/e2e: Test mapping function with actual IDs

acceptance_criteria:

- Option IDs collected and match the script's mapping expectations

validation:

- Use GitHub's GraphQL explorer to query project fields

notes:

- The script maps groups to status names; ensure IDs align with actual options
