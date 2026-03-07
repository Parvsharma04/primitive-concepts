import {
    IRateLimiter,
    RateLimiterOptions,
    RateLimiterResult,
} from "./fixed-window-counter";

/**
 * IMPLEMENTATION CHALLENGE: TOKEN BUCKET
 *
 * Concept:
 * - A "bucket" holds tokens. Each request consumes 1.
 * - Tokens refill at a fixed rate: (Time Elapsed * Refill Rate).
 * - Maximum capacity limits total burst size.
 *
 * YOUR TASK:
 * 1. Store the state (tokens, lastRefillTime) for each key.
 * 2. On each `allow(key)` call, calculate how many tokens have been refilled since the last call.
 * 3. Update the token count (but don't exceed the bucket's max requests).
 * 4. Check if at least 1 token is available.
 */

export class TokenBucket implements IRateLimiter {
    private readonly options: RateLimiterOptions;
    private readonly store: Map<string, { tokens: number, lastRefillTime: number }> = new Map();

    constructor(options: RateLimiterOptions) {
        this.options = options;
    }

    async allow(key: string): Promise<RateLimiterResult> {
        const now = Date.now();

        const val = this.store.get(key) || {
            tokens: this.options.maxRequests,
            lastRefillTime: now
        };

        const refillRate = this.options.maxRequests / this.options.windowSizeMs;
        const elapsed = now - val.lastRefillTime;

        const tokensToAdd = elapsed * refillRate;

        const updatedTokens = Math.min(
            val.tokens + tokensToAdd,
            this.options.maxRequests
        );

        val.tokens = updatedTokens;

        if (val.tokens >= 1) {
            val.tokens -= 1;
            val.lastRefillTime = now;

            this.store.set(key, val);

            return {
                allowed: true,
                remaining: Math.floor(val.tokens),
                resetTime: 0
            };
        }

        val.lastRefillTime = now;
        this.store.set(key, val);

        return {
            allowed: false,
            remaining: 0,
            resetTime: Math.ceil((1 - val.tokens) / refillRate)
        };
    }
}
