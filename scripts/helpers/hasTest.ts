import { readdirSync } from 'fs'
import assert = require('assert')
import { isAbsolute, resolve } from 'path'
import { DIR_ROOT, DIR_SRC } from '../helpers/locations'

export { hasTest }

function hasTest(dir: string): boolean {
  assert(isAbsolute(dir))
  assert(isAbsolute(DIR_SRC))
  if (resolve(dir) === resolve(DIR_SRC)) {
    return true
  }
  if (resolve(dir) === resolve(DIR_ROOT)) {
    return true
  }
  const files = readdirSync(dir)
  assert(files.some((file) => file === 'package.json'))
  return files.some((file) => file.includes('.test'))
}
