#!/usr/bin/env node

/**
 * Live Kanban Sync Script
 *
 * Updates kanban_payload.json with current tasks and pushes to trigger sync.
 * Can be run manually or scheduled for automated live sync.
 */

import { execSync } from "child_process";

class LiveKanbanSync {
  constructor() {
    console.log("🚀 LIVE KANBAN SYNC");
    console.log("===================");
  }

  runCommand(command, description) {
    try {
      console.log(`📋 ${description}...`);
      const result = execSync(command, { encoding: "utf-8" });
      console.log(`✅ ${description} completed`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to ${description}:`, error);
      throw error;
    }
  }

  hasChanges() {
    try {
      const status = execSync("git status --porcelain kanban_payload.json", {
        encoding: "utf-8",
      });
      return status.trim().length > 0;
    } catch {
      return false;
    }
  }

  async sync() {
    try {
      // Update kanban payload
      console.log("🔄 Updating kanban payload...");
      execSync("node update-kanban-payload.js", { stdio: "inherit" });

      // Check if there are changes
      if (!this.hasChanges()) {
        console.log("ℹ️ No changes to kanban payload, skipping sync");
        return;
      }

      // Add and commit changes
      this.runCommand(
        "git add kanban_payload.json",
        "Stage kanban payload changes",
      );

      const commitMessage = `Live sync: Update kanban payload (${new Date().toISOString()})

Automated update of task inventory for live kanban synchronization.`;
      this.runCommand(
        `git commit -m "${commitMessage}"`,
        "Commit kanban payload changes",
      );

      // Push changes (this will trigger the GitHub Actions workflow)
      this.runCommand(
        "git push origin master",
        "Push changes to trigger kanban sync",
      );

      console.log("🎉 Live kanban sync completed successfully!");
      console.log("📊 Check GitHub Actions and Projects board for updates");
    } catch (error) {
      console.error("❌ Live kanban sync failed:", error);
      throw error; // Re-throw to handle in caller
    }
  }
}

// Run live sync every 5 minutes
const sync = new LiveKanbanSync();

// Initial sync
console.log("🔄 Starting initial sync...");
sync.sync().catch((error) => {
  console.error("❌ Initial sync failed:", error);
});

// Schedule recurring sync every 5 minutes (300,000 ms)
setInterval(
  async () => {
    console.log("\n⏰ Running scheduled sync...");
    try {
      await sync.sync();
    } catch (error) {
      console.error("❌ Scheduled sync failed:", error);
    }
  },
  5 * 60 * 1000,
);

console.log("✅ Live sync service started - will sync every 5 minutes");
console.log("Press Ctrl+C to stop");

export { LiveKanbanSync };
