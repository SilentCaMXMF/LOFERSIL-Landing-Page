# Weekly Tasks Review Process

## Overview

This document outlines the weekly review process for maintaining the accuracy and organization of the tasks folder. Reviews ensure that progress is tracked correctly, discrepancies are resolved promptly, and the task management system remains effective.

## Review Schedule

- **Frequency**: Weekly, every Friday
- **Duration**: 30-60 minutes
- **Responsible**: Project maintainer or designated reviewer

## Review Checklist

### 1. Progress Accuracy

- [ ] Run `npm run tasks-progress` to generate current progress report
- [ ] Compare report with main README progress summary
- [ ] Verify individual task READMEs match actual completion status
- [ ] Update any discrepancies in progress percentages

### 2. Folder Organization

- [ ] Check for any misplaced task folders (e.g., completed tasks in ongoing)
- [ ] Ensure all task groups are in correct categories (completed/ongoing/todo)
- [ ] Verify no loose files remain outside proper task structures
- [ ] Confirm subtasks are properly integrated

### 3. README Consistency

- [ ] Ensure all task group READMEs follow standard format
- [ ] Check that dependencies and exit criteria are up-to-date
- [ ] Verify task file links are correct
- [ ] Update main README with any new task groups

### 4. Task Status Updates

- [ ] Review ongoing tasks for potential completion
- [ ] Move completed tasks from ongoing to completed
- [ ] Identify blocked or stalled tasks
- [ ] Update priority assessments if needed

### 5. Maintenance

- [ ] Archive old completed tasks if folder grows too large
- [ ] Clean up any obsolete references
- [ ] Update last modified dates in READMEs
- [ ] Backup task files periodically

## Automated Reminders

### GitHub Actions Setup

A GitHub Action can be set up to create weekly issues for review:

```yaml
# .github/workflows/weekly-tasks-review.yml
name: Weekly Tasks Review
on:
  schedule:
    - cron: '0 9 * * 5' # Every Friday at 9 AM UTC
jobs:
  create-review-issue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Weekly Tasks Review - ${new Date().toISOString().split('T')[0]}`,
              body: `## Weekly Tasks Review Checklist\n\n- [ ] Run progress report\n- [ ] Check folder organization\n- [ ] Verify README consistency\n- [ ] Update task statuses\n- [ ] Perform maintenance\n\nSee [review process](tasks/weekly-review-process.md) for details.`,
              labels: ['maintenance', 'tasks']
            });
```

## Initial Review

Perform the first review immediately after setup:

- [ ] Run progress report
- [ ] Check all checklist items
- [ ] Document any findings
- [ ] Update this document as needed

## Escalation

If issues are found that cannot be resolved within the review:

- Create follow-up tasks in appropriate folders
- Notify team members if collaboration is needed
- Escalate critical issues (e.g., security-related) immediately

## Metrics

Track review effectiveness:

- Time spent on each review
- Number of discrepancies found and resolved
- Task completion rate improvements
- System accuracy over time

## Last Reviewed

- Date: [Current Date]
- Reviewer: [Your Name]
- Findings: [Summary of findings]
