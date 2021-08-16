import { getNpmName } from './helpers/locations'
import { unlink } from './unlink'
unlink(getNpmName())
