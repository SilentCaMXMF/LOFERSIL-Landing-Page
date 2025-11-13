### 4. Unused Code Cleanup

**File**: `src/scripts/factorial.ts`  
**Risk**: Code bloat, potential confusion  
**Priority**: MEDIUM  
**Subagent**: `subagents/coder-agent`

**Steps**:

1. Verify factorial.ts is truly unused
2. Remove the file
3. Check for any imports/references
4. Run linting to confirm no issues
5. Update build if needed

**Expected Outcome**: Clean codebase with no unused files
