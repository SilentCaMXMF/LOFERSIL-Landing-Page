import { describe, it, expect, beforeEach } from "vitest";
import { TaskManager, TaskInfo } from "../modules/TaskManager";

describe("TaskManager", () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
  });

  describe("task operations", () => {
    const mockTask: TaskInfo = {
      id: "test-task-1",
      title: "Test Task",
      description: "A test task for unit testing",
      priority: "medium",
      status: "pending",
      assignee: "test-user",
      labels: ["test", "unit"],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { source: "test" },
    };

    it("should save and retrieve a task", async () => {
      await taskManager.saveTask(mockTask);

      const retrieved = await taskManager.getTask("test-task-1");
      expect(retrieved).toEqual(mockTask);
    });

    it("should return null for non-existent task", async () => {
      const retrieved = await taskManager.getTask("non-existent");
      expect(retrieved).toBeNull();
    });

    it("should update a task", async () => {
      await taskManager.saveTask(mockTask);

      const updatedTask = {
        ...mockTask,
        status: "completed" as const,
        updatedAt: new Date(),
      };
      await taskManager.updateTask(updatedTask);

      const retrieved = await taskManager.getTask("test-task-1");
      expect(retrieved?.status).toBe("completed");
    });

    it("should delete a task", async () => {
      await taskManager.saveTask(mockTask);
      await taskManager.deleteTask("test-task-1");

      const retrieved = await taskManager.getTask("test-task-1");
      expect(retrieved).toBeNull();
    });

    it("should get all tasks", async () => {
      const task2 = { ...mockTask, id: "test-task-2" };
      await taskManager.saveTask(mockTask);
      await taskManager.saveTask(task2);

      const allTasks = await taskManager.getAllTasks();
      expect(allTasks).toHaveLength(2);
      expect(allTasks).toContainEqual(mockTask);
      expect(allTasks).toContainEqual(task2);
    });
  });

  describe("task filtering", () => {
    beforeEach(async () => {
      const tasks: TaskInfo[] = [
        {
          id: "task-1",
          title: "High Priority Task",
          description: "High priority task",
          priority: "high",
          status: "pending",
          labels: ["urgent"],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
        {
          id: "task-2",
          title: "Completed Task",
          description: "Completed task",
          priority: "medium",
          status: "completed",
          labels: ["done"],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
        {
          id: "task-3",
          title: "Low Priority Task",
          description: "Low priority task",
          priority: "low",
          status: "in_progress",
          labels: ["backlog"],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
      ];

      for (const task of tasks) {
        await taskManager.saveTask(task);
      }
    });

    it("should filter tasks by status", async () => {
      const pendingTasks = await taskManager.getTasksByStatus("pending");
      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].id).toBe("task-1");

      const completedTasks = await taskManager.getTasksByStatus("completed");
      expect(completedTasks).toHaveLength(1);
      expect(completedTasks[0].id).toBe("task-2");
    });

    it("should filter tasks by priority", async () => {
      const highPriorityTasks = await taskManager.getTasksByPriority("high");
      expect(highPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks[0].id).toBe("task-1");

      const lowPriorityTasks = await taskManager.getTasksByPriority("low");
      expect(lowPriorityTasks).toHaveLength(1);
      expect(lowPriorityTasks[0].id).toBe("task-3");
    });

    it("should return empty array for non-matching filters", async () => {
      const criticalTasks = await taskManager.getTasksByPriority("critical");
      expect(criticalTasks).toHaveLength(0);

      const blockedTasks = await taskManager.getTasksByStatus("blocked");
      expect(blockedTasks).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty task list", async () => {
      const allTasks = await taskManager.getAllTasks();
      expect(allTasks).toHaveLength(0);

      const pendingTasks = await taskManager.getTasksByStatus("pending");
      expect(pendingTasks).toHaveLength(0);
    });

    it("should handle task updates with same id", async () => {
      const task1: TaskInfo = {
        id: "same-id",
        title: "Original Task",
        description: "Original description",
        priority: "medium",
        status: "pending",
        labels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      };

      const task2: TaskInfo = {
        id: "same-id",
        title: "Updated Task",
        description: "Updated description",
        priority: "high",
        status: "completed",
        labels: ["updated"],
        createdAt: task1.createdAt,
        updatedAt: new Date(),
        metadata: { updated: true },
      };

      await taskManager.saveTask(task1);
      await taskManager.saveTask(task2);

      const retrieved = await taskManager.getTask("same-id");
      expect(retrieved?.title).toBe("Updated Task");
      expect(retrieved?.status).toBe("completed");
    });
  });
});
