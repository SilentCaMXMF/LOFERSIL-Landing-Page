#!/usr/bin/env node

/**
 * MCP GitHub SSE Connection Diagnostic Tool (Simplified)
 *
 * This tool systematically diagnoses and troubleshoots MCP server GitHub SSE errors
 * with focus on identifying the root cause of 400 status code connection failures.
 */

import fetch from "node-fetch";

class SimpleMCPDiagnosticTool {
  constructor() {
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

    let foundToken = null;
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        this.log(`Found ${varName}: ${this.maskSensitive(value)}`, "success");
        if (varName.includes("GITHUB") && varName.includes("TOKEN")) {
          foundToken = { name: varName, value };
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
      return { success: false, token: null };
    }

    return { success: true, token: foundToken };
  }

  maskSensitive(value) {
    if (!value) return "undefined";
    if (value.length <= 8) return "****";
    return value.substring(0, 4) + "****" + value.substring(value.length - 4);
  }

  async testGitHubAPIConnectivity(tokenInfo) {
    this.log("🌐 Testing GitHub API connectivity...");

    if (!tokenInfo) {
      this.log("No GitHub token available for API test", "error");
      return false;
    }

    try {
      // Test basic GitHub API access
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenInfo.value}`,
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
        this.log(
          `User details: ${userData.name || "No name"} (${userData.type})`,
          "info",
        );
        return true;
      } else {
        this.log(
          `❌ GitHub API failed: ${response.status} ${response.statusText}`,
          "error",
        );
        const errorText = await response.text();
        this.log(`Error details: ${errorText}`, "error");

        if (response.status === 401) {
          this.log(
            "💡 This suggests the token is invalid or expired",
            "warning",
          );
        } else if (response.status === 403) {
          this.log(
            "💡 This suggests the token lacks required permissions",
            "warning",
          );
        }
        return false;
      }
    } catch (error) {
      this.log(`❌ GitHub API connection error: ${error.message}`, "error");
      return false;
    }
  }

  async testGitHubCopilotEndpoints(tokenInfo) {
    this.log("🔗 Testing GitHub Copilot MCP endpoints...");

    if (!tokenInfo) {
      this.log("No GitHub token available for Copilot test", "error");
      return null;
    }

    // List of possible GitHub Copilot MCP endpoints
    const testEndpoints = [
      {
        name: "GitHub Copilot Official MCP",
        url: "https://api.githubcopilot.com/mcp/",
        method: "POST",
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {}, prompts: {} },
            clientInfo: { name: "MCP Diagnostic Tool", version: "1.0.0" },
          },
        },
      },
      {
        name: "GitHub Copilot Alternative Endpoint",
        url: "https://api.githubcopilot.com/v1/mcp/",
        method: "POST",
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {}, prompts: {} },
            clientInfo: { name: "MCP Diagnostic Tool", version: "1.0.0" },
          },
        },
      },
      {
        name: "GitHub API MCP",
        url: "https://api.github.com/copilot_mcp/",
        method: "POST",
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {}, prompts: {} },
            clientInfo: { name: "MCP Diagnostic Tool", version: "1.0.0" },
          },
        },
      },
    ];

    let workingEndpoint = null;

    for (const endpoint of testEndpoints) {
      try {
        this.log(`Testing: ${endpoint.name} - ${endpoint.url}`);

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            Authorization: `Bearer ${tokenInfo.value}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "MCP-Diagnostic-Tool/1.0.0",
          },
          body: JSON.stringify(endpoint.body),
        });

        this.log(`Response: ${response.status} ${response.statusText}`);

        const responseText = await response.text();

        if (response.ok) {
          workingEndpoint = endpoint;
          this.log(`✅ SUCCESS: ${endpoint.name}`, "success");
          this.log(
            `Response preview: ${responseText.substring(0, 200)}...`,
            "info",
          );

          // Try to parse JSON response
          try {
            const jsonResponse = JSON.parse(responseText);
            this.log(
              `Parsed response keys: ${Object.keys(jsonResponse)}`,
              "info",
            );
          } catch (e) {
            this.log(`Response is not valid JSON`, "warning");
          }

          break;
        } else {
          this.log(
            `❌ FAILED (${response.status}): ${responseText.substring(0, 200)}...`,
            "error",
          );

          // Analyze common error codes
          if (response.status === 400) {
            this.log(
              "💡 400 Bad Request - Check request format and authentication",
              "warning",
            );
            this.log("   Common causes:", "warning");
            this.log("   - Missing or invalid authentication token", "warning");
            this.log("   - Incorrect request format", "warning");
            this.log("   - Missing required permissions", "warning");
            this.log("   - Endpoint URL is incorrect", "warning");
          } else if (response.status === 401) {
            this.log(
              "💡 401 Unauthorized - Token is invalid or expired",
              "warning",
            );
          } else if (response.status === 403) {
            this.log(
              "💡 403 Forbidden - Token lacks required permissions",
              "warning",
            );
          } else if (response.status === 404) {
            this.log("💡 404 Not Found - Endpoint does not exist", "warning");
          } else if (response.status >= 500) {
            this.log(
              "💡 Server error - GitHub Copilot service may be down",
              "warning",
            );
          }
        }
      } catch (error) {
        this.log(
          `❌ Connection error to ${endpoint.name}: ${error.message}`,
          "error",
        );
      }

      this.log("", "info"); // Add spacing
    }

    return workingEndpoint;
  }

  generateRecommendations(testResults, tokenInfo) {
    this.log("\n📋 RECOMMENDATIONS:", "info");

    const errors = this.testResults.filter((r) => r.type === "error");
    const warnings = this.testResults.filter((r) => r.type === "warning");

    // Token issues
    if (
      !tokenInfo ||
      errors.some((e) => e.message.includes("GITHUB_PERSONAL_ACCESS_TOKEN"))
    ) {
      this.log("🔑 TOKEN SETUP:", "warning");
      this.log("1. Create a GitHub Personal Access Token:", "info");
      this.log(
        "   - Go to GitHub Settings > Developer settings > Personal access tokens",
        "info",
      );
      this.log("   - Click 'Generate new token (classic)'", "info");
      this.log("   - Select scopes: 'copilot', 'read:user', 'repo'", "info");
      this.log("   - Generate token and copy it", "info");
      this.log("2. Set the environment variable:", "info");
      this.log(
        "   export GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here",
        "info",
      );
      this.log("3. Ensure you have GitHub Copilot subscription", "info");
    }

    // 400 errors
    if (errors.some((e) => e.message.includes("400"))) {
      this.log("\n🔧 400 ERROR FIXES:", "warning");
      this.log("1. Verify GitHub Copilot subscription is active", "info");
      this.log("2. Check token has 'copilot' scope", "info");
      this.log("3. Try using a different endpoint URL", "info");
      this.log("4. Verify request format matches MCP protocol", "info");
    }

    // Connection issues
    if (
      errors.some(
        (e) => e.message.includes("connection") || e.message.includes("fetch"),
      )
    ) {
      this.log("\n🌐 CONNECTION ISSUES:", "warning");
      this.log("1. Check internet connectivity", "info");
      this.log("2. Verify GitHub services are operational", "info");
      this.log("3. Check for firewall/proxy restrictions", "info");
    }

    // Environment setup
    if (warnings.some((w) => w.message.includes("Missing"))) {
      this.log("\n⚙️ ENVIRONMENT SETUP:", "warning");
      this.log("1. Create a .env file from .env.example", "info");
      this.log("2. Add your GitHub token to the .env file", "info");
      this.log("3. Source the .env file: source .env", "info");
    }

    this.log("\n📖 ADDITIONAL RESOURCES:", "info");
    this.log(
      "- GitHub Copilot documentation: https://docs.github.com/en/copilot",
      "info",
    );
    this.log(
      "- MCP Protocol documentation: https://modelcontextprotocol.io/",
      "info",
    );
    this.log("- GitHub MCP integration guide: Check repository README", "info");
  }

  async runFullDiagnosis() {
    this.log("🚀 Starting MCP GitHub SSE Connection Diagnosis", "info");
    this.log("=".repeat(60), "info");

    let success = true;

    // Step 1: Check environment
    const tokenResult = await this.checkEnvironmentVariables();
    if (!tokenResult.success) {
      success = false;
    }

    // Step 2: Test GitHub API (only if token available)
    if (tokenResult.token) {
      const apiSuccess = await this.testGitHubAPIConnectivity(
        tokenResult.token,
      );
      if (!apiSuccess) success = false;
    }

    // Step 3: Test GitHub Copilot endpoints
    const workingEndpoint = await this.testGitHubCopilotEndpoints(
      tokenResult.token,
    );
    if (!workingEndpoint) {
      success = false;
    }

    // Summary
    this.log("\n" + "=".repeat(60), "info");
    if (success && workingEndpoint) {
      this.log(
        "🎉 DIAGNOSIS COMPLETE - MCP connection should work!",
        "success",
      );
      this.log(`Working endpoint: ${workingEndpoint.name}`, "success");
      this.log(`URL: ${workingEndpoint.url}`, "success");
    } else {
      this.log(
        "❌ DIAGNOSIS COMPLETE - Issues found. Check recommendations below.",
        "error",
      );
    }

    this.generateRecommendations(this.testResults, tokenResult.token);

    return { success, workingEndpoint, tokenInfo: tokenResult.token };
  }
}

// Run the diagnostic tool
async function main() {
  const diagnostic = new SimpleMCPDiagnosticTool();
  const result = await diagnostic.runFullDiagnosis();
  process.exit(result.success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SimpleMCPDiagnosticTool };
