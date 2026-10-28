
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["testes/**/*.test.js"],
        clearMocks: true,
        restoreMocks: true
    }
});

