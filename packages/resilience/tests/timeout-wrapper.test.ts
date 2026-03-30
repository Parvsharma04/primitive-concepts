import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeoutWrapper, TimeoutError } from '../src/timeout-wrapper';

describe('TimeoutWrapper', () => {
	let wrapper: TimeoutWrapper;

	beforeEach(() => {
		wrapper = new TimeoutWrapper({
			timeoutMs: 1000,
		});
		vi.useFakeTimers();
	});

	afterEach(async () => {
		// Clean up any pending timers
		await vi.runOnlyPendingTimersAsync();
		vi.restoreAllMocks();
	});

	// --- Basic Functionality ---

	it('should return result when action completes before timeout', async () => {
		const action = vi.fn().mockResolvedValue('fast result');

		const result = await wrapper.execute(action);

		expect(result).toBe('fast result');
		expect(action).toHaveBeenCalledTimes(1);
	});

	it('should throw TimeoutError when action takes too long', async () => {
		// An action that takes 3 seconds — longer than our 1s timeout
		const action = vi.fn(
			() => new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 3000)),
		);

		const executePromise = wrapper.execute(action);
		// Attach a catch handler BEFORE advancing timers so the rejection is never unhandled
		const caughtPromise = executePromise.catch((e) => e);

		// Advance time past the timeout
		await vi.advanceTimersByTimeAsync(1001);

		const result = await caughtPromise;
		expect(result).toBeInstanceOf(TimeoutError);
		expect(result.message).toBe('Operation timed out after 1000ms');

		await vi.runAllTimersAsync();
	});

	it('should propagate the action error if it fails before timeout', async () => {
		const action = vi.fn().mockRejectedValue(new Error('action failed'));

		await expect(wrapper.execute(action)).rejects.toThrow('action failed');
	});

	// --- onTimeout Callback ---

	it('should call onTimeout callback when a timeout occurs', async () => {
		const action = vi.fn(
			() => new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 5000)),
		);
		const onTimeout = vi.fn();

		const executePromise = wrapper.execute(action, onTimeout);
		// Attach a catch handler BEFORE advancing timers so the rejection is never unhandled
		const caughtPromise = executePromise.catch((e) => e);

		await vi.advanceTimersByTimeAsync(1001);

		const result = await caughtPromise;
		expect(result).toBeInstanceOf(TimeoutError);
		expect(onTimeout).toHaveBeenCalledTimes(1);
		expect(onTimeout).toHaveBeenCalledWith(1000);

		await vi.runAllTimersAsync();
	});

	it('should NOT call onTimeout when action succeeds', async () => {
		const action = vi.fn().mockResolvedValue('ok');
		const onTimeout = vi.fn();

		await wrapper.execute(action, onTimeout);

		expect(onTimeout).not.toHaveBeenCalled();
	});

	it('should NOT call onTimeout when action fails with its own error', async () => {
		const action = vi.fn().mockRejectedValue(new Error('boom'));
		const onTimeout = vi.fn();

		await expect(wrapper.execute(action, onTimeout)).rejects.toThrow('boom');
		expect(onTimeout).not.toHaveBeenCalled();
	});

	// --- Timer Cleanup ---

	it('should clean up the timer after successful execution', async () => {
		const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
		const action = vi.fn().mockResolvedValue('done');

		await wrapper.execute(action);

		// clearTimeout should have been called to avoid memory leaks
		expect(clearTimeoutSpy).toHaveBeenCalled();
		clearTimeoutSpy.mockRestore();
	});

	it('should clean up the timer after action error', async () => {
		const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
		const action = vi.fn().mockRejectedValue(new Error('oops'));

		await expect(wrapper.execute(action)).rejects.toThrow('oops');

		expect(clearTimeoutSpy).toHaveBeenCalled();
		clearTimeoutSpy.mockRestore();
	});

	// --- Edge Cases ---

	it('should work with very short timeouts', async () => {
		const shortWrapper = new TimeoutWrapper({ timeoutMs: 10 });
		const action = vi.fn(
			() => new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 500)),
		);

		const executePromise = shortWrapper.execute(action);
		// Attach a catch handler BEFORE advancing timers so the rejection is never unhandled
		const caughtPromise = executePromise.catch((e) => e);

		await vi.advanceTimersByTimeAsync(11);

		const result = await caughtPromise;
		expect(result).toBeInstanceOf(TimeoutError);

		await vi.runAllTimersAsync();
	});

	it('should work with very long timeouts (action completes fast)', async () => {
		const longWrapper = new TimeoutWrapper({ timeoutMs: 60000 });
		const action = vi.fn().mockResolvedValue('instant');

		const result = await longWrapper.execute(action);
		expect(result).toBe('instant');
	});

	it('should expose the configured timeout via getTimeoutMs()', () => {
		expect(wrapper.getTimeoutMs()).toBe(1000);
	});

	it('should throw RangeError if timeoutMs is zero or negative', () => {
		expect(() => new TimeoutWrapper({ timeoutMs: 0 })).toThrow(RangeError);
		expect(() => new TimeoutWrapper({ timeoutMs: -1 })).toThrow(RangeError);
	});

	it('should throw TimeoutError with correct name property', async () => {
		const action = vi.fn(
			() => new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 5000)),
		);

		const executePromise = wrapper.execute(action);
		// Attach a catch handler BEFORE advancing timers so the rejection is never unhandled
		const caughtPromise = executePromise.catch((e) => e);

		await vi.advanceTimersByTimeAsync(1001);

		const error = await caughtPromise;
		expect(error).toBeInstanceOf(TimeoutError);
		expect((error as TimeoutError).name).toBe('TimeoutError');

		await vi.runAllTimersAsync();
	});
});
