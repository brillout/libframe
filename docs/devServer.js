const express = require('express')
const { createPageRenderer } = require('vite-plugin-ssr')
const vite = require('vite')

const root = `${__dirname}/../../docs`
const isProduction = false

startServer()

async function startServer() {
  const app = express()

  const viteDevServer = await vite.createServer({
    configFile: require.resolve('./vite.config.ts'),
    root,
    server: { middlewareMode: true }
  })
  app.use(viteDevServer.middlewares)

  const renderPage = createPageRenderer({ viteDevServer, isProduction, root })
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl
    const pageContextInit = { url }
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext
    if (!httpResponse) return next()
    const { statusCode, body } = httpResponse
    res.status(statusCode).send(body)
  })

  const port = 3000
  app.listen(port)
  console.log(`Server running at http://localhost:${port}`)
}
