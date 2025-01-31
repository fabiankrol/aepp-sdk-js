/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Browser window Post Message connector module
 *
 * This is the complement to
 * {@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection}.
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message
 * @export BrowserWindowMessageConnection
 * @example
 * import BrowserWindowMessageConnection
 * from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
 */
import stampit from '@stamp/it'
import WalletConnection from '.'
import { v4 as uuid } from '@aeternity/uuid'
import { MESSAGE_DIRECTION } from '../schema'
import { getBrowserAPI, isInIframe } from '../helpers'
import {
  AlreadyConnectedError,
  NoWalletConnectedError,
  MessageDirectionError
} from '../../errors'

/**
 * Check if connected
 * @function isConnected
 * @instance
 * @rtype () => Boolean
 * @return {Boolean} Is connected
 */
function isConnected () {
  return this.listener
}

/**
 * Connect
 * @function connect
 * @instance
 * @rtype (onMessage: Function) => void
 * @param {Function} onMessage - Message handler
 * @return {void}
 */
function connect (onMessage) {
  const origin = this.origin
  const receiveDirection = this.receiveDirection
  const debug = this.debug
  const forceOrigin = this.forceOrigin
  if (this.listener) throw new AlreadyConnectedError('You already connected')

  this.listener = (msg, source) => {
    if (!msg || typeof msg.data !== 'object') return
    if (!forceOrigin && origin && origin !== msg.origin) return
    if (debug) console.log('Receive message: ', msg)
    if (msg.data.type) {
      if (msg.data.type !== receiveDirection) return
      onMessage(msg.data.data, msg.origin, msg.source)
    } else {
      onMessage(msg.data, msg.origin, msg.source)
    }
  }
  this.subscribeFn(this.listener)
}

/**
 * Disconnect
 * @function disconnect
 * @instance
 * @rtype () => void
 * @return {void}
 */
function disconnect () {
  if (!this.listener) throw new NoWalletConnectedError('You dont have connection. Please connect before')
  this.unsubscribeFn(this.listener)
  this.listener = null
}

/**
 * Send message
 * @function sendMessage
 * @instance
 * @rtype (msg: Object) => void
 * @param {Object} msg - Message
 * @return {void}
 */
function sendMessage (msg) {
  const message = this.sendDirection ? { type: this.sendDirection, data: msg } : msg
  if (this.debug) console.log('Send message: ', message)
  this.postFn(message)
}

const getTarget = () => {
  const isExtensionContext = typeof getBrowserAPI(true).extension === 'object'
  const isWeb = window && window.location && window.location.protocol.startsWith('http')
  const isContentScript = isExtensionContext && isWeb
  if (isContentScript) return window
  // When we is the main page we need to decide the target by our self
  // Probably can be implemented some algo for checking DOM for Iframes and somehow decide which
  // Iframe to talk
  return isInIframe() ? window.parent : undefined
}

/**
 * BrowserWindowMessageConnection
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication\
 * /connection/browser-window-message
 * @rtype Stamp
 * @param {Object} [params={}] - Initializer object
 * @param {Object} [params.target=window.parent] - Target window for message
 * @param {Object} [params.self=window] - Host window for message
 * @param {Object} [params.origin] - Origin of receiver
 * @param {String} [params.sendDirection] Wrapping messages into additional struct
 * ({ type: 'to_aepp' || 'to_waellet', data })
 * Used for handling messages between content script and page
 * @param {String} [params.receiveDirection='to_aepp'] Unwrapping messages from additional struct
 * ({ type: 'to_aepp' || 'to_waellet', data })
 * Used for handling messages between content script and page
 * @param {Object} [params.connectionInfo={}] - Connection info object
 * @param {Boolean} [params.debug=false] - Debug flag
 * @return {Object}
 */
export default stampit({
  init ({
    connectionInfo = {},
    target = getTarget(),
    self = window,
    origin,
    sendDirection,
    receiveDirection = MESSAGE_DIRECTION.to_aepp,
    debug = false,
    forceOrigin = false
  } = {}) {
    if (sendDirection && !Object.keys(MESSAGE_DIRECTION).includes(sendDirection)) throw new MessageDirectionError(`sendDirection must be one of [${Object.keys(MESSAGE_DIRECTION)}]`)
    if (!Object.keys(MESSAGE_DIRECTION).includes(receiveDirection)) throw new MessageDirectionError(`receiveDirection must be one of [${Object.keys(MESSAGE_DIRECTION)}]`)
    this.connectionInfo = { id: uuid(), ...connectionInfo }

    const selfP = self
    const targetP = target
    this.origin = origin
    this.debug = debug
    this.forceOrigin = forceOrigin
    this.sendDirection = sendDirection
    this.receiveDirection = receiveDirection
    this.subscribeFn = (listener) => selfP.addEventListener('message', listener, false)
    this.unsubscribeFn = (listener) => selfP.removeEventListener('message', listener, false)
    this.postFn = (msg) => targetP.postMessage(msg, this.origin || '*')
  },
  methods: { connect, sendMessage, disconnect, isConnected }
}, WalletConnection)
