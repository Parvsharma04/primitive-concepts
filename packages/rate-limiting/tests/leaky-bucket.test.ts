import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeakyBucket } from '../src/leaky-bucket';

describe('LeakyBucket', () => {
    const windowSizeMs = 1000; // 1 second
    const maxRequests = 10; // Rate = 10 requests per second
    let limiter: LeakyBucket;

    beforeEach(() => {
        limiter = new LeakyBucket({ windowSizeMs, maxRequests });
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    it('should allow requests up to capacity', async () => {
        for (let i = 0; i < 10; i++) {
            const result = await limiter.allow('user1');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(9 - i);
        }
    });

    it('should reject requests when bucket is full', async () => {
        // Fill the bucket
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        // Next leak in 100ms
        expect(result.resetTime).toBe(100);
    });

    it('should leak over time to allow new requests', async () => {
        // Fill the bucket
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        // Wait 500ms -> 5 requests should leak
        vi.advanceTimersByTime(500);

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it('should maintain a constant rate and reject sustained bursts', async () => {
        // Fill bucket
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        // At t=100ms, 1 request should have leaked
        vi.advanceTimersByTime(100);
        expect((await limiter.allow('user1')).allowed).toBe(true);

        // Immediately try another -> should fail because bucket only leaked 1
        expect((await limiter.allow('user1')).allowed).toBe(false);
    });
});
