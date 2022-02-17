import type { Config } from '@jest/types'
// @ts-ignore
import tsPreset = require('ts-jest/jest-preset')
// @ts-ignore
import playwrightPreset = require('jest-playwright-preset/jest-preset')

const config: Config.InitialOptions = {
  ...tsPreset,
  ...playwrightPreset,
  globals: {
    'ts-jest': {
      tsconfig: {
        lib: ['DOM', 'DOM.Iterable', 'ESNext'],
        esModuleInterop: true,
        // Make sure test code is transpiled into code that works with Node.js 12 which doesn't support ES2020
        target: 'ES2019',
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
  testRunner: "jest-jasmine2",
  silent: false,
}

export default config
