import { assert, checkType, jsxToTextContent, objectAssign } from './utils'
import { getHeadings, parseTitle } from './headings'
import { getFrame } from './frame'
import type { Heading } from './headings'
import type { PageContextBuiltIn } from 'vite-plugin-ssr'
import type { HeadingExtracted } from './vite.config/vite-plugin-mdx-export-headings'

export { processPageContext }
export type { PageContextOriginal }
export type { Heading }

type ReactComponent = () => JSX.Element
type PageExports = {
  headings?: HeadingExtracted[]
  noHeading?: true
  pageTitle?: string | JSX.Element
}
type PageContextOriginal = PageContextBuiltIn & {
  Page: ReactComponent
  pageExports: PageExports
}

type PageContextAfterProcess = {
  meta: {
    title: string
    logoUrl: string
  }
  activeHeading: Heading | null
  headings: Heading[]
  isLandingPage: boolean
  pageTitle: string | JSX.Element | null
}

function processPageContext(
  pageContext: PageContextOriginal
): asserts pageContext is PageContextOriginal & PageContextAfterProcess {
  const headings = getHeadings()
  objectAssign(pageContext, { headings })
  const activeHeading = findActiveHeading(headings, pageContext)
  addSubHeadings(headings, pageContext, activeHeading)
  const { title, isLandingPage, pageTitle } = getMetaData(activeHeading, pageContext)
  const { logoUrl } = getFrame()
  objectAssign(pageContext, {
    meta: {
      title,
      logoUrl
    },
    activeHeading,
    headings,
    isLandingPage,
    pageTitle
  })
  checkType<PageContextOriginal & PageContextAfterProcess>(pageContext)
}

function getMetaData(activeHeading: Heading | null, pageContext: { url: string; pageExports: PageExports }) {
  const { url, pageExports } = pageContext
  const isLandingPage = url === '/'

  let title: string
  let pageTitle: string | JSX.Element | null
  if (pageExports.pageTitle) {
    title = jsxToTextContent(pageExports.pageTitle)
    pageTitle = pageExports.pageTitle
  } else if (!activeHeading) {
    title = url.slice(1)
    assert(!title.startsWith('/'))
    pageTitle = null
  } else {
    title = activeHeading.titleDocument || jsxToTextContent(activeHeading.title)
    pageTitle = activeHeading.title
  }

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
  pageContext: { url: string; pageExports: PageExports }
): Heading | null {
  let activeHeading: Heading | null = null
  assert(pageContext.url)
  headings.forEach((heading) => {
    if (heading.url === pageContext.url) {
      activeHeading = heading
      assert(heading.level === 2)
      heading.isActive = true
    }
  })
  const debugInfo = {
    msg: 'Heading not found for url: ' + pageContext.url,
    urls: headings.map((h) => h.url),
    url: pageContext.url
  }
  assert(activeHeading || pageContext.pageExports.noHeading === true, debugInfo)
  return activeHeading
}

function addSubHeadings(
  headings: Heading[],
  pageContext: { pageExports: PageExports; url: string },
  activeHeading: Heading | null
) {
  if (activeHeading === null) return
  const activeHeadingIdx = headings.indexOf(activeHeading)
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
        '`.'
    )
    const heading: Heading = {
      url,
      title,
      titleInNav: title,
      parentHeading: activeHeading,
      level: 3
    }
    headings.splice(activeHeadingIdx + 1 + i, 0, heading)
  })
}
