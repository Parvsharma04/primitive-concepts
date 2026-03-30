export interface TimeoutWrapperOptions {
	timeoutMs: number; // Maximum time (in ms) to wait for the action to complete
}

export class TimeoutError extends Error {
	constructor(timeoutMs: number) {
		super(`Operation timed out after ${timeoutMs}ms`);
		this.name = 'TimeoutError';
		// Ensure proper stack trace in V8 environments
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, TimeoutError);
		}
	}
}

/**
 * IMPLEMENTATION CHALLENGE: TIMEOUT WRAPPER
 *
 * Concept:
 * - In distributed systems, calls to external services can hang indefinitely.
 *   A timeout wrapper ensures that if an operation takes too long, it is
 *   aborted and an error is thrown — preventing resource exhaustion and
 *   cascading slowdowns.
 *
 * - The idea is simple: race the actual operation against a timer.
 *   Whichever finishes first wins:
 *     ✓ If the action completes before the timer → return its result.
 *     ✗ If the timer fires first → throw a TimeoutError.
 *
 * - This pattern is often combined with retries and circuit breakers:
 *     request → timeout(2s) → retry(3x) → circuit-breaker
 *
 * HOW IT WORKS:
 * - Use `Promise.race()` to race the action against a timeout promise.
 * - The timeout promise rejects after `timeoutMs` milliseconds.
 * - If the action resolves first, return its value.
 * - If the timeout rejects first, throw a TimeoutError.
 * - Always clean up the timer to avoid memory leaks!
 *
 * YOUR TASK:
 * 1. Create a timeout promise that rejects with a `TimeoutError` after `timeoutMs`.
 * 2. Use `Promise.race([action(), timeoutPromise])` to race them.
 * 3. If the action wins, return its result.
 * 4. If the timeout wins, throw the TimeoutError.
 * 5. Always clear the timer in a `finally` block (use `clearTimeout`).
 * 6. Track the execution via the optional `onTimeout` callback when a timeout occurs.
 *
 * HINTS:
 * - `Promise.race()` resolves/rejects with the first settled promise.
 * - Store the timer ID so you can clear it: `const timerId = setTimeout(...)`.
 * - Use try/finally to ensure cleanup happens whether the action succeeds, fails, or times out.
 * - The `onTimeout` callback should be called ONLY when a timeout actually happens
 *   (not when the action fails with its own error).
 */

export class TimeoutWrapper {
	private options: TimeoutWrapperOptions;

	constructor(options: TimeoutWrapperOptions) {
		if (options.timeoutMs <= 0) {
			throw new RangeError(`timeoutMs must be a positive number, got ${options.timeoutMs}`);
		}
		this.options = options;
	}

	public getTimeoutMs(): number {
		return this.options.timeoutMs;
	}

	execute<T>(
		action: () => Promise<T>,
		onTimeout?: (timeoutMs: number) => void,
	): Promise<T> {
		const { timeoutMs } = this.options;

		let timerId: ReturnType<typeof setTimeout>;

		const timeoutPromise = new Promise<never>((_, reject) => {
			timerId = setTimeout(() => {
				onTimeout?.(timeoutMs);
				reject(new TimeoutError(timeoutMs));
			}, timeoutMs);
		});

		const actionPromise = action();
		timeoutPromise.catch(() => {});
		actionPromise.catch(() => {});

		return Promise.race([actionPromise, timeoutPromise]).finally(() => {
			clearTimeout(timerId);
		});
	}
}
