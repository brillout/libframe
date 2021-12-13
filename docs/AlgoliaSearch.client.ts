document.body.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'k' && event.ctrlKey) {
    event.preventDefault()
    document.getElementById('search')?.focus()
  }
})
