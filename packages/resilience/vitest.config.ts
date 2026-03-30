import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Allow unhandled errors in timeout tests
		// These are expected when using Promise.race() with fake timers
		// The rejections are handled, just asynchronously
		dangerouslyIgnoreUnhandledErrors: true,
	},
});
