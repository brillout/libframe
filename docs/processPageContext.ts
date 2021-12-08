import { assert, jsxToTextContent, objectAssign } from './utils'
import { getHeadings, HeadingWithoutLink, parseTitle } from './headings'
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
}
type PageContextOriginal = PageContextBuiltIn & {
  Page: ReactComponent
  pageExports: PageExports
}

function processPageContext(pageContext: PageContextOriginal) {
  const { headings, headingsWithoutLink } = getHeadings()
  const activeLink = findActiveHeading(headings, headingsWithoutLink, pageContext)
  const headingsWithSubHeadings = getHeadingsWithSubHeadings(headings, pageContext, activeLink)
  const { title, isLandingPage, pageTitle } = getMetaData(headingsWithoutLink, activeLink, pageContext)
  const { logoUrl } = getFrame()
  const pageContextAdded = {}
  objectAssign(pageContextAdded, {
    meta: {
      title,
      logoUrl,
    },
    activeLink,
    headings,
    headingsWithSubHeadings,
    isLandingPage,
    pageTitle,
  })
  return pageContextAdded
}

function getMetaData(
  headingsWithoutLink: HeadingWithoutLink[],
  activeLink: Heading | null,
  pageContext: { url: string; pageExports: PageExports },
) {
  const { url } = pageContext

  let title: string
  let pageTitle: string | JSX.Element | null
  if (activeLink) {
    title = activeLink.titleDocument || jsxToTextContent(activeLink.title)
    pageTitle = activeLink.title
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
  let activeLink: Heading | null = null
  assert(pageContext.url)
  const pageUrl = pageContext.url
  headings.forEach((heading) => {
    if (heading.url === pageUrl) {
      activeLink = heading
      assert(heading.level === 2)
    }
  })
  const debugInfo = {
    msg: 'Heading not found for url: ' + pageUrl,
    urls: headings.map((h) => h.url),
    url: pageUrl,
  }
  assert(activeLink || headingsWithoutLink.find(({ url }) => pageUrl === url), debugInfo)
  return activeLink
}

function getHeadingsWithSubHeadings(
  headings: Heading[],
  pageContext: { pageExports: PageExports; url: string },
  activeLink: Heading | null,
): Heading[] {
  const headingsWithSubHeadings = headings.slice()
  if (activeLink === null) return headingsWithSubHeadings
  const activeLinkIdx = headingsWithSubHeadings.indexOf(activeLink)
  assert(activeLinkIdx >= 0)
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
      parentHeadings: [...activeLink.parentHeadings, activeLink],
      titleInNav: title,
      level: 3,
    }
    headingsWithSubHeadings.splice(activeLinkIdx + 1 + i, 0, heading)
  })
  return headingsWithSubHeadings
}
