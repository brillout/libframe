import { assert } from './utils'

export { getLogoUrl, setLogoUrl }

let _logoUrl: string

function getLogoUrl() {
  assert(_logoUrl)
  return _logoUrl
}
function setLogoUrl(logoUrl: string) {
  _logoUrl = logoUrl
}
