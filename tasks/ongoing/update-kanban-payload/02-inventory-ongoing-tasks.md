# 02. Inventory Ongoing Tasks

meta:
id: update-kanban-payload-02
feature: update-kanban-payload
priority: P2
depends_on: []
tags: [inventory, ongoing]

objective:

- Collect all ongoing tasks from tasks/ongoing/ directory and prepare a list for inclusion in kanban_payload.json

deliverables:

- A list of all ongoing tasks with their metadata (title, source, notes, etc.)

steps:

- List all files in tasks/ongoing/
- For each task file, extract title, status, priority, notes
- Assign unique IDs in format ONGO-{SHORTNAME}-{SEQ}
- Group as "Ongoing"

tests:

- Unit: Verify all files in tasks/ongoing/ are inventoried
- Integration/e2e: Ensure no tasks are missed

acceptance_criteria:

- All ongoing tasks are listed with correct metadata
- IDs are unique and follow naming convention

validation:

- Run a script to count files vs inventoried tasks

notes:

- Use existing kanban_payload.json as reference for schema
- Ensure status is "In Progress" for ongoing tasks
