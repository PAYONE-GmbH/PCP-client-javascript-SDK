const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');

// Middleware to parse JSON bodies
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get(
  '/.well-known/apple-developer-merchantid-domain-association.txt',
  (req, res) => {
    res.sendFile(
      __dirname +
        '/.well-known/apple-developer-merchantid-domain-association.txt',
    );
  },
);

// Paths to merchant identity certificate and private key
const certificate = fs.readFileSync(
  path.join(__dirname, 'certificates', 'PayOneApplePay.crt.pem'),
  'utf8',
);
const privateKey = fs.readFileSync(
  path.join(__dirname, 'certificates', 'PayOneApplePay.key.pem'),
  'utf8',
);

// Validate merchant
app.post('/validate-merchant', (req, res) => {
  const validationURL = req.body.validationURL;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    key: privateKey,
    cert: certificate,
    body: JSON.stringify({
      merchantIdentifier: 'merchant.de.nanogiants.payonedemo',
      domainName: 'www.payone-apple-pay-demo-server.nanogiants-services.de',
      displayName: 'PayOne Apple Pay Demo Server',
    }),
  };

  const validationRequest = https.request(
    validationURL,
    options,
    (validationResponse) => {
      let data = '';
      validationResponse.on('data', (chunk) => {
        data += chunk;
      });

      validationResponse.on('end', () => {
        res.status(200).send(data);
      });
    },
  );

  validationRequest.on('error', (error) => {
    res.status(500).send({ error: error.message });
  });

  validationRequest.end();
});

// Handle Apple Pay payment token
app.post('/process-payment', async (req, res) => {
  const token = req.body.token;
  const billingContact = req.body.billingContact;
  const shippingContact = req.body.shippingContact;

  // TODO: Process the payment with Payone

  res.status(200).send({ success: true });
});

app.listen(80, () => {
  console.log('Express listening on port 80');
});
