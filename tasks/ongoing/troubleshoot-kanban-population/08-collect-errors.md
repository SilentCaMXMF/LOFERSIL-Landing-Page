# 08. Collect and categorize any errors from the run

meta:
id: troubleshoot-kanban-population-08
feature: troubleshoot-kanban-population
priority: low
depends_on: [troubleshoot-kanban-population-07]
tags: [errors, categorization, fixes]

objective:

- Gather errors from the dry-run and propose fixes

deliverables:

- Categorized error list with proposed patches

steps:

- Review dry-run logs for errors
- Classify errors (e.g., permission, field ID, mutation syntax)
- Suggest concrete fixes

tests:

- Unit: Validate error messages
- Integration/e2e: Apply fixes and re-test

acceptance_criteria:

- Errors identified and fixes proposed

validation:

- Implement one fix and verify improvement

notes:

- Common errors: invalid option IDs, missing mutations, token issues
