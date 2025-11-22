#!/usr/bin/env node

/**
 * Local Kanban Sync Test Script
 *
 * Simulates the kanban sync process locally to test the mapping logic
 * without actually creating GitHub issues.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

class KanbanSyncTester {
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

  // Simulate the group to status mapping from the workflow
  mapGroupToStatus(group) {
    const g = (group || '').toLowerCase().trim();
    const mapping = {
      completed: 'In review',
      done: 'In review',
      ongoing: 'In progress',
      'in progress': 'In progress',
      inprogress: 'In progress',
      todo: 'Backlog',
      'to do': 'Backlog',
      plans: 'Ready',
      subtasks: 'Ready',
    };
    return mapping[g] || 'Backlog';
  }

  // Simulate what the workflow does for each task
  simulateSync() {
    console.log('\n🔄 SIMULATING KANBAN SYNC PROCESS');
    console.log('='.repeat(60));

    this.tasks.forEach((task, index) => {
      const status = this.mapGroupToStatus(task.group);
      const issueTitle = task.title;
      const issueBody = [
        `Group: ${task.group}`,
        `Status: ${task.status}`,
        `Priority: ${task.priority}`,
        `Source: ${task.source}`,
        `Notes: ${task.notes}`,
        `KanbanID: ${task.id}`,
      ].join('\n');

      console.log(`\n${index + 1}. Task: ${task.id}`);
      console.log(`   Title: ${issueTitle}`);
      console.log(`   Group: ${task.group} → Status: ${status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Body Preview: ${issueBody.substring(0, 100)}...`);

      // In real sync, this would:
      // 1. Create GitHub issue with title and body
      // 2. Add issue to GitHub Projects v2 board
      // 3. Set status field to mapped value
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎯 SYNC SIMULATION COMPLETE');
    console.log(`📊 Would create ${this.tasks.length} GitHub issues`);
    console.log('📋 Status distribution:');

    const statusCounts = {};
    this.tasks.forEach(task => {
      const status = this.mapGroupToStatus(task.group);
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} issues`);
    });
  }

  // Test the sync logic
  testSyncLogic() {
    console.log('\n🧪 TESTING SYNC LOGIC');
    console.log('-'.repeat(40));

    // Test group mappings
    const testGroups = ['Done', 'Ongoing', 'Todo', 'Plans', 'In Review'];
    testGroups.forEach(group => {
      const status = this.mapGroupToStatus(group);
      console.log(`   ${group.padEnd(10)} → ${status}`);
    });

    // Test edge cases
    const edgeCases = ['', null, undefined, 'unknown'];
    console.log('\n   Edge cases:');
    edgeCases.forEach(group => {
      const status = this.mapGroupToStatus(group);
      console.log(`   ${String(group).padEnd(10)} → ${status}`);
    });
  }

  runTests() {
    console.log('🚀 KANBAN SYNC TEST SUITE');
    console.log('='.repeat(50));

    this.testSyncLogic();
    this.simulateSync();

    console.log('\n✅ LOCAL KANBAN SYNC TEST COMPLETE');
    console.log('\n📝 To actually sync with GitHub:');
    console.log('   1. Commit and push kanban_payload.json changes');
    console.log('   2. GitHub Actions will automatically trigger kanban-sync-classic.yml');
    console.log('   3. Check your GitHub Projects v2 board for new issues');
    console.log('\n⚠️  Note: Requires KANBAN_GH_TOKEN secret in repository settings');
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new KanbanSyncTester();
  tester.runTests();
}

export { KanbanSyncTester };
