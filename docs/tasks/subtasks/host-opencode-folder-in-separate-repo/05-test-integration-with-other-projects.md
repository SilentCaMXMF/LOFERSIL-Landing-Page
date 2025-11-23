# 05. Test integration with other projects

meta:
id: host-opencode-folder-in-separate-repo-05
feature: host-opencode-folder-in-separate-repo
priority: P2
depends_on: [host-opencode-folder-in-separate-repo-04]
tags: [testing, integration]

objective:

- Verify the hosted .opencode can be successfully integrated into other projects

deliverables:

- Test integration in at least one other project
- Documentation of integration process

steps:

- Identify a test project for integration
- Add repository as git submodule
- Configure the .opencode in test project
- Test that configuration works as expected
- Document the integration process

tests:

- Unit: N/A (integration testing)
- Integration/e2e: Full integration test in separate project

acceptance_criteria:

- Successful integration in test project
- Configuration functions correctly
- Integration method is reliable and documented

validation:

- Run test project with integrated .opencode
- Verify all configurations are applied properly

notes:

- Choose a simple project for initial testing
- Document any issues encountered and resolutions
