/**
 * Git Worktrees Manager for AI-Powered GitHub Issues Reviewer
 *
 * Manages isolated development environments using Git worktrees.
 * Each GitHub issue gets its own worktree for safe, parallel development.
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';

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

      // Copy necessary files
      await this.copyFilesToWorktree(worktreePath);

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
   * Sync worktree with main branch
   */
  syncWorktree(issueId: number, strategy?: 'merge' | 'rebase'): void {
    const worktree = this.activeWorktrees.get(issueId);
    if (!worktree) {
      throw new Error(`No active worktree found for issue #${issueId}`);
    }

    const syncStrategy = strategy || this.config.defaultSyncStrategy;
    console.log(`Syncing worktree ${worktree.branch} with ${syncStrategy} strategy`);

    // Switch to worktree directory and sync
    const originalCwd = process.cwd();
    try {
      process.chdir(worktree.path);

      // Fetch latest changes
      this.runGitCommand(['fetch', 'origin']);

      // Sync with main branch
      if (syncStrategy === 'rebase') {
        this.runGitCommand(['rebase', `origin/${this.config.mainBranch}`]);
      } else {
        this.runGitCommand(['merge', `origin/${this.config.mainBranch}`]);
      }

      console.log(`✅ Worktree ${worktree.branch} synced successfully`);
    } finally {
      process.chdir(originalCwd);
    }
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

    // Mark as completed
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
   * Clean up all completed/failed worktrees
   */
  cleanupCompletedWorktrees(): void {
    if (!this.config.autoCleanup) {
      return;
    }

    console.log('Cleaning up completed worktrees...');

    for (const [issueId, worktree] of this.activeWorktrees) {
      if (worktree.status === 'completed' || worktree.status === 'failed') {
        // Check if worktree is old enough to cleanup (e.g., 1 hour old)
        const age = Date.now() - worktree.createdAt.getTime();
        const oneHour = 60 * 60 * 1000;

        if (age > oneHour) {
          this.cleanupWorktree(issueId);
        }
      }
    }
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
   * Copy necessary files to new worktree
   */
  private async copyFilesToWorktree(worktreePath: string): Promise<void> {
    const originalCwd = process.cwd();

    try {
      process.chdir(worktreePath);

      for (const file of this.config.copyFiles) {
        const sourcePath = resolve(originalCwd, file);
        if (existsSync(sourcePath)) {
          // Use git to copy files (this preserves git tracking if needed)
          try {
            this.runGitCommand(['checkout', file]);
            console.log(`Copied ${file} to worktree`);
          } catch (error) {
            // File might not exist in this branch, skip
            console.log(`Skipping ${file} (not in branch)`);
          }
        }
      }
    } finally {
      process.chdir(originalCwd);
    }
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
