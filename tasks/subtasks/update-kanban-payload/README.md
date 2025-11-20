# Update Kanban Payload

Objective: Update kanban_payload.json to include all ongoing, completed, and backlog tasks from the tasks/ directory, ensuring the Kanban board is fully populated with accurate task data for workflow synchronization.

Status legend: [ ] todo, [~] in-progress, [x] done

Tasks

- [ ] 01 — Inventory Completed Tasks → `01-inventory-completed-tasks.md`
- [ ] 02 — Inventory Ongoing Tasks → `02-inventory-ongoing-tasks.md`
- [ ] 03 — Inventory Todo Tasks → `03-inventory-todo-tasks.md`
- [ ] 04 — Inventory Plans Tasks → `04-inventory-plans-tasks.md`
- [ ] 05 — Format Tasks for Payload → `05-format-tasks-for-payload.md`
- [ ] 06 — Update Kanban Payload JSON → `06-update-kanban-payload-json.md`

Dependencies

- 01 depends on 05
- 02 depends on 05
- 03 depends on 05
- 04 depends on 05
- 05 depends on 06

Exit criteria

- kanban_payload.json is updated with all tasks from tasks/completed/, tasks/ongoing/, tasks/todo/, tasks/subtasks/, and tasks/plans/ directories
- Each task entry follows the existing schema: id, title, group, status, priority, source, notes
- The updated payload triggers the kanban-sync-classic.yml workflow successfully, populating the GitHub Project V2 board with correct columns and metadata
- No duplicate tasks or missing tasks from the directories
