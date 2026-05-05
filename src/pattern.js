/**
 * pattern.js
 * Commit intensity randomizer with weighted distribution.
 * Handles weekends (halved probabilities) and holidays (0 commits guard).
 */

const COMMIT_MESSAGES = [
  'Update documentation',
  'Fix typo in comments',
  'Refactor utility functions',
  'Add error handling',
  'Clean up unused imports',
  'Improve code readability',
  'Update dependencies',
  'Minor performance improvements',
  'Fix edge case',
  'Add input validation',
  'Remove dead code',
  'Simplify conditional logic',
  'Rename variables for clarity',
  'Add missing null checks',
  'Normalize whitespace',
  'Extract helper function',
  'Fix linting warnings',
  'Adjust default config values',
  'Catch and log unexpected errors',
  'Sync package-lock.json',
];

/**
 * Pick a random integer in the inclusive range [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MAX_COMMITS = 20;

/**
 * Returns the number of commits to make for a given date, capped at MAX_COMMITS.
 *
 * Weekday distribution:
 *   15% → 5–15   commits
 *   35% → 20–40  commits
 *   35% → 45–75  commits
 *   15% → 80–100 commits
 *
 * Weekend: lighter but still meaningful.
 *   30% → 3–8   commits
 *   45% → 10–25 commits
 *   25% → 30–50 commits
 *
 * Holiday: always 0 commits.
 *
 * @param {Date}    date
 * @param {boolean} isHolidayFlag
 * @returns {number}
 */
export function getCommitCount(date, isHolidayFlag = false) {
  if (isHolidayFlag) return 0;

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let count;
  if (isWeekend) {
    const roll = Math.random() * 100;
    if (roll < 30) count = randomInt(3, 8);
    else if (roll < 75) count = randomInt(10, 25);
    else count = randomInt(30, 50);
  } else {
    const roll = Math.random() * 100;
    if (roll < 15) count = randomInt(5, 15);
    else if (roll < 50) count = randomInt(20, 40);
    else if (roll < 85) count = randomInt(45, 75);
    else count = randomInt(80, 100);
  }

  return Math.min(count, MAX_COMMITS);
}

/**
 * Returns a random commit message string from the built-in pool.
 *
 * @returns {string}
 */
export function getRandomMessage() {
  return COMMIT_MESSAGES[Math.floor(Math.random() * COMMIT_MESSAGES.length)];
}
