# 04. Set up README and documentation for usage instructions

meta:
id: host-opencode-folder-in-separate-repo-04
feature: host-opencode-folder-in-separate-repo
priority: P2
depends_on: [host-opencode-folder-in-separate-repo-03]
tags: [documentation, implementation]

objective:

- Create comprehensive documentation for using the hosted .opencode configuration

deliverables:

- README.md with usage instructions
- Documentation on integration methods (submodule, dependency)

steps:

- Create README.md explaining the purpose
- Document how to integrate as git submodule
- Document how to use as npm package if applicable
- Include configuration examples
- Add any setup requirements

tests:

- Unit: N/A (documentation)
- Integration/e2e: Follow documentation to verify instructions work

acceptance_criteria:

- README.md exists with clear instructions
- Integration methods are documented
- Examples are provided and tested

validation:

- Read through documentation for clarity
- Test documented integration steps

notes:

- Include contact information for support
- Document any version compatibility requirements
