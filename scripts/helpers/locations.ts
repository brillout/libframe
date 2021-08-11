import * as assert from 'assert'

export { getNpmName }

export const DIR_ROOT = `${__dirname}/../../..`
export const DIR_BOILERPLATES = `${DIR_ROOT}/boilerplates`
export const DIR_EXAMPLES = `${DIR_ROOT}/examples`
export const DIR_SRC = getSrcDir()
export const PROJECT_VERSION_FILES = [
  `${DIR_ROOT}/docs/utils/projectInfo.ts`,
  `${DIR_SRC}/shared/utils/projectInfo.ts`
]

type PackageJson = { workspaces: string[] }
function getRootPackageJson() {
  const pkg = require(`${DIR_ROOT}/package.json`) as PackageJson
  return pkg
}

function getSrc() {
  const pkg = getRootPackageJson()
  const { workspaces } = pkg
  const srcS = workspaces.filter((workspace) => workspace === 'vite-plugin-ssr/' || workspace === 'telefunc/')
  assert(srcS.length === 1, String(workspaces))
  const src = srcS[0].slice(0, -1)
  assert(src === 'vite-plugin-ssr' || src === 'telefunc', String(workspaces))
  return src
}

function getSrcDir() {
  return `${DIR_ROOT}/${getSrc()}`
}

function getNpmName(): 'vite-plugin-ssr' | 'telefunc' {
  return getSrc()
}
