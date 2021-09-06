import { getFrame } from './frame'

import React from 'react'

export { HeaderTitle }

function HeaderTitle({ fontSize, marginLeft }: { fontSize: string; marginLeft: number }) {
  const { projectName, projectNameIsCodeSnippet } = getFrame()
  if (!projectNameIsCodeSnippet) {
    return <>{projectName}</>
  }
  return (
    <code
      style={{
        backgroundColor: '#f4f4f4',
        borderRadius: 4,
        fontSize,
        padding: '2px 5px',
        marginLeft
      }}
    >
      {projectName}
    </code>
  )
}
