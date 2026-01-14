---
name: test
agent: tester
description: Run the complete testing pipeline for the project
---

You are executing the complete testing pipeline for the Lofersil landing page project. Ensure all quality checks pass before deployment.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/project/project-context.md

**TESTING PIPELINE EXECUTION:**

**1. TYPE CHECKING:**
- Run `pnpm type:check` to validate TypeScript types
- Report any type errors found
- Fix critical type issues if possible

**2. LINTING:**
- Run `pnpm lint` to check code quality
- Report linting errors and warnings
- Apply auto-fixable issues

**3. UNIT TESTING:**
- Run `pnpm test` to execute test suite
- Report test results and coverage
- Identify failing tests

**4. INTEGRATION VALIDATION:**
- Verify build process works
- Check asset generation
- Validate deployment readiness

**5. REPORT RESULTS:**
- Summarize all test outcomes
- Provide clear pass/fail status
- Recommend next steps for any failures

**Execute complete testing pipeline now.**