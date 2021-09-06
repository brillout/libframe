import { assert } from './utils'
import { HeadingDefinition } from './headings'

export { getFrame, setFrame }

type Frame = {
  headings: HeadingDefinition[]
  projectName: string
  projectVersion: string
  repo: string
  navHeaderMobile: React.ReactNode
  navHeader: React.ReactNode
}

let _frame: Frame

function setFrame(frame: Frame): void {
  _frame = frame
}
function getFrame(): Frame {
  assert(_frame)
  return _frame
}
