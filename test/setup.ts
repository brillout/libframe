import { spawn } from 'child_process'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { dirname, resolve } from 'path'
import { ConsoleMessage, Page } from 'playwright-chromium'
import { runCommand, sleep } from './utils'
import { red, bold, blue } from 'kolorist'
import fetch from 'node-fetch'
import assert from 'assert'

export const urlBase = 'http://localhost:3000'
export { partRegex } from '@brillout/part-regex'
export const page: Page = (global as any).page as Page
export { autoRetry }
export { fetchHtml }
export { fetch }
export { expectBrowserError }
export { run }
export { isMinNodeVersion }
export { isGithubAction }
export { isLinux }
export { isWindows }
export { sleep }

const TIMEOUT_NPM_SCRIPT = 30 * 1000 * (!isGithubAction() ? 1 : isLinux() ? 1 : 4)
const TIMEOUT_JEST = 30 * 1000 * (!isGithubAction() ? 1 : isLinux() ? 6 : 6)
const TIMEOUT_AUTORETRY = 10 * 1000 * (!isGithubAction() || isLinux() ? 1 : 20) // TODO reduce `20`
const TIMEOUT_PROCESS_TERMINATION = 10 * 1000 * (!isGithubAction() ? 1 : isLinux() ? 1 : 4)
const TIMEOUT_PLAYWRIGHT = TIMEOUT_JEST
//const TIMEOUT_PAGE_LOAD = TIMEOUT_PLAYWRIGHT

type Log = {
  logType: 'stdout' | 'stderr' | 'Browser Error' | 'Browser Log' | 'Run Start' | 'Jest' | 'process'
  logText: string
  logTimestamp: string
}
let logs: Log[] = []
function run(
  cmd: string,
  {
    //baseUrl = '',
    additionalTimeout = 0,
    serverIsReadyMessage,
    serverIsReadyDelay = 1000,
    debug = process.argv.includes('--debug'),
    prepare,
  }: {
    //baseUrl?: string
    additionalTimeout?: number
    serverIsReadyMessage?: string
    serverIsReadyDelay?: number
    debug?: boolean
    prepare?: string
  } = {},
) {
  //assert(typeof baseUrl === 'string')

  const testContext = {
    cmd,
    prepare,
    cwd: getCwd(),
    testName: getTestName(),
    additionalTimeout,
    serverIsReadyMessage,
    serverIsReadyDelay,
    debug,
  }

  logJestStep('run start')

  jest.setTimeout(TIMEOUT_JEST + additionalTimeout)

  let runProcess: RunProcess | null = null
  beforeAll(async () => {
    logJestStep('beforeAll start')

    // https://stackoverflow.com/questions/42000137/check-if-test-failed-in-aftereach-of-jest/62557472#62557472
    ;(jasmine as any).getEnv().addReporter({
      specStarted: (result: unknown) => ((jasmine as any).currentTest = result),
    })

    runProcess = await start(testContext)
    logJestStep('run done')

    page.on('console', onConsole)
    page.on('pageerror', onPageError)

    // This setting will change the default maximum time for all the methods accepting timeout option.
    // https://playwright.dev/docs/api/class-page#page-set-default-timeout
    page.setDefaultTimeout(TIMEOUT_PLAYWRIGHT + additionalTimeout)

    /*
    await bailOnTimeout(
      async () => {
        await page.goto(urlBase + baseUrl)
      },
      { timeout: TIMEOUT_PAGE_LOAD + additionalTimeout },
    )
    */

    logJestStep('beforeAll end')
  })
  afterAll(async () => {
    logJestStep('afterAll start')

    page.off('console', onConsole)
    page.off('pageerror', onPageError)

    const testHasFailed = (jasmine as any).currentTest.failedExpectations.length > 0
    const clientHasErrors = logs.filter(({ logType }) => logType === 'Browser Error').length > 0
    if (testHasFailed || clientHasErrors) {
      logs.forEach((log) => printLog(log, testContext))
    }
    logs = []

    await page.close() // See https://github.com/vitejs/vite/pull/3097

    // `runProcess` is `undefined` if `start()` failed.
    if (runProcess) {
      await runProcess.terminate('SIGINT')
    }

    // Make Jest consider the test as failing
    expect(clientHasErrors).toEqual(false)

    logJestStep('afterAll end')
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
    debug && printLog(browserLog, testContext)
    logs.push(browserLog)
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
    debug && printLog(browserLog, testContext)
    logs.push(browserLog)
  }

  function logJestStep(stepName: string) {
    if (!debug) {
      return
    }
    printLog(
      {
        logType: 'Jest',
        logText: stepName,
        logTimestamp: getTimestamp(),
      },
      testContext,
    )
  }
}
function getTimestamp() {
  const now = new Date()
  const time = now.toTimeString().split(' ')[0]
  const milliseconds = now.getTime().toString().split('').slice(-3).join('')
  const timestamp = time + '.' + milliseconds
  return timestamp
}
function expectBrowserError(browserLogFilter: (browserLog: Log) => boolean) {
  let found = false
  logs = logs.filter((browserLog) => {
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
  terminate: (signal: 'SIGINT' | 'SIGKILL') => Promise<void>
}
async function start(testContext: {
  cmd: string
  cwd: string
  additionalTimeout: number
  serverIsReadyMessage?: string
  serverIsReadyDelay: number
  debug: boolean
  testName: string
}): Promise<RunProcess> {
  const { cmd, additionalTimeout, serverIsReadyMessage, serverIsReadyDelay } = testContext

  let hasStarted = false
  let resolveServerStart: () => void
  let rejectServerStart: (err: Error) => void
  const promise = new Promise<RunProcess>((_resolve, _reject) => {
    resolveServerStart = () => {
      hasStarted = true
      clearTimeout(serverStartTimeout)
      const runProcess = { terminate }
      _resolve(runProcess)
    }
    rejectServerStart = async (err: Error) => {
      clearTimeout(serverStartTimeout)
      try {
        await terminate('SIGKILL')
      } catch (err) {
        logs.push({
          logType: 'process' as const,
          logText: String(err),
          logTimestamp: getTimestamp(),
        })
      }
      _reject(err)
    }
  })

  const timeoutTotal = TIMEOUT_NPM_SCRIPT + additionalTimeout
  const serverStartTimeout = setTimeout(() => {
    let errMsg = ''
    errMsg += `Server still didn't start after ${timeoutTotal / 1000} seconds of running the npm script \`${cmd}\`.`
    if (serverIsReadyMessage) {
      errMsg += ` (The stdout of the npm script did not include: "${serverIsReadyMessage}".)`
    }
    rejectServerStart(new Error(errMsg))
  }, timeoutTotal)

  // Kill any process that listens to port `3000`
  if (!process.env.CI && isLinux()) {
    await runCommand('fuser -k 3000/tcp', { swallowError: true, timeout: 10 * 1000 })
  }

  const { terminate } = startScript(cmd, testContext, {
    async onStdout(data: string) {
      const serverIsReady = (() => {
        if (serverIsReadyMessage) {
          return data.includes(serverIsReadyMessage)
        }
        return (
          // Express.js server
          data.includes('Server running at') ||
          // npm package `serve`
          data.includes('Accepting connections at')
        )
      })()
      if (serverIsReady) {
        assert(serverIsReadyDelay)
        await sleep(serverIsReadyDelay)
        resolveServerStart()
      }
    },
    onStderr(data: string) {
      if (data.includes('EADDRINUSE')) {
        rejectServerStart(new Error('Port conflict? Port already in use EADDRINUSE.'))
      }
    },
    async onError(err: Error) {
      rejectServerStart(err as Error)
    },
    onExit() {
      const isExpected = hasStarted === true
      return isExpected
    },
  })

  return promise
}

function stopProcess({
  proc,
  cwd,
  cmd,
  signal,
}: {
  proc: ChildProcessWithoutNullStreams
  cwd: string
  cmd: string
  signal: 'SIGINT' | 'SIGKILL'
}) {
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
    assert(proc.pid)
    const processGroup = -1 * proc.pid
    process.kill(processGroup, signal)
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

function startScript(
  cmd: string,
  testContext: { cwd: string; debug: boolean; testName: string; cmd: string },
  {
    onStdout,
    onStderr,
    onError,
    onExit,
  }: {
    onStdout: (data: string) => void | Promise<void>
    onStderr: (data: string) => void | Promise<void>
    onError: (err: Error) => void | Promise<void>
    onExit: () => boolean
  },
) {
  let [command, ...args] = cmd.split(' ')
  let detached = true
  if (isWindows()) {
    detached = false
    if (command === 'npm' || command === 'pnpm') {
      command = command + '.cmd'
    }
  }
  const { cwd, debug } = testContext
  const proc = spawn(command, args, { cwd, detached })

  const prefix = `[Run Start][${cwd}][${cmd}]`

  proc.stdin.on('data', async (data: string) => {
    onError(new Error(`Command is \`${cmd}\` (${cwd}) is invoking \`stdin\`: ${data}.`))
  })
  proc.stdout.on('data', async (data: string) => {
    data = data.toString()
    const log = {
      logType: 'stdout' as const,
      logText: data,
      logTimestamp: getTimestamp(),
    }
    logs.push(log)
    debug && printLog(log, testContext)
    onStdout(data)
  })
  proc.stderr.on('data', async (data) => {
    data = data.toString()
    const log = {
      logType: 'stderr' as const,
      logText: data,
      logTimestamp: getTimestamp(),
    }
    logs.push(log)
    printLog(log, testContext)
    onStderr(data)
  })
  proc.on('exit', async (code) => {
    const exitIsExpected = onExit ? onExit() : true
    if (([0, null].includes(code) || (code === 1 && isWindows())) && exitIsExpected) return
    printLog(
      {
        logText: `${prefix} Unexpected premature process termination, exit code: ${code}`,
        logType: 'Run Start',
        logTimestamp: getTimestamp(),
      },
      testContext,
    )
    try {
      await terminate('SIGKILL')
    } catch (err: unknown) {
      onError(err as Error)
    }
  })

  return { terminate }

  async function terminate(signal: 'SIGINT' | 'SIGKILL') {
    let resolve!: () => void
    let reject!: (err: Error) => void
    const promise = new Promise<void>((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })

    const timeout = setTimeout(() => {
      reject(new Error('Process termination timeout. Cmd: ' + cmd))
    }, TIMEOUT_PROCESS_TERMINATION)
    assert(proc)
    await stopProcess({
      proc,
      cwd,
      cmd,
      signal,
    })
    clearTimeout(timeout)
    resolve()

    return promise
  }
}

function printLog(log: Log & { alreadyLogged?: true }, testContext: { testName: string; cmd: string }) {
  const { logType, logText, logTimestamp } = log

  let prefix: string = logType
  if (logType === 'stderr' || logType === 'Browser Error') prefix = bold(red(logType))
  if (logType === 'stdout' || logType === 'Browser Log') prefix = bold(blue(logType))

  let msg = logText
  if (!msg) msg = '' // don't know why but sometimes `logText` is `undefined`
  if (!msg.endsWith('\n')) msg = msg + '\n'

  if (log.alreadyLogged) {
    return
  } else {
    log.alreadyLogged = true
  }

  const { testName, cmd } = testContext
  process.stderr.write(`[${logTimestamp}][${prefix}][${testName}][${cmd}] ${msg}`)
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

/*
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
*/

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

function getCwd() {
  const testFilePath = getTestFilePath()
  const cwd = dirname(testFilePath)
  return cwd
}
function getTestName() {
  const testFilePath = getTestFilePath()
  const pathRelative = removeRootDir(testFilePath)
  if (testFilePath.includes('examples')) {
    return dirname(pathRelative)
  } else {
    return pathRelative
  }
}

function removeRootDir(filePath: string) {
  const rootDir = resolve(__dirname, '../../')
  assert(filePath.startsWith(rootDir))
  return filePath.slice(rootDir.length)
}

function getTestFilePath() {
  const { testPath } = expect.getState()
  return testPath
}
