# 07. Create a small dry-run payload and test

meta:
id: troubleshoot-kanban-population-07
feature: troubleshoot-kanban-population
priority: high
depends_on: [troubleshoot-kanban-population-01, troubleshoot-kanban-population-03, troubleshoot-kanban-population-04, troubleshoot-kanban-population-05, troubleshoot-kanban-population-06]
tags: [dry-run, test, payload]

objective:

- Create a minimal kanban_payload.json and trigger the workflow to test board population

deliverables:

- Successful population of at least one card on the board

steps:

- Backup current kanban_payload.json
- Create a payload with one test task
- Push and trigger workflow
- Check board for new card in correct column

tests:

- Unit: Validate payload JSON
- Integration/e2e: Confirm card appears on board

acceptance_criteria:

- Test card is created and appears on the Project V2 board

validation:

- If fails, revert and analyze logs for specific errors

notes:

- Use a unique task ID to avoid conflicts
