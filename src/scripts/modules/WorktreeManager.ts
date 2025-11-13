/**
 * Git Worktrees Manager for AI-Powered GitHub Issues Reviewer
 *
 * Manages isolated development environments using Git worktrees.
 * Each GitHub issue gets its own worktree for safe, parallel development.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface WorktreeConfig {
  rootDir: string;
  autoCleanup: boolean;
  defaultSyncStrategy: 'merge' | 'rebase';
  mainBranch: string;
  copyFiles: string[];
}

export interface WorktreeInfo {
  branch: string;
  path: string;
  issueId: number;
  createdAt: Date;
  status: 'active' | 'completed' | 'failed';
}

export class WorktreeManager {
  private config: WorktreeConfig;
  private activeWorktrees: Map<number, WorktreeInfo> = new Map();

  constructor(config: Partial<WorktreeConfig> = {}) {
    this.config = {
      rootDir: '.git/ai-worktrees',
      autoCleanup: true,
      defaultSyncStrategy: 'merge',
      mainBranch: 'main',
      copyFiles: ['.env.example', '.env.local', 'package-lock.json', 'yarn.lock'],
      ...config,
    };

    // Ensure worktree root directory exists
    if (!existsSync(this.config.rootDir)) {
      mkdirSync(this.config.rootDir, { recursive: true });
    }
  }

  /**
   * Create a new worktree for a GitHub issue
   */
  async createWorktree(issueId: number, issueTitle: string): Promise<WorktreeInfo> {
    const branchName = this.generateBranchName(issueId, issueTitle);
    const worktreePath = join(this.config.rootDir, `issue-${issueId}`);

    try {
      console.log(`Creating worktree for issue #${issueId}: ${branchName}`);

      // Create the worktree
      this.runGitCommand(['worktree', 'add', '-b', branchName, worktreePath]);

      const worktreeInfo: WorktreeInfo = {
        branch: branchName,
        path: worktreePath,
        issueId,
        createdAt: new Date(),
        status: 'active',
      };

      this.activeWorktrees.set(issueId, worktreeInfo);
      console.log(`✅ Worktree created: ${worktreePath}`);

      return worktreeInfo;
    } catch (error) {
      console.error(`❌ Failed to create worktree for issue #${issueId}:`, error);
      throw error;
    }
  }

  /**
   * Switch to a worktree (returns the path for cd command)
   */
  switchToWorktree(issueId: number): string {
    const worktree = this.activeWorktrees.get(issueId);
    if (!worktree) {
      throw new Error(`No active worktree found for issue #${issueId}`);
    }

    console.log(`Switching to worktree: ${worktree.path}`);
    return worktree.path;
  }

  /**
   * Complete a worktree and prepare for PR creation
   */
  completeWorktree(issueId: number): WorktreeInfo {
    const worktree = this.activeWorktrees.get(issueId);
    if (!worktree) {
      throw new Error(`No active worktree found for issue #${issueId}`);
    }

    console.log(`Completing worktree for issue #${issueId}`);
    worktree.status = 'completed';
    this.activeWorktrees.set(issueId, worktree);

    return worktree;
  }

  /**
   * Clean up a worktree
   */
  cleanupWorktree(issueId: number): void {
    const worktree = this.activeWorktrees.get(issueId);
    if (!worktree) {
      console.warn(`No worktree found for issue #${issueId} to clean up`);
      return;
    }

    try {
      console.log(`Cleaning up worktree: ${worktree.path}`);

      // Remove the worktree
      this.runGitCommand(['worktree', 'remove', worktree.path]);

      // Remove the branch
      this.runGitCommand(['branch', '-D', worktree.branch]);

      // Remove from active worktrees
      this.activeWorktrees.delete(issueId);

      console.log(`✅ Worktree cleaned up: ${worktree.path}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup worktree for issue #${issueId}:`, error);
      worktree.status = 'failed';
    }
  }

  /**
   * Get worktree status information
   */
  getWorktreeStatus(issueId: number): WorktreeInfo | null {
    return this.activeWorktrees.get(issueId) || null;
  }

  /**
   * List all active worktrees
   */
  listActiveWorktrees(): WorktreeInfo[] {
    return Array.from(this.activeWorktrees.values());
  }

  /**
   * Generate a safe branch name from issue ID and title
   */
  private generateBranchName(issueId: number, issueTitle: string): string {
    // Sanitize title for branch name
    const sanitizedTitle = issueTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 50) // Limit length
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    return `ai-fix/issue-${issueId}-${sanitizedTitle}`;
  }

  /**
   * Run a git command and return the result
   */
  private runGitCommand(args: string[]): string {
    try {
      const result = execSync(`git ${args.join(' ')}`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return result.trim();
    } catch (error: any) {
      const message = error.stderr || error.stdout || error.message;
      throw new Error(`Git command failed: git ${args.join(' ')}\n${message}`);
    }
  }

  /**
   * Check if git worktrees are supported
   */
  static isSupported(): boolean {
    try {
      execSync('git worktree --help', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}
