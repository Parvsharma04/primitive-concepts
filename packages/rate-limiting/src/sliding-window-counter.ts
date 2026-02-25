import {
  IRateLimiter,
  RateLimiterOptions,
  RateLimiterResult,
} from "./fixed-window-counter";

/**
 * SLIDING WINDOW COUNTER
 *
 * Concept:
 * - This is a hybrid approach between Fixed Window and Sliding Window Log.
 * - It's more memory efficient than the Log because it doesn't store every timestamp.
 * - It's more accurate than Fixed Window because it accounts for the "overlap" between windows.
 *
 * Formula:
 * rollingCount = (count in current window) + (count in previous window * percentage of overlap)
 *
 * Example:
 * If window is 60s, and we are at 15s into the current window:
 * % of overlap with previous window = (60 - 15) / 60 = 0.75
 * Total Count = currentCount + (previousCount * 0.75)
 */

export class SlidingWindowCounter implements IRateLimiter {
  private readonly options: RateLimiterOptions;
  private readonly counters = new Map<
    string,
    { currentCount: number; previousCount: number; currentWindowId: number }
  >();

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async allow(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const windowSize = this.options.windowSizeMs;
    const currentWindowId = Math.floor(now / windowSize);
    const windowElapsedMs = now % windowSize;

    let record = this.counters.get(key) || {
      currentCount: 0,
      previousCount: 0,
      currentWindowId,
    };

    const gap = currentWindowId - record.currentWindowId;

    if (gap === 1) {
      record.previousCount = record.currentCount;
      record.currentCount = 0;
    } else if (gap > 1) {
      record.currentCount = 0;
      record.previousCount = 0;
    }

    record.currentWindowId = currentWindowId;

    const weight =
      (this.options.windowSizeMs - windowElapsedMs) / this.options.windowSizeMs;
    const weightCount = record.currentCount + record.previousCount * weight;

    if (weightCount < this.options.maxRequests) {
      record.currentCount += 1;
      this.counters.set(key, record);
      return Promise.resolve({
        allowed: true,
        remaining: Math.max(
          0,
          Math.floor(this.options.maxRequests - (weightCount + 1)),
        ),
        resetTime: (currentWindowId + 1) * this.options.windowSizeMs,
      });
    }

    this.counters.set(key, record);
    return Promise.resolve({
      allowed: false,
      remaining: 0,
      resetTime: (currentWindowId + 1) * this.options.windowSizeMs,
    });
  }
}
