import React from 'react'
import { NavigationHeader } from './NavigationHeader'
import { Heading } from './headings'
import { assert } from './utils'
/* Won't work this this file is loaded only on the server
import './Navigation.css'
import 'highlight.js/styles/stackoverflow-light.css'
*/

export { Navigation }

function Navigation({ headings }: { headings: Heading[] }) {
  return (
    <>
      <div id="navigation-container" style={{ flexShrink: 0, borderRight: '1px solid #eee' }}>
        <NavigationHeader />
        <div id="navigation-content" style={{ position: 'relative' }}>
          {headings.map((heading, i) => {
            assert([1, 2, 3, 4].includes(heading.level), heading)
            return (
              <a
                className={[
                  'nav-item',
                  'nav-item-h' + heading.level,
                  heading.isActive && ' is-active',
                  heading.parentHeadings[0]?.isListTitle && 'nav-item-parent-is-list-heading',
                  heading.level !== headings[i - 1]?.level && 'nav-item-first-of-its-kind',
                  heading.level !== headings[i + 1]?.level && 'nav-item-last-of-its-kind',
                ]
                  .filter(Boolean)
                  .join(' ')}
                href={heading.url || undefined}
                key={i}
              >
                {heading.titleInNav}
              </a>
            )
          })}
          {/*
      <ScrollOverlay />
      */}
        </div>
      </div>
      <div id="navigation-mask" />
    </>
  )
}

function ScrollOverlay() {
  // const width = '1px'
  // const color = '#aaa'
  return (
    <div
      id="scroll-overlay"
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: '0',
        width: '100%',
        /*
        background: `linear-gradient(to right, ${color} ${width}, transparent ${width}) 0 0,
    linear-gradient(to right, ${color} ${width}, transparent ${width}) 0 100%,
    linear-gradient(to left, ${color} ${width}, transparent ${width}) 100% 0,
    linear-gradient(to left, ${color} ${width}, transparent ${width}) 100% 100%,
    linear-gradient(to bottom, ${color} ${width}, transparent ${width}) 0 0,
    linear-gradient(to bottom, ${color} ${width}, transparent ${width}) 100% 0,
    linear-gradient(to top, ${color} ${width}, transparent ${width}) 0 100%,
    linear-gradient(to top, ${color} ${width}, transparent ${width}) 100% 100%`,
        //*/
        //borderRight: `5px solid ${color}`,
        borderRight: `3px solid #666`,
        //border: `1px solid ${color}`,
        boxSizing: 'border-box',
        // backgroundColor: 'rgba(0,0,0,0.03)',
        backgroundRepeat: 'no-repeat',

        backgroundSize: '10px 10px',
      }}
    />
  )
}
