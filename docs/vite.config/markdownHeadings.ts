import { assert, determineSectionUrlHash } from '../utils'

export { MarkdownHeading }
export { markdownHeadings }

type MarkdownHeading = {
  title: string
  id: string
  headingLevel: number
  titleAddendum?: string
}

function markdownHeadings() {
  return {
    name: 'mdx-headings',
    enforce: 'pre',
    transform: async (code: string, id: string) => {
      if (!id.endsWith('.mdx')) {
        return
      }
      const codeNew = transform(code)
      return codeNew
    },
  }
}

function transform(code: string) {
  const headings: MarkdownHeading[] = []
  let isCodeBlock = false
  let codeNew = code
    .split('\n')
    .map((line) => {
      // Skip code blocks, e.g.
      // ~~~md
      // # Markdown Example
      // Bla
      // ~~~
      if (line.startsWith('~~~') || line.startsWith('```')) {
        isCodeBlock = !isCodeBlock
        return line
      }
      if (isCodeBlock) {
        return line
      }

      if (line.startsWith('#')) {
        const { id, headingLevel, title, headingHtml } = parseMarkdownHeading(line)
        headings.push({ id, headingLevel, title })
        return headingHtml
      }
      if (line.startsWith('<h')) {
        assert(false)
      }

      return line
    })
    .join('\n')
  const headingsExportCode = `export const headings = [${headings
    .map((heading) => JSON.stringify(heading))
    .join(', ')}];`
  codeNew += `\n\n${headingsExportCode}\n`
  return codeNew
}

function parseMarkdownHeading(line: string): MarkdownHeading & { headingHtml: string } {
  const [lineBegin, ...lineWords] = line.split(' ')
  assert(lineBegin.split('#').join('') === '', { line, lineWords })
  const headingLevel = lineBegin.length

  const titleMdx = lineWords.join(' ')
  assert(!titleMdx.startsWith(' '), { line, lineWords })
  assert(titleMdx, { line, lineWords })

  const id = determineSectionUrlHash(titleMdx)
  const title = titleMdx

  const headingHtml = `<h${headingLevel} id="${id}">${title}</h${headingLevel}>`

  const heading = { headingLevel, title, id, headingHtml }
  return heading
}
