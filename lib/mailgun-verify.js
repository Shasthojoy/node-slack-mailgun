
/*!
 * mailgun-verify
 * Copyright(c) 2015 Slick Labs, LLC
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var crypto = require('crypto');

/**
 * Module exports.
 */

module.exports = verifyMailgun;

/**
 * Verify mailgun HMAC authentication token
 */

function verifyMailgun(apikey, token, timestamp, signature) {
	var data = timestamp + token;
	var hmac = crypto.createHmac('sha256', apikey).update(data);
	var ourSig = hmac.digest('hex');

	var output = {
		apikey: apikey,
		token: token,
		timestamp: timestamp,
		signature: signature,
		generatedSignature: ourSig,
		valid: ourSig === signature
	};

	return output;
};

/**
 * TODO - Reply attack cache check
 */

function replayAttackCache() {
	this.tokens = [];
};
