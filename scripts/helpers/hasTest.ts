import { readdirSync } from 'fs'
import assert = require('assert')
import { isAbsolute } from 'path'
import { DIR_SRC } from '../helpers/locations'

export { hasTest }

function hasTest(dir: string): boolean {
  assert(isAbsolute(dir))
  assert(isAbsolute(DIR_SRC))
  if (dir === DIR_SRC) {
    return true
  }
  const files = readdirSync(dir)
  assert(files.some((file) => file === 'package.json'))
  return files.some((file) => file.includes('.test'))
}
