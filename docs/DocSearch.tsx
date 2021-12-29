import React from 'react'

export enum DocSearchId {
  DESKTOP = 'docsearch',
  MOBILE = 'docsearch-mobile',
}
export { DocSearch }

function DocSearch({ id, style }: { id: DocSearchId, style?: Object }) {
  return (
    <div id={id} style={style} />
  )
}
