/**
 * Realistic GitHub Issue Examples
 *
 * Comprehensive collection of realistic GitHub issue examples
 * covering various scenarios, complexities, and edge cases.
 */

import { GitHubIssue } from '../mocks/github-api';

/**
 * Simple bug reports - straightforward issues with clear fixes
 */
export const SIMPLE_BUGS: Record<string, GitHubIssue> = {
  buttonStyling: {
    id: 1001,
    number: 1,
    title: 'Login button has incorrect padding on mobile',
    body: `
## Description
The login button on the mobile view has incorrect padding that makes it look misaligned.

## Steps to reproduce
1. Open the app on a mobile device
2. Navigate to the login page
3. Observe the login button styling

## Expected behavior
Button should have consistent padding across all screen sizes.

## Actual behavior
Button appears with incorrect padding on mobile screens.

## Environment
- Browser: Chrome Mobile
- OS: iOS 15.2
- App version: 1.2.3
    `,
    labels: [{ name: 'bug' }, { name: 'frontend' }, { name: 'mobile' }],
    state: 'open',
    user: { login: 'frontend-dev' },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    html_url: 'https://github.com/company/app/issues/1',
  },

  typoInText: {
    id: 1002,
    number: 2,
    title: 'Typo in welcome message',
    body: `
## Description
There's a typo in the welcome message on the homepage.

## Location
File: src/components/WelcomeMessage.tsx
Line: 15

## Current text
"Welcom to our application!"

## Correct text
"Welcome to our application!"

## Impact
Minor text correction needed.
    `,
    labels: [{ name: 'bug' }, { name: 'documentation' }, { name: 'good-first-issue' }],
    state: 'open',
    user: { login: 'content-writer' },
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z',
    html_url: 'https://github.com/company/app/issues/2',
  },

  missingAltText: {
    id: 1003,
    number: 3,
    title: 'Missing alt text for profile images',
    body: `
## Accessibility Issue
Profile images in the user dashboard are missing alt text attributes.

## Affected component
UserProfileCard component

## WCAG Guideline
1.1.1 Non-text Content (Level A)

## Impact
Screen reader users cannot understand what the images represent.

## Fix needed
Add descriptive alt text to all profile images.
    `,
    labels: [{ name: 'accessibility' }, { name: 'frontend' }, { name: 'good-first-issue' }],
    state: 'open',
    user: { login: 'accessibility-advocate' },
    created_at: '2024-01-17T09:15:00Z',
    updated_at: '2024-01-17T09:15:00Z',
    html_url: 'https://github.com/company/app/issues/3',
  },
};

/**
 * Feature requests - new functionality or enhancements
 */
export const FEATURE_REQUESTS: Record<string, GitHubIssue> = {
  darkMode: {
    id: 2001,
    number: 10,
    title: 'Add dark mode support',
    body: `
## Feature Request
Implement dark mode theme for better user experience in low-light conditions.

## Requirements
- Toggle between light and dark themes
- Persist user preference in localStorage
- Smooth theme transitions
- Support for system preference detection
- High contrast mode option

## Technical considerations
- CSS custom properties for theme variables
- React context for theme state management
- CSS-in-JS or styled-components approach
- Accessibility compliance (WCAG AA)

## Mockups
[Dark mode mockups attached]

## Priority
High - User experience improvement
    `,
    labels: [
      { name: 'enhancement' },
      { name: 'frontend' },
      { name: 'high-priority' },
      { name: 'user-experience' },
    ],
    state: 'open',
    user: { login: 'ux-designer' },
    created_at: '2024-01-10T11:00:00Z',
    updated_at: '2024-01-12T16:45:00Z',
    html_url: 'https://github.com/company/app/issues/10',
  },

  exportData: {
    id: 2002,
    number: 11,
    title: 'Add data export functionality',
    body: `
## Feature Request
Allow users to export their data in various formats.

## Supported formats
- CSV (Comma Separated Values)
- JSON
- PDF reports
- Excel spreadsheets

## Data types to export
- User profile information
- Activity logs
- Generated reports
- Settings and preferences

## Security considerations
- Data sanitization before export
- Rate limiting to prevent abuse
- Audit logging of export requests
- GDPR compliance for EU users

## Implementation approach
- Backend API endpoints for data retrieval
- Client-side format conversion
- Progress indicators for large exports
- Email notifications when ready
    `,
    labels: [
      { name: 'enhancement' },
      { name: 'backend' },
      { name: 'frontend' },
      { name: 'data-export' },
    ],
    state: 'open',
    user: { login: 'product-manager' },
    created_at: '2024-01-08T13:20:00Z',
    updated_at: '2024-01-11T10:30:00Z',
    html_url: 'https://github.com/company/app/issues/11',
  },
};

/**
 * Complex issues - multi-step, high-complexity problems
 */
export const COMPLEX_ISSUES: Record<string, GitHubIssue> = {
  authenticationSystem: {
    id: 3001,
    number: 50,
    title: 'Implement complete user authentication system',
    body: `
## Epic: User Authentication System

This issue encompasses the complete implementation of user authentication across the application.

## Scope
- User registration with email verification
- Secure login/logout functionality
- Password hashing and validation
- JWT token-based session management
- Password reset flow
- Account lockout protection
- Two-factor authentication (2FA)
- Social login integration (Google, GitHub)
- Session timeout handling
- Remember me functionality

## Security Requirements
- bcrypt for password hashing (minimum 12 rounds)
- JWT tokens with appropriate expiration
- Secure cookie settings (httpOnly, secure, sameSite)
- Rate limiting on auth endpoints
- Input validation and sanitization
- CSRF protection
- Audit logging for security events

## Database Schema Changes
- users table with additional fields
- sessions table for token management
- audit_logs table for security tracking
- Migration scripts for existing data

## API Endpoints Required
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me
- POST /api/auth/verify-email

## Frontend Components
- LoginForm component
- RegisterForm component
- PasswordResetForm component
- AuthGuard HOC
- UserProfile component with auth status

## Testing Requirements
- Unit tests for all auth functions
- Integration tests for auth flows
- Security penetration testing
- Load testing for auth endpoints
- Accessibility testing for auth forms

## Dependencies
- bcryptjs for password hashing
- jsonwebtoken for JWT handling
- express-rate-limit for rate limiting
- nodemailer for email sending
- validator for input validation

## Timeline
- Phase 1 (Week 1-2): Basic auth backend
- Phase 2 (Week 3-4): Frontend integration
- Phase 3 (Week 5-6): Security hardening
- Phase 4 (Week 7-8): Testing and deployment

## Risk Assessment
- High complexity due to security implications
- Requires coordination between frontend/backend teams
- Database migration affects existing users
- Security vulnerabilities could compromise user data

## Acceptance Criteria
- [ ] Users can register with email verification
- [ ] Users can login/logout securely
- [ ] Password reset flow works correctly
- [ ] JWT tokens expire appropriately
- [ ] All auth endpoints are rate limited
- [ ] Security audit passes
- [ ] All tests pass with >90% coverage
- [ ] Documentation is updated
- [ ] Migration guide provided
    `,
    labels: [
      { name: 'epic' },
      { name: 'authentication' },
      { name: 'security' },
      { name: 'backend' },
      { name: 'frontend' },
      { name: 'database' },
      { name: 'high-priority' },
      { name: 'complex' },
    ],
    state: 'open',
    user: { login: 'tech-lead' },
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-14T17:30:00Z',
    html_url: 'https://github.com/company/app/issues/50',
  },

  performanceOptimization: {
    id: 3002,
    number: 51,
    title: 'Performance optimization and monitoring system',
    body: `
## Performance Optimization Initiative

Implement comprehensive performance monitoring and optimization across the application.

## Current Issues
- Page load times exceeding 3 seconds
- Large bundle sizes causing slow initial loads
- Memory leaks in long-running sessions
- Inefficient database queries
- Lack of performance monitoring

## Objectives
- Reduce initial page load to <2 seconds
- Implement code splitting and lazy loading
- Add performance monitoring and alerting
- Optimize database queries and indexing
- Implement caching strategies
- Add performance budgets and CI checks

## Technical Implementation

### Frontend Optimizations
- Code splitting with React.lazy and Suspense
- Bundle analysis and optimization
- Image optimization and lazy loading
- Service worker for caching
- CDN implementation for static assets
- Minimize render-blocking resources

### Backend Optimizations
- Database query optimization
- Redis caching layer
- API response compression
- Connection pooling
- Background job processing
- Database indexing strategy

### Monitoring and Alerting
- Real User Monitoring (RUM)
- Synthetic monitoring
- Performance budgets in CI/CD
- Alerting on performance regressions
- Custom performance metrics
- Error tracking and reporting

## Success Metrics
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- First Input Delay < 100ms
- Cumulative Layout Shift < 0.1
- Bundle size reduction by 30%
- Database query performance improvement

## Implementation Phases
1. **Phase 1**: Performance monitoring setup
2. **Phase 2**: Frontend bundle optimization
3. **Phase 3**: Backend query optimization
4. **Phase 4**: Caching implementation
5. **Phase 5**: Monitoring and alerting
6. **Phase 6**: Continuous optimization

## Team Involvement
- Frontend team for bundle optimization
- Backend team for API and database optimization
- DevOps team for monitoring and infrastructure
- QA team for performance testing
- Product team for prioritization

## Dependencies
- Webpack Bundle Analyzer
- Lighthouse CI
- Redis for caching
- DataDog/New Relic for monitoring
- Performance testing tools

## Risk Assessment
- Bundle splitting might introduce code duplication
- Caching adds complexity and potential stale data issues
- Performance monitoring requires infrastructure costs
- Database changes might affect existing functionality

## Related Issues
- #23: Slow dashboard loading
- #34: Memory leaks in data tables
- #45: Large bundle size complaints
    `,
    labels: [
      { name: 'performance' },
      { name: 'optimization' },
      { name: 'monitoring' },
      { name: 'frontend' },
      { name: 'backend' },
      { name: 'infrastructure' },
      { name: 'high-priority' },
    ],
    state: 'open',
    user: { login: 'engineering-manager' },
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-18T14:20:00Z',
    html_url: 'https://github.com/company/app/issues/51',
  },
};

/**
 * Security issues - vulnerabilities and security fixes
 */
export const SECURITY_ISSUES: Record<string, GitHubIssue> = {
  sqlInjection: {
    id: 4001,
    number: 75,
    title: 'CRITICAL: SQL Injection vulnerability in user search',
    body: `
## 🚨 CRITICAL SECURITY VULNERABILITY

### Vulnerability Type
SQL Injection

### Severity
Critical (CVSS 9.1)

### Affected Component
User search functionality in UserService.js

### Vulnerable Code
\`\`\`javascript
// File: src/services/UserService.js:45
const query = "SELECT * FROM users WHERE name LIKE '%" + searchTerm + "%'";
\`\`\`

### Impact
- Complete database compromise possible
- Unauthorized data access
- Potential data exfiltration
- Account takeover scenarios

### Attack Vector
1. User inputs malicious SQL in search field
2. Malicious input gets concatenated into SQL query
3. Attacker can execute arbitrary SQL commands

### Proof of Concept
Search term: \`' OR '1'='1'; --\`

### Remediation Required
1. **Immediate**: Use parameterized queries or prepared statements
2. **Short-term**: Input validation and sanitization
3. **Long-term**: ORM migration and security code review

### Affected Environments
- Production database
- Staging environment
- Development databases

### Timeline
- **Immediate (< 1 hour)**: Deploy hotfix with parameterized queries
- **Short-term (1-2 days)**: Comprehensive security audit
- **Long-term (1-2 weeks)**: ORM migration and security training

### Communication
- Security team notified
- Incident response protocol activated
- Customer communication plan in progress

### References
- OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
- CWE-89: Improper Neutralization of Special Elements used in an SQL Command
    `,
    labels: [
      { name: 'security' },
      { name: 'critical' },
      { name: 'vulnerability' },
      { name: 'sql-injection' },
      { name: 'backend' },
      { name: 'hotfix-required' },
    ],
    state: 'open',
    user: { login: 'security-researcher' },
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:15:00Z',
    html_url: 'https://github.com/company/app/issues/75',
  },

  xssVulnerability: {
    id: 4002,
    number: 76,
    title: 'XSS vulnerability in comment system',
    body: `
## Security Vulnerability Report

### Vulnerability Type
Cross-Site Scripting (XSS)

### Severity
High (CVSS 7.4)

### Affected Component
Comment rendering system

### Description
User-generated content in comments is not properly sanitized before rendering, allowing execution of malicious JavaScript.

### Vulnerable Code Location
- File: src/components/CommentRenderer.tsx
- Function: renderComment
- Line: 23

### Attack Scenario
1. Attacker posts comment with malicious JavaScript
2. Comment gets stored in database
3. When comment is displayed, JavaScript executes in victim's browser
4. Attacker can steal session cookies, perform actions as victim

### Proof of Concept Payload
\`\`\`html
<script>alert(document.cookie)</script>
<img src=x onerror=alert(document.cookie)>
\`\`\`

### Remediation Steps
1. Implement proper HTML sanitization
2. Use DOMPurify or equivalent library
3. Implement Content Security Policy (CSP)
4. Escape user input on both client and server side
5. Implement rate limiting for comment posting

### Testing Requirements
- XSS payload testing
- CSP header validation
- Sanitization effectiveness verification
- Regression testing for similar components

### Impact Assessment
- Session hijacking possible
- Defacement of application
- Data theft
- Malware distribution

### Affected User Base
All users who can view comments (potentially all authenticated users)
    `,
    labels: [
      { name: 'security' },
      { name: 'xss' },
      { name: 'frontend' },
      { name: 'high-priority' },
      { name: 'vulnerability' },
    ],
    state: 'open',
    user: { login: 'security-team' },
    created_at: '2024-01-19T15:30:00Z',
    updated_at: '2024-01-19T16:00:00Z',
    html_url: 'https://github.com/company/app/issues/76',
  },
};

/**
 * Documentation issues
 */
export const DOCUMENTATION_ISSUES: Record<string, GitHubIssue> = {
  apiDocsUpdate: {
    id: 5001,
    number: 100,
    title: 'Update API documentation for v2.0 endpoints',
    body: `
## Documentation Update Required

### Context
Version 2.0 of the API introduced several breaking changes and new endpoints that need to be documented.

### Changes Requiring Documentation
1. **Authentication endpoints** - New JWT-based auth system
2. **Pagination** - Updated pagination parameters
3. **Error responses** - Standardized error response format
4. **Rate limiting** - New rate limit headers and responses
5. **Deprecation notices** - v1.0 endpoints marked for removal

### Files to Update
- \`docs/api/v2/README.md\` - Main API documentation
- \`docs/api/v2/authentication.md\` - Auth endpoints
- \`docs/api/v2/errors.md\` - Error handling
- \`docs/api/v2/examples/\` - Code examples directory
- \`docs/migration/v1-to-v2.md\` - Migration guide

### New Endpoints to Document
\`\`\`
POST /api/v2/auth/login
POST /api/v2/auth/refresh
GET  /api/v2/users/{id}
POST /api/v2/users/{id}/update
DELETE /api/v2/users/{id}
GET  /api/v2/data/export
\`\`\`

### Breaking Changes
- Authentication now requires Bearer tokens
- Pagination uses cursor-based approach
- Error responses use different HTTP status codes
- Some query parameters renamed

### Examples Needed
- Authentication flow examples
- CRUD operations examples
- Error handling examples
- Migration examples from v1.0

### Review Process
- Technical review by API team
- Editorial review by documentation team
- User testing of examples
- Final approval by product team
    `,
    labels: [
      { name: 'documentation' },
      { name: 'api' },
      { name: 'v2.0' },
      { name: 'breaking-changes' },
    ],
    state: 'open',
    user: { login: 'technical-writer' },
    created_at: '2024-01-18T12:00:00Z',
    updated_at: '2024-01-18T12:00:00Z',
    html_url: 'https://github.com/company/app/issues/100',
  },
};

/**
 * Question/support issues - not suitable for automation
 */
export const QUESTION_ISSUES: Record<string, GitHubIssue> = {
  ciCdSetup: {
    id: 6001,
    number: 150,
    title: 'How do I configure CI/CD pipeline for monorepo setup?',
    body: `
## Question

Hi team,

I'm trying to set up a CI/CD pipeline for our monorepo project but I'm running into some issues. Could you provide some guidance?

### Our Setup
- Monorepo with multiple packages (frontend, backend, shared libs)
- Using Yarn workspaces
- GitHub Actions for CI/CD
- Docker for containerization

### Current Issues
1. **Build caching** - How to effectively cache dependencies across jobs?
2. **Parallel builds** - Best practices for building multiple packages concurrently?
3. **Testing strategy** - How to run tests efficiently across packages?
4. **Deployment** - Strategies for deploying multiple services?

### What I've Tried
- Using actions/cache with yarn cache folder
- Matrix builds for different packages
- Docker layer caching
- GitHub Actions reusable workflows

### Questions
1. What's the recommended approach for monorepo CI/CD?
2. Are there any example workflows I can reference?
3. How do you handle inter-package dependencies in CI?
4. What's the best way to optimize build times?

### Environment
- GitHub Actions
- Ubuntu runners
- Node.js 18
- Docker

Thanks for any help or pointers to documentation!

Best,
DevOps Engineer
    `,
    labels: [
      { name: 'question' },
      { name: 'ci-cd' },
      { name: 'monorepo' },
      { name: 'github-actions' },
    ],
    state: 'open',
    user: { login: 'devops-engineer' },
    created_at: '2024-01-22T10:30:00Z',
    updated_at: '2024-01-22T10:30:00Z',
    html_url: 'https://github.com/company/app/issues/150',
  },

  libraryMigration: {
    id: 6002,
    number: 151,
    title: 'Guidance needed: Migrating from Library X to Library Y',
    body: `
## Migration Question

Hello,

Our team is considering migrating from Library X to Library Y for our project, but we have some concerns and questions about the process.

### Current Setup
- Currently using Library X v2.1.0
- Large codebase with 50+ components using Library X
- Team has extensive experience with Library X
- Project has been stable for 2+ years

### Migration Considerations
1. **Breaking changes** - What are the major breaking changes we should be aware of?
2. **Migration path** - Is there a recommended migration strategy or tooling?
3. **Performance impact** - Any performance differences we should expect?
4. **Bundle size** - How does Library Y compare in terms of bundle size?
5. **Community support** - What's the community and maintenance status?

### Our Concerns
- Timeline for migration (we have a 3-month window)
- Potential regressions during migration
- Training team on new library
- Maintaining backwards compatibility during transition

### Questions
1. Has anyone else done this migration? What was your experience?
2. Are there any gotchas or common pitfalls to avoid?
3. What's the recommended approach for gradual migration?
4. Any tools or scripts that can help with the migration?

### Additional Context
- Team size: 8 developers
- Project type: React SPA
- Current bundle size: ~2.5MB
- Performance requirements: <2s initial load

We'd appreciate any insights, experiences, or recommendations from the community.

Thanks!
    `,
    labels: [
      { name: 'question' },
      { name: 'migration' },
      { name: 'libraries' },
      { name: 'help-wanted' },
    ],
    state: 'open',
    user: { login: 'senior-developer' },
    created_at: '2024-01-21T16:45:00Z',
    updated_at: '2024-01-21T16:45:00Z',
    html_url: 'https://github.com/company/app/issues/151',
  },
};

/**
 * Edge cases and special scenarios
 */
export const EDGE_CASES: Record<string, GitHubIssue> = {
  emptyIssue: {
    id: 7001,
    number: 200,
    title: '',
    body: '',
    labels: [],
    state: 'open',
    user: { login: 'test-user' },
    created_at: '2024-01-25T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z',
    html_url: 'https://github.com/company/app/issues/200',
  },

  veryLongIssue: {
    id: 7002,
    number: 201,
    title:
      'This is an extremely long title that goes on and on and on with many many many words to test how the system handles very long titles that might cause layout issues or truncation problems in various parts of the application interface and user experience',
    body: 'A'.repeat(10000), // 10KB of content
    labels: [
      { name: 'very-long-label-name-that-might-cause-issues' },
      { name: 'another-extremely-long-label-name' },
      { name: 'performance-testing' },
    ],
    state: 'open',
    user: { login: 'performance-tester' },
    created_at: '2024-01-24T00:00:00Z',
    updated_at: '2024-01-24T00:00:00Z',
    html_url: 'https://github.com/company/app/issues/201',
  },

  specialCharacters: {
    id: 7003,
    number: 202,
    title: 'Issue with special characters: ñáéíóú 🚀 🔥 ❤️ 中文 🎉',
    body: `
## Description with special characters
This issue contains various special characters and emojis:
- Accented characters: ñáéíóú
- Emojis: 🚀 🔥 ❤️ 🎉
- Chinese characters: 中文
- Math symbols: ∑ ∏ √ ∫
- Currency symbols: ¢ £ ¤ ¥ € ₹

## Steps to reproduce
1. Create content with special characters
2. Save and display the content
3. Check if all characters render correctly

## Expected behavior
All special characters should display correctly across different browsers and platforms.
    `,
    labels: [{ name: 'i18n' }, { name: 'unicode' }, { name: 'special-characters' }],
    state: 'open',
    user: { login: 'i18n-specialist' },
    created_at: '2024-01-23T00:00:00Z',
    updated_at: '2024-01-23T00:00:00Z',
    html_url: 'https://github.com/company/app/issues/202',
  },
};

/**
 * Utility functions for working with issue fixtures
 */
export function getIssueById(id: number): GitHubIssue | undefined {
  const allIssues = [
    ...Object.values(SIMPLE_BUGS),
    ...Object.values(FEATURE_REQUESTS),
    ...Object.values(COMPLEX_ISSUES),
    ...Object.values(SECURITY_ISSUES),
    ...Object.values(DOCUMENTATION_ISSUES),
    ...Object.values(QUESTION_ISSUES),
    ...Object.values(EDGE_CASES),
  ];

  return allIssues.find(issue => issue.id === id);
}

export function getIssuesByLabel(label: string): GitHubIssue[] {
  const allIssues = [
    ...Object.values(SIMPLE_BUGS),
    ...Object.values(FEATURE_REQUESTS),
    ...Object.values(COMPLEX_ISSUES),
    ...Object.values(SECURITY_ISSUES),
    ...Object.values(DOCUMENTATION_ISSUES),
    ...Object.values(QUESTION_ISSUES),
    ...Object.values(EDGE_CASES),
  ];

  return allIssues.filter(issue => issue.labels.some(l => l.name === label));
}

export function getIssuesByComplexity(
  complexity: 'simple' | 'medium' | 'high' | 'critical'
): GitHubIssue[] {
  const complexityMap = {
    simple: [...Object.values(SIMPLE_BUGS), ...Object.values(DOCUMENTATION_ISSUES)],
    medium: [...Object.values(FEATURE_REQUESTS)],
    high: [...Object.values(COMPLEX_ISSUES)],
    critical: [...Object.values(SECURITY_ISSUES)],
  };

  return complexityMap[complexity] || [];
}

export function getAllIssues(): GitHubIssue[] {
  return [
    ...Object.values(SIMPLE_BUGS),
    ...Object.values(FEATURE_REQUESTS),
    ...Object.values(COMPLEX_ISSUES),
    ...Object.values(SECURITY_ISSUES),
    ...Object.values(DOCUMENTATION_ISSUES),
    ...Object.values(QUESTION_ISSUES),
    ...Object.values(EDGE_CASES),
  ];
}
