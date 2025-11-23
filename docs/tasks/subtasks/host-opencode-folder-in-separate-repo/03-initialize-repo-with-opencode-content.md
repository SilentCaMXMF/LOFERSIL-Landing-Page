# 03. Create new branch with .opencode content

meta:
id: host-opencode-folder-in-separate-repo-03
feature: host-opencode-folder-in-separate-repo
priority: P2
depends_on: [host-opencode-folder-in-separate-repo-02]
tags: [implementation, content-migration]

objective:

- Create a new branch in the remote repository containing only the .opencode folder contents, avoiding outdated existing files

deliverables:

- New branch with .opencode folder contents committed
- Clean git history for the new branch

steps:

- Initialize a new local git repository in a separate directory
- Copy .opencode folder contents to the new repository root
- Add remote origin pointing to https://github.com/SilentCaMXMF/opencode-agents
- Create and checkout a new branch (e.g., opencode-v1)
- Add all files to git
- Commit with descriptive message
- Push the new branch to remote repository

tests:

- Unit: N/A (file operations)
- Integration/e2e: Verify all files are present and repository structure is correct on the new branch

acceptance_criteria:

- New branch created successfully in remote repository
- All .opencode files committed to the new branch
- Branch contains only .opencode content, no outdated files

validation:

- Run git status and verify clean working directory
- Check GitHub repository new branch contents match local .opencode folder

notes:

- Ensure no sensitive data is included
- Maintain original file permissions if applicable
- Choose a descriptive branch name that indicates the content version
