# Task 07: Fix GitHub Integration Mocks

## Overview

Resolve the GitHub integration test failures that are causing 6 failing tests in the PRGenerator module. This task fixes mock API response mismatches, PR number expectations, and git commit failures in the GitHub integration testing.

## Scope

- Fix 6 failing tests in `tests/unit/modules/github/PRGenerator.test.ts`
- Resolve mock API response mismatches
- Fix PR number expectation issues
- Ensure proper git commit simulation

## Files to Modify

- `tests/unit/modules/github/PRGenerator.test.ts` - PR Generator tests
- `tests/fixtures/mocks/github-mocks.ts` - GitHub API mock implementations
- `src/scripts/modules/github/PRGenerator.ts` - PR Generator implementation (if needed)

## Implementation Steps

### Step 1: Analyze GitHub Integration Test Failures

Examine the specific failure patterns in GitHub integration tests.

**Location**: `tests/unit/modules/github/PRGenerator.test.ts`
**Complexity**: Medium
**Prerequisites**: None

**Implementation Details**:

- Review all 6 failing test cases
- Identify mock API response mismatches
- Note PR number expectation issues
- Map failures to git commit simulation problems

### Step 2: Fix GitHub API Mock Structure

Update the GitHub API mock structure to match real API responses.

**Location**: `tests/fixtures/mocks/github-mocks.ts`
**Complexity**: High
**Prerequisites**: Step 1

**Implementation Details**:

- Create accurate GitHub API response mocks
- Fix PR creation response format
- Update repository data structure
- Ensure proper error response simulation

```typescript
// Example of GitHub API mock that needs to be fixed
export class MockGitHubAPI {
  private prCounter = 100;
  private pulls: any[] = [];
  private issues: any[] = [];

  // Mock PR creation endpoint
  async createPullRequest(
    owner: string,
    repo: string,
    data: any,
  ): Promise<any> {
    const pr = {
      id: this.prCounter,
      number: this.prCounter,
      title: data.title,
      body: data.body,
      head: data.head,
      base: data.base,
      state: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        login: "test-user",
        id: 12345,
      },
      html_url: `https://github.com/${owner}/${repo}/pull/${this.prCounter}`,
      url: `https://api.github.com/repos/${owner}/${repo}/pulls/${this.prCounter}`,
    };

    this.pulls.push(pr);
    this.prCounter++;

    return pr;
  }

  // Mock commit creation
  async createCommit(owner: string, repo: string, data: any): Promise<any> {
    const commit = {
      sha: Math.random().toString(36).substring(2, 15),
      message: data.message,
      author: data.author,
      committer: data.committer,
      tree: data.tree,
      parents: data.parents || [],
      url: `https://api.github.com/repos/${owner}/${repo}/git/commits/${commit.sha}`,
    };

    return commit;
  }

  // Mock branch creation
  async createReference(
    owner: string,
    repo: string,
    ref: string,
    sha: string,
  ): Promise<any> {
    return {
      ref: `refs/heads/${ref}`,
      object: {
        type: "commit",
        sha: sha,
        url: `https://api.github.com/repos/${owner}/${repo}/git/commits/${sha}`,
      },
      url: `https://api.github.com/repos/${owner}/${repo}/git/refs/${ref}`,
    };
  }
}
```

### Step 3: Fix PR Number Expectations

Update tests to handle PR number generation correctly.

**Location**: `tests/unit/modules/github/PRGenerator.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 2

**Implementation Details**:

- Fix PR number generation logic
- Update PR number expectation patterns
- Ensure proper PR number incrementing
- Add PR number validation

### Step 4: Fix Git Commit Simulation

Update git commit mocking to work correctly in test environment.

**Location**: `tests/unit/modules/github/PRGenerator.test.ts` and mock files
**Complexity**: Medium
**Prerequisites**: Step 3

**Implementation Details**:

- Fix git commit command simulation
- Update commit SHA generation
- Ensure proper commit history tracking
- Add commit validation logic

### Step 5: Fix Repository Mock Setup

Update repository mock setup to provide realistic test data.

**Location**: `tests/fixtures/mocks/github-mocks.ts`
**Complexity**: Medium
**Prerequisites**: Step 4

**Implementation Details**:

- Create realistic repository mock data
- Fix repository metadata structure
- Update branch information
- Add proper permission simulation

### Step 6: Fix Error Scenario Testing

Update tests that verify error handling in GitHub integration.

**Location**: `tests/unit/modules/github/PRGenerator.test.ts`
**Complexity**: Medium
**Prerequisites**: Step 5

**Implementation Details**:

- Fix API error simulation
- Update error response format
- Ensure proper error propagation
- Add comprehensive error scenarios

### Step 7: Fix Authentication Mocking

Update authentication mocking for GitHub API calls.

**Location**: `tests/fixtures/mocks/github-mocks.ts`
**Complexity**: Low
**Prerequisites**: Step 6

**Implementation Details**:

- Fix token-based authentication
- Update permission checking
- Ensure proper rate limiting simulation
- Add authentication failure testing

## Testing Requirements

- All 6 PR Generator tests must pass
- GitHub API mocks must be realistic
- PR number generation must work correctly
- Git commit simulation must be accurate
- Error handling must be comprehensive

## Validation Commands

```bash
# Run GitHub integration tests specifically
npm run test -- tests/unit/modules/github/PRGenerator.test.ts

# Run with coverage for GitHub integration
npm run test:coverage -- tests/unit/modules/github/PRGenerator.test.ts

# Run all GitHub tests to ensure no regressions
npm run test -- tests/unit/modules/github/

# Run all integration tests that might use GitHub
npm run test -- tests/integration/security/ tests/integration/complete/
```

## Success Criteria

- [ ] All 6 PR Generator tests pass (0 failures)
- [ ] GitHub API mocks work correctly
- [ ] PR number expectations are met
- [ ] Git commit simulation functions properly
- [ ] Repository mocking is realistic
- [ ] Error scenario testing works
- [ ] Authentication mocking is accurate
- [ ] Tests are deterministic and comprehensive

## Dependencies

- None (can be done in parallel with other tasks)

## Estimated Time

3-4 hours

## Risk Assessment

- **Low Risk**: GitHub integration is isolated to specific module
- **Medium Impact**: Important for CI/CD automation functionality
- **Rollback Strategy**: Simple to revert GitHub mock changes

## Notes

GitHub integration is crucial for CI/CD automation workflows. Proper mocking ensures that these workflows can be tested reliably without depending on external services.

## Common GitHub Integration Issues to Address

Based on the failing tests report, focus on these GitHub integration problems:

1. **API Response Format**: Mock responses not matching real GitHub API format
2. **PR Number Generation**: PR numbers not being generated or expected correctly
3. **Git Commit Simulation**: Git operations not being simulated properly
4. **Repository Metadata**: Repository information not being mocked accurately
5. **Error Responses**: Error scenarios not being simulated correctly
6. **Authentication**: API authentication not being mocked properly
7. **Rate Limiting**: Rate limiting behavior not being simulated

## GitHub Integration Test Scenarios to Focus On

1. **PR Creation**: Complete PR creation workflow from branch to PR
2. **Commit Management**: Git commit creation and tracking
3. **Branch Operations**: Branch creation and management
4. **Repository Metadata**: Repository information retrieval and usage
5. **Error Handling**: API errors and network failure simulation
6. **Authentication**: Token-based API authentication
7. **Rate Limiting**: API rate limiting behavior and handling
