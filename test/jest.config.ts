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
        types: ['jest', 'node', '@testing-library/jest-dom'],
      },
    },
  },
  // Failed attempt to make Jest preserve symlinks of `libframe/utils/assert.ts` when running `route/precedence.spec.ts`, see https://github.com/facebook/jest/issues/5356
  haste: {
    enableSymlinks: true,
  },
  watchman: false,
  testMatch: getTestMatch(),
  rootDir: `${__dirname}/../..`,
  testRunner: 'jest-jasmine2',
  silent: false,
} as Config.InitialOptions

function getTestMatch() {
  const testFiles = process.env.TEST_FILES
  if (!testFiles) {
    const testMatch = ['**/*.test.*'] // Unit tests `**/*.spec.*` are handled by Vitesse
    return testMatch
  }
  const testMatch = testFiles.split(' ').map((testFile) => '**/' + testFile)
  return testMatch
}
