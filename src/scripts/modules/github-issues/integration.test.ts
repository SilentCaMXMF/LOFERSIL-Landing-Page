/**
 * Integration Test: GitHub Issues Reviewer System
 *
 * Validates that the AI-powered GitHub Issues Reviewer system is properly
 * integrated into the main project task management system.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('GitHub Issues Reviewer System Integration', () => {
  it('should have subtasks directory structure', () => {
    const subtasksDir = path.join(process.cwd(), 'tasks', 'subtasks');
    const systemDir = path.join(subtasksDir, 'ai-powered-github-issues-reviewer-system');

    expect(fs.existsSync(subtasksDir)).toBe(true);
    expect(fs.existsSync(systemDir)).toBe(true);
  });

  it('should have README.md with proper structure', () => {
    const readmePath = path.join(
      process.cwd(),
      'tasks',
      'subtasks',
      'ai-powered-github-issues-reviewer-system',
      'README.md'
    );
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('AI-Powered GitHub Issues Reviewer System');
    expect(content).toContain('Progress: 5/11 tasks completed');
    expect(content).toContain('[x] 01 — Implement Issue Intake & Analysis Component');
    expect(content).toContain('[x] 05 — Implement Workflow Orchestrator Component');
  });

  it('should have all task files created', () => {
    const systemDir = path.join(
      process.cwd(),
      'tasks',
      'subtasks',
      'ai-powered-github-issues-reviewer-system'
    );

    for (let i = 1; i <= 11; i++) {
      const taskFile = path.join(systemDir, `0${i.toString().padStart(2, '0')}-*.md`);
      // Check if any file matches the pattern
      const files = fs.readdirSync(systemDir).filter(f => f.match(new RegExp(`0${i}-.*\.md`)));
      expect(files.length).toBeGreaterThan(0);
    }
  });

  it('should be listed in main tasks README', () => {
    const mainReadmePath = path.join(process.cwd(), 'tasks', 'README.md');
    const content = fs.readFileSync(mainReadmePath, 'utf8');

    expect(content).toContain('ai-powered-github-issues-reviewer-system');
    expect(content).toContain('Autonomous GitHub issue resolution system');
    expect(content).toContain('5/11 tasks complete');
  });

  it('should be in kanban payload as ongoing project', () => {
    const kanbanPath = path.join(process.cwd(), 'kanban_payload.json');
    const content = fs.readFileSync(kanbanPath, 'utf8');
    const payload = JSON.parse(content);

    const systemTask = payload.tasks.find(
      (task: any) => task.id === 'ONGO-GITHUB-ISSUES-REVIEWER-001'
    );

    expect(systemTask).toBeDefined();
    expect(systemTask.group).toBe('Ongoing');
    expect(systemTask.status).toBe('In Progress');
    expect(systemTask.priority).toBe('P1');
    expect(systemTask.notes).toContain('5/11 core components implemented');
  });

  it('should have implemented core components', () => {
    const components = [
      'IssueAnalyzer.ts',
      'AutonomousResolver.ts',
      'CodeReviewer.ts',
      'PRGenerator.ts',
      'WorkflowOrchestrator.ts',
    ];

    const modulesDir = path.join(process.cwd(), 'src', 'scripts', 'modules', 'github-issues');

    for (const component of components) {
      const componentPath = path.join(modulesDir, component);
      expect(fs.existsSync(componentPath)).toBe(true);

      // Check that it's not empty
      const content = fs.readFileSync(componentPath, 'utf8');
      expect(content.length).toBeGreaterThan(100);
    }
  });

  it('should have test files for core components', () => {
    const testFiles = [
      'IssueAnalyzer.test.ts',
      'AutonomousResolver.test.ts',
      'CodeReviewer.test.ts',
      'PRGenerator.test.ts',
      'WorkflowOrchestrator.test.ts',
    ];

    const modulesDir = path.join(process.cwd(), 'src', 'scripts', 'modules', 'github-issues');

    for (const testFile of testFiles) {
      const testPath = path.join(modulesDir, testFile);
      expect(fs.existsSync(testPath)).toBe(true);
    }
  });

  it('should have proper progress tracking', () => {
    const mainReadmePath = path.join(process.cwd(), 'tasks', 'README.md');
    const content = fs.readFileSync(mainReadmePath, 'utf8');

    // Check that progress is updated
    expect(content).toContain('| **Ongoing**   | 4     | 🔄 In Progress | 13-55%     |');
    expect(content).toContain('| **Total**     | 12    | -              | ~25%       |');

    // Check detailed progress
    expect(content).toContain(
      '**ai-powered-github-issues-reviewer-system**: 5/11 tasks (45%) - Core components implemented'
    );
  });

  it('should have proper priority assignment', () => {
    const mainReadmePath = path.join(process.cwd(), 'tasks', 'README.md');
    const content = fs.readFileSync(mainReadmePath, 'utf8');

    expect(content).toContain(
      '**ai-powered-github-issues-reviewer-system/**(subtasks/ai-powered-github-issues-reviewer-system/)** - Complete remaining 6 tasks for autonomous issue resolution'
    );
  });
});
