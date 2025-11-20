# 01. Verify GitHub workflow trigger for kanban_payload.json

meta:
id: troubleshoot-kanban-population-01
feature: troubleshoot-kanban-population
priority: high
depends_on: []
tags: [workflow, trigger, kanban]

objective:

- Confirm that the kanban-sync-classic.yml workflow is properly configured to trigger on changes to kanban_payload.json

deliverables:

- Confirmation that the workflow runs on kanban_payload.json pushes and workflow_dispatch

steps:

- Open .github/workflows/kanban-sync-classic.yml
- Check the 'on' section for paths: - kanban_payload.json and workflow_dispatch
- Verify the workflow has run recently on a push including kanban_payload.json

tests:

- Unit: Validate YAML syntax and trigger configuration
- Integration/e2e: Confirm workflow appears in Actions tab after a qualifying push

acceptance_criteria:

- Workflow trigger is correctly set for kanban_payload.json changes
- No syntax errors in the workflow file

validation:

- Push a small change to kanban_payload.json and check if workflow triggers

notes:

- If trigger is missing, add paths: - kanban_payload.json to the on: push: paths section
