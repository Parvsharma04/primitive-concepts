import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FixedWindowCounter } from '../src/fixed-window-counter';

describe('FixedWindowCounter', () => {
    const windowSizeMs = 1000; // 1 second
    const maxRequests = 5;
    let limiter: FixedWindowCounter;

    beforeEach(() => {
        limiter = new FixedWindowCounter({ windowSizeMs, maxRequests });
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
        expect(result.remaining).toBe(0);
    });

    it('should reset after the window expires', async () => {
        for (let i = 0; i < maxRequests; i++) {
          await limiter.allow('user1');
        }

        vi.advanceTimersByTime(windowSizeMs + 1);

        const result = await limiter.allow('user1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(maxRequests - 1);
    });
});
