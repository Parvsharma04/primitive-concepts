/**
 * Fixed Window Counter Rate Limiter
 *
 * Concept:
 * - Divide time into fixed-size windows (e.g., 1 minute).
 * - Each window has a counter.
 * - If the counter exceeds the limit, requests are rejected.
 * - When the window expires, the counter resets.
 *
 * Pros:
 * - Extremely simple to implement.
 * - Low memory footprint (only 1 counter per user/key).
 *
 * Cons:
 * - "Boundary Problem": Double the limit can be allowed at the edge of two windows.
 *   (e.g., limit is 10/min. 10 requests at 00:59, 10 requests at 01:01.
 *   Total 20 requests in 2 seconds).
 */

export interface RateLimiterOptions {
  windowSizeMs: number;
  maxRequests: number;
}

export interface RateLimiterResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Timestamp when the current window expires
}

export interface IRateLimiter {
  allow(key: string): Promise<RateLimiterResult>;
}

/**
 * IMPLEMENTATION CHALLENGE:
 *
 * Now it's your turn! Create a class `FixedWindowCounter` that implements `IRateLimiter`.
 *
 * Considerations:
 * 1. How will you store the counters? (In-memory Map)
 * 2. How will you calculate which window the current request belongs to?
 *    Hint: windowId = Math.floor(Date.now() / windowSize)
 * 3. How will you handle cleanup of old windows?
 */

export class FixedWindowCounter implements IRateLimiter {
  private map: Map<string, { count: number; windowId: number }> = new Map();
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  allow(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const windowId = Math.floor(now / this.options.windowSizeMs); // will remain same for the duration of the window
    const resetTime = (windowId + 1) * this.options.windowSizeMs; // end of current window

    const record = this.map.get(key);

    if (!record) {
      this.map.set(key, { count: 1, windowId });

      return Promise.resolve({
        allowed: true,
        remaining: this.options.maxRequests - 1,
        resetTime,
      });
    }

    // CASE 2: New window → reset
    if (record.windowId !== windowId) {
      this.map.set(key, { count: 1, windowId });

      return Promise.resolve({
        allowed: true,
        remaining: this.options.maxRequests - 1,
        resetTime,
      });
    }

    // CASE 3: Same window
    if (record.count < this.options.maxRequests) {
      record.count++;
      this.map.set(key, record);

      return Promise.resolve({
        allowed: true,
        remaining: this.options.maxRequests - record.count,
        resetTime,
      });
    }

    // LIMIT EXCEEDED
    return Promise.resolve({
      allowed: false,
      remaining: 0,
      resetTime,
    });
  }
}
