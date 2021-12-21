import React from 'react'

export { Note }

function Note(props: { icon: JSX.Element; children: JSX.Element }) {
  return (
    <blockquote style={{ paddingTop: 20, paddingBottom: 20 }}>
      {props.icon} {props.children}
    </blockquote>
  )
}
