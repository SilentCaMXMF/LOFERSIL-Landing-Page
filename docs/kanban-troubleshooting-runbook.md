# Kanban Sync Troubleshooting Runbook

## Findings Compilation

### Workflow Trigger

- ✅ Status: Working
- Details: Workflow runs successfully and performs mutations

### Logs Analysis

- ✅ Status: Workflow executes without errors
- Details: Logs show successful execution and mutation attempts

### Project Existence

- ✅ Status: Verified
- Details: Private project exists and is accessible

### Token Permissions

- ❌ Status: Likely missing required scopes
- Details: KANBAN_GH_TOKEN lacks 'project' scope for Projects V2 operations

### Status Field

- ⚠️ Status: Not verified
- Details: Assumed correct based on mutation structure

### Mutations

- ✅ Status: Present and correct
- Details: GraphQL mutations are properly defined in script

### Dry-run Testing

- ❌ Status: Failed due to permissions
- Details: Dry-run payload triggered but failed with permission errors

### Error Analysis

- ❌ Status: Permission denied
- Details: "Permission denied for Projects V2 mutations" errors in logs

## Root Cause Analysis

**Primary Issue**: The KANBAN_GH_TOKEN lacks the required 'project' scope needed for GitHub Projects V2 API operations.

**Impact**: All mutation operations (creating items, updating status, etc.) fail silently or with permission errors, preventing kanban synchronization.

**Evidence**:

- Workflow runs successfully but mutations fail
- Error messages specifically mention "Permission denied for Projects V2 mutations"
- Dry-run tests confirm the issue is permission-related

## Fix Steps

1. **Generate New Personal Access Token (PAT)**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Create new token with required scopes:
     - `repo` (Full control of private repositories)
     - `read:user` (Read user profile data)
     - `project` (Full control of projects)

2. **Update Repository Secret**
   - Navigate to repository Settings → Secrets and variables → Actions
   - Update `KANBAN_GH_TOKEN` with the new token value
   - Ensure the secret is properly masked in logs

3. **Test with Dry-run Payload**
   - Trigger workflow with dry-run configuration
   - Verify mutations succeed without permission errors
   - Check logs for successful item creation/updates

4. **Restore Full Payload**
   - Once dry-run succeeds, restore complete payload configuration
   - Run full synchronization test
   - Monitor for any remaining issues

## Future Troubleshooting Checklist

### Pre-Flight Checks

- [ ] Verify KANBAN_GH_TOKEN exists in repository secrets
- [ ] Confirm token has required scopes: `repo`, `read:user`, `project`
- [ ] Check token expiration date (regenerate if expired)
- [ ] Ensure project ID in payload matches actual GitHub project

### Workflow Execution

- [ ] Manually trigger workflow to test
- [ ] Review workflow run logs for errors
- [ ] Check for "Permission denied" messages
- [ ] Verify mutation operations complete successfully

### Payload Validation

- [ ] Confirm project ID is correct
- [ ] Validate item IDs exist in the project
- [ ] Check status field values match project configuration
- [ ] Ensure all required fields are present in mutations

### API Response Analysis

- [ ] Look for GraphQL errors in logs
- [ ] Check rate limiting (GitHub API limits)
- [ ] Verify project accessibility (private repo permissions)
- [ ] Confirm user has project collaborator access

### Debugging Steps

1. Enable dry-run mode to isolate permission issues
2. Test with minimal payload (single item)
3. Check GitHub API status page for outages
4. Regenerate token if all else fails
5. Review recent GitHub permission changes

### Escalation

- If token regeneration doesn't resolve: Check organization-level restrictions
- If project access fails: Verify user is project collaborator
- If API errors persist: Contact GitHub support for Projects V2 issues

## Monitoring and Maintenance

- Regularly rotate PATs before expiration
- Monitor workflow success rates
- Keep token scopes minimal but sufficient
- Document any permission changes in team knowledge base
