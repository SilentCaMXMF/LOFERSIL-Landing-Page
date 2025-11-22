# 04. Inventory Plans Tasks

meta:
id: update-kanban-payload-04
feature: update-kanban-payload
priority: P2
depends_on: []
tags: [inventory, plans]

objective:

- Collect all plans tasks from tasks/plans/ directory and prepare a list for inclusion in kanban_payload.json

deliverables:

- A list of all plans tasks with their metadata (title, source, notes, etc.)

steps:

- List all files in tasks/plans/
- For each task file, extract title, status, priority, notes
- Assign unique IDs in format PLAN-{SHORTNAME}-{SEQ}
- Group as "Plans"

tests:

- Unit: Verify all files in tasks/plans/ are inventoried
- Integration/e2e: Ensure no tasks are missed

acceptance_criteria:

- All plans tasks are listed with correct metadata
- IDs are unique and follow naming convention

validation:

- Run a script to count files vs inventoried tasks

notes:

- Use existing kanban_payload.json as reference for schema
- Ensure status is "Ready for Implementation" for plans tasks
