import {
    IRateLimiter,
    RateLimiterOptions,
    RateLimiterResult,
} from "./fixed-window-counter";

/**
 * SLIDING WINDOW LOG
 *
 * Concept:
 * - Instead of a single counter, we store a sorted list of timestamps for each user.
 * - Every time a request comes in:
 *   1. Filter out (remove) all timestamps that are older than (now - windowSize).
 *   2. Count how many timestamps are left.
 *   3. If count < limit, allow the request and add 'now' to the list.
 *
 * Pros:
 * - 100% accurate. No boundary problem!
 *
 * Cons:
 * - Memory Intensive: Storing every single timestamp can be expensive for high-traffic APIs.
 */

export class SlidingWindowLog implements IRateLimiter {
  private readonly options: RateLimiterOptions;
  private readonly logs = new Map<string, number[]>();

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async allow(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const windowStart = now - this.options.windowSizeMs;

    let timestamps = this.logs.get(key) || [];

    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length < this.options.maxRequests) {
      timestamps.push(now);
      this.logs.set(key, timestamps);
      return Promise.resolve({
        allowed: true,
        remaining: this.options.maxRequests - timestamps.length,
        resetTime: timestamps[0] + this.options.windowSizeMs,
      });
    }

    return Promise.resolve({
      allowed: false,
      remaining: 0,
      resetTime: timestamps[0] + this.options.windowSizeMs,
    });
  }
}
