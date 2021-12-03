import ReactDOMServer from 'react-dom/server'
import React from 'react'
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr'
import { PageLayout } from './PageLayout'
import { processPageContext, PageContextOriginal } from './processPageContext'
import { objectAssign } from './utils'

export { render }

function render(pageContext: PageContextOriginal) {
  const { Page } = pageContext
  const pageContextAdded = processPageContext(pageContext)
  objectAssign(pageContext, pageContextAdded)
  const descriptionTag = pageContext.isLandingPage
    ? dangerouslySkipEscape(
        '<meta name="description" content="Like Next.js / Nuxt but as do-one-thing-do-it-well Vite plugin." />',
      )
    : ''
  const page = (
    <PageLayout pageContext={pageContext}>
      <Page />
    </PageLayout>
  )
  const pageHtml = ReactDOMServer.renderToString(page)
  return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <link rel="icon" href="${pageContext.meta.logoUrl}" />
        <title>${pageContext.meta.title}</title>
        ${descriptionTag}
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`
}
