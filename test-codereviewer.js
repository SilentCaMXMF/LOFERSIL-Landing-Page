/**
 * CodeReviewer Integration Test
 *
 * Test script to verify CodeReviewer functionality with MCP integration
 */

import { CodeReviewer } from "./src/scripts/modules/github-issues/CodeReviewer.js";
import { ErrorManager } from "./src/scripts/modules/ErrorManager.js";

// Initialize ErrorManager
const errorHandler = new ErrorManager();

// Sample code changes for testing
const sampleCodeChanges = {
  files: [
    {
      path: "src/example.js",
      changes: [
        {
          type: "add",
          content: `function getUserData(id) {
  // TODO: Add validation
  const userData = eval(\`user_\${id}\`);
  return userData;
}

function processData(data) {
  console.log('Processing data:', data);
  for (let i = 0; i < data.length; i++) {
    document.getElementById('result').innerHTML += data[i];
  }
  return data.map(item => item * 2);
}`,
        },
      ],
    },
  ],
};

async function testCodeReviewer() {
  console.log("🚀 Starting CodeReviewer integration test...\n");

  // Create CodeReviewer instance
  const codeReviewer = new CodeReviewer(
    {
      mcpServerUrl: "ws://localhost:3001/mcp",
      minApprovalScore: 0.7,
      strictMode: false,
      securityScanEnabled: true,
      performanceAnalysisEnabled: true,
      documentationRequired: true,
      maxReviewTime: 30000,
    },
    errorHandler,
  );

  try {
    // Wait a moment for MCP connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check status
    console.log("📊 Initial Status:");
    const status = codeReviewer.getStatusReport();
    console.log("MCP Connected:", status.mcpStatus.connected);
    console.log("Available Tools:", status.mcpStatus.tools);
    console.log("");

    // Perform single review
    console.log("🔍 Performing single code review...");
    const singleReview = await codeReviewer.reviewChanges(sampleCodeChanges);
    console.log("Review Result:", {
      approved: singleReview.approved,
      score: singleReview.score.toFixed(2),
      issuesCount: singleReview.issues.length,
      criticalIssues: singleReview.issues.filter(
        (i) => i.severity === "critical",
      ).length,
    });
    console.log("");

    // Perform batch review
    console.log("🔍 Performing batch code review...");
    const batchReviews = await codeReviewer.reviewMultipleChanges([
      sampleCodeChanges,
      sampleCodeChanges,
      {
        files: [
          {
            path: "src/clean.js",
            changes: [
              {
                type: "add",
                content: `/**
 * Clean function example
 * @param {string} name - The name to greet
 * @returns {string} Greeting message
 */
function greetUser(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Valid name string required');
  }
  return \`Hello, \${name}!\`;
}`,
              },
            ],
          },
        ],
      },
    ]);

    console.log("Batch Results:");
    batchReviews.forEach((review, index) => {
      console.log(
        `  Review ${index + 1}: ${review.approved ? "APPROVED" : "REJECTED"} (Score: ${review.score.toFixed(2)})`,
      );
    });
    console.log("");

    // Get metrics
    console.log("📈 Final Metrics:");
    const metrics = codeReviewer.getMetrics();
    console.log("Total Reviews:", metrics.totalReviews);
    console.log("Success Rate:", `${metrics.successRate.toFixed(1)}%`);
    console.log("MCP Success Rate:", `${metrics.mcpSuccessRate.toFixed(1)}%`);
    console.log(
      "Average Issues per Review:",
      metrics.averageIssuesPerReview.toFixed(1),
    );
    console.log("");

    // Perform health check
    console.log("🏥 Health Check:");
    const health = await codeReviewer.performHealthCheck();
    console.log("Healthy:", health.healthy);
    console.log("MCP Connected:", health.mcpConnected);
    if (health.issues.length > 0) {
      console.log("Issues:", health.issues);
    }
    console.log("");

    // Test error handling
    console.log("🧪 Testing error handling...");
    const errorReview = await codeReviewer.reviewChanges({
      files: [],
    });
    console.log("Empty review result:", errorReview.reasoning);
    console.log("");

    console.log("✅ CodeReviewer integration test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    errorHandler.handleError(error, "CodeReviewerTest", {
      component: "Test",
      timestamp: new Date(),
    });
  } finally {
    // Cleanup
    await codeReviewer.destroy();
    console.log("🧹 Cleanup completed");
  }
}

// Run test if this file is executed directly
if (
  typeof window === "undefined" &&
  import.meta.url === `file://${process.argv[1]}`
) {
  testCodeReviewer().catch(console.error);
}

export { testCodeReviewer };
