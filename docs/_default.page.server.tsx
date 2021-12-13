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
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.css" />
      </head>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.js"></script>
        <script type="text/javascript"> docsearch({
        apiKey: '7d2798346ba008ae4902b49b097b6e6a',
        indexName: 'vite-pluginssr',
        inputSelector: '#search',
        debug: false // Set debug to true if you want to inspect the dropdown
        });
        </script>
      </body>
    </html>`
}
