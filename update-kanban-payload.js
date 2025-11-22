#!/usr/bin/env node
/**
 * Kanban Payload Updater
 *
 * Automatically inventories all tasks from the tasks/ directory
 * and updates kanban_payload.json with complete, accurate data.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
class KanbanPayloadUpdater {
    constructor() {
        this.tasks = [];
        this.idCounter = 1;
        this.loadExistingPayload();
    }
    loadExistingPayload() {
        try {
            const payloadPath = join(process.cwd(), 'kanban_payload.json');
            const payloadContent = readFileSync(payloadPath, 'utf-8');
            const payload = JSON.parse(payloadContent);
            this.tasks = payload.tasks || [];
            console.log(`✅ Loaded ${this.tasks.length} existing tasks from kanban_payload.json`);
        }
        catch (error) {
            console.log('⚠️  No existing kanban_payload.json found, starting fresh');
            this.tasks = [];
        }
    }
    generateId(group, title) {
        const groupPrefix = group.substring(0, 4).toUpperCase();
        const titleWords = title.split(' ').slice(0, 2).map(w => w.substring(0, 3).toUpperCase()).join('');
        const seq = String(this.idCounter++).padStart(3, '0');
        return `${groupPrefix}-${titleWords}-${seq}`;
    }
    extractTaskFromFile(filePath, group) {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            // Extract title from first # heading
            const titleLine = lines.find(line => line.startsWith('# '));
            if (!titleLine)
                return null;
            const title = titleLine.substring(2).trim();
            // Extract status from content
            let status = 'Todo';
            if (content.includes('Status: Concluído') || content.includes('Status: Done') || content.includes('Status: Completed')) {
                status = 'Done';
            }
            else if (content.includes('Status: In Progress') || content.includes('Status: Ongoing')) {
                status = 'In Progress';
            }
            // Extract priority (default to P2)
            let priority = 'P2';
            if (content.includes('priority: P1') || content.includes('Priority: High')) {
                priority = 'P1';
            }
            else if (content.includes('priority: P3') || content.includes('Priority: Low')) {
                priority = 'P3';
            }
            // Extract notes from summary or overview
            let notes = '';
            const summaryMatch = content.match(/## Resumo.*?\n([\s\S]*?)(?=\n##|\n###|$)/);
            if (summaryMatch) {
                notes = summaryMatch[1].trim().split('\n')[0];
            }
            else {
                // Fallback to first paragraph after title
                const afterTitle = content.substring(content.indexOf('\n##') + 1);
                const firstPara = afterTitle.split('\n\n')[0];
                notes = firstPara.replace(/\*\*/g, '').trim();
            }
            // Generate unique ID
            const id = this.generateId(group, title);
            return {
                id,
                title,
                group: group.charAt(0).toUpperCase() + group.slice(1),
                status,
                priority,
                source: filePath.replace(process.cwd() + '/', ''),
                notes: notes.substring(0, 200) // Truncate long notes
            };
        }
        catch (error) {
            console.error(`❌ Failed to parse ${filePath}:`, error);
            return null;
        }
    }
    inventoryDirectory(dirPath, group) {
        const items = readdirSync(dirPath);
        for (const item of items) {
            const itemPath = join(dirPath, item);
            const stat = statSync(itemPath);
            if (stat.isDirectory()) {
                // Check if it's a task directory (has README.md)
                const readmePath = join(itemPath, 'README.md');
                try {
                    statSync(readmePath);
                    const task = this.extractTaskFromFile(readmePath, group);
                    if (task) {
                        // Check if task already exists
                        const existingIndex = this.tasks.findIndex(t => t.source === task.source);
                        if (existingIndex >= 0) {
                            this.tasks[existingIndex] = task;
                            console.log(`🔄 Updated existing task: ${task.title}`);
                        }
                        else {
                            this.tasks.push(task);
                            console.log(`➕ Added new task: ${task.title}`);
                        }
                    }
                }
                catch {
                    // Not a task directory, skip
                }
            }
            else if (stat.isFile() && extname(item) === '.md' && item !== 'README.md') {
                // Individual task file
                const task = this.extractTaskFromFile(itemPath, group);
                if (task) {
                    const existingIndex = this.tasks.findIndex(t => t.source === task.source);
                    if (existingIndex >= 0) {
                        this.tasks[existingIndex] = task;
                        console.log(`🔄 Updated existing task: ${task.title}`);
                    }
                    else {
                        this.tasks.push(task);
                        console.log(`➕ Added new task: ${task.title}`);
                    }
                }
            }
        }
    }
    updatePayload() {
        console.log('🚀 UPDATING KANBAN PAYLOAD');
        console.log('='.repeat(50));
        // Inventory all directories
        const taskDirs = ['completed', 'ongoing', 'todo', 'plans', 'subtasks'];
        for (const dir of taskDirs) {
            const dirPath = join(process.cwd(), 'tasks', dir);
            try {
                console.log(`\n📂 Inventorying ${dir}...`);
                this.inventoryDirectory(dirPath, dir);
            }
            catch (error) {
                console.error(`❌ Failed to inventory ${dir}:`, error);
            }
        }
        // Sort tasks by group, then by title
        this.tasks.sort((a, b) => {
            if (a.group !== b.group)
                return a.group.localeCompare(b.group);
            return a.title.localeCompare(b.title);
        });
        // Update payload
        const payload = {
            repository: 'LOFERSIL-Landing-Page',
            last_updated: new Date().toISOString(),
            tasks: this.tasks
        };
        const payloadPath = join(process.cwd(), 'kanban_payload.json');
        writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
        console.log(`\n✅ Updated kanban_payload.json with ${this.tasks.length} tasks`);
        // Summary by group
        const groupCounts = {};
        this.tasks.forEach(task => {
            groupCounts[task.group] = (groupCounts[task.group] || 0) + 1;
        });
        console.log('\n📊 Task Summary:');
        Object.entries(groupCounts).forEach(([group, count]) => {
            console.log(`   ${group}: ${count} tasks`);
        });
    }
}
// Run the updater
if (import.meta.url === `file://${process.argv[1]}`) {
    const updater = new KanbanPayloadUpdater();
    updater.updatePayload();
}
export { KanbanPayloadUpdater };
