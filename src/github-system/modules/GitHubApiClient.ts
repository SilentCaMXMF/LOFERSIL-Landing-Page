/**
 * GitHub API Client
 *
 * Complete GitHub REST API client with authentication, rate limiting,
 * retry logic, and error handling for the AI-powered GitHub Issues Reviewer System.
 */

import { logger } from "../../scripts/modules/logger";

export interface GitHubApiConfig {
  token: string;
  baseUrl: string; // For GitHub Enterprise support
  timeout: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // base delay in milliseconds
  rateLimitBuffer: number; // buffer time before rate limit reset
  userAgent: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // timestamp
  used: number;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: Array<{ name: string }>;
  user: { login: string };
  created_at: string;
  updated_at: string;
  state: "open" | "closed";
  html_url: string;
  assignee?: { login: string } | null;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  state: "open" | "closed";
  html_url: string;
  user: { login: string };
}

export interface GitHubComment {
  id: number;
  body: string;
  user: { login: string };
  created_at: string;
}

export interface CreatePRParams {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitInfo?: RateLimitInfo;
  retryAfter?: number;
}

export class GitHubApiClient {
  private config: GitHubApiConfig;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: GitHubApiConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate client configuration
   */
  private validateConfig(): void {
    if (!this.config.token) {
      throw new Error("GitHub token is required");
    }
    if (!this.config.baseUrl) {
      throw new Error("Base URL is required");
    }
    if (this.config.maxRetries < 0) {
      throw new Error("Max retries must be non-negative");
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<ApiResponse<T>> {
    try {
      // Check rate limit before making request
      if (this.isRateLimited()) {
        const waitTime = this.getRateLimitWaitTime();
        logger.warn("Rate limit exceeded, waiting", { waitTime, endpoint });
        await this.sleep(waitTime);
      }

      const url = `${this.config.baseUrl}${endpoint}`;
      const headers = {
        Authorization: `token ${this.config.token}`,
        "User-Agent": this.config.userAgent,
        Accept: "application/vnd.github.v3+json",
        ...options.headers,
      };

      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers,
      });

      // Update rate limit info
      this.updateRateLimitInfo(response.headers);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          rateLimitInfo: this.rateLimitInfo || undefined,
        };
      }

      // Handle specific error codes
      if (response.status === 403 && this.isRateLimited()) {
        if (retryCount < this.config.maxRetries) {
          const waitTime = this.getRateLimitWaitTime();
          logger.warn("Rate limited, retrying after delay", {
            retryCount,
            waitTime,
            endpoint,
          });
          await this.sleep(
            waitTime + this.config.retryDelay * Math.pow(2, retryCount),
          );
          return this.makeRequest(endpoint, options, retryCount + 1);
        }
      }

      if (response.status === 404) {
        return {
          success: false,
          error: "Resource not found",
        };
      }

      if (response.status >= 500 && retryCount < this.config.maxRetries) {
        // Server error, retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        logger.warn("Server error, retrying", {
          status: response.status,
          retryCount,
          delay,
          endpoint,
        });
        await this.sleep(delay);
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      const errorText = await response.text();
      logger.error("GitHub API error", {
        status: response.status,
        error: errorText,
        endpoint,
      });

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        rateLimitInfo: this.rateLimitInfo || undefined,
      };
    } catch (error: any) {
      if (retryCount < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        logger.warn("Request failed, retrying", {
          error: error.message,
          retryCount,
          delay,
          endpoint,
        });
        await this.sleep(delay);
        return this.makeRequest(endpoint, options, retryCount + 1);
      }

      logger.error("GitHub API request failed", {
        error: error.message,
        endpoint,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");
    const used = headers.get("x-ratelimit-used");

    if (limit && remaining && reset && used) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10) * 1000, // Convert to milliseconds
        used: parseInt(used, 10),
      };
    }
  }

  /**
   * Check if currently rate limited
   */
  private isRateLimited(): boolean {
    if (!this.rateLimitInfo) return false;
    return this.rateLimitInfo.remaining <= this.config.rateLimitBuffer;
  }

  /**
   * Get wait time until rate limit resets
   */
  private getRateLimitWaitTime(): number {
    if (!this.rateLimitInfo) return 0;
    const now = Date.now();
    return Math.max(0, this.rateLimitInfo.reset - now + 1000); // Add 1 second buffer
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get issue by number
   */
  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<ApiResponse<GitHubIssue>> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
    return this.makeRequest<GitHubIssue>(endpoint);
  }

  /**
   * Get repository issues
   */
  async getIssues(
    owner: string,
    repo: string,
    params: {
      state?: "open" | "closed" | "all";
      labels?: string;
      sort?: "created" | "updated" | "comments";
      direction?: "asc" | "desc";
      per_page?: number;
      page?: number;
    } = {},
  ): Promise<ApiResponse<GitHubIssue[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/repos/${owner}/${repo}/issues?${queryParams.toString()}`;
    return this.makeRequest<GitHubIssue[]>(endpoint);
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    params: CreatePRParams,
  ): Promise<ApiResponse<GitHubPR>> {
    const endpoint = `/repos/${owner}/${repo}/pulls`;
    return this.makeRequest<GitHubPR>(endpoint, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Get pull request by number
   */
  async getPullRequest(
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<ApiResponse<GitHubPR>> {
    const endpoint = `/repos/${owner}/${repo}/pulls/${prNumber}`;
    return this.makeRequest<GitHubPR>(endpoint);
  }

  /**
   * Add labels to an issue
   */
  async addLabelsToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[],
  ): Promise<ApiResponse<any>> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/labels`;
    return this.makeRequest(endpoint, {
      method: "POST",
      body: JSON.stringify({ labels }),
    });
  }

  /**
   * Remove label from issue
   */
  async removeLabelFromIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    label: string,
  ): Promise<ApiResponse<any>> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`;
    return this.makeRequest(endpoint, {
      method: "DELETE",
    });
  }

  /**
   * Create comment on issue
   */
  async createComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<ApiResponse<GitHubComment>> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    return this.makeRequest<GitHubComment>(endpoint, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  /**
   * Get issue comments
   */
  async getIssueComments(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<ApiResponse<GitHubComment[]>> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    return this.makeRequest<GitHubComment[]>(endpoint);
  }

  /**
   * Update issue
   */
  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: "open" | "closed";
      labels?: string[];
      assignee?: string;
    },
  ): Promise<ApiResponse<GitHubIssue>> {
    const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
    return this.makeRequest<GitHubIssue>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<ApiResponse<any>> {
    const endpoint = `/repos/${owner}/${repo}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Get current rate limit status
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Check if API is ready (not rate limited)
   */
  isReady(): boolean {
    return !this.isRateLimited();
  }

  /**
   * Get configuration (for debugging)
   */
  getConfig(): Readonly<GitHubApiConfig> {
    return { ...this.config };
  }
}
