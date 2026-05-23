import type { Config } from 'jest';

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.steps.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/emission/{domain,application}/**/*.ts',
    '!src/emission/**/*.{types,dto,constants,error,mapper,repository}.ts',
    '!src/emission/**/*.module.ts',
    '!src/emission/**/index.ts',
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
