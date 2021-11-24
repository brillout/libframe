import React from 'react'
import { TextContactUs } from '../components/TextContactUs'

export { ContactUs }

function ContactUs({ discordInvite, githubRepository }: { discordInvite: string; githubRepository: string }) {
  const style: React.CSSProperties = {
    fontSize: '1.5em',
    textAlign: 'center',
    margin: 'auto',
    padding: 'var(--header-padding)',
    maxWidth: 'var(--header-max-width)'
  }
  return (
    <p style={style}>
      Have a question? Want a feature? A tool integration is not working?{' '}
      <TextContactUs discordInvite={discordInvite} githubRepository={githubRepository} />
    </p>
  )
}
