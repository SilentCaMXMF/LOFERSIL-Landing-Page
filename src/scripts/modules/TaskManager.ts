/**
 * Simple Task Manager for local storage
 */

export interface TaskInfo {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "blocked";
  assignee?: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export class TaskManager {
  private tasks: Map<string, TaskInfo> = new Map();

  async saveTask(task: TaskInfo): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async getTask(taskId: string): Promise<TaskInfo | null> {
    return this.tasks.get(taskId) || null;
  }

  async updateTask(task: TaskInfo): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async getAllTasks(): Promise<TaskInfo[]> {
    return Array.from(this.tasks.values());
  }

  async deleteTask(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
  }

  async getTasksByStatus(status: TaskInfo["status"]): Promise<TaskInfo[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === status,
    );
  }

  async getTasksByPriority(
    priority: TaskInfo["priority"],
  ): Promise<TaskInfo[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.priority === priority,
    );
  }
}
