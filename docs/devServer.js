import express from 'express'
import vite from 'vite'
import { createPageRenderer } from 'vite-plugin-ssr'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = `${__dirname}/../../docs`
const isProduction = false

startServer()

async function startServer() {
  const app = express()

  const viteDevServer = await vite.createServer({
    configFile: `${__dirname}/vite.config.ts`,
    root,
    server: { middlewareMode: 'ssr' },
  })
  app.use(viteDevServer.middlewares)

  const renderPage = createPageRenderer({ viteDevServer, isProduction, root })
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl
    const pageContextInit = { url }
    const pageContext = await renderPage(pageContextInit)
    if (!pageContext.httpResponse) return next()
    const { body, statusCode, contentType } = pageContext.httpResponse
    res.status(statusCode).type(contentType).send(body)
  })

  const port = 3000
  app.listen(port)
  console.log(`Server running at http://localhost:${port}`)
}
