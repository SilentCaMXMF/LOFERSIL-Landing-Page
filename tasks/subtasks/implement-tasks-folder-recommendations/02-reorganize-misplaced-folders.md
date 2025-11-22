# 02. Reorganize misplaced folders and integrate subtasks

meta:
id: implement-tasks-folder-recommendations-02
feature: implement-tasks-folder-recommendations
priority: P2
depends_on: [implement-tasks-folder-recommendations-01]
tags: [implementation, organization]

objective:

- Correct folder categorization errors and integrate subtasks into the main structure

deliverables:

- Properly organized tasks folder with no misplaced items
- Integrated subtasks folder content

steps:

- ✅ Move improve-contact-form-accessibility-ux from completed/ to todo/
- ✅ Move ai-powered-github-issues-reviewer-system from subtasks/ to ongoing/
- ✅ Move other subtasks (production-readiness-improvements, troubleshoot-kanban-population, update-kanban-payload) to ongoing/ folders
- ✅ Update any internal references to moved folders
- ✅ Verify all moves maintain file integrity

tests:

- Unit: N/A
- Integration/e2e: Confirm all task files are accessible in new locations

acceptance_criteria:

- ✅ No folders remain in incorrect categories
- ✅ All subtasks integrated into main ongoing/todo structure
- ✅ File paths updated where necessary

validation:

- Directory listing shows correct organization
- All README references to moved folders updated

notes:

- Preserve all file contents during moves
- Update main README references after moves
