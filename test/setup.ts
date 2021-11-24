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
export { isGithubAction }
export { isLinux }

const TIMEOUT_NPM_SCRIPT = 30 * 1000 * (!isGithubAction() ? 1 : isLinux() ? 1 : 4)
const TIMEOUT_JEST = 30 * 1000 * (!isGithubAction() ? 1 : isLinux() ? 3 : 4)
const TIMEOUT_AUTORETRY = 10 * 1000 * (!isGithubAction() ? 1 : isLinux() ? 1 : 6)
const TIMEOUT_PLAYWRIGHT = TIMEOUT_JEST
const TIMEOUT_PAGE_LOAD = TIMEOUT_PLAYWRIGHT

type Log = {
  logType: 'stdout' | 'stderr' | 'Browser Error' | 'Browser Log' | 'Run Start'
  logText: string
  logTimestamp: string
}
let browserLogs: Log[] = []
function run(
  cmd: string,
  {
    baseUrl = '',
    additionalTimeout = 0,
    serverIsRunningMessage,
    serverIsRunningDelay = 1000,
    debug = false,
  }: {
    baseUrl?: string
    additionalTimeout?: number
    serverIsRunningMessage?: string
    serverIsRunningDelay?: number
    debug?: boolean
  } = {},
) {
  assert(typeof baseUrl === 'string')

  jest.setTimeout(TIMEOUT_JEST + additionalTimeout)

  let runProcess: RunProcess
  beforeAll(async () => {
    runProcess = await start({ cmd, additionalTimeout, serverIsRunningMessage, serverIsRunningDelay, debug })
    page.on('console', onConsole)
    page.on('pageerror', onPageError)

    // This setting will change the default maximum time for all the methods accepting timeout option.
    // https://playwright.dev/docs/api/class-page#page-set-default-timeout
    page.setDefaultTimeout(TIMEOUT_PLAYWRIGHT + additionalTimeout)

    await bailOnTimeout(
      async () => {
        await page.goto(urlBase + baseUrl)
      },
      { timeout: TIMEOUT_PAGE_LOAD + additionalTimeout },
    )
  })
  afterAll(async () => {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)

    const clientHasErrors = browserLogs.filter(({ logType }) => logType === 'Browser Error').length > 0

    if (clientHasErrors) {
      browserLogs.forEach(printLog)
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

  return

  // Also called when the page throws an error or a warning
  function onConsole(msg: ConsoleMessage) {
    const type = msg.type()
    const browserLog = {
      logType: type === 'error' ? ('Browser Error' as const) : ('Browser Log' as const),
      logText: JSON.stringify(
        {
          type,
          text: msg.text(),
          location: msg.location(),
          args: msg.args(),
        },
        null,
        2,
      ),
      logTimestamp: getTimestamp(),
    }
    debug && printLog(browserLog)
    browserLogs.push(browserLog)
  }
  // For uncaught exceptions
  function onPageError(err: Error) {
    const browserLog = {
      logType: 'Browser Error' as const,
      logText: JSON.stringify(
        {
          text: err.message,
          location: err.stack,
        },
        null,
        2,
      ),
      logTimestamp: getTimestamp(),
    }
    debug && printLog(browserLog)
    browserLogs.push(browserLog)
  }
}
function getTimestamp() {
  const digits = new Date().getTime().toString().split('')
  const timestamp = digits.slice(0, -3).join('') + '.' + digits.slice(-3).join('')
  return timestamp
}
function expectBrowserError(browserLogFilter: (browserLog: Log) => boolean) {
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
async function start({
  cmd,
  additionalTimeout,
  serverIsRunningMessage,
  serverIsRunningDelay,
  debug,
}: {
  cmd: string
  additionalTimeout: number
  serverIsRunningMessage: string
  serverIsRunningDelay: number
  debug: boolean
}): Promise<RunProcess> {
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
  const timeoutTotal = TIMEOUT_NPM_SCRIPT + additionalTimeout
  const serverStartTimeout = setTimeout(() => {
    let errMsg = ''
    errMsg += `Server still didn't start after ${timeoutTotal / 1000} seconds of running the npm script \`${cmd}\`.`
    if (serverIsRunningMessage) {
      errMsg += `(The stdout of the npm script doesn't include: "${serverIsRunningMessage}".)`
    }
    rejectServerStart(new Error(errMsg))
  }, timeoutTotal)

  // Kill any process that listens to port `3000`
  if (!process.env.CI && isLinux()) {
    await runCommand('fuser -k 3000/tcp', { swallowError: true, timeout: 10 * 1000 })
  }

  const { testPath } = expect.getState()
  const cwd = pathDirname(testPath)
  const proc = startProcess(cmd, cwd)

  const prefix = `[Run Start][${cwd}][${cmd}]`

  const stdoutLogs: Log[] = []
  let hasStarted = false
  let runProcess: RunProcess
  proc.stdout.on('data', async (data: string) => {
    data = data.toString()
    const log = {
      logType: 'stdout' as const,
      logText: data,
      logTimestamp: getTimestamp(),
    }
    stdoutLogs.push(log)
    debug && printLog(log)
    const isServerStartMessage = (() => {
      if (serverIsRunningMessage) {
        return data.includes(serverIsRunningMessage)
      }
      return (
        // Express.js server
        data.startsWith('Server running at') ||
        // npm package `serve`
        data.includes('Accepting connections at') ||
        // Clouflare Workers - miniflare
        data.includes('Listening on :3000') ||
        // Clouflare Workers - wrangler
        data.includes('Ignoring stale first change')
      )
    })()
    if (isServerStartMessage) {
      await sleep(serverIsRunningDelay)
      hasStarted = true
      runProcess = { proc, cwd, cmd, printLogs, terminate }
      resolveServerStart(runProcess)
    }
  })
  const stderrLogs: Log[] = []
  proc.stderr.on('data', async (data) => {
    data = data.toString()
    const log = {
      logType: 'stderr' as const,
      logText: data,
      logTimestamp: getTimestamp(),
    }
    stderrLogs.push(log)
    debug && printLog(log)
    if (data.includes('EADDRINUSE')) {
      printLog(log)
      rejectServerStart(new Error('Port conflict? Port already in use EADDRINUSE.'))
    }
  })
  proc.on('exit', async (code) => {
    if (([0, null].includes(code) || (code === 1 && isWindows())) && hasStarted) return
    printLogs()
    printLog({
      logText: `${prefix}Unexpected process termination, exit code: ${code}`,
      logType: 'Run Start',
      logTimestamp: getTimestamp(),
    })
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
    stdoutLogs.forEach(printLog.bind(null, 'stdout'))
    stderrLogs.forEach(printLog.bind(null, 'stderr'))
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
          printLog('stdout', '=============== swallowError')
          return
        } else {
          printLog('stdout', '=============== no swallowError')
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

function printLog(log: Log & { alreadyLogged?: true }) {
  const { logType, logText, logTimestamp, alreadyLogged } = log

  let prefix: string = logType
  if (logType === 'stderr' || logType === 'Browser Error') prefix = bold(red(logType))
  if (logType === 'stdout' || logType === 'Browser Log') prefix = bold(blue(logType))

  let msg = logText
  if (!msg) msg = '' // don't know why but sometimes `logText` is `undefined`
  if (!msg.endsWith('\n')) msg = msg + '\n'

  if (alreadyLogged) {
    return
  } else {
    log.alreadyLogged = true
  }

  process.stderr.write(`[${prefix}][${logTimestamp}] ${msg}`)
}

async function autoRetry(
  test: () => void | Promise<void>,
  { timeout = TIMEOUT_AUTORETRY }: { timeout?: number } = {},
): Promise<void> {
  const period = 100
  const numberOfTries = timeout / period
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
function isGithubAction() {
  return !!process.env.CI
}
