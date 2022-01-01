import { assert } from './utils'
import type { HeadingDefinition, HeadingWithoutLink } from './headings'

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
  algolia: {
    appId: string
    apiKey: string
    indexName: string
  }
  headings: HeadingDefinition[]
  headingsWithoutLink: HeadingWithoutLink[]
  navHeaderMobile: React.ReactNode
  navHeader: React.ReactNode
  titleNormalCase: boolean
}

let _frame: Frame

function setFrame(frame: Frame): void {
  _frame = frame
}
function getFrame(): Frame {
  assert(_frame)
  return _frame
}
