import { assert } from './utils'
import { HeadingDefinition } from './headings'

export { getFrame, setFrame }

type Frame = {
  projectInfo: {
    githubRepository: string
    githubIssues: string
    projectName: string
    projectVersion: string
    discordInvite: string
    twitterProfile: string
  }
  logoUrl: string
  headings: HeadingDefinition[]
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
