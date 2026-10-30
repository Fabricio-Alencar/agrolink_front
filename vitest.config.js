
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["testes/**/*.test.js"],
        clearMocks: true,
        restoreMocks: true,

        coverage: {
            provider: "v8",
            include: ["static/js/**/*.js"],
            exclude: [
                "static/js/**/*.test.js"
            ],
            reporter: ["text", "html"],
            all: true
        }
    }
});
