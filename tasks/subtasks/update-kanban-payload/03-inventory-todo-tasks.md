# 03. Inventory Todo Tasks

meta:
id: update-kanban-payload-03
feature: update-kanban-payload
priority: P2
depends_on: []
tags: [inventory, todo, backlog]

objective:

- Collect all todo tasks from tasks/todo/ and tasks/subtasks/ directories and prepare a list for inclusion in kanban_payload.json

deliverables:

- A list of all todo tasks with their metadata (title, source, notes, etc.)

steps:

- List all files in tasks/todo/
- List all files in tasks/subtasks/
- For each task file, extract title, status, priority, notes
- Assign unique IDs in format TODO-{SHORTNAME}-{SEQ} for todo, SUB-{SHORTNAME}-{SEQ} for subtasks
- Group as "Todo" or "Subtasks"

tests:

- Unit: Verify all files in tasks/todo/ and tasks/subtasks/ are inventoried
- Integration/e2e: Ensure no tasks are missed

acceptance_criteria:

- All todo and subtask tasks are listed with correct metadata
- IDs are unique and follow naming convention

validation:

- Run a script to count files vs inventoried tasks

notes:

- Use existing kanban_payload.json as reference for schema
- Ensure status is "Todo" for backlog tasks
