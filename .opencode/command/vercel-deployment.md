---
name: vercel-deployment
agent: task-manager
description: 'Deploy LOFERSIL landing page to Vercel with comprehensive build verification'
---

You are managing the Vercel deployment process for the LOFERSIL landing page. Execute a complete deployment pipeline with build verification, testing, and deployment.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/project/project-context.md

**DEPLOYMENT PROCESS:**

**1. PRE-DEPLOYMENT CHECKS:**

- Verify all files are committed and pushed
- Check environment variables are configured
- Validate build configuration
- Ensure Vercel CLI is installed

**2. BUILD VERIFICATION:**

- Clean previous build artifacts
- Run production build with minification
- Verify all assets are generated correctly
- Check build size and performance metrics

**3. QUALITY ASSURANCE:**

- Run linting and formatting checks
- Validate HTML structure and accessibility
- Test responsive design breakpoints
- Verify SEO meta tags and structured data

**4. DEPLOYMENT EXECUTION:**

- Deploy to Vercel with proper configuration
- Monitor deployment progress and logs
- Verify deployment success and URL accessibility
- Update deployment status and notifications

**5. POST-DEPLOYMENT VALIDATION:**

- Test live site functionality
- Verify all routes and navigation
- Check performance metrics (Core Web Vitals)
- Validate SEO implementation and indexing

**6. MONITORING SETUP:**

- Configure analytics and error tracking
- Set up performance monitoring
- Enable deployment notifications
- Document deployment metrics and rollback procedures

**VERIFICATION CHECKLIST:**

- [ ] Build completes without errors
- [ ] All assets optimized and minified
- [ ] Site loads correctly on all devices
- [ ] Navigation and links function properly
- [ ] SEO meta tags are properly configured
- [ ] Performance scores meet targets
- [ ] Security headers are in place
- [ ] Analytics and monitoring are active

**ROLLBACK PROCEDURES:**

- Immediate rollback: `vercel rollback [deployment-url]`
- Previous deployment: `vercel promote [previous-deployment]`
- Emergency fix: Hotfix branch and rapid deployment

**Execute complete Vercel deployment pipeline now.**
