import React from 'react'
import { Info } from './Info'
import { Link } from './Link'

export { ReadingRecommendation }

function ReadingRecommendation({ links }: { links: string[] }) {
  return (
    <Info>
      <b>Reading Recommendations.</b>
      We recommend to be familiar with following documents before proceeding.
      {links.map((link, i) => (
        <Link key={i} href={link} />
      ))}
    </Info>
  )
}
