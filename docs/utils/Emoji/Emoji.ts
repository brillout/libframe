import React from 'react'
import iconMechanicalArm from './mechanical-arm.svg'
//import iconMountain from './mountain.svg'
import iconCompass from './compass.svg'
import iconRoadFork from './road-fork.svg'
import iconShield from './shield.svg'
import iconTypescript from './typescript.svg'
import { assert } from '../assert'

export { Emoji }
export type { EmojiName }

type EmojiName =
  | 'typescript'
  | 'shield'
  | 'mechanical-arm'
  | 'mountain'
  | 'rocket'
  | 'wrench'
  | 'compass'
  | 'seedling'
  | 'books'
  | 'plug'
  | 'earth'
  | 'gear'
  | 'red-heart'
  | 'high-voltage'
  | 'gem-stone'
  | 'dizzy'
  | 'sparkles'
  | 'writing-hang'
  | 'road-fork'

function Emoji({ name, style }: { name: EmojiName; style?: React.CSSProperties }): JSX.Element {
  const emoji =
    /* ======= Unused ========
    // ***
    // U+1FAA8
    // https://emojipedia.org/rock/
    // https://www.unicompat.com/1faa8 => 20.7%
    //
    // ***
    // U+26F0
    // https://emojipedia.org/mountain/
    // https://iconify.design/icon-sets/noto/mountain.html
    // https://www.unicompat.com/26F0 => 89.3%
    (name === 'mountain' && Img(iconMountain)) ||
    //
    // ***
    // U+2194
    // https://emojipedia.org/left-right-arrow/
    // https://www.unicompat.com/2194 => 95.0%
    // Couldn't manage to show colored version
    (name === 'left-right-arrow' && Unicode(0x2194)) ||
    (name === 'left-right-arrow' && React.createElement('span', { style: { fontFamily: 'reset' } }, Unicode(0x2194))) ||
    (name === 'left-right-arrow' && Unicode(0xFE0F)) ||
    (name === 'left-right-arrow' && React.createElement('span', { style: { fontFamily: 'reset' } }, Unicode(0xFE0F))) ||
    ======================== */
    // ***
    // https://www.typescriptlang.org/branding/
    (name === 'typescript' && Img(iconTypescript)) ||
    // ***
    // U+FE0F
    // https://emojipedia.org/shield/
    // https://www.unicompat.com/FE0F => 46.5%
    // https://icon-sets.iconify.design/noto/shield/
    (name === 'shield' && Img(iconShield)) ||
    // ***
    // Custom
    (name === 'road-fork' && Img(iconRoadFork, '1.4em')) ||
    // ***
    // U+270D
    // https://emojipedia.org/writing-hand/
    // https://www.unicompat.com/270D => 93.8%
    (name === 'writing-hang' && Unicode(0x270d)) ||
    // ***
    // U+1F4AB
    // https://emojipedia.org/dizzy/
    // https://www.unicompat.com/1F4AB => 94.1%
    (name === 'dizzy' && Unicode(0x1f4ab)) ||
    // ***
    // U+1F9BE
    // https://iconify.design/icon-sets/noto/mechanical-arm.html
    // https://emojipedia.org/mechanical-arm/
    // https://www.unicompat.com/1f9be => 65.5%
    (name === 'mechanical-arm' && Img(iconMechanicalArm)) ||
    // ***
    // U+1F680
    // https://www.unicompat.com/1F680 => 94.1
    (name === 'rocket' && Unicode(0x1f680)) ||
    // ***
    // U+1F527
    // https://emojipedia.org/wrench/
    // https://www.unicompat.com/1F527 => 94.1%
    (name === 'wrench' && Unicode(0x1f527)) ||
    // ***
    // U+1F9ED
    // https://iconify.design/icon-sets/noto/compass.html
    // https://www.unicompat.com/1F9ED => 67.1%
    (name === 'compass' && Img(iconCompass, '1.4em')) ||
    // ***
    // U+1F331
    // https://www.unicompat.com/1F331 => 94.1%
    (name === 'seedling' && Unicode(0x1f331)) ||
    // ***
    // U+1F4DA
    // https://www.unicompat.com/1F4DA => 94.1%
    (name === 'books' && Unicode(0x1f4da)) ||
    // ***
    // U+1F50C
    // https://www.unicompat.com/1F50C => 94.1%
    (name === 'plug' && Unicode(0x1f50c)) ||
    // ***
    // U+1F30D
    // https://www.unicompat.com/1F30D => 88.8%
    (name === 'earth' && Unicode(0x1f30d)) ||
    // ***
    // U+2699
    // https://www.unicompat.com/2699 => 94.1%
    (name === 'gear' && Unicode(0x2699)) ||
    // ***
    // U+2764
    // https://emojipedia.org/red-heart/
    // https://www.unicompat.com/2764 => 94.4%
    (name === 'red-heart' && React.createElement('span', { style: { fontFamily: 'reset' } }, Unicode(0x2764))) ||
    // U+26A1
    // https://www.unicompat.com/26A1 => 94.1%
    (name === 'high-voltage' && Unicode(0x26a1)) ||
    // U+2728
    // https://emojipedia.org/sparkles/
    // https://www.unicompat.com/2728 => 94.1%
    (name === 'sparkles' && Unicode(0x2728)) ||
    // ***
    // U+1F48E
    // https://emojipedia.org/gem-stone/
    // https://www.unicompat.com/1F48E => 94.1%
    (name === 'gem-stone' && Unicode(0x1f48e)) ||
    false

  assert(emoji, { name })

  return emoji

  function Unicode(codePoint: number) {
    const text = String.fromCodePoint(codePoint)
    if (style) {
      return React.createElement('span', { style }, text)
    } else {
      return React.createElement(React.Fragment, null, text)
    }
  }

  function Img(imgSrc: string, width: string = '1.15em') {
    const props = {
      src: imgSrc,
      style: {
        verticalAlign: 'text-top',
        fontSize: '1em',
        width,
        ...style
      }
    }
    return React.createElement('img', props)
  }
}
