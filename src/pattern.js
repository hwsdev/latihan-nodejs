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

/**
 * Returns the number of commits to make for a given date.
 *
 * Weekday weighted distribution:
 *   40% → 0 commits (rest day)
 *   30% → 1 commit  (light green)
 *   20% → 2–3 commits (medium green)
 *   10% → 4–6 commits (dark green)
 *
 * Weekend (Saturday=6, Sunday=0): all non-zero probabilities are halved;
 * the remaining probability mass is added to the 0-commit bucket.
 *
 * Holiday: always 0 commits regardless of other logic.
 *
 * @param {Date}    date          - The date to evaluate.
 * @param {boolean} isHolidayFlag - Caller signals whether the date is a holiday.
 * @returns {number} Integer in the range 0–6.
 */
export function getCommitCount(date, isHolidayFlag = false) {
  if (isHolidayFlag) {
    return 0;
  }

  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Base probabilities (as percentages summing to 100)
  // Buckets: [0-commits, 1-commit, 2-3-commits, 4-6-commits]
  let weights = [40, 30, 20, 10];

  if (isWeekend) {
    // Halve every non-zero bucket: 30→15, 20→10, 10→5
    const halved = weights.slice(1).map((w) => w / 2);
    const remainingMass = weights.slice(1).reduce((acc, w) => acc + w, 0);
    const addedToRest = remainingMass - halved.reduce((acc, w) => acc + w, 0);
    weights = [weights[0] + addedToRest, ...halved];
    // Result: [40+25, 15, 10, 5] = [65, 15, 10, 5]
  }

  const total = weights.reduce((acc, w) => acc + w, 0);
  const roll = Math.random() * total;

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) {
      if (i === 0) return 0;
      if (i === 1) return 1;
      if (i === 2) return randomInt(2, 3);
      if (i === 3) return randomInt(4, 6);
    }
  }

  // Fallback (should not be reached)
  return 0;
}

/**
 * Returns a random commit message string from the built-in pool.
 *
 * @returns {string}
 */
export function getRandomMessage() {
  return COMMIT_MESSAGES[Math.floor(Math.random() * COMMIT_MESSAGES.length)];
}
