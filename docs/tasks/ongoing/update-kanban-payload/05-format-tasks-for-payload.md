# 05. Format Tasks for Payload

meta:
id: update-kanban-payload-05
feature: update-kanban-payload
priority: P2
depends_on: [update-kanban-payload-01, update-kanban-payload-02, update-kanban-payload-03, update-kanban-payload-04]
tags: [formatting, payload]

objective:

- Combine all inventoried tasks into a single formatted list matching the kanban_payload.json schema

deliverables:

- A consolidated JSON array of all tasks with correct fields: id, title, group, status, priority, source, notes

steps:

- Merge lists from previous inventory tasks
- Ensure each task has all required fields
- Validate IDs are unique across all tasks
- Set last_updated timestamp

tests:

- Unit: Check schema compliance for each task
- Integration/e2e: Validate JSON structure

acceptance_criteria:

- All tasks are formatted correctly
- No duplicate IDs or missing fields

validation:

- Parse the JSON and check for errors

notes:

- Follow the exact schema from existing kanban_payload.json
