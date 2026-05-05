/**
 * index.js — Entry point for github-greener.
 *
 * Usage:
 *   node src/index.js                    # Start cron scheduler
 *   node src/index.js --dry-run          # Log what would happen, make no commits
 *   node src/index.js --backfill         # Back-fill commits between BACKFILL_START and BACKFILL_END
 *   node src/index.js --backfill --dry-run
 */

import 'dotenv/config';
import { eachDayOfInterval, parseISO } from 'date-fns';
import { createCommitter } from './committer.js';
import { isHoliday }      from './holidays.js';
import { getCommitCount, getRandomMessage } from './pattern.js';
import { startScheduler }  from './scheduler.js';

// ---------------------------------------------------------------------------
// Config from environment
// ---------------------------------------------------------------------------

const REPO_PATH      = process.env.REPO_PATH;
const GIT_REMOTE     = process.env.GIT_REMOTE     || 'origin';
const GIT_BRANCH     = process.env.GIT_BRANCH     || 'main';
const CRON_SCHEDULE  = process.env.CRON_SCHEDULE  || '0 9 * * *';
const BACKFILL_START = process.env.BACKFILL_START;
const BACKFILL_END   = process.env.BACKFILL_END;
const GIT_USER_NAME  = process.env.GIT_USER_NAME;
const GIT_USER_EMAIL = process.env.GIT_USER_EMAIL;

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

const args     = process.argv.slice(2);
const isDryRun  = args.includes('--dry-run');
const isBackfill = args.includes('--backfill');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a YYYY-MM-DD string for a Date in local time.
 * @param {Date} date
 * @returns {string}
 */
function toDateString(date) {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates required configuration and throws a descriptive error when missing.
 * @throws {Error}
 */
function assertRepoPath() {
  if (!REPO_PATH) {
    throw new Error(
      'REPO_PATH environment variable is required. ' +
      'Set it in your .env file or export it before running.'
    );
  }
}

// ---------------------------------------------------------------------------
// Back-fill mode
// ---------------------------------------------------------------------------

/**
 * Iterates every day in [startDate, endDate] and runs the commit logic for
 * each, respecting holiday checks and dryRun mode.
 *
 * @param {Date}    startDate
 * @param {Date}    endDate
 * @param {boolean} dryRun
 */
async function runBackfill(startDate, endDate, dryRun) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  console.log(
    `[${new Date().toISOString()}] Back-fill: ${days.length} day(s) ` +
    `from ${toDateString(startDate)} to ${toDateString(endDate)}` +
    (dryRun ? ' [DRY RUN]' : '')
  );

  const committer = dryRun ? null : createCommitter({
    repoPath:  REPO_PATH,
    remote:    GIT_REMOTE,
    branch:    GIT_BRANCH,
    userName:  GIT_USER_NAME,
    userEmail: GIT_USER_EMAIL,
  });

  for (const day of days) {
    const dateStr   = toDateString(day);
    const timestamp = new Date().toISOString();

    try {
      if (isHoliday(day)) {
        console.log(`[${timestamp}] ${dateStr} — holiday, skipping.`);
        continue;
      }

      const count = getCommitCount(day);

      if (dryRun) {
        console.log(`[${timestamp}] ${dateStr} — would make ${count} commit(s). [DRY RUN]`);
        continue;
      }

      console.log(`[${timestamp}] ${dateStr} — making ${count} commit(s)…`);

      if (count > 0) {
        const messages = Array.from({ length: count }, () => getRandomMessage());
        await committer.makeCommits(day, count, messages, false);
      }

      console.log(`[${timestamp}] ${dateStr} — done (${count} commit(s)).`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${dateStr} — error:`, err);
    }
  }

  console.log(`[${new Date().toISOString()}] Back-fill complete.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (isBackfill) {
    assertRepoPath();

    if (!BACKFILL_START) {
      throw new Error(
        'BACKFILL_START environment variable is required for back-fill mode (YYYY-MM-DD).'
      );
    }

    const startDate = parseISO(BACKFILL_START);
    const endDate   = BACKFILL_END ? parseISO(BACKFILL_END) : new Date();

    if (isNaN(startDate.getTime())) {
      throw new Error(`BACKFILL_START is not a valid date: "${BACKFILL_START}"`);
    }
    if (isNaN(endDate.getTime())) {
      throw new Error(`BACKFILL_END is not a valid date: "${BACKFILL_END}"`);
    }
    if (startDate > endDate) {
      throw new Error('BACKFILL_START must be before or equal to BACKFILL_END.');
    }

    await runBackfill(startDate, endDate, isDryRun);
    return;
  }

  // Scheduler mode (default)
  assertRepoPath();

  if (isDryRun) {
    console.log(
      `[${new Date().toISOString()}] Dry-run mode: scheduler will log but not commit.`
    );
  }

  const task = startScheduler({
    cronSchedule: CRON_SCHEDULE,
    repoPath:     REPO_PATH,
    remote:       GIT_REMOTE,
    branch:       GIT_BRANCH,
    dryRun:       isDryRun,
    userName:     GIT_USER_NAME,
    userEmail:    GIT_USER_EMAIL,
  });

  // Graceful shutdown on SIGINT (Ctrl-C) and SIGTERM (container stop / kill).
  const shutdown = (signal) => {
    console.log(
      `\n[${new Date().toISOString()}] Received ${signal} — stopping scheduler…`
    );
    task.stop();
    console.log(`[${new Date().toISOString()}] Scheduler stopped. Exiting.`);
    process.exit(0);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log(
    `[${new Date().toISOString()}] github-greener running. ` +
    `Press Ctrl-C to stop.`
  );
}

main().catch((err) => {
  console.error(`[${new Date().toISOString()}] Fatal error:`, err);
  process.exit(1);
});
