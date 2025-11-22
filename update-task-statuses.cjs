#!/usr/bin/env node

/**
 * Task Status Updater
 *
 * Updates kanban_payload.json with accurate task statuses based on actual progress
 * from the task files themselves.
 */

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

class TaskStatusUpdater {
  constructor() {
    this.loadKanbanData();
  }

  loadKanbanData() {
    try {
      const payloadPath = join(process.cwd(), 'kanban_payload.json');
      const payloadContent = readFileSync(payloadPath, 'utf-8');
      const payload = JSON.parse(payloadContent);
      this.tasks = payload.tasks || [];
      console.log(`✅ Loaded ${this.tasks.length} tasks from kanban_payload.json`);
    } catch (error) {
      console.error('❌ Failed to load kanban payload:', error);
      process.exit(1);
    }
  }

  extractStatusFromFile(filePath) {
    try {
      const content = readFileSync(filePath, 'utf-8');

      // Check for completion markers
      if (
        content.includes('**PROJECT COMPLETED!**') ||
        content.includes('✅ All 6 core components are implemented') ||
        content.includes('**Progress: 11/11 tasks completed (100%)**')
      ) {
        return 'Done';
      }

      // Check for in-progress indicators
      if (
        content.includes('Status: In Progress') ||
        content.includes('Status: Ongoing') ||
        content.includes('1/11 tasks completed') ||
        content.includes('All tasks pending')
      ) {
        return 'In Progress';
      }

      // Check for specific task completion patterns
      const completedTasks = (content.match(/\[x\]/g) || []).length;
      const totalTasks = (content.match(/\[[ x~]\]/g) || []).length;

      if (totalTasks > 0 && completedTasks === totalTasks) {
        return 'Done';
      } else if (completedTasks > 0) {
        return 'In Progress';
      }

      // Default to Todo for plans and new tasks
      return 'Todo';
    } catch (error) {
      console.error(`❌ Failed to read ${filePath}:`, error);
      return 'Todo';
    }
  }

  updateTaskStatuses() {
    console.log('🔄 UPDATING TASK STATUSES');
    console.log('='.repeat(50));

    let updatedCount = 0;

    for (const task of this.tasks) {
      const actualStatus = this.extractStatusFromFile(task.source);

      if (task.status !== actualStatus) {
        console.log(`📝 ${task.title}: ${task.status} → ${actualStatus}`);
        task.status = actualStatus;
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} task statuses`);

    // Update the payload
    const payload = {
      repository: 'LOFERSIL-Landing-Page',
      last_updated: new Date().toISOString(),
      tasks: this.tasks,
    };

    const payloadPath = join(process.cwd(), 'kanban_payload.json');
    writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
    console.log('💾 Saved updated kanban_payload.json');

    // Summary
    const statusCounts = {};
    this.tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    console.log('\n📊 Updated Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} tasks`);
    });
  }
}

// Run the updater
if (require.main === module) {
  const updater = new TaskStatusUpdater();
  updater.updateTaskStatuses();
}

module.exports = { TaskStatusUpdater };
