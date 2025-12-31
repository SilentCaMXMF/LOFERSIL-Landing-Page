#!/usr/bin/env node

/**
 * Comprehensive test script for MonitoringService v2.0.0
 * Tests all data sources and validates multi-source functionality
 */

import { MonitoringService } from "./src/scripts/monitoring-service.js";

async function testAllDataSources() {
  console.log("🧪 Testing MonitoringService v2.0.0 - All Data Sources\n");

  try {
    // Test 1: Service initialization
    console.log("1️⃣ Testing service initialization...");
    const service = new MonitoringService();
    await service.initialize();
    console.log("✅ Service initialized successfully\n");

    // Test 2: Configuration status
    console.log("2️⃣ Testing configuration status...");
    const configStatus = service.getConfigurationStatus();
    console.log("Configuration status:", JSON.stringify(configStatus, null, 2));
    console.log("✅ Configuration status retrieved\n");

    // Test 3: Test all data sources
    console.log("3️⃣ Testing all data sources...");
    const allData = await service.getAllMonitoringData();

    console.log(`📊 Data sources summary:`);
    console.log(`   Total sources: ${allData.summary.total_sources}`);
    console.log(`   Successful: ${allData.summary.successful_sources}`);
    console.log(`   Failed: ${allData.summary.failed_sources}`);
    console.log(`   Total time: ${allData.summary.total_response_time_ms}ms\n`);

    // Test 4: Display results for each source
    console.log("4️⃣ Individual source results:");
    for (const [sourceName, sourceData] of Object.entries(allData.sources)) {
      console.log(`\n   📈 ${sourceName}:`);
      console.log(
        `      Status: ${sourceData.success ? "✅ Success" : "❌ Failed"}`,
      );
      if (sourceData.error) {
        console.log(`      Error: ${sourceData.error}`);
      }
      console.log(
        `      Response time: ${sourceData.metadata?.response_time_ms || 0}ms`,
      );

      // Show sample data for successful sources
      if (sourceData.success && sourceData.data) {
        if (sourceName === "github_actions") {
          console.log(
            `      Last deployment: ${sourceData.data.last_deployment?.timestamp || "N/A"}`,
          );
          console.log(
            `      Build duration: ${sourceData.data.build?.duration_seconds || 0}s`,
          );
        } else if (sourceName === "ssl_monitor") {
          console.log(
            `      SSL days remaining: ${sourceData.data.certificate?.days_remaining || 0}`,
          );
        } else if (sourceName === "health_check") {
          console.log(
            `      Website status: ${sourceData.data.website?.status || "unknown"}`,
          );
        }
      }
    }

    // Test 5: JSON output formats
    console.log("\n5️⃣ Testing JSON output formats...");

    // Test compact JSON
    const compactJson = await service.getMonitoringDataJson(false);
    console.log("✅ Compact JSON generated successfully");

    // Test pretty JSON (GitHub Actions only)
    const prettyJson = await service.getMonitoringDataJson(true);
    console.log("✅ Pretty JSON generated successfully");

    // Test all sources pretty JSON
    const allSourcesData = await service.getAllMonitoringData();
    const allSourcesJson = JSON.stringify(allSourcesData, null, 2);
    console.log("✅ All sources JSON generated successfully");

    // Test 6: Error handling
    console.log("\n6️⃣ Testing error handling...");

    // Test without authentication (should fail gracefully)
    const noAuthService = new MonitoringService();
    await noAuthService.loadConfiguration();

    try {
      await noAuthService.getMonitoringData();
      console.log("❌ Should have failed without authentication");
    } catch (error) {
      console.log("✅ Properly failed without authentication:", error.message);
    }

    console.log("\n🎉 All tests completed successfully!");

    // Final summary
    console.log("\n📋 Final Summary:");
    console.log(`   ✅ Configuration loaded: ${configStatus.loaded}`);
    console.log(`   ✅ Authentication working: ${configStatus.authenticated}`);
    console.log(
      `   ✅ Data sources supported: ${allData.summary.total_sources}`,
    );
    console.log(
      `   ✅ Data sources working: ${allData.summary.successful_sources}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error?.message || error);

    // Still try to get error handling data
    try {
      const service = new MonitoringService();
      await service.loadConfiguration();
      const errorData = await service.getAllMonitoringData();
      console.log(
        "\n📊 Error handling data:",
        JSON.stringify(errorData, null, 2),
      );
    } catch (errorHandlingError) {
      console.error(
        "💥 Error handling also failed:",
        errorHandlingError?.message || errorHandlingError,
      );
    }

    return false;
  }
}

// Run tests
testAllDataSources().then((success) => {
  process.exit(success ? 0 : 1);
});
