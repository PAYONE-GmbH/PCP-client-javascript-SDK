import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  rootDir: './src',
  testRegex: '.*\\.spec\\.ts$',
  coverageDirectory: '../coverage',
};

export default config;
