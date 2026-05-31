/**
 * SyncReminder - Tracks last sync and reminds users to push/pull
 *
 * Features:
 * - Tracks last pull and push times
 * - Shows reminder after configurable days
 * - Provides exact commands to run
 * - Can execute sync via MCP tool
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SyncReminder {
  constructor(repoPath = null) {
    this.repoPath = repoPath || join(__dirname, '..', '..');
    this.stateFile = join(this.repoPath, 'data', 'sync-state.json');
    this.reminderDays = 7; // Remind after 7 days
    this.state = this._loadState();
  }

  _loadState() {
    const defaults = {
      lastPull: null,
      lastPush: null,
      lastReminder: null,
      installDate: new Date().toISOString(),
      dismissedUntil: null,
      syncHistory: [],
    };

    try {
      if (existsSync(this.stateFile)) {
        const data = JSON.parse(readFileSync(this.stateFile, 'utf8'));
        return { ...defaults, ...data };
      }
    } catch (e) {
      console.error('Error loading sync state:', e.message);
    }

    // First run - save initial state
    this._saveState(defaults);
    return defaults;
  }

  _saveState(state = this.state) {
    try {
      const dir = dirname(this.stateFile);
      if (!existsSync(dir)) {
        const { mkdirSync } = require('fs');
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error('Error saving sync state:', e.message);
    }
  }

  /**
   * Check if user should be reminded to sync
   */
  shouldRemind() {
    const now = new Date();

    // Check if dismissed
    if (this.state.dismissedUntil) {
      const dismissedUntil = new Date(this.state.dismissedUntil);
      if (now < dismissedUntil) {
        return { remind: false, reason: 'dismissed' };
      }
    }

    // Calculate days since last activity
    const lastPull = this.state.lastPull ? new Date(this.state.lastPull) : null;
    const lastPush = this.state.lastPush ? new Date(this.state.lastPush) : null;
    const installDate = new Date(this.state.installDate);

    const daysSincePull = lastPull
      ? Math.floor((now - lastPull) / (1000 * 60 * 60 * 24))
      : Math.floor((now - installDate) / (1000 * 60 * 60 * 24));

    const daysSincePush = lastPush
      ? Math.floor((now - lastPush) / (1000 * 60 * 60 * 24))
      : Math.floor((now - installDate) / (1000 * 60 * 60 * 24));

    // Check for local changes
    const hasLocalChanges = this._hasLocalChanges();

    // Check for remote changes
    const hasRemoteChanges = this._hasRemoteChanges();

    if (daysSincePull >= this.reminderDays || daysSincePush >= this.reminderDays) {
      return {
        remind: true,
        daysSincePull,
        daysSincePush,
        hasLocalChanges,
        hasRemoteChanges,
        neverPulled: !lastPull,
        neverPushed: !lastPush,
      };
    }

    return { remind: false, daysSincePull, daysSincePush };
  }

  /**
   * Check if there are uncommitted local changes
   */
  _hasLocalChanges() {
    try {
      const result = execSync('git status --porcelain', {
        cwd: this.repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return result.trim().length > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if remote has changes we don't have
   */
  _hasRemoteChanges() {
    try {
      // Fetch without merging
      execSync('git fetch origin main', {
        cwd: this.repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Check if we're behind
      const result = execSync('git rev-list HEAD..origin/main --count', {
        cwd: this.repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return parseInt(result.trim()) > 0;
    } catch (e) {
      return false; // Can't check, assume no changes
    }
  }

  /**
   * Get the reminder message with instructions
   */
  getReminderMessage() {
    const status = this.shouldRemind();

    if (!status.remind) {
      return null;
    }

    let message = `\n${'═'.repeat(60)}\n`;
    message += `🔔 SYNC REMINDER - mendix-expert MCP Server\n`;
    message += `${'═'.repeat(60)}\n\n`;

    if (status.neverPulled) {
      message += `📥 You've never pulled updates from GitHub!\n`;
      message += `   There might be improvements waiting for you.\n\n`;
    } else {
      message += `📅 It's been ${status.daysSincePull} days since your last pull.\n`;
    }

    if (status.hasLocalChanges) {
      message += `📝 You have LOCAL CHANGES that aren't backed up to GitHub!\n\n`;
    }

    if (status.hasRemoteChanges) {
      message += `🆕 There are NEW UPDATES available on GitHub!\n\n`;
    }

    message += `${'─'.repeat(60)}\n`;
    message += `📋 RECOMMENDED ACTIONS:\n`;
    message += `${'─'.repeat(60)}\n\n`;

    if (status.hasRemoteChanges || status.daysSincePull >= this.reminderDays) {
      message += `1️⃣  GET UPDATES (pull from GitHub):\n`;
      message += `    cd "${this.repoPath}"\n`;
      message += `    git pull\n\n`;
    }

    if (status.hasLocalChanges) {
      message += `2️⃣  BACKUP YOUR CHANGES (push to GitHub):\n`;
      message += `    cd "${this.repoPath}"\n`;
      message += `    git add -A\n`;
      message += `    git commit -m "Sync: Local updates $(Get-Date -Format 'yyyy-MM-dd')"\n`;
      message += `    git push\n\n`;
    }

    message += `${'─'.repeat(60)}\n`;
    message += `💡 Or use the MCP tool: "sync my mendix-expert server"\n`;
    message += `${'─'.repeat(60)}\n\n`;

    message += `[Dismiss for 7 days] [Dismiss for 30 days] [Sync Now]\n`;

    return message;
  }

  /**
   * Get structured reminder data for MCP resource
   */
  getReminderData() {
    const status = this.shouldRemind();

    return {
      shouldRemind: status.remind,
      status: {
        daysSincePull: status.daysSincePull || 0,
        daysSincePush: status.daysSincePush || 0,
        hasLocalChanges: status.hasLocalChanges || false,
        hasRemoteChanges: status.hasRemoteChanges || false,
        neverPulled: status.neverPulled || false,
        neverPushed: status.neverPushed || false,
      },
      lastSync: {
        pull: this.state.lastPull,
        push: this.state.lastPush,
      },
      commands: {
        pull: `cd "${this.repoPath}" && git pull`,
        push: `cd "${this.repoPath}" && git add -A && git commit -m "Sync update" && git push`,
        status: `cd "${this.repoPath}" && git status`,
      },
      repoPath: this.repoPath,
      repoUrl: 'https://github.com/jordnlvr/mendix-mcp-server',
    };
  }

  /**
   * Execute a sync operation
   */
  async executeSync(operation = 'both') {
    const results = {
      success: true,
      operations: [],
      errors: [],
    };

    try {
      if (operation === 'pull' || operation === 'both') {
        // Pull from remote
        try {
          const pullResult = execSync('git pull', {
            cwd: this.repoPath,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });
          results.operations.push({
            operation: 'pull',
            success: true,
            output: pullResult.trim(),
          });
          this.state.lastPull = new Date().toISOString();
        } catch (e) {
          results.operations.push({
            operation: 'pull',
            success: false,
            error: e.message,
          });
          results.errors.push(`Pull failed: ${e.message}`);
        }
      }

      if (operation === 'push' || operation === 'both') {
        // Check if there are changes to push
        if (this._hasLocalChanges()) {
          try {
            // Stage all changes
            execSync('git add -A', {
              cwd: this.repoPath,
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe'],
            });

            // Commit
            const date = new Date().toISOString().split('T')[0];
            execSync(`git commit -m "Sync: Auto-update ${date}"`, {
              cwd: this.repoPath,
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe'],
            });

            // Push
            const pushResult = execSync('git push', {
              cwd: this.repoPath,
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe'],
            });

            results.operations.push({
              operation: 'push',
              success: true,
              output: pushResult.trim(),
            });
            this.state.lastPush = new Date().toISOString();
          } catch (e) {
            results.operations.push({
              operation: 'push',
              success: false,
              error: e.message,
            });
            results.errors.push(`Push failed: ${e.message}`);
          }
        } else {
          results.operations.push({
            operation: 'push',
            success: true,
            output: 'No local changes to push',
          });
        }
      }

      // Record sync in history
      this.state.syncHistory.push({
        date: new Date().toISOString(),
        operation,
        success: results.errors.length === 0,
      });

      // Keep only last 50 syncs
      if (this.state.syncHistory.length > 50) {
        this.state.syncHistory = this.state.syncHistory.slice(-50);
      }

      this._saveState();
    } catch (e) {
      results.success = false;
      results.errors.push(e.message);
    }

    results.success = results.errors.length === 0;
    return results;
  }

  /**
   * Dismiss reminder for specified days
   */
  dismissReminder(days = 7) {
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + days);
    this.state.dismissedUntil = dismissUntil.toISOString();
    this._saveState();
    return { dismissed: true, until: this.state.dismissedUntil };
  }

  /**
   * Record that a pull was done (call this after manual pull)
   */
  recordPull() {
    this.state.lastPull = new Date().toISOString();
    this._saveState();
  }

  /**
   * Record that a push was done (call this after manual push)
   */
  recordPush() {
    this.state.lastPush = new Date().toISOString();
    this._saveState();
  }
}

export default SyncReminder;
