import { simpleGit } from 'simple-git';
import { format } from 'date-fns';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Initializes a simple-git instance for the given repo path.
 * @param {string} repoPath - Absolute path to the git repository.
 * @returns {import('simple-git').SimpleGit}
 */
export async function initRepo(repoPath) {
  const git = simpleGit(repoPath);

  const isRepo = await git.checkIsRepo().catch(() => false);
  if (!isRepo) {
    throw new Error(`Path is not a git repository: ${repoPath}`);
  }

  return git;
}

/**
 * Creates a configured git committer bound to the provided config.
 * @param {{ repoPath: string, remote: string, branch: string, userName?: string, userEmail?: string }} config
 */
export function createCommitter(config) {
  const { repoPath, remote, branch, userName, userEmail } = config;

  if (!repoPath) throw new Error('config.repoPath is required');
  if (!remote)   throw new Error('config.remote is required');
  if (!branch)   throw new Error('config.branch is required');

  let git;

  async function getGit() {
    if (!git) {
      git = simpleGit(repoPath);

      const isRepo = await git.checkIsRepo().catch(() => false);
      if (!isRepo) {
        throw new Error(`Path is not a git repository: ${repoPath}`);
      }

      if (userName) {
        await git.addConfig('user.name', userName);
      }
      if (userEmail) {
        await git.addConfig('user.email', userEmail);
      }
    }
    return git;
  }

  /**
   * Checks whether commits already exist in the log for the given date (YYYY-MM-DD).
   * @param {import('simple-git').SimpleGit} g
   * @param {Date} date
   * @returns {Promise<boolean>}
   */
  async function commitsExistForDate(g, date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    try {
      const log = await g.log([
        `--after=${dateStr}T00:00:00`,
        `--before=${dateStr}T23:59:59`,
        '--oneline',
      ]);
      return log.total > 0;
    } catch {
      return false;
    }
  }

  /**
   * Writes the activity log file with commit progress text.
   * @param {string} isoDate
   * @param {number} commitIndex  1-based index of the current commit
   * @param {number} total        total commits planned for this date
   */
  async function writeActivityLog(isoDate, commitIndex, total) {
    const logPath = join(repoPath, 'activity.log');
    const line = `[${isoDate}] commit ${commitIndex} of ${total}\n`;
    await writeFile(logPath, line, 'utf8');
  }

  /**
   * Returns the ISO-8601 datetime string for noon (12:00:00) on the given date
   * in a format accepted by GIT_AUTHOR_DATE / GIT_COMMITTER_DATE.
   * @param {Date} date
   * @returns {string}  e.g. "2024-03-15T12:00:00+0000"
   */
  function noonDateEnv(date) {
    const datePart = format(date, 'yyyy-MM-dd');
    return `${datePart}T12:00:00+0000`;
  }

  /**
   * Makes `count` commits backdated to `date`.
   *
   * @param {Date}     date      The target date for the commits.
   * @param {number}   count     Number of commits to create (0 = no-op).
   * @param {string[]} messages  Commit messages; cycles if fewer than count.
   * @param {boolean}  dryRun   When true, logs intent but skips git/push operations.
   * @returns {Promise<{ committed: number, date?: string, skipped?: boolean }>}
   */
  async function makeCommits(date, count, messages, dryRun = false) {
    if (count === 0) {
      return { committed: 0 };
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('date must be a valid Date object');
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages must be a non-empty array of strings');
    }

    const g = await getGit();
    const isoDate = date.toISOString();
    const dateLabel = format(date, 'yyyy-MM-dd');

    // Idempotency check — skip if commits for this date already exist.
    const alreadyCommitted = await commitsExistForDate(g, date);
    if (alreadyCommitted) {
      console.log(`[committer] Commits already exist for ${dateLabel}. Skipping.`);
      return { committed: 0, skipped: true };
    }

    if (dryRun) {
      console.log(`[committer] DRY RUN — would make ${count} commit(s) for ${dateLabel}:`);
      for (let i = 1; i <= count; i++) {
        const msg = messages[(i - 1) % messages.length];
        console.log(`  [${i}/${count}] "${msg}"`);
      }
      console.log(`[committer] DRY RUN — would push to ${remote}/${branch}`);
      return { committed: count, date: isoDate };
    }

    const gitDateEnv = noonDateEnv(date);

    try {
      for (let i = 1; i <= count; i++) {
        const message = messages[(i - 1) % messages.length];

        await writeActivityLog(isoDate, i, count);

        await g.raw(['add', '-f', 'activity.log']);

        await g.env({
          GIT_AUTHOR_DATE:    gitDateEnv,
          GIT_COMMITTER_DATE: gitDateEnv,
        }).commit(message);

        console.log(`[committer] Committed (${i}/${count}): "${message}" for ${dateLabel}`);
      }
    } catch (err) {
      throw new Error(`Failed to create commits for ${dateLabel}: ${err.message}`);
    }

    try {
      await g.push(remote, branch);
      console.log(`[committer] Pushed ${count} commit(s) to ${remote}/${branch}`);
    } catch (err) {
      throw new Error(`Failed to push to ${remote}/${branch}: ${err.message}`);
    }

    return { committed: count, date: isoDate };
  }

  return { makeCommits };
}

/**
 * Convenience named export so callers can destructure from the module directly
 * after constructing a committer via createCommitter().
 *
 * Typical usage:
 *   import { createCommitter, initRepo } from './committer.js';
 *   const { makeCommits } = createCommitter(config);
 *   await makeCommits(new Date('2024-01-15'), 3, ['chore: activity'], false);
 */
export { createCommitter as default };
