import React from 'react'
import { getFrame } from '../frame'

export { TextContactUs }

function TextContactUs() {
  return (
    <>
      <a href={getFrame().projectInfo.discordInvite}>Join our Discord</a> or{' '}
      <a href={getFrame().projectInfo.githubIssues}>open a GitHub ticket</a>.
    </>
  )
}
