/**
 * GitHub API Client for Issue Management
 * Provides unified interface for GitHub REST and GraphQL APIs with rate limiting and error handling
 */

import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import {
  GitHubConfig,
  GitHubIssue,
  GitHubUser,
  GitHubLabel,
  APIResponse,
  ErrorContext,
  PaginationParams,
  IssueFilter,
} from "./types";

export class GitHubApiClient {
  private octokit: Octokit;
  private graphqlClient: typeof graphql;
  private config: GitHubConfig;
  private rateLimitTracker: {
    remaining: number;
    reset: number;
    lastUsed: number;
  };
  private requestQueue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private isProcessingQueue = false;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.rateLimitTracker = {
      remaining: config.rateLimit.maxRequests,
      reset: Date.now() + config.rateLimit.resetInterval,
      lastUsed: Date.now(),
    };

    // Initialize Octokit with authentication
    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: config.apiEndpoint,
      userAgent: "LOFERSIL-GitHub-Reviewer/1.0.0",
      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          console.warn(
            `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
          );
          return true;
        },
        onAbuseLimit: (retryAfter: number, options: any) => {
          console.error(`Abuse detected. Retry after ${retryAfter} seconds.`);
          return false;
        },
      },
    });

    // Initialize GraphQL client
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${config.token}`,
      },
    });
  }

  /**
   * Get a single issue by number
   */
  async getIssue(issueNumber: number): Promise<APIResponse<GitHubIssue>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.rest.issues.get({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: issueNumber,
        }),
      );

      const issue = this.transformIssueData(response.data);
      const processingTime = Date.now() - startTime;

      return {
        data: issue,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "getIssue", {
        issueId: issueNumber,
      });
    }
  }

  /**
   * List issues with filtering and pagination
   */
  async listIssues(
    params: PaginationParams & IssueFilter = {},
  ): Promise<APIResponse<GitHubIssue[]>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.rest.issues.listForRepo({
          owner: this.config.owner,
          repo: this.config.repo,
          state: (params.state as any) || "open",
          sort: params.sort || "created",
          direction: params.direction || "desc",
          page: params.page || 1,
          per_page: params.per_page || 30,
          labels: params.labels?.join(","),
          assignee: params.assignee,
          creator: params.creator,
          milestone: params.milestone,
          since: params.since,
        }),
      );

      const issues = response.data.map(this.transformIssueData);
      const processingTime = Date.now() - startTime;

      return {
        data: issues,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "listIssues");
    }
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<APIResponse<any>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.rest.repos.get({
          owner: this.config.owner,
          repo: this.config.repo,
        }),
      );

      const processingTime = Date.now() - startTime;

      return {
        data: response.data,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "getRepository");
    }
  }

  /**
   * Get repository contributors
   */
  async getContributors(): Promise<APIResponse<GitHubUser[]>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.rest.repos.listContributors({
          owner: this.config.owner,
          repo: this.config.repo,
        }),
      );

      const processingTime = Date.now() - startTime;

      return {
        data: response.data as GitHubUser[],
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "getContributors");
    }
  }

  /**
   * Get user profile information
   */
  async getUser(username: string): Promise<APIResponse<GitHubUser>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.request("GET /users/{username}", { username }),
      );

      const processingTime = Date.now() - startTime;

      return {
        data: response.data as GitHubUser,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "getUser");
    }
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueNumber: number): Promise<APIResponse<any[]>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.rest.issues.listComments({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: issueNumber,
        }),
      );

      const processingTime = Date.now() - startTime;

      return {
        data: response.data,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "getIssueComments", {
        issueId: issueNumber,
      });
    }
  }

  /**
   * Update an issue (add labels, assign, etc.)
   */
  async updateIssue(
    issueNumber: number,
    updates: {
      labels?: string[];
      assignees?: string[];
      state?: "open" | "closed";
    },
  ): Promise<APIResponse<GitHubIssue>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRateLimit(() =>
        this.octokit.rest.issues.update({
          owner: this.config.owner,
          repo: this.config.repo,
          issue_number: issueNumber,
          ...updates,
        }),
      );

      const issue = this.transformIssueData(response.data);
      const processingTime = Date.now() - startTime;

      return {
        data: issue,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "updateIssue", {
        issueId: issueNumber,
      });
    }
  }

  /**
   * GraphQL query for complex issue data
   */
  async getIssueWithDetails(
    issueNumber: number,
  ): Promise<APIResponse<GitHubIssue>> {
    const startTime = Date.now();

    try {
      const query = `
        query GetIssueWithDetails($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            issue(number: $number) {
              id
              number
              title
              body
              state
              createdAt
              updatedAt
              closedAt
              author {
                login
                name
                avatarUrl
                url
              }
              assignees {
                nodes {
                  login
                  name
                  avatarUrl
                  url
                }
              }
              labels {
                nodes {
                  id
                  name
                  color
                  description
                }
              }
              milestone {
                title
                state
                dueOn
              }
              comments {
                totalCount
              }
              timelineItems(first: 100) {
                nodes {
                  __typename
                  ... on LabeledEvent {
                    createdAt
                    actor {
                      login
                    }
                    label {
                      name
                    }
                  }
                  ... on AssignedEvent {
                    createdAt
                    actor {
                      login
                    }
                    assignee {
                      login
                    }
                  }
                }
              }
            }
          }
          rateLimit {
            limit
            remaining
            resetAt
          }
        }
      `;

      const response = await this.executeWithRateLimit(() =>
        this.graphqlClient(query, {
          owner: this.config.owner,
          repo: this.config.repo,
          number: issueNumber,
        }),
      );

      const typedResponse = response as any;
      const issueData = typedResponse.repository?.issue;
      const transformedIssue = this.transformGraphqlIssueData(issueData);
      const processingTime = Date.now() - startTime;

      // Update rate limit info from GraphQL response
      if (typedResponse.rateLimit) {
        this.rateLimitTracker.remaining = typedResponse.rateLimit.remaining;
        this.rateLimitTracker.reset = new Date(
          typedResponse.rateLimit.resetAt,
        ).getTime();
      }

      return {
        data: transformedIssue,
        success: true,
        metadata: {
          processingTime,
          rateLimit: this.getCurrentRateLimit(),
        },
      };
    } catch (error) {
      return this.handleError(error as Error, "getIssueWithDetails", {
        issueId: issueNumber,
      });
    }
  }

  /**
   * Execute a function with rate limiting
   */
  private async executeWithRateLimit<T>(
    requestFn: () => Promise<T>,
  ): Promise<T> {
    // Check if we need to wait for rate limit reset
    if (this.rateLimitTracker.remaining <= 1) {
      const waitTime = Math.max(0, this.rateLimitTracker.reset - Date.now());
      if (waitTime > 0) {
        console.warn(
          `Rate limit approaching. Waiting ${Math.ceil(waitTime / 1000)} seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Add request to queue for processing
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request: requestFn,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (this.rateLimitTracker.remaining <= 0) {
        const waitTime = this.rateLimitTracker.reset - Date.now();
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          // Rate limit should have reset
          this.rateLimitTracker.remaining = this.config.rateLimit.maxRequests;
          this.rateLimitTracker.reset =
            Date.now() + this.config.rateLimit.resetInterval;
        }
      }

      const queuedRequest = this.requestQueue.shift();
      if (!queuedRequest) break;

      try {
        const result = await queuedRequest.request();
        queuedRequest.resolve(result);
        this.rateLimitTracker.remaining--;
        this.rateLimitTracker.lastUsed = Date.now();
      } catch (error) {
        queuedRequest.reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Transform REST API issue data to our interface
   */
  private transformIssueData(data: any): GitHubIssue {
    return {
      id: data.id,
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state,
      locked: data.locked,
      created_at: data.created_at,
      updated_at: data.updated_at,
      closed_at: data.closed_at,
      user: data.user,
      assignee: data.assignee,
      assignees: data.assignees || [],
      milestone: data.milestone,
      labels: data.labels || [],
      html_url: data.html_url,
      url: data.url,
      repository_url: data.repository_url,
      comments: data.comments,
      pull_request: data.pull_request,
    };
  }

  /**
   * Transform GraphQL issue data to our interface
   */
  private transformGraphqlIssueData(data: any): GitHubIssue {
    return {
      id: parseInt(data.id.replace(/[^0-9]/g, "")),
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state.toLowerCase(),
      locked: false, // GraphQL doesn't provide this in the basic query
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      closed_at: data.closedAt,
      user: {
        id: 0, // Not provided in GraphQL query
        login: data.author.login,
        name: data.author.name,
        email: null,
        avatar_url: data.author.avatarUrl,
        type: "User",
        site_admin: false,
      },
      assignee:
        data.assignees.nodes.length > 0 ? data.assignees.nodes[0] : null,
      assignees: data.assignees.nodes,
      milestone: data.milestone,
      labels: data.labels.nodes,
      html_url: `https://github.com/${this.config.owner}/${this.config.repo}/issues/${data.number}`,
      url: `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues/${data.number}`,
      repository_url: `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`,
      comments: data.comments.totalCount,
    };
  }

  /**
   * Handle API errors
   */
  private handleError(
    error: Error,
    operation: string,
    context: Partial<ErrorContext> = {},
  ): APIResponse<never> {
    const errorContext: ErrorContext = {
      operation,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      originalError: error,
      ...context,
    };

    console.error(`GitHub API Error in ${operation}:`, error);

    // Check for specific error types
    if (error.message.includes("401")) {
      return {
        data: null,
        success: false,
        error: "Authentication failed. Please check your GitHub token.",
      };
    }

    if (error.message.includes("404")) {
      return {
        data: null,
        success: false,
        error: "Resource not found. Check repository and issue numbers.",
      };
    }

    if (error.message.includes("403")) {
      return {
        data: null,
        success: false,
        error: "Access forbidden. Check repository permissions.",
      };
    }

    if (error.message.includes("rate limit")) {
      return {
        data: null,
        success: false,
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    return {
      data: null,
      success: false,
      error: `GitHub API Error: ${error.message}`,
    };
  }

  /**
   * Get current rate limit information
   */
  private getCurrentRateLimit() {
    return {
      limit: this.config.rateLimit.maxRequests,
      remaining: this.rateLimitTracker.remaining,
      reset: this.rateLimitTracker.reset,
    };
  }
}
