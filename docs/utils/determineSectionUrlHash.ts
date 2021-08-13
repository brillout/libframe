export { determineSectionUrlHash }

function determineSectionUrlHash(title: string): string {
  return title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-')
}
