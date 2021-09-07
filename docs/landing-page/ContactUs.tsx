import React from 'react'

export { ContactUs }

function ContactUs({ discordInvite, githubRepoName }: { discordInvite: string; githubRepoName: string }) {
  const style: React.CSSProperties = {
    fontSize: '1.5em',
    textAlign: 'center',
    margin: 'auto',
    padding: 'var(--header-padding)',
    maxWidth: 'var(--header-max-width)'
  }
  return (
    <p style={style}>
      Have a question? Want a feature? A tool integration is not working?
      <a href={`https://discord.com/invite/${discordInvite}`}>Join our Discord</a> or{' '}
      <a href={`https://github.com/${githubRepoName}/issues/new`}>open a GitHub ticket</a>.
    </p>
  )
}
