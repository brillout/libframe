const execSync = require('child_process').execSync

const { args, skipTs, onlyTs } = parseArgs()
if (!skipTs) {
  runScript('test:ts')
}
if (!onlyTs) {
  runScript('test:jest')
}

function runScript(scriptName: string) {
  execSync(`pnpm run ${scriptName} ${args.join(' ')}`, { stdio: 'inherit' })
}

function parseArgs() {
  let skipTs = false
  let onlyTs = false

  if (!!process.env.TEST_FILES) {
    if (process.env.TEST_FILES === 'TYPESCRIPT') {
      onlyTs = true
    } else {
      skipTs = true
    }
  }

  let args = process.argv.slice(2)
  args = args.filter((arg) => {
    if (arg === '--skipTs') {
      skipTs = true
      return false
    }
    return true
  })

  return { onlyTs, skipTs, args }
}
