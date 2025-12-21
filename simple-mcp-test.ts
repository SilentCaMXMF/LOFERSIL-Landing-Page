#!/usr/bin/env tsx

/**
 * Simple MCP GitHub Connection Test
 *
 * Direct testing script to diagnose 400 status code error
 * without dependencies on complex modules.
 */

import { performance } from "perf_hooks";

// Load environment variables
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config();

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  endpoint: string;
  method: string;
  status: "success" | "error" | "timeout";
  httpStatus?: number;
  error?: string;
  responseTime: number;
  details: any;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testHTTPEndpoint(
  url: string,
  token?: string,
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        "User-Agent": "LOFERSIL-MCP-Client/1.0.0",
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
            name: "LOFERSIL MCP Client",
            version: "1.0.0",
          },
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = performance.now() - startTime;
    const responseText = await response.text();

    if (response.ok) {
      return {
        endpoint: url,
        method: "HTTP POST",
        status: "success",
        httpStatus: response.status,
        responseTime,
        details: { responseText: responseText.substring(0, 200) },
      };
    } else {
      return {
        endpoint: url,
        method: "HTTP POST",
        status: "error",
        httpStatus: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
        details: {
          errorText: responseText.substring(0, 500),
          headers: Object.fromEntries(response.headers.entries()),
        },
      };
    }
  } catch (error) {
    return {
      endpoint: url,
      method: "HTTP POST",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: performance.now() - startTime,
      details: {},
    };
  }
}

async function testEventSourceEndpoint(url: string): Promise<TestResult> {
  const startTime = performance.now();

  try {
    return new Promise<TestResult>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          endpoint: url,
          method: "EventSource",
          status: "timeout",
          responseTime: performance.now() - startTime,
          details: { reason: "EventSource timeout" },
        });
      }, 5000);

      try {
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
          clearTimeout(timeout);
          eventSource.close();
          resolve({
            endpoint: url,
            method: "EventSource",
            status: "success",
            responseTime: performance.now() - startTime,
            details: { message: "EventSource connected successfully" },
          });
        };

        eventSource.onerror = (event) => {
          clearTimeout(timeout);
          eventSource.close();
          resolve({
            endpoint: url,
            method: "EventSource",
            status: "error",
            error: "EventSource connection failed",
            responseTime: performance.now() - startTime,
            details: {
              note: "EventSource cannot send Authorization headers",
              event: "EventSource error",
            },
          });
        };
      } catch (error) {
        clearTimeout(timeout);
        resolve({
          endpoint: url,
          method: "EventSource",
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "EventSource creation failed",
          responseTime: performance.now() - startTime,
          details: { note: "EventSource not supported or blocked" },
        });
      }
    });
  } catch (error) {
    return {
      endpoint: url,
      method: "EventSource",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: performance.now() - startTime,
      details: {},
    };
  }
}

// ============================================================================
// MAIN TESTING FUNCTION
// ============================================================================

async function main(): Promise<void> {
  console.log("🔍 MCP GitHub Connection Test");
  console.log("=============================\n");

  // Get available tokens
  const tokens = {
    githubPersonal: process.env.GITHUB_ACCESS_TOKEN,
    githubCopilot: process.env.GITHUB_COPILOT_TOKEN,
    githubPersonalAlt: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
  };

  console.log("🔑 Token Status:");
  Object.entries(tokens).forEach(([key, value]) => {
    const status = value ? `${value.substring(0, 10)}...` : "Not Set";
    const valid =
      value && (value.startsWith("ghp_") || value.startsWith("github_pat_"));
    console.log(`  ${key}: ${status} ${valid ? "✅" : "❌"}`);
  });
  console.log("");

  // Test endpoints
  const endpoints = [
    "https://api.githubcopilot.com/",
    "https://api.githubcopilot.com/mcp/",
    "https://api.github.com/copilot/",
    "https://copilot.github.com/api/",
  ];

  const results: TestResult[] = [];

  for (const endpoint of endpoints) {
    console.log(`📍 Testing: ${endpoint}`);

    // Test 1: EventSource (current implementation)
    console.log("  🔸 EventSource...");
    const eventSourceResult = await testEventSourceEndpoint(endpoint);
    results.push(eventSourceResult);
    console.log(
      `     ${eventSourceResult.status === "success" ? "✅" : "❌"} ${eventSourceResult.status} (${eventSourceResult.responseTime}ms)`,
    );
    if (eventSourceResult.error) {
      console.log(`     Error: ${eventSourceResult.error}`);
    }

    // Test 2: HTTP POST with best available token
    console.log("  🔸 HTTP POST...");
    const token = Object.values(tokens).find((t) => t && t.startsWith("ghp_"));
    const httpResult = await testHTTPEndpoint(endpoint, token);
    results.push(httpResult);
    console.log(
      `     ${httpResult.status === "success" ? "✅" : "❌"} ${httpResult.status} ${httpResult.httpStatus ? `(${httpResult.httpStatus})` : ""} (${httpResult.responseTime}ms)`,
    );
    if (httpResult.error) {
      console.log(`     Error: ${httpResult.error}`);
    }

    console.log("");
  }

  // Analysis
  console.log("📊 Results Summary:");
  console.log("==================\n");

  const successfulTests = results.filter((r) => r.status === "success");
  const failedTests = results.filter((r) => r.status === "error");
  const timeoutTests = results.filter((r) => r.status === "timeout");

  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${successfulTests.length} ✅`);
  console.log(`Failed: ${failedTests.length} ❌`);
  console.log(`Timeouts: ${timeoutTests.length} ⏰\n`);

  // Show successful tests
  if (successfulTests.length > 0) {
    console.log("✅ Successful Configurations:");
    successfulTests.forEach((result) => {
      console.log(
        `  ${result.method} → ${result.endpoint} ${result.httpStatus ? `(${result.httpStatus})` : ""} - ${result.responseTime}ms`,
      );
    });
    console.log("");
  }

  // Show 400 errors specifically
  const error400s = results.filter((r) => r.httpStatus === 400);
  if (error400s.length > 0) {
    console.log("🔴 400 Bad Request Errors:");
    error400s.forEach((result) => {
      console.log(`  ${result.method} → ${result.endpoint}`);
      console.log(`    ${result.error}`);
      if (result.details.errorText) {
        console.log(
          `    Response: ${result.details.errorText.substring(0, 100)}...`,
        );
      }
    });
    console.log("");
  }

  // Show authentication errors
  const authErrors = results.filter(
    (r) => r.httpStatus === 401 || r.httpStatus === 403,
  );
  if (authErrors.length > 0) {
    console.log("🔐 Authentication Errors:");
    authErrors.forEach((result) => {
      console.log(
        `  ${result.method} → ${result.endpoint} (${result.httpStatus})`,
      );
      console.log(`    ${result.error}`);
    });
    console.log("");
  }

  // Show EventSource issues
  const eventSourceErrors = results.filter(
    (r) => r.method === "EventSource" && r.status === "error",
  );
  if (eventSourceErrors.length > 0) {
    console.log("🔸 EventSource Issues:");
    eventSourceErrors.forEach((result) => {
      console.log(`  ${result.endpoint}: ${result.error}`);
    });
    console.log("");
  }

  // Recommendations
  console.log("🎯 Recommendations:");
  console.log("==================\n");

  if (error400s.length > 0) {
    console.log("🔴 400 Error Fixes:");
    console.log("  1. Check endpoint URL - remove /mcp/ path");
    console.log("  2. Verify request format (JSON-RPC structure)");
    console.log("  3. Check Content-Type and Accept headers");
    console.log("  4. Try different base URL (without trailing slash)\n");
  }

  if (eventSourceErrors.length > 0) {
    console.log("🔸 EventSource Issues:");
    console.log("  1. EventSource cannot send Authorization headers");
    console.log("  2. Use fetch() with streaming instead");
    console.log("  3. Consider WebSocket for real-time communication");
    console.log("  4. Move authentication to query parameters\n");
  }

  if (authErrors.length > 0) {
    console.log("🔐 Authentication Issues:");
    console.log("  1. Check token format (should start with ghp_)");
    console.log("  2. Verify token has required scopes (copilot, repo)");
    console.log("  3. Ensure token is not expired");
    console.log("  4. Use correct environment variable name\n");
  }

  // Configuration recommendations
  console.log("🔧 Working Configuration:");
  if (successfulTests.length > 0) {
    const best = successfulTests.sort(
      (a, b) => a.responseTime - b.responseTime,
    )[0];
    console.log(`  ✅ Endpoint: ${best.endpoint}`);
    console.log(`  ✅ Method: ${best.method}`);
    console.log(`  ✅ Response Time: ${best.responseTime}ms`);
    console.log("");
    console.log("Implementation Steps:");
    console.log("  1. Update MCP client to use working configuration");
    console.log("  2. Replace EventSource with HTTP POST + fetch streaming");
    console.log("  3. Use proper Authorization header format");
    console.log("  4. Add correct error handling for 400 responses");
  } else {
    console.log("  ❌ No working configuration found");
    console.log("");
    console.log("Troubleshooting Steps:");
    console.log("  1. Verify GitHub Copilot API availability");
    console.log("  2. Check network connectivity and firewall");
    console.log("  3. Create new token with proper scopes");
    console.log("  4. Test with alternative endpoints");
    console.log("  5. Contact GitHub Support if issues persist");
  }

  console.log("\n📋 Environment Variables to Set:");
  console.log("  GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  console.log("  MCP_SERVER_URL=https://api.githubcopilot.com/");
  console.log("  ENABLE_MCP_INTEGRATION=true");
}

// Run the test
main().catch(console.error);
