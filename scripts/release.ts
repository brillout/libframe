import * as execa from 'execa'
import { writeFileSync, readFileSync } from 'fs'
import * as assert from 'assert'
import { DIR_BOILERPLATES, DIR_SRC, DIR_ROOT, getNpmName } from './helpers/locations'
import * as semver from 'semver'
import { runCommand } from './utils'
import * as path from 'path'

release()

async function release() {
  const { versionOld, versionNew } = getVersion()

  await updateVersionMacro(versionOld, versionNew)

  // Update pacakge.json versions
  updatePackageJsonVersion(versionNew)
  await updateDependencies(versionNew, versionOld)
  bumpBoilerplateVersion()

  await bumpPnpmLockFile()

  await changelog()

  await build()

  await publish()
  await publishBoilerplates()

  await gitCommit(versionNew)
  await gitPush()
}

async function publish() {
  await npmPublish(DIR_SRC)
}
async function publishBoilerplates() {
  if (!DIR_BOILERPLATES) {
    return
  }
  await npmPublish(DIR_BOILERPLATES)
}
async function npmPublish(cwd: string) {
  // Fix for: (see https://github.com/yarnpkg/yarn/issues/2935#issuecomment-487020430)
  // > npm ERR! need auth You need to authorize this machine using `npm adduser`
  const env = { ...process.env, npm_config_registry: undefined }
  await run('npm', ['publish'], { cwd, env })
}

async function changelog() {
  await run('pnpm', ['exec', 'conventional-changelog', '--preset', 'angular', '-infile', 'CHANGELOG.md', '--same-file', '--pkg', DIR_SRC])
}
async function gitCommit(versionNew: string) {
  const tag = `v${versionNew}`
  await run('git', ['commit', '-am', `release: ${tag}`])
  await run('git', ['tag', tag])
}
async function gitPush() {
  await run('git', ['push'])
  await run('git', ['push', '--tags'])
}
async function build() {
  await run('pnpm', ['run', 'build'])
}

function getVersion(): { versionNew: string; versionOld: string } {
  const pkg = require(`${DIR_SRC}/package.json`) as PackageJson
  const versionOld = pkg.version
  assert(versionOld)
  const cliArgs = getCliArgs()
  let versionNew = cliArgs[0]
  if (!versionNew) {
    versionNew = semver.inc(versionOld, 'patch')
  }
  assert(versionNew.startsWith('0.'))
  assert(versionOld.startsWith('0.'))
  return { versionNew, versionOld }
}
async function updateVersionMacro(versionOld: string, versionNew: string) {
  const cwd = DIR_ROOT
  // git -s, --stage
  //     Show staged contents' mode bits, object name and stage number in the output.
  const stdout = await run__return('git ls-files --stage', { cwd })
  stdout
    .split('\n')
    .filter((line) => line.endsWith('/projectInfo.ts'))
    .filter((line) => !line.startsWith('120000 ')) // Remove symlinks
    .forEach((line) => {
      const columns = line.split(/\s|\t/).filter(Boolean)
      const filePathRelative = columns[3]
      assert(filePathRelative.endsWith('/projectInfo.ts'))
      const filePath = `${cwd}/${filePathRelative}`
      const getCodeSnippet = (version: string) => `const PROJECT_VERSION = '${version}'`
      const codeSnippetOld = getCodeSnippet(versionOld)
      const codeSnippetNew = getCodeSnippet(versionNew)
      const contentOld = readFileSync(filePath, 'utf8')
      assert(contentOld.includes(codeSnippetOld))
      const contentNew = contentOld.replace(codeSnippetOld, codeSnippetNew)
      assert(contentNew !== contentOld)
      writeFileSync(filePath, contentNew)
    })
}
function updatePackageJsonVersion(versionNew: string) {
  updatePkg(`${DIR_SRC}/package.json`, (pkg) => {
    pkg.version = versionNew
  })
}

function bumpBoilerplateVersion() {
  if (!DIR_BOILERPLATES) {
    return
  }
  const pkgPath = require.resolve(`${DIR_BOILERPLATES}/package.json`)
  const pkg = require(pkgPath)
  assert(pkg.version.startsWith('0.0.'))
  const versionParts = pkg.version.split('.')
  assert(versionParts.length === 3)
  const newPatch = parseInt(versionParts[2], 10) + 1
  pkg.version = `0.0.${newPatch}`
  writePackageJson(pkgPath, pkg)
}

async function bumpPnpmLockFile() {
  try {
    await runCommand('pnpm install', { cwd: DIR_ROOT, timeout: 10 * 60 * 1000 })
  } catch (err) {
    if (!err.message.includes('ERR_PNPM_PEER_DEP_ISSUES')) {
      throw err
    }
  }
}

async function updateDependencies(versionNew: string, versionOld: string) {
  const pkgPaths = (await run__return('git ls-files', { cwd: DIR_ROOT }))
    .split(/\s/)
    .filter((f) => f.endsWith('package.json'))
    .filter((f) => f.startsWith('examples/') || f.startsWith('boilerplates/'))
    .filter((f) => f !== 'boilerplates/package.json')
    .map((f) => require.resolve(path.join(DIR_ROOT, f)))

  for (const pkgPath of pkgPaths) {
    updatePkg(pkgPath, (pkg) => {
      const version = pkg.dependencies[getNpmName()]
      if (!version) {
        return 'SKIP'
      }
      let versionCurrentSemver = versionOld
      let versionNewSemver = versionNew
      if (pkgPath.includes('boilerplates/boilerplate-')) {
        versionCurrentSemver = '^' + versionCurrentSemver
        versionNewSemver = '^' + versionNewSemver
      }
      assert.strictEqual(version, versionCurrentSemver)
      pkg.dependencies[getNpmName()] = versionNewSemver
    })
  }
}

function updatePkg(pkgPath: string, updater: (pkg: PackageJson) => void | 'SKIP') {
  const pkg = require(pkgPath) as PackageJson
  const skip = updater(pkg)
  if (skip === 'SKIP') {
    return
  }
  writePackageJson(pkgPath, pkg)
}

function writePackageJson(pkgPath: string, pkg: object) {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

type PackageJson = {
  version: string
  dependencies: Record<string, string>
}

async function run(cmd: string, args: string[], { cwd = DIR_ROOT, env = process.env } = {}) {
  const stdio = 'inherit'
  await execa(cmd, args, { cwd, stdio, env })
}
async function run__return(cmd: string, { cwd = DIR_ROOT } = {}): Promise<string> {
  const [command, ...args] = cmd.split(' ')
  const { stdout } = await execa(command, args, { cwd })
  return stdout
}

function getCliArgs(): string[] {
  const args = process.argv.slice(2)
  assert(args.length <= 1)
  return args
}
