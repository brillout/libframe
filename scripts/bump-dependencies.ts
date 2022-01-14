import * as execa from 'execa'
import { join, dirname } from 'path'
import { hasTest } from './helpers/hasTest'
import { DIR_ROOT } from './helpers/locations'
const ncuBin = require.resolve(`${DIR_ROOT}/node_modules/.bin/ncu`) // `ncu` is bin of npm package `npm-check-updates`

updateDependencies()

/*
const FREEZE_VUE = true
/*/
const FREEZE_VUE = false
//*/

const SKIP_LIST = ['node-fetch', '@types/node-fetch', 'p-limit', 'react-router-dom', 'react-router', 'webpack', 'miniflare']

if (FREEZE_VUE) {
  SKIP_LIST.push(...['vue', '@vue/server-renderer', '@vue/compiler-sfc', '@vitejs/plugin-vue', 'vite-plugin-md'])
}

async function updateDependencies() {
  const skipedPackageJsons = []
  for (const packageJson of await getAllPackageJson()) {
    const cwd = dirname(packageJson)
    if (!hasTest(cwd)) {
      skipedPackageJsons.push(packageJson)
      continue
    }
    const reject = SKIP_LIST.length === 0 ? '' : `--reject ${SKIP_LIST.join(',')}`
    const cmd = `${ncuBin} -u --dep dev,prod ${reject}`
    await run__follow(cmd, { cwd })
    if (!FREEZE_VUE) {
      await run__follow(`${ncuBin} -u --dep dev,prod vue --target greatest`, { cwd })
    }
  }
  console.log('[SKIPPED] Deps:\n' + JSON.stringify(SKIP_LIST, null, 2))
  console.log('[SKIPPED] package.json:\n' + JSON.stringify(skipedPackageJsons, null, 2))
}

async function getAllPackageJson() {
  const cwd = DIR_ROOT
  const files = (await run__return('git ls-files', { cwd })).split('\n')
  return files.filter((path) => path.endsWith('package.json')).map((path) => join(cwd, path))
}

async function run__follow(cmd: string, { cwd }): Promise<void> {
  const [command, ...args] = cmd.split(' ')
  await execa(command, args, { cwd, stdio: 'inherit' })
}
async function run__return(cmd: string, { cwd }): Promise<string> {
  const [command, ...args] = cmd.split(' ')
  const { stdout } = await execa(command, args, { cwd })
  return stdout
}
