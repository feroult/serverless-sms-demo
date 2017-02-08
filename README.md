# Serverless SMS/MMS demo

This is not an official Google product.

This is a cobbled-together demo app.

Text a given phone number and get a Natural Language sentiment
analysis on your text. By which we mean a 😄 or 😔 emoji. 

An end-to-end serverless app using Google Cloud Functions,
Firebase, BigQuery and Twilio.

## Prerequisites
- A Google Cloud Platform account
- A Firebase account

## Installation
### Google Cloud Functions
1. ```$ cd cloud-functions```
1. Copy ```config.js.template``` to ```config.js``` and populate fields.
1. Download a service account from the Firebase Console and save it
as ```firebase-service-account.json```.
1. Download a Google Cloud Platform service account and save it as ```keyfile.json```.
1. (Optional) Install dependencies

   ```$ npm install```
#### Deploy the Cloud Function
```$gcloud alpha functions deploy smsNL --stage-bucket <bucket> --trigger-http```

### Firebase
- In the ```public/``` directory run ```$ firebase serve``` to
show the visualizer locally, or ```$ firebase deploy``` to publish
to the internet.

### Configure Twilio
- Set your Twilio number to do a GET request on message receive to
the URL of your Cloud Function. Set the optional ```bq``` querystring
parameter to specify your destination BigQuery table. E.g. ```https://us-central1-my-functions-proj.cloudfunctions.net/smsNL?bq=nl_demo```

### Create BigQuery table
Create your table with the following schema, and make sure it has the same
name as in ```config.js```:
- message_text	STRING	NULLABLE	
- tokens	STRING	NULLABLE	
- polarity	STRING	NULLABLE	
- magnitude	STRING	NULLABLE	
- from_city	STRING	NULLABLE	
- from_country	STRING	NULLABLE	
- timestamp	INTEGER	NULLABLE	
  
Direct any questions to [@bretmcg](https://www.twitter.com/@bretmcg).