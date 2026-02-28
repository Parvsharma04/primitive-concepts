import {
    IRateLimiter,
    RateLimiterOptions,
    RateLimiterResult,
} from "./fixed-window-counter";

/**
 * IMPLEMENTATION CHALLENGE: LEAKY BUCKET
 *
 * Concept:
 * - Think of a bucket with a small hole.
 * - Requests are added to the bucket (level increases).
 * - The bucket "leaks" (level decreases) at a constant rate over time.
 * - If the level + 1 exceeds capacity (maxRequests), the request is rejected.
 *
 * YOUR TASK:
 * 1. Store state (currentLevel, lastLeakTime) for each key.
 * 2. On each `allow(key)` call, calculate how much has "leaked" since the last call.
 * 3. Update the current level (but don't go below 0).
 * 4. Check if there is room in the bucket for 1 more request.
 */

export class LeakyBucket implements IRateLimiter {
  private readonly options: RateLimiterOptions;
  private readonly store: Map<string, { level: number; lastTime: number }> =
    new Map();

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async allow(key: string): Promise<RateLimiterResult> {
    const now = Date.now();
    const leakRate = this.options.maxRequests / this.options.windowSizeMs; // requests per ms
    
    let record = this.store.get(key) || { level: 0, lastTime: now };
    
    // 1. Calculate how much has leaked since last call
    const timeElapsed = now - record.lastTime;
    const leaked = timeElapsed * leakRate;
    
    // 2. Update current level (but don't go below 0)
    record.level = Math.max(0, record.level - leaked);
    record.lastTime = now;

    // 3. Check if we can add a request
    if (record.level + 1 <= this.options.maxRequests) {
      record.level++;
      this.store.set(key, record);
      
      return {
        allowed: true,
        remaining: Math.floor(this.options.maxRequests - record.level),
        resetTime: now + (record.level / leakRate), // Rough estimate: when bucket is empty
      };
    }

    // Rate limit exceeded
    this.store.set(key, record);
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + ((record.level + 1 - this.options.maxRequests) / leakRate),
    };
  }
}
