/**
 * MCP Connection Endpoint Testing Script
 *
 * Comprehensive testing script to diagnose and resolve MCP connection issues.
 * Tests multiple endpoints, authentication methods, and streaming approaches.
 *
 * Key Findings from Tasks 01-03:
 * 1. EventSource cannot send POST requests with Authorization headers
 * 2. Server URL may be incorrect (`https://api.githubcopilot.com/mcp/` vs `https://api.githubcopilot.com/`)
 * 3. Authentication token issues (missing validation, wrong environment variable names)
 * 4. Missing GitHub Copilot specific token scopes
 */

import { ErrorManager } from "./src/scripts/modules/ErrorManager";

// ============================================================================
// CONFIGURATION AND TYPES
// ============================================================================

interface TestConfig {
  endpoints: string[];
  tokens: {
    githubPersonal?: string;
    githubCopilot?: string;
    mcp?: string;
  };
  timeouts: {
    connection: number;
    request: number;
    total: number;
  };
}

interface TestResult {
  endpoint: string;
  method: string;
  status: "success" | "failed" | "timeout" | "error";
  responseTime: number;
  httpStatus?: number;
  error?: string;
  details?: any;
  recommendations?: string[];
}

interface EndpointAnalysis {
  endpoint: string;
  tests: TestResult[];
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageResponseTime: number;
    recommendedMethod?: string;
  };
  issues: string[];
  recommendations: string[];
}

interface TokenValidation {
  token: string;
  type: string;
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

// ============================================================================
// MAIN TEST CLASS
// ============================================================================

class MCPEndpointTester {
  private errorManager: ErrorManager;
  private config: TestConfig;
  private results: Map<string, EndpointAnalysis> = new Map();

  constructor() {
    this.errorManager = new ErrorManager();
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from environment and defaults
   */
  private loadConfiguration(): TestConfig {
    return {
      endpoints: [
        // Primary GitHub Copilot endpoints
        "https://api.githubcopilot.com/mcp/",
        "https://api.githubcopilot.com/",
        "https://api.githubcopilot.com/mcp/initialize",
        "https://api.githubcopilot.com/v1/mcp",
        "https://api.githubcopilot.com/v1/mcp/",

        // Alternative endpoints
        "https://copilot.github.com/mcp",
        "https://copilot.github.com/api/mcp",
        "https://mcp.githubcopilot.com/",

        // Development/test endpoints
        "https://api.githubcopilot.com/mcp/sse",
        "https://api.githubcopilot.com/mcp/stream",

        // Legacy endpoints
        "https://api.githubcopilot.com/mcp/v2",
        "https://api.githubcopilot.com/mcp/2024-11",
      ],
      tokens: {
        githubPersonal:
          process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
          process.env.GITHUB_ACCESS_TOKEN ||
          process.env.GITHUB_TOKEN,
        githubCopilot:
          process.env.GITHUB_COPILOT_TOKEN || process.env.COPILOT_TOKEN,
        mcp: process.env.MCP_API_KEY || process.env.GITHUB_MCP_TOKEN,
      },
      timeouts: {
        connection: 10000, // 10 seconds
        request: 30000, // 30 seconds
        total: 120000, // 2 minutes total
      },
    };
  }

  /**
   * Run comprehensive endpoint testing
   */
  async runComprehensiveTest(): Promise<void> {
    console.log("🚀 Starting MCP Endpoint Testing Suite");
    console.log("=".repeat(60));

    // Step 1: Validate authentication tokens
    console.log("\n📋 Step 1: Token Validation");
    await this.validateTokens();

    // Step 2: Test each endpoint with multiple methods
    console.log("\n🔍 Step 2: Endpoint Testing");
    for (const endpoint of this.config.endpoints) {
      console.log(`\n📍 Testing endpoint: ${endpoint}`);
      await this.testEndpoint(endpoint);
    }

    // Step 3: Generate comprehensive analysis
    console.log("\n📊 Step 3: Analysis and Recommendations");
    await this.generateAnalysis();

    // Step 4: Provide actionable recommendations
    console.log("\n🎯 Step 4: Actionable Recommendations");
    await this.provideRecommendations();

    console.log("\n✅ MCP Endpoint Testing Complete");
  }

  /**
   * Validate all available authentication tokens
   */
  private async validateTokens(): Promise<void> {
    console.log("   🔐 Analyzing authentication tokens...");

    const tokens = [
      { key: "githubPersonal", name: "GitHub Personal Access Token" },
      { key: "githubCopilot", name: "GitHub Copilot Token" },
      { key: "mcp", name: "MCP API Key" },
    ];

    for (const { key, name } of tokens) {
      const token = this.config.tokens[key as keyof typeof this.config.tokens];
      if (!token) {
        console.log(`   ❌ ${name}: Not found in environment`);
        continue;
      }

      const validation = await this.validateToken(token, name);
      if (validation.valid) {
        console.log(`   ✅ ${name}: Valid format`);
      } else {
        console.log(`   ⚠️  ${name}: Issues found`);
        validation.issues.forEach((issue) => console.log(`      - ${issue}`));
      }
    }
  }

  /**
   * Validate individual token format and structure
   */
  private async validateToken(
    token: string,
    type: string,
  ): Promise<TokenValidation> {
    const validation: TokenValidation = {
      token: token.substring(0, 10) + "...",
      type,
      valid: true,
      issues: [],
      suggestions: [],
    };

    // Check token length
    if (token.length < 20) {
      validation.valid = false;
      validation.issues.push("Token appears too short");
    }

    // Check token format based on type
    if (type.includes("GitHub")) {
      if (
        !token.startsWith("ghp_") &&
        !token.startsWith("gho_") &&
        !token.startsWith("ghu_")
      ) {
        validation.issues.push(
          "GitHub token should start with ghp_, gho_, or ghu_",
        );
        validation.suggestions.push(
          "Ensure you're using a GitHub Personal Access Token",
        );
      }
    }

    // Check for common token issues
    if (
      token.includes("your-") ||
      token.includes("example") ||
      token.includes("test")
    ) {
      validation.valid = false;
      validation.issues.push("Token appears to be placeholder/example token");
    }

    // Check for whitespace
    if (token.trim() !== token) {
      validation.valid = false;
      validation.issues.push("Token contains leading/trailing whitespace");
    }

    return validation;
  }

  /**
   * Test a specific endpoint with multiple connection methods
   */
  private async testEndpoint(endpoint: string): Promise<void> {
    const tests: TestResult[] = [];

    // Test 1: Basic HTTP POST with JSON-RPC initialize
    tests.push(await this.testHTTPPost(endpoint));

    // Test 2: HTTP POST with different authentication
    tests.push(await this.testHTTPWithAuth(endpoint));

    // Test 3: EventSource streaming (if supported)
    tests.push(await this.testEventSource(endpoint));

    // Test 4: Fetch with streaming
    tests.push(await this.testFetchStreaming(endpoint));

    // Test 5: Alternative content types
    tests.push(await this.testAlternativeContentTypes(endpoint));

    // Store results
    this.results.set(endpoint, {
      endpoint,
      tests,
      summary: this.calculateTestSummary(tests),
      issues: this.extractIssues(tests),
      recommendations: this.generateEndpointRecommendations(tests),
    });

    // Print summary for this endpoint
    const summary = this.calculateTestSummary(tests);
    console.log(
      `   📊 ${summary.successfulTests}/${summary.totalTests} tests passed`,
    );
    if (summary.recommendedMethod) {
      console.log(`   💡 Recommended method: ${summary.recommendedMethod}`);
    }
  }

  /**
   * Test HTTP POST with JSON-RPC initialize
   */
  private async testHTTPPost(endpoint: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.getBestAvailableAuth(),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            clientInfo: {
              name: "MCP Endpoint Tester",
              version: "1.0.0",
            },
          },
        }),
        signal: AbortSignal.timeout(this.config.timeouts.request),
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      return {
        endpoint,
        method: "HTTP POST (JSON-RPC)",
        status: response.ok ? "success" : "failed",
        responseTime,
        httpStatus: response.status,
        details: {
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseText: responseText.substring(0, 500),
        },
        recommendations: this.generateResponseRecommendations(
          response,
          responseText,
        ),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        method: "HTTP POST (JSON-RPC)",
        status: error.name === "AbortError" ? "timeout" : "error",
        responseTime,
        error: error.message,
        recommendations: this.generateErrorRecommendations(error),
      };
    }
  }

  /**
   * Test HTTP with different authentication approaches
   */
  private async testHTTPWithAuth(endpoint: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Try different auth headers
      const authMethods = [
        this.config.tokens.githubPersonal
          ? `Bearer ${this.config.tokens.githubPersonal}`
          : null,
        this.config.tokens.githubCopilot
          ? `token ${this.config.tokens.githubCopilot}`
          : null,
        this.config.tokens.mcp ? `Bearer ${this.config.tokens.mcp}` : null,
      ].filter(Boolean);

      // Test with first available auth method
      const authHeader = authMethods[0] || "";
      const authType = authHeader.startsWith("Bearer") ? "Bearer" : "token";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
          "X-GitHub-OTP": "0", // For 2FA if needed
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
          },
        }),
        signal: AbortSignal.timeout(this.config.timeouts.request),
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      return {
        endpoint,
        method: `HTTP POST (${authType} auth)`,
        status: response.ok ? "success" : "failed",
        responseTime,
        httpStatus: response.status,
        details: {
          authType,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseText: responseText.substring(0, 500),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        method: "HTTP POST (alt auth)",
        status: error.name === "AbortError" ? "timeout" : "error",
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Test EventSource streaming connection
   */
  private async testEventSource(endpoint: string): Promise<TestResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        // Note: EventSource doesn't support POST or custom headers
        // This is a known limitation we're testing
        const eventSource = new EventSource(endpoint);

        const timeout = setTimeout(() => {
          eventSource.close();
          resolve({
            endpoint,
            method: "EventSource",
            status: "timeout",
            responseTime: this.config.timeouts.connection,
            error: "Connection timeout",
            recommendations: [
              "EventSource cannot send POST requests with Authorization headers",
              "Use fetch() with ReadableStream for streaming instead",
            ],
          });
        }, this.config.timeouts.connection);

        eventSource.onopen = () => {
          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;
          eventSource.close();

          resolve({
            endpoint,
            method: "EventSource",
            status: "success",
            responseTime,
            recommendations: [
              "EventSource connected but cannot send authentication",
              "Not suitable for authenticated MCP connections",
            ],
          });
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          const responseTime = Date.now() - startTime;
          eventSource.close();

          resolve({
            endpoint,
            method: "EventSource",
            status: "error",
            responseTime,
            error: "EventSource connection failed",
            recommendations: [
              "EventSource cannot handle authentication headers",
              "Use fetch() with streaming for authenticated connections",
            ],
          });
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        resolve({
          endpoint,
          method: "EventSource",
          status: "error",
          responseTime,
          error: error.message,
        });
      }
    });
  }

  /**
   * Test fetch with streaming response
   */
  private async testFetchStreaming(endpoint: string): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: this.getBestAvailableAuth(),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
          },
        }),
        signal: AbortSignal.timeout(this.config.timeouts.request),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const responseText = await response.text();
        return {
          endpoint,
          method: "Fetch streaming",
          status: "failed",
          responseTime,
          httpStatus: response.status,
          error: responseText,
        };
      }

      // Test streaming capabilities
      const reader = response.body?.getReader();
      let chunks = 0;
      let totalBytes = 0;

      if (reader) {
        try {
          const timeout = setTimeout(() => {
            reader.cancel();
          }, 5000); // 5 second streaming test

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks++;
            totalBytes += value.length;
          }

          clearTimeout(timeout);
        } catch (error) {
          // Streaming failed
        }
      }

      return {
        endpoint,
        method: "Fetch streaming",
        status: "success",
        responseTime,
        details: {
          chunks,
          totalBytes,
          contentType: response.headers.get("content-type"),
          streamingSupported: chunks > 0,
        },
        recommendations:
          chunks > 0
            ? [
                "Streaming is supported at this endpoint",
                "Use fetch() with ReadableStream for real-time updates",
              ]
            : ["Streaming not detected, consider polling instead"],
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        method: "Fetch streaming",
        status: error.name === "AbortError" ? "timeout" : "error",
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Test alternative content types and approaches
   */
  private async testAlternativeContentTypes(
    endpoint: string,
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json, application/json",
          Authorization: this.getBestAvailableAuth(),
        },
        body: JSON.stringify({
          data: {
            type: "mcp-request",
            attributes: {
              method: "initialize",
              protocolVersion: "2024-11-05",
            },
          },
        }),
        signal: AbortSignal.timeout(this.config.timeouts.request),
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      return {
        endpoint,
        method: "Alternative content type",
        status: response.ok ? "success" : "failed",
        responseTime,
        httpStatus: response.status,
        details: {
          responseText: responseText.substring(0, 200),
          contentType: response.headers.get("content-type"),
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        endpoint,
        method: "Alternative content type",
        status: error.name === "AbortError" ? "timeout" : "error",
        responseTime,
        error: error.message,
      };
    }
  }

  /**
   * Get the best available authentication header
   */
  private getBestAvailableAuth(): string {
    const tokens = this.config.tokens;

    if (tokens.githubCopilot) {
      return `Bearer ${tokens.githubCopilot}`;
    } else if (tokens.githubPersonal) {
      return `Bearer ${tokens.githubPersonal}`;
    } else if (tokens.mcp) {
      return `Bearer ${tokens.mcp}`;
    }

    return "";
  }

  /**
   * Calculate test summary statistics
   */
  private calculateTestSummary(tests: TestResult[]) {
    const totalTests = tests.length;
    const successfulTests = tests.filter((t) => t.status === "success").length;
    const failedTests = tests.filter((t) => t.status === "failed").length;

    const responseTimes = tests
      .filter((t) => t.responseTime > 0)
      .map((t) => t.responseTime);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const successfulTest = tests.find((t) => t.status === "success");
    const recommendedMethod = successfulTest?.method;

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageResponseTime,
      recommendedMethod,
    };
  }

  /**
   * Extract common issues from test results
   */
  private extractIssues(tests: TestResult[]): string[] {
    const issues = new Set<string>();

    tests.forEach((test) => {
      if (test.httpStatus === 400) {
        issues.add(
          "HTTP 400 - Bad Request (likely authentication or format issue)",
        );
      }
      if (test.httpStatus === 401) {
        issues.add("HTTP 401 - Unauthorized (invalid or missing token)");
      }
      if (test.httpStatus === 403) {
        issues.add("HTTP 403 - Forbidden (insufficient permissions)");
      }
      if (test.httpStatus === 404) {
        issues.add("HTTP 404 - Not Found (endpoint does not exist)");
      }
      if (test.httpStatus === 429) {
        issues.add("HTTP 429 - Rate Limited (too many requests)");
      }
      if (test.error && test.error.includes("CORS")) {
        issues.add("CORS error (missing headers or cross-origin restriction)");
      }
      if (test.error && test.error.includes("Network")) {
        issues.add("Network connectivity issue");
      }
    });

    return Array.from(issues);
  }

  /**
   * Generate endpoint-specific recommendations
   */
  private generateEndpointRecommendations(tests: TestResult[]): string[] {
    const recommendations: string[] = [];

    const hasSuccessfulTest = tests.some((t) => t.status === "success");
    const hasAuthErrors = tests.some(
      (t) => t.httpStatus === 401 || t.httpStatus === 403,
    );
    const hasNotFound = tests.some((t) => t.httpStatus === 404);
    const hasBadRequest = tests.some((t) => t.httpStatus === 400);

    if (hasSuccessfulTest) {
      const successTest = tests.find((t) => t.status === "success");
      recommendations.push(`✅ Working: ${successTest?.method}`);
    }

    if (hasNotFound) {
      recommendations.push(
        "❌ Endpoint may not exist or requires different path",
      );
    }

    if (hasAuthErrors) {
      recommendations.push(
        "🔐 Check authentication token format and permissions",
      );
      recommendations.push("🔑 Verify token has required MCP scopes");
    }

    if (hasBadRequest) {
      recommendations.push("📝 Check request format and JSON-RPC structure");
    }

    return recommendations;
  }

  /**
   * Generate response-specific recommendations
   */
  private generateResponseRecommendations(
    response: Response,
    responseText: string,
  ): string[] {
    const recommendations: string[] = [];

    if (response.status === 400) {
      recommendations.push("Check request format and JSON-RPC structure");
      recommendations.push("Verify all required fields are present");

      if (
        responseText.includes("missing") ||
        responseText.includes("required")
      ) {
        recommendations.push("Some required parameters are missing");
      }
    }

    if (response.status === 401) {
      recommendations.push("Authentication token is invalid or expired");
      recommendations.push("Check token format and environment variable names");
    }

    if (response.status === 403) {
      recommendations.push("Token lacks required permissions");
      recommendations.push("Ensure token has MCP or Copilot scopes");
    }

    if (response.status === 415) {
      recommendations.push("Content-Type not supported");
      recommendations.push("Try application/json instead");
    }

    return recommendations;
  }

  /**
   * Generate error-specific recommendations
   */
  private generateErrorRecommendations(error: Error): string[] {
    const recommendations: string[] = [];

    if (error.message.includes("fetch")) {
      recommendations.push(
        "Network connectivity issue - check internet connection",
      );
      recommendations.push("Verify endpoint URL is correct");
    }

    if (error.message.includes("timeout")) {
      recommendations.push(
        "Request timed out - server may be slow or unreachable",
      );
      recommendations.push("Try increasing timeout values");
    }

    if (error.message.includes("CORS")) {
      recommendations.push("CORS policy blocking request");
      recommendations.push("Server may need to allow your origin");
    }

    return recommendations;
  }

  /**
   * Generate comprehensive analysis of all test results
   */
  private async generateAnalysis(): Promise<void> {
    console.log("   📈 Analyzing test results...");

    const allEndpoints = Array.from(this.results.values());

    // Find working endpoints
    const workingEndpoints = allEndpoints.filter(
      (e) => e.summary.successfulTests > 0,
    );
    const failedEndpoints = allEndpoints.filter(
      (e) => e.summary.successfulTests === 0,
    );

    console.log(
      `   ✅ Working endpoints: ${workingEndpoints.length}/${allEndpoints.length}`,
    );
    console.log(
      `   ❌ Failed endpoints: ${failedEndpoints.length}/${allEndpoints.length}`,
    );

    if (workingEndpoints.length > 0) {
      console.log("\n   🎯 Recommended endpoints:");
      workingEndpoints.forEach((endpoint) => {
        console.log(
          `      - ${endpoint.endpoint} (${endpoint.summary.recommendedMethod})`,
        );
        console.log(
          `        Success rate: ${endpoint.summary.successfulTests}/${endpoint.summary.totalTests}`,
        );
        console.log(
          `        Avg response time: ${Math.round(endpoint.summary.averageResponseTime)}ms`,
        );
      });
    }

    // Identify common issues
    const allIssues = new Set<string>();
    allEndpoints.forEach((endpoint) => {
      endpoint.issues.forEach((issue) => allIssues.add(issue));
    });

    if (allIssues.size > 0) {
      console.log("\n   ⚠️  Common issues identified:");
      Array.from(allIssues).forEach((issue) => {
        console.log(`      - ${issue}`);
      });
    }

    // Performance analysis
    const responseTimes = allEndpoints
      .flatMap((e) => e.tests)
      .filter((t) => t.responseTime > 0 && t.status === "success")
      .map((t) => t.responseTime);

    if (responseTimes.length > 0) {
      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      console.log("\n   ⏱️  Performance metrics:");
      console.log(`      Average: ${Math.round(avgResponseTime)}ms`);
      console.log(`      Fastest: ${minResponseTime}ms`);
      console.log(`      Slowest: ${maxResponseTime}ms`);
    }
  }

  /**
   * Provide actionable recommendations for fixing issues
   */
  private async provideRecommendations(): Promise<void> {
    console.log("   🎯 Generating actionable recommendations...");

    const allEndpoints = Array.from(this.results.values());
    const hasWorkingEndpoint = allEndpoints.some(
      (e) => e.summary.successfulTests > 0,
    );

    if (hasWorkingEndpoint) {
      console.log("\n   ✅ SUCCESS PATH:");
      console.log("   1. Use one of the working endpoints identified above");
      console.log(
        "   2. Configure your MCP client with the recommended method",
      );
      console.log(
        "   3. Update your environment variables with the correct token",
      );

      // Find best working endpoint
      const workingEndpoints = allEndpoints.filter(
        (e) => e.summary.successfulTests > 0,
      );
      const bestEndpoint = workingEndpoints.sort(
        (a, b) => a.summary.averageResponseTime - b.summary.averageResponseTime,
      )[0];

      console.log("\n   🔧 RECOMMENDED CONFIGURATION:");
      console.log(`   Server URL: ${bestEndpoint.endpoint}`);
      console.log(`   Method: ${bestEndpoint.summary.recommendedMethod}`);
      console.log(`   Token: Use the token that worked in tests`);
    } else {
      console.log("\n   ❌ NO WORKING ENDPOINTS FOUND:");
      console.log("   The following issues need to be resolved:");

      // Check authentication
      const hasToken = Object.values(this.config.tokens).some((t) => t);
      if (!hasToken) {
        console.log("\n   1. 🔐 AUTHENTICATION:");
        console.log(
          "      - Set GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_COPILOT_TOKEN",
        );
        console.log("      - Ensure token has MCP/Copilot permissions");
        console.log(
          "      - Generate token at: https://github.com/settings/tokens",
        );
      }

      // Check common patterns in failures
      const allErrors = allEndpoints
        .flatMap((e) => e.tests)
        .filter((t) => t.error)
        .map((t) => t.error!);

      const hasAuthErrors = allErrors.some(
        (e) => e.includes("401") || e.includes("403"),
      );
      const hasNotFound = allErrors.some((e) => e.includes("404"));
      const hasNetworkErrors = allErrors.some(
        (e) => e.includes("fetch") || e.includes("network"),
      );

      if (hasAuthErrors) {
        console.log("\n   2. 🔑 TOKEN PERMISSIONS:");
        console.log("      - Token may lack required scopes");
        console.log(
          "      - Required scopes: copilot, mcp, or write:discussion",
        );
        console.log("      - Regenerate token with proper permissions");
      }

      if (hasNotFound) {
        console.log("\n   3. 🌐 ENDPOINT ISSUES:");
        console.log(
          "      - GitHub Copilot MCP may not be available at these URLs",
        );
        console.log("      - Check official GitHub Copilot documentation");
        console.log("      - Consider using WebSocket endpoint instead");
      }

      if (hasNetworkErrors) {
        console.log("\n   4. 🌍 NETWORK ISSUES:");
        console.log("      - Check internet connectivity");
        console.log("      - Verify firewall/proxy settings");
        console.log("      - Try accessing URLs in browser");
      }

      console.log("\n   5. 🔄 ALTERNATIVE APPROACHES:");
      console.log(
        "      - Use WebSocket connection: wss://api.githubcopilot.com/ws",
      );
      console.log("      - Try GitHub CLI with copilot extension");
      console.log("      - Use GitHub Copilot VS Code extension API");
    }

    console.log("\n   📚 NEXT STEPS:");
    console.log("   1. Update your .env file with correct configuration");
    console.log("   2. Test your MCP client with the recommended settings");
    console.log("   3. Implement proper error handling and retry logic");
    console.log("   4. Add logging for troubleshooting future issues");
    console.log("   5. Monitor GitHub Copilot API changes and updates");

    // Environment variable recommendations
    console.log("\n   🔧 ENVIRONMENT VARIABLES:");
    console.log("   # Add these to your .env file:");
    console.log("   GITHUB_COPILOT_TOKEN=ghp_your_actual_token_here");
    console.log("   MCP_SERVER_URL=https://api.githubcopilot.com/mcp/");
    console.log("   ENABLE_MCP_INTEGRATION=true");
    console.log("   MCP_TIMEOUT=30000");
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

/**
 * Main execution function
 */
async function main() {
  const tester = new MCPEndpointTester();

  try {
    await tester.runComprehensiveTest();
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  MCPEndpointTester,
  type TestConfig,
  type TestResult,
  type EndpointAnalysis,
};
