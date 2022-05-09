export { editFile }
export { editFileRevert }
export { editFileAssertReverted }

import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { callsite } from './utils'

const filesContentOriginal: Record<string, string> = {}

function editFile(filePathRelative: string, replacer: (fileContent: string) => string) {
  const filePath = getFilePath(filePathRelative)
  let fileContent = fs.readFileSync(filePath, 'utf8')
  if (!(filePath in filesContentOriginal)) {
    filesContentOriginal[filePath] = fileContent
  }
  fileContent = replacer(fileContent)
  fs.writeFileSync(filePath, fileContent)
}

function editFileRevert() {
  Object.entries(filesContentOriginal).forEach(([filePath, fileContent]) => {
    fs.writeFileSync(filePath, fileContent)
    delete filesContentOriginal[filePath]
  })
}

function editFileAssertReverted() {
  expect(filesContentOriginal).toEqual({})
  assert(Object.keys(filesContentOriginal).length === 0)
}

function getFilePath(filePathRelative: string) {
  const stack = callsite()
  console.log(stack.map((s) => s.getFileName()))
  const cwd = path.dirname(stack[2].getFileName())
  const filePath = require.resolve(filePathRelative, { paths: [cwd] })
  return filePath
}
