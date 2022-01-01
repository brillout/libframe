import { assert, jsxToTextContent, objectAssign } from './utils'
import { getHeadings, HeadingWithoutLink, parseTitle } from './headings'
import { getFrame } from './frame'
import type { Heading } from './headings'
import type { PageContextBuiltIn } from 'vite-plugin-ssr'
import type { MarkdownHeading } from './vite.config/markdownHeadings'

export { processPageContext }
export type { PageContextOriginal }
export type { Heading }

type ReactComponent = () => JSX.Element
type PageExports = {
  headings?: MarkdownHeading[]
}
type PageContextOriginal = PageContextBuiltIn & {
  Page: ReactComponent
  pageExports: PageExports
}

function processPageContext(pageContext: PageContextOriginal) {
  const { headings, headingsWithoutLink } = getHeadings()
  const activeHeading = findActiveHeading(headings, headingsWithoutLink, pageContext)
  const headingsWithSubHeadings = getHeadingsWithSubHeadings(headings, pageContext, activeHeading)
  const { title, isLandingPage, pageTitle } = getMetaData(headingsWithoutLink, activeHeading, pageContext)
  const { logoUrl, algolia } = getFrame()
  const pageContextAdded = {}
  objectAssign(pageContextAdded, {
    meta: {
      title,
      logoUrl,
      algolia,
    },
    headings,
    headingsWithSubHeadings,
    isLandingPage,
    pageTitle,
  })
  return pageContextAdded
}

function getMetaData(
  headingsWithoutLink: HeadingWithoutLink[],
  activeHeading: Heading | null,
  pageContext: { url: string; pageExports: PageExports },
) {
  const { url } = pageContext

  let title: string
  let pageTitle: string | JSX.Element | null
  if (activeHeading) {
    title = activeHeading.titleDocument || jsxToTextContent(activeHeading.title)
    pageTitle = activeHeading.title
  } else {
    pageTitle = headingsWithoutLink.find((h) => h.url === url)!.title
    title = jsxToTextContent(pageTitle)
  }

  const isLandingPage = url === '/'
  if (!isLandingPage) {
    title += ' | ' + getFrame().projectInfo.projectName
  }

  if (isLandingPage) {
    pageTitle = null
  }

  return { title, isLandingPage, pageTitle }
}

function findActiveHeading(
  headings: Heading[],
  headingsWithoutLink: HeadingWithoutLink[],
  pageContext: { url: string; pageExports: PageExports },
): Heading | null {
  let activeHeading: Heading | null = null
  assert(pageContext.url)
  const pageUrl = pageContext.url
  headings.forEach((heading) => {
    if (heading.url === pageUrl) {
      activeHeading = heading
      assert(heading.level === 2, { pageUrl, heading })
    }
  })
  const debugInfo = {
    msg: 'Heading not found for url: ' + pageUrl,
    urls: headings.map((h) => h.url),
    url: pageUrl,
  }
  assert(activeHeading || headingsWithoutLink.find(({ url }) => pageUrl === url), debugInfo)
  return activeHeading
}

function getHeadingsWithSubHeadings(
  headings: Heading[],
  pageContext: { pageExports: PageExports; url: string },
  activeHeading: Heading | null,
): Heading[] {
  const headingsWithSubHeadings = headings.slice()
  if (activeHeading === null) return headingsWithSubHeadings
  const activeHeadingIdx = headingsWithSubHeadings.indexOf(activeHeading)
  assert(activeHeadingIdx >= 0)
  const pageHeadings = pageContext.pageExports.headings || []
  pageHeadings.forEach((pageHeading, i) => {
    const title = parseTitle(pageHeading.title)
    const url = '#' + pageHeading.id
    // `heading.css` style only works for `<h2>`
    assert(
      pageHeading.headingLevel === 2,
      'Wrong page heading level `' +
        pageHeading.headingLevel +
        '` (it should be `<h2>`) for sub-heading `' +
        pageHeading.title +
        '` of page `' +
        pageContext.url +
        '`.',
    )
    const heading: Heading = {
      url,
      title,
      parentHeadings: [activeHeading, ...activeHeading.parentHeadings],
      titleInNav: title,
      level: 3,
    }
    headingsWithSubHeadings.splice(activeHeadingIdx + 1 + i, 0, heading)
  })
  return headingsWithSubHeadings
}
