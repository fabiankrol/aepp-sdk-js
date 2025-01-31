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
 * Universal module
 * @module @aeternity/aepp-sdk/es/ae/universal
 * @export Universal
 * @example import { Universal } from '@aeternity/aepp-sdk'
 */

import Ae from './'
import Chain from '../chain/node'
import Aens from './aens'
import Transaction from '../tx/tx'
import Oracle from './oracle'
import GeneralizedAccount from '../contract/ga'
import AccountMultiple from '../account/multiple'
import Contract from './contract'

/**
 * Universal Stamp
 *
 * Universal provides Ae base functionality with Contract and Aens
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/universal
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Universal instance
 */
export default Ae.compose(
  AccountMultiple, Chain, Transaction, Aens, Contract, Oracle, GeneralizedAccount
)
