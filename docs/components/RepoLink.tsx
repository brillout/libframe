import React from 'react'
import { assert } from '../utils'
import { getFrame } from '../frame'

export { RepoLink }
export { isRepoLink }

function isRepoLink(href: string) {
  return href.startsWith('/examples/') || href.startsWith('/docs/') || href.startsWith('.github/')
}

function RepoLink({ path, text, editMode }: { path: string; text?: string | JSX.Element; editMode?: true }) {
  assert(isRepoLink(path), { path })
  text = text || path
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  const viewMode = (editMode && 'edit') || (path.endsWith('/') && 'tree') || 'blob'
  const { githubRepository } = getFrame().projectInfo
  assert(githubRepository.startsWith('https://github.com/'))
  const href = `${githubRepository}/${viewMode}/master${path}`
  return <a href={href}>{text}</a>
}
