import type { Config } from '@jest/types'
// @ts-ignore
import tsPreset = require('ts-jest/jest-preset')
// @ts-ignore
import playwrightPreset = require('jest-playwright-preset/jest-preset')
import { resolve } from 'path'

const typeRoots = resolve(__dirname, '../../node_modules/@types')

export default {
  ...tsPreset,
  ...playwrightPreset,
  globals: {
    'ts-jest': {
      tsconfig: {
        lib: ['DOM', 'DOM.Iterable', 'ESNext'],
        target: 'ES2019', // Node.js 12 doesn't support ES2020
        moduleResolution: 'Node',
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        typeRoots: [typeRoots],
        types: ['jest', 'node'],
      },
    },
  },
  // Failed attempt to make Jest preserve symlinks of `libframe/utils/assert.ts` when running `route/precedence.spec.ts`, see https://github.com/facebook/jest/issues/5356
  haste: {
    enableSymlinks: true,
  },
  watchman: false,
  testPathIgnorePatterns: [
    '<rootDir>/telefunc/node',
    '<rootDir>/telefunc/client',
    '<rootDir>/telefunc/shared',
    '<rootDir>/vite-plugin-ssr/node',
    '<rootDir>/vite-plugin-ssr/client',
    '<rootDir>/vite-plugin-ssr/shared',
  ],
  rootDir: `${__dirname}/../..`,
  testRunner: 'jest-jasmine2',
  silent: false,
  testRegex: process.env.SINGLE_TEST || undefined
} as Config.InitialOptions
