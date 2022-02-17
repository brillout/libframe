import * as fs from 'fs'
import * as assert from 'assert'

export const DIR_ROOT = `${__dirname}/../../..`
export const DIR_BOILERPLATES = getNpmName() === 'telefunc' ? null : `${DIR_ROOT}/boilerplates`
export const DIR_EXAMPLES = `${DIR_ROOT}/examples`
export const DIR_SRC = getSrcDir()
export { getNpmName }

function getSrc() {
  const entries = getPnpmWorkspaceEntries()
  const srcS = entries.filter((name) => name === 'vite-plugin-ssr/' || name === 'telefunc/')
  assert(srcS.length === 1, String(entries))
  const src = srcS[0].slice(0, -1)
  assert(src === 'vite-plugin-ssr' || src === 'telefunc', String(entries))
  return src
}

function getSrcDir() {
  return `${DIR_ROOT}/${getSrc()}`
}

function getNpmName(): 'vite-plugin-ssr' | 'telefunc' {
  return getSrc()
}

function getPnpmWorkspaceEntries(): string[] {
  const workspaceYaml = fs.readFileSync(`${DIR_ROOT}/pnpm-workspace.yaml`, 'utf8')
  const entries = []
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
        const value = parts[1]
        entries.push(value)
      } else {
        assert(false, 'line: ' + line)
      }
    })
  return entries
}
