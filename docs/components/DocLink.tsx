import React from 'react'
import { getHeadings, Heading, HeadingWithoutLink } from '../headings'
import { assert } from '../utils'

export { DocLink }

function DocLink({ href, text }: { href: string, text?: string }) {
  return <a href={href}>{text || getTitle(href)}</a>
}

function getTitle(href: string): JSX.Element {
  const heading = findHeading(href)
  const breadcrumbs: (string | JSX.Element)[] = []
  if ('parentHeadings' in heading) {
    breadcrumbs.push(...heading.parentHeadings.map(({ title }) => title))
  }
  breadcrumbs.push(heading.title)
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
  assert(href.startsWith('/'))
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
