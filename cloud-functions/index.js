var config = require('./config.js');
var debug = require('@google/cloud-debug');
debug.start();

var admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert("firebase-service-account.json"),
  databaseURL: config.firebase.databaseURL
});
var database = admin.database();

var circularJson = require('circular-json');
var twilio = require('twilio');
var bigquery = require('@google-cloud/bigquery')({
	projectId: config.projectId,
	keyFilename: 'keyfile.json'
});
var language = require('@google-cloud/language')({
	projectId: config.projectId,
	keyFilename: 'keyfile.json'
});

exports.smsNL = function (req, res) {
	console.log('smsNL-Visualizer');
	var fromNumber = req.query.From;
	var text = req.query.Body;
	var fromCountry = req.query.FromCountry;
	var fromCity = req.query.FromCity;
	let twilioNumber = req.query.To || config.twilio.phoneNumber;
	let bqTableName = req.query.bq || config.defaultBqTableName;

	console.log(`smsNL: "${text}" sent from ${fromNumber}, ${fromCountry},${fromCity}, saving to ${bqTableName}`);
	language.annotate(text, { verbose: true }, function (err, annotation, apiResponse) {
		if (err) {
			console.error(err);
			res.status(500).send('NL error: ' + err);
			return;
		}
		let emoji = "😄";
		let sentimentScore = annotation.sentiment.polarity;
		if (sentimentScore < 50 && sentimentScore > -50) {
			emoji = "😐";
		} else if (sentimentScore <= -50) {
			emoji = "😔";
		}
		console.log(`${text} - ${emoji} - ${sentimentScore}`);

		// Write to Firebase.
		console.log('Writing to Firebase...');
		database.ref('sms').push({
			emoji: emoji
		});
		
		// Log to BigQuery.
		let row = {
			message_text: text,
			tokens: JSON.stringify(annotation.tokens),
			polarity: (annotation.sentiment.polarity).toString(),
			magnitude: (annotation.sentiment.magnitude).toString(),
			from_city: fromCity,
			from_country: fromCountry
		};
		let bigQueryDataset = bigquery.dataset(config.bqDatasetName);
		let bigQueryTable = bigQueryDataset.table(bqTableName);
		bigQueryTable.insert(row, function (error, insertErr, apiResp) {
			console.log('Writing to BigQuery...');
			// console.log(apiResp.insertErrors[0]);
			if (error) {
				console.log('err', error);
				res.status(500).send('BigQuery error');
				return;
			} else if (insertErr.length === 0) {
				let bqStatusMsg = `Written to BQ: ${text} - (${sentimentScore})`;
				console.log(bqStatusMsg);
				var client = new twilio.RestClient(config.twilio.accountSid, config.twilio.authToken);
				// Send a message back.
				client.messages.create({
					body: `Based on your message, you seem ${emoji}`,
					to: fromNumber,  // Text this number
					from: twilioNumber // From a valid Twilio number
				}, function (err, message) {
					if (err) {
						console.error(err.message);
						res.status(500).send('Twilio response error.');
						return;
					} else {
						res.status(200).send(bqStatusMsg);
						return;
					}
				});
			}
		});
	});
};
