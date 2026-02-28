import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Increase timeout downloading the Postgres image 
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
