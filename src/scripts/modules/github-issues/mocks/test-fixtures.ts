/**
 * Test Data Fixtures for E2E Testing
 *
 * Predefined test data fixtures that mirror real GitHub workflows and scenarios.
 */

import { GitHubIssue, GitHubPR, GitHubComment } from './github-api';
import { OpenCodeAnalysis, OpenCodeSolution, OpenCodeReviewResult } from './opencode-agent';
import { WorktreeInfo } from './worktree-manager';

// GitHub Issue Fixtures
export const TEST_ISSUES: Record<string, GitHubIssue> = {
  simpleBug: {
    id: 1,
    number: 1,
    title: 'Fix login button styling',
    body: `
## Description
The login button has incorrect styling on mobile devices.

## Expected Behavior
Button should be properly centered and have correct padding.

## Actual Behavior
Button is misaligned and has incorrect spacing.

## Steps to Reproduce
1. Open login page on mobile
2. Observe button styling
    `,
    labels: [{ name: 'bug' }, { name: 'frontend' }],
    state: 'open',
    user: { login: 'developer1' },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    html_url: 'https://github.com/test/repo/issues/1',
  },

  complexFeature: {
    id: 2,
    number: 2,
    title: 'Implement user authentication system',
    body: `
## Description
Implement a complete user authentication system with login, registration, and session management.

## Requirements
- User registration with email verification
- Secure login/logout functionality
- Password hashing and validation
- Session management with JWT tokens
- Password reset functionality
- Rate limiting for security

## Technical Details
- Use bcrypt for password hashing
- JWT for session tokens
- Email service for verification
- Database storage for user accounts
- Input validation and sanitization

## Acceptance Criteria
- Users can register with valid email
- Users can login with correct credentials
- Invalid login attempts are rejected
- Sessions expire after 24 hours
- Password reset emails are sent
- All inputs are validated and sanitized
    `,
    labels: [{ name: 'enhancement' }, { name: 'high-priority' }, { name: 'backend' }],
    state: 'open',
    user: { login: 'product-manager' },
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-12T14:30:00Z',
    html_url: 'https://github.com/test/repo/issues/2',
  },

  documentationUpdate: {
    id: 3,
    number: 3,
    title: 'Update API documentation for v2.0',
    body: `
## Description
The API documentation needs to be updated to reflect the changes in version 2.0.

## Changes Needed
- Update endpoint signatures
- Add new authentication requirements
- Update response examples
- Add deprecation notices for old endpoints
- Update error response codes

## Files to Update
- docs/api.md
- docs/authentication.md
- README.md API section
    `,
    labels: [{ name: 'documentation' }],
    state: 'open',
    user: { login: 'tech-writer' },
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-01-20T11:00:00Z',
    html_url: 'https://github.com/test/repo/issues/3',
  },

  criticalSecurity: {
    id: 4,
    number: 4,
    title: 'Fix SQL injection vulnerability in user search',
    body: `
## Security Issue
A SQL injection vulnerability has been discovered in the user search functionality.

## Impact
High - Potential data breach and unauthorized access.

## Affected Code
\`\`\`
const query = "SELECT * FROM users WHERE name = '" + searchTerm + "'";
\`\`\`

## Fix Required
- Implement parameterized queries
- Add input sanitization
- Update all database queries to use prepared statements
    `,
    labels: [{ name: 'security' }, { name: 'critical' }, { name: 'backend' }],
    state: 'open',
    user: { login: 'security-team' },
    created_at: '2024-01-18T08:00:00Z',
    updated_at: '2024-01-18T08:00:00Z',
    html_url: 'https://github.com/test/repo/issues/4',
  },

  questionClarification: {
    id: 5,
    number: 5,
    title: 'How do I configure the CI/CD pipeline?',
    body: `
Hi team,

I'm trying to set up the CI/CD pipeline for my project but I'm not sure how to configure it properly.

I've looked at the documentation but it's not clear how to:
1. Set up the build environment
2. Configure the deployment targets
3. Handle environment variables

Could you provide some guidance or point me to more detailed documentation?

Thanks!
    `,
    labels: [{ name: 'question' }, { name: 'ci-cd' }],
    state: 'open',
    user: { login: 'new-developer' },
    created_at: '2024-01-22T15:00:00Z',
    updated_at: '2024-01-22T15:00:00Z',
    html_url: 'https://github.com/test/repo/issues/5',
  },
};

// GitHub PR Fixtures
export const TEST_PRS: Record<string, GitHubPR> = {
  bugFixPR: {
    number: 10,
    title: 'fix: correct login button styling on mobile',
    body: `
Fixes #1

## Changes
- Updated CSS for login button
- Added responsive breakpoints
- Fixed padding and alignment

## Testing
- Verified on multiple mobile devices
- Checked accessibility compliance
    `,
    html_url: 'https://github.com/test/repo/pull/10',
    state: 'open',
    merged: false,
    created_at: '2024-01-16T12:00:00Z',
    updated_at: '2024-01-16T12:00:00Z',
  },

  featurePR: {
    number: 11,
    title: 'feat: implement user authentication system',
    body: `
Implements #2

## Changes
- Added user registration endpoint
- Implemented JWT authentication
- Added password hashing with bcrypt
- Created session management
- Added email verification
- Implemented rate limiting

## Security Considerations
- All inputs are validated and sanitized
- Passwords are properly hashed
- JWT tokens have expiration
- Rate limiting prevents brute force attacks

## Testing
- Unit tests for all components
- Integration tests for auth flow
- Security testing completed
    `,
    html_url: 'https://github.com/test/repo/pull/11',
    state: 'open',
    merged: false,
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
  },
};

// OpenCode Analysis Fixtures
export const TEST_ANALYSES: Record<string, OpenCodeAnalysis> = {
  simpleBugAnalysis: {
    category: 'bug',
    complexity: 'low',
    requirements: ['Fix login button styling', 'Ensure responsive design'],
    acceptanceCriteria: ['Button is properly styled on mobile', 'No layout issues'],
    feasible: true,
    confidence: 0.95,
    reasoning: 'Simple CSS fix with clear requirements',
  },

  complexFeatureAnalysis: {
    category: 'feature',
    complexity: 'high',
    requirements: [
      'Implement user registration',
      'Add authentication middleware',
      'Create session management',
      'Add email verification',
      'Implement password reset',
      'Add security measures',
    ],
    acceptanceCriteria: ['Complete auth system functional', 'All security requirements met'],
    feasible: false,
    confidence: 0.6,
    reasoning: 'Complex multi-component system requiring careful design',
  },

  documentationAnalysis: {
    category: 'documentation',
    complexity: 'low',
    requirements: ['Update API documentation', 'Add new endpoint docs'],
    acceptanceCriteria: ['Documentation is up to date', 'All endpoints documented'],
    feasible: true,
    confidence: 0.9,
    reasoning: 'Straightforward documentation updates',
  },

  securityAnalysis: {
    category: 'bug',
    complexity: 'critical',
    requirements: ['Fix SQL injection vulnerability', 'Implement parameterized queries'],
    acceptanceCriteria: ['No SQL injection possible', 'All queries secure'],
    feasible: true,
    confidence: 0.98,
    reasoning: 'Critical security fix with clear technical solution',
  },

  questionAnalysis: {
    category: 'question',
    complexity: 'low',
    requirements: ['Provide CI/CD configuration guidance'],
    acceptanceCriteria: ['User has clear instructions'],
    feasible: false,
    confidence: 0.3,
    reasoning: 'Question requires human clarification and context',
  },
};

// OpenCode Solution Fixtures
export const TEST_SOLUTIONS: Record<string, OpenCodeSolution> = {
  simpleBugSolution: {
    changes: [
      {
        file: 'src/components/LoginButton.css',
        line: 15,
        oldCode: '  padding: 8px 16px;',
        newCode: '  padding: 12px 24px;',
      },
      {
        file: 'src/components/LoginButton.css',
        line: 25,
        oldCode: '  margin: 0 auto;',
        newCode: '  margin: 0 auto;\n  max-width: 300px;',
      },
    ],
    explanation: 'Updated button padding and added responsive constraints',
    testCases: ['Test button rendering on mobile devices'],
    documentation: 'Updated component documentation with new styling notes',
  },

  securitySolution: {
    changes: [
      {
        file: 'src/database/userQueries.js',
        line: 45,
        oldCode: 'const query = "SELECT * FROM users WHERE name = \'" + searchTerm + "\'";',
        newCode:
          'const query = "SELECT * FROM users WHERE name = ?";\nconst params = [searchTerm];',
      },
      {
        file: 'src/middleware/validation.js',
        line: 1,
        oldCode: '',
        newCode:
          'const sanitizeInput = (input) => {\n  // Input sanitization logic\n  return input.replace(/[<>]/g, "");\n};',
      },
    ],
    explanation: 'Fixed SQL injection by using parameterized queries and added input sanitization',
    testCases: ['Test SQL injection attempts are blocked', 'Verify search functionality works'],
    documentation: 'Added security notes to API documentation',
  },
};

// OpenCode Review Fixtures
export const TEST_REVIEWS: Record<string, OpenCodeReviewResult> = {
  approvedReview: {
    approved: true,
    score: 0.92,
    comments: ['Clean code changes', 'Good test coverage', 'Follows security best practices'],
    securityIssues: [],
    qualityScore: 0.95,
    performanceScore: 0.88,
    maintainabilityScore: 0.9,
    testCoverageScore: 0.85,
    recommendations: ['Consider adding more edge case tests'],
  },

  rejectedReview: {
    approved: false,
    score: 0.65,
    comments: ['Needs better error handling', 'Missing input validation'],
    securityIssues: ['Potential XSS vulnerability'],
    qualityScore: 0.7,
    performanceScore: 0.6,
    maintainabilityScore: 0.75,
    testCoverageScore: 0.5,
    recommendations: ['Add comprehensive input validation', 'Implement proper error handling'],
  },
};

// Worktree Fixtures
export const TEST_WORKTREES: Record<string, WorktreeInfo> = {
  activeWorktree: {
    branch: 'issue-1-fix-login-styling',
    path: '/tmp/worktree-issue-1',
    issueId: 1,
    createdAt: new Date('2024-01-16T12:00:00Z'),
    status: 'active',
    commitSha: 'abc123def456',
    parentBranch: 'main',
  },

  completedWorktree: {
    branch: 'issue-3-update-docs',
    path: '/tmp/worktree-issue-3',
    issueId: 3,
    createdAt: new Date('2024-01-20T11:00:00Z'),
    status: 'completed',
    commitSha: 'def789ghi012',
    parentBranch: 'main',
  },
};

// Comment Fixtures
export const TEST_COMMENTS: Record<string, GitHubComment> = {
  analysisComment: {
    id: 1001,
    body: '🤖 **AI Analysis Complete**\n\n**Category:** Bug\n**Complexity:** Low\n**Feasible:** ✅ Yes\n\n**Requirements:**\n- Fix login button styling\n- Ensure responsive design\n\n**Next Steps:** Generating solution...',
    user: { login: 'ai-assistant' },
    created_at: '2024-01-15T10:05:00Z',
  },

  humanReviewComment: {
    id: 1002,
    body: '🤖 **Analysis Complete**\n\nThis issue requires human review due to high complexity. The implementation involves multiple security-critical components that need careful consideration.\n\n**Recommended Action:** Assign to senior developer for manual implementation.',
    user: { login: 'ai-assistant' },
    created_at: '2024-01-10T09:15:00Z',
  },

  prCreatedComment: {
    id: 1003,
    body: '🤖 **Pull Request Created**\n\n✅ Solution implemented and tested\n✅ Code review passed\n\n**PR:** [#10](https://github.com/test/repo/pull/10) - fix: correct login button styling on mobile\n\nThe changes have been automatically committed and a pull request has been created for review.',
    user: { login: 'ai-assistant' },
    created_at: '2024-01-16T12:30:00Z',
  },
};

// Utility functions for working with fixtures
export function getIssueByType(type: keyof typeof TEST_ISSUES): GitHubIssue {
  return TEST_ISSUES[type];
}

export function getAnalysisByType(type: keyof typeof TEST_ANALYSES): OpenCodeAnalysis {
  return TEST_ANALYSES[type];
}

export function getSolutionByType(type: keyof typeof TEST_SOLUTIONS): OpenCodeSolution {
  return TEST_SOLUTIONS[type];
}

export function getReviewByType(type: keyof typeof TEST_REVIEWS): OpenCodeReviewResult {
  return TEST_REVIEWS[type];
}

export function getAllTestIssues(): GitHubIssue[] {
  return Object.values(TEST_ISSUES);
}

export function getTestIssuesByLabel(label: string): GitHubIssue[] {
  return Object.values(TEST_ISSUES).filter(issue => issue.labels.some(l => l.name === label));
}

export function getTestIssuesByComplexity(complexity: string): GitHubIssue[] {
  const complexityMap: Record<string, string> = {
    low: 'simpleBug,documentationUpdate,questionClarification',
    medium: 'complexFeature',
    high: 'complexFeature',
    critical: 'criticalSecurity',
  };

  const issueKeys = complexityMap[complexity]?.split(',') || [];
  return issueKeys.map(key => TEST_ISSUES[key as keyof typeof TEST_ISSUES]).filter(Boolean);
}
