# 03. Confirm the target GitHub Project V2 board exists

meta:
id: troubleshoot-kanban-population-03
feature: troubleshoot-kanban-population
priority: high
depends_on: []
tags: [project, v2, board]

objective:

- Verify that the target GitHub Project V2 board (project number 2 in the script) exists and is accessible

deliverables:

- Confirmation of project existence and correct number

steps:

- Log into GitHub and navigate to Projects
- Check for a Project V2 with the number used in the script (e.g., 2)
- Ensure the project is owned by the correct user/org and is not archived

tests:

- Unit: Query GitHub API for project existence
- Integration/e2e: Attempt to view the project board manually

acceptance_criteria:

- Project exists, is active, and matches the script's target

validation:

- If not found, update the script with the correct project number

notes:

- The script uses USER_LOGIN and PROJECT_NUMBER; confirm these match your setup
