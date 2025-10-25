---
name: preview-deployment
agent: task-manager
description: 'Create preview deployment on Vercel for testing and review'
---

You are creating a preview deployment on Vercel for testing and review purposes. This generates a temporary URL for sharing and testing before production deployment.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/project/project-context.md

**PREVIEW DEPLOYMENT PROCESS:**

**1. ENVIRONMENT SETUP:**

- Verify current branch and changes
- Check for conflicts with main branch
- Prepare preview-specific configuration

**2. BUILD FOR PREVIEW:**

- Clean previous build artifacts
- Run build with preview optimizations
- Include development-friendly debugging tools

**3. DEPLOY PREVIEW:**

- Create Vercel preview deployment
- Generate unique preview URL
- Configure preview-specific settings

**4. PREVIEW VALIDATION:**

- Test preview URL functionality
- Verify all features work correctly
- Check responsive design and accessibility

**5. SHARING & COLLABORATION:**

- Generate preview deployment summary
- Create shareable preview link
- Provide feedback collection instructions

**PREVIEW FEATURES:**

- Temporary URL for testing
- Automatic cleanup after 7 days
- Comment integration for pull requests
- Performance and SEO testing
- Mobile and desktop compatibility

**PREVIEW URL GENERATION:**

- Unique URL for each deployment
- Branch-specific deployment tracking
- Automatic PR comment integration
- QR code generation for mobile testing

**Execute preview deployment creation now.**
