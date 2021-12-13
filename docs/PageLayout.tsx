import React from 'react'
import { Navigation } from './Navigation'
import type { Heading } from './processPageContext'
import { MobileHeader } from './MobileHeader'
import { EditPageNote } from './EditPageNote'
import { AlgoliaSearch } from './AlgoliaSearch'
/* Won't work this this file is loaded only on the server
import './PageLayout.css'
*/

export { PageLayout }

function PageLayout({
  pageContext,
  children,
}: {
  pageContext: {
    headingsWithSubHeadings: Heading[]
    pageTitle: string | JSX.Element | null
    isLandingPage: boolean
    urlPathname: string
  }
  children: JSX.Element
}) {
  const { headingsWithSubHeadings, isLandingPage, pageTitle } = pageContext
  return (
    <>
      <AlgoliaSearch />
      <div
        style={{
          display: 'flex',
        }}
      >
        <Navigation headingsWithSubHeadings={headingsWithSubHeadings} urlPathname={pageContext.urlPathname} />
        <div id="page-container" className={isLandingPage ? '' : 'doc-page'}>
          <MobileHeader />
          <div id="page-content">
            {pageTitle && <h1>{pageTitle}</h1>}
            {children}
            {!isLandingPage && <EditPageNote pageContext={pageContext} />}
          </div>
        </div>
      </div>
    </>
  )
}
