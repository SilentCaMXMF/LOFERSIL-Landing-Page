# Branch Protection Setup Guide for LOFERSIL Landing Page

This guide provides step-by-step instructions for configuring branch protection rules to secure the `main` branch while enabling automated workflows for Dependabot updates.

## Overview

The LOFERSIL Landing Page project uses:

- **GitHub Actions** for CI/CD validation
- **Dependabot** for automated dependency updates
- **Auto-merge** for approved Dependabot PRs
- **Status checks** to ensure code quality and security

## Required Branch Protection Rules for Main Branch

Navigate to **Repository Settings** → **Branches** → **Branch protection rules** → **Add rule** and configure the following:

### 1. Branch Selection

- **Branch name pattern**: `main` (not `master` - note the README may need updating)

### 2. Protection Rules Configuration

#### Require status checks to pass before merging

✅ **Required**

- **"Require branches to be up to date before merging"**: ✅ **Required**
- **"Require status checks to pass before merging"**: ✅ **Required**

#### Required Status Checks

Select ALL of the following checks:

1. **PR Validation** (from `.github/workflows/pr-check.yml`)
2. **Security Audit** (from `.github/workflows/security.yml`)

#### Require pull request reviews before merging

✅ **Required**

- **Number of required reviewers**: `1`
- **"Dismiss stale PR approvals when new commits are pushed"**: ✅ **Required**
- **"Require review from CODEOWNERS"**: ❌ **Not required** (no CODEOWNERS file)
- **"Restrict reviews to collaborators who can dismiss reviews"**: ❌ **Not required**
- **"Require review from code owners"**: ❌ **Not required**
- **"Limit who can dismiss pull request reviews"**: ❌ **Not required**

#### Additional Restrictions

- **"Require conversation resolution before merging"**: ✅ **Required**
- **"Do not allow bypassing the above settings"**: ✅ **Required**
- **"Allow force pushes"**: ❌ **Not allowed**
- **"Allow deletions"**: ❌ **Not allowed**

## Required Status Checks Details

### 1. PR Validation (`pr-check.yml`)

This workflow validates:

- **Code linting** (`npm run lint`)
- **TypeScript compilation** (`npm run build:compile`)
- **CSS processing** (`npm run build:css`)
- **Full build process** (`npm run build`)

### 2. Security Audit (`security.yml`)

This workflow performs:

- **Security vulnerability scanning** (`npm audit --audit-level=moderate`)
- Runs on pull requests and weekly schedule
- Ensures no moderate or higher security vulnerabilities

## Auto-Merge Settings for Dependabot

### Current Auto-Merge Configuration

The project includes an auto-merge workflow (`.github/workflows/auto-merge.yml`) that:

1. **Triggers** on Dependabot PRs with the `auto-merge` label
2. **Waits** for required status checks to pass
3. **Merges** PRs automatically using squash merge

### Dependabot Configuration

Dependabot is already configured in `.github/dependabot.yml` to:

- **Create PRs** weekly on Mondays at 09:00 UTC
- **Apply `auto-merge` label** automatically to all PRs
- **Group updates** by type (production, dev dependencies, etc.)

## Step-by-Step GitHub UI Setup

### Step 1: Navigate to Branch Protection

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** under "Branch protection rules"

### Step 2: Configure Basic Rule

1. Enter `main` in "Branch name pattern"
2. Ensure "Include matching branches" is checked

### Step 3: Enable Required Status Checks

1. ✅ Check "Require status checks to pass before merging"
2. ✅ Check "Require branches to be up to date before merging"
3. In the search box, select:
   - `PR Validation`
   - `Security Audit`
4. Ensure both checks appear in the "Selected status checks" list

### Step 4: Configure PR Review Requirements

1. ✅ Check "Require pull request reviews before merging"
2. Set "Required approving reviews" to `1`
3. ✅ Check "Dismiss stale PR approvals when new commits are pushed"
4. ✅ Check "Require conversation resolution before merging"

### Step 5: Apply Restrictions

1. ✅ Check "Do not allow bypassing the above settings"
2. ✅ Check "Limit who can push to matching branches" (optional, for additional security)
3. If limiting pushes, add repository administrators

### Step 6: Save Changes

1. Click **Create** or **Save changes**
2. Wait for the protection rule to be applied

## Verification Steps

### Step 1: Test Status Checks

1. Create a test pull request to `main`
2. Verify that both status checks appear:
   - ✅ PR Validation
   - ✅ Security Audit
3. Ensure PR cannot be merged until both checks pass

### Step 2: Test Auto-Merge

1. Create a pull request with the `auto-merge` label
2. Wait for both status checks to pass
3. Verify the auto-merge workflow triggers and merges the PR

### Step 3: Test Review Requirements

1. Create a pull request without any reviews
2. Verify the "Merge pull request" button is disabled
3. Add an approving review and verify the button becomes enabled

## Best Practices and Considerations

### Security Considerations

- **Never disable status check bypassing** for production branches
- **Regular dependency updates** through Dependabot reduce security risks
- **Security audit** runs weekly to catch vulnerabilities

### Team Workflow

- **Code reviews** remain required even with auto-merge for Dependabot
- **Maintain 1 reviewer requirement** for small teams
- **Consider CODEOWNERS** for larger teams requiring domain-specific reviews

### Performance Considerations

- **Parallel status checks** run simultaneously to reduce wait time
- **Up-to-date branches** prevent merge conflicts and rebase needs
- **Auto-merge** reduces manual overhead for dependency updates

### Troubleshooting Common Issues

#### Status Checks Not Appearing

- Ensure workflows are triggered on pull_request events
- Check that workflow names match exactly what appears in the UI
- Verify workflows are passing in other contexts

#### Auto-Merge Not Working

- Verify the `auto-merge` label is applied to Dependabot PRs
- Check that the workflow has necessary permissions
- Ensure all required status checks are configured in branch protection

#### Dependabot PRs Stuck

- Verify the GitHub token has sufficient permissions
- Check that auto-merge workflow is not failing
- Ensure branch protection rules are correctly configured

## Maintenance

### Regular Tasks

- **Monthly**: Review and update GitHub Actions versions
- **Quarterly**: Audit branch protection rules effectiveness
- **Annually**: Review auto-merge settings and team requirements

### Monitoring

- **GitHub Insights**: Monitor PR merge times and success rates
- **Security Dashboard**: Review security audit results
- **Dependabot Alerts**: Address any high-priority security updates

## Emergency Procedures

### Disabling Protection (Emergency Only)

If urgent fixes are needed and branch protection is blocking deployment:

1. **Temporary Bypass**: Repository admins can bypass rules
2. **Rule Modification**: Temporarily reduce restrictions
3. **Immediate Action**: Apply the fix, then restore protection immediately

**Never leave branch protection disabled for extended periods.**

## Documentation Updates

Keep this guide updated when:

- Adding new status checks
- Changing review requirements
- Modifying auto-merge behavior
- Updating team workflows

---

**Note**: This guide assumes you have repository administrator privileges. Some settings may require organization-level permissions.
