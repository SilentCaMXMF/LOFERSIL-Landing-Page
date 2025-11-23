# 01. Identify syntax errors in e2e.test.ts

meta:
id: fix-syntax-errors-test-files-01
feature: fix-syntax-errors-test-files
priority: P1
depends_on: []
tags: [identification, syntax-errors]

objective:

- Identify all TypeScript compilation errors and scoping issues in e2e.test.ts

deliverables:

- Comprehensive list of syntax errors with line numbers and descriptions
- Categorization of errors (scoping, type mismatches, etc.)

steps:

- Review TypeScript diagnostics output for e2e.test.ts
- Document each error with context and potential cause
- Group errors by type (e.g., variable scoping, type issues)

tests:

- Unit: N/A (identification task)
- Integration/e2e: N/A

acceptance_criteria:

- All syntax errors in e2e.test.ts are documented
- Each error includes line number, error message, and brief explanation

validation:

- Cross-reference with TypeScript compiler output
- Ensure no errors are missed

notes:

- Main issues appear to be variable scoping due to duplicate describe blocks
- orchestrator, mockGithubApi, mockOpenCodeAgent not in scope in second describe block

## Identified Errors

### Scoping Errors (Cannot find name)

- Lines 146, 156-158, 173, 187, 201, 211, 224, 235, 240-241, 257, 271-273, 289, 299-301: Cannot find name 'orchestrator' - Variable declared in beforeEach of first describe block, used in second duplicate describe block
- Lines 357, 359, 374, 383, 419-420, 428, 436, 459, 467, 474, 499-500, 507, 513, 520, 527, 539, 552, 560, 567, 575, 585, 611, 615, 634-635, 639, 658-659, 666, 670, 691-692, 699, 703, 710, 717, 741-742, 744: Cannot find name 'mockGithubApi' or 'mockOpenCodeAgent' - Same scoping issue

### Type Errors

- Line 235: Argument of type 'any' is not assignable to parameter of type 'never' - Likely due to incorrect array typing in Promise.all
- Lines 240-241: Property 'success'/'issueNumber' does not exist on type 'never' - Same issue

### Structural Issues

- Duplicate describe blocks: "Workflow Orchestrator E2E" appears twice (lines 144 and 287)
- Variables declared in one describe scope but used in another
- Reference to context!.worktreeMock (line 40) but worktreeMock not returned from setupTest
