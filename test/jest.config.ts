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
  rootDir: `${__dirname}/../..`,
  silent: false,
}

export default config
