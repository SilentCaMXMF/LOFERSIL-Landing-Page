# 06. Test live deployed site

meta:
id: test-vercel-deployment-06
feature: test-vercel-deployment
priority: P1
depends_on: [test-vercel-deployment-05]
tags: [testing, live-site, validation]

objective:

- Verify that the deployed site functions correctly in production

deliverables:

- Fully functional live website
- All features working as expected
- Performance and accessibility validated

steps:

- Access the deployed URL from Vercel
- Test all navigation links and sections
- Verify responsive design on different screen sizes
- Test contact form submission
- Check for console errors
- Validate SEO meta tags and social sharing
- Test loading performance

tests:

- Unit: Individual feature testing (forms, navigation)
- Integration/e2e: Full user journey testing

acceptance_criteria:

- Site loads without errors
- All pages and sections accessible
- Contact form works end-to-end
- Responsive design functions correctly
- No broken links or missing assets
- Performance meets acceptable standards

validation:

- Use browser dev tools to check for errors
- Test on multiple devices/browsers
- Use online tools for performance testing (Lighthouse)
- Verify all interactive elements work
- Check accessibility with automated tools

notes:

- Document any production-specific issues
- Compare with local development version
- Ensure all environment variables are properly set
