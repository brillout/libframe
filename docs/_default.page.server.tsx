import ReactDOMServer from 'react-dom/server'
import React from 'react'
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr'
import { PageLayout } from './PageLayout'
import { processPageContext, PageContextOriginal } from './processPageContext'
import { objectAssign } from './utils'
import { DocSearchId } from './DocSearch'

export { render }

function render(pageContext: PageContextOriginal) {
  const { Page } = pageContext
  const pageContextAdded = processPageContext(pageContext)
  objectAssign(pageContext, pageContextAdded)

  const page = (
    <PageLayout pageContext={pageContext}>
      <Page />
    </PageLayout>
  )

  const descriptionTag = pageContext.isLandingPage
    ? dangerouslySkipEscape(
        '<meta name="description" content="Like Next.js / Nuxt but as do-one-thing-do-it-well Vite plugin." />',
      )
    : ''

  const algoliaCSS = !pageContext.meta.algolia
    ? ''
    : escapeInject`
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@alpha" />
  `
  const algoliaJS = !pageContext.meta.algolia
    ? ''
    : escapeInject`
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@docsearch/js@alpha"></script>
    <script type="text/javascript">
      docsearch({
        appId: '${pageContext.meta.algolia.appId}',
        apiKey: '${pageContext.meta.algolia.apiKey}',
        indexName: '${pageContext.meta.algolia.indexName}',
        container: '#${DocSearchId.DESKTOP}',
      })
      docsearch({
        appId: '${pageContext.meta.algolia.appId}',
        apiKey: '${pageContext.meta.algolia.apiKey}',
        indexName: '${pageContext.meta.algolia.indexName}',
        container: '#${DocSearchId.MOBILE}',
      })
    </script>
  `

  const pageHtml = ReactDOMServer.renderToString(page)
  return escapeInject`<!DOCTYPE html>
    <html>
      <head>
        <link rel="icon" href="${pageContext.meta.logoUrl}" />
        <title>${pageContext.meta.title}</title>
        ${descriptionTag}
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
        ${algoliaCSS}
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
        ${algoliaJS}
      </body>
    </html>`
}
