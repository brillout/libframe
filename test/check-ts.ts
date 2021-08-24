import { runCommand } from './utils'
import { dirname, resolve } from 'path'
const repoRoot = resolve(`${__dirname}/../../`)

checkTs()

export { checkTs }

async function checkTs() {
  const files = await runCommand('git ls-files', { cwd: repoRoot })
  let tsConfigs = files.split('\n').filter((filePath) => filePath.endsWith('tsconfig.json'))

  const filterWords = process.argv.slice(2)
  if (filterWords.length > 0) {
    tsConfigs = tsConfigs.filter((filePath) => {
      for (const word of filterWords) {
        if (!filePath.includes(word)) {
          return false
        }
      }
      return true
    })
  }

  const tsProjects = tsConfigs.map(dirname)
  for (const tsProject of tsProjects) {
    const cwd = resolve(repoRoot, tsProject)
    await runCommand('npx tsc --noEmit', { cwd, timeout: 10 * 1000 })
    console.log(`[TypeScript Checked] ${tsProject}`)
  }
}
