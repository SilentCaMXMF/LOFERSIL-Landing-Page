# Branch Protection Quick Reference

## Essential Settings Checklist

### Main Branch Protection Rule ✅

- **Branch**: `main`
- **Require up-to-date branches**: ✅
- **Required status checks**: `PR Validation`, `Security Audit`
- **Required reviewers**: 1
- **Require conversation resolution**: ✅
- **No bypassing allowed**: ✅
- **Disallow force pushes**: ✅
- **Disallow deletions**: ✅

### Status Checks ✅

- [x] PR Validation (lint + build + compile)
- [x] Security Audit (npm audit --audit-level=moderate)

### Auto-Merge Configuration ✅

- [x] Dependabot auto-merge enabled
- [x] `auto-merge` label applied to all Dependabot PRs
- [x] Auto-merge workflow waits for status checks
- [x] Squash merge for Dependabot PRs

## GitHub UI Navigation Path

```
Settings → Branches → Branch protection rules → Add rule
```

## Emergency Bypass

Only repository admins can bypass protection rules when absolutely necessary.

---

_For detailed setup instructions, see [branch-protection-setup.md](./branch-protection-setup.md)_
