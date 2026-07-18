import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.mjs"],
		globals: false,
		setupFiles: ["tests/setup/foundry-mocks.mjs"],
		coverage: {
			provider: "v8",
			include: [
				"module/helpers/actor-calculations.mjs",
				"module/helpers/effects.mjs",
				"module/helpers/config.mjs",
				"module/dice/**/*.mjs",
				"module/documents/actor.mjs",
				"module/documents/chat-message.mjs",
				"module/documents/item.mjs",
				"utils/semver-compare.mjs",
			],
			reporter: ["text", "lcov"],
		},
	},
});
