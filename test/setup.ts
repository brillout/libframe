import { spawn } from 'child_process'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { dirname as pathDirname } from 'path'
import { ConsoleMessage, Page } from 'playwright-chromium'
import { runCommand, sleep } from './utils'
import { red, bold, blue } from 'kolorist'
import fetch from 'node-fetch'
import * as assert from 'assert'

export const urlBase = 'http://localhost:3000'
export { partRegex } from './utils'
export const page: Page = (global as any).page as Page
export { autoRetry }
export { fetchHtml }
export { expectBrowserError }
export { run }
export { isMinNodeVersion }

//const TIMEOUT = 100 * 1000 * (!isGitHubAction() ? 1 : isLinux() ? 2 : 15)
const TIMEOUT_NPM_SCRIPT = 30 * 1000
const TIMEOUT_JEST = 30 * 1000 * (!isGitHubAction() ? 1 : isLinux() ? 2 : 8)
const TIMEOUT_AUTORETRY = 10 * 1000 * (!isGitHubAction() ? 1 : isLinux() ? 1 : 12)

type BrowserLog = {
  type: string
  text: string
  location: any
  args: any
}
let browserLogs: BrowserLog[] = []
function run(
  cmd: string,
  { baseUrl = '', additionalTimeout = 0 }: { baseUrl?: string; additionalTimeout?: number } = {}
) {
  assert(typeof baseUrl === 'string')

  jest.setTimeout(TIMEOUT_JEST)

  let runProcess: RunProcess
  beforeAll(async () => {
    runProcess = await start(cmd, additionalTimeout)
    page.on('console', onConsole)
    page.on('pageerror', onPageError)
    // page.setDefaultTimeout(TIMEOUT)
    await bailOnTimeout(
      async () => {
        await page.goto(urlBase + baseUrl)
      },
      { timeout: 30 * 1000 }
    )
  })
  afterAll(async () => {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)

    const clientHasErrors = browserLogs.filter(({ type }) => type === 'error').length > 0

    if (clientHasErrors) {
      browserLogs.forEach((browserLog) => {
        forceLog(browserLog.type === 'error' ? 'Browser Error' : 'Browser Log', JSON.stringify(browserLog, null, 2))
      })
    }
    browserLogs = []

    await page.close() // See https://github.com/vitejs/vite/pull/3097

    // `runProcess` is `undefined` if `start()` failed.
    if (runProcess) {
      await runProcess.terminate('SIGINT')
      if (clientHasErrors) {
        runProcess.printLogs()
      }
    }

    // Make Jest consider the test as failing
    expect(clientHasErrors).toEqual(false)
  })
}
// Also called when the page throws an error or a warning
function onConsole(msg: ConsoleMessage) {
  browserLogs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
    args: msg.args()
  })
}
// For uncaught exceptions
function onPageError(err: Error) {
  browserLogs.push({
    type: 'error',
    text: err.message,
    location: err.stack,
    args: null
  })
}
function expectBrowserError(browserLogFilter: (browserLog: BrowserLog) => boolean) {
  let found = false
  browserLogs = browserLogs.filter((browserLog) => {
    if (found) {
      return true
    }
    if (browserLogFilter(browserLog)) {
      found = true
      return false
    }
    return true
  })
  expect(found).toBe(true)
}

type RunProcess = {
  proc: ChildProcessWithoutNullStreams
  cwd: string
  cmd: string
  printLogs: () => void
  terminate: (signal: 'SIGINT' | 'SIGKILL') => Promise<void>
}
async function start(cmd: string, additionalTimeout: number): Promise<RunProcess> {
  let resolveServerStart: (runProcess: RunProcess) => void
  let rejectServerStart: (err: Error) => void
  const promise = new Promise<RunProcess>((_resolve, _reject) => {
    resolveServerStart = (runProcess: RunProcess) => {
      clearTimeout(serverStartTimeout)
      _resolve(runProcess)
    }
    rejectServerStart = (err: Error) => {
      clearTimeout(serverStartTimeout)
      _reject(err)
    }
  })
  const serverStartTimeout = setTimeout(() => {
    rejectServerStart(new Error(`Server didn't start yet (npm script: \`${cmd}\`).`))
  }, TIMEOUT_NPM_SCRIPT + additionalTimeout)

  // Kill any process that listens to port `3000`
  if (!process.env.CI && isLinux()) {
    await runCommand('fuser -k 3000/tcp', { swallowError: true, timeout: 10 * 1000 })
  }

  const { testPath } = expect.getState()
  const cwd = pathDirname(testPath)
  const proc = startProcess(cmd, cwd)

  const prefix = `[Run Start][${cwd}][${cmd}]`

  const stdout: string[] = []
  let hasStarted = false
  let runProcess: RunProcess
  proc.stdout.on('data', async (data: string) => {
    data = data.toString()
    stdout.push(data)
    const isServerStart =
      // Express.js server
      data.startsWith('Server running at') ||
      // npm package `serve`
      data.includes('Accepting connections at') ||
      // Clouflare Workers - miniflare
      data.includes('Listening on :3000') ||
      // Clouflare Workers - wrangler
      data.includes('Ignoring stale first change')
    if (isServerStart) {
      await sleep(1000)
      hasStarted = true
      runProcess = { proc, cwd, cmd, printLogs, terminate }
      resolveServerStart(runProcess)
    }
  })
  const stderr: string[] = []
  proc.stderr.on('data', async (data) => {
    data = data.toString()
    stderr.push(data)
    if (data.includes('EADDRINUSE')) {
      forceLog('stderr', data)
      rejectServerStart(new Error('Port conflict? Port already in use EADDRINUSE.'))
    }
  })
  proc.on('exit', async (code) => {
    if (([0, null].includes(code) || (code === 1 && isWindows())) && hasStarted) return
    printLogs()
    forceLog(prefix, `Unexpected process termination, exit code: ${code}`)
    try {
      await terminate('SIGKILL')
    } catch (err: unknown) {
      rejectServerStart(err as Error)
    }
  })

  return promise

  async function terminate(signal: 'SIGINT' | 'SIGKILL') {
    let resolve: () => void
    let reject: (err: Error) => void
    const promise = new Promise<void>((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })

    const timeout = setTimeout(() => {
      reject(new Error('Process termination timeout. Cmd: ' + runProcess.cmd))
    }, 10 * 1000)
    if (runProcess) {
      await stopProcess(runProcess, signal)
      clearTimeout(timeout)
      resolve()
    }

    return promise
  }

  function printLogs() {
    stdout.forEach(forceLog.bind(null, 'stdout'))
    stderr.forEach(forceLog.bind(null, 'stderr'))
  }
}

function stopProcess(runProcess: RunProcess, signal: 'SIGINT' | 'SIGKILL') {
  const { cwd, cmd, proc } = runProcess

  const prefix = `[Run Stop][${cwd}][${cmd}]`

  let resolve: () => void
  let reject: (err: Error) => void
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  const onProcessClose = (code: number) => {
    if (code === 0 || code === null || (code === 1 && isWindows())) {
      resolve()
    } else {
      reject(new Error(`${prefix} Terminated with non-0 error code ${code}`))
    }
  }
  proc.on('close', onProcessClose)
  proc.on('exit', onProcessClose)
  if (isWindows()) {
    // - https://github.com/nodejs/node/issues/3617#issuecomment-377731194
    // - https://stackoverflow.com/questions/23706055/why-can-i-not-kill-my-child-process-in-nodejs-on-windows/28163919#28163919
    spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: ['ignore', 'ignore', 'inherit'] })
  } else {
    process.kill(-proc.pid, signal)
    /*
      try {
        process.kill(-proc.pid, signal)
      } catch (err: unknown) {
        // ESRCH: No process or process group can be found corresponding to that specified by pid.
        //  => probably means that the process was killed already.
        if (typeof err === 'object' && err !== null && 'code' in err && err['code'] === 'ESRCH') {
          forceLog('stdout', '=============== swallowError')
          return
        } else {
          forceLog('stdout', '=============== no swallowError')
          throw err
        }
      }
      */
  }

  return promise
}

function startProcess(cmd: string, cwd: string) {
  let [command, ...args] = cmd.split(' ')
  let detached = true
  if (isWindows()) {
    detached = false
    if (command === 'npm') {
      command = 'npm.cmd'
    }
  }
  return spawn(command, args, { cwd, detached })
}

function forceLog(logType: 'stdout' | 'stderr' | 'Browser Error' | 'Browser Log' | string, str: string) {
  if (logType === 'stderr' || logType === 'Browser Error') logType = bold(red(logType))
  if (logType === 'stdout' || logType === 'Browser Log') logType = bold(blue(logType))
  if (!str.endsWith('\n')) str = str + '\n'
  process.stderr.write(`[${logType}]${str}`)
}

async function autoRetry(test: () => void | Promise<void>): Promise<void> {
  const period = 100
  const numberOfTries = TIMEOUT_AUTORETRY / period
  let i = 0
  while (true) {
    try {
      await test()
      return
    } catch (err) {
      i = i + 1
      if (i > numberOfTries) {
        throw err
      }
    }
    await sleep(period)
  }
}

async function fetchHtml(pathname: string) {
  const response = await fetch(urlBase + pathname)
  const html = await response.text()
  return html
}

async function bailOnTimeout(asyncFunc: () => Promise<void>, { timeout }: { timeout: number }) {
  let resolve: () => void
  let reject: (err: Error) => void
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  const t = setTimeout(() => {
    reject(new Error(`Function timeout.`))
  }, timeout)
  await asyncFunc()
  clearTimeout(t)
  resolve()

  return promise
}

function isMinNodeVersion(minNodeVersion: 14) {
  const { version } = process
  assert(version.startsWith('v'))
  const major = parseInt(version[1] + version[2], 10)
  assert(12 <= major && major <= 50)
  return major >= minNodeVersion
}

function isWindows() {
  return process.platform === 'win32'
}
function isLinux() {
  return process.platform === 'linux'
}
function isGitHubAction() {
  return !!process.env.CI
}
