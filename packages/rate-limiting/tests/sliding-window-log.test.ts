import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlidingWindowLog } from '../src/sliding-window-log';

describe('SlidingWindowLog', () => {
    const windowSizeMs = 1000; // 1 second
    const maxRequests = 3;
    let limiter: SlidingWindowLog;

    beforeEach(() => {
        limiter = new SlidingWindowLog({ windowSizeMs, maxRequests });
        vi.useFakeTimers();
    });

    it('should allow requests within the limit', async () => {
        for (let i = 0; i < maxRequests; i++) {
            const result = await limiter.allow('user1');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(maxRequests - i - 1);
        }
    });

    it('should reject requests exceeding the limit', async () => {
        for (let i = 0; i < maxRequests; i++) {
            await limiter.allow('user1');
        }
        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(false);
    });

    it('should only count requests within the current window', async () => {
        // 3 requests at t=0
        await limiter.allow('user1');
        await limiter.allow('user1');
        await limiter.allow('user1');

        // Move forward 600ms (still within the 1000ms window)
        vi.advanceTimersByTime(600);
        expect((await limiter.allow('user1')).allowed).toBe(false);

        // Move forward another 500ms (Total 1100ms. The first 3 requests are now outside the window!)
        vi.advanceTimersByTime(500);
        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(maxRequests - 1);
    });
});
