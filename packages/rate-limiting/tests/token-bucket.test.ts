import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenBucket } from '../src/token-bucket';

describe('TokenBucket', () => {
    const windowSizeMs = 1000; // 1 second
    const maxRequests = 10; // Refill rate = 10 tokens per second
    let limiter: TokenBucket;

    beforeEach(() => {
        limiter = new TokenBucket({ windowSizeMs, maxRequests });
        vi.useFakeTimers();
        vi.setSystemTime(0);
    });

    it('should allow requests within initial capacity', async () => {
        for (let i = 0; i < 10; i++) {
            const result = await limiter.allow('user1');
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(9 - i);
        }
    });

    it('should reject requests when bucket is empty', async () => {
        // Exhaust capacity
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        // Should take 100ms to get 1 token (10 tokens/sec = 1 token/100ms)
        expect(result.resetTime).toBe(100);
    });

    it('should refill tokens over time', async () => {
        // Exhaust capacity
        for (let i = 0; i < 10; i++) await limiter.allow('user1');

        // Wait 500ms -> should get 5 tokens
        vi.advanceTimersByTime(500);

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4); // 5 tokens refilled, 1 consumed
    });

    it('should not exceed maximum capacity', async () => {
        // Start with full bucket, wait a long time
        vi.advanceTimersByTime(10000);

        // Should still only have 10 tokens
        for (let i = 0; i < 10; i++) {
            const result = await limiter.allow('user1');
            expect(result.allowed).toBe(true);
        }

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(false);
    });

    it('should handle burst after partial refill', async () => {
        // Use 5 tokens
        for (let i = 0; i < 5; i++) await limiter.allow('user1');

        // Wait 200ms -> refill 2 tokens. Total = 5 (left) + 2 (refilled) = 7.
        vi.advanceTimersByTime(200);

        // Consume 7 tokens
        for (let i = 0; i < 7; i++) {
            const result = await limiter.allow('user1');
            expect(result.allowed).toBe(true);
        }

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(false);
    });
});
