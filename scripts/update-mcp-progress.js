#!/usr/bin/env node

/**
 * Update GitHub Projects Kanban Board - MCP Implementation Completion
 *
 * This script updates the GitHub Projects board to reflect that the MCP implementation
 * is 100% complete, moving all subtasks (03-13) to "Done" and updating the main card.
 */

import { GitHubProjectsIntegration } from "../src/scripts/modules/github-projects.ts";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateMCPImplementationProgress() {
  try {
    // Configuration
    const accessToken = process.env.GITHUB_ACCESS_TOKEN;
    const projectId = process.env.GITHUB_PROJECT_ID || "PVT_kwDOB2ZJcM4Akw2Q"; // Project ID 2
    const owner = process.env.GITHUB_REPOSITORY_OWNER || "SilentCaMXMF";
    const repo = process.env.GITHUB_REPOSITORY_NAME || "LOFERSIL-Landing-Page";

    if (!accessToken) {
      throw new Error("GITHUB_ACCESS_TOKEN environment variable is required");
    }

    console.log("Initializing GitHub Projects integration", {
      projectId,
      owner,
      repo,
    });

    // Initialize GitHub Projects client
    const kanban = new GitHubProjectsIntegration(
      accessToken,
      projectId,
      owner,
      repo,
    );

    // Get all cards from the project
    console.log("Fetching all cards from project...");
    const allCards = await kanban.getAllCards();

    console.log(`Found ${allCards.length} cards in the project`);

    // Define MCP task mappings
    const mcpTasks = {
      "Task 03: Build WebSocket Client with Reconnection Logic":
        "03-mcp-websocket-client",
      "Task 04: Create Core MCP Client Class": "04-mcp-core-client",
      "Task 05: Implement Tool Registration and Management":
        "05-mcp-tool-registry",
      "Task 06: Build Resource Management System": "06-mcp-resource-manager",
      "Task 07: Create Prompt Management System": "07-mcp-prompt-manager",
      "Task 08: Implement Security and Authentication": "08-mcp-security-layer",
      "Task 09: Integrate with ErrorManager System": "09-mcp-error-handling",
      "Task 10: Add Monitoring and Metrics Collection":
        "10-mcp-monitoring-integration",
      "Task 11: Create Comprehensive Unit Tests": "11-mcp-unit-tests",
      "Task 12: Build Integration Test Suite": "12-mcp-integration-tests",
      "Task 13: Create Documentation and Examples": "13-mcp-documentation",
    };

    // Find MCP-related cards
    const mcpCards = allCards.filter(
      (card) =>
        Object.keys(mcpTasks).some(
          (taskTitle) =>
            card.title.includes(taskTitle) ||
            card.title.includes(mcpTasks[taskTitle]) ||
            (card.taskId && Object.values(mcpTasks).includes(card.taskId)),
        ) ||
        card.title.toLowerCase().includes("mcp implementation") ||
        (card.title.toLowerCase().includes("mcp") &&
          card.title.toLowerCase().includes("complete")),
    );

    console.log(`Found ${mcpCards.length} MCP-related cards`);

    // Update individual task cards to "Done"
    let updatedTasks = 0;
    for (const card of mcpCards) {
      // Skip the main MCP Implementation card for now
      if (
        card.title.toLowerCase().includes("mcp implementation") &&
        card.title.toLowerCase().includes("%")
      ) {
        continue;
      }

      // Check if it's already done
      if (card.status.toLowerCase() === "done") {
        console.log(`Task already marked as Done: ${card.title}`);
        continue;
      }

      try {
        await kanban.updateCardStatus(card.id, "Done");
        console.log(`Updated task to Done: ${card.title}`);
        updatedTasks++;
      } catch (error) {
        console.error(`Failed to update task: ${card.title}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Find and update the main MCP Implementation card
    const mainMCPCard = allCards.find(
      (card) =>
        card.title.toLowerCase().includes("mcp implementation") &&
        card.title.toLowerCase().includes("%"),
    );

    if (mainMCPCard) {
      console.log(`Found main MCP card: ${mainMCPCard.title}`);

      // Note: GitHub Projects API doesn't easily support updating card content directly
      // We'll update the status to "Done" instead
      if (mainMCPCard.status.toLowerCase() !== "done") {
        await kanban.updateCardStatus(mainMCPCard.id, "Done");
        console.log("Updated main MCP Implementation card to Done");
      } else {
        console.log("Main MCP Implementation card already marked as Done");
      }
    } else {
      console.warn("Main MCP Implementation card not found");
    }

    // Verify updates
    console.log("Verifying updates...");
    const updatedCards = await kanban.getAllCards();
    const doneMCPCards = updatedCards.filter(
      (card) =>
        (card.title.toLowerCase().includes("mcp") ||
          Object.keys(mcpTasks).some((taskTitle) =>
            card.title.includes(taskTitle),
          )) &&
        card.status.toLowerCase() === "done",
    );

    console.log("Update Summary:", {
      totalMCPCards: mcpCards.length,
      updatedTasks,
      doneMCPCards: doneMCPCards.length,
      mainCardUpdated: mainMCPCard ? true : false,
    });

    console.log(
      "✅ MCP Implementation progress update completed successfully!",
    );
  } catch (error) {
    console.error("Failed to update MCP implementation progress", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run the script
updateMCPImplementationProgress();
