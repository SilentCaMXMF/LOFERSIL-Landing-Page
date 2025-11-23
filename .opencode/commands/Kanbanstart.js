#!/usr/bin/env node

/**
 * OpenCode Command: Kanbanstart
 *
 * Starts the live Kanban sync service that automatically syncs local tasks
 * with the remote Kanban board every 5 minutes.
 */

import { execSync } from "child_process";

console.log("🚀 Starting Live Kanban Sync Service...");
console.log("This will run continuously and sync every 5 minutes.");
console.log("Press Ctrl+C to stop.\n");

try {
  execSync("node tools/utils/live-kanban-sync.js", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (error) {
  console.error("❌ Failed to start Kanban sync service:", error.message);
  process.exit(1);
}
