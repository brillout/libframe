import React from 'react'
import { assert } from '../utils'
import { getFrame } from '../frame'

export { RepoLink }

function RepoLink({
  path,
  text,
  editMode,
  textAddendum
}: {
  path: string
  text?: string | JSX.Element
  editMode?: true
  textAddendum?: string
}) {
  assert(path.startsWith('/') || path.startsWith('.github/'))
  text = text || path
  if (textAddendum) {
    text += textAddendum
  }
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  const viewMode = (editMode && 'edit') || (path.endsWith('/') && 'tree') || 'blob'
  const { repo } = getFrame()
  assert(repo.startsWith('https://github.com/'))
  const href = `${repo}/${viewMode}/master${path}`
  return <a href={href}>{text}</a>
}
