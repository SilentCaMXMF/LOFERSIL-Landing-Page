#!/usr/bin/env node

/**
 * MCP GitHub SSE Connection Diagnostic Tool
 *
 * This tool systematically diagnoses and troubleshoots MCP server GitHub SSE errors
 * with focus on identifying the root cause of 400 status code connection failures.
 */

import { HTTPMCPClient } from "./src/scripts/modules/mcp/http-client.js";
import { ErrorManager } from "./src/scripts/modules/ErrorManager.js";
import fetch from "node-fetch";

class MCPDiagnosticTool {
  constructor() {
    this.errorHandler = new ErrorManager();
    this.testResults = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      type === "error"
        ? "❌"
        : type === "success"
          ? "✅"
          : type === "warning"
            ? "⚠️"
            : "ℹ️";
    console.log(`${timestamp} ${prefix} ${message}`);
    this.testResults.push({ timestamp, message, type });
  }

  async checkEnvironmentVariables() {
    this.log("🔍 Checking environment variables...");

    const requiredVars = [
      "GITHUB_PERSONAL_ACCESS_TOKEN",
      "GITHUB_ACCESS_TOKEN",
      "MCP_API_KEY",
      "MCP_SERVER_URL",
    ];

    let foundToken = false;
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        this.log(`Found ${varName}: ${this.maskSensitive(value)}`, "success");
        if (varName.includes("GITHUB") && varName.includes("TOKEN")) {
          foundToken = true;
        }
      } else {
        this.log(`Missing ${varName}`, "warning");
      }
    }

    if (!foundToken) {
      this.log("❌ No GitHub token found in environment variables", "error");
      this.log(
        "Set GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_ACCESS_TOKEN",
        "info",
      );
      return false;
    }

    return true;
  }

  maskSensitive(value) {
    if (!value) return "undefined";
    if (value.length <= 8) return "****";
    return value.substring(0, 4) + "****" + value.substring(value.length - 4);
  }

  async testGitHubAPIConnectivity() {
    this.log("🌐 Testing GitHub API connectivity...");

    const token =
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
      process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      this.log("No GitHub token available for API test", "error");
      return false;
    }

    try {
      // Test basic GitHub API access
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "MCP-Diagnostic-Tool/1.0.0",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.log(
          `✅ GitHub API access successful for user: ${userData.login}`,
          "success",
        );
        return true;
      } else {
        this.log(
          `❌ GitHub API failed: ${response.status} ${response.statusText}`,
          "error",
        );
        const errorText = await response.text();
        this.log(`Error details: ${errorText}`, "error");
        return false;
      }
    } catch (error) {
      this.log(`❌ GitHub API connection error: ${error.message}`, "error");
      return false;
    }
  }

  async testGitHubCopilotEndpoint() {
    this.log("🔗 Testing GitHub Copilot MCP endpoint...");

    const token =
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
      process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      this.log("No GitHub token available for Copilot test", "error");
      return false;
    }

    const testUrls = [
      "https://api.githubcopilot.com/mcp/",
      "https://api.githubcopilot.com/mcp/health",
      "https://api.githubcopilot.com/v1/mcp/",
      "https://mcp.github.com/",
      "https://api.github.com/copilot_mcp/",
    ];

    let workingUrl = null;
    for (const url of testUrls) {
      try {
        this.log(`Testing URL: ${url}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "MCP-Diagnostic-Tool/1.0.0",
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
                name: "MCP Diagnostic Tool",
                version: "1.0.0",
              },
            },
          }),
        });

        this.log(`Response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          workingUrl = url;
          this.log(`✅ Working endpoint found: ${url}`, "success");
          const responseText = await response.text();
          this.log(
            `Response preview: ${responseText.substring(0, 200)}...`,
            "info",
          );
          break;
        } else {
          const errorText = await response.text();
          this.log(
            `❌ Failed (${response.status}): ${errorText.substring(0, 200)}...`,
            "error",
          );
        }
      } catch (error) {
        this.log(`❌ Connection error to ${url}: ${error.message}`, "error");
      }
    }

    return workingUrl;
  }

  async testSSEConnection(baseUrl) {
    this.log("📡 Testing Server-Sent Events connection...");

    if (!baseUrl) {
      this.log("No valid base URL available for SSE test", "error");
      return false;
    }

    try {
      // Note: EventSource is not available in Node.js by default
      // This is a simplified test using fetch to check if SSE endpoint responds
      const sseUrl = baseUrl.replace(/\/$/, "") + "/events";

      const response = await fetch(sseUrl, {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_ACCESS_TOKEN}`,
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        this.log(`✅ SSE endpoint responds: ${response.status}`, "success");
        return true;
      } else {
        this.log(
          `❌ SSE endpoint failed: ${response.status} ${response.statusText}`,
          "error",
        );
        return false;
      }
    } catch (error) {
      this.log(`❌ SSE connection error: ${error.message}`, "error");
      return false;
    }
  }

  async testMCPClientConnection(serverUrl) {
    this.log("🔧 Testing HTTPMCPClient connection...");

    if (!serverUrl) {
      this.log("No valid server URL available", "error");
      return false;
    }

    const token =
      process.env.GITHUB_PERSONAL_ACCESS_TOKEN ||
      process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      this.log("No GitHub token available for client test", "error");
      return false;
    }

    try {
      const client = new HTTPMCPClient(
        {
          serverUrl: serverUrl,
          clientInfo: { name: "MCP Diagnostic Tool", version: "1.0.0" },
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "MCP-Diagnostic-Tool/1.0.0",
          },
          enableLogging: true,
          requestTimeout: 10000,
        },
        this.errorHandler,
      );

      this.log("Attempting to connect to MCP server...");
      await client.connect();
      this.log("✅ MCP client connected successfully!", "success");

      // Test listing tools
      const tools = await client.listTools();
      this.log(`✅ Found ${tools.length} available tools`, "success");

      if (tools.length > 0) {
        this.log("Sample tools:", "info");
        tools.slice(0, 5).forEach((tool, i) => {
          this.log(
            `  ${i + 1}. ${tool.name} - ${tool.description || "No description"}`,
            "info",
          );
        });
      }

      await client.destroy();
      return true;
    } catch (error) {
      this.log(`❌ MCP client connection failed: ${error.message}`, "error");
      if (error.stack) {
        this.log(`Stack trace: ${error.stack}`, "error");
      }
      return false;
    }
  }

  generateRecommendations() {
    this.log("\n📋 RECOMMENDATIONS:", "info");

    const errors = this.testResults.filter((r) => r.type === "error");
    const warnings = this.testResults.filter((r) => r.type === "warning");

    if (
      errors.some((e) => e.message.includes("GITHUB_PERSONAL_ACCESS_TOKEN"))
    ) {
      this.log("1. Set up GitHub Personal Access Token:", "info");
      this.log(
        "   - Go to GitHub Settings > Developer settings > Personal access tokens",
        "info",
      );
      this.log("   - Generate a new token with 'copilot' scope", "info");
      this.log(
        "   - Export as GITHUB_PERSONAL_ACCESS_TOKEN=your_token",
        "info",
      );
    }

    if (
      errors.some(
        (e) => e.message.includes("400") || e.message.includes("Bad Request"),
      )
    ) {
      this.log("2. Check GitHub Copilot subscription:", "info");
      this.log(
        "   - Ensure you have an active GitHub Copilot subscription",
        "info",
      );
      this.log("   - Verify your token has the correct permissions", "info");
    }

    if (errors.some((e) => e.message.includes("api.githubcopilot.com"))) {
      this.log("3. Try alternative MCP endpoints:", "info");
      this.log("   - Some environments may use different endpoints", "info");
      this.log(
        "   - Check GitHub Copilot documentation for current endpoints",
        "info",
      );
    }

    if (warnings.some((w) => w.message.includes("environment"))) {
      this.log("4. Environment setup:", "info");
      this.log("   - Create a .env file with required variables", "info");
      this.log("   - Use .env.example as a template", "info");
    }
  }

  async runFullDiagnosis() {
    this.log("🚀 Starting MCP GitHub SSE Connection Diagnosis", "info");
    this.log("=".repeat(60), "info");

    let success = true;

    // Step 1: Check environment
    success &= await this.checkEnvironmentVariables();

    // Step 2: Test GitHub API
    success &= await this.testGitHubAPIConnectivity();

    // Step 3: Test GitHub Copilot endpoints
    const workingUrl = await this.testGitHubCopilotEndpoint();
    if (!workingUrl) {
      success = false;
    }

    // Step 4: Test SSE connection
    if (workingUrl) {
      await this.testSSEConnection(workingUrl);
    }

    // Step 5: Test MCP client
    if (workingUrl) {
      success &= await this.testMCPClientConnection(workingUrl);
    }

    // Summary
    this.log("\n" + "=".repeat(60), "info");
    if (success) {
      this.log("🎉 All tests passed! MCP connection should work.", "success");
    } else {
      this.log("❌ Some tests failed. Check recommendations below.", "error");
    }

    this.generateRecommendations();

    return success;
  }
}

// Run the diagnostic tool
async function main() {
  const diagnostic = new MCPDiagnosticTool();
  const success = await diagnostic.runFullDiagnosis();
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPDiagnosticTool };
