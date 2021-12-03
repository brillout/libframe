import assert = require('assert')
import { slice } from './slice'

export { partRegex }

function partRegex(parts: TemplateStringsArray, ...variables: (RegExp | unknown)[]): RegExp {
  assert(parts.length === variables.length + 1)
  let str = ''
  for (let i = 0; i < variables.length; i++) {
    const variable = variables[i]
    str += escapeString(parts[i])
    if (isRegex(variable)) {
      str += slice(variable.toString(), 1, -1)
    } else {
      str += escapeString(String(variable))
    }
  }
  str += escapeString(parts[parts.length - 1])
  return new RegExp(str)
}

function escapeString(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function isRegex(value: unknown): value is RegExp {
  return toString.call(value) === '[object RegExp]'
}
