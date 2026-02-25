import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlidingWindowCounter } from '../src/sliding-window-counter';

describe('SlidingWindowCounter', () => {
    const windowSizeMs = 1000; // 1 second
    const maxRequests = 10;
    let limiter: SlidingWindowCounter;

    beforeEach(() => {
        limiter = new SlidingWindowCounter({ windowSizeMs, maxRequests });
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    it('should allow requests within the limit', async () => {
        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
    });

    it('should estimate count based on overlap', async () => {
        // Fill previous window with 10 requests at t=0
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        // Move to next window (t=1500)
        // 50% of previous window is still "rolling" in
        // Count = 0 (current) + 10 (prev) * 0.5 = 5
        vi.advanceTimersByTime(1500);

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(true);
        // 1 already taken in current window, 5 estimated from previous
        // Total estimated = 6. Remaining = 10 - 6 = 4.
        expect(result.remaining).toBe(4);
    });

    it('should reject when estimated count exceeds limit', async () => {
        // 10 requests in previous window
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        // Move to t=1100 (90% of previous window overlaps)
        // Estimated = 0 + 10 * 0.9 = 9
        vi.advanceTimersByTime(1100);

        await limiter.allow('user1'); // Takes currentCount to 1. Estimated = 1 + 9 = 10.

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(false);
    });
});
