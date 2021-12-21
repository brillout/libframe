import React from 'react'

export { Note }

function Note(props: { icon: JSX.Element; children: JSX.Element }) {
  return (
    <blockquote>
      <div style={{ marginBottom: 20 }} />
      {props.icon} {props.children}
      <div style={{ marginTop: 20 }} />
    </blockquote>
  )
}
