import React from 'react'
import iconGithub from './icons/github.svg'
import iconTwitter from './icons/twitter.svg'
import iconDiscord from './icons/discord.svg'
import iconChangelog from './icons/changelog.svg'
import { getFrame } from './frame'

export { NavigationHeader }

function NavigationHeader() {
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
        {getFrame().navHeader}
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
      <SocialLink className="decolorize-4" icon={iconGithub} href={getFrame().projectInfo.githubRepository} />
      <SocialLink className="decolorize-6" icon={iconDiscord} href={getFrame().projectInfo.discordInvite} />
      <SocialLink className="decolorize-7" icon={iconTwitter} href={getFrame().projectInfo.twitterProfile} />
      <ChangelogButton />
    </div>
  )
}

function ChangelogButton() {
  return (
    <a
      href={`${getFrame().projectInfo.githubRepository}/blob/master/CHANGELOG.md`}
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
      <span className="decolorize-7">v{getFrame().projectInfo.projectVersion}</span>
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
