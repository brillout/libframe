export { assert }

function assert(condition: unknown, debugInfo?: unknown): asserts condition {
  if (condition) {
    return
  }
  if (debugInfo !== undefined) {
    if (typeof debugInfo === 'object') {
      debugInfo = JSON.stringify(debugInfo)
    }
    console.log(debugInfo)
  }
  const err = new Error('Assertion Failed')
  if (isDev()) {
    alert(err.stack)
  }
  throw err
}

function isDev() {
  return typeof window !== undefined && window?.location?.port !== ''
}
