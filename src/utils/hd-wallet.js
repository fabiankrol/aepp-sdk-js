import nacl from 'tweetnacl'
import { full as hmac } from 'tweetnacl-auth'
import { fromString } from 'bip32-path'
import { decryptKey, encryptKey } from './crypto'
import { encode } from '../tx/builder/helpers'
import {
  InvalidDerivationPathError, NotHardenedSegmentError, UnsupportedChildIndexError
} from './errors'

const ED25519_CURVE = Buffer.from('ed25519 seed')
const HARDENED_OFFSET = 0x80000000

const toHex = (buffer) => Buffer.from(buffer).toString('hex')

export function derivePathFromKey (path, key) {
  const segments = path === '' ? [] : fromString(path).toPathArray()
  segments.forEach((segment, i) => {
    if (segment < HARDENED_OFFSET) {
      throw new NotHardenedSegmentError(`Segment #${i + 1} is not hardened`)
    }
  })

  return segments.reduce((parentKey, segment) => deriveChild(parentKey, segment), key)
}

export function derivePathFromSeed (path, seed) {
  if (!['m', 'm/'].includes(path.slice(0, 2))) {
    throw new InvalidDerivationPathError()
  }
  const masterKey = getMasterKeyFromSeed(seed)
  return derivePathFromKey(path.slice(2), masterKey)
}

function formatAccount (keys) {
  const { secretKey, publicKey } = keys
  return {
    secretKey: toHex(secretKey),
    publicKey: encode(publicKey, 'ak')
  }
}

export function getKeyPair (secretKey) {
  return nacl.sign.keyPair.fromSeed(secretKey)
}

export function getMasterKeyFromSeed (seed) {
  const I = hmac(seed, ED25519_CURVE)
  const IL = I.slice(0, 32)
  const IR = I.slice(32)
  return {
    secretKey: IL,
    chainCode: IR
  }
}

export function deriveChild ({ secretKey, chainCode }, index) {
  if (index < HARDENED_OFFSET) {
    throw new UnsupportedChildIndexError(index)
  }
  const indexBuffer = Buffer.allocUnsafe(4)
  indexBuffer.writeUInt32BE(index, 0)

  const data = Buffer.concat([Buffer.alloc(1, 0), Buffer.from(secretKey), Buffer.from(indexBuffer)])

  const I = hmac(data, chainCode)
  const IL = I.slice(0, 32)
  const IR = I.slice(32)
  return {
    secretKey: IL,
    chainCode: IR
  }
}

export function generateSaveHDWalletFromSeed (seed, password) {
  const walletKey = derivePathFromSeed('m/44h/457h', seed)
  return {
    secretKey: toHex(encryptKey(password, walletKey.secretKey)),
    chainCode: toHex(encryptKey(password, walletKey.chainCode))
  }
}

export function getSaveHDWalletAccounts (saveHDWallet, password, accountCount) {
  const walletKey = {
    secretKey: decryptKey(password, Buffer.from(saveHDWallet.secretKey, 'hex')),
    chainCode: decryptKey(password, Buffer.from(saveHDWallet.chainCode, 'hex'))
  }
  return (new Array(accountCount)).fill()
    .map((_, idx) =>
      formatAccount(getKeyPair(derivePathFromKey(`${idx}h/0h/0h`, walletKey).secretKey)))
}

export const getHdWalletAccountFromSeed = (seed, accountIdx) => {
  const walletKey = derivePathFromSeed('m/44h/457h', seed)
  const derived = derivePathFromKey(`${accountIdx}h/0h/0h`, walletKey)
  const keyPair = getKeyPair(derived.secretKey)
  return {
    ...formatAccount(keyPair),
    idx: accountIdx
  }
}
