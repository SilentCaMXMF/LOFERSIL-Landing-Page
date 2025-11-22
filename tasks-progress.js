#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const tasksDir = 'tasks';

function parseReadme(content) {
  const lines = content.split('\n');
  let inTasks = false;
  let completed = 0;
  let total = 0;

  for (const line of lines) {
    if (line.includes('Tasks')) {
      inTasks = true;
      continue;
    }
    if (inTasks && line.trim() === '') continue;
    if (inTasks && line.startsWith('Dependencies')) break;
    if (inTasks && line.includes('—')) {
      total++;
      if (line.includes('[x]')) completed++;
    }
  }

  return { completed, total };
}

function scanTasks() {
  const categories = {
    completed: [],
    ongoing: [],
    todo: [],
    plans: [],
  };

  const dirs = fs.readdirSync(tasksDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const category = dir.name;
    if (!categories[category]) continue;

    const categoryPath = path.join(tasksDir, category);
    const items = fs.readdirSync(categoryPath, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        const readmePath = path.join(categoryPath, item.name, 'README.md');
        if (fs.existsSync(readmePath)) {
          const content = fs.readFileSync(readmePath, 'utf8');
          const { completed, total } = parseReadme(content);
          categories[category].push({
            name: item.name,
            completed,
            total,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
          });
        }
      } else if (item.name.endsWith('.md')) {
        // Single file tasks
        categories[category].push({
          name: item.name,
          completed: 1,
          total: 1,
          progress: 100,
        });
      }
    }
  }

  return categories;
}

function generateReport(categories) {
  let report = '# Tasks Progress Report\n\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;

  let totalCompleted = 0;
  let totalTasks = 0;

  for (const [category, items] of Object.entries(categories)) {
    if (items.length === 0) continue;

    report += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    for (const item of items) {
      report += `- ${item.name}: ${item.completed}/${item.total} (${item.progress}%)\n`;
      totalCompleted += item.completed;
      totalTasks += item.total;
    }
    report += '\n';
  }

  const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  report += `## Summary\n\n`;
  report += `- Total Tasks: ${totalTasks}\n`;
  report += `- Completed: ${totalCompleted}\n`;
  report += `- Overall Progress: ${overallProgress}%\n`;

  return report;
}

function main() {
  try {
    const categories = scanTasks();
    const report = generateReport(categories);
    console.log(report);

    // Optionally write to file
    fs.writeFileSync('tasks-progress-report.md', report);
    console.log('\nReport saved to tasks-progress-report.md');
  } catch (error) {
    console.error('Error generating report:', error.message);
    process.exit(1);
  }
}

main();
