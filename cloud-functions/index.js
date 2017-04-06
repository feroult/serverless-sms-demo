var config = require('./config.js');
var debug = require('@google/cloud-debug');
debug.start();

var admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.cert("firebase-service-account.json"),
    databaseURL: config.firebase.databaseURL
});
var database = admin.database();

var bigquery = require('@google-cloud/bigquery')({
    projectId: config.projectId,
    keyFilename: 'keyfile.json'
});

var language = require('@google-cloud/language')({
    projectId: config.projectId,
    keyFilename: 'keyfile.json'
});

var translate = require('@google-cloud/translate')({
    projectId: config.projectId,
    keyFilename: 'keyfile.json'
});

var https = require('https');

function sendResponse({from, to, text}, callback) {
    var data = JSON.stringify({
        api_key: config.nexmo.apiKey,
        api_secret: config.nexmo.secret,
        to: to,
        from: from,
        text: text
    });

    var options = {
        host: 'rest.nexmo.com',
        path: '/sms/json',
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };
    var req = https.request(options);
    req.write(data);
    req.end();

    var responseData = '';
    req.on('response', function (res) {
        res.on('data', function (chunk) {
            responseData += chunk;
        });
        res.on('end', function () {
            callback(JSON.parse(responseData));
        });
    });
}

exports.smsNL = function (req, res) {
    console.log('smsNL-Visualizer', JSON.stringify(req.body), JSON.stringify(req.query));

    var fromNumber = req.query.msisdn;
    var text = req.query.text || 'normal';
    let toNumber = req.query.to;
    let bqTableName = req.query.bq || config.defaultBqTableName;

    console.log(`smsNL: "${text}" sent from ${fromNumber}, saving to ${bqTableName}`);

    translate.translate(text, {from: 'pt-BR', to: 'en'}).then((results) => {
        const translation = results[0];

        console.log(`Text: ${text}`);
        console.log(`Translation: ${translation}`);

        language.annotate(translation, {verbose: true}, function (err, annotation) {
            if (err) {
                console.error(err);
                res.status(500).send('NL error: ' + err);
                return;
            }

            let emoji = "😄";
            let feeling = ':D';
            let sentimentScore = annotation.sentiment.score;
            var THRESHOLD = 0.25;

            if (sentimentScore < THRESHOLD && sentimentScore > -THRESHOLD) {
                emoji = "😐";
                feeling = ':-|';
            } else if (sentimentScore <= -THRESHOLD) {
                emoji = "😔";
                feeling = ':('
            }

            console.log(`${text} - ${emoji} - ${sentimentScore}`);

            // Write to Firebase.
            console.log('Writing to Firebase...');
            database.ref('sms').push({
                emoji: emoji,
                text: text
            });

            // Log to BigQuery.
            let row = {
                text: text,
                emoji: emoji,
                sentimentScore: sentimentScore,
                createdAt: new Date().getTime() * 1000,
                tokens: JSON.stringify(annotation.tokens)
            };
            let bigQueryDataset = bigquery.dataset(config.bqDatasetName);
            let bigQueryTable = bigQueryDataset.table(bqTableName);

            bigQueryTable.insert(row, function (error) {

                console.log('Writing to BigQuery...', error);

                if (error) {
                    console.log('err', error);
                    res.status(500).send('BigQuery error');
                    return;
                } else {
                    let bqStatusMsg = `Written to BQ: ${text} - (${sentimentScore})`;
                    console.log(bqStatusMsg);

                    if (fromNumber !== 'twitter') {
                        sendResponse({
                            text: `Based on your message, you seem ${feeling}`,
                            to: fromNumber,
                            from: toNumber
                        }, function (result) {
                            console.log('result', result);
                            res.status(200).send(bqStatusMsg);
                            return;
                        });
                    } else {
                        res.status(200).send(bqStatusMsg);
                    }
                }

            });
        });
    });

};
