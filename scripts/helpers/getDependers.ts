import { readdirSync, lstatSync } from 'fs'
import { resolve as pathResolve } from 'path'
import { DIR_BOILERPLATES, DIR_EXAMPLES } from '../helpers/locations'

export { getDependers }

function getDependers() {
  return [...retrieveDirectories(DIR_EXAMPLES), ...retrieveDirectories(DIR_BOILERPLATES)]
}

function retrieveDirectories(dir: string): string[] {
  if (lstatSync(dir, { throwIfNoEntry: false }) === undefined) {
    return []
  }
  const directories = readdirSync(dir)
    .map((file) => pathResolve(`${dir}/${file}`))
    .filter((filePath) => lstatSync(filePath).isDirectory())
    .filter((filePath) => !filePath.includes('node_modules'))
  return directories
}
