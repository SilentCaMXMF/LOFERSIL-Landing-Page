---
name: kanbanstart
agent: task-manager
description: "Start live Kanban sync service for automatic task synchronization"
---

You are starting the live Kanban sync service that automatically syncs local tasks with the remote Kanban board every 5 minutes.

**Request:** $ARGUMENTS

**Context Loaded:**
@.opencode/context/core/essential-patterns.md
@.opencode/context/project/project-context.md

**LIVE KANBAN SYNC PROCESS:**

**1. SERVICE INITIALIZATION:**

- Verify sync service availability
- Check git repository status
- Prepare sync environment

**2. INITIAL SYNC EXECUTION:**

- Run immediate sync to update current state
- Validate connection to remote Kanban board
- Confirm task inventory accuracy

**3. AUTOMATIC SYNC SCHEDULING:**

- Start background sync process
- Configure 5-minute sync intervals
- Enable continuous monitoring

**4. SYNC MONITORING:**

- Display real-time sync status
- Log sync operations and results
- Handle sync failures gracefully

**5. SERVICE MANAGEMENT:**

- Provide stop instructions (Ctrl+C)
- Show service uptime and statistics
- Enable manual sync triggers

**SYNC FEATURES:**

- Automatic 5-minute synchronization
- Real-time task status updates
- Bidirectional sync (local ↔ remote)
- Error recovery and retry logic
- Git integration for change tracking

**SYNC STATUS INDICATORS:**

- Live sync status display
- Last sync timestamp
- Success/failure counters
- Current sync progress

**Execute live Kanban sync service startup now.**
