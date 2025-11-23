/**
 * GitHub API Mocks for E2E Testing
 *
 * Comprehensive mocks for GitHub REST API endpoints used in the workflow.
 */

import { vi } from "vitest";
import { DEFAULT_TEST_CONFIG } from "../test-config";

// Mock GitHub API Response Types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  state: "open" | "closed";
  user: { login: string };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  html_url: string;
  state: "open" | "closed" | "merged";
  merged: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: { login: string };
  created_at: string;
}

// Mock Factory Functions
export function createMockGitHubIssue(
  overrides: Partial<GitHubIssue> = {},
): GitHubIssue {
  const baseIssue: GitHubIssue = {
    id: Math.floor(Math.random() * 1000000),
    number: Math.floor(Math.random() * 1000) + 1,
    title: "Test Issue",
    body: "This is a test issue for E2E testing",
    labels: [{ name: "bug" }],
    state: "open",
    user: { login: "test-user" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    html_url: `https://github.com/test/repo/issues/${Math.floor(Math.random() * 1000) + 1}`,
  };

  return { ...baseIssue, ...overrides };
}

export function createMockGitHubPR(
  overrides: Partial<GitHubPR> = {},
): GitHubPR {
  const basePR: GitHubPR = {
    number: Math.floor(Math.random() * 1000) + 1,
    title: "Test PR",
    body: "This is a test PR created by E2E tests",
    html_url: `https://github.com/test/repo/pull/${Math.floor(Math.random() * 1000) + 1}`,
    state: "open",
    merged: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { ...basePR, ...overrides };
}

// GitHub API Mock Implementation
export class GitHubAPIMock {
  private config = DEFAULT_TEST_CONFIG.mocks.github;
  private issueStore: Map<number, GitHubIssue> = new Map();
  private prs: Map<number, GitHubPR> = new Map();
  private comments: GitHubComment[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some default test issues
    const defaultIssues = [
      createMockGitHubIssue({
        number: 1,
        title: "Simple bug fix",
        body: "Fix a simple typo in the code",
        labels: [{ name: "bug" }],
      }),
      createMockGitHubIssue({
        number: 2,
        title: "Add new feature",
        body: "Implement user authentication system",
        labels: [{ name: "enhancement" }],
      }),
      createMockGitHubIssue({
        number: 3,
        title: "Update documentation",
        body: "Update API documentation for new endpoints",
        labels: [{ name: "documentation" }],
      }),
    ];

    defaultIssues.forEach((issue) => this.issueStore.set(issue.number, issue));
  }

  private async simulateLatency(): Promise<void> {
    const latency = this.config.responseLatency + Math.random() * 50;
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  private shouldFail(): boolean {
    return Math.random() < this.config.failureRate;
  }

  // Mock API Methods
  issues = {
    get: vi
      .fn()
      .mockImplementation(
        async ({ issue_number }: { issue_number: number }) => {
          await this.simulateLatency();

          if (this.shouldFail()) {
            throw new Error("GitHub API rate limit exceeded");
          }

          const issue = this.issueStore.get(issue_number);
          if (!issue) {
            throw new Error(`Issue #${issue_number} not found`);
          }

          return { data: issue };
        },
      ),

    createComment: vi
      .fn()
      .mockImplementation(async ({ body }: { body: string }) => {
        await this.simulateLatency();

        if (this.shouldFail()) {
          throw new Error("Failed to create comment");
        }

        const comment: GitHubComment = {
          id: Math.floor(Math.random() * 1000000),
          body,
          user: { login: "test-bot" },
          created_at: new Date().toISOString(),
        };

        this.comments.push(comment);
        return { data: comment };
      }),

    update: vi
      .fn()
      .mockImplementation(
        async ({
          issue_number,
          state,
        }: {
          issue_number: number;
          state: string;
        }) => {
          await this.simulateLatency();

          if (this.shouldFail()) {
            throw new Error("Failed to update issue");
          }

          const issue = this.issueStore.get(issue_number);
          if (!issue) {
            throw new Error(`Issue #${issue_number} not found`);
          }

          const updatedIssue = {
            ...issue,
            state: state as "open" | "closed",
            updated_at: new Date().toISOString(),
          };
          this.issueStore.set(issue_number, updatedIssue);

          return { data: updatedIssue };
        },
      ),
  };

  pulls = {
    create: vi
      .fn()
      .mockImplementation(
        async ({
          title,
          body,
          head,
          base,
        }: {
          title: string;
          body: string;
          head: string;
          base: string;
        }) => {
          await this.simulateLatency();

          if (this.shouldFail()) {
            throw new Error("Failed to create pull request");
          }

          const pr = createMockGitHubPR({
            title,
            body,
            state: "open",
            merged: false,
          });

          this.prs.set(pr.number, pr);
          return { data: pr };
        },
      ),

    update: vi
      .fn()
      .mockImplementation(
        async ({
          pull_number,
          state,
        }: {
          pull_number: number;
          state: string;
        }) => {
          await this.simulateLatency();

          if (this.shouldFail()) {
            throw new Error("Failed to update pull request");
          }

          const pr = this.prs.get(pull_number);
          if (!pr) {
            throw new Error(`PR #${pull_number} not found`);
          }

          const updatedPR = {
            ...pr,
            state: state as "open" | "closed" | "merged",
            merged: state === "merged",
            updated_at: new Date().toISOString(),
          };
          this.prs.set(pull_number, updatedPR);

          return { data: updatedPR };
        },
      ),
  };

  repos = {
    getContent: vi
      .fn()
      .mockImplementation(async ({ path }: { path: string }) => {
        await this.simulateLatency();

        if (this.shouldFail()) {
          throw new Error("Failed to get repository content");
        }

        // Mock file content based on path
        const mockContents: Record<string, string> = {
          "README.md": "# Test Repository\n\nThis is a test repository.",
          "package.json": '{"name": "test-repo", "version": "1.0.0"}',
          "src/index.js": 'console.log("Hello World");',
          "docs/api.md": "# API Documentation\n\n## Endpoints\n",
        };

        const content = mockContents[path] || "";
        return {
          data: {
            content: Buffer.from(content).toString("base64"),
            encoding: "base64",
          },
        };
      }),

    createOrUpdateFileContents: vi
      .fn()
      .mockImplementation(
        async ({
          path,
          message,
          content,
          branch,
        }: {
          path: string;
          message: string;
          content: string;
          branch: string;
        }) => {
          await this.simulateLatency();

          if (this.shouldFail()) {
            throw new Error("Failed to update file");
          }

          // Mock successful file update
          return {
            data: {
              commit: {
                sha: Math.random().toString(36).substring(7),
                message,
              },
            },
          };
        },
      ),
  };

  // Utility methods for test control
  addIssue(issue: GitHubIssue): void {
    this.issueStore.set(issue.number, issue);
  }

  getIssue(number: number): GitHubIssue | undefined {
    return this.issueStore.get(number);
  }

  getAllIssues(): GitHubIssue[] {
    return Array.from(this.issueStore.values());
  }

  getAllPRs(): GitHubPR[] {
    return Array.from(this.prs.values());
  }

  getAllComments(): GitHubComment[] {
    return [...this.comments];
  }

  reset(): void {
    this.issueStore.clear();
    this.prs.clear();
    this.comments = [];
    this.initializeMockData();
  }

  setFailureRate(rate: number): void {
    this.config.failureRate = rate;
  }

  setLatency(latency: number): void {
    this.config.responseLatency = latency;
  }
}

// Factory function for creating configured mock instances
export function createGitHubAPIMock(
  config?: Partial<typeof DEFAULT_TEST_CONFIG.mocks.github>,
): GitHubAPIMock {
  const mock = new GitHubAPIMock();
  if (config) {
    if (config.failureRate !== undefined)
      mock.setFailureRate(config.failureRate);
    if (config.responseLatency !== undefined)
      mock.setLatency(config.responseLatency);
  }
  return mock;
}

// Default mock instance for convenience
export const mockGitHubAPI = createGitHubAPIMock();
