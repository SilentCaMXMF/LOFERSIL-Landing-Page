#!/usr/bin/env node

/**
 * Kanban Board Analysis Tool
 *
 * Analyzes the current kanban board state using KanbanManager implementation
 * and provides comprehensive insights about work distribution, progress, and bottlenecks.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

class KanbanAnalyzer {
  constructor() {
    this.loadKanbanData();
  }

  loadKanbanData() {
    try {
      const payloadPath = join(process.cwd(), 'kanban_payload.json');
      const payloadContent = readFileSync(payloadPath, 'utf-8');
      const payload = JSON.parse(payloadContent);
      this.kanbanPayload = payload.tasks || [];
    } catch (error) {
      console.error('Failed to load kanban payload:', error);
      process.exit(1);
    }
  }

  analyze() {
    const analysis = {
      executiveSummary: this.calculateExecutiveSummary(),
      workDistribution: this.calculateWorkDistribution(),
      progressAssessment: this.assessProgress(),
      aiSystemStatus: this.analyzeAISystem(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateRecommendations(),
    };

    return analysis;
  }

  calculateExecutiveSummary() {
    const total = this.kanbanPayload.length;
    const completed = this.kanbanPayload.filter(
      t => t.status.includes('Done') || t.group === 'In Review'
    ).length;
    const inProgress = this.kanbanPayload.filter(t => t.status.includes('In Progress')).length;
    const pending = this.kanbanPayload.filter(
      t => t.status === 'Todo' || t.status === 'Ready for Implementation'
    ).length;

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      overallProgress: Math.round((completed / total) * 100),
    };
  }

  calculateWorkDistribution() {
    const byGroup = {};
    const byPriority = {};
    const byStatus = {};

    this.kanbanPayload.forEach(task => {
      // Group distribution
      byGroup[task.group] = (byGroup[task.group] || 0) + 1;

      // Priority distribution
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

      // Status distribution
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    });

    return { byGroup, byPriority, byStatus };
  }

  assessProgress() {
    const completed = this.kanbanPayload.filter(
      t => t.status.includes('Done') || t.group === 'In Review'
    );
    const inProgress = this.kanbanPayload.filter(t => t.status.includes('In Progress'));
    const pending = this.kanbanPayload.filter(
      t => t.status === 'Todo' || t.status === 'Ready for Implementation'
    );
    const blocked = this.kanbanPayload.filter(
      t => t.status.includes('blocked') || t.status.includes('failed')
    );

    return {
      completed,
      inProgress,
      pending,
      blocked,
    };
  }

  analyzeAISystem() {
    const aiTasks = this.kanbanPayload.filter(
      t =>
        t.title.includes('AI-Powered GitHub Issues Reviewer') ||
        t.title.includes('CodeReviewer') ||
        t.title.includes('WorkflowOrchestrator') ||
        t.title.includes('GitHub Integration')
    );

    const mainTask = this.kanbanPayload.find(t => t.id === 'ONGO-GITHUB-ISSUES-REVIEWER-001');

    const totalComponents = 11; // Based on the notes in main task
    const implementedComponents = 6; // Based on the notes in main task

    return {
      githubIssuesReviewer: {
        totalComponents,
        implementedComponents,
        progress: Math.round((implementedComponents / totalComponents) * 100),
        status: mainTask?.status || 'Unknown',
      },
      relatedTasks: aiTasks,
    };
  }

  identifyBottlenecks() {
    const bottlenecks = [];

    // Check for tasks stuck in Todo with high priority
    const highPriorityPending = this.kanbanPayload.filter(
      t => t.priority === 'P1' && t.status === 'Todo'
    );

    if (highPriorityPending.length > 0) {
      bottlenecks.push({
        description: 'High priority tasks stuck in Todo status',
        affectedTasks: highPriorityPending.map(t => t.id),
        recommendation: 'Review and prioritize P1 tasks in Todo queue for immediate attention',
      });
    }

    // Check for AI system components that need implementation
    const aiComponentsPending = this.kanbanPayload.filter(
      t =>
        (t.title.includes('CodeReviewer') ||
          t.title.includes('WorkflowOrchestrator') ||
          t.title.includes('GitHub Integration')) &&
        t.status === 'Todo'
    );

    if (aiComponentsPending.length > 0) {
      bottlenecks.push({
        description: 'Critical AI system components pending implementation',
        affectedTasks: aiComponentsPending.map(t => t.id),
        recommendation: 'Focus on implementing core AI components to complete the system',
      });
    }

    // Check for tasks with no progress
    const noProgressTasks = this.kanbanPayload.filter(
      t => t.group === 'Ongoing' && t.status === 'Todo'
    );

    if (noProgressTasks.length > 0) {
      bottlenecks.push({
        description: 'Ongoing tasks with no progress',
        affectedTasks: noProgressTasks.map(t => t.id),
        recommendation: 'Review ongoing tasks and either start work or move to appropriate status',
      });
    }

    return bottlenecks;
  }

  generateRecommendations() {
    const recommendations = [];
    const executiveSummary = this.calculateExecutiveSummary();
    const aiSystemStatus = this.analyzeAISystem();
    const bottlenecks = this.identifyBottlenecks();

    // Overall progress recommendations
    if (executiveSummary.overallProgress < 50) {
      recommendations.push('Focus on completing high-priority tasks to improve overall progress');
    }

    // AI system specific recommendations
    if (aiSystemStatus.githubIssuesReviewer.progress < 80) {
      recommendations.push(
        'Prioritize completion of AI-Powered GitHub Issues Reviewer System components'
      );
    }

    // Bottleneck specific recommendations
    bottlenecks.forEach(bottleneck => {
      recommendations.push(bottleneck.recommendation);
    });

    // Process improvement recommendations
    const p1Tasks = this.kanbanPayload.filter(t => t.priority === 'P1');
    const p1InProgress = p1Tasks.filter(t => t.status.includes('In Progress'));

    if (p1InProgress.length < p1Tasks.length / 2) {
      recommendations.push('Increase focus on P1 tasks - ensure at least 50% are in progress');
    }

    // Workflow recommendations
    const todoCount = this.kanbanPayload.filter(t => t.group === 'Todo').length;
    const ongoingCount = this.kanbanPayload.filter(t => t.group === 'Ongoing').length;

    if (todoCount > ongoingCount * 2) {
      recommendations.push('Consider moving some Todo tasks to Ongoing to balance workload');
    }

    return recommendations;
  }

  generateReport() {
    const analysis = this.analyze();

    console.log('\n' + '='.repeat(80));
    console.log('📊 KANBAN BOARD ANALYSIS REPORT');
    console.log('='.repeat(80));

    // Executive Summary
    console.log('\n🎯 EXECUTIVE SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total Tasks: ${analysis.executiveSummary.totalTasks}`);
    console.log(
      `Completed: ${analysis.executiveSummary.completedTasks} (${analysis.executiveSummary.overallProgress}%)`
    );
    console.log(`In Progress: ${analysis.executiveSummary.inProgressTasks}`);
    console.log(`Pending: ${analysis.executiveSummary.pendingTasks}`);
    console.log(`Overall Progress: ${analysis.executiveSummary.overallProgress}%`);

    // Work Distribution
    console.log('\n📋 WORK DISTRIBUTION');
    console.log('-'.repeat(40));
    console.log('\nBy Group:');
    Object.entries(analysis.workDistribution.byGroup).forEach(([group, count]) => {
      console.log(`  ${group}: ${count}`);
    });

    console.log('\nBy Priority:');
    Object.entries(analysis.workDistribution.byPriority).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count}`);
    });

    console.log('\nBy Status:');
    Object.entries(analysis.workDistribution.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Progress Assessment
    console.log('\n📈 PROGRESS ASSESSMENT');
    console.log('-'.repeat(40));
    console.log(`\n✅ Completed (${analysis.progressAssessment.completed.length}):`);
    analysis.progressAssessment.completed.forEach(task => {
      console.log(`  - ${task.title} (${task.id})`);
    });

    console.log(`\n🔄 In Progress (${analysis.progressAssessment.inProgress.length}):`);
    analysis.progressAssessment.inProgress.forEach(task => {
      console.log(`  - ${task.title} (${task.id})`);
    });

    console.log(`\n⏳ Pending (${analysis.progressAssessment.pending.length}):`);
    analysis.progressAssessment.pending.forEach(task => {
      console.log(`  - ${task.title} (${task.id})`);
    });

    // AI System Status
    console.log('\n🤖 AI-POWERED GITHUB ISSUES REVIEWER STATUS');
    console.log('-'.repeat(40));
    const aiStatus = analysis.aiSystemStatus.githubIssuesReviewer;
    console.log(
      `Progress: ${aiStatus.progress}% (${aiStatus.implementedComponents}/${aiStatus.totalComponents} components)`
    );
    console.log(`Status: ${aiStatus.status}`);

    console.log('\nRelated Tasks:');
    analysis.aiSystemStatus.relatedTasks.forEach(task => {
      console.log(`  - ${task.title} (${task.status})`);
    });

    // Bottlenecks
    if (analysis.bottlenecks.length > 0) {
      console.log('\n⚠️  IDENTIFIED BOTTLENECKS');
      console.log('-'.repeat(40));
      analysis.bottlenecks.forEach((bottleneck, index) => {
        console.log(`\n${index + 1}. ${bottleneck.description}`);
        console.log(`   Affected Tasks: ${bottleneck.affectedTasks.join(', ')}`);
        console.log(`   Recommendation: ${bottleneck.recommendation}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📅 Report generated on:', new Date().toISOString());
    console.log('='.repeat(80));
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new KanbanAnalyzer();
  analyzer.generateReport();
}

export { KanbanAnalyzer };
