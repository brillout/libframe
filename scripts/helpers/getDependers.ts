import { readdirSync, lstatSync } from 'fs'
import { resolve as pathResolve } from 'path'
import { DIR_BOILERPLATES, DIR_EXAMPLES } from '../helpers/locations'

export { getDependers }

function getDependers() {
  return [...retrieveDirectories(DIR_EXAMPLES), ...retrieveDirectories(DIR_BOILERPLATES)]
}

function retrieveDirectories(dir: string): string[] {
  if (!dirExits(dir)) {
    return []
  }
  const directories = readdirSync(dir)
    .map((file) => pathResolve(`${dir}/${file}`))
    .filter((filePath) => lstatSync(filePath).isDirectory())
    .filter((filePath) => !filePath.includes('node_modules'))
  return directories
}

function dirExits(dir: string) {
  try {
    // `throwIfNoEntry: false` doesn't seem to work; we still need to use a try-catch block
    return !!lstatSync(dir, { throwIfNoEntry: false })
  } catch (err) {
    return false
  }
}
