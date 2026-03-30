import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RetryWithBackoff } from '../src/retry-with-backoff';

describe('RetryWithBackoff', () => {
    let retrier: RetryWithBackoff;

    beforeEach(() => {
        retrier = new RetryWithBackoff({
            maxRetries: 3,
            baseDelayMs: 100,
            maxDelayMs: 2000,
            jitter: false,
        });
        vi.useFakeTimers();
    });

    // --- Delay Calculation ---

    it('should calculate exponential delay correctly', () => {
        // attempt 0 → 100 * 2^0 = 100
        expect(retrier.calculateDelay(0)).toBe(100);
        // attempt 1 → 100 * 2^1 = 200
        expect(retrier.calculateDelay(1)).toBe(200);
        // attempt 2 → 100 * 2^2 = 400
        expect(retrier.calculateDelay(2)).toBe(400);
        // attempt 3 → 100 * 2^3 = 800
        expect(retrier.calculateDelay(3)).toBe(800);
    });

    it('should cap delay at maxDelayMs', () => {
        // attempt 5 → 100 * 2^5 = 3200, but capped at 2000
        expect(retrier.calculateDelay(5)).toBe(2000);
    });

    it('should apply jitter when enabled', () => {
        const jitterRetrier = new RetryWithBackoff({
            maxRetries: 3,
            baseDelayMs: 100,
            maxDelayMs: 2000,
            jitter: true,
        });

        // Mock Math.random to return 0.5
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        // attempt 2 → min(100 * 4, 2000) = 400 → 400 * 0.5 = 200
        expect(jitterRetrier.calculateDelay(2)).toBe(200);

        vi.restoreAllMocks();
    });

    // --- Successful Execution ---

    it('should return result on first try if action succeeds', async () => {
        const action = vi.fn().mockResolvedValue('ok');

        const result = await retrier.execute(action);

        expect(result).toBe('ok');
        expect(action).toHaveBeenCalledTimes(1);
    });

    // --- Retry on Failure ---

    it('should retry on failure and succeed on a later attempt', async () => {
        const action = vi.fn()
            .mockRejectedValueOnce(new Error('fail 1'))
            .mockRejectedValueOnce(new Error('fail 2'))
            .mockResolvedValue('recovered');

        const executePromise = retrier.execute(action);

        // Advance past retry delay for attempt 0 (100ms)
        await vi.advanceTimersByTimeAsync(100);
        // Advance past retry delay for attempt 1 (200ms)
        await vi.advanceTimersByTimeAsync(200);

        const result = await executePromise;
        expect(result).toBe('recovered');
        expect(action).toHaveBeenCalledTimes(3);
    });

    it('should throw the last error after all retries are exhausted', async () => {
        // Use real timers for this test to avoid unhandled rejection from fake timer scheduling
        vi.useRealTimers();

        const shortRetrier = new RetryWithBackoff({
            maxRetries: 3,
            baseDelayMs: 10,
            maxDelayMs: 100,
            jitter: false,
        });

        const action = vi.fn().mockRejectedValue(new Error('persistent failure'));

        await expect(shortRetrier.execute(action)).rejects.toThrow('persistent failure');
        // 1 initial + 3 retries = 4 total calls
        expect(action).toHaveBeenCalledTimes(4);

        vi.useFakeTimers();
    });

    // --- onRetry Callback ---

    it('should call onRetry callback before each retry', async () => {
        const action = vi.fn()
            .mockRejectedValueOnce(new Error('fail 1'))
            .mockRejectedValueOnce(new Error('fail 2'))
            .mockResolvedValue('ok');

        const onRetry = vi.fn();

        const executePromise = retrier.execute(action, onRetry);

        await vi.advanceTimersByTimeAsync(100);
        await vi.advanceTimersByTimeAsync(200);

        await executePromise;

        expect(onRetry).toHaveBeenCalledTimes(2);
        // First retry: attempt 0, delay 100ms
        expect(onRetry).toHaveBeenNthCalledWith(1, 0, 100, expect.any(Error));
        // Second retry: attempt 1, delay 200ms
        expect(onRetry).toHaveBeenNthCalledWith(2, 1, 200, expect.any(Error));
    });

    // --- No Retries ---

    it('should throw immediately when maxRetries is 0', async () => {
        const noRetryRetrier = new RetryWithBackoff({
            maxRetries: 0,
            baseDelayMs: 100,
            maxDelayMs: 2000,
            jitter: false,
        });

        const action = vi.fn().mockRejectedValue(new Error('instant fail'));

        await expect(noRetryRetrier.execute(action)).rejects.toThrow('instant fail');
        expect(action).toHaveBeenCalledTimes(1);
    });
});
