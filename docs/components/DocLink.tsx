import React from 'react'
import { getHeadings, Heading, HeadingWithoutLink } from '../headings'
import { assert, determineSectionTitle } from '../utils'

export { DocLink }

function DocLink({ href, text, noBreadcrumb }: { href: string; text?: string; noBreadcrumb?: true }) {
  return <a href={href}>{text || getTitle(href, noBreadcrumb)}</a>
}

function getTitle(href: string, noBreadcrumb?: true): string | JSX.Element {
  let urlHash: string | null = null
  let hrefWithoutHash: string = href
  if (href.includes('#')) {
    ;[hrefWithoutHash, urlHash] = href.split('#')
  }
  const heading = findHeading(hrefWithoutHash)

  const pageTitle = heading.title
  if (noBreadcrumb) {
    return pageTitle
  }

  const breadcrumbs: (string | JSX.Element)[] = []

  if ('parentHeadings' in heading) {
    breadcrumbs.push(
      ...heading.parentHeadings
        .slice()
        .reverse()
        .map(({ title }) => title),
    )
  }

  breadcrumbs.push(pageTitle)

  if (urlHash) {
    breadcrumbs.push(determineSectionTitle(href))
  }

  return (
    <>
      {breadcrumbs.map((title, i) => {
        const seperator = i === 0 ? <></> : ' > '
        return (
          <React.Fragment key={i}>
            {seperator}
            {title}
          </React.Fragment>
        )
      })}
    </>
  )
}

function findHeading(href: string): Heading | HeadingWithoutLink {
  assert(href.startsWith('/'), `\`href==='${href}'\` but should start with \`/\`.`)
  const { headings, headingsWithoutLink } = getHeadings()
  {
    const heading = headingsWithoutLink.find(({ url }) => href === url)
    if (heading) {
      return heading
    }
  }
  const heading = headings.find(({ url }) => href === url)
  assert(heading, `Could not find page \`${href}\`. Does it exist?`)
  return heading
}
