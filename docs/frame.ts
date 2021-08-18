import { assert } from './utils'
import { HeadingDefinition } from './headings'

export { getFrame, setFrame }

type Frame = {
  headings: HeadingDefinition[]
  logoUrl: string
  projectName: string
  projectNameIsCodeSnippet: boolean
  projectVersion: string
  repo: string
}

let _frame: Frame

function setFrame(frame: Frame): void {
  _frame = frame
}
function getFrame(): Frame {
  assert(_frame)
  return _frame
}
