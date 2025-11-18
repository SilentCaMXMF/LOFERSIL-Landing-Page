# 06. Set Up Chrome-Enabled Environment for Lighthouse

meta:
id: production-readiness-improvements-06
feature: production-readiness-improvements
priority: P2
depends_on: []
tags: [performance, lighthouse, chrome, environment]

objective:

- Set up a Chrome-enabled environment for running Lighthouse performance audits
- Ensure proper Chrome installation and configuration for automated testing
- Prepare environment for reliable performance measurements

deliverables:

- Chrome/Chromium installation verification
- Lighthouse configuration file
- Environment setup documentation
- Test run verification

steps:

- Check current environment for Chrome availability
- Install Chrome/Chromium if not available (consider user's help for external setup)
- Configure Chrome flags for headless testing
- Set CHROME_PATH environment variable
- Test basic Lighthouse functionality
- Create lighthouse configuration file

tests:

- Unit: Chrome installation and path verification
- Integration: Basic Lighthouse audit execution
- Performance: Sample audit on test page

acceptance_criteria:

- Chrome/Chromium executable available and accessible
- CHROME_PATH environment variable set correctly
- Lighthouse can run basic audits successfully
- No Chrome startup errors or timeouts
- Environment ready for production performance testing

validation:

- which google-chrome || which chromium-browser returns valid path
- lighthouse --version executes successfully
- Sample audit completes without Chrome errors
- CHROME_PATH points to working executable

notes:

- Container environments may not have Chrome pre-installed
- May require user's assistance for external Chrome setup
- Consider Docker-based Chrome setup if needed
- Focus on headless Chrome for CI/CD compatibility
