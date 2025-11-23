# 05. Check the kanban script for GraphQL mutations

meta:
id: troubleshoot-kanban-population-05
feature: troubleshoot-kanban-population
priority: medium
depends_on: []
tags: [graphql, mutations, script]

objective:

- Review the kanban-sync script for implementation of addProjectV2Item and updateProjectV2ItemFieldValue mutations

deliverables:

- Confirmation of mutation presence and invocation

steps:

- Examine the script in kanban-sync-classic.yml
- Look for addProjectV2Item calls after issue creation
- Check for updateProjectV2ItemFieldValue to set status

tests:

- Unit: Verify mutation syntax and variable usage
- Integration/e2e: Confirm mutations are executed in logs

acceptance_criteria:

- Mutations are present and called for each task

validation:

- If missing, implement them as per previous recommendations

notes:

- The script has a TODO for this; if still present, that's the issue
