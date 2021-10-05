import { DIR_ROOT } from './helpers/locations'
import * as execa from 'execa'
import { dirname } from 'path'
import assert = require('assert')
import { isAbsolute, join } from 'path'
import { hasTest } from './helpers/hasTest'

bumpLockfiles()

async function bumpLockfiles() {
  const lockfiles = await getPackageLockJsonFiles()
  await removePackageLockJsonFiles(lockfiles)
  await recreatePackageLockJsonFiles(lockfiles)
  await updateYarnLock()
}

async function updateYarnLock() {
  await runCommand('rm yarn.lock')
  await runCommand('yarn install')
}

async function getPackageLockJsonFiles() {
  const files = await runCommand('git ls-files')
  const lockfiles = files
    .split('\n')
    .filter((filePath) => filePath.endsWith('package-lock.json'))
    .filter((filePath) => hasTest(dirname(filePath)))
    .map((filePath) => join(DIR_ROOT, filePath))
  return lockfiles
}

async function removePackageLockJsonFiles(lockfiles: string[]) {
  if (lockfiles.length === 0) return
  await runCommand('git rm -f ' + lockfiles.join(' '))
  await runCommand('rm -rf ' + lockfiles.map((filePath) => join(dirname(filePath), 'node_modules/')).join(' '))
  console.log(`[Done] removed package-lock.json files`)
}

async function recreatePackageLockJsonFiles(lockfiles: string[]) {
  for (const lockfile of lockfiles) {
    const cwd = dirname(lockfile)
    process.stdout.write(`Installing dependencies for: ${cwd}...`)
    await runCommand('npm install', { cwd })
    process.stdout.write(' Done.\n')
  }
}

async function runCommand(cmd: string, { cwd = DIR_ROOT }: { cwd?: string } = {}): Promise<string> {
  assert(isAbsolute(cwd))
  const [command, ...args] = cmd.split(' ')
  const { stdout } = await execa(command, args, { cwd })
  return stdout
}
