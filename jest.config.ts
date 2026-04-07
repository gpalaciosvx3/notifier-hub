import type { Config } from 'jest';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.steps.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/enqueue/domain/**/*.ts',
    'src/enqueue/application/**/*.ts',
    'src/query/domain/**/*.ts',
    'src/query/application/**/*.ts',
    'src/worker/domain/**/*.ts',
    'src/worker/application/**/*.ts',
    'src/dlq/domain/**/*.ts',
    'src/dlq/application/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
} satisfies Config;
