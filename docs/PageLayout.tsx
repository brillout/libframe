import React from 'react'
import { Navigation } from './Navigation'
import type { Heading } from './processPageContext'
import { MobileHeader } from './MobileHeader'
import { EditPageNote } from './EditPageNote'
/* Won't work this this file is loaded only on the server
import './PageLayout.css'
*/

export { PageLayout }

function PageLayout({
  pageContext,
  children,
}: {
  pageContext: {
    headings: Heading[]
    activeHeading: Heading | null
    pageTitle: string | JSX.Element | null
    isLandingPage: boolean
    urlPathname: string
  }
  children: JSX.Element
}) {
  const { headings, isLandingPage, pageTitle } = pageContext
  return (
    <div
      style={{
        display: 'flex',
      }}
    >
      <Navigation headings={headings} />
      <div id="page-container" className={isLandingPage ? '' : 'doc-page'}>
        <MobileHeader />
        <div id="page-content">
          {pageTitle && <h1>{pageTitle}</h1>}
          {children}
          {!isLandingPage && <EditPageNote pageContext={pageContext} />}
        </div>
      </div>
    </div>
  )
}
