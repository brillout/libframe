import React from 'react'
import { Info } from './Info'
import { Link } from './Link'

export { ReadingRecommendation }

function ReadingRecommendation({ tour, links }: { tour?: true; links: string[] }) {
  return (
    <Info>
      <b>Reading Recommendation.</b>
      <p>We recommend to be familiar with the following before proceeding.</p>
      <ul>
        {tour && (
          <li>
            <Link href={'/react-tour'} noBreadcrumb={true} /> or <Link href={'/vue-tour'} noBreadcrumb={true} />
          </li>
        )}
        {links.map((link, i) => (
          <li>
            <Link key={i} href={link} />
          </li>
        ))}
      </ul>
    </Info>
  )
}
