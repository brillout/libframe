const execSync = require('child_process').execSync

const args = process.argv.slice(2).join(' ')

runScript('test:ts')
runScript('test:jest')

function runScript(scriptName: string) {
  execSync(`yarn ${scriptName} ${args}`, { stdio: 'inherit' })
}
