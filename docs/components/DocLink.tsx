import React from 'react'
import { getHeadings, Heading } from '../headings'
import { assert } from '../utils'

export { DocLink }

function DocLink({ href }: { href: string }) {
  const title = getTitle(href)
  return <a href={href}>{title}</a>
}

function getTitle(href: string): JSX.Element {
  const heading = findHeading(href)
  return (
    <>
      {[...heading.parentHeadings, heading].map(({ title }, i) => {
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

function findHeading(href: string): Heading {
  const headings = getHeadings()
  const heading = headings.find(({ url }) => href === url)
  assert(heading, `Could not find page \`${href}\`. Does it exist?`)
  return heading
}
