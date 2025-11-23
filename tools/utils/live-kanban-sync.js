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

  sync() {
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
      process.exit(1);
    }
  }
}

// Run live sync
const sync = new LiveKanbanSync();
sync.sync();

export { LiveKanbanSync };
