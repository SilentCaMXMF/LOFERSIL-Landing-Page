/**
 * Worktree Manager Mocks for E2E Testing
 *
 * Comprehensive mocks for worktree management operations used in the workflow.
 */

import { vi } from 'vitest';
import { DEFAULT_TEST_CONFIG } from '../test-config';

// Mock Worktree Manager Response Types
export interface WorktreeInfo {
  branch: string;
  path: string;
  issueId: number;
  createdAt: Date;
  status: 'active' | 'completed' | 'failed' | 'cleaned';
  commitSha?: string;
  parentBranch: string;
}

export interface WorktreeOperationResult {
  success: boolean;
  worktree?: WorktreeInfo;
  error?: string;
  duration: number;
}

export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;
}

// Mock Factory Functions
export function createMockWorktreeInfo(overrides: Partial<WorktreeInfo> = {}): WorktreeInfo {
  const baseWorktree: WorktreeInfo = {
    branch: `issue-${Math.floor(Math.random() * 1000)}`,
    path: `/tmp/worktree-${Math.floor(Math.random() * 1000)}`,
    issueId: Math.floor(Math.random() * 1000) + 1,
    createdAt: new Date(),
    status: 'active',
    commitSha: Math.random().toString(36).substring(7),
    parentBranch: 'main',
  };

  return { ...baseWorktree, ...overrides };
}

export function createMockOperationResult(
  overrides: Partial<WorktreeOperationResult> = {}
): WorktreeOperationResult {
  const baseResult: WorktreeOperationResult = {
    success: true,
    worktree: createMockWorktreeInfo(),
    duration: Math.floor(Math.random() * 1000) + 100,
  };

  return { ...baseResult, ...overrides };
}

// Worktree Manager Mock Implementation
export class WorktreeManagerMock {
  private config = DEFAULT_TEST_CONFIG.mocks.worktree;
  private worktrees: Map<number, WorktreeInfo> = new Map();
  private operationHistory: WorktreeOperationResult[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some default worktrees
    const defaultWorktrees = [
      createMockWorktreeInfo({ issueId: 1, status: 'active' }),
      createMockWorktreeInfo({ issueId: 2, status: 'completed' }),
      createMockWorktreeInfo({ issueId: 3, status: 'failed' }),
    ];

    defaultWorktrees.forEach(worktree => {
      this.worktrees.set(worktree.issueId, worktree);
    });
  }

  private async simulateLatency(): Promise<void> {
    const latency = this.config.creationLatency + Math.random() * 50;
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  private shouldFail(): boolean {
    return Math.random() < this.config.failureRate;
  }

  // Mock Manager Methods
  createWorktree = vi
    .fn()
    .mockImplementation(
      async (issueId: number, branchName?: string): Promise<WorktreeOperationResult> => {
        const startTime = Date.now();
        await this.simulateLatency();

        const duration = Date.now() - startTime;

        if (this.shouldFail()) {
          const result = createMockOperationResult({
            success: false,
            error: 'Failed to create worktree',
            duration,
          });
          this.operationHistory.push(result);
          return result;
        }

        const worktree = createMockWorktreeInfo({
          issueId,
          branch: branchName || `issue-${issueId}`,
          status: 'active',
        });

        this.worktrees.set(issueId, worktree);

        const result = createMockOperationResult({
          success: true,
          worktree,
          duration,
        });

        this.operationHistory.push(result);
        return result;
      }
    );

  getWorktree = vi
    .fn()
    .mockImplementation(async (issueId: number): Promise<WorktreeInfo | null> => {
      await this.simulateLatency();

      if (this.shouldFail()) {
        return null;
      }

      return this.worktrees.get(issueId) || null;
    });

  listWorktrees = vi.fn().mockImplementation(async (): Promise<WorktreeInfo[]> => {
    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error('Failed to list worktrees');
    }

    return Array.from(this.worktrees.values());
  });

  applyChanges = vi
    .fn()
    .mockImplementation(
      async (issueId: number, changes: FileChange[]): Promise<WorktreeOperationResult> => {
        const startTime = Date.now();
        await this.simulateLatency();

        const duration = Date.now() - startTime;

        if (this.shouldFail()) {
          const result = createMockOperationResult({
            success: false,
            error: 'Failed to apply changes',
            duration,
          });
          this.operationHistory.push(result);
          return result;
        }

        const worktree = this.worktrees.get(issueId);
        if (!worktree) {
          const result = createMockOperationResult({
            success: false,
            error: 'Worktree not found',
            duration,
          });
          this.operationHistory.push(result);
          return result;
        }

        // Simulate applying changes
        const updatedWorktree = {
          ...worktree,
          commitSha: Math.random().toString(36).substring(7),
        };

        this.worktrees.set(issueId, updatedWorktree);

        const result = createMockOperationResult({
          success: true,
          worktree: updatedWorktree,
          duration,
        });

        this.operationHistory.push(result);
        return result;
      }
    );

  commitChanges = vi
    .fn()
    .mockImplementation(
      async (issueId: number, message: string): Promise<WorktreeOperationResult> => {
        const startTime = Date.now();
        await this.simulateLatency();

        const duration = Date.now() - startTime;

        if (this.shouldFail()) {
          const result = createMockOperationResult({
            success: false,
            error: 'Failed to commit changes',
            duration,
          });
          this.operationHistory.push(result);
          return result;
        }

        const worktree = this.worktrees.get(issueId);
        if (!worktree) {
          const result = createMockOperationResult({
            success: false,
            error: 'Worktree not found',
            duration,
          });
          this.operationHistory.push(result);
          return result;
        }

        const updatedWorktree = {
          ...worktree,
          commitSha: Math.random().toString(36).substring(7),
        };

        this.worktrees.set(issueId, updatedWorktree);

        const result = createMockOperationResult({
          success: true,
          worktree: updatedWorktree,
          duration,
        });

        this.operationHistory.push(result);
        return result;
      }
    );

  cleanupWorktree = vi
    .fn()
    .mockImplementation(async (issueId: number): Promise<WorktreeOperationResult> => {
      const startTime = Date.now();
      await this.simulateLatency();

      const duration = Date.now() - startTime;

      if (this.shouldFail()) {
        const result = createMockOperationResult({
          success: false,
          error: 'Failed to cleanup worktree',
          duration,
        });
        this.operationHistory.push(result);
        return result;
      }

      const worktree = this.worktrees.get(issueId);
      if (!worktree) {
        const result = createMockOperationResult({
          success: false,
          error: 'Worktree not found',
          duration,
        });
        this.operationHistory.push(result);
        return result;
      }

      const updatedWorktree = {
        ...worktree,
        status: 'cleaned' as const,
      };

      this.worktrees.set(issueId, updatedWorktree);

      const result = createMockOperationResult({
        success: true,
        worktree: updatedWorktree,
        duration,
      });

      this.operationHistory.push(result);
      return result;
    });

  // Utility methods for test control
  getWorktreeStore(): Map<number, WorktreeInfo> {
    return new Map(this.worktrees);
  }

  getOperationHistory(): WorktreeOperationResult[] {
    return [...this.operationHistory];
  }

  addWorktree(worktree: WorktreeInfo): void {
    this.worktrees.set(worktree.issueId, worktree);
  }

  reset(): void {
    this.worktrees.clear();
    this.operationHistory = [];
    this.initializeMockData();
  }

  setFailureRate(rate: number): void {
    this.config.failureRate = rate;
  }

  setLatency(type: 'creation' | 'operation', latency: number): void {
    if (type === 'creation') {
      this.config.creationLatency = latency;
    } else {
      this.config.operationLatency = latency;
    }
  }
}

// Factory function for creating configured mock instances
export function createWorktreeManagerMock(
  config?: Partial<typeof DEFAULT_TEST_CONFIG.mocks.worktree>
): WorktreeManagerMock {
  const mock = new WorktreeManagerMock();
  if (config) {
    if (config.failureRate !== undefined) mock.setFailureRate(config.failureRate);
    if (config.creationLatency !== undefined) mock.setLatency('creation', config.creationLatency);
    if (config.operationLatency !== undefined)
      mock.setLatency('operation', config.operationLatency);
  }
  return mock;
}

// Default mock instance for convenience
export const mockWorktreeManager = createWorktreeManagerMock();
