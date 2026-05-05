/**
 * scheduler.js
 *
 * Sets up a node-cron scheduled job that drives daily commit activity.
 * Exported surface: startScheduler(config) -> cron.ScheduledTask
 */

import cron from 'node-cron';
import { createCommitter } from './committer.js';
import { isHoliday } from './holidays.js';
import { getCommitCount, getRandomMessage } from './pattern.js';

/**
 * Formats a Date as an ISO-8601 date string (YYYY-MM-DD) in local time.
 * @param {Date} date
 * @returns {string}
 */
function toLocalDateString(date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Runs the commit logic for a single day.
 *
 * @param {object} config
 * @param {string}  config.repoPath   - Absolute path to the git repository.
 * @param {string}  config.remote     - Git remote name (e.g. 'origin').
 * @param {string}  config.branch     - Git branch name (e.g. 'main').
 * @param {boolean} [config.dryRun]   - When true, no commits are actually made.
 * @param {string}  [config.userName] - Git author name override.
 * @param {string}  [config.userEmail]- Git author email override.
 */
async function runDailyCommits(config) {
  const now       = new Date();
  const dateStr   = toLocalDateString(now);
  const timestamp = now.toISOString();

  console.log(`[${timestamp}] Scheduler triggered for ${dateStr}`);

  try {
    if (isHoliday(now)) {
      console.log(`[${timestamp}] ${dateStr} is a holiday — skipping commits.`);
      return;
    }

    const count = getCommitCount(now);
    console.log(`[${timestamp}] Planned commit count for ${dateStr}: ${count}`);

    if (config.dryRun) {
      console.log(`[${timestamp}] Dry-run enabled — would make ${count} commit(s) on ${dateStr}.`);
      return;
    }

    if (count > 0) {
      const committer = createCommitter({
        repoPath:  config.repoPath,
        remote:    config.remote,
        branch:    config.branch,
        userName:  config.userName,
        userEmail: config.userEmail,
      });
      const messages = Array.from({ length: count }, () => getRandomMessage());
      await committer.makeCommits(now, count, messages, false);
    }

    console.log(`[${timestamp}] Successfully made ${count} commit(s) for ${dateStr}.`);
  } catch (err) {
    console.error(`[${timestamp}] Error during scheduled run for ${dateStr}:`, err);
  }
}

/**
 * Validates and starts the node-cron scheduler.
 *
 * @param {object} config
 * @param {string}  config.cronSchedule - A valid cron expression (e.g. '0 9 * * *').
 * @param {string}  config.repoPath     - Absolute path to the git repository.
 * @param {string}  [config.remote='origin'] - Git remote name.
 * @param {string}  [config.branch='main']   - Git branch name.
 * @param {boolean} [config.dryRun=false]    - When true, no commits are written.
 * @param {string}  [config.userName]        - Git author name override.
 * @param {string}  [config.userEmail]       - Git author email override.
 * @returns {import('node-cron').ScheduledTask} The running cron task.
 * @throws {Error} If the cron expression is invalid or repoPath is missing.
 */
export function startScheduler(config) {
  const {
    cronSchedule,
    repoPath,
    remote    = 'origin',
    branch    = 'main',
    dryRun    = false,
    userName,
    userEmail,
  } = config;

  if (!repoPath) {
    throw new Error('startScheduler: config.repoPath is required.');
  }

  if (!cronSchedule) {
    throw new Error('startScheduler: config.cronSchedule is required.');
  }

  if (!cron.validate(cronSchedule)) {
    throw new Error(`startScheduler: invalid cron expression "${cronSchedule}".`);
  }

  const taskConfig = { repoPath, remote, branch, dryRun, userName, userEmail };

  console.log(
    `[${new Date().toISOString()}] Scheduler starting — expression: "${cronSchedule}" ` +
    `| repo: ${repoPath} | remote: ${remote}/${branch} | dryRun: ${dryRun}`
  );

  const task = cron.schedule(cronSchedule, () => runDailyCommits(taskConfig), {
    scheduled: true,
    timezone:  'UTC',
  });

  return task;
}
