# 01. Analyze current .opencode folder structure and dependencies

meta:
id: host-opencode-folder-in-separate-repo-01
feature: host-opencode-folder-in-separate-repo
priority: P2
depends_on: []
tags: [analysis, implementation]

objective:

- Document the current structure and dependencies of the .opencode folder

deliverables:

- Analysis report of .opencode folder contents
- List of dependencies and configurations

steps:

- List all files in .opencode folder
- Identify configuration files and their purposes
- Check for any dependencies or references to parent project
- Document any environment variables or secrets required

tests:

- Unit: N/A (analysis task)
- Integration/e2e: Verify folder can be copied independently

acceptance_criteria:

- Complete inventory of .opencode folder contents documented
- All dependencies identified and listed
- No hard-coded references to current project found

validation:

- Run ls -la .opencode/ and document output
- Check for any import statements or paths that reference parent directories

notes:

- Ensure the folder is self-contained for hosting separately
