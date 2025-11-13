### 3. Hardcoded URLs Removal

**File**: `build.js`  
**Risk**: Environment-specific configuration issues  
**Priority**: HIGH  
**Subagent**: `subagents/coder-agent`

**Steps**:

1. Identify all hardcoded production URLs
2. Create environment variable configuration
3. Update build script to use environment variables
4. Update deployment workflow with proper secrets
5. Test in different environments

**Expected Outcome**: URLs are configurable per environment
