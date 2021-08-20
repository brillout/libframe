import { runCommand } from './utils'
import { dirname, resolve } from 'path'
const repoRoot = resolve(`${__dirname}/../../`)

checkTs()

export { checkTs }

async function checkTs() {
  const files = await runCommand('git ls-files', { cwd: repoRoot })
  const tsConfigs = files.split('\n').filter((file) => file.endsWith('tsconfig.json'))
  const tsProjects = tsConfigs.map(dirname)
  for (const tsProject of tsProjects) {
    const cwd = resolve(repoRoot, tsProject)
    await runCommand('npx tsc --noEmit', { cwd, timeout: 60 * 1000 })
    console.log(`[TypeScript Checked] ${tsProject}`)
  }
}
