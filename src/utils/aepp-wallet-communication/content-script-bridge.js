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
 * Content Script Bridge module
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge
 * @export ContentScriptBridge
 * @example
 * import ContentScriptBridge
 * from '@aeternity/aepp-sdk/es/utils/wallet-communication/content-script-bridge
 */
import stampit from '@stamp/it'
import { UnsupportedPlatformError, MissingParamError } from '../errors'

/**
 * Start message proxy
 * @function run
 * @instance
 * @return {void}
 */
function run () {
  const allowCrossOrigin = this.allowCrossOrigin
  // Connect to extension using runtime
  this.extConnection.connect((msg) => {
    this.pageConnection.sendMessage(msg)
  })
  // Connect to page using window.postMessage
  this.pageConnection.connect((msg, origin, source) => {
    if (!allowCrossOrigin && source !== window) return
    this.extConnection.sendMessage(msg)
  })
}

/**
 * Stop message proxy
 * @function stop
 * @instance
 * @return {void}
 */
function stop () {
  this.extConnection.disconnect()
  this.pageConnection.disconnect()
}

/**
 * ContentScriptBridge stamp
 * Provide functionality to easly redirect messages from page to extension and from extension to
 * page through content script
 * Using Runtime(Extension) and WindowPostMessage(Web-Page) connections
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge
 * @rtype Stamp
 * @param {Object} params - Initializer object
 * @param {Object} params.pageConnection - Page connection object
 * (@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/
 * browser-window-message)
 * @param {Object} params.extConnection - Extension connection object
 * (@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime)
 * @return {Object}
 */
export default stampit({
  init ({ pageConnection, extConnection, allowCrossOrigin = false }) {
    if (!window) throw new UnsupportedPlatformError('Window object not found, you can run bridge only in browser')
    if (!pageConnection) throw new MissingParamError('pageConnection required')
    if (!extConnection) throw new MissingParamError('extConnection required')
    this.allowCrossOrigin = allowCrossOrigin
    this.pageConnection = pageConnection
    this.extConnection = extConnection
  },
  methods: { run, stop }
})
