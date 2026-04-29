/**
 * Set to `true` while tuning transitions — scales durations/delays in dev (HMR picks it up).
 * Set back to `false` before shipping. Production builds always use multiplier 1.
 */
export const STORE_MOTION_DEBUG_SLOW = false;

/** How much slower when STORE_MOTION_DEBUG_SLOW is true (e.g. 20 ⇒ 0.48s → ~9.6s). */
export const STORE_MOTION_SLOW_MULTIPLIER = 20;

const mult =
  import.meta.env.DEV && STORE_MOTION_DEBUG_SLOW ? STORE_MOTION_SLOW_MULTIPLIER : 1;

export function scaledSeconds(seconds: number): number {
  return seconds * mult;
}
