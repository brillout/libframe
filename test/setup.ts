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

const TIMEOUT = 100 * 1000 * (!isGitHubAction() ? 1 : isLinux() ? 2 : 15)

type BrowserLog = {
  type: string
  text: string
  location: any
  args: any
}
let browserLogs: BrowserLog[] = []
function run(cmd: string, { baseUrl = '' }: { baseUrl?: string } = {}) {
  assert(typeof baseUrl === 'string')

  jest.setTimeout(TIMEOUT)

  let runProcess: RunProcess
  beforeAll(async () => {
    runProcess = await start(cmd)
    page.on('console', onConsole)
    page.setDefaultTimeout(TIMEOUT)
    await bailOnTimeout(async () => {
      await page.goto(urlBase + baseUrl)
    })
  })
  afterAll(async () => {
    page.off('console', onConsole)
    const clientErrors = browserLogs.filter(({ type }) => type === 'error')
    await page.close() // See https://github.com/vitejs/vite/pull/3097
    await terminate(runProcess, 'SIGINT')
    if (clientErrors.length !== 0) {
      runProcess.printLogs()
    }
    expect(clientErrors).toEqual([])
    browserLogs = []
  })
}
function onConsole(msg: ConsoleMessage) {
  browserLogs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
    args: msg.args()
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
}
async function start(cmd: string): Promise<RunProcess> {
  let resolveServerStart: (_: RunProcess) => void
  const promise = new Promise<RunProcess>((_resolve, _reject) => {
    resolveServerStart = (...args) => {
      clearTimeout(serverStartTimeout)
      _resolve(...args)
    }
  })
  const serverStartTimeout = setTimeout(() => {
    console.error(`Server didn't start yet (npm script: ${cmd}).`)
    process.exit(1)
  }, TIMEOUT)

  // Kill any process that listens to port `3000`
  if (!process.env.CI && isLinux()) {
    await runCommand('fuser -k 3000/tcp', { swallowError: true, timeout: TIMEOUT })
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
      runProcess = { proc, cwd, cmd, printLogs }
      resolveServerStart(runProcess)
    }
  })
  const stderr: string[] = []
  proc.stderr.on('data', async (data) => {
    data = data.toString()
    stderr.push(data)
    if (data.includes('EADDRINUSE')) {
      forceLog('stderr', data)
      process.exit(1)
    }
  })
  proc.on('exit', async (code) => {
    if (([0, null].includes(code) || (code === 1 && isWindows())) && hasStarted) return
    printLogs()
    forceLog(prefix, `Unexpected process termination, exit code: ${code}`)
    await terminate(runProcess, 'SIGKILL')
  })

  return promise

  function printLogs() {
    stdout.forEach(forceLog.bind(null, 'stdout'))
    stderr.forEach(forceLog.bind(null, 'stderr'))
  }
}

async function terminate(runProcess: RunProcess, signal: 'SIGINT' | 'SIGKILL') {
  const timeout = setTimeout(() => {
    console.error('Process termination timeout.')
    process.exit(1)
  }, TIMEOUT)
  if (runProcess) {
    await stopProcess(runProcess, signal)
    clearTimeout(timeout)
  }
}

function stopProcess(runProcess: RunProcess, signal: 'SIGINT' | 'SIGKILL') {
  const { cwd, cmd, proc } = runProcess

  const prefix = `[Run Stop][${cwd}][${cmd}]`

  let resolve: () => void
  let reject: (err: string) => void
  const promise = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  const onProcessClose = (code: number) => {
    if (code === 0 || code === null || (code === 1 && isWindows())) {
      resolve()
    } else {
      reject(`${prefix} Terminated with non-0 error code ${code}`)
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

function forceLog(std: 'stdout' | 'stderr' | string, str: string) {
  if (std === 'stderr') std = bold(red(std))
  if (std === 'stdout') std = bold(blue(std))
  process.stderr.write(`[${std}]${str}`)
}

async function autoRetry(test: () => void | Promise<void>): Promise<void> {
  const period = 100
  const numberOfTries = TIMEOUT / period
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

async function bailOnTimeout(asyncFunc: () => Promise<void>) {
  const timeout = setTimeout(() => {
    console.error(`Function timeout.`)
    process.exit(1)
  }, TIMEOUT * 1000)
  await asyncFunc()
  clearTimeout(timeout)
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
