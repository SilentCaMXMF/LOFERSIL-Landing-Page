# 01. Audit all tasks and folders for accurate inventory

meta:
id: implement-tasks-folder-recommendations-01
feature: implement-tasks-folder-recommendations
priority: P2
depends_on: []
tags: [implementation, analysis]

objective:

- Create a complete, accurate inventory of all tasks, folders, and their current status

deliverables:

- Comprehensive audit report listing all task groups, individual tasks, and progress status

steps:

- List all directories and files in tasks/ using directory listing tools
- Read each README.md file to extract task counts and completion status
- Cross-reference README status with actual file presence
- Document any discrepancies between stated progress and reality
- Compile findings into a structured audit report

tests:

- Unit: N/A
- Integration/e2e: Verify inventory matches actual filesystem structure

acceptance_criteria:

- Audit report covers all 115+ tasks with accurate status and identifies all discrepancies

validation:

- Manual review of audit report against filesystem contents
- Cross-check with existing readonly agent analysis

notes:

- Use the previous readonly agent analysis as starting point
- Focus on accuracy over speed
