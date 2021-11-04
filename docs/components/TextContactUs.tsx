import React from 'react'

export { TextContactUs }

function TextContactUs({ discordInvite, githubRepoName }: { discordInvite: string; githubRepoName: string }) {
  return (
    <>
      <a href={`https://discord.com/invite/${discordInvite}`}>Join our Discord</a> or{' '}
      <a href={`https://github.com/${githubRepoName}/issues/new`}>open a GitHub ticket</a>.
    </>
  )
}
