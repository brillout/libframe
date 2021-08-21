const execSync = require('child_process').execSync

const args = process.argv.slice(2).join(' ')

runNpmScript('test:ts')
runNpmScript('test:jest')

function runNpmScript(scriptName: string) {
  execSync(`npm run ${scriptName} ${args}`, { stdio: 'inherit' })
}
