import { defineConfig } from 'vitest/config'
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        include: [
            'modules/**/src/**/*.test.ts',
            'modules/**/tests/**/*.test.ts',
            'modules/tests/**/*.test.ts'
        ],
        environment: 'node',
    },
})
