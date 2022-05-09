export * from './sleep'
export * from './runCommand'

// Copied from https://www.npmjs.com/package/callsite
export function callsite() {
  var orig = Error.prepareStackTrace
  Error.prepareStackTrace = function (_, stack) {
    return stack
  }
  var err = new Error()
  Error.captureStackTrace(err, arguments.callee)
  // See `@types/callsite` for full types
  var stack: { getFileName(): string; getFunctionName(): string }[] = err.stack as any
  Error.prepareStackTrace = orig
  return stack
}
