import * as fs from 'fs'
import * as assert from 'assert'

export const DIR_ROOT = `${__dirname}/../../..`
export const DIR_BOILERPLATES = getNpmName() === 'telefunc' ? null : `${DIR_ROOT}/boilerplates`
export const DIR_EXAMPLES = `${DIR_ROOT}/examples`
export const DIR_SRC = getSrcDir()
export { getNpmName }

function getSrc() {
  const packages = getMonorepoPackages()
  const srcS = packages.filter((name) => name === 'vite-plugin-ssr/' || name === 'telefunc/')
  assert(srcS.length === 1, String(packages))
  const src = srcS[0].slice(0, -1)
  assert(src === 'vite-plugin-ssr' || src === 'telefunc', String(packages))
  return src
}

function getSrcDir() {
  return `${DIR_ROOT}/${getSrc()}`
}

function getNpmName(): 'vite-plugin-ssr' | 'telefunc' {
  return getSrc()
}

function getMonorepoPackages(): string[] {
  const workspaceYaml = fs.readFileSync(`${DIR_ROOT}/pnpm-workspace.yaml`, 'utf8')
  const packages = []
  workspaceYaml
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      if (line === 'packages:') {
        return
      } else if (line.startsWith("  - '")) {
        assert(line.endsWith("'"))
        const parts = line.split("'")
        assert(parts.length === 3 && parts[2] === '', JSON.stringify({ line, parts }))
        packages.push(parts[1])
      } else {
        assert(false, 'line: ' + line)
      }
    })
  return packages
}
