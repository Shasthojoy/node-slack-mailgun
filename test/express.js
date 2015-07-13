require('./helper');

var express = require('express');
var bodyParser = require('body-parser');
var superagent = require('superagent');
var SlackGun = require('../index');
var crypto = require('crypto');

var app = express();

app.use('/api/mailgun', bodyParser.json(), SlackGun({
	slack: { hook: 'http://localhost:4446/' },
	mailgun: { apikey: '123' }
}));

app.listen(4448);

var app2 = express();

app2.use('/api/mailgun', bodyParser.json(), SlackGun({
	slack: { hook: 'http://localhost:4446/' }
}));

app2.listen(4447);

var slackTest = express();
slackTest.use(bodyParser.urlencoded());
var slackServer;

describe('Express', function() {

	describe('Mailgun Validation', function() {
		it('accept express POST with mailgun API key for signature validation', function(done) {
			var token = 'abc';
			var timestamp = Date.now();
			var data = [token, timestamp].join();
			var hmac = crypto.createHmac('sha256', '123').update(data);
			var signature = hmac.digest('hex');

			superagent
				.post('http://localhost:4448/api/mailgun')
				.set('Content-Type', 'application/json')
				.send({
					timestamp: timestamp,
					token: token,
					signature: signature
				})
				.end(function(err, res) {
					expect(err).to.not.exist;
					expect(res.statusCode).to.equal(200);
					done(err);
				});
		});

		it('Invalid token should error', function(done) {
			var token = 'abc';
			var timestamp = Date.now();
			var data = [token, timestamp].join();
			var hmac = crypto.createHmac('sha256', '1234').update(data);
			var signature = hmac.digest('hex');

			superagent
				.post('http://localhost:4448/api/mailgun')
				.set('Content-Type', 'application/json')
				.send({
					timestamp: timestamp,
					token: token,
					signature: signature
				})
				.end(function(err, res) {
					expect(err).to.exist;
					expect(err.status).to.equal(406);
					done();
				});
		});

		it('accept express POST without mailgun API key for signature validation', function(done) {
			var token = 'abc';
			var timestamp = Date.now();
			var data = [token, timestamp].join();
			var hmac = crypto.createHmac('sha256', '123').update(data);
			var signature = hmac.digest('hex');

			superagent
				.post('http://localhost:4447/api/mailgun')
				.send({
					timestamp: timestamp,
					token: token,
					signature: signature
				})
				.end(function(err, res) {
					done(err);
				});
		});
	});

	describe('Slack', function() {
		before(function() {
			slackServer = slackTest.listen(4446);
		});

		it('Slack should get a message', function(done) {
			slackTest.post('/', function(req, res, next) {
				res.status(200).send('ok');
				done();
			});

			var token = 'abc';
			var timestamp = Date.now();
			var data = [token, timestamp].join();
			var hmac = crypto.createHmac('sha256', '123').update(data);
			var signature = hmac.digest('hex');

			superagent
				.post('http://localhost:4448/api/mailgun')
				.set('Content-Type', 'application/json')
				.send({
					'event': 'opened',
					recipient: email,
					domain: domain,
					ip: '0.0.0.0',
					country: 'US',
					region: 'Somewhere',
					city: 'Sometown',
					useragent: 'test/me',
					timestamp: timestamp,
					token: token,
					signature: signature
				})
				.end(function(err, res) {
					expect(err).to.not.exist;
					expect(res.statusCode).to.equal(200);
				});
		});

		after(function() {
			slackServer.close();
		});
	});
});