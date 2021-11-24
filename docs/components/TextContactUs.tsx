import React from 'react'

export { TextContactUs }

function TextContactUs({ discordInvite, githubRepository }: { discordInvite: string; githubRepository: string }) {
  return (
    <>
      <a href={`https://discord.com/invite/${discordInvite}`}>Join our Discord</a> or{' '}
      <a href={`${githubRepository}/issues/new`}>open a GitHub ticket</a>.
    </>
  )
}
