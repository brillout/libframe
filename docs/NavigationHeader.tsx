import React from 'react'
import iconGithub from './icons/github.svg'
import iconTwitter from './icons/twitter.svg'
import iconDiscord from './icons/discord.svg'
import iconChangelog from './icons/changelog.svg'
import { getFrame } from './frame'
import { HeaderTitle } from './HeaderTitle'

export { NavigationHeader }

function NavigationHeader() {
  const SIZE = 55
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <a
        id="navigation-header-logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'inherit',
          justifyContent: 'left',
          textDecoration: 'none',
          paddingTop: 20,
          paddingBottom: 11
        }}
        href="/"
      >
        <img src={getFrame().logoUrl} height={SIZE} width={SIZE} />
        <HeaderTitle fontSize={'1.55em'} marginLeft={10} />
      </a>
      <Links />
    </div>
  )
}

function Links() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingTop: 0,
        justifyContent: 'left'
      }}
    >
      <SocialLink className="decolorize-4" icon={iconGithub} href={getFrame().repo} />
      <SocialLink className="decolorize-6" icon={iconDiscord} href="https://discord.gg/qTq92FQzKb" />
      <SocialLink className="decolorize-7" icon={iconTwitter} href="https://twitter.com/brillout" />
      <ChangelogButton />
    </div>
  )
}

function ChangelogButton() {
  return (
    <a
      href={`${getFrame().repo}/blob/master/CHANGELOG.md`}
      className="button colorize-on-hover"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1px 7px',
        marginLeft: 2,
        fontSize: '0.97em',
        color: 'inherit'
      }}
    >
      <span className="decolorize-7">v{getFrame().projectVersion}</span>
      <img className="decolorize-6" src={iconChangelog} height={16} style={{ marginLeft: 5 }} />
    </a>
  )
}

function SocialLink({ className, icon, href }: { className: string; icon: string; href: string }) {
  return (
    <>
      <a
        className={'colorize-on-hover ' + className}
        href={href}
        style={{ padding: 3, display: 'inline-block', lineHeight: 0 }}
      >
        <img src={icon} height="20" style={{}} />
      </a>
    </>
  )
}
