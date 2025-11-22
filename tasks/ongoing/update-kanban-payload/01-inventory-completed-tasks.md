# 01. Inventory Completed Tasks

meta:
id: update-kanban-payload-01
feature: update-kanban-payload
priority: P2
depends_on: []
tags: [inventory, completed]

objective:

- Collect all completed tasks from tasks/completed/ directory and prepare a list for inclusion in kanban_payload.json

deliverables:

- A list of all completed tasks with their metadata (title, source, notes, etc.)

steps:

- List all files in tasks/completed/
- For each task file, extract title, status, priority, notes
- Assign unique IDs in format COMP-{SHORTNAME}-{SEQ}
- Group as "Completed"

tests:

- Unit: Verify all files in tasks/completed/ are inventoried
- Integration/e2e: Ensure no tasks are missed

acceptance_criteria:

- All completed tasks are listed with correct metadata
- IDs are unique and follow naming convention

validation:

- Run a script to count files vs inventoried tasks

notes:

- Use existing kanban_payload.json as reference for schema
- Ensure status is "Done" or similar for completed tasks
