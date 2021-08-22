const execSync = require('child_process').execSync

let args = process.argv.slice(2)
let skipTs = false
args = args.filter((arg) => {
  if (arg === '--skipTs') {
    skipTs = true
    return false
  }
  return true
})

if (!skipTs) {
  runScript('test:ts')
}
runScript('test:jest')

function runScript(scriptName: string) {
  execSync(`yarn ${scriptName} ${args.join(' ')}`, { stdio: 'inherit' })
}
