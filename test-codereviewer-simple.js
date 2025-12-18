/**
 * CodeReviewer Integration Test
 *
 * Test script to verify CodeReviewer functionality
 */

import { CodeReviewer } from "./dist/github-system/modules/github-issues/CodeReviewer.js";

// Sample code changes for testing
const sampleChanges = {
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
  console.log("🚀 Starting CodeReviewer integration test...");

  try {
    // Create CodeReviewer instance with minimal config
    const codeReviewer = new CodeReviewer({
      minApprovalScore: 0.7,
      strictMode: false,
      securityScanEnabled: true,
      performanceAnalysisEnabled: true,
      documentationRequired: true,
      maxReviewTime: 30000,
    });

    console.log("📊 Testing CodeReviewer with sample code...");

    // Perform code review
    console.log("\n🔍 Performing code review...");
    const reviewResult = await codeReviewer.reviewChanges(sampleChanges);

    console.log("\n✅ Review Results:");
    console.log(`Approved: ${reviewResult.approved}`);
    console.log(`Score: ${reviewResult.score.toFixed(2)}`);
    console.log(`Issues found: ${reviewResult.issues.length}`);

    if (reviewResult.issues.length > 0) {
      console.log("\n🚨 Issues:");
      reviewResult.issues.forEach((issue, index) => {
        console.log(
          `  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`,
        );
        if (issue.suggestion) {
          console.log(`     💡 Suggestion: ${issue.suggestion}`);
        }
      });
    }

    if (reviewResult.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      reviewResult.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Get metrics
    console.log("\n📈 Metrics:");
    const metrics = codeReviewer.getMetrics();
    console.log(JSON.stringify(metrics, null, 2));

    console.log("\n🎉 Test completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}

// Run the test
testCodeReviewer()
  .then((success) => {
    if (success) {
      console.log("✅ CodeReviewer integration test completed successfully!");
      process.exit(0);
    } else {
      console.log("❌ CodeReviewer integration test failed!");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
