import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc';


export default defineConfig({
  test: {
    include: ['test/**/*.ts', '**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      interopDefault: true,
    },
  },
  plugins: [swc.vite()],
}) 