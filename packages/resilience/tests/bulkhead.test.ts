import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Bulkhead, BulkheadRejectedError } from '../src/bulkhead';

/** Helper: create a promise you can resolve/reject from outside */
function deferred<T = void>() {
	let resolve!: (v: T) => void;
	let reject!: (e: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('Bulkhead', () => {
	// --- Construction ---

	it('should throw RangeError for non-positive maxConcurrent', () => {
		expect(() => new Bulkhead({ maxConcurrent: 0, maxQueued: 5 })).toThrow(RangeError);
		expect(() => new Bulkhead({ maxConcurrent: -1, maxQueued: 5 })).toThrow(RangeError);
	});

	it('should throw RangeError for negative maxQueued', () => {
		expect(() => new Bulkhead({ maxConcurrent: 2, maxQueued: -1 })).toThrow(RangeError);
	});

	it('should start with zero active and zero queued', () => {
		const bh = new Bulkhead({ maxConcurrent: 3, maxQueued: 5 });
		expect(bh.activeCount).toBe(0);
		expect(bh.queueLength).toBe(0);
	});

	// --- Concurrency limiting ---

	it('should run tasks up to maxConcurrent simultaneously', async () => {
		const bh = new Bulkhead({ maxConcurrent: 2, maxQueued: 5 });
		const d1 = deferred<string>();
		const d2 = deferred<string>();

		bh.execute(() => d1.promise);
		bh.execute(() => d2.promise);

		expect(bh.activeCount).toBe(2);
		expect(bh.queueLength).toBe(0);

		d1.resolve('a');
		d2.resolve('b');
	});

	it('should queue tasks when maxConcurrent is reached', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 2 });
		const d1 = deferred<string>();
		const d2 = deferred<string>();

		bh.execute(() => d1.promise);
		bh.execute(() => d2.promise);

		expect(bh.activeCount).toBe(1);
		expect(bh.queueLength).toBe(1);

		d1.resolve('done');
		d2.resolve('done');
	});

	it('should reject when both slots and queue are full', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 1 });
		const d1 = deferred<string>();
		const d2 = deferred<string>();

		bh.execute(() => d1.promise);
		bh.execute(() => d2.promise);

		await expect(bh.execute(() => Promise.resolve('overflow'))).rejects.toThrow(
			BulkheadRejectedError,
		);

		d1.resolve('done');
		d2.resolve('done');
	});

	// --- Queue draining ---

	it('should dequeue and run the next task when a slot frees up', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 5 });
		const d1 = deferred<string>();
		const order: string[] = [];

		const p1 = bh.execute(async () => {
			const v = await d1.promise;
			order.push('first');
			return v;
		});

		const p2 = bh.execute(async () => {
			order.push('second');
			return 'two';
		});

		expect(bh.activeCount).toBe(1);
		expect(bh.queueLength).toBe(1);

		// finish first task — second should auto-start
		d1.resolve('one');
		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1).toBe('one');
		expect(r2).toBe('two');
		expect(order).toEqual(['first', 'second']);
		expect(bh.activeCount).toBe(0);
		expect(bh.queueLength).toBe(0);
	});

	// --- Error handling ---

	it('should release a slot when a task throws', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 5 });
		const d1 = deferred<string>();

		const p1 = bh.execute(() => d1.promise).catch((e) => e);
		const p2 = bh.execute(() => Promise.resolve('recovered'));

		expect(bh.activeCount).toBe(1);
		expect(bh.queueLength).toBe(1);

		d1.reject(new Error('boom'));

		const [err, r2] = await Promise.all([p1, p2]);
		expect(err).toBeInstanceOf(Error);
		expect((err as Error).message).toBe('boom');
		expect(r2).toBe('recovered');
		expect(bh.activeCount).toBe(0);
	});

	// --- maxQueued = 0 (no queueing) ---

	it('should reject immediately when maxQueued is 0 and slots are full', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 0 });
		const d1 = deferred<string>();

		bh.execute(() => d1.promise);

		await expect(bh.execute(() => Promise.resolve('nope'))).rejects.toThrow(
			BulkheadRejectedError,
		);

		d1.resolve('done');
	});

	// --- Multiple drains ---

	it('should drain the full queue in order as slots open', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 3 });
		const triggers = [deferred<string>(), deferred<string>(), deferred<string>()];
		const order: number[] = [];

		const promises = triggers.map((d, i) =>
			bh.execute(async () => {
				const v = await d.promise;
				order.push(i);
				return v;
			}),
		);

		expect(bh.activeCount).toBe(1);
		expect(bh.queueLength).toBe(2);

		// resolve them one at a time
		triggers[0].resolve('a');
		await promises[0];

		triggers[1].resolve('b');
		await promises[1];

		triggers[2].resolve('c');
		await promises[2];

		expect(order).toEqual([0, 1, 2]);
		expect(bh.activeCount).toBe(0);
		expect(bh.queueLength).toBe(0);
	});

	// --- BulkheadRejectedError shape ---

	it('should have the correct error name', async () => {
		const bh = new Bulkhead({ maxConcurrent: 1, maxQueued: 0 });
		const d1 = deferred<string>();
		bh.execute(() => d1.promise);

		const err = await bh.execute(() => Promise.resolve('x')).catch((e) => e);
		expect(err).toBeInstanceOf(BulkheadRejectedError);
		expect((err as BulkheadRejectedError).name).toBe('BulkheadRejectedError');

		d1.resolve('done');
	});
});
