export interface RetryWithBackoffOptions {
	maxRetries: number; // Maximum number of retry attempts
	baseDelayMs: number; // Initial delay before the first retry (in ms)
	maxDelayMs: number; // Cap on the delay to prevent excessively long waits
	jitter?: boolean; // Whether to add random jitter to the delay
}

/**
 * IMPLEMENTATION CHALLENGE: RETRY WITH EXPONENTIAL BACKOFF
 *
 * Concept:
 * - When a transient failure occurs (e.g., network timeout, 503), instead of
 *   immediately retrying (which can overwhelm a struggling service), we wait
 *   progressively longer between each retry attempt.
 *
 * - The delay between retries grows exponentially:
 *     delay = baseDelayMs * 2^attempt
 *   For example, with baseDelayMs = 100:
 *     Attempt 0 → 100ms
 *     Attempt 1 → 200ms
 *     Attempt 2 → 400ms
 *     Attempt 3 → 800ms
 *
 * - The delay is capped at `maxDelayMs` so it doesn't grow forever.
 *
 * - Optional "jitter" adds randomness to the delay to prevent a thundering herd
 *   problem where many clients retry at the exact same time.
 *   With jitter: delay = random(0, calculatedDelay)
 *
 * YOUR TASK:
 * 1. Execute the given `action`.
 * 2. If it succeeds, return the result immediately.
 * 3. If it fails and retries remain:
 *    a. Calculate the exponential delay: baseDelayMs * 2^attempt
 *    b. Cap it at maxDelayMs.
 *    c. If jitter is enabled, randomize: Math.random() * delay.
 *    d. Wait for the delay, then retry.
 * 4. If all retries are exhausted, throw the last error.
 * 5. Track each attempt via the optional `onRetry` callback.
 */

export class RetryWithBackoff {
	private options: RetryWithBackoffOptions;

	constructor(options: RetryWithBackoffOptions) {
		this.options = options;
	}

	/**
	 * Calculate the delay for a given attempt number.
	 * attempt is 0-indexed (0 = first retry).
	 *
	 * Formula: min(baseDelayMs * 2^attempt, maxDelayMs)
	 * If jitter is enabled: multiply by Math.random()
	 */
	public calculateDelay(attempt: number): number {
		const delay = Math.min(
			this.options.baseDelayMs * Math.pow(2, attempt),
			this.options.maxDelayMs,
		);
		return this.options.jitter ? delay * Math.random() : delay;
	}

	async execute<T>(
		action: () => Promise<T>,
		onRetry?: (attempt: number, delay: number, error: Error) => void,
	): Promise<T> {
		let err: Error;
		for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
			try {
				return await action();
			} catch (error) {
				err = error as Error;
				if (this.options.maxRetries == attempt) throw err;
				const delay = this.calculateDelay(attempt);
				if (onRetry) onRetry(attempt, delay, err);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
        throw err!;
	}
}
