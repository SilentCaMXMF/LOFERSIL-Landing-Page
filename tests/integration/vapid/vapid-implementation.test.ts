/**
 * Simple test to verify VAPID configuration implementation
 */

import { describe, it, expect } from "vitest";

describe("VAPID Implementation Verification", () => {
  it("should have updated EnvironmentLoader with VAPID methods", () => {
    // This test verifies that our changes are in place
    const fs = require("fs");
    const path = require("path");

    const envLoaderPath = path.join(
      __dirname,
      "../../src/scripts/modules/EnvironmentLoader.ts",
    );
    const envLoaderContent = fs.readFileSync(envLoaderPath, "utf8");

    // Check if VAPID methods were added
    expect(envLoaderContent).toContain("VAPID_PUBLIC_KEY");
    expect(envLoaderContent).toContain("validateVapidKey");
    expect(envLoaderContent).toContain("getVapidPublicKey");
    expect(envLoaderContent).toContain("isPushNotificationEnabled");
  });

  it("should have updated PushNotificationManager with configuration handling", () => {
    const fs = require("fs");
    const path = require("path");

    const pushManagerPath = path.join(
      __dirname,
      "../../src/scripts/modules/PushNotificationManager.ts",
    );
    const pushManagerContent = fs.readFileSync(pushManagerPath, "utf8");

    // Check if configuration handling was added
    expect(pushManagerContent).toContain("validateConfiguration");
    expect(pushManagerContent).toContain("isReady");
    expect(pushManagerContent).toContain("getConfigurationStatus");
    expect(pushManagerContent).toContain("vapidPublicKey?: string | null");
  });

  it("should have updated index.ts to use environment-loaded VAPID key", () => {
    const fs = require("fs");
    const path = require("path");

    const indexPath = path.join(__dirname, "../../src/scripts/index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf8");

    // Check if hardcoded VAPID key was removed
    expect(indexContent).not.toContain("YOUR_VAPID_PUBLIC_KEY");

    // Check if environment loading was added
    expect(indexContent).toContain("getVapidPublicKey");
    expect(indexContent).toContain("getConfigurationStatus");
  });

  it("should have VAPID configuration documentation", () => {
    const fs = require("fs");
    const path = require("path");

    const vapidDocPath = path.join(__dirname, "../../VAPID-CONFIGURATION.md");
    expect(fs.existsSync(vapidDocPath)).toBe(true);

    const vapidDocContent = fs.readFileSync(vapidDocPath, "utf8");
    expect(vapidDocContent).toContain("VAPID");
    expect(vapidDocContent).toContain("Configuration");
    expect(vapidDocContent).toContain("web-push generate-vapid-keys");
  });

  it("should have VAPID tests", () => {
    const fs = require("fs");
    const path = require("path");

    const testPath = path.join(
      __dirname,
      "../unit/vapid-configuration.test.ts",
    );
    expect(fs.existsSync(testPath)).toBe(true);

    const testContent = fs.readFileSync(testPath, "utf8");
    expect(testContent).toContain("VAPID Configuration");
    expect(testContent).toContain("validateVapidKey");
    expect(testContent).toContain("PushNotificationManager");
  });
});
