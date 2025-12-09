import { defineConfig } from "vite"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from "vite-tsconfig-paths"
import civetVitePlugin from '@danielx/civet/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        tsconfigPaths(),
        civetVitePlugin({
            ts: 'civet',
        }),
    ],
})
