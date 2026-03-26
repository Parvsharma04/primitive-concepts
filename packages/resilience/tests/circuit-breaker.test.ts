import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../src/circuit-breaker';

describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    // Let's create some fake functions that return promises to simulate network calls
    let successAction: any;
    let failAction: any;

    beforeEach(() => {
        breaker = new CircuitBreaker({
            failureThreshold: 3,
            resetTimeoutMs: 5000,
        });
        vi.useFakeTimers();

        successAction = vi.fn().mockResolvedValue('success data');
        failAction = vi.fn().mockRejectedValue(new Error('network error'));
    });

    it('should start in CLOSED state and allow requests', async () => {
        expect(breaker.getState()).toBe(CircuitState.CLOSED);

        // The action should execute successfully
        const result = await breaker.execute(successAction);
        expect(result).toBe('success data');
        expect(successAction).toHaveBeenCalledTimes(1);
    });

    it('should transition to OPEN after reaching failure threshold', async () => {
        // 3 failures should trigger OPEN
        await expect(breaker.execute(failAction)).rejects.toThrow('network error');
        await expect(breaker.execute(failAction)).rejects.toThrow('network error');
        await expect(breaker.execute(failAction)).rejects.toThrow('network error');

        // State should now be OPEN
        expect(breaker.getState()).toBe(CircuitState.OPEN);

        // Any new requests should fail immediately without executing the action!
        await expect(breaker.execute(successAction)).rejects.toThrow('Circuit is OPEN');

        // The underlying action should NOT have been called again
        expect(successAction).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after timeout', async () => {
        // Cause 3 failures to trigger OPEN state
        for (let i = 0; i < 3; i++) {
            await expect(breaker.execute(failAction)).rejects.toThrow('network error');
        }
        expect(breaker.getState()).toBe(CircuitState.OPEN);

        // Move time forward past the resetTimeoutMs
        vi.advanceTimersByTime(5001);

        // Now it should be HALF_OPEN
        expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should transition to CLOSED on success in HALF_OPEN', async () => {
        // Cause failures -> OPEN
        for (let i = 0; i < 3; i++) {
            await expect(breaker.execute(failAction)).rejects.toThrow('network error');
        }

        // Wait for timeout -> HALF_OPEN
        vi.advanceTimersByTime(5001);

        // Execute a successful probe call
        const result = await breaker.execute(successAction);

        // It should work and switch back to CLOSED
        expect(result).toBe('success data');
        expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition back to OPEN on failure in HALF_OPEN', async () => {
        // Cause failures -> OPEN
        for (let i = 0; i < 3; i++) {
            await expect(breaker.execute(failAction)).rejects.toThrow('network error');
        }

        // Wait for timeout -> HALF_OPEN
        vi.advanceTimersByTime(5001);

        // Fail the probe request (service is still down!)
        await expect(breaker.execute(failAction)).rejects.toThrow('network error');

        // Should immediately shift back to OPEN
        expect(breaker.getState()).toBe(CircuitState.OPEN);

        // New requests should throw "Circuit is OPEN" immediately
        await expect(breaker.execute(successAction)).rejects.toThrow('Circuit is OPEN');
    });
});
