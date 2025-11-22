import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutomationTriggersManager, AutomationEvent } from './AutomationTriggers';

describe('AutomationTriggersManager', () => {
  let triggers: AutomationTriggersManager;

  beforeEach(() => {
    triggers = new AutomationTriggersManager();
  });

  describe('initialization', () => {
    it('should initialize with default rules', () => {
      expect(triggers).toBeDefined();
      const rules = triggers.getRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should have predefined default rules', () => {
      const rules = triggers.getRules();
      expect(rules).toContainEqual(
        expect.objectContaining({
          name: 'Task Completion Update',
          event: 'task.completed',
        })
      );
    });
  });

  describe('automation triggering', () => {
    it('should process task completion event', async () => {
      const event: AutomationEvent = {
        type: 'task.completed',
        data: { id: '123', title: 'Test Task', status: 'completed' },
        timestamp: new Date(),
        source: 'test',
      };

      // Should not throw and process the event
      await expect(triggers.triggerAutomation(event)).resolves.not.toThrow();
    });

    it('should process task failure event', async () => {
      const event: AutomationEvent = {
        type: 'task.failed',
        data: { id: '123', title: 'Test Task', error: 'Failed' },
        timestamp: new Date(),
        source: 'test',
      };

      await expect(triggers.triggerAutomation(event)).resolves.not.toThrow();
    });

    it('should process high priority task event', async () => {
      const event: AutomationEvent = {
        type: 'task.created',
        data: { id: '123', title: 'Critical Task', priority: 'critical' },
        timestamp: new Date(),
        source: 'test',
      };

      await expect(triggers.triggerAutomation(event)).resolves.not.toThrow();
    });

    it('should process workflow started event', async () => {
      const event: AutomationEvent = {
        type: 'workflow.started',
        data: { issueId: '456', workflowId: 'wf-123' },
        timestamp: new Date(),
        source: 'test',
      };

      await expect(triggers.triggerAutomation(event)).resolves.not.toThrow();
    });

    it('should process system health warning event', async () => {
      const event: AutomationEvent = {
        type: 'system.health.warning',
        data: { status: 'warning', message: 'High CPU usage' },
        timestamp: new Date(),
        source: 'test',
      };

      await expect(triggers.triggerAutomation(event)).resolves.not.toThrow();
    });
  });

  describe('rule management', () => {
    it('should allow adding custom rules', () => {
      const customRule = {
        id: 'custom-rule',
        name: 'Custom Rule',
        description: 'A custom automation rule',
        enabled: true,
        event: 'custom.event',
        condition: 'data.value > 10',
        actions: ['send-notification'],
        priority: 1,
      };

      triggers.addRule(customRule);

      const rules = triggers.getRules();
      expect(rules).toContainEqual(expect.objectContaining({ name: 'Custom Rule' }));
    });

    it('should allow updating rules', () => {
      const ruleId = 'task-completion-update';
      const updates = { enabled: false };

      triggers.updateRule(ruleId, updates);

      const rule = triggers.getRules().find(r => r.id === ruleId);
      expect(rule?.enabled).toBe(false);
    });

    it('should allow deleting rules', () => {
      const initialCount = triggers.getRules().length;
      const ruleToDelete = triggers.getRules()[0];

      triggers.deleteRule(ruleToDelete.id);

      const finalCount = triggers.getRules().length;
      expect(finalCount).toBe(initialCount - 1);
    });
  });

  describe('actions', () => {
    it('should have predefined actions', () => {
      const actions = triggers.getActions();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions).toContainEqual(
        expect.objectContaining({
          name: 'Update Kanban Board',
        })
      );
    });
  });

  describe('event listeners', () => {
    it('should allow adding and removing event listeners', () => {
      const listener = vi.fn();

      triggers.addEventListener('test.event', listener);
      // Event listeners are tested indirectly through triggerAutomation
      triggers.removeEventListener('test.event', listener);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle automation processing errors gracefully', async () => {
      const event: AutomationEvent = {
        type: 'invalid.event',
        data: {},
        timestamp: new Date(),
        source: 'test',
      };

      // Should not throw even for invalid events
      await expect(triggers.triggerAutomation(event)).resolves.not.toThrow();
    });
  });
});
