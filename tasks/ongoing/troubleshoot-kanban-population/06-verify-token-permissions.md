# 06. Verify the workflow's GitHub token permissions

meta:
id: troubleshoot-kanban-population-06
feature: troubleshoot-kanban-population
priority: high
depends_on: []
tags: [token, permissions, github]

objective:

- Ensure the GitHub token used in the workflow has permissions to mutate Project V2 items

deliverables:

- Confirmation of sufficient token scopes

steps:

- Check the workflow for token usage (KANBAN_GH_TOKEN or GITHUB_TOKEN)
- Verify token has repo scope and project permissions
- Test token access if possible

tests:

- Unit: Review token configuration
- Integration/e2e: Attempt a manual GraphQL mutation with the token

acceptance_criteria:

- Token has write access to issues and projects

validation:

- If insufficient, update token or use GITHUB_TOKEN with appropriate permissions

notes:

- GITHUB_TOKEN may need org-level project permissions for private repos
