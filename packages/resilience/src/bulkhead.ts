export interface BulkheadOptions {
	maxConcurrent: number; // Maximum number of tasks that can run at the same time
	maxQueued: number; // Maximum number of tasks waiting in the queue
}

export class BulkheadRejectedError extends Error {
	constructor() {
		super("Bulkhead capacity exhausted — task rejected");
		this.name = "BulkheadRejectedError";
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, BulkheadRejectedError);
		}
	}
}

/**
 * IMPLEMENTATION CHALLENGE: BULKHEAD PATTERN
 *
 * Concept:
 * - Named after ship hull compartments that prevent a leak in one section
 *   from sinking the entire vessel. In software, a bulkhead isolates
 *   concurrent workloads so one overwhelmed resource doesn't starve others.
 *
 * - You enforce two limits:
 *     1. A cap on how many tasks execute concurrently.
 *     2. A cap on how many tasks can wait in a queue.
 *   If both are full, new tasks are rejected immediately.
 *
 * YOUR TASK:
 * - Track how many tasks are currently running.
 * - Maintain a queue for tasks that arrive when all execution slots are busy.
 * - When a running task finishes, pull the next one from the queue.
 * - If both running slots AND queue are full, reject with BulkheadRejectedError.
 * - Expose getters so tests (and the visualizer) can inspect internal state.
 *
 * THINK ABOUT:
 * - What data structure models "waiting for a slot to open" naturally?
 * - How do you resume a queued task once a slot frees up?
 * - What happens if a running task throws? Does it still release its slot?
 */

export class Bulkhead {
	private options: BulkheadOptions;
	private activeCountInternal = 0;

	private queue: Array<{
		action: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (reason: any) => void;
	}> = [];

	constructor(options: BulkheadOptions) {
		if (options.maxConcurrent <= 0) {
			throw new RangeError(
				`maxConcurrent must be positive, got ${options.maxConcurrent}`,
			);
		}
		if (options.maxQueued < 0) {
			throw new RangeError(
				`maxQueued must be non-negative, got ${options.maxQueued}`,
			);
		}
		this.options = options;
	}

	get activeCount(): number {
		return this.activeCountInternal;
	}

	get queueLength(): number {
		return this.queue.length;
	}

	execute<T>(action: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			// Case 1: can run immediately
			if (this.activeCountInternal < this.options.maxConcurrent) {
				this.runTask(action, resolve, reject);
				return;
			}

			// Case 2: enqueue
			if (this.queue.length < this.options.maxQueued) {
				this.queue.push({ action, resolve, reject });
				return;
			}

			// Case 3: reject
			reject(new BulkheadRejectedError());
		});
	}

	private runTask<T>(
		action: () => Promise<T>,
		resolve: (value: T) => void,
		reject: (reason: any) => void,
	) {
		this.activeCountInternal++;

		let settled: { ok: true; value: T } | { ok: false; err: unknown };

		action()
			.then((value) => {
				settled = { ok: true, value };
			})
			.catch((err) => {
				settled = { ok: false, err };
			})
			.finally(() => {
				this.activeCountInternal--;
				this.dequeue();
				if (settled.ok) {
					resolve(settled.value);
				} else {
					reject(settled.err);
				}
			});
	}

	private dequeue() {
		if (this.queue.length > 0) {
			const next = this.queue.shift()!;
			this.runTask(next.action, next.resolve, next.reject);
		}
	}
}
