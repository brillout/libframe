import * as execa from 'execa'
import { readdirSync, writeFileSync, readFileSync, lstatSync } from 'fs'
import * as assert from 'assert'
import {
  DIR_BOILERPLATES,
  DIR_EXAMPLES,
  DIR_SRC,
  DIR_ROOT,
  PROJECT_VERSION_FILES,
  getNpmName
} from './helpers/locations'
import * as semver from 'semver'

release()

async function release() {
  const { versionOld, versionNew } = getVersion()

  updateVersionMacro(versionOld, versionNew)

  // Update pacakge.json versions
  updatePackageJsonVersion(versionNew)
  await updateDependencies(versionNew, versionOld)
  bumpBoilerplateVersion()

  await changelog()

  await build()

  await publish()
  await publishBoilerplates()

  await updateYarnLock()

  await gitCommit(versionNew)
  await gitPush()
}

async function publish() {
  await npmPublish(DIR_SRC)
}
async function publishBoilerplates() {
  await npmPublish(DIR_BOILERPLATES)
}
async function npmPublish(cwd: string) {
  // Fix for: (see https://github.com/yarnpkg/yarn/issues/2935#issuecomment-487020430)
  // > npm ERR! need auth You need to authorize this machine using `npm adduser`
  const env = { ...process.env, npm_config_registry: undefined }
  await run('npm', ['publish'], { cwd, env })
}

async function changelog() {
  // yarn conventional-changelog -p angular -i CHANGELOG.md -s --pkg src/
  await run('yarn', ['conventional-changelog', '-p', 'angular', '-i', 'CHANGELOG.md', '-s', '--pkg', DIR_SRC])
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
  await run('yarn', ['build'])
}

async function updateYarnLock() {
  await run('yarn', ['install'])
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
function updateVersionMacro(versionOld: string, versionNew: string) {
  PROJECT_VERSION_FILES.forEach((filePath) => {
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
  const pkgPath = require.resolve(`${DIR_BOILERPLATES}/package.json`)
  const pkg = require(pkgPath)
  assert(pkg.version.startsWith('0.0.'))
  const versionParts = pkg.version.split('.')
  assert(versionParts.length === 3)
  const newPatch = parseInt(versionParts[2], 10) + 1
  pkg.version = `0.0.${newPatch}`
  writePackageJson(pkgPath, pkg)
}

async function updateDependencies(versionNew: string, versionOld: string) {
  const pkgPaths = [...retrievePkgPaths(DIR_BOILERPLATES), ...retrievePkgPaths(DIR_EXAMPLES)]
  for (const pkgPath of pkgPaths) {
    updatePkg(pkgPath, (pkg) => {
      const version = pkg.dependencies[getNpmName()]
      assert(version)
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

function retrievePkgPaths(rootDir: string): string[] {
  const directories = readdirSync(rootDir)
    .map((file) => `${rootDir}/${file}`)
    .filter((filePath) => !filePath.includes('node_modules'))
    .filter((filePath) => lstatSync(filePath).isDirectory())
  const pkgPaths = []
  for (const dir of directories) {
    const pkgPath = require.resolve(`${dir}/package.json`)
    pkgPaths.push(pkgPath)
  }
  return pkgPaths
}

function updatePkg(pkgPath: string, updater: (pkg: PackageJson) => void) {
  const pkg = require(pkgPath) as PackageJson
  updater(pkg)
  writePackageJson(pkgPath, pkg)
}

function writePackageJson(pkgPath: string, pkg: object) {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

type PackageJson = {
  version: string
  dependencies: Record<string, string>
}

async function run(cmd: string, args: string[], { cwd = DIR_ROOT, env = process.env } = {}): Promise<void> {
  const stdio = 'inherit'
  await execa(cmd, args, { cwd, stdio, env })
}

function getCliArgs(): string[] {
  const args = process.argv.slice(2)
  assert(args.length <= 1)
  return args
}
