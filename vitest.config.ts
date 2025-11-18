import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          // Server-side tests (Node.js utilities)
          name: 'server',
          environment: 'node',
          include: ['./**/*.server.{spec,test}.{js,ts}'],
          // Setup file?
        },
      },
    ],
  },
});
